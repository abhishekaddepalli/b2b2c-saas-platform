<?php

namespace App\Services\Subscription;

use App\Models\Subscription;
use App\Services\Wallet\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubscriptionRenewalService
{
    public function __construct(private readonly WalletService $walletService) {}

    /**
     * Process due renewals, trials, and grace periods.
     */
    public function processRenewals(): array
    {
        // 1. Process ending trials
        $trialSubscriptions = Subscription::where('status', 'trial')
            ->where('trial_ends_at', '<=', now())
            ->get();

        foreach ($trialSubscriptions as $sub) {
            try {
                $this->renewSubscription($sub);
            } catch (\Throwable $e) {
                // Log failure, status will be handled in handleFailedPayment
            }
        }

        // 2. Process due active & grace_period subscriptions
        $dueSubscriptions = Subscription::whereIn('status', ['active', 'grace_period'])
            ->where('current_period_end', '<=', now())
            ->get();

        $renewed = 0;
        $failed = 0;

        foreach ($dueSubscriptions as $sub) {
            try {
                $this->renewSubscription($sub);
                $renewed++;
            } catch (\Throwable $e) {
                $failed++;
            }
        }

        return [
            'trials_processed' => count($trialSubscriptions),
            'due_processed' => count($dueSubscriptions),
            'renewed' => $renewed,
            'failed' => $failed,
        ];
    }

    /**
     * Renew a single subscription (handles wallet debit, interval extension, trial transition).
     */
    public function renewSubscription(Subscription $sub): void
    {
        DB::transaction(function () use ($sub) {
            $org = $sub->organization;
            $amount = (float) ($sub->reseller_price_snapshot ?? $sub->amount ?? 0);
            $key = 'sub-renew-' . $sub->id . '-' . now()->format('Y-m-d');

            if ($org && $amount > 0) {
                $balance = $this->walletService->getBalance($org);
                if ($balance->spendable() < $amount) {
                    $this->handleFailedPayment($sub);
                    return;
                }

                $this->walletService->debit(
                    $org,
                    $amount,
                    $key,
                    "Subscription renewal for {$sub->id} ({$sub->billing_interval})"
                );
            }

            // Calculate interval duration
            $newPeriodStart = now();
            $newPeriodEnd = match ($sub->billing_interval) {
                'yearly' => now()->addYear(),
                'quarterly' => now()->addMonths(3),
                'custom' => now()->addDays($sub->billing_interval_count ?: 30),
                default => now()->addMonth(), // monthly
            };

            $sub->update([
                'status' => 'active',
                'retry_count' => 0,
                'next_retry_at' => null,
                'activated_at' => $sub->activated_at ?? now(),
                'current_period_start' => $newPeriodStart,
                'current_period_end' => $newPeriodEnd,
                'next_billing_at' => $newPeriodEnd,
            ]);
        });
    }

    /**
     * Handle payment failure, grace period state machine, and suspension.
     */
    public function handleFailedPayment(Subscription $sub): void
    {
        $currentRetries = ($sub->retry_count ?? 0) + 1;
        $maxRetries = $sub->max_retry_count ?? 3;
        $graceDays = $sub->grace_period_days ?? 3;

        $gracePeriodEnded = $sub->current_period_end
            ? $sub->current_period_end->copy()->addDays($graceDays)->isPast()
            : true;

        if ($currentRetries >= $maxRetries || $gracePeriodEnded) {
            $sub->update([
                'status' => 'suspended',
                'retry_count' => $currentRetries,
                'suspended_at' => now(),
            ]);
        } else {
            $sub->update([
                'status' => 'grace_period',
                'retry_count' => $currentRetries,
                'next_retry_at' => now()->addDay(),
            ]);
        }
    }

    /**
     * Cancel a subscription.
     */
    public function cancelSubscription(Subscription $sub, string $reason = 'Cancelled by user'): void
    {
        $sub->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'ended_at' => now(),
            'cancellation_reason' => $reason,
            'auto_renew' => false,
        ]);
    }

    /**
     * Send automatic renewal reminders (7 days, 3 days, 1 day, renewal day).
     */
    public function sendRenewalReminders(): array
    {
        $remindersSent = 0;
        $reminderDays = [7, 3, 1, 0];

        foreach ($reminderDays as $days) {
            $targetDate = $days === 0 ? now()->toDateString() : now()->addDays($days)->toDateString();

            $subs = Subscription::whereIn('status', ['active', 'trial'])
                ->whereDate('current_period_end', $targetDate)
                ->get();

            foreach ($subs as $sub) {
                $daysText = $days === 0 ? 'today' : "in {$days} day(s)";
                $message = "Your subscription for {$sub->servicePlan?->name} is due for renewal {$daysText}.";

                // Create notification record for customer
                if ($sub->customer_id) {
                    DB::table('notifications')->insert([
                        'id' => (string) Str::uuid(),
                        'type' => 'App\\Notifications\\SubscriptionRenewalReminder',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $sub->customer_id,
                        'data' => json_encode(['subscription_id' => $sub->id, 'message' => $message, 'days' => $days]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $remindersSent++;
                }
            }
        }

        return ['reminders_sent' => $remindersSent];
    }
}
