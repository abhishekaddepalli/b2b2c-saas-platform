<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaasPlan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'short_description',
        'monthly_price',
        'yearly_price',
        'currency',
        'reseller_limit',
        'customer_limit',
        'products_limit',
        'services_limit',
        'wallet_limit',
        'trial_days',
        'storage_mb',
        'api_rate_limit',
        'white_label_available',
        'features',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'monthly_price' => 'float',
        'yearly_price' => 'float',
        'wallet_limit' => 'float',
        'reseller_limit' => 'integer',
        'customer_limit' => 'integer',
        'products_limit' => 'integer',
        'services_limit' => 'integer',
        'trial_days' => 'integer',
        'storage_mb' => 'integer',
        'api_rate_limit' => 'integer',
        'white_label_available' => 'boolean',
        'features' => 'array',
        'sort_order' => 'integer',
    ];

    public function subscriptions()
    {
        return $this->hasMany(OrganizationSaasSubscription::class, 'saas_plan_id');
    }
}
