<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use App\Models\ServicePlan;
use App\Models\Price;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InfiniforgeCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // ─── 1. SEED 12 INFINIFORGE CATEGORIES ─────────────────────────────────
        $categoriesData = [
            [
                'slug' => 'it-services',
                'name' => 'IT Services',
                'description' => 'End-to-end managed IT for growing enterprises',
                'icon' => 'Server',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'saas',
                'name' => 'SaaS Applications',
                'description' => 'White-label ready SaaS built for scale',
                'icon' => 'Boxes',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'hosting',
                'name' => 'Hosting & VPS',
                'description' => 'Blazing-fast SSD hosting, VPS & dedicated servers',
                'icon' => 'Cloud',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 3,
            ],
            [
                'slug' => 'domains',
                'name' => 'Domains & SSL',
                'description' => '.com, .in, .co & wildcard SSL certificates',
                'icon' => 'Globe',
                'type' => 'product',
                'featured' => true,
                'sort_order' => 4,
            ],
            [
                'slug' => 'development',
                'name' => 'Website & App Dev',
                'description' => 'Websites, Android & iOS apps, ERPs, CRMs',
                'icon' => 'FileCode2',
                'type' => 'service',
                'featured' => true,
                'sort_order' => 5,
            ],
            [
                'slug' => 'ai-automation',
                'name' => 'AI Automation',
                'description' => 'Custom AI agents, workflows & integrations',
                'icon' => 'Bot',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 6,
            ],
            [
                'slug' => 'ai-voice-agent',
                'name' => 'AI Voice Call Agent',
                'description' => '24×7 human-like voice agents for sales & support',
                'icon' => 'PhoneCall',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 7,
            ],
            [
                'slug' => 'whatsapp-automation',
                'name' => 'WhatsApp Automation',
                'description' => 'Official API, chatbots, broadcasts & CRM flows',
                'icon' => 'MessageSquare',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 8,
            ],
            [
                'slug' => 'animation-ads',
                'name' => 'Animation & Video Ads',
                'description' => '2D/3D motion ads, explainer & reel production',
                'icon' => 'Film',
                'type' => 'service',
                'featured' => false,
                'sort_order' => 9,
            ],
            [
                'slug' => 'monitoring',
                'name' => 'Monitoring & AMC',
                'description' => '24×7 uptime, network monitoring & AMCs',
                'icon' => 'Activity',
                'type' => 'service',
                'featured' => false,
                'sort_order' => 10,
            ],
            [
                'slug' => 'internet',
                'name' => 'Internet & Leased Line',
                'description' => 'Enterprise leased lines, fiber & business broadband',
                'icon' => 'Wifi',
                'type' => 'service',
                'featured' => false,
                'sort_order' => 11,
            ],
            [
                'slug' => 'licenses',
                'name' => 'Software Licenses',
                'description' => 'Genuine licenses with instant activation',
                'icon' => 'Key',
                'type' => 'product',
                'featured' => true,
                'sort_order' => 12,
            ],
        ];

        $categoryMap = [];
        foreach ($categoriesData as $c) {
            $cat = Category::updateOrCreate(['slug' => $c['slug']], [
                'name' => $c['name'],
                'description' => $c['description'],
                'icon' => $c['icon'],
                'type' => $c['type'],
                'status' => 'active',
                'featured' => $c['featured'],
                'sort_order' => $c['sort_order'],
            ]);
            $categoryMap[$c['slug']] = $cat->id;
        }

        // ─── 2. SEED 6 READY SOFTWARE PLATFORMS (PRODUCTS & SOFTWARE LICENSES) ─
        $softwares = [
            [
                'slug' => 'infibilling-erp',
                'name' => 'InfiBilling ERP',
                'tagline' => 'GST billing, inventory & accounting suite',
                'category_slug' => 'saas',
                'type' => 'software',
                'badge' => 'Best seller',
                'cost_price' => 22000.00,
                'reseller_price' => 28000.00,
                'customer_price' => 34999.00,
                'whitelabel_price' => 149999.00,
                'demo_url' => 'https://demo.infiniforge.cloud/erp',
                'demo_username' => 'demo@infiniforge.cloud',
                'demo_password' => 'demo1234',
                'image_url' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
                'short_description' => 'Complete GST-compliant billing platform with inventory, purchase orders, e-way bills, multi-branch stock, staff roles and financial reports.',
                'full_description' => 'Built for Indian retailers, distributors and manufacturers. InfiBilling ERP covers GST invoicing, multi-branch inventory, thermal printing, GSTR-1 & GSTR-3B export, and comprehensive role-based access control.',
                'features' => [
                    'GST invoices & e-way bills',
                    'Multi-branch inventory',
                    'Purchase & vendor management',
                    'Barcode + thermal printing',
                    'Profit, GSTR-1 & GSTR-3B reports',
                    'Role-based staff access',
                ],
                'tech' => ['React', 'Node.js', 'PostgreSQL'],
                'rating' => 4.9,
                'featured' => true,
            ],
            [
                'slug' => 'infistore-commerce',
                'name' => 'InfiStore Commerce',
                'tagline' => 'Multi-vendor eCommerce platform',
                'category_slug' => 'saas',
                'type' => 'software',
                'badge' => 'Popular',
                'cost_price' => 28000.00,
                'reseller_price' => 36000.00,
                'customer_price' => 44999.00,
                'whitelabel_price' => 179999.00,
                'demo_url' => 'https://demo.infiniforge.cloud/store',
                'demo_username' => 'demo@infiniforge.cloud',
                'demo_password' => 'demo1234',
                'image_url' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
                'short_description' => 'Launch a marketplace or D2C store with vendor onboarding, commissions, coupons, wallet, Razorpay/UPI payments and fast storefront.',
                'full_description' => 'Production-ready marketplace engine with native Indian payment gateways (Razorpay, Cashfree, UPI), Shiprocket courier sync, automatic vendor commission split, coupons, and wallet loyalty.',
                'features' => [
                    'Multi-vendor marketplace',
                    'UPI, Razorpay & COD',
                    'Coupons, wallet & loyalty',
                    'Shiprocket/Delhivery ready',
                    'SEO-optimised storefront',
                    'Android/iOS PWA app',
                ],
                'tech' => ['Next.js', 'Supabase', 'Stripe/Razorpay'],
                'rating' => 4.8,
                'featured' => true,
            ],
            [
                'slug' => 'infidesk-helpdesk',
                'name' => 'InfiDesk Helpdesk',
                'tagline' => 'Ticketing, SLA & customer portal',
                'category_slug' => 'saas',
                'type' => 'software',
                'badge' => 'Top Rated',
                'cost_price' => 15000.00,
                'reseller_price' => 19999.00,
                'customer_price' => 24999.00,
                'whitelabel_price' => 99999.00,
                'demo_url' => 'https://demo.infiniforge.cloud/desk',
                'demo_username' => 'demo@infiniforge.cloud',
                'demo_password' => 'demo1234',
                'image_url' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
                'short_description' => 'Omnichannel support desk with email-to-ticket, WhatsApp intake, SLA timers, routing rules and a branded customer portal.',
                'full_description' => 'Modern customer support software designed to reduce ticket resolution time. Includes knowledge base, canned responses, WhatsApp live agent handover, CSAT surveys, and detailed analytics.',
                'features' => [
                    'Email & WhatsApp ticketing',
                    'SLA timers & escalation',
                    'Automated routing rules',
                    'Knowledge base',
                    'CSAT surveys',
                    'Customer portal',
                ],
                'tech' => ['React', 'Supabase'],
                'rating' => 4.7,
                'featured' => false,
            ],
            [
                'slug' => 'infivoice-ai',
                'name' => 'InfiVoice AI Agent',
                'tagline' => 'AI voice calling & WhatsApp automation',
                'category_slug' => 'ai-voice-agent',
                'type' => 'software',
                'badge' => 'New',
                'cost_price' => 38000.00,
                'reseller_price' => 48000.00,
                'customer_price' => 59999.00,
                'whitelabel_price' => 249999.00,
                'demo_url' => 'https://demo.infiniforge.cloud/voice',
                'demo_username' => 'demo@infiniforge.cloud',
                'demo_password' => 'demo1234',
                'image_url' => 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
                'short_description' => 'AI agent that answers calls, qualifies leads, books appointments and follows up on WhatsApp with call recordings and transcripts.',
                'full_description' => 'Ultra-low-latency voice AI built for Indian enterprises. Supports English, Hindi, Telugu, Tamil, and Marathi. Connects to VoIP trunks, Twilio, Exotel, and seamlessly syncs recordings to CRM.',
                'features' => [
                    '24×7 AI inbound & outbound calls',
                    'Multilingual (EN/HI/TE/TA)',
                    'WhatsApp follow-up flows',
                    'Call transcripts & summaries',
                    'CRM & Google Calendar sync',
                    'Live human handover',
                ],
                'tech' => ['LLM', 'Twilio', 'n8n'],
                'rating' => 5.0,
                'featured' => true,
            ],
            [
                'slug' => 'infilearn-lms',
                'name' => 'InfiLearn LMS',
                'tagline' => 'Courses, quizzes & certificates',
                'category_slug' => 'saas',
                'type' => 'software',
                'badge' => 'High Demand',
                'cost_price' => 18000.00,
                'reseller_price' => 23999.00,
                'customer_price' => 29999.00,
                'whitelabel_price' => 119999.00,
                'demo_url' => 'https://demo.infiniforge.cloud/lms',
                'demo_username' => 'demo@infiniforge.cloud',
                'demo_password' => 'demo1234',
                'image_url' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
                'short_description' => 'Sell online courses with secure video, drip content, quizzes, watch-time tracking and auto-issued certificates.',
                'full_description' => 'Comprehensive learning management system for edtechs and coaching institutes. Includes video DRM, lesson drip scheduling, live class integration, and automated verifiable certificates.',
                'features' => [
                    'Secure video player',
                    'Quizzes with auto-grading',
                    'Watch-time gated certificates',
                    'Membership tiers',
                    'Coupons & wallet',
                    'Student mobile app',
                ],
                'tech' => ['React', 'Supabase'],
                'rating' => 4.8,
                'featured' => false,
            ],
            [
                'slug' => 'inficlinic-hms',
                'name' => 'InfiClinic HMS',
                'tagline' => 'Clinic & hospital management',
                'category_slug' => 'saas',
                'type' => 'software',
                'badge' => 'Enterprise',
                'cost_price' => 25000.00,
                'reseller_price' => 32000.00,
                'customer_price' => 39999.00,
                'whitelabel_price' => 159999.00,
                'demo_url' => 'https://demo.infiniforge.cloud/clinic',
                'demo_username' => 'demo@infiniforge.cloud',
                'demo_password' => 'demo1234',
                'image_url' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
                'short_description' => 'Appointments, OPD/IPD records, e-prescriptions, pharmacy stock, lab reports and insurance billing in one HIPAA-minded system.',
                'full_description' => 'Complete clinical workflow platform. Generates printable Rx with doctor signature, manages inventory in pharmacy, and automates patient appointment reminders via WhatsApp.',
                'features' => [
                    'Appointments & queue',
                    'e-Prescriptions',
                    'Pharmacy & lab modules',
                    'Insurance & GST billing',
                    'Doctor & patient apps',
                    'WhatsApp reminders',
                ],
                'tech' => ['React', 'PostgreSQL'],
                'rating' => 4.7,
                'featured' => false,
            ],
        ];

        foreach ($softwares as $sw) {
            $catId = $categoryMap[$sw['category_slug']] ?? null;

            $product = Product::updateOrCreate(
                ['slug' => $sw['slug']],
                [
                    'name' => $sw['name'],
                    'sku' => 'SW-' . strtoupper(Str::slug($sw['slug'])),
                    'category_id' => $catId,
                    'short_description' => $sw['short_description'],
                    'full_description' => $sw['full_description'],
                    'type' => 'license',
                    'status' => 'active',
                    'visibility' => 'public',
                    'featured' => $sw['featured'],
                    'stock_quantity' => 9999,
                    'track_stock' => false,
                    'specifications' => [
                        'tagline' => $sw['tagline'],
                        'tech_stack' => $sw['tech'],
                        'rating' => $sw['rating'],
                        'whitelabel_price_inr' => $sw['whitelabel_price'],
                    ],
                    'metadata' => [
                        'tagline' => $sw['tagline'],
                        'badge' => $sw['badge'],
                        'live_preview_url' => $sw['demo_url'],
                        'demo_url' => $sw['demo_url'],
                        'demo_username' => $sw['demo_username'],
                        'demo_password' => $sw['demo_password'],
                        'whitelabel_price_inr' => $sw['whitelabel_price'],
                        'features' => $sw['features'],
                        'tech' => $sw['tech'],
                        'rating' => $sw['rating'],
                        'license_type' => 'Software License',
                        'validity_days' => 365,
                    ],
                ]
            );

            // Seed Image
            $product->images()->updateOrCreate(
                ['is_primary' => true],
                ['path' => $sw['image_url'], 'alt_text' => $sw['name'], 'sort_order' => 0]
            );

            // Seed 3-Tier Price
            Price::updateOrCreate(
                ['priceable_type' => Product::class, 'priceable_id' => $product->id],
                [
                    'pricing_type' => 'fixed',
                    'cost_price' => $sw['cost_price'],
                    'reseller_price' => $sw['reseller_price'],
                    'customer_price' => $sw['customer_price'],
                    'currency' => 'INR',
                    'is_active' => true,
                ]
            );
        }

        // ─── 3. SEED 16 CORE CATALOG ITEMS ───────────────────────────────────────
        $catalogItems = [
            // Hosting & VPS
            [
                'kind' => 'service',
                'slug' => 'vps-starter',
                'name' => 'VPS Cloud — Starter',
                'category_slug' => 'hosting',
                'billing_interval' => 'monthly',
                'badge' => 'Popular',
                'cost_price' => 350.00,
                'reseller_price' => 450.00,
                'customer_price' => 599.00,
                'short_description' => '2 vCPU · 4 GB RAM · 80 GB NVMe · 2 TB bandwidth in Mumbai region.',
                'full_description' => 'High-performance KVM cloud server hosted in Mumbai tier-4 data center. Guaranteed hardware resources with NVMe read/write speeds over 3,000 MB/s.',
                'features' => ['Free daily backups', 'DDoS protection', '1-click OS deploy', '24×7 NOC support'],
                'image_url' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
                'featured' => true,
            ],
            [
                'kind' => 'service',
                'slug' => 'vps-pro',
                'name' => 'VPS Cloud — Pro',
                'category_slug' => 'hosting',
                'billing_interval' => 'monthly',
                'badge' => 'Pro Tier',
                'cost_price' => 1100.00,
                'reseller_price' => 1400.00,
                'customer_price' => 1799.00,
                'short_description' => '4 vCPU · 8 GB RAM · 160 GB NVMe · 4 TB bandwidth. Enterprise-grade.',
                'full_description' => 'Enterprise-grade compute instance engineered for high-concurrency production databases, microservices, and high-traffic portals.',
                'features' => ['Snapshot & clone', 'Private networking', 'Free migration', '99.99% SLA'],
                'image_url' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
                'featured' => true,
            ],
            [
                'kind' => 'service',
                'slug' => 'shared-hosting',
                'name' => 'Shared Hosting — Business',
                'category_slug' => 'hosting',
                'billing_interval' => 'monthly',
                'badge' => 'Budget Friendly',
                'cost_price' => 99.00,
                'reseller_price' => 149.00,
                'customer_price' => 199.00,
                'short_description' => 'Unlimited SSD storage, free .in domain, LiteSpeed powered.',
                'full_description' => 'Fast, optimized cPanel shared web hosting powered by LiteSpeed Enterprise server and LSCache. Free SSL on all hosted domains.',
                'features' => ['cPanel included', 'Free SSL', 'Unlimited email', 'Softaculous 400+ apps'],
                'image_url' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],

            // Domains & SSL
            [
                'kind' => 'product',
                'slug' => 'domain-in',
                'name' => '.IN Domain Registration',
                'category_slug' => 'domains',
                'type' => 'digital',
                'badge' => 'Made in India',
                'cost_price' => 399.00,
                'reseller_price' => 449.00,
                'customer_price' => 499.00,
                'short_description' => 'Register or transfer .in / .co.in domains with free WHOIS privacy.',
                'full_description' => 'Instant registration and DNS management for Indian businesses. Includes DNSSEC, free email forwarding, and theft-protection lock.',
                'features' => ['Free DNS management', 'Auto-renewal', 'Domain lock', 'Email forwarding'],
                'image_url' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],
            [
                'kind' => 'product',
                'slug' => 'ssl-wildcard',
                'name' => 'Wildcard SSL Certificate',
                'category_slug' => 'domains',
                'type' => 'license',
                'badge' => 'Best Value',
                'cost_price' => 2999.00,
                'reseller_price' => 3999.00,
                'customer_price' => 4999.00,
                'short_description' => 'Sectigo Wildcard SSL — secure your root & unlimited subdomains.',
                'full_description' => 'Complete encryption assurance for modern multi-tenant SaaS. Valid for *.yourdomain.com with 256-bit encryption and browser trust on 99.9% of devices.',
                'features' => ['256-bit encryption', '₹1.75 Cr warranty', 'SHA-2 & ECC', 'Free reissuance'],
                'image_url' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
                'featured' => true,
            ],

            // Website & App Dev
            [
                'kind' => 'service',
                'slug' => 'website-dev',
                'name' => 'Website Development Package',
                'category_slug' => 'development',
                'billing_interval' => 'one_time',
                'badge' => 'Featured',
                'cost_price' => 15000.00,
                'reseller_price' => 19999.00,
                'customer_price' => 24999.00,
                'short_description' => 'Custom 8-page responsive website with CMS, SEO and 3 months support.',
                'full_description' => 'Turnkey web engineering for businesses. Handcrafted in Next.js or WordPress with Google Core Web Vitals optimization and 100/100 performance scores.',
                'features' => ['Next.js + Tailwind', 'On-page SEO', 'Analytics setup', 'Dedicated PM'],
                'image_url' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
                'featured' => true,
            ],
            [
                'kind' => 'service',
                'slug' => 'android-app',
                'name' => 'Android App Development',
                'category_slug' => 'development',
                'billing_interval' => 'one_time',
                'badge' => 'Mobile',
                'cost_price' => 55000.00,
                'reseller_price' => 72000.00,
                'customer_price' => 89999.00,
                'short_description' => 'Native Android app — design, build, Play Store publish.',
                'full_description' => 'End-to-end mobile app lifecycle from Figma designs to Kotlin Jetpack Compose development and Google Play Console publication.',
                'features' => ['Kotlin / Jetpack', 'Push notifications', 'In-app purchase', '3 months support'],
                'image_url' => 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],

            // SaaS Applications
            [
                'kind' => 'service',
                'slug' => 'erp-suite',
                'name' => 'Infiniforge ERP Suite',
                'category_slug' => 'saas',
                'billing_interval' => 'monthly',
                'badge' => 'Cloud SaaS',
                'cost_price' => 1499.00,
                'reseller_price' => 1999.00,
                'customer_price' => 2499.00,
                'short_description' => 'Modular ERP — inventory, HR, accounts, GST invoicing, projects.',
                'full_description' => 'Cloud-hosted enterprise resource planner tailored for Indian GST rules, e-Invoicing, inventory re-ordering, and team payroll.',
                'features' => ['GST compliant', 'Multi-branch', 'Role-based access', 'Open API'],
                'image_url' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
                'live_preview_url' => 'https://demo.infiniforge.cloud/erp',
                'featured' => true,
            ],
            [
                'kind' => 'service',
                'slug' => 'crm-pro',
                'name' => 'Infiniforge CRM Pro',
                'category_slug' => 'saas',
                'billing_interval' => 'monthly',
                'badge' => 'Sales CRM',
                'cost_price' => 599.00,
                'reseller_price' => 799.00,
                'customer_price' => 999.00,
                'short_description' => 'Sales pipeline, WhatsApp CRM, lead scoring and automations.',
                'full_description' => 'Convert leads into paying customers faster with visual Kanban pipelines, automated WhatsApp greetings, and deal revenue forecasting.',
                'features' => ['WhatsApp integration', 'Kanban pipelines', 'Email sequences', 'Reports & forecasts'],
                'image_url' => 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
                'live_preview_url' => 'https://demo.infiniforge.cloud/crm',
                'featured' => false,
            ],
            [
                'kind' => 'product',
                'slug' => 'whitelabel-saas',
                'name' => 'White Label SaaS Platform',
                'category_slug' => 'saas',
                'type' => 'license',
                'badge' => 'Featured',
                'cost_price' => 120000.00,
                'reseller_price' => 159000.00,
                'customer_price' => 199000.00,
                'short_description' => 'Launch your own SaaS with our multi-tenant billing engine.',
                'full_description' => 'Full white-label SaaS platform with automated subdomain provisioning, custom branding, Razorpay payment gateway, and reseller management.',
                'features' => ['Your brand, your domain', 'Razorpay billing', 'Reseller module', 'Source access'],
                'image_url' => 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
                'live_preview_url' => 'https://demo.infiniforge.cloud',
                'featured' => true,
            ],

            // AI Automation
            [
                'kind' => 'service',
                'slug' => 'ai-agent',
                'name' => 'AI Automation Agent',
                'category_slug' => 'ai-automation',
                'billing_interval' => 'monthly',
                'badge' => 'New',
                'cost_price' => 8999.00,
                'reseller_price' => 11999.00,
                'customer_price' => 14999.00,
                'short_description' => 'Custom AI agent trained on your data — chat, voice or workflow.',
                'full_description' => 'Deploy autonomous generative AI agents connected to your private knowledge base, APIs, and company documents for 24/7 client operations.',
                'features' => ['LLM-agnostic', 'RAG + tools', 'n8n / Zapier ready', 'Private deployment'],
                'image_url' => 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
                'featured' => true,
            ],

            // IT Services
            [
                'kind' => 'service',
                'slug' => 'server-mgmt',
                'name' => 'Server Management (Linux)',
                'category_slug' => 'it-services',
                'billing_interval' => 'monthly',
                'badge' => 'Managed NOC',
                'cost_price' => 2400.00,
                'reseller_price' => 3199.00,
                'customer_price' => 3999.00,
                'short_description' => 'Full-stack Linux server management — patching, security, backups.',
                'full_description' => 'Let expert Linux engineers safeguard your servers 24/7. Includes kernel updates, firewall hardening, malware scans, and disaster recovery.',
                'features' => ['24×7 monitoring', 'Security hardening', 'Root cause reports', 'Unlimited tickets'],
                'image_url' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],

            // Monitoring & AMC
            [
                'kind' => 'service',
                'slug' => 'network-monitor',
                'name' => 'Network Monitoring Suite',
                'category_slug' => 'monitoring',
                'billing_interval' => 'monthly',
                'badge' => 'NOC Suite',
                'cost_price' => 1800.00,
                'reseller_price' => 2399.00,
                'customer_price' => 2999.00,
                'short_description' => 'Real-time network health, SNMP, uptime & alerting for 100 devices.',
                'full_description' => 'Monitor routers, switches, firewalls, and servers with sub-second ping latency, packet loss alarms, and instant WhatsApp alerts.',
                'features' => ['Custom dashboards', 'SMS / WhatsApp alerts', 'SLA reports', 'Multi-site'],
                'image_url' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],
            [
                'kind' => 'service',
                'slug' => 'amc-gold',
                'name' => 'Annual Maintenance — Gold AMC',
                'category_slug' => 'monitoring',
                'billing_interval' => 'yearly',
                'badge' => 'Popular',
                'cost_price' => 32000.00,
                'reseller_price' => 41000.00,
                'customer_price' => 49999.00,
                'short_description' => 'Annual maintenance contract with 4-hour on-site response.',
                'full_description' => 'Guaranteed uptime SLA with preventative health visits, security audits, and dedicated enterprise account manager.',
                'features' => ['Priority tickets', 'Quarterly audits', 'Free minor upgrades', 'Dedicated engineer'],
                'image_url' => 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
                'featured' => true,
            ],

            // Software Licenses
            [
                'kind' => 'product',
                'slug' => 'windows-license',
                'name' => 'Windows Server 2022 License',
                'category_slug' => 'licenses',
                'type' => 'license',
                'badge' => 'Genuine Key',
                'cost_price' => 24000.00,
                'reseller_price' => 28500.00,
                'customer_price' => 32999.00,
                'short_description' => 'Genuine Microsoft Windows Server 2022 Standard, 16-core license.',
                'full_description' => 'Permanent activation key for Microsoft Windows Server 2022 Standard edition. Includes official digital certificate and Microsoft validation.',
                'features' => ['Instant delivery', 'Lifetime validity', 'Original invoice', 'Activation support'],
                'image_url' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],
            [
                'kind' => 'service',
                'slug' => 'cpanel-license',
                'name' => 'cPanel Admin License',
                'category_slug' => 'licenses',
                'billing_interval' => 'monthly',
                'badge' => 'Instant IP',
                'cost_price' => 1600.00,
                'reseller_price' => 1899.00,
                'customer_price' => 2199.00,
                'short_description' => 'cPanel/WHM Admin license for up to 5 accounts on VPS.',
                'full_description' => 'Official authorized cPanel license tied to server IP. Instant automated activation and free IP transfer anytime.',
                'features' => ['Instant activation', 'Auto-renewal', 'IP change support', '24×7 support'],
                'image_url' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
                'featured' => false,
            ],
        ];

        foreach ($catalogItems as $item) {
            $catId = $categoryMap[$item['category_slug']] ?? null;

            if ($item['kind'] === 'service') {
                $service = Service::updateOrCreate(
                    ['slug' => $item['slug']],
                    [
                        'name' => $item['name'],
                        'category_id' => $catId,
                        'short_description' => $item['short_description'],
                        'full_description' => $item['full_description'],
                        'icon' => $item['image_url'],
                        'status' => 'active',
                        'visibility' => 'public',
                        'billing_type' => $item['billing_interval'] === 'one_time' ? 'one_time' : 'recurring',
                        'billing_interval' => in_array($item['billing_interval'], ['monthly', 'yearly', 'quarterly']) ? $item['billing_interval'] : 'monthly',
                        'featured' => $item['featured'],
                        'metadata' => [
                            'badge' => $item['badge'] ?? null,
                            'features' => $item['features'],
                            'live_preview_url' => $item['live_preview_url'] ?? null,
                            'image_url' => $item['image_url'],
                        ],
                    ]
                );

                $plan = ServicePlan::updateOrCreate(
                    ['slug' => $item['slug'] . '-base', 'service_id' => $service->id],
                    [
                        'name' => 'Standard Plan',
                        'status' => 'active',
                        'is_popular' => true,
                    ]
                );

                Price::updateOrCreate(
                    ['priceable_type' => ServicePlan::class, 'priceable_id' => $plan->id],
                    [
                        'pricing_type' => 'fixed',
                        'cost_price' => $item['cost_price'],
                        'reseller_price' => $item['reseller_price'],
                        'customer_price' => $item['customer_price'],
                        'currency' => 'INR',
                        'is_active' => true,
                    ]
                );
            } else {
                // Product
                $product = Product::updateOrCreate(
                    ['slug' => $item['slug']],
                    [
                        'name' => $item['name'],
                        'sku' => 'ITM-' . strtoupper(Str::slug($item['slug'])),
                        'category_id' => $catId,
                        'short_description' => $item['short_description'],
                        'full_description' => $item['full_description'],
                        'type' => $item['type'] ?? 'digital',
                        'status' => 'active',
                        'visibility' => 'public',
                        'featured' => $item['featured'],
                        'stock_quantity' => 9999,
                        'track_stock' => false,
                        'metadata' => [
                            'badge' => $item['badge'] ?? null,
                            'features' => $item['features'],
                            'live_preview_url' => $item['live_preview_url'] ?? null,
                            'license_type' => ($item['type'] ?? '') === 'license' ? 'Software License' : 'Digital',
                            'validity_days' => 365,
                        ],
                    ]
                );

                $product->images()->updateOrCreate(
                    ['is_primary' => true],
                    ['path' => $item['image_url'], 'alt_text' => $item['name'], 'sort_order' => 0]
                );

                Price::updateOrCreate(
                    ['priceable_type' => Product::class, 'priceable_id' => $product->id],
                    [
                        'pricing_type' => 'fixed',
                        'cost_price' => $item['cost_price'],
                        'reseller_price' => $item['reseller_price'],
                        'customer_price' => $item['customer_price'],
                        'currency' => 'INR',
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('Infiniforge catalog successfully seeded: 12 categories, 6 ready softwares, and 16 core products & services.');
    }
}
