<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class RestoreAuthorizationHeader
{
    /**
     * Ensure the Authorization Bearer header is always restored, even if stripped by LiteSpeed / Apache FastCGI,
     * and proactively resolve the Sanctum authenticated user so requests never fail with 401 on shared hosting.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        $candidate = null;
        if (!empty($bearer) && $bearer !== 'null' && $bearer !== 'undefined' && strlen(trim($bearer)) > 5) {
            $candidate = $bearer;
        }

        if (!$candidate) {
            $candidate = $request->header('X-Auth-Token')
                ?: $request->header('x-auth-token')
                ?: $request->query('auth_token')
                ?: $request->query('token')
                ?: $request->input('auth_token')
                ?: $request->server('HTTP_X_AUTH_TOKEN')
                ?: $request->server('REDIRECT_HTTP_X_AUTH_TOKEN')
                ?: $request->server('REDIRECT_HTTP_AUTHORIZATION')
                ?: ($_GET['auth_token'] ?? null);
        }

        if (!empty($candidate) && $candidate !== 'null' && $candidate !== 'undefined') {
            $tokenStr = str_starts_with($candidate, 'Bearer ') ? substr($candidate, 7) : $candidate;
            $tokenStr = trim($tokenStr);

            if (!empty($tokenStr)) {
                $headerVal = 'Bearer ' . $tokenStr;
                $request->headers->set('Authorization', $headerVal);
                $_SERVER['HTTP_AUTHORIZATION'] = $headerVal;
                putenv("HTTP_AUTHORIZATION={$headerVal}");

                // Proactively resolve the Personal Access Token and authenticate the user
                try {
                    $accessToken = PersonalAccessToken::findToken($tokenStr);
                    if ($accessToken && $accessToken->tokenable) {
                        /** @var User $user */
                        $user = $accessToken->tokenable;
                        Auth::setUser($user);
                        Auth::guard('sanctum')->setUser($user);
                        Auth::guard('web')->setUser($user);
                        $request->setUserResolver(fn() => $user);
                    }
                } catch (\Throwable $e) {
                    // Fail silently and let standard pipeline handle
                }
            }
        }

        // Fallback: If requesting /admin routes and user not authenticated, check if super admin exists and session is valid
        if (!$request->user() && str_contains($request->path(), 'admin/')) {
            try {
                // If an auth_token was provided but might have had prefix or encoding issue
                if (!empty($tokenStr)) {
                    $parts = explode('|', $tokenStr, 2);
                    if (count($parts) === 2 && is_numeric($parts[0])) {
                        $pat = PersonalAccessToken::where('id', $parts[0])->first();
                        if ($pat && hash_equals($pat->token, hash('sha256', $parts[1]))) {
                            $user = $pat->tokenable;
                            if ($user) {
                                Auth::setUser($user);
                                Auth::guard('sanctum')->setUser($user);
                                $request->setUserResolver(fn() => $user);
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        return $next($request);
    }
}
