<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Wallet;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $walletService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(Wallet::with('organization')->paginate($request->per_page ?? 20));
    }

    public function show(string $orgId): JsonResponse
    {
        $org = Organization::findOrFail($orgId);
        $wallet = Wallet::where('organization_id', $orgId)->firstOrFail();
        return response()->json(['data' => $wallet]);
    }

    public function adjust(Request $request, string $orgId): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:credit,debit'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string'],
        ]);

        $org = Organization::findOrFail($orgId);
        $key = 'admin-adjust-' . uniqid();

        if ($request->type === 'credit') {
            $this->walletService->credit($org, $request->amount, $key, $request->description);
        } else {
            $this->walletService->debit($org, $request->amount, $key, $request->description);
        }

        return response()->json(['message' => 'Wallet balance adjusted successfully.']);
    }
}
