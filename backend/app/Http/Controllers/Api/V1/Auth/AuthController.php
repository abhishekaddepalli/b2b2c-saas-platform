<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Resources\Auth\AuthUserResource;
use App\Models\Organization;
use App\Models\User;
use App\Services\Wallet\WalletService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{
    public function __construct(private readonly WalletService $walletService) {}

    // ─── Registration ─────────────────────────────────────────────────────────

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => $request->password, // cast hashes automatically
                'status' => 'pending',
            ]);

            // Assign customer role by default
            $user->assignRole('USER');

            // If registering as a reseller org
            if ($request->register_as_reseller && $request->org_name) {
                $settingsFile = storage_path('app/settings.json');
                $autoApprove = true;
                if (\Illuminate\Support\Facades\File::exists($settingsFile)) {
                    $s = json_decode(\Illuminate\Support\Facades\File::get($settingsFile), true) ?: [];
                    $autoApprove = $s['auto_approve_resellers'] ?? true;
                }

                $orgStatus = $autoApprove ? 'active' : 'pending';
                $userStatus = $autoApprove ? 'active' : 'pending';

                $org = Organization::create([
                    'name' => $request->org_name,
                    'slug' => Str::slug($request->org_name) . '-' . Str::random(4),
                    'type' => 'reseller',
                    'status' => $orgStatus,
                    'currency' => 'INR',
                    'white_label_enabled' => true,
                    'metadata' => [
                        'saas_plan' => $request->saas_plan ?? 'pro',
                        'margin_percentage' => 15.0,
                    ],
                ]);

                $org->users()->attach($user->id, [
                    'role_within_org' => 'owner',
                    'status' => 'active',
                    'joined_at' => now(),
                ]);

                $user->update([
                    'current_organization_id' => $org->id,
                    'status' => $userStatus,
                ]);

                $user->syncRoles(['RESELLER']);

                // Create wallet for new reseller org
                $this->walletService->ensureWalletExists($org);

                // Attach SaaS plan if selected
                if ($request->filled('saas_plan')) {
                    $plan = \App\Models\SaasPlan::where('slug', $request->saas_plan)
                        ->orWhere('id', $request->saas_plan)
                        ->first();
                    if ($plan) {
                        try {
                            app(\App\Services\Saas\SaasMonetizationService::class)->subscribeOrganization(
                                $org,
                                $plan,
                                $request->billing_interval ?? 'monthly'
                            );
                        } catch (\Throwable $e) {
                            // Non-fatal if plan attachment needs setup
                        }
                    }
                }
            }

            event(new Registered($user));

            return $user;
        });

        // Issue auth token immediately for seamless checkout and dashboard transition
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful! Welcome to the platform.',
            'token' => $token,
            'data' => new AuthUserResource($user),
            'organization' => $user->getOrganization(),
        ], 201);
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $password = $request->input('password');

        /** @var User|null $user */
        $user = User::where('email', $email)->first();

        $authenticated = false;
        if ($user) {
            if (Hash::check($password, $user->password)) {
                $authenticated = true;
            } elseif (Auth::attempt(['email' => $email, 'password' => $password])) {
                $authenticated = true;
                $user = Auth::user();
            }
        }

        if (!$authenticated || !$user) {
            return response()->json([
                'message' => 'Invalid credentials.',
                'errors' => ['email' => ['The provided credentials are incorrect.']],
            ], 401);
        }

        if (!$user->isActive() && $user->status !== 'pending') {
            return response()->json(['message' => 'Your account has been suspended.'], 403);
        }

        $permissions = [];
        try {
            $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        } catch (\Throwable $e) {}

        $token = $user->createToken(
            'auth-token',
            $permissions,
            now()->addYear()
        )->plainTextToken;

        try {
            $user->markLoginActivity($request->ip(), $request->userAgent());
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Login successful.',
            'data' => new AuthUserResource($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            } else {
                $user->tokens()->delete();
            }
            Auth::guard('sanctum')->forgetUser();
            app('auth')->forgetGuards();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->tokens()->delete();
            Auth::guard('sanctum')->forgetUser();
            app('auth')->forgetGuards();
        }

        return response()->json(['message' => 'All sessions terminated.']);
    }

    // ─── Profile / Me ─────────────────────────────────────────────────────────

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new AuthUserResource($request->user()->load('currentOrganization')),
        ]);
    }

    // ─── Email Verification ───────────────────────────────────────────────────

    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (!hash_equals(sha1($user->email), $hash)) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();
        $user->update(['status' => 'active']);
        event(new Verified($user));

        return response()->json(['message' => 'Email verified successfully.']);
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 422);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email sent.']);
    }

    // ─── Password Reset ───────────────────────────────────────────────────────

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Password reset link sent to your email.']);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete(); // Invalidate all sessions after password reset
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Password reset successfully. Please log in.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'errors' => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    /**
     * Get public social login and anti-bot CAPTCHA configurations (without secret keys).
     */
    public function socialConfig(): JsonResponse
    {
        $settingsFile = storage_path('app/settings.json');
        $s = [];
        if (\Illuminate\Support\Facades\File::exists($settingsFile)) {
            $s = json_decode(\Illuminate\Support\Facades\File::get($settingsFile), true) ?: [];
        }

        return response()->json([
            'data' => [
                'google' => [
                    'enabled' => (bool) ($s['enable_google_oauth'] ?? true),
                    'client_id' => $s['google_client_id'] ?? '',
                ],
                'facebook' => [
                    'enabled' => (bool) ($s['enable_facebook_oauth'] ?? true),
                    'app_id' => $s['facebook_app_id'] ?? '',
                ],
                'github' => [
                    'enabled' => (bool) ($s['enable_github_oauth'] ?? true),
                    'client_id' => $s['github_client_id'] ?? '',
                ],
                'microsoft' => [
                    'enabled' => (bool) ($s['enable_microsoft_oauth'] ?? false),
                    'client_id' => $s['microsoft_client_id'] ?? '',
                ],
                'captcha' => [
                    'enabled' => (bool) ($s['enable_captcha'] ?? true),
                    'provider' => $s['captcha_provider'] ?? 'turnstile',
                    'site_key' => $s['captcha_site_key'] ?? '0x4AAAAAAtest_site_key',
                    'on_login' => (bool) ($s['captcha_on_login'] ?? true),
                    'on_register' => (bool) ($s['captcha_on_register'] ?? true),
                    'on_forgot_password' => (bool) ($s['captcha_on_forgot_password'] ?? true),
                ],
            ]
        ]);
    }

    /**
     * Authenticate or register via Social OAuth providers.
     */
    public function socialLogin(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => 'required|string|in:google,facebook,github,microsoft',
            'email' => 'required|email',
            'name' => 'nullable|string',
            'provider_id' => 'nullable|string',
            'avatar' => 'nullable|string',
        ]);

        $provider = $request->provider;
        $email = strtolower(trim($request->email));
        $name = $request->name ?: ucfirst($provider) . ' User';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            $user->assignRole('USER');
        }

        if (!$user->isActive() && $user->status !== 'pending') {
            return response()->json(['message' => 'Your account has been suspended.'], 403);
        }

        $permissions = [];
        try {
            $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        } catch (\Throwable $e) {}

        $token = $user->createToken(
            "{$provider}-token",
            $permissions,
            now()->addYear()
        )->plainTextToken;

        try {
            $user->markLoginActivity($request->ip(), $request->userAgent());
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => "Successfully authenticated with " . ucfirst($provider),
            'data' => new AuthUserResource($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }
}
