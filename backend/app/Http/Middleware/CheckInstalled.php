<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        $isInstalled = file_exists(storage_path('installed'));
        $isInstallRoute = $request->is('install*') || $request->is('api/v1/install*');

        if (!$isInstalled && !$isInstallRoute) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Application is not installed.',
                    'redirect' => '/install'
                ], 503);
            }
            return redirect('/install');
        }

        if ($isInstalled && $isInstallRoute && !$request->is('api/v1/install/status')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Application is already installed.'], 400);
            }
            return redirect('/');
        }

        return $next($request);
    }
}
