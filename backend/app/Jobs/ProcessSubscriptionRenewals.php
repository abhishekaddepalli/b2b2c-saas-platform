<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\Subscription\SubscriptionRenewalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessSubscriptionRenewals implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    public function handle(SubscriptionRenewalService $renewalService): void
    {
        Log::info('ProcessSubscriptionRenewals: starting');

        // Find all active subscriptions due for renewal (next_billing_at <= now)
        $due = Subscription::withoutTenantScope()
            ->where('status', 'active')
            ->where('next_billing_at', '<=', now())
            ->where('auto_renew', true)
            ->with(['customer', 'servicePlan', 'servicePlan.service'])
            ->cursor(); // cursor to avoid loading all into memory

        $processed = 0;
        $failed = 0;

        foreach ($due as $subscription) {
            try {
                $renewalService->renew($subscription);
                $processed++;
            } catch (\Throwable $e) {
                Log::error("Renewal failed for subscription {$subscription->id}", [
                    'error' => $e->getMessage(),
                ]);
                $renewalService->handleRenewalFailure($subscription, $e->getMessage());
                $failed++;
            }
        }

        // Also send reminders for upcoming renewals
        $this->sendReminders($renewalService);

        Log::info("ProcessSubscriptionRenewals done: processed={$processed}, failed={$failed}");
    }

    private function sendReminders(SubscriptionRenewalService $renewalService): void
    {
        $reminderDays = [7, 3, 1];

        foreach ($reminderDays as $days) {
            $subscriptions = Subscription::withoutTenantScope()
                ->where('status', 'active')
                ->whereBetween('next_billing_at', [
                    now()->addDays($days)->startOfDay(),
                    now()->addDays($days)->endOfDay(),
                ])
                ->with('customer')
                ->cursor();

            foreach ($subscriptions as $subscription) {
                try {
                    $renewalService->sendReminder($subscription, $days);
                } catch (\Throwable $e) {
                    Log::warning("Reminder failed for subscription {$subscription->id}: " . $e->getMessage());
                }
            }
        }
    }
}
