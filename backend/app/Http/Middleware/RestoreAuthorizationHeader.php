<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestoreAuthorizationHeader
{
    /**
     * Ensure the Authorization Bearer header is always restored, even if stripped by LiteSpeed / Apache FastCGI.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (empty($bearer)) {
            $rawToken = $request->header('X-Auth-Token')
                ?? $request->header('x-auth-token')
                ?? $request->server('HTTP_X_AUTH_TOKEN')
                ?? $request->server('REDIRECT_HTTP_AUTHORIZATION')
                ?? $request->query('auth_token')
                ?? $request->query('token');

            if (!empty($rawToken)) {
                $headerVal = str_starts_with($rawToken, 'Bearer ') ? $rawToken : 'Bearer ' . $rawToken;
                $request->headers->set('Authorization', $headerVal);
                $_SERVER['HTTP_AUTHORIZATION'] = $headerVal;
            }
        }

        return $next($request);
    }
}
