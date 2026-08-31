<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Services\Notification\AutomationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = NotificationTemplate::orderBy('event_trigger')
            ->orderBy('channel')
            ->get();

        return response()->json(['data' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'event_trigger' => ['required', 'string'],
            'channel' => ['required', 'in:email,sms,whatsapp,in_app'],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'template_body' => ['required', 'string'],
            'supported_variables' => ['nullable', 'array'],
        ]);

        $template = NotificationTemplate::updateOrCreate(
            [
                'event_trigger' => $request->event_trigger,
                'channel' => $request->channel,
            ],
            $request->all()
        );

        return response()->json([
            'message' => 'Notification template saved successfully.',
            'data' => $template,
        ]);
    }

    public function toggleStatus(string $id): JsonResponse
    {
        $template = NotificationTemplate::findOrFail($id);
        $template->update(['is_enabled' => !$template->is_enabled]);

        return response()->json([
            'message' => 'Template status updated.',
            'data' => $template,
        ]);
    }

    /**
     * Send test automation notification.
     */
    public function testTrigger(Request $request): JsonResponse
    {
        $request->validate([
            'event_trigger' => ['required', 'string'],
        ]);

        $automationService = app(AutomationService::class);

        $automationService->triggerEvent($request->event_trigger, $request->user(), [
            'customer_name' => 'Anjali Sharma',
            'service_name' => 'Cloud Hosting Enterprise',
            'amount' => '₹4,999.00',
            'renewal_date' => now()->addDays(7)->format('d M Y'),
            'invoice_number' => 'INV-TEST-2026-001',
        ]);

        return response()->json([
            'message' => "Test automation notification for {$request->event_trigger} dispatched successfully.",
        ]);
    }
}
