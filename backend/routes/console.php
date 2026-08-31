<?php

use App\Jobs\RenewSubscriptionsJob;
use App\Jobs\SendSubscriptionRemindersJob;
use Illuminate\Support\Facades\Schedule;

// Run subscription renewals daily at 00:00
Schedule::job(new RenewSubscriptionsJob)->dailyAt('00:00');

// Send subscription renewal reminders daily at 08:00 (7d, 3d, 1d, 0d)
Schedule::job(new SendSubscriptionRemindersJob)->dailyAt('08:00');
