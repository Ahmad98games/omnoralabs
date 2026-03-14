/**
 * OMNORA PLATFORM BOOTSTRAP
 * 
 * Explicit lifecycle management for the platform registry.
 */

import React from 'react';
import { registerBlock, lockRegistry, BLOCK_TYPES } from '../core/Registry';
import { Logger } from '../core/Logger';

// Standard Blocks
import {
    HeroBlock,
    TextContentBlock,
    ProductGridBlock,
    SpacerBlock
} from '../library/Blocks';

// Engine Modules
import {
    OmnoraMegaMenu,
    OmnoraSmartSearch
} from '../library/modules/DiscoveryEngine';
import {
    OmnoraProductGrid,
    OmnoraMediaGallery,
    OmnoraVariantSelector
} from '../library/modules/SelectionEngine';
import {
    OmnoraCartDrawer,
    OmnoraBuyNowButton
} from '../library/modules/TransactionPipeline';
import {
    OmnoraTrustSeals,
    OmnoraPolicyBlock
} from '../library/modules/TrustEngine';
import {
    OmnoraRecentlyViewed,
    OmnoraUpsellBundle,
    OmnoraGeoSwitcher
} from '../library/modules/IntelligenceModules';

/**
 * initializePlatformRegistry: Explicitly invoked to populate the engine contracts.
 */
export const initializePlatformRegistry = () => {
    // ─── Layout & Internal ───────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.SPACER,
        component: SpacerBlock,
        defaultProps: { height: '40px' },
        schemaVersion: 1,
        capabilities: ['layout'],
        propSchema: {
            height: { type: 'text', label: 'Vertical Height (px/vh)' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.CONTAINER,
        component: HeroBlock,
        defaultProps: {},
        schemaVersion: 1,
        capabilities: ['layout', 'supports-nesting']
    });

    // ─── Navigation ──────────────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.HEADER,
        component: HeroBlock, // Placeholder until specialized HeaderModule is integrated
        defaultProps: { sticky: 'sticky', transparency: false },
        schemaVersion: 1,
        capabilities: ['commerce-aware', 'interactive', 'SEO-critical', 'routing-enabled'],
        propSchema: {
            sticky: { type: 'select', label: 'Sticky Behavior', options: ['static', 'sticky', 'reveal'] },
            transparency: { type: 'boolean', label: 'Transparent on Hero' },
            searchIntegration: { type: 'select', label: 'Search Mode', options: ['live', 'overlay', 'redirect'] }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.ANNOUNCEMENT_BAR,
        component: HeroBlock,
        defaultProps: { autoRotate: true, interval: 5000 },
        schemaVersion: 1,
        capabilities: ['interactive', 'personalization-aware', 'server-driven'],
        propSchema: {
            autoRotate: { type: 'boolean', label: 'Auto-Rotate Messages' },
            interval: { type: 'number', label: 'Rotation Interval (ms)' },
            persistence: { type: 'select', label: 'Dismissal Persistence', options: ['session', 'permanent', 'none'] }
        }
    });

    // ─── Hero & Banners ──────────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.HERO,
        component: HeroBlock,
        defaultProps: { layout: 'background', height: '80vh' },
        schemaVersion: 1,
        capabilities: ['layout', 'interactive', 'SEO-critical', 'analytics-critical'],
        propSchema: {
            layout: { type: 'select', label: 'Layout Style', options: ['background', 'left', 'right'] },
            height: { type: 'text', label: 'Section Height' },
            ctaText: { type: 'text', label: 'CTA Button Text' },
            loadingPriority: { type: 'select', label: 'LCP Optimization', options: ['eager', 'lazy'] }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.HERO_SPLIT,
        component: HeroBlock,
        defaultProps: { splitRatio: '50/50' },
        schemaVersion: 1,
        capabilities: ['layout', 'SEO-critical'],
        propSchema: {
            splitRatio: { type: 'select', label: 'Split Ratio', options: ['50/50', '60/40', '40/60'] },
            stackOrder: { type: 'select', label: 'Mobile Stack Order', options: ['media-first', 'content-first'] }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.PROMO_BANNER,
        component: HeroBlock,
        defaultProps: { scarcitySignal: true },
        schemaVersion: 1,
        capabilities: ['personalization-aware', 'interactive', 'analytics-critical'],
        propSchema: {
            text: { type: 'text', label: 'Promo Text' },
            scarcitySignal: { type: 'boolean', label: 'Enable Scarcity Signals' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.COUNTDOWN_BANNER,
        component: HeroBlock,
        defaultProps: { precision: 'seconds' },
        schemaVersion: 1,
        capabilities: ['stateful', 'commerce-aware'],
        propSchema: {
            targetDate: { type: 'text', label: 'Target ISO Date' },
            expiryAction: { type: 'select', label: 'On Expiry', options: ['hide', 'showMessage', 'redirect'] },
            precision: { type: 'select', label: 'Timer Precision', options: ['seconds', 'minutes'] }
        }
    });

    // ─── Commerce & Products ─────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.PRODUCT_GRID,
        component: OmnoraProductGrid,
        defaultProps: { limit: 8, columns: 4, pagination: 'load-more' },
        schemaVersion: 1,
        capabilities: ['commerce-aware', 'data-fetching', 'lazy-hydratable', 'server-driven'],
        propSchema: {
            title: { type: 'text', label: 'Grid Title' },
            limit: { type: 'number', label: 'Products Limit' },
            columns: { type: 'number', label: 'Columns Count' },
            category: { type: 'text', label: 'Category Filter (slug)' },
            paginationStrategy: { type: 'select', label: 'Pagination', options: ['infinite-scroll', 'load-more', 'pagination'] }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.FEATURED_PRODUCT,
        component: HeroBlock,
        defaultProps: { variantPreselect: 'first-available' },
        schemaVersion: 1,
        capabilities: ['commerce-aware', 'interactive', 'stateful'],
        propSchema: {
            productId: { type: 'text', label: 'Product ID/Handle' },
            variantPreselect: { type: 'select', label: 'Preselect Logic', options: ['first-available', 'lowest-price'] },
            dynamicInventory: { type: 'boolean', label: 'Real-time Inventory' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.RECENTLY_VIEWED,
        component: OmnoraRecentlyViewed,
        defaultProps: { limit: 4 },
        schemaVersion: 1,
        capabilities: ['client-only', 'personalization-aware', 'data-bound'],
        propSchema: {
            limit: { type: 'number', label: 'History Limit' },
            anonymization: { type: 'boolean', label: 'GDPR Anonymization' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.CART_DRAWER,
        component: OmnoraCartDrawer,
        defaultProps: { shippingMeter: 100 },
        schemaVersion: 1,
        capabilities: ['commerce-aware', 'stateful', 'interactive', 'analytics-critical'],
        propSchema: {
            freeShippingThreshold: { type: 'number', label: 'Free Shipping Threshold' },
            upsellLogic: { type: 'select', label: 'Upsell Strategy', options: ['recommendation-api', 'manual'] }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.CHECKOUT_BLOCK,
        component: HeroBlock,
        defaultProps: { expressCheckout: true },
        schemaVersion: 1,
        capabilities: ['critical', 'commerce-aware', 'requires-auth'],
        propSchema: {
            enforceAuth: { type: 'boolean', label: 'Require Login' },
            expressCheckoutPriority: { type: 'select', label: 'Primary Payment', options: ['ApplePay', 'GooglePay', 'PayPal'] }
        }
    });

    // ─── Trust & Social ──────────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.TRUST_SEALS,
        component: OmnoraTrustSeals,
        defaultProps: { badgeSet: 'payments' },
        schemaVersion: 1,
        capabilities: ['trust-aware'],
        propSchema: {
            badgeSet: { type: 'select', label: 'Badge Collection', options: ['payments', 'security', 'shipping', 'custom'] },
            tooltipSync: { type: 'boolean', label: 'Enable Policy Tooltips' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.REVIEW_BLOCK,
        component: HeroBlock,
        defaultProps: { provider: 'Omnora', schemaMarkup: true },
        schemaVersion: 1,
        capabilities: ['SEO-critical', 'data-fetching'],
        propSchema: {
            provider: { type: 'select', label: 'Review Provider', options: ['Omnora', 'Yotpo', 'Trustpilot'] },
            schemaMarkup: { type: 'boolean', label: 'Inject JSON-LD Schema' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.WHATSAPP_BUTTON,
        component: HeroBlock,
        defaultProps: { initialMessage: 'Hello, I have a question about...' },
        schemaVersion: 1,
        capabilities: ['interactive'],
        propSchema: {
            phoneNumber: { type: 'text', label: 'WhatsApp Number' },
            initialMessage: { type: 'text', label: 'Default Message' }
        }
    });

    // ─── Content & Footer ────────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.FAQ_BLOCK,
        component: HeroBlock,
        defaultProps: { schemaInjection: true },
        schemaVersion: 1,
        capabilities: ['SEO-critical', 'interactive'],
        propSchema: {
            schemaInjection: { type: 'boolean', label: 'SEO FAQ Schema' },
            multiOpen: { type: 'boolean', label: 'Allow Multiple Open' }
        }
    });

    registerBlock({
        type: BLOCK_TYPES.NEWSLETTER,
        component: HeroBlock,
        defaultProps: { providerSync: 'internal' },
        schemaVersion: 1,
        capabilities: ['interactive', 'analytics-critical'],
        propSchema: {
            providerSync: { type: 'select', label: 'Mailing List Provider', options: ['Klaviyo', 'Mailchimp', 'internal'] },
            successAction: { type: 'select', label: 'Success Feedback', options: ['redirect', 'message', 'reveal-code'] }
        }
    });

    // ─── Resilience ──────────────────────────────────────────
    registerBlock({
        type: BLOCK_TYPES.FALLBACK,
        component: ({ nodeId, props }: any) => (
            <div data-node-id={nodeId} style={{
                padding: '20px', background: 'rgba(255,0,0,0.05)',
                border: '1px dashed #f00', borderRadius: '8px',
                color: '#f00', fontSize: '11px', fontWeight: 600,
                display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
                <div style={{ textTransform: 'uppercase', opacity: 0.8 }}>[OMNORA] Component Missing or Corrupted</div>
                <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>Type: {props?.originalType || 'Unknown'}</div>
            </div>
        ),
        defaultProps: {},
        schemaVersion: 1
    });

    lockRegistry();

    if (process.env.NODE_ENV === 'development') {
        Logger.info('Bootstrap Complete. Engine lifecycle transition: READY.');
    }
};
