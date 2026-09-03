<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Ultra-fast stateless role verification without heavy Spatie cache registrar file locks.
     */
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $allowedRoles = explode('|', $role);

        // Fetch user's assigned role names directly from relation
        $userRoles = $user->roles->pluck('name')->toArray();

        // Check if any allowed role matches
        foreach ($allowedRoles as $r) {
            if (in_array(trim($r), $userRoles, true)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. Required role: ' . $role,
        ], 403);
    }
}
