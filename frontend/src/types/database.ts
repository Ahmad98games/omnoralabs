/**
 * 🏗️ OMNORA INDUSTRIAL SCHEMA TYPES (Task 7.3)
 * High-Availability Commerce Interface definitions.
 */

export interface Merchant {
    id: string;
    store_name: string;
    owner_email: string;
    created_at: string;
    updated_at: string;
}

export interface BlogPost {
    id: string;
    merchant_id: string;
    title: string;
    slug: string;
    content: any; // TipTap JSON
    status: 'draft' | 'published' | 'scheduled';
    seo_meta: {
        title?: string;
        description?: string;
        og_image?: string;
    };
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SocialConnection {
    id: string;
    merchant_id: string;
    platform: 'facebook' | 'tiktok' | 'pinterest';
    access_token_encrypted: string; // Base64 ciphertext (pgsodium)
    catalog_id: string | null;
    pixel_id: string | null;
    settings: any;
    created_at: string;
    updated_at: string;
}

export interface ShippingZone {
    id: string;
    merchant_id: string;
    name: string;
    countries: string[];
    rates: Array<{
        name: string;
        price_cents: number;
        conditions?: any;
    }>;
    created_at: string;
    updated_at: string;
}

export interface ProcessedWebhook {
    id: string;
    stripe_event_id: string;
    provider: string;
    status: string;
    created_at: string;
}

export interface AnalyticsEvent {
    id: string;
    merchant_id: string;
    session_id: string;
    event_type: string;
    product_id?: string;
    revenue_cents?: number;
    page_url: string;
    user_agent: string;
    created_at: string;
}
