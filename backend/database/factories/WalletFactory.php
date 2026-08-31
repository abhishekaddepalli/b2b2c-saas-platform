<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Factories\Factory;

class WalletFactory extends Factory
{
    protected $model = Wallet::class;

    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'available_balance' => 1000.00,
            'reserved_balance' => 0.00,
            'credit_limit' => 0.00,
            'currency' => 'INR',
            'status' => 'active',
        ];
    }
}
