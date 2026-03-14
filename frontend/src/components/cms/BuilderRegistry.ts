import { RegistryEntry, BlockProps, BlockType as SectionType, BLOCK_TYPES } from '../../platform/core/Registry';

// In dono ko export karna zaroori hai BuilderContext ke liye
export const SECTION_TYPES = BLOCK_TYPES;
export type { SectionType, RegistryEntry, BlockProps };

const registry: Record<string, RegistryEntry> = {};

/**
 * Register a component with its metadata.
 */
export const registerComponent = (
    type: SectionType | string,
    definition: Partial<RegistryEntry> & { component: React.ComponentType<BlockProps> }
) => {
    const { component, ...restOfDefinition } = definition;

    registry[type] = {
        type: type as string,
        component,
        defaultProps: definition.defaultProps || {},
        schemaVersion: definition.schemaVersion || 1,
        patchImpactMap: {
            ...definition.patchImpactMap
        },
        ...restOfDefinition
    } as RegistryEntry;
};

// --- GETTERS (Sirf ek baar yahan export honge) ---
export const getRegistry = () => registry;
export const getRegistryEntry = (type: SectionType | string) => registry[type];

// --- COMPONENT REGISTRATIONS START ---

// 1. Product Grid (Collection Display Block)
import { ProductGrid } from '../cart/ProductGrid';
registerComponent('product_grid', {
    component: ProductGrid as any,
    defaultProps: {
        columns: 3, gap: 20, limit: 12, showFilter: true,
        cardStyle: 'minimal', imageAspect: 'portrait',
        selectionMode: 'category', categorySlug: '', productIds: [],
    },
    propSchema: {
        columns: { label: 'Columns Count', type: 'number', min: 1, max: 6 },
        gap: { label: 'Grid Gap', type: 'slider', min: 0, max: 60, step: 4, unit: 'px' },
        limit: { label: 'Products Limit', type: 'number', min: 1, max: 50 },
        showFilter: { label: 'Show Sort Filter', type: 'boolean' },
        cardStyle: {
            label: 'Card Style',
            type: 'select',
            options: ['minimal', 'cinematic-dark', 'outlined'],
        },
        imageAspect: {
            label: 'Image Aspect Ratio',
            type: 'select',
            options: ['portrait', 'square', 'widescreen'],
        },
    }
});

// 2. Review Block
registerComponent('review_block', {
    component: () => null,
    defaultProps: { provider: 'Omnora', injectSchema: false },
    propSchema: {
        provider: {
            label: 'Review Provider',
            type: 'select',
            options: ['Omnora', 'Trustpilot', 'Google']
        },
        injectSchema: { label: 'Inject JSON-LD Schema', type: 'boolean' }
    }
});

// 3. Store Header
registerComponent('header', {
    component: () => null,
    defaultProps: { sticky: 'static', transparent: false, searchMode: 'live' },
    propSchema: {
        sticky: {
            label: 'Sticky Behavior',
            type: 'select',
            options: ['static', 'sticky', 'fixed']
        },
        transparent: { label: 'Transparent on Hero', type: 'boolean' },
        searchMode: {
            label: 'Search Mode',
            type: 'select',
            options: ['live', 'static', 'disabled']
        }
    }
});

// 4. Featured Product
registerComponent('featured_product', {
    component: () => null,
    defaultProps: { productId: '', preselectLogic: 'first-available', showInventory: false },
    propSchema: {
        productId: { label: 'Product ID/Handle', type: 'text' },
        preselectLogic: {
            label: 'Preselect Logic',
            type: 'select',
            options: ['first-available', 'manual']
        },
        showInventory: { label: 'Real-time Inventory', type: 'boolean' }
    }
});

// 5. Buy Button (E-commerce Smart Block)
import { BuyButton } from '../cart/BuyButton';
registerComponent('buy_button', {
    component: BuyButton as any,
    defaultProps: {
        buttonText: 'Add to Cart',
        buttonColor: '#7c6dfa',
        textColor: '#ffffff',
        size: 'medium',
        fullWidth: true,
        showPrice: true,
    },
    propSchema: {
        buttonText: { label: 'Button Text', type: 'text' },
        buttonColor: { label: 'Button Color', type: 'color' },
        textColor: { label: 'Text Color', type: 'color' },
        size: {
            label: 'Size',
            type: 'select',
            options: ['small', 'medium', 'large'],
        },
        fullWidth: { label: 'Full Width', type: 'boolean' },
        showPrice: { label: 'Show Price', type: 'boolean' },
    },
});

// 6. Product Options (Variant Selector Block)
import { ProductOptions } from '../cart/ProductOptions';
registerComponent('product_options', {
    component: ProductOptions as any,
    defaultProps: {
        layout: 'pills',
        showLabels: true,
        showPrice: true,
        showAvailability: true,
    },
    propSchema: {
        layout: {
            label: 'Layout Style',
            type: 'select',
            options: ['pills', 'dropdown'],
        },
        showLabels: { label: 'Show Option Labels', type: 'boolean' },
        showPrice: { label: 'Show Variant Price', type: 'boolean' },
        showAvailability: { label: 'Show Availability', type: 'boolean' },
    },
});

// 7. Store Header (Smart Navigation Block)
import { StoreHeader } from '../cart/StoreHeader';
registerComponent('store_header', {
    component: StoreHeader as any,
    defaultProps: {
        storeName: '',
        showSearch: true,
        sticky: true,
    },
    propSchema: {
        storeName: { label: 'Store Name Override', type: 'text' },
        showSearch: { label: 'Show Search Bar', type: 'boolean' },
        sticky: { label: 'Sticky Header', type: 'boolean' },
    },
});

// 8. Search Bar (Collection Filter Block)
import { SearchBar } from '../cart/SearchBar';
registerComponent('search_bar', {
    component: SearchBar as any,
    defaultProps: {
        placeholder: 'Search products...',
        showResults: true,
        maxResults: 6,
    },
    propSchema: {
        placeholder: { label: 'Placeholder Text', type: 'text' },
        showResults: { label: 'Show Results Dropdown', type: 'boolean' },
        maxResults: { label: 'Max Results', type: 'number' },
    },
});

// 9. Checkout Form (Order Pipeline Block)
import { CheckoutBlock } from '../cart/CheckoutBlock';
registerComponent('checkout_form', {
    component: CheckoutBlock as any,
    defaultProps: {},
    propSchema: {},
});

// 10. Order Confirmation (Receipt Block)
import { OrderConfirmationBlock } from '../cart/OrderConfirmationBlock';
registerComponent('order_confirmation', {
    component: OrderConfirmationBlock as any,
    defaultProps: { orderId: '' },
    propSchema: {
        orderId: { label: 'Order ID (auto-detected)', type: 'text' },
    },
});

// 11. Admin Dashboard (Merchant Metrics Block)
import { AdminDashboard } from '../admin/AdminDashboard';
registerComponent('admin_dashboard', {
    component: AdminDashboard as any,
    defaultProps: {},
    propSchema: {},
});

// 12. Admin Order Manager (Merchant Order Table)
import { OrderManager } from '../admin/OrderManager';
registerComponent('admin_order_manager', {
    component: OrderManager as any,
    defaultProps: {},
    propSchema: {},
});

// ── Phase 8: Dynamic Customizable Blocks ──────────────────────────────────────

// 13. Hero Banner (Full Dynamic Hero Section)
import { HeroBanner } from '../blocks/HeroBanner';
registerComponent('hero_banner', {
    component: HeroBanner as any,
    defaultProps: {
        headline: 'Elevate Your Style',
        subheadline: 'Discover our curated collection of premium timepieces, crafted for the modern connoisseur.',
        bgImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
        bgColor: '#0a0a0f',
        overlayOpacity: 0.55,
        overlayColor: '#000000',
        alignment: 'center',
        ctaText: 'Shop Now',
        ctaLink: '#',
        ctaColor: '#7c6dfa',
        height: '70vh',
        showCta: true,
    },
    propSchema: {
        headline: { label: 'Headline', type: 'text' },
        subheadline: { label: 'Subheadline', type: 'text' },
        bgImageUrl: { label: 'Background Image URL', type: 'text' },
        bgColor: { label: 'Background Color', type: 'color' },
        overlayOpacity: { label: 'Overlay Opacity (0-1)', type: 'number' },
        overlayColor: { label: 'Overlay Color', type: 'color' },
        alignment: { label: 'Text Alignment', type: 'select', options: ['left', 'center', 'right'] },
        ctaText: { label: 'CTA Button Text', type: 'text' },
        ctaLink: { label: 'CTA Link URL', type: 'link' },
        ctaColor: { label: 'CTA Button Color', type: 'color' },
        height: { label: 'Section Height', type: 'select', options: ['40vh', '50vh', '60vh', '70vh', '80vh', '100vh'] },
        showCta: { label: 'Show CTA Button', type: 'boolean' },
    },
});

// 14. Countdown Timer (Conversion Tool)
import { CountdownTimer } from '../blocks/CountdownTimer';
registerComponent('countdown_timer', {
    component: CountdownTimer as any,
    defaultProps: {
        targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        title: '🔥 Flash Sale Ends In',
        expiredMessage: 'Sale has ended!',
        themeColor: '#7c6dfa',
        bgColor: '#13131a',
        layout: 'boxed',
        showLabels: true,
        showDays: true,
    },
    propSchema: {
        targetDate: { label: 'Target Date (ISO)', type: 'text' },
        title: { label: 'Title Text', type: 'text' },
        expiredMessage: { label: 'Expired Message', type: 'text' },
        themeColor: { label: 'Theme Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
        layout: { label: 'Layout Style', type: 'select', options: ['inline', 'boxed'] },
        showLabels: { label: 'Show Labels', type: 'boolean' },
        showDays: { label: 'Show Days', type: 'boolean' },
    },
});

// 15. Trust Badges (Authority Tool)
import { TrustBadges } from '../blocks/TrustBadges';
registerComponent('trust_badges', {
    component: TrustBadges as any,
    defaultProps: {
        badgeStyle: 'filled',
        iconColor: '#7c6dfa',
        textColor: '#f0f0f5',
        bgColor: '#13131a',
        layout: 'horizontal',
        columns: 4,
        gap: 14,
        showSublabels: true,
        badge1Label: 'Free Shipping',
        badge1Icon: '🚚',
        badge2Label: 'Secure Checkout',
        badge2Icon: '🔒',
        badge3Label: 'Easy Returns',
        badge3Icon: '↩️',
        badge4Label: 'Premium Quality',
        badge4Icon: '⭐',
    },
    propSchema: {
        badgeStyle: { label: 'Badge Style', type: 'select', options: ['minimal', 'filled', 'outline'] },
        iconColor: { label: 'Icon Color', type: 'color' },
        textColor: { label: 'Text Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
        layout: { label: 'Layout Direction', type: 'select', options: ['horizontal', 'vertical'] },
        columns: { label: 'Columns Count', type: 'number' },
        gap: { label: 'Gap (px)', type: 'number' },
        showSublabels: { label: 'Show Sublabels', type: 'boolean' },
        badge1Label: { label: 'Badge 1 Label', type: 'text' },
        badge1Icon: { label: 'Badge 1 Icon', type: 'text' },
        badge2Label: { label: 'Badge 2 Label', type: 'text' },
        badge2Icon: { label: 'Badge 2 Icon', type: 'text' },
        badge3Label: { label: 'Badge 3 Label', type: 'text' },
        badge3Icon: { label: 'Badge 3 Icon', type: 'text' },
        badge4Label: { label: 'Badge 4 Label', type: 'text' },
        badge4Icon: { label: 'Badge 4 Icon', type: 'text' },
    },
});

// ── Phase 9: Content & Authority Pack ─────────────────────────────────────────

// 16. FAQ Accordion (Interactive Content)
import { FAQAccordion } from '../blocks/FAQAccordion';
registerComponent('faq_accordion', {
    component: FAQAccordion as any,
    defaultProps: {
        title: 'Frequently Asked Questions',
        themeColor: '#7c6dfa',
        bgColor: 'transparent',
        allowMultipleOpen: false,
        items: [
            { question: 'What is your return policy?', answer: 'We offer a 30-day hassle-free return policy for a full refund or exchange.' },
            { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping is available at checkout.' },
            { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries worldwide.' },
        ],
    },
    propSchema: {
        title: { label: 'Section Title', type: 'text' },
        themeColor: { label: 'Theme Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
        allowMultipleOpen: { label: 'Allow Multiple Open', type: 'boolean' },
        items: { label: 'FAQ Items (JSON)', type: 'text' },
    },
});

// 17. Customer Reviews (Social Proof)
import { CustomerReviews } from '../blocks/CustomerReviews';
registerComponent('customer_reviews', {
    component: CustomerReviews as any,
    defaultProps: {
        headline: 'What Our Customers Say',
        layout: 'grid',
        starColor: '#fbbf24',
        bgColor: 'transparent',
        columns: 2,
        reviews: [
            { author: 'Sarah M.', rating: 5, content: 'Absolutely stunning quality! Worth every penny.', date: '2 days ago' },
            { author: 'James K.', rating: 5, content: 'Fast shipping, premium materials, incredible attention to detail.', date: '1 week ago' },
            { author: 'Emily R.', rating: 4, content: 'Beautiful product and great customer service.', date: '2 weeks ago' },
            { author: 'David L.', rating: 5, content: 'Luxury at its finest. Already recommending to everyone.', date: '3 weeks ago' },
        ],
    },
    propSchema: {
        headline: { label: 'Section Headline', type: 'text' },
        layout: { label: 'Layout Style', type: 'select', options: ['grid', 'slider'] },
        starColor: { label: 'Star Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
        columns: { label: 'Grid Columns', type: 'number' },
        reviews: { label: 'Reviews (JSON)', type: 'text' },
    },
});

// 18. Features Grid (Value Proposition)
import { FeaturesGrid } from '../blocks/FeaturesGrid';
registerComponent('features_grid', {
    component: FeaturesGrid as any,
    defaultProps: {
        headline: 'Why Choose Us',
        columns: 4,
        iconStyle: 'solid',
        iconColor: '#7c6dfa',
        bgColor: 'transparent',
        gap: 16,
        features: [
            { iconName: '🚀', title: 'Lightning Fast Delivery', description: 'Free express shipping on orders over $50.' },
            { iconName: '🛡️', title: 'Secure Payments', description: '256-bit SSL encryption on every transaction.' },
            { iconName: '⭐', title: 'Premium Quality', description: 'Handcrafted from the finest materials.' },
            { iconName: '💬', title: '24/7 Support', description: 'Dedicated team available via chat, email, or phone.' },
        ],
    },
    propSchema: {
        headline: { label: 'Section Headline', type: 'text' },
        columns: { label: 'Columns (2-4)', type: 'number' },
        iconStyle: { label: 'Icon Style', type: 'select', options: ['outline', 'solid'] },
        iconColor: { label: 'Icon Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
        gap: { label: 'Gap (px)', type: 'number' },
        features: { label: 'Features (JSON)', type: 'text' },
    },
});

// 19. Newsletter Signup (Lead Gen)
import { NewsletterSignup } from '../blocks/NewsletterSignup';
registerComponent('newsletter_signup', {
    component: NewsletterSignup as any,
    defaultProps: {
        headline: 'Stay in the Loop',
        subheadline: 'Subscribe for exclusive deals, new arrivals, and insider access.',
        buttonText: 'Subscribe',
        buttonColor: '#7c6dfa',
        bgColor: '#13131a',
        layout: 'stacked',
        showNameField: false,
        successMessage: '✅ You\'re in! Check your inbox for a welcome gift.',
    },
    propSchema: {
        headline: { label: 'Headline', type: 'text' },
        subheadline: { label: 'Subheadline', type: 'text' },
        buttonText: { label: 'Button Text', type: 'text' },
        buttonColor: { label: 'Button Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
        layout: { label: 'Layout Style', type: 'select', options: ['stacked', 'inline'] },
        showNameField: { label: 'Show Name Field', type: 'boolean' },
        successMessage: { label: 'Success Message', type: 'text' },
    },
});

// ── Phase 10: Navigation & Conversion Pack ────────────────────────────────────

// 20. Site Footer (Structure)
import { SiteFooter } from '../blocks/SiteFooter';
registerComponent('site_footer', {
    component: SiteFooter as any,
    defaultProps: {
        storeName: 'Omnora',
        storeDescription: 'Premium curated goods for the modern connoisseur.',
        bgColor: '#0a0a12',
        textColor: '#e8e8f0',
        accentColor: '#7c6dfa',
        showPaymentIcons: true,
        copyrightText: '© 2026 Omnora. All rights reserved.',
    },
    propSchema: {
        storeName: { label: 'Store Name', type: 'text' },
        storeDescription: { label: 'Description', type: 'text' },
        bgColor: { label: 'Background Color', type: 'color' },
        textColor: { label: 'Text Color', type: 'color' },
        accentColor: { label: 'Accent Color', type: 'color' },
        showPaymentIcons: { label: 'Show Payment Icons', type: 'boolean' },
        copyrightText: { label: 'Copyright Text', type: 'text' },
        columns: { label: 'Link Columns (JSON)', type: 'text' },
        socialLinks: { label: 'Social Links (JSON)', type: 'text' },
    },
});

// 21. Announcement Bar (Navigation/Promo)
import { AnnouncementBar } from '../blocks/AnnouncementBar';
registerComponent('announcement_bar', {
    component: AnnouncementBar as any,
    defaultProps: {
        messages: ['🚚 Free shipping on orders over $50', '🔥 Flash Sale — 20% off everything!'],
        bgColor: '#7c6dfa',
        textColor: '#ffffff',
        isSticky: true,
        enableSlider: true,
        interval: 3500,
        fontSize: 12,
        showClose: false,
    },
    propSchema: {
        bgColor: { label: 'Background Color', type: 'color' },
        textColor: { label: 'Text Color', type: 'color' },
        isSticky: { label: 'Sticky', type: 'boolean' },
        enableSlider: { label: 'Auto-Rotate', type: 'boolean' },
        interval: { label: 'Interval (ms)', type: 'number' },
        fontSize: { label: 'Font Size (px)', type: 'number' },
        showClose: { label: 'Show Close Button', type: 'boolean' },
        messages: { label: 'Messages (JSON)', type: 'text' },
    },
});

// 22. Upsell Widget (AOV Booster)
import { UpsellWidget } from '../blocks/UpsellWidget';
registerComponent('upsell_widget', {
    component: UpsellWidget as any,
    defaultProps: {
        title: 'Frequently Bought Together',
        maxItems: 3,
        layout: 'horizontal',
        accentColor: '#7c6dfa',
        bgColor: '#13131a',
    },
    propSchema: {
        title: { label: 'Section Title', type: 'text' },
        maxItems: { label: 'Max Items', type: 'number' },
        layout: { label: 'Layout', type: 'select', options: ['horizontal', 'compact'] },
        accentColor: { label: 'Accent Color', type: 'color' },
        bgColor: { label: 'Background Color', type: 'color' },
    },
});

// 23. Split Hero (Image + Text)
import { SplitHero } from '../blocks/SplitHero';
registerComponent('split_hero', {
    component: SplitHero as any,
    defaultProps: {
        imagePosition: 'right',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        headline: 'Crafted for the Modern Connoisseur',
        richText: 'Every piece in our collection tells a story of precision engineering and timeless design.',
        ctaText: 'Explore Collection',
        ctaLink: '#',
        ctaColor: '#7c6dfa',
        verticalAlignment: 'center',
        bgColor: '#0d0d18',
        height: 'auto',
        showCta: true,
    },
    propSchema: {
        imagePosition: { label: 'Image Position', type: 'select', options: ['left', 'right'] },
        imageUrl: { label: 'Image URL', type: 'text' },
        headline: { label: 'Headline', type: 'text' },
        richText: { label: 'Body Text', type: 'text' },
        ctaText: { label: 'CTA Text', type: 'text' },
        ctaLink: { label: 'CTA Link', type: 'link' },
        ctaColor: { label: 'CTA Color', type: 'color' },
        verticalAlignment: { label: 'Vertical Alignment', type: 'select', options: ['top', 'center', 'bottom'] },
        bgColor: { label: 'Background Color', type: 'color' },
        height: { label: 'Height', type: 'select', options: ['auto', '50vh', '60vh', '70vh', '80vh', '100vh'] },
        showCta: { label: 'Show CTA', type: 'boolean' },
    },
});