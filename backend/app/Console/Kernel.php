<?php

namespace App\Console;

use App\Jobs\ProcessSubscriptionRenewals;
use App\Jobs\SuspendExpiredGracePeriodSubscriptions;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Run renewal job every 5 minutes — handles due renewals + reminder emails
        $schedule->job(new ProcessSubscriptionRenewals)
            ->everyFiveMinutes()
            ->name('process-subscription-renewals')
            ->withoutOverlapping()
            ->runInBackground();

        // Suspend subscriptions whose grace period has elapsed — hourly
        $schedule->job(new SuspendExpiredGracePeriodSubscriptions)
            ->hourly()
            ->name('suspend-grace-period-subscriptions')
            ->withoutOverlapping();

        // Prune processed webhook events older than 30 days
        $schedule->command('model:prune', ['--model' => \App\Models\WebhookEvent::class])
            ->daily();

        // Clear expired Sanctum tokens
        $schedule->command('sanctum:prune-expired', ['--hours' => 720])
            ->daily();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
