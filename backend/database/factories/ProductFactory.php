<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->words(3, true);
        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name) . '-' . Str::random(6),
            'sku' => strtoupper(Str::random(8)),
            'type' => 'digital',
            'status' => 'active',
            'visibility' => 'public',
            'featured' => false,
        ];
    }
}
