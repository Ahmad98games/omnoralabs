/**
 * StorefrontCacheService.ts
 * 
 * Phase 45: Edge-Cached Data Fetching Layer
 * 
 * This service replaces direct Supabase/MongoDB calls for storefront
 * reads with requests to the Edge-cached /api/storefront/* endpoints.
 * 
 * Benefits:
 * - Responses are served from Vercel's CDN edge (< 50ms globally)
 * - Database is only hit once per 60-second window per unique URL
 * - Stale-while-revalidate ensures 0 downtime during cache refresh
 * 
 * Architecture:
 * ┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────┐
 * │ Browser  │───▶│ Vercel CDN  │───▶│ Serverless   │───▶│ MongoDB  │
 * │          │◀───│ (edge cache)│◀───│ (api/store.) │◀───│          │
 * └──────────┘    └─────────────┘    └──────────────┘    └──────────┘
 *                  Serves cached      Only executes       Only queried
 *                  for 60 seconds     on cache MISS       on cold start
 */

const STOREFRONT_BASE = '/api/storefront';

export interface StorefrontContentResponse {
    success: boolean;
    content: Record<string, unknown>;
    tenant_id: string;
    tenant_slug: string;
    _cache: { strategy: string; maxAge: number; swr: number };
}

export interface StorefrontProductsResponse {
    success: boolean;
    products: Array<Record<string, unknown>>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    _cache: { strategy: string; maxAge: number; swr: number };
}

export interface StorefrontSingleProductResponse {
    success: boolean;
    product: Record<string, unknown>;
    _cache: { strategy: string; maxAge: number; swr: number };
}

/**
 * Fetch the CMS layout/content for a storefront.
 * Served from Vercel CDN with s-maxage=60 ISR caching.
 */
export async function fetchStorefrontContent(
    tenantId: string
): Promise<StorefrontContentResponse> {
    const res = await fetch(
        `${STOREFRONT_BASE}/content?tenant=${encodeURIComponent(tenantId)}`,
        {
            headers: { 'x-tenant-id': tenantId },
        }
    );

    if (!res.ok) {
        throw new Error(`Storefront content fetch failed: ${res.status}`);
    }

    return res.json();
}

/**
 * Fetch the product catalog for a storefront.
 * Supports pagination, category filtering, and search.
 * Served from Vercel CDN with s-maxage=60 ISR caching.
 */
export async function fetchStorefrontProducts(
    tenantId: string,
    options: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    } = {}
): Promise<StorefrontProductsResponse> {
    const params = new URLSearchParams({
        tenant: tenantId,
        ...(options.page && { page: String(options.page) }),
        ...(options.limit && { limit: String(options.limit) }),
        ...(options.category && { category: options.category }),
        ...(options.search && { search: options.search }),
    });

    const res = await fetch(`${STOREFRONT_BASE}/products?${params}`, {
        headers: { 'x-tenant-id': tenantId },
    });

    if (!res.ok) {
        throw new Error(`Storefront products fetch failed: ${res.status}`);
    }

    return res.json();
}

/**
 * Fetch a single product by handle or ID.
 * Served from Vercel CDN with s-maxage=60 ISR caching.
 */
export async function fetchStorefrontProduct(
    tenantId: string,
    handleOrId: string
): Promise<StorefrontSingleProductResponse> {
    const res = await fetch(
        `${STOREFRONT_BASE}/product/${encodeURIComponent(handleOrId)}?tenant=${encodeURIComponent(tenantId)}`,
        {
            headers: { 'x-tenant-id': tenantId },
        }
    );

    if (!res.ok) {
        throw new Error(`Storefront product fetch failed: ${res.status}`);
    }

    return res.json();
}
