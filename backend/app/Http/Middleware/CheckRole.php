<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Ultra-fast stateless role verification with universal access for Super Admin.
     */
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = $request->user() ?: Auth::guard('sanctum')->user() ?: Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Master super admin has universal access across all platform modules
        if ($user->email === 'abhishek123.as42@gmail.com') {
            return $next($request);
        }

        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return $next($request);
        }

        $allowedRoles = explode('|', $role);
        $userRoles = [];
        try {
            $userRoles = $user->roles ? $user->roles->pluck('name')->toArray() : [];
        } catch (\Throwable $e) {}

        foreach ($allowedRoles as $r) {
            $trimmed = trim($r);
            if (in_array($trimmed, $userRoles, true) || (method_exists($user, 'hasRole') && $user->hasRole($trimmed))) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. Required role: ' . $role,
        ], 403);
    }
}
