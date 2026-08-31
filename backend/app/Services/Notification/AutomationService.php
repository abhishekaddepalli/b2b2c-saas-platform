<?php

namespace App\Services\Notification;

use App\Models\NotificationTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AutomationService
{
    /**
     * Dispatch multi-channel automated notifications for an event trigger.
     */
    public function triggerEvent(string $eventTrigger, User $user, array $variables = []): void
    {
        $context = array_merge([
            'customer_name' => $user->name ?? $user->email,
            'platform_name' => config('app.name', 'SaaS Platform'),
        ], $variables);

        $templates = NotificationTemplate::where('event_trigger', $eventTrigger)
            ->where('is_enabled', true)
            ->get();

        foreach ($templates as $template) {
            $rendered = $template->render($context);

            Log::info("Automation Triggered [{$eventTrigger}] Channel: {$template->channel} User: {$user->email}", [
                'subject' => $rendered['subject'],
                'body' => $rendered['body'],
            ]);

            // Save in-app notification if channel is in_app
            if ($template->channel === 'in_app') {
                \App\Models\Notification::create([
                    'user_id' => $user->id,
                    'notifiable_type' => get_class($user),
                    'notifiable_id' => $user->id,
                    'type' => $eventTrigger,
                    'title' => $rendered['subject'] ?: ucfirst(str_replace('_', ' ', $eventTrigger)),
                    'message' => $rendered['body'],
                    'data' => json_encode($context),
                    'read' => false,
                ]);
            }
        }
    }
}
