/**
 * DomainRouter: Custom Domain → Merchant Resolution
 *
 * Maps incoming hostnames to merchantIds for the live StorefrontApp.
 *
 * Resolution order:
 *   1. Custom domain lookup (e.g., www.calviro.com → merchant_abc)
 *   2. Subdomain parsing (e.g., my-store.omnora.com → my-store)
 *   3. URL parameter fallback (?store=my-store)
 *
 * In production, step 1 would query a DNS/domain mapping table
 * in Supabase/Cloudflare Workers. The mock uses a local registry.
 */

// ─── Custom Domain Registry (Mock) ───────────────────────────────────────────

interface DomainMapping {
    domain: string;
    merchantId: string;
    storeSlug: string;
}

/**
 * In production: this would be a DB table or KV store.
 * Merchants configure their custom domain in the admin panel,
 * which creates a CNAME → omnora CDN. This map resolves the request.
 */
const CUSTOM_DOMAIN_REGISTRY: DomainMapping[] = [
    { domain: 'www.calviro.com', merchantId: 'usr_calviro', storeSlug: 'calviro' },
    { domain: 'calviro.com', merchantId: 'usr_calviro', storeSlug: 'calviro' },
    { domain: 'shop.luxwatches.io', merchantId: 'usr_luxwatch', storeSlug: 'luxwatches' },
];

const OMNORA_DOMAINS = ['omnora.com', 'localhost', '127.0.0.1'];

// ─── Resolved Result ──────────────────────────────────────────────────────────

export interface DomainResolution {
    /** How the domain was resolved */
    method: 'custom-domain' | 'subdomain' | 'url-param' | 'default';
    /** The resolved merchantId (null if unknown) */
    merchantId: string | null;
    /** The store slug for cloud lookups */
    storeSlug: string | null;
    /** The full domain string (for StorefrontConfig lookup) */
    domain: string;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

export class DomainRouter {

    /**
     * Resolve the current request to a merchant.
     * Call this from StorefrontApp on mount.
     */
    static resolve(hostname?: string, searchParams?: string): DomainResolution {
        const host = (hostname || window.location.hostname).toLowerCase();
        const params = new URLSearchParams(searchParams || window.location.search);

        // 1. Custom domain lookup
        const customMatch = CUSTOM_DOMAIN_REGISTRY.find(
            d => d.domain === host
        );
        if (customMatch) {
            return {
                method: 'custom-domain',
                merchantId: customMatch.merchantId,
                storeSlug: customMatch.storeSlug,
                domain: `${customMatch.storeSlug}.omnora.com`,
            };
        }

        // 2. Subdomain parsing (my-store.omnora.com)
        const isOmnoraDomain = OMNORA_DOMAINS.some(d => host.endsWith(d));
        if (isOmnoraDomain) {
            const parts = host.split('.');
            // e.g., ['my-store', 'omnora', 'com']
            if (parts.length >= 3) {
                const slug = parts[0];
                if (slug !== 'www' && slug !== 'app') {
                    return {
                        method: 'subdomain',
                        merchantId: null, // resolved by getStoreConfigByDomain
                        storeSlug: slug,
                        domain: `${slug}.omnora.com`,
                    };
                }
            }
        }

        // 3. URL parameter fallback (?store=my-store)
        const storeParam = params.get('store') || params.get('storeId');
        if (storeParam) {
            return {
                method: 'url-param',
                merchantId: null,
                storeSlug: storeParam,
                domain: `${storeParam}.omnora.com`,
            };
        }

        // 4. Default: no specific store
        return {
            method: 'default',
            merchantId: null,
            storeSlug: null,
            domain: host,
        };
    }

    /**
     * Register a custom domain mapping at runtime (for merchant admin).
     * In production: POST to dashboard API → DNS provider.
     */
    static registerDomain(domain: string, merchantId: string, storeSlug: string): void {
        const normalized = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
        const existing = CUSTOM_DOMAIN_REGISTRY.findIndex(d => d.domain === normalized);
        const mapping: DomainMapping = { domain: normalized, merchantId, storeSlug };
        if (existing >= 0) {
            CUSTOM_DOMAIN_REGISTRY[existing] = mapping;
        } else {
            CUSTOM_DOMAIN_REGISTRY.push(mapping);
        }
        console.log(
            `%c[DomainRouter] 🌐 Domain registered: ${normalized} → ${storeSlug}`,
            'color: #34d399; font-weight: bold;'
        );
    }

    /**
     * Check if a hostname is a custom domain (not omnora/localhost).
     */
    static isCustomDomain(hostname?: string): boolean {
        const host = (hostname || window.location.hostname).toLowerCase();
        return !OMNORA_DOMAINS.some(d => host.endsWith(d) || host === d);
    }
}
