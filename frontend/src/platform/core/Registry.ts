import React from 'react';
import { Logger } from './Logger';

/**
 * BLOCK_TYPES: Single source of truth for all Omnora element types.
 */
export const BLOCK_TYPES = {
    CONTAINER: 'container',
    SPACER: 'spacer',
    FALLBACK: 'fallback',
    HERO: 'hero',
    HERO_SPLIT: 'hero_split',
    TEXT_BLOCK: 'text_block',
    PROMO_BANNER: 'promo_banner',
    PRODUCT_GRID: 'product_grid',
    BEST_SELLERS: 'best_sellers',
    VARIANT_SELECTOR: 'variant_selector',
    BUY_NOW: 'buy_now',
    CART_DRAWER: 'cart_drawer',
    CHECKOUT_BLOCK: 'checkout_block',
    TRUST_SEALS: 'trust_seals',
    POLICY_BLOCK: 'policy_block',
    MEGAMENU: 'megamenu',
    SMART_SEARCH: 'smart_search',
    RECENTLY_VIEWED: 'recently_viewed',
    UPSELL_BUNDLE: 'upsell_bundle',
    GEO_SWITCHER: 'geo_switcher',
    MEDIA_GALLERY: 'media_gallery',
    FEATURE_GRID_V5: 'feature_grid_v5',
    // ─── Builder/Legacy Compatibility Aliases ───
    TRUST_BADGES: 'trust_badges',
    REVIEW_BLOCK: 'review_block',
    HEADER: 'header',
    FOOTER: 'footer',
    ANNOUNCEMENT_BAR: 'announcement_bar',
    COUNTDOWN_BANNER: 'countdown_banner',
    FEATURED_PRODUCT: 'featured_product',
    UPSELL_WIDGET: 'upsell_widget',
    WHATSAPP_BUTTON: 'whatsapp_button',
    FEATURE_BLOCK: 'feature_block',
    IMAGE_BLOCK: 'image_block',
    FAQ_BLOCK: 'faq_block',
    NEWSLETTER: 'newsletter',
    // ─── Legacy & Aliases ───
    HERO_SECTION: 'hero_section',
    TEXT: 'text',
    PRODUCTS: 'products',
    TRUST_SECTION: 'trust_section',
    REVIEWS: 'reviews',
    PRODUCT_GALLERY_GRID: 'product_gallery_grid'
} as const;

export type BlockType = typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES];

export type BlockCapability =
    | 'layout'
    | 'interactive'
    | 'data-bound'
    | 'critical'
    | 'client-only'
    | 'commerce-aware'
    | 'data-fetching'
    | 'SEO-critical'
    | 'analytics-critical'
    | 'lazy-hydratable'
    | 'requires-auth'
    | 'personalization-aware'
    | 'routing-enabled'
    | 'supports-nesting'
    | 'stateful'
    | 'server-driven'
    | 'trust-aware';

export interface PropSchemaField {
    type: 'text' | 'number' | 'color' | 'image' | 'boolean' | 'select' | 'slider' | 'link' | 'list';
    label: string;
    options?: string[];
    default?: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    validation?: (val: any) => boolean | string;
}

export type PropSchema = Record<string, PropSchemaField>;

export interface BlockProps {
    data?: any;
    nodeId: string;
    children?: React.ReactNode;
}

export interface RegistryEntry {
    type: string;
    component: React.ComponentType<BlockProps>;
    defaultProps: Record<string, any>;
    schemaVersion: number;
    propSchema?: PropSchema;
    capabilities?: BlockCapability[];
    migrate?: (oldNode: any) => any;
    validate?: (props: any) => boolean;
    patchImpactMap?: Record<string, 'visual-local' | 'visual-contextual' | 'structural'>;
    metadata?: {
        label: string;
        category: 'Layout' | 'Marketing' | 'Commerce' | 'Trust' | 'Navigation' | 'Discovery';
    };
}

// Global registry state
const registry: Record<string, RegistryEntry> = {};
let isLocked = false;

/**
 * Marks the platform as ready and locks the registry to prevent runtime mutation.
 */
export const lockRegistry = () => {
    isLocked = true;
    Logger.info('Registry locked. Lifecycle transition to IMMUTABLE.');
};

/**
 * Retrieves the entire registry. Throws if not initialized in production.
 */
export const getRegistry = () => {
    if (!isLocked && process.env.NODE_ENV === 'production') {
        throw new Error('[Omnora Registry] BOOT_SEQUENCE_ERROR: Registry accessed before lockRegistry(). Call initializePlatformRegistry() first.');
    }
    return registry;
};

/**
 * Register a component with its contract.
 */
export const registerBlock = (entry: RegistryEntry) => {
    if (isLocked) {
        Logger.error(`ILLEGAL_REGISTRATION: Attempted to register block "${entry.type}" after registry lock.`);
        throw new Error(`[Omnora Registry] LIFECYCLE_ERROR: Cannot register blocks after initialization.`);
    }

    if (!entry.type) throw new Error('[Omnora Registry] REGISTRATION_ERROR: Block type is required.');

    registry[entry.type] = entry;
};

/**
 * Helper to register a simple component with defaults
 */
export const registerComponent = (type: string, component: React.ComponentType<BlockProps> | Partial<RegistryEntry>) => {
    if (typeof component === 'function') {
        registerBlock({
            type,
            component,
            defaultProps: {},
            schemaVersion: 1
        });
    } else {
        registerBlock({
            type,
            component: component.component as any,
            defaultProps: component.defaultProps || {},
            schemaVersion: component.schemaVersion || 1,
            ...component
        } as RegistryEntry);
    }
};

/**
 * Retrieves the registry entry for a given type. Returns a fallback if missing.
 */
export const getRegistryEntry = (type: BlockType | string): RegistryEntry | undefined => {
    const entry = registry[type];
    if (!entry && isLocked) {
        Logger.warn(`MISSING_BLOCK: Component "${type}" is not registered. Returning fallback.`);
        return registry[BLOCK_TYPES.FALLBACK];
    }
    return entry;
};
