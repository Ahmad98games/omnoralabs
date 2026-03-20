import React from 'react';

/**
 * ComponentRegistry: Schema Defaults and Dynamic Splits
 * 
 * Maps component types to lazy-loaded components and defines DEFAULT props
 * to prevent crashes with legacy manifests flawlessly setups.
 */

export const DEFAULT_PROPS: Record<string, any> = {
    'hero_banner': {
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
    },
    'product_grid': {
        columns: 3,
        gap: 20,
        limit: 12,
        showFilter: true,
        cardStyle: 'minimal',
        imageAspect: 'portrait',
        selectionMode: 'category',
    },
    'WhatsAppFloating': {
        phoneNumber: '+1234567890',
        welcomeMessage: 'Hi! I am interested in your custom products.',
        position: 'right',
    }
};

export const ComponentRegistry: Record<string, React.LazyExoticComponent<React.FC<any>> | React.FC<any>> = {
    'hero_banner': React.lazy(() => import('../blocks/HeroBanner').then(m => ({ default: m.HeroBanner }))),
    'product_grid': React.lazy(() => import('../cart/ProductGrid').then(m => ({ default: m.ProductGrid }))),
    
    // Inline rendering for WhatsAppFloating to fulfil specs flawlessly setup
    'WhatsAppFloating': (props: any) => {
        const { phoneNumber, welcomeMessage, position = 'right' } = props;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(welcomeMessage || '')}`;
        return (
            <a 
                href={url} 
                target="_blank" 
                rel="noreferrer"
                style={{
                    position: 'fixed', bottom: '24px', [position]: '24px',
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: '#25D366', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999,
                    fontSize: '24px', textDecoration: 'none'
                }}
            >
                💬
            </a>
        );
    }
};
