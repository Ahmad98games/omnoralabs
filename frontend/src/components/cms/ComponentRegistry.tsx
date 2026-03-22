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
            backgroundType: 'color',
            bgColor: '#f3f4f6',
            imageSrc: '',
            bgVideoUrl: '',
            overlayOpacity: 30,
            textAlign: 'center',
            minHeight: 400,
            buttonStyle: 'filled',
            buttonColor: '#7c6dfa',
            textColor: '#000000',
            ctaLabel: 'Shop Now',
            ctaUrl: '#',
        }
    },
    'split_hero': {
        version: '1.0.0',
        defaultProps: {
            imagePosition: 'right',
            splitRatio: 50,
            imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
            imageObjectFit: 'cover',
            headline: 'Crafted for the Modern Connoisseur',
            richText: 'Every piece in our collection tells a story of precision engineering and timeless design.',
            ctaText: 'Explore Collection',
            ctaLink: '#',
            ctaColor: '#7c6dfa',
        }
    },
    'product_grid': {
        version: '1.2.0',
        defaultProps: {
            columns: 3,
            gap: 20,
            productSource: 'auto',
            cardStyle: 'minimal',
            imageAspectRatio: 'portrait',
            showPrice: true,
            showAddToCart: true,
            showBadge: true,
        }
    },
    'featured_product': {
        version: '1.0.0',
        defaultProps: {
            productId: '',
            layout: 'media-left',
            mediaSize: 50,
            showDescription: true,
            showVariants: true,
            showReviews: true,
        }
    },
    'best_sellers': {
        version: '1.0.0',
        defaultProps: {
            title: 'Best Sellers',
            limit: 4,
            columns: 3,
            cardStyle: 'minimal',
            showPrice: true,
            showAddToCart: true,
        }
    },
    'recently_viewed': {
        version: '1.0.0',
        defaultProps: {
            title: 'Recently Viewed',
            limit: 4,
            emptyStateText: 'No history found...',
            persistAcrossSessions: true,
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
    },
    'store_header': {
        version: '1.0.0',
        defaultProps: {
            logoHeight: 40,
            showSearch: true,
            showCart: true,
            showAccountIcon: true,
            sticky: true,
            mobileBreakpoint: 'md',
            hamburgerStyle: 'lines',
            backgroundColor: '#000000',
            textColor: '#ffffff',
            borderBottom: true,
        }
    },
    'announcement_bar': {
        version: '1.0.0',
        defaultProps: {
            text: "Announcing Omnora OS!",
            dismissable: true,
            scrolling: false,
            showCountdown: false,
            backgroundColor: "#000000",
            textColor: "#ffffff",
        }
    },
    'cart_drawer': {
        version: '1.0.0',
        defaultProps: {
            triggerIcon: "bag",
            drawerPosition: "right",
            showProductImages: true,
            showQuantityControls: true,
            upsellEnabled: false,
            upsellTitle: "You Might Also Like",
            showFreeShippingBar: false,
            freeShippingThreshold: 50,
            checkoutButtonText: "Proceed to Checkout",
            checkoutButtonColor: "#7c6dfa"
        }
    },
    'checkout_block': {
        version: '1.0.0',
        defaultProps: {
            layout: "single-page",
            showOrderSummary: true,
            showPromoCode: true,
            showExpressCheckout: false,
            requirePhone: false,
            primaryColor: "#7c6dfa"
        }
    },
    'upsell_widget': {
        version: '1.0.0',
        defaultProps: {
            position: "pre-checkout",
            displayStyle: "inline",
            title: "Frequently Bought Together",
            maxProducts: 2,
            discountPercent: 10,
            backgroundColor: "#13131a"
        }
    },
    'trust_badges': {
        version: '1.0.0',
        defaultProps: {
            layout: "row",
            badgeStyle: "icon-text",
            iconSize: 32,
            iconColor: "#25D366",
            textColor: "#f0f0f5",
            backgroundColor: "#1a1a24",
            badges: [
                { "icon": "shield-check", "text": "Secure Checkout", "subtext": "256-bit SSL encrypted" },
                { "icon": "truck", "text": "Free Shipping", "subtext": "On all orders over $50" },
                { "icon": "return-arrow", "text": "Easy Returns", "subtext": "30-day money back guarantee" }
            ]
        }
    },
    'customer_reviews': {
        version: '1.0.0',
        defaultProps: {
            source: "manual",
            layout: "grid",
            columns: 2,
            showStarSummary: true,
            showVerifiedBadge: true,
            cardStyle: "flat",
            accentColor: "#fbbf24",
            reviews: [
                { "author": "Alice W.", "rating": 5, "content": "Amazing quality and fast shipping! Highly recommend.", "date": "1 day ago" },
                { "author": "James K.", "rating": 5, "content": "Exceeded my expectations, absolutely stunning aesthetic.", "date": "1 week ago" }
            ]
        }
    },
    'whatsapp_button': {
        version: '1.0.0',
        defaultProps: {
            phoneNumber: "1234567890",
            defaultMessage: "Hello, I have a question:",
            buttonLabel: "Chat on WhatsApp",
            position: "bottom-right",
            buttonColor: "#25D366",
            showPulse: true,
            "onlyShowOn": "all"
        }
    },
    'policy_strip': {
        version: '1.0.0',
        defaultProps: {
            layout: "row",
            separator: "dot",
            fontSize: "sm",
            policies: [
                { "label": "Refund Policy", "icon": "return-arrow", "linkUrl": "/refunds" },
                { "label": "Terms of Service", "icon": "lock", "linkUrl": "/terms" },
                { "label": "Privacy Policy", "icon": "shield-check", "linkUrl": "/privacy" }
            ]
        }
    },
    'text_section': {
        version: '1.0.0',
        defaultProps: {
            heading: "Our Story",
            headingSize: "md",
            body: "<p>We started with a simple idea: to bring better quality to your everyday life. Every piece is crafted with care and intention.</p>",
            ctaLabel: "Learn More",
            ctaUrl: "#",
            ctaStyle: "button",
            alignment: "center",
            maxWidth: 800,
            paddingY: 60
        }
    },
    'features_grid': {
        version: '1.0.0',
        defaultProps: {
            headline: "Why Choose Us",
            columns: 3,
            gap: 24,
            iconSize: 32,
            iconColor: "#7c6dfa",
            cardStyle: "bordered",
            features: [
                { "icon": "🚀", "title": "Lightning Delivery", "description": "Free express shipping over $50." },
                { "icon": "🛡️", "title": "Secure Checkout", "description": "100% encrypted online payment." },
                { "icon": "⭐", "title": "Premium Quality", "description": "Handcrafted for lifetime durability." }
            ]
        }
    },
    'image_block': {
        version: '1.0.0',
        defaultProps: {
            src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
            alt: "Product Showcase",
            width: "contained",
            height: 400,
            objectFit: "cover",
            borderRadius: 12
        }
    },
    'faq_accordion': {
        version: '1.0.0',
        defaultProps: {
            title: "Frequently Asked Questions",
            defaultOpen: 0,
            allowMultiple: false,
            iconStyle: "plus-minus",
            borderStyle: "full",
            headingColor: "#f0f0f5",
            accentColor: "#7c6dfa",
            faqs: [
                { "question": "What is your return policy?", "answer": "<p>We offer a 30-day hassle-free return policy on all items.</p>" },
                { "question": "How do I track my order?", "answer": "<p>You will receive a confirmation email with a tracking number once shipped.</p>" }
            ]
        }
    },
    'site_footer': {
        version: '1.0.0',
        defaultProps: {
            logoSrc: "",
            logoAlt: "Omnora",
            tagline: "Stay in the loop",
            backgroundColor: "#0a0a12",
            textColor: "#e8e8f0",
            linkHoverColor: "#7c6dfa",
            dividerColor: "#1e1e3a",
            paddingY: 64,
            maxColumns: 3,
            showNewsletter: true,
            newsletterHeading: "Stay in the loop",
            newsletterPlaceholder: "Enter your email",
            newsletterButtonText: "Subscribe",
            copyrightText: "© 2025 Your Store",
            columns: [
                { "heading": "Shop", "links": [{ "label": "New Arrivals", "url": "#" }] },
                { "heading": "Help", "links": [{ "label": "Contact Us", "url": "#" }] }
            ],
            socialLinks: []
        }
    },
    'countdown_timer': {
        version: '1.0.0',
        defaultProps: {
            endDate: "2026-12-31T23:59:59Z",
            style: "boxed",
            expiredText: "This offer has ended",
            expiredAction: "show-text",
            digitColor: "#7c6dfa",
            labelColor: "#5a5a70",
            backgroundColor: "#13131a",
            digitBackground: "rgba(124, 109, 250, 0.1)",
            labelDays: "Days",
            labelHours: "Hours",
            labelMinutes: "Minutes",
            labelSeconds: "Seconds"
        }
    },
    'promo_strip': {
        version: '1.0.0',
        defaultProps: {
            items: [{ "text": "Free shipping on orders over $50", "link": "" }],
            rotationInterval: 4000,
            backgroundColor: "#7c6dfa",
            "textColor": "#ffffff",
            height: 44,
            animationType: "slide"
        }
    }
};

export const ComponentRegistry: Record<string, React.LazyExoticComponent<React.FC<any>> | React.FC<any>> = {
    'hero_banner': React.lazy(() => import('../blocks/HeroBanner').then(m => ({ default: m.HeroBanner }))),
    'split_hero': React.lazy(() => import('../blocks/SplitHero').then(m => ({ default: m.SplitHero }))),
    'product_grid': React.lazy(() => import('../cart/ProductGrid').then(m => ({ default: m.ProductGrid }))),
    'featured_product': React.lazy(() => import('../cart/FeaturedProduct').then(m => ({ default: m.FeaturedProduct }))),
    'best_sellers': React.lazy(() => import('../cart/ProductGrid').then(m => ({ default: m.ProductGrid }))),
    'recently_viewed': React.lazy(() => import('../cart/RecentlyViewed').then(m => ({ default: m.RecentlyViewed }))),
    'fomo_counter': React.lazy(() => import('../fomo/FomoCounter').then(m => ({ default: m.FomoCounter }))),
    'store_header': React.lazy(() => import('../cart/StoreHeader').then(m => ({ default: m.StoreHeader }))),
    'announcement_bar': React.lazy(() => import('../blocks/AnnouncementBar').then(m => ({ default: m.AnnouncementBar }))),
    'cart_drawer': React.lazy(() => import('../cart/CartDrawer').then(m => ({ default: m.CartDrawer }))),
    'checkout_block': React.lazy(() => import('../cart/CheckoutBlock').then(m => ({ default: m.CheckoutBlock }))),
    'upsell_widget': React.lazy(() => import('../blocks/UpsellWidget').then(m => ({ default: m.UpsellWidget }))),
    'trust_badges': React.lazy(() => import('../blocks/TrustBadges').then(m => ({ default: m.TrustBadges }))),
    'customer_reviews': React.lazy(() => import('../blocks/CustomerReviews').then(m => ({ default: m.CustomerReviews }))),
    'policy_strip': React.lazy(() => import('../blocks/PolicyStrip').then(m => ({ default: m.PolicyStrip }))),
    'whatsapp_button': React.lazy(() => import('../blocks/WhatsAppFloating').then(m => ({ default: m.WhatsAppFloating }))),
    'text_section': React.lazy(() => import('../blocks/TextSection').then(m => ({ default: m.TextSection }))),
    'features_grid': React.lazy(() => import('../blocks/FeaturesGrid').then(m => ({ default: m.FeaturesGrid }))),
    'image_block': React.lazy(() => import('../blocks/ImageBlock').then(m => ({ default: m.ImageBlock }))),
    'faq_accordion': React.lazy(() => import('../blocks/FAQAccordion').then(m => ({ default: m.FAQAccordion }))),
    'site_footer': React.lazy(() => import('../blocks/SiteFooter').then(m => ({ default: m.SiteFooter }))),
    'countdown_timer': React.lazy(() => import('../blocks/CountdownTimer').then(m => ({ default: m.CountdownTimer }))),
    'promo_strip': React.lazy(() => import('../blocks/PromoStrip').then(m => ({ default: m.PromoStrip })))
};