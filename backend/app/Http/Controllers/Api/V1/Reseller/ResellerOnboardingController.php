<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResellerOnboardingController extends Controller
{
    /**
     * Get current reseller onboarding status & checklist.
     */
    public function show(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No reseller organization found.'], 404);
        }

        $checklist = [
            'business_profile' => !empty($org->name) && !empty($org->gstin) && !empty($org->address),
            'kyc_documents' => !empty($org->kyc_documents),
            'terms_accepted' => !empty($org->terms_accepted_at),
            'submitted' => in_array($org->onboarding_status, ['submitted', 'under_review', 'approved']),
            'approved' => $org->onboarding_status === 'approved',
        ];

        return response()->json([
            'data' => [
                'organization' => $org,
                'onboarding_status' => $org->onboarding_status,
                'rejection_reason' => $org->rejection_reason,
                'checklist' => $checklist,
                'pricing_tier' => $org->pricing_tier,
                'credit_limit' => (float) $org->credit_limit,
                'wallet_enabled' => (bool) $org->wallet_enabled,
                'white_label_enabled' => (bool) $org->white_label_enabled,
            ]
        ]);
    }

    /**
     * Update reseller business profile & KYC fields.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No reseller organization found.'], 404);
        }

        $request->validate([
            'brand_name' => ['nullable', 'string', 'max:255'],
            'gstin' => ['nullable', 'string', 'max:15'],
            'pan' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'pincode' => ['nullable', 'string'],
            'support_email' => ['nullable', 'email'],
            'support_phone' => ['nullable', 'string'],
        ]);

        $org->update($request->only([
            'brand_name', 'gstin', 'pan', 'address', 'city', 'state', 'pincode', 'support_email', 'support_phone'
        ]));

        return response()->json([
            'message' => 'Business profile updated successfully.',
            'data' => $org,
        ]);
    }

    /**
     * Submit KYC document file references.
     */
    public function submitKyc(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No reseller organization found.'], 404);
        }

        $request->validate([
            'pan_card_url' => ['nullable', 'string'],
            'gstin_certificate_url' => ['nullable', 'string'],
            'bank_proof_url' => ['nullable', 'string'],
            'business_license_url' => ['nullable', 'string'],
        ]);

        $kyc = array_merge((array) $org->kyc_documents, array_filter($request->only([
            'pan_card_url', 'gstin_certificate_url', 'bank_proof_url', 'business_license_url'
        ])));

        $org->update(['kyc_documents' => $kyc]);

        return response()->json([
            'message' => 'KYC documents updated.',
            'data' => $org,
        ]);
    }

    /**
     * Accept Terms & Conditions.
     */
    public function acceptTerms(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No reseller organization found.'], 404);
        }

        $org->update([
            'terms_accepted_at' => now(),
            'terms_accepted_ip' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Reseller terms accepted.',
            'data' => $org,
        ]);
    }

    /**
     * Submit application for Super Admin review.
     */
    public function submit(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No reseller organization found.'], 404);
        }

        $org->update([
            'onboarding_status' => 'under_review',
            'status' => 'pending',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Reseller onboarding application submitted for admin review.',
            'data' => $org,
        ]);
    }
}
