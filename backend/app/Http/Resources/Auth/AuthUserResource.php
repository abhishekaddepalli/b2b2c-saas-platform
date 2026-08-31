<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar_path' => $user->avatar_path,
            'status' => $user->status,
            'email_verified' => $user->hasVerifiedEmail(),
            'timezone' => $user->timezone,
            'locale' => $user->locale,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'pricing_role' => $user->getPricingRole(),
            'last_login_at' => $user->last_login_at?->toISOString(),
            'organization' => $user->currentOrganization ? [
                'id' => $user->currentOrganization->id,
                'name' => $user->currentOrganization->getDisplayName(),
                'slug' => $user->currentOrganization->slug,
                'type' => $user->currentOrganization->type,
                'status' => $user->currentOrganization->status,
                'primary_color' => $user->currentOrganization->primary_color,
                'logo_path' => $user->currentOrganization->logo_path,
                'wallet_enabled' => $user->currentOrganization->wallet_enabled,
                'currency' => $user->currentOrganization->currency,
            ] : null,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
