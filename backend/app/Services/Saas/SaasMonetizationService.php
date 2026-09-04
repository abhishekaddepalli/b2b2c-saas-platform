<?php

namespace App\Services\Saas;

use App\Models\Organization;
use App\Models\OrganizationSaasSubscription;
use App\Models\SaasPlan;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SaasMonetizationService
{
    /**
     * Subscribe or Upgrade/Downgrade an organization to a SaaS plan.
     */
    public function subscribeOrganization(Organization $org, SaasPlan $plan, string $billingInterval = 'monthly'): OrganizationSaasSubscription
    {
        return DB::transaction(function () use ($org, $plan, $billingInterval) {
            $existingSub = OrganizationSaasSubscription::where('organization_id', $org->id)->first();

            $pricePaid = $billingInterval === 'yearly' ? $plan->yearly_price : $plan->monthly_price;
            $durationMonths = $billingInterval === 'yearly' ? 12 : 1;

            $now = now();
            $periodEnd = $now->copy()->addMonths($durationMonths);

            if ($existingSub) {
                $existingSub->update([
                    'saas_plan_id' => $plan->id,
                    'billing_interval' => $billingInterval,
                    'status' => 'active',
                    'current_period_start' => $now,
                    'current_period_end' => $periodEnd,
                    'next_billing_at' => $periodEnd,
                    'grace_period_ends_at' => null,
                    'price_paid' => $pricePaid,
                    'currency' => $plan->currency,
                ]);

                $org->update([
                    'white_label_enabled' => $plan->white_label_available,
                    'custom_domain_enabled' => $plan->white_label_available,
                ]);

                return $existingSub->fresh(['plan']);
            }

            // New subscription — evaluate trial
            $status = $plan->trial_days > 0 ? 'trialing' : 'active';
            $trialEnd = $plan->trial_days > 0 ? $now->copy()->addDays($plan->trial_days) : null;

            $sub = OrganizationSaasSubscription::create([
                'organization_id' => $org->id,
                'saas_plan_id' => $plan->id,
                'billing_interval' => $billingInterval,
                'status' => $status,
                'trial_ends_at' => $trialEnd,
                'current_period_start' => $now,
                'current_period_end' => $periodEnd,
                'next_billing_at' => $trialEnd ?? $periodEnd,
                'price_paid' => $pricePaid,
                'currency' => $plan->currency,
            ]);

            // Auto-credit reseller wallet with the plan amount + promotional offer bonus
            try {
                $walletService = app(\App\Services\Wallet\WalletService::class);
                $offer = \App\Models\Offer::where('status', 'active')
                    ->where(fn($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                    ->where(fn($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                    ->whereIn('audience', ['all', 'reseller'])
                    ->orderByDesc('priority')
                    ->first();

                $baseCredit = $pricePaid > 0 ? (float) $pricePaid : (float) ($plan->monthly_price ?: 1499);
                $bonusAmount = 0;
                $offerNote = '';

                if ($offer) {
                    if ($offer->type === 'percentage') {
                        $bonusAmount = round($baseCredit * ((float) $offer->discount_value / 100), 2);
                        if ($offer->max_discount_amount && $bonusAmount > (float) $offer->max_discount_amount) {
                            $bonusAmount = (float) $offer->max_discount_amount;
                        }
                        $offerNote = " (Includes {$offer->discount_value}% promotional bonus: {$offer->name})";
                    } elseif ($offer->type === 'fixed') {
                        $bonusAmount = (float) $offer->discount_value;
                        $offerNote = " (Includes ₹{$bonusAmount} bonus credit: {$offer->name})";
                    }
                }

                $totalCredit = $baseCredit + $bonusAmount;
                if ($totalCredit > 0) {
                    $walletService->credit(
                        $org,
                        $totalCredit,
                        'saas-plan-wallet-' . $org->id . '-' . $plan->id . '-' . time(),
                        "SaaS Plan working capital allocation for {$plan->name}{$offerNote}"
                    );
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Plan wallet crediting notice: ' . $e->getMessage());
            }

            return $sub->load('plan');
        });
    }

    /**
     * Cancel SaaS plan subscription for organization.
     */
    public function cancelSubscription(Organization $org, string $reason = 'User requested cancellation'): OrganizationSaasSubscription
    {
        $sub = OrganizationSaasSubscription::where('organization_id', $org->id)->firstOrFail();

        $sub->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        return $sub;
    }

    /**
     * Enforce customer creation quota server-side.
     */
    public function checkCustomerQuota(Organization $org): void
    {
        $sub = OrganizationSaasSubscription::where('organization_id', $org->id)->with('plan')->first();
        $plan = $sub?->plan;

        if (!$plan || $plan->customer_limit === -1) {
            return;
        }

        $currentCustomerCount = $org->users()->wherePivot('role_within_org', 'customer')->count();

        if ($currentCustomerCount >= $plan->customer_limit) {
            throw new InvalidArgumentException(
                "Customer quota exceeded for current {$plan->name} plan. Limit: {$plan->customer_limit}. Please upgrade your SaaS subscription."
            );
        }
    }

    /**
     * Enforce reseller sub-account creation quota server-side.
     */
    public function checkResellerQuota(Organization $org): void
    {
        $sub = OrganizationSaasSubscription::where('organization_id', $org->id)->with('plan')->first();
        $plan = $sub?->plan;

        if (!$plan || $plan->reseller_limit === -1) {
            return;
        }

        $currentResellerCount = Organization::where('parent_id', $org->id)->count();

        if ($currentResellerCount >= $plan->reseller_limit) {
            throw new InvalidArgumentException(
                "Reseller limit reached for {$plan->name} plan. Limit: {$plan->reseller_limit}. Upgrade to Business or Enterprise plan."
            );
        }
    }

    /**
     * Enforce white-label features access server-side.
     */
    public function checkWhiteLabelQuota(Organization $org): void
    {
        $sub = OrganizationSaasSubscription::where('organization_id', $org->id)->with('plan')->first();
        $plan = $sub?->plan;

        if ($plan && !$plan->white_label_available) {
            throw new InvalidArgumentException(
                "White-label branding is not available on {$plan->name} plan. Please upgrade to Business Pro or Enterprise."
            );
        }
    }
}
