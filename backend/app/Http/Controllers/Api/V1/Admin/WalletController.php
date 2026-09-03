<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Wallet::with([
            'organization:id,name,slug,brand_name,status,credit_limit'
        ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('id', 'like', $s)
                  ->orWhereHas('organization', function ($oq) use ($s) {
                      $oq->where('name', 'like', $s)->orWhere('slug', 'like', $s);
                  });
            });
        }

        return response()->json($query->latest('updated_at')->paginate($request->per_page ?? 25));
    }

    public function show(string $orgId): JsonResponse
    {
        $wallet = Wallet::with('organization')
            ->where('organization_id', $orgId)
            ->orWhere('id', $orgId)
            ->firstOrFail();

        return response()->json(['data' => $wallet]);
    }

    public function adjust(Request $request, string $orgId): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:credit,debit'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string'],
        ]);

        $wallet = Wallet::where('organization_id', $orgId)
            ->orWhere('id', $orgId)
            ->first();

        if (!$wallet) {
            $wallet = Wallet::create([
                'organization_id' => $orgId,
                'balance' => 0,
                'available_balance' => 0,
                'currency' => 'INR',
            ]);
        }

        $amount = (float)$request->amount;

        if ($request->type === 'credit') {
            $wallet->increment('balance', $amount);
            $wallet->increment('available_balance', $amount);
        } else {
            $wallet->decrement('balance', $amount);
            $wallet->decrement('available_balance', $amount);
        }

        return response()->json([
            'message' => "Wallet successfully {$request->type}ed with ₹" . number_format($amount, 2) . '.',
            'data' => $wallet->fresh(['organization']),
        ]);
    }
}
