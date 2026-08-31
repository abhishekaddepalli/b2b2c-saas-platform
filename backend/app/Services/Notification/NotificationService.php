<?php

namespace App\Services\Notification;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Dispatch in-app notification and email log entry.
     */
    public function send(User $user, string $title, string $message, string $type = 'info', array $data = []): void
    {
        DB::table('notifications')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => "App\\Notifications\\{$type}",
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $user->id,
            'data' => json_encode(array_merge([
                'title' => $title,
                'message' => $message,
                'type' => $type,
            ], $data)),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Dispatch Payment Success notification to user/org owners.
     */
    public function notifyPaymentSuccess(User $user, float $amount, string $gateway, string $txnId): void
    {
        $this->send(
            $user,
            'Payment Successful',
            "Your payment of ₹{$amount} via {$gateway} (Txn: {$txnId}) was successfully processed.",
            'PaymentSuccess',
            ['amount' => $amount, 'gateway' => $gateway, 'txn_id' => $txnId]
        );
    }

    /**
     * Dispatch Wallet Recharge notification.
     */
    public function notifyWalletRecharged(User $user, float $amount, float $newBalance): void
    {
        $this->send(
            $user,
            'Wallet Recharged',
            "Your wallet was credited with ₹{$amount}. New Available Balance: ₹{$newBalance}.",
            'WalletRecharged',
            ['amount' => $amount, 'new_balance' => $newBalance]
        );
    }
}
