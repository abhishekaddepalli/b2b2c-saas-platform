<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class CmsController extends Controller
{
    private string $cmsFile;

    public function __construct()
    {
        $this->cmsFile = storage_path('app/cms_content.json');
    }

    public function getDefaultContent(): array
    {
        return [
            // ─── Landing / Hero Section ─────────────────────────────────────────
            'hero' => [
                'badge' => '⚡ All-in-One B2B2C Cloud Infrastructure',
                'title' => 'Launch Your White-Label SaaS & Reseller Marketplace',
                'subtitle' => 'Empower resellers to distribute your cloud services, digital products, and subscriptions with real-time margins, automated wallets, and branded tenant portals.',
                'cta_primary_text' => 'Explore Reseller Plans',
                'cta_primary_link' => '/pricing',
                'cta_secondary_text' => 'Browse Marketplace',
                'cta_secondary_link' => '/marketplace',
                'announcement_active' => true,
                'announcement_text' => '🚀 Launch Offer: Zero setup fees on all annual reseller plans this month!',
                'announcement_link' => '/pricing',
            ],

            // ─── Key Value Metrics / Stats ──────────────────────────────────────
            'stats' => [
                ['label' => 'Active Reseller Stores', 'value' => '10,000+', 'description' => 'Across 40+ countries'],
                ['label' => 'Total Processed GMV', 'value' => '₹50Cr+', 'description' => 'Secured via Razorpay & Stripe'],
                ['label' => 'Infrastructure SLA', 'value' => '99.99%', 'description' => 'Multi-region failover'],
                ['label' => 'Reseller Margin Avg.', 'value' => '24.5%', 'description' => 'Direct automated payouts'],
            ],

            // ─── Key Features Section ───────────────────────────────────────────
            'features' => [
                [
                    'title' => 'Turnkey White-Label Portals',
                    'description' => 'Every reseller gets their own custom domain, custom logo, branding colors, and client dashboard.',
                    'badge' => 'Custom Branding',
                    'icon' => 'Palette',
                ],
                [
                    'title' => 'Automated Prepaid Wallets & Credit Lines',
                    'description' => 'Zero financial risk with instant ledger settlements, automated debits on order fulfillment, and overdraft lines.',
                    'badge' => 'Instant Ledger',
                    'icon' => 'Wallet',
                ],
                [
                    'title' => 'Dynamic Tiered Margins & Catalog Rules',
                    'description' => 'Assign custom markups, bundle subscriptions, and control product availability per reseller tier.',
                    'badge' => 'Profit Engine',
                    'icon' => 'TrendingUp',
                ],
                [
                    'title' => 'Multi-Gateway Razorpay & Stripe Integration',
                    'description' => 'Support UPI, Netbanking, Cards, Wallets, and international payments with auto-reconciled webhooks.',
                    'badge' => 'Payment Core',
                    'icon' => 'CreditCard',
                ],
                [
                    'title' => 'Developer APIs & Webhooks',
                    'description' => 'Full REST API suite, OpenAPI specifications, and instant webhooks for enterprise ERP integration.',
                    'badge' => 'Developer First',
                    'icon' => 'Terminal',
                ],
                [
                    'title' => 'Enterprise Security & Audit Trail',
                    'description' => 'Immutable audit logging, granular RBAC, IP tracking, and bank-grade data encryption.',
                    'badge' => 'Bank Grade',
                    'icon' => 'ShieldCheck',
                ],
            ],

            // ─── Public Legal & Company Pages Content ───────────────────────────
            'pages' => [
                'about' => [
                    'title' => 'About Our Platform',
                    'subtitle' => 'Pioneering the Next-Generation Multi-Tenant B2B2C SaaS Ecosystem',
                    'content' => "We build state-of-the-art cloud distribution platforms that empower technology providers and agencies to scale seamlessly.\n\nOur architecture provides multi-tenant isolation, real-time prepaid billing, automated reseller governance, and instant marketplace deployment.",
                    'mission' => 'To democratize software distribution by giving every agency and reseller enterprise-grade SaaS infrastructure.',
                    'vision' => 'Connecting 1 million software creators with regional resellers globally.',
                ],
                'terms' => [
                    'title' => 'Terms of Service',
                    'last_updated' => 'September 2026',
                    'content' => "Welcome to the B2B2C SaaS Platform. By using our services, you agree to comply with our commercial terms, wallet governance guidelines, and acceptable use policies.\n\n1. Reseller Responsibilities: Resellers are responsible for client onboarding and compliance with local business laws.\n2. Wallet Balances: All wallet balances are strictly non-transferable except through verified platform refund workflows.\n3. SLA: We guarantee 99.99% core API availability.",
                ],
                'privacy' => [
                    'title' => 'Privacy Policy',
                    'last_updated' => 'September 2026',
                    'content' => "Your data privacy and tenant isolation are our utmost priorities.\n\n1. Data Ownership: You retain 100% ownership of your customer catalog, pricing rules, and reseller data.\n2. Security: All communications are encrypted using TLS 1.3. We do not store raw card credentials or CVVs.\n3. Third Parties: Payment processing is handled exclusively through PCI-DSS compliant providers including Razorpay and Stripe.",
                ],
                'refund' => [
                    'title' => 'Refund & Cancellation Policy',
                    'last_updated' => 'September 2026',
                    'content' => "We believe in transparent, equitable commercial operations.\n\n1. Subscription Cancellations: SaaS plan subscriptions can be cancelled at any time before the next billing renewal.\n2. Wallet Refunds: Unused wallet capital can be refunded back to the originating bank account or payment method upon written admin request within 14 business days.\n3. SLA Credits: In the unlikely event of SLA breach, eligible credits will be added to your organization's wallet balance.",
                ],
                'contact' => [
                    'title' => 'Contact & Support Desk',
                    'email' => 'support@infiniforge.cloud',
                    'phone' => '+91 9876543210',
                    'whatsapp' => '+91 9876543210',
                    'address' => 'Infiniforge Cloud HQ, Level 7, Cyber Tower, Tech Hub, India',
                    'business_hours' => 'Monday – Friday, 9:00 AM – 7:00 PM IST',
                    'support_url' => 'https://resell.infiniforge.cloud/support',
                ],
            ],

            // ─── Header, Footer & Social Branding ────────────────────────────────
            'branding' => [
                'company_name' => 'Infiniforge Cloud Solutions',
                'brand_tagline' => 'Enterprise B2B2C Reseller Engine',
                'copyright_text' => '© 2026 Infiniforge Cloud. All rights reserved.',
                'social_links' => [
                    'twitter' => 'https://twitter.com/infiniforge',
                    'linkedin' => 'https://linkedin.com/company/infiniforge',
                    'github' => 'https://github.com/infiniforge',
                    'discord' => 'https://discord.gg/infiniforge',
                ],
            ],

            // ─── SEO & Metadata ──────────────────────────────────────────────────
            'seo' => [
                'meta_title' => 'Resell Cloud — Enterprise B2B2C SaaS & Reseller Platform',
                'meta_description' => 'Launch your white-label SaaS marketplace. Distribute cloud software with automated reseller margins, prepaid wallets, and instant billing.',
                'meta_keywords' => 'B2B2C, SaaS, Reseller, Marketplace, White-label, Cloud Software, Razorpay Billing',
            ],
        ];
    }

    public function index(): JsonResponse
    {
        $defaults = $this->getDefaultContent();

        if (File::exists($this->cmsFile)) {
            $saved = json_decode(File::get($this->cmsFile), true) ?: [];
            $content = array_replace_recursive($defaults, $saved);
        } else {
            $content = $defaults;
        }

        return response()->json(['data' => $content]);
    }

    public function update(Request $request): JsonResponse
    {
        $defaults = $this->getDefaultContent();
        $current = [];

        if (File::exists($this->cmsFile)) {
            $current = json_decode(File::get($this->cmsFile), true) ?: [];
        }

        $merged = array_replace_recursive($defaults, $current, $request->all());

        if (!File::isDirectory(dirname($this->cmsFile))) {
            File::makeDirectory(dirname($this->cmsFile), 0755, true);
        }

        File::put($this->cmsFile, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json([
            'message' => 'Site CMS content and page data published successfully.',
            'data' => $merged,
        ]);
    }

    public function getPublicCms(): JsonResponse
    {
        $defaults = $this->getDefaultContent();

        if (File::exists($this->cmsFile)) {
            $saved = json_decode(File::get($this->cmsFile), true) ?: [];
            $content = array_replace_recursive($defaults, $saved);
        } else {
            $content = $defaults;
        }

        return response()->json(['data' => $content]);
    }
}
