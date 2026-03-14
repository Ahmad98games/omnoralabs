import React from 'react';
import { motion } from 'framer-motion';
import { BuilderWrapper } from './cms/ComponentRegistry';
import { EditableText } from './cms/EditableComponents';
import { useOmnora } from '../context/OmnoraContext';
import { OmnoraRenderer } from './cms/OmnoraRenderer';
import { useQuery } from '@tanstack/react-query';
import { databaseClient } from '../platform/core/DatabaseClient';
import { StorefrontProvider } from '../context/StorefrontContext';

const HeroSection: React.FC<BlockProps> = ({ data = {}, nodeId }) => (
    <section className="dynamic-hero" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', background: 'var(--db-bg)' }}>
        <div className="container">
            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                style={{ color: 'var(--p-color, #C5A059)' }}
            >
                <EditableText nodeId={nodeId} path="props.headline" tag="span" />
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="eyebrow"
                style={{ color: 'var(--s-color, rgba(255,255,255,0.6))' }}
            >
                <EditableText nodeId={nodeId} path="props.subheadline" tag="span" />
            </motion.p>
        </div>
    </section>
);

const TextContent: React.FC<BlockProps> = ({ data = {}, nodeId }) => (
    <section className="dynamic-text py-20" style={{ background: 'var(--db-bg)' }}>
        <div className="container max-w-3xl">
            <h2 className="mb-8" style={{ color: 'var(--p-color, #C5A059)' }}>
                <EditableText nodeId={nodeId} path="props.title" tag="span" />
            </h2>
            <div className="prose prose-invert" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <EditableText nodeId={nodeId} path="props.body" tag="div" />
            </div>
        </div>
    </section>
);

const TrustSection: React.FC<BlockProps> = ({ data, nodeId }) => (
    <section className="dynamic-trust py-12" style={{ background: 'var(--db-bg)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                    <div style={{ width: '32px', height: '32px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>✓</div>
                    <EditableText nodeId={nodeId} path="props.badge1Label" tag="span" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                    <div style={{ width: '32px', height: '32px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>✓</div>
                    <EditableText nodeId={nodeId} path="props.badge2Label" tag="span" />
                </div>
            </div>
        </div>
    </section>
);

const PromoBanner: React.FC<BlockProps> = ({ nodeId }) => (
    <section className="promo-banner py-6" style={{ background: 'var(--accent-primary, #C5A059)', color: '#000', textAlign: 'center' }}>
        <div className="container">
            <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                <EditableText nodeId={nodeId} path="props.message" tag="span" />
            </span>
        </div>
    </section>
);

const ReviewsSection: React.FC<BlockProps> = ({ nodeId }) => (
    <section className="reviews-section py-20" style={{ background: 'var(--db-bg)' }}>
        <div className="container">
            <h2 className="text-center mb-12">
                <EditableText nodeId={nodeId} path="props.title" tag="span" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="review-card p-8 border border-white/5 bg-white/[0.02]" style={{ borderRadius: '8px' }}>
                        <div className="stars mb-4" style={{ color: 'var(--accent-primary)' }}>★★★★★</div>
                        <p className="mb-4" style={{ fontStyle: 'italic', opacity: 0.8 }}>
                            <EditableText nodeId={nodeId} path={`props.review${i}`} tag="span" />
                        </p>
                        <span style={{ fontWeight: 900, fontSize: '0.7rem', opacity: 0.5 }}>
                            — <EditableText nodeId={nodeId} path={`props.author${i}`} tag="span" />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const ProductGrid: React.FC<BlockProps> = ({ data = {}, nodeId }) => (
    <section className="dynamic-products py-20" style={{ background: 'var(--db-bg)' }}>
        <div className="container">
            <div className="section-header mb-12">
                <span className="eyebrow" style={{ color: 'var(--accent-primary, #C5A059)' }}>
                    <EditableText nodeId={nodeId} path="props.eyebrow" tag="span" />
                </span>
                <h2 style={{ color: '#fff' }}>
                    <EditableText nodeId={nodeId} path="props.title" tag="span" />
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="product-placeholder p-12 border border-white/5 bg-white/[0.02] text-center" style={{ borderRadius: '8px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                        Products matching "{data?.category || 'all'}" will materialize here.
                    </p>
                </div>
            </div>
        </div>
    </section>
);

const Spacer: React.FC<BlockProps> = ({ data = {} }) => (
    <div style={{ height: data?.height || '40px', background: 'transparent' }} />
);

const AtomicButton: React.FC<BlockProps> = ({ nodeId }) => (
    <div className="py-8 text-center" style={{ background: 'var(--db-bg)' }}>
        <button className="btn-primary" style={{ padding: '12px 32px', borderRadius: '4px', background: 'var(--accent-primary)', color: '#000', border: 'none', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>
            <EditableText nodeId={nodeId} path="props.label" tag="span" />
        </button>
    </div>
);

const FeaturedProduct: React.FC<BlockProps> = ({ nodeId, data = {} }) => {
    const tenantId = (window as any).__OMNORA_TENANT_ID__ || 'default_tenant';
    const { data: products = [] } = useQuery({
        queryKey: ['products', tenantId],
        queryFn: () => databaseClient.getProductsByMerchant(tenantId),
        enabled: !!data.productId,
    });

    const product = React.useMemo(() => {
        if (!data.productId) return null;
        return products.find(p => p.id === data.productId);
    }, [products, data.productId]);

    const content = (
        <section className="featured-product py-20" style={{ background: 'var(--db-bg)' }}>
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="product-image-scaffold aspect-square bg-white/[0.02] border border-white/5 overflow-hidden" style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product ? (
                            <img src={product.featured_image} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            <span style={{ fontSize: '0.7rem', opacity: 0.3 }}>PRODUCT IMAGE</span>
                        )}
                    </div>
                    <div className="product-info">
                        <span className="eyebrow" style={{ color: 'var(--accent-primary)' }}>
                            {product ? (product.type || 'FEATURED PIECE') : 'FEATURED PIECE'}
                        </span>
                        <h2 className="mb-4">
                            {product ? product.title : <EditableText nodeId={nodeId} path="props.title" tag="span" />}
                        </h2>
                        <p className="mb-8 opacity-70">
                            {product ? product.description : <EditableText nodeId={nodeId} path="props.description" tag="span" />}
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="text-xl font-bold text-white">
                                {product ? `$${product.price.toLocaleString()}` : ''}
                            </span>
                            <button className="btn-primary" style={{ padding: '16px 40px', background: '#fff', color: '#000', border: 'none', fontWeight: 900, borderRadius: '4px' }}>
                                PURCHASE NOW
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    if (product) {
        return <StorefrontProvider scopedProduct={product}>{content}</StorefrontProvider>;
    }

    return content;
};

const AtomicContainer: React.FC<any> = ({ nodeId, children }) => {
    const { nodes, mode } = useOmnora();
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);
    const node = nodes[nodeId];
    if (!node) return null;

    const finalStyle: React.CSSProperties = {
        display: node.styles?.display || 'flex',
        flexDirection: node.styles?.flexDirection || 'column',
        gap: node.styles?.gap || '0',
        padding: node.styles?.padding || '0',
        margin: node.styles?.margin || '0',
        width: node.styles?.width || '100%',
        height: node.styles?.height || 'auto',
        ...node.styles,
        ...(isHovered ? node.interactions?.hover : {}),
        ...(isActive ? node.interactions?.active : {}),
        transition: `all ${node.motion?.duration || 200}ms ${node.motion?.curve || 'cubic-bezier(0.4, 0, 0.2, 1)'}`
    };

    return (
        <div
            style={finalStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
        >
            {mode === 'edit' && <InsertMarker index={0} parentId={nodeId} />}
            {children}
            {children == null && mode === 'edit' && (
                <div style={{
                    padding: '60px 40px',
                    border: '1px dashed rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.2,
                    fontSize: '9px',
                    fontWeight: 900,
                    letterSpacing: '0.1em'
                }}>
                    <Plus size={16} strokeWidth={1} style={{ marginBottom: '12px' }} />
                    EMPTY CONTAINER
                </div>
            )}
        </div>
    );
};

import { OmnoraMegaMenu, OmnoraSmartSearch } from '../platform/library/modules/DiscoveryEngine';
import { OmnoraProductGrid, OmnoraMediaGallery, OmnoraVariantSelector } from '../platform/library/modules/SelectionEngine';
import { OmnoraCartDrawer, OmnoraBuyNowButton } from '../platform/library/modules/TransactionPipeline';
import { OmnoraTrustSeals, OmnoraPolicyBlock } from '../platform/library/modules/TrustEngine';
import { OmnoraRecentlyViewed, OmnoraUpsellBundle, OmnoraGeoSwitcher } from '../platform/library/modules/IntelligenceModules';
import { FeatureGridv5_Definition } from '../platform/library/modules/FeatureGridv5';

import { registerComponent, BlockProps, SECTION_TYPES } from './cms/BuilderRegistry';

// Initialization: Register all available components with their default state contracts
const initializeRegistry = () => {
    // ─── Layout & Containers ──────────────────────────────────────────────
    registerComponent(SECTION_TYPES.CONTAINER, {
        component: AtomicContainer,
        defaultProps: {}
    });

    registerComponent(SECTION_TYPES.SPACER, {
        component: Spacer,
        defaultProps: { height: '40px' }
    });

    // ─── Core Marketing ───────────────────────────────────────────────────
    const heroDefaults = {
        headline: 'Welcome to our Store',
        subheadline: 'Discover amazing products',
        ctaText: 'Shop Now',
        layout: 'background',
        height: '80vh'
    };
    registerComponent(SECTION_TYPES.HERO, { component: HeroSection, defaultProps: heroDefaults });
    registerComponent(SECTION_TYPES.HERO_SPLIT, { component: HeroSection, defaultProps: { ...heroDefaults, layout: 'left' } });
    registerComponent(SECTION_TYPES.HERO_SECTION, { component: HeroSection }); // Alias

    registerComponent(SECTION_TYPES.TEXT_BLOCK, {
        component: TextContent,
        defaultProps: { title: 'Our Story', body: 'Share your brand mission here...' }
    });
    registerComponent(SECTION_TYPES.TEXT, { component: TextContent }); // Alias

    registerComponent(SECTION_TYPES.FEATURED_PRODUCT, {
        component: FeaturedProduct,
        defaultProps: { title: 'Signature Piece', description: 'Limited edition luxury item.' }
    });

    registerComponent(SECTION_TYPES.PROMO_BANNER, {
        component: PromoBanner,
        defaultProps: { message: 'FREE SHIPPING ON ALL ORDERS OVER $200' }
    });
    registerComponent(SECTION_TYPES.ANNOUNCEMENT_BAR, { component: PromoBanner }); // Alias

    // ─── Commerce & Products ──────────────────────────────────────────────
    registerComponent(SECTION_TYPES.PRODUCT_GRID, {
        component: ProductGrid,
        defaultProps: { title: 'New Arrivals', eyebrow: 'LATEST' }
    });
    registerComponent(SECTION_TYPES.PRODUCTS, { component: ProductGrid }); // Alias
    registerComponent(SECTION_TYPES.BEST_SELLERS, { component: ProductGrid, defaultProps: { title: 'Best Sellers', category: 'popular' } });

    registerComponent(SECTION_TYPES.CART_DRAWER, { component: OmnoraCartDrawer });
    registerComponent(SECTION_TYPES.CHECKOUT_BLOCK, { component: OmnoraCartDrawer }); // Alias fallback
    registerComponent(SECTION_TYPES.VARIANT_SELECTOR, { component: OmnoraVariantSelector });
    registerComponent(SECTION_TYPES.BUY_NOW, { component: OmnoraBuyNowButton });

    // ─── Trust & Social Proof ─────────────────────────────────────────────
    registerComponent(SECTION_TYPES.TRUST_BADGES, {
        component: TrustSection,
        defaultProps: { badge1Label: 'Fast Delivery', badge2Label: 'Secure Payment' }
    });
    registerComponent(SECTION_TYPES.TRUST_SECTION, { component: TrustSection }); // Alias
    registerComponent(SECTION_TYPES.TRUST_SEALS, { component: OmnoraTrustSeals });

    registerComponent(SECTION_TYPES.REVIEW_BLOCK, {
        component: ReviewsSection,
        defaultProps: { title: 'Client Testimonials', review1: 'Incredible quality and service.', author1: 'James W.' }
    });
    registerComponent(SECTION_TYPES.REVIEWS, { component: ReviewsSection }); // Alias

    registerComponent(SECTION_TYPES.POLICY_BLOCK, { component: OmnoraPolicyBlock });

    // ─── Navigation ───────────────────────────────────────────────────────
    registerComponent(SECTION_TYPES.HEADER, { component: HeroSection, defaultProps: { height: '100px' } });
    registerComponent(SECTION_TYPES.FOOTER, { component: AtomicContainer });
    registerComponent(SECTION_TYPES.MEGAMENU, { component: OmnoraMegaMenu });

    // ─── Discovery & Intelligence ─────────────────────────────────────────
    registerComponent(SECTION_TYPES.SMART_SEARCH, {
        component: OmnoraSmartSearch,
        defaultProps: { placeholder: 'Search for luxury pieces...' }
    });
    registerComponent(SECTION_TYPES.RECENTLY_VIEWED, { component: OmnoraRecentlyViewed });
    registerComponent(SECTION_TYPES.UPSELL_BUNDLE, { component: OmnoraUpsellBundle });
    registerComponent(SECTION_TYPES.GEO_SWITCHER, { component: OmnoraGeoSwitcher });

    // ─── Placeholders for Missing Modules ─────────────────────────────────
    // These prevent crashes if types exist in library but aren't fully built yet
    registerComponent(SECTION_TYPES.COUNTDOWN_BANNER, { component: PromoBanner });
    registerComponent(SECTION_TYPES.UPSELL_WIDGET, { component: FeaturedProduct });
    registerComponent(SECTION_TYPES.WHATSAPP_BUTTON, { component: AtomicButton });
    registerComponent(SECTION_TYPES.FAQ_BLOCK, { component: TextContent });
    registerComponent(SECTION_TYPES.NEWSLETTER, { component: PromoBanner });
    registerComponent(SECTION_TYPES.FEATURE_BLOCK, { component: TrustSection });
    registerComponent(SECTION_TYPES.IMAGE_BLOCK, { component: FeaturedProduct });
    registerComponent(SECTION_TYPES.PRODUCT_GALLERY_GRID, { component: OmnoraProductGrid });
    registerComponent(SECTION_TYPES.MEDIA_GALLERY, { component: OmnoraMediaGallery });
    registerComponent(SECTION_TYPES.FEATURE_GRID_V5, FeatureGridv5_Definition);
};

initializeRegistry();

interface DynamicSectionProps {
    blocks: any[];
}

import { Plus } from 'lucide-react';
import { useBuilder, BuilderNode } from '../context/BuilderContext';

const InsertMarker: React.FC<{ index: number; parentId: string | null }> = ({ index, parentId }) => {
    const { mode, setLibraryState } = useOmnora();
    if (mode !== 'edit') return null;

    return (
        <div className="section-insert-marker" style={{
            height: parentId ? '12px' : '0',
            position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: parentId ? '4px 0' : '0',
            width: '100%'
        }}>
            <button
                onClick={() => setLibraryState?.({ isOpen: true, index, parentId })}
                style={{
                    width: '20px', height: '20px', background: '#005bd3', color: '#fff',
                    borderRadius: '50%', border: '2px solid #fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    opacity: 0, transition: 'all 0.2s', transform: 'scale(0.8)',
                    position: 'absolute', top: parentId ? 'auto' : '-10px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
            >
                <Plus size={12} strokeWidth={3} />
            </button>
            <div className="marker-line" style={{ width: '100%', height: '2px', background: '#005bd3', opacity: 0, transition: 'all 0.2s' }} />

            <style>{`
                .section-insert-marker:hover button { opacity: 1; transform: scale(1); }
                .section-insert-marker:hover .marker-line { opacity: 0.5; }
            `}</style>
        </div>
    );
};

export const DynamicSection: React.FC<DynamicSectionProps> = ({ blocks }) => {
    const { nodes, mode } = useOmnora();
    if (!nodes) return null;

    // Filter root nodes (those with parentId === null)
    const rootBlockIds = blocks || Object.values(nodes).filter((n: any) => n && n.parentId === null).map(n => n.id);

    return (
        <div className="dynamic-layout-engine" style={{ position: 'relative' }}>
            {mode === 'edit' && <InsertMarker index={0} parentId={null} />}
            <OmnoraRenderer
                blocks={rootBlockIds}
                mode={mode}
                renderWrapper={(node, content) => (
                    <React.Fragment key={node.id}>
                        <BuilderWrapper nodeId={node.id}>
                            {content}
                        </BuilderWrapper>
                        {mode === 'edit' && <InsertMarker index={rootBlockIds.indexOf(node.id) + 1} parentId={null} />}
                    </React.Fragment>
                )}
            />
        </div>
    );
};
