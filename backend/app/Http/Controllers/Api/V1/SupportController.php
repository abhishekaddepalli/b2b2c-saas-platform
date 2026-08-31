<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => [], 'meta' => ['total' => 0]]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Support ticket created successfully.'], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json(['data' => ['id' => $id, 'subject' => 'Support Request']]);
    }

    public function addMessage(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Message added to support ticket.']);
    }
}
