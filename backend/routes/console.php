<?php

use App\Jobs\RenewSubscriptionsJob;
use App\Jobs\SendSubscriptionRemindersJob;
use Illuminate\Support\Facades\Schedule;

// Run subscription renewals daily at 00:00
Schedule::job(new RenewSubscriptionsJob)->dailyAt('00:00');

// Send subscription renewal reminders daily at 08:00 (7d, 3d, 1d, 0d)
Schedule::job(new SendSubscriptionRemindersJob)->dailyAt('08:00');

\Illuminate\Support\Facades\Artisan::command('platform:sync-data', function () {
    $this->info('Starting customer organization sync and wallet ledger reconciliation...');

    $users = \App\Models\User::whereNotNull('current_organization_id')->with('roles')->get();
    foreach ($users as $u) {
        $roleName = $u->roles->first()?->name;
        $roleInOrg = $roleName === 'RESELLER' ? 'owner' : 'customer';
        $u->organizations()->syncWithoutDetaching([
            $u->current_organization_id => [
                'role_within_org' => $roleInOrg,
                'status' => 'active',
                'joined_at' => now(),
            ]
        ]);
        $this->info("Synced user: {$u->email} to org {$u->current_organization_id} as {$roleInOrg}");
    }

    $wallets = \App\Models\Wallet::all();
    foreach ($wallets as $w) {
        $lastTx = $w->transactions()->first();
        $diff = (float) $w->available_balance - (float) ($lastTx?->balance_after ?? 0);
        if (abs($diff) > 0.01) {
            \App\Models\WalletTransaction::create([
                'wallet_id' => $w->id,
                'type' => $diff > 0 ? 'credit' : 'debit',
                'amount' => abs($diff),
                'balance_before' => (float) ($lastTx?->balance_after ?? 0),
                'balance_after' => (float) $w->available_balance,
                'currency' => $w->currency ?? 'INR',
                'idempotency_key' => 'reconcile_' . \Illuminate\Support\Str::uuid(),
                'description' => 'Admin balance adjustment (' . ($diff > 0 ? '+Credit' : '-Debit') . ')',
                'created_at' => now(),
            ]);
            $this->info("Reconciled wallet {$w->id} for org {$w->organization_id}: diff={$diff}");
        }
    }

    $this->info('Data sync completed successfully.');
});

