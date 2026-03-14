/**
 * TemplateResolver: URL → Template + Data Injection
 * 
 * Simulates Shopify OS 2.0 dynamic routing.
 * Takes a URL path, resolves it to a template type and content slug,
 * then injects the appropriate data into StorefrontContext.
 *
 * DESIGN: Pure utility — no React dependency. Consumed by router-level code.
 */
import { storefrontStore, PRODUCT_CATALOG, COLLECTION_CATALOG } from '../../context/StorefrontContext';
import type { Product, Collection } from '../../context/StorefrontContext';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type TemplateType = 'index' | 'product' | 'collection' | 'page' | 'checkout' | 'thank-you' | 'admin' | '404';

export interface ResolvedTemplate {
    template: TemplateType;
    /** pageLayout key in the builder store */
    layoutId: string;
    /** The slug extracted from the URL */
    slug: string;
    /** The resolved product/collection data (if applicable) */
    data: {
        product?: Product | null;
        collection?: Collection | null;
    };
}

// ─── Route Patterns ───────────────────────────────────────────────────────────

interface RoutePattern {
    regex: RegExp;
    template: TemplateType;
    layoutPrefix: string;
    extractSlug: (match: RegExpMatchArray) => string;
}

const ROUTE_PATTERNS: RoutePattern[] = [
    {
        regex: /^\/products\/([a-z0-9-]+)\/?$/,
        template: 'product',
        layoutPrefix: 'template_product',
        extractSlug: (m) => m[1],
    },
    {
        regex: /^\/collections\/([a-z0-9-]+)\/?$/,
        template: 'collection',
        layoutPrefix: 'template_collection',
        extractSlug: (m) => m[1],
    },
    {
        regex: /^\/checkout\/?$/,
        template: 'checkout',
        layoutPrefix: 'checkout',
        extractSlug: () => '',
    },
    {
        regex: /^\/thank-you\/?/,
        template: 'thank-you',
        layoutPrefix: 'thank_you',
        extractSlug: () => '',
    },
    {
        regex: /^\/admin\/?$/,
        template: 'admin',
        layoutPrefix: 'admin',
        extractSlug: () => '',
    },
    {
        regex: /^\/?$/,
        template: 'index',
        layoutPrefix: 'home',
        extractSlug: () => '',
    },
    {
        regex: /^\/pages\/([a-z0-9-]+)\/?$/,
        template: 'page',
        layoutPrefix: 'page',
        extractSlug: (m) => m[1],
    },
];

// ─── Resolver ─────────────────────────────────────────────────────────────────

export class TemplateResolver {
    static resolve(path: string): ResolvedTemplate {
        const normalizedPath = path.toLowerCase().replace(/\/+$/, '') || '/';

        for (const pattern of ROUTE_PATTERNS) {
            const match = normalizedPath.match(pattern.regex);
            if (!match) continue;

            const slug = pattern.extractSlug(match);

            switch (pattern.template) {
                case 'product': {
                    const product = PRODUCT_CATALOG[slug] ?? null;
                    storefrontStore.setProduct(product);

                    return {
                        template: 'product',
                        layoutId: `${pattern.layoutPrefix}_default`,
                        slug,
                        data: { product },
                    };
                }

                case 'collection': {
                    const collection = COLLECTION_CATALOG[slug] ?? null;
                    storefrontStore.setCollection(collection);

                    return {
                        template: 'collection',
                        layoutId: `${pattern.layoutPrefix}_default`,
                        slug,
                        data: { collection },
                    };
                }

                case 'index': {
                    return {
                        template: 'index',
                        layoutId: 'home',
                        slug: '',
                        data: {},
                    };
                }

                case 'checkout': {
                    return {
                        template: 'checkout',
                        layoutId: 'checkout',
                        slug: '',
                        data: {},
                    };
                }

                case 'thank-you': {
                    return {
                        template: 'thank-you',
                        layoutId: 'thank_you',
                        slug: '',
                        data: {},
                    };
                }

                case 'admin': {
                    return {
                        template: 'admin',
                        layoutId: 'admin_dashboard',
                        slug: '',
                        data: {},
                    };
                }

                case 'page': {
                    return {
                        template: 'page',
                        layoutId: `${pattern.layoutPrefix}_${slug}`,
                        slug,
                        data: {},
                    };
                }
            }
        }

        return {
            template: '404',
            layoutId: 'page_404',
            slug: '',
            data: {},
        };
    }

    static getProductSlugs(): string[] {
        return Object.keys(PRODUCT_CATALOG);
    }

    static getCollectionSlugs(): string[] {
        return Object.keys(COLLECTION_CATALOG);
    }

    static isDynamicRoute(path: string): boolean {
        const result = this.resolve(path);
        return result.template === 'product' || result.template === 'collection';
    }
}
