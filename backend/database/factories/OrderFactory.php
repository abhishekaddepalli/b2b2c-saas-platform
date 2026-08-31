<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'organization_id' => Organization::factory(),
            'customer_id' => User::factory(),
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'currency' => 'INR',
            'subtotal' => 100.00,
            'grand_total' => 100.00,
        ];
    }
}
