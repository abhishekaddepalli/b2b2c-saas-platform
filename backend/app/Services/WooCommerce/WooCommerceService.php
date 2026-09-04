<?php

namespace App\Services\WooCommerce;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use App\Models\ServicePlan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WooCommerceService
{
    protected string $settingsFile;

    public function __construct()
    {
        $this->settingsFile = storage_path('app/settings.json');
    }

    /**
     * Get configured or override WooCommerce credentials.
     */
    public function getCredentials(?string $storeUrl = null, ?string $key = null, ?string $secret = null): array
    {
        $settings = [];
        if (File::exists($this->settingsFile)) {
            $settings = json_decode(File::get($this->settingsFile), true) ?: [];
        }

        $url = rtrim($storeUrl ?: ($settings['woocommerce_store_url'] ?? ''), '/');
        $ck = $key ?: ($settings['woocommerce_consumer_key'] ?? '');
        $cs = $secret ?: ($settings['woocommerce_consumer_secret'] ?? '');

        return [
            'store_url' => $url,
            'consumer_key' => $ck,
            'consumer_secret' => $cs,
            'reseller_margin' => (float)($settings['woocommerce_reseller_margin'] ?? 15),
            'default_import_type' => $settings['woocommerce_default_import_type'] ?? 'auto',
        ];
    }

    /**
     * Test connection to WooCommerce REST API.
     */
    public function testConnection(?string $storeUrl = null, ?string $key = null, ?string $secret = null): array
    {
        $creds = $this->getCredentials($storeUrl, $key, $secret);

        if (empty($creds['store_url']) || empty($creds['consumer_key']) || empty($creds['consumer_secret'])) {
            return [
                'success' => false,
                'message' => 'Store URL, Consumer Key, and Consumer Secret are all required.',
            ];
        }

        try {
            $endpoint = "{$creds['store_url']}/wp-json/wc/v3/system_status";
            $response = Http::withoutVerifying()
                ->timeout(15)
                ->withBasicAuth($creds['consumer_key'], $creds['consumer_secret'])
                ->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message' => 'Connected successfully to WooCommerce!',
                    'environment' => [
                        'site_title' => $data['environment']['site_title'] ?? 'WooCommerce Store',
                        'wc_version' => $data['environment']['version'] ?? '3.x',
                        'currency' => $data['settings']['currency'] ?? 'INR',
                    ],
                ];
            }

            // If system_status is restricted, test products endpoint
            $prodEndpoint = "{$creds['store_url']}/wp-json/wc/v3/products?per_page=1";
            $prodResponse = Http::withoutVerifying()
                ->timeout(15)
                ->withBasicAuth($creds['consumer_key'], $creds['consumer_secret'])
                ->get($prodEndpoint);

            if ($prodResponse->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connected successfully to WooCommerce Store Catalog API!',
                    'environment' => [
                        'site_title' => parse_url($creds['store_url'], PHP_URL_HOST),
                        'wc_version' => 'REST v3',
                        'currency' => 'INR',
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => 'Connection failed: ' . ($prodResponse->json('message') ?? 'HTTP ' . $prodResponse->status()),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'WooCommerce Connection Error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Synchronize catalog from WooCommerce into Products and Services.
     */
    public function syncCatalog(array $options = []): array
    {
        $creds = $this->getCredentials(
            $options['store_url'] ?? null,
            $options['consumer_key'] ?? null,
            $options['consumer_secret'] ?? null
        );

        if (empty($creds['store_url']) || empty($creds['consumer_key']) || empty($creds['consumer_secret'])) {
            return [
                'success' => false,
                'message' => 'Missing WooCommerce store URL or API credentials in Settings.',
            ];
        }

        $importAs = $options['import_as'] ?? $creds['default_import_type']; // 'product', 'service', 'auto'
        $margin = (float)($options['reseller_discount_percent'] ?? $creds['reseller_margin']);
        $overwrite = !empty($options['overwrite_existing']);
        $page = (int)($options['page'] ?? 1);
        $perPage = (int)($options['per_page'] ?? 50);
        $targetCategoryId = $options['category_id'] ?? null;

        try {
            $endpoint = "{$creds['store_url']}/wp-json/wc/v3/products";
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->withBasicAuth($creds['consumer_key'], $creds['consumer_secret'])
                ->get($endpoint, [
                    'page' => $page,
                    'per_page' => $perPage,
                    'status' => 'publish',
                ]);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => 'Failed to fetch products: ' . ($response->json('message') ?? 'HTTP ' . $response->status()),
                ];
            }

            $items = $response->json() ?: [];
            $importedCount = 0;
            $updatedCount = 0;
            $failedCount = 0;
            $errors = [];
            $processedItems = [];

            foreach ($items as $item) {
                try {
                    $wcId = $item['id'];
                    $name = $item['name'] ?? 'Untitled Item';
                    $slug = $item['slug'] ?? Str::slug($name);
                    $sku = !empty($item['sku']) ? $item['sku'] : ('WC-' . $wcId);
                    $desc = strip_tags($item['description'] ?? '');
                    $shortDesc = strip_tags($item['short_description'] ?? '');
                    $imageUrl = !empty($item['images'][0]['src']) ? $item['images'][0]['src'] : null;

                    // Pricing logic
                    $rawPrice = !empty($item['price']) ? (float)$item['price'] : (!empty($item['regular_price']) ? (float)$item['regular_price'] : 999);
                    $retailPrice = max(1, $rawPrice);
                    $resellerPrice = round($retailPrice * (1 - ($margin / 100)), 2);
                    $costPrice = round($retailPrice * 0.70, 2);

                    // Determine Category
                    $categoryId = $targetCategoryId;
                    if (!$categoryId && !empty($item['categories'][0]['name'])) {
                        $wcCatName = $item['categories'][0]['name'];
                        $wcCatSlug = Str::slug($wcCatName);
                        $cat = Category::firstOrCreate(
                            ['slug' => $wcCatSlug],
                            ['name' => $wcCatName, 'is_active' => true]
                        );
                        $categoryId = $cat->id;
                    }

                    // Determine whether this item is a Product or a Recurring Service
                    $isService = false;
                    if ($importAs === 'service') {
                        $isService = true;
                    } elseif ($importAs === 'product') {
                        $isService = false;
                    } else { // 'auto'
                        $type = $item['type'] ?? 'simple';
                        if ($type === 'subscription' || (str_contains(strtolower($name), 'hosting') || str_contains(strtolower($name), 'cloud') || str_contains(strtolower($name), 'vps') || str_contains(strtolower($name), 'server') || str_contains(strtolower($name), 'monthly'))) {
                            $isService = true;
                        } else {
                            $isService = false;
                        }
                    }

                    if ($isService) {
                        // Import / update Service
                        $service = Service::where('slug', $slug)->first();
                        if ($service && !$overwrite) {
                            continue;
                        }

                        $isNew = !$service;
                        if (!$service) {
                            $service = new Service();
                            $service->slug = $slug;
                        }

                        $service->name = $name;
                        $service->category_id = $categoryId;
                        $service->short_description = $shortDesc ?: Str::limit($desc, 160);
                        $service->full_description = $desc;
                        $service->icon = $imageUrl;
                        $service->status = 'active';
                        $service->visibility = 'public';
                        $service->billing_type = 'recurring';
                        $service->billing_interval = 'monthly';
                        $service->metadata = [
                            'woocommerce_id' => $wcId,
                            'image_url' => $imageUrl,
                            'source' => 'woocommerce',
                        ];
                        $service->save();

                        // Base Plan
                        $plan = $service->plans()->firstOrCreate(
                            ['name' => 'Standard Plan'],
                            ['slug' => $service->slug . '-standard', 'status' => 'active']
                        );

                        $plan->prices()->updateOrCreate(
                            ['pricing_type' => 'fixed'],
                            [
                                'cost_price' => $costPrice,
                                'reseller_price' => $resellerPrice,
                                'customer_price' => $retailPrice,
                                'currency' => 'INR',
                                'is_active' => true,
                            ]
                        );

                        if ($isNew) {
                            $importedCount++;
                        } else {
                            $updatedCount++;
                        }

                        $processedItems[] = [
                            'type' => 'service',
                            'name' => $name,
                            'id' => $service->id,
                            'action' => $isNew ? 'created' : 'updated',
                        ];
                    } else {
                        // Import / update Product
                        $product = Product::where('slug', $slug)->orWhere('sku', $sku)->first();
                        if ($product && !$overwrite) {
                            continue;
                        }

                        $isNew = !$product;
                        if (!$product) {
                            $product = new Product();
                            $product->slug = $slug;
                        }

                        $productType = (!empty($item['virtual']) || !empty($item['downloadable'])) ? 'digital' : 'physical';
                        if (str_contains(strtolower($name), 'license') || str_contains(strtolower($name), 'key')) {
                            $productType = 'license';
                        }

                        $product->name = $name;
                        $product->sku = $sku;
                        $product->category_id = $categoryId;
                        $product->type = $productType;
                        $product->status = 'active';
                        $product->short_description = $shortDesc ?: Str::limit($desc, 160);
                        $product->description = $desc;
                        $product->metadata = [
                            'woocommerce_id' => $wcId,
                            'source' => 'woocommerce',
                            'permalink' => $item['permalink'] ?? null,
                        ];
                        $product->save();

                        // Set Primary Image
                        if ($imageUrl) {
                            $product->images()->updateOrCreate(
                                ['is_primary' => true],
                                ['path' => $imageUrl, 'alt_text' => $name, 'sort_order' => 0]
                            );
                        }

                        // Set Prices
                        $product->prices()->updateOrCreate(
                            ['pricing_type' => 'fixed'],
                            [
                                'cost_price' => $costPrice,
                                'reseller_price' => $resellerPrice,
                                'customer_price' => $retailPrice,
                                'currency' => 'INR',
                                'is_active' => true,
                            ]
                        );

                        if ($isNew) {
                            $importedCount++;
                        } else {
                            $updatedCount++;
                        }

                        $processedItems[] = [
                            'type' => 'product',
                            'name' => $name,
                            'id' => $product->id,
                            'action' => $isNew ? 'created' : 'updated',
                        ];
                    }
                } catch (\Throwable $itemErr) {
                    $failedCount++;
                    $errors[] = "Failed item '{$name}': " . $itemErr->getMessage();
                }
            }

            return [
                'success' => true,
                'message' => "WooCommerce catalog sync complete. Imported: {$importedCount}, Updated: {$updatedCount}, Failed: {$failedCount}.",
                'stats' => [
                    'total_fetched' => count($items),
                    'imported' => $importedCount,
                    'updated' => $updatedCount,
                    'failed' => $failedCount,
                ],
                'items' => $processedItems,
                'errors' => $errors,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
            ];
        }
    }
}
