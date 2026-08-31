<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\ApiUsageLog;
use App\Models\OrganizationWebhookSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiKeyController extends Controller
{
    private function resolveOrgId(Request $request): string
    {
        $user = $request->user();
        return $user->organization_id ?? $user->current_organization_id ?? $user->organizations()->first()?->id ?? '';
    }

    /**
     * List active API Keys for organization.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = $this->resolveOrgId($request);
        $keys = ApiKey::where('organization_id', $orgId)->latest()->get();

        return response()->json(['data' => $keys]);
    }

    /**
     * Generate new API Key.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'permissions' => ['required', 'array'],
        ]);

        $orgId = $this->resolveOrgId($request);
        $keySecret = 'sk_live_' . Str::random(32);

        $apiKey = ApiKey::create([
            'organization_id' => $orgId,
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'key' => 'ak_' . Str::random(16),
            'secret' => password_hash($keySecret, PASSWORD_BCRYPT),
            'permissions' => $request->permissions,
            'rate_limit_per_minute' => 120,
            'is_active' => true,
        ]);

        $data = $apiKey->toArray();
        $data['raw_secret_key'] = $keySecret; // Returned ONCE on generation

        return response()->json([
            'message' => 'API Key generated successfully. Save secret key securely.',
            'data' => $data,
        ], 201);
    }

    /**
     * Revoke API key.
     */
    public function revoke(Request $request, string $id): JsonResponse
    {
        $orgId = $this->resolveOrgId($request);
        $key = ApiKey::where('organization_id', $orgId)->where('id', $id)->firstOrFail();
        $key->update(['is_active' => false]);

        return response()->json(['message' => 'API Key revoked successfully.']);
    }

    /**
     * List Webhook Subscriptions.
     */
    public function webhooks(Request $request): JsonResponse
    {
        $orgId = $this->resolveOrgId($request);
        $webhooks = OrganizationWebhookSubscription::where('organization_id', $orgId)->latest()->get();

        return response()->json(['data' => $webhooks]);
    }

    /**
     * Create Webhook Subscription.
     */
    public function storeWebhook(Request $request): JsonResponse
    {
        $request->validate([
            'target_url' => ['required', 'url', 'max:255'],
            'events' => ['required', 'array'],
        ]);

        $orgId = $this->resolveOrgId($request);

        $webhook = OrganizationWebhookSubscription::create([
            'organization_id' => $orgId,
            'target_url' => $request->target_url,
            'secret' => 'whsec_' . Str::random(24),
            'events' => $request->events,
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Webhook subscription registered.', 'data' => $webhook], 201);
    }

    /**
     * API Usage Statistics.
     */
    public function usageLogs(Request $request): JsonResponse
    {
        $orgId = $this->resolveOrgId($request);
        $logs = ApiUsageLog::where('organization_id', $orgId)->latest('created_at')->paginate($request->per_page ?? 20);

        return response()->json($logs);
    }
}
