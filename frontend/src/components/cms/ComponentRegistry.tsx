import React from 'react';

/**
 * ComponentRegistry: Schema Defaults and Dynamic Splits
 * 
 * Maps component types to lazy-loaded components and defines DEFAULT props
 * to prevent crashes with legacy manifests flawlessly setups.
 */

export interface ComponentSchema {
    version: string;
    defaultProps: Record<string, any>;
}

export const DEFAULT_PROPS: Record<string, ComponentSchema> = {
    'hero_banner': {
        version: '2.1.0',
        defaultProps: {
            headline: 'Elevate Your Style',
            subheadline: 'Crafted for the modern connoisseur.',
            bgImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
            bgColor: '#0a0a0f',
            overlayOpacity: 0.55,
            alignment: 'center',
            ctaText: 'Shop Now',
            ctaLink: '#',
            ctaColor: '#7c6dfa',
            showCta: true,
        }
    },
    'product_grid': {
        version: '1.2.0',
        defaultProps: {
            columns: 3,
            gap: 20,
            limit: 12,
            showFilter: true,
            cardStyle: 'minimal',
            imageAspect: 'portrait',
            selectionMode: 'category',
        }
    },
    'WhatsAppFloating': {
        version: '1.0.0',
        defaultProps: {
            phoneNumber: '+1234567890',
            welcomeMessage: 'Hi! I am interested in your custom products.',
            position: 'right',
        }
    },
    'fomo_counter': {
        version: '1.5.0',
        defaultProps: {
            language: 'en',
            minUsers: 3,
            maxUsers: 12,
        }
    }
};

export const ComponentRegistry: Record<string, React.LazyExoticComponent<React.FC<any>> | React.FC<any>> = {
    'hero_banner': React.lazy(() => import('../blocks/HeroBanner').then(m => ({ default: m.HeroBanner }))),
    'product_grid': React.lazy(() => import('../cart/ProductGrid').then(m => ({ default: m.ProductGrid }))),
    'fomo_counter': React.lazy(() => import('../fomo/FomoCounter').then(m => ({ default: m.FomoCounter }))),
    
    // Lazily loaded to reduce initial HTML size (SSR/CSR splitting logic)
    'WhatsAppFloating': React.lazy(() => import('../blocks/WhatsAppFloating').then(m => ({ default: m.WhatsAppFloating })))
};