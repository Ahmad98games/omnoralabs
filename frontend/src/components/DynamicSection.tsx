import React from 'react';
import { motion } from 'framer-motion';
import { BuilderWrapper } from './cms/BuilderWrapper';
import { EditableText } from './cms/EditableComponents';
import { useOmnora } from '../context/OmnoraContext';
import { OmnoraRenderer } from './cms/OmnoraRenderer';
import { useQuery } from '@tanstack/react-query';
import { databaseClient } from '../platform/core/DatabaseClient';
import { StorefrontProvider } from '../context/StorefrontContext';
import { Plus } from 'lucide-react';

import { OmnoraMegaMenu, OmnoraSmartSearch } from '../platform/library/modules/DiscoveryEngine';
import { OmnoraProductGrid, OmnoraMediaGallery, OmnoraVariantSelector } from '../platform/library/modules/SelectionEngine';
import { OmnoraCartDrawer, OmnoraBuyNowButton } from '../platform/library/modules/TransactionPipeline';
import { OmnoraTrustSeals, OmnoraPolicyBlock } from '../platform/library/modules/TrustEngine';
import { OmnoraRecentlyViewed, OmnoraUpsellBundle, OmnoraGeoSwitcher } from '../platform/library/modules/IntelligenceModules';
import { FeatureGridv5_Definition } from '../platform/library/modules/FeatureGridv5';
import { registerComponent, SECTION_TYPES, BlockProps } from './cms/BuilderRegistry';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface BaseComponentProps {
    nodeId: string;
    bgColor?: string;
    textColor?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    headlineColor?: string;
    subheadlineColor?: string;
    borderRadius?: number;
    [key: string]: unknown; // Allow extensible typing safely
}

interface HeroSectionProps extends BaseComponentProps {
    height?: string;
    bgImage?: string;
    overlayOpacity?: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    return (
        <section 
            className="dynamic-hero" 
            style={{ 
                minHeight: props.height || '80vh', 
                display: 'flex', 
                alignItems: 'center', 
                background: props.bgImage ? `url(${props.bgImage}) center/cover` : (props.bgColor || 'var(--om-bg)'),
                color: props.textColor || 'var(--om-text-primary)',
                position: 'relative'
            }}
        >
            {props.overlayOpacity && (
                <div 
                    className="absolute inset-0 bg-black" 
                    style={{ opacity: (props.overlayOpacity ?? 0) / 100 }} 
                />
            )}
            <div className="container relative z-10">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    style={{ color: props.headlineColor || 'var(--om-text-primary)' }}
                >
                    <EditableText nodeId={nodeId} path="props.headline" tag="span" />
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="eyebrow mt-4 uppercase tracking-[0.3em] font-black italic"
                    style={{ color: props.subheadlineColor || 'var(--om-text-muted)' }}
                >
                    <EditableText nodeId={nodeId} path="props.subheadline" tag="span" />
                </motion.p>
            </div>
        </section>
    );
};
HeroSection.displayName = 'HeroSection';

const TextContent: React.FC<BaseComponentProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    return (
        <section className="dynamic-text py-20" style={{ background: props.bgColor || 'var(--db-bg)', textAlign: props.alignment || 'left' }}>
            <div className="container max-w-3xl">
                <h2 className="mb-8 uppercase tracking-tighter font-black h1" style={{ color: props.headlineColor || 'var(--om-text-primary)' }}>
                    <EditableText nodeId={nodeId} path="props.title" tag="span" />
                </h2>
                <div className="prose prose-invert max-w-none text-xl leading-relaxed" style={{ color: props.textColor || 'var(--om-text-muted)' }}>
                    <EditableText nodeId={nodeId} path="props.body" tag="div" />
                </div>
            </div>
        </section>
    );
};
TextContent.displayName = 'TextContent';

interface TrustSectionProps extends BaseComponentProps {
    gap?: number;
    iconColor?: string;
}

const TrustSection: React.FC<TrustSectionProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    return (
        <section className="dynamic-trust py-12 border-y border-white/5" style={{ background: props.bgColor || 'var(--om-bg)' }}>
            <div className="container">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: props.alignment || 'center', gap: `${props.gap || 40}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: props.iconColor || 'var(--om-text-primary)' }}>✓</div>
                        <EditableText nodeId={nodeId} path="props.badge1Label" tag="span" className="text-xs font-bold tracking-widest uppercase" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: props.iconColor || 'var(--om-text-primary)' }}>✓</div>
                        <EditableText nodeId={nodeId} path="props.badge2Label" tag="span" className="text-xs font-bold tracking-widest uppercase" />
                    </div>
                </div>
            </div>
        </section>
    );
};
TrustSection.displayName = 'TrustSection';

const PromoBanner: React.FC<BaseComponentProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    return (
        <section className="promo-banner py-4 border-b border-white/5" style={{ background: props.bgColor || 'var(--om-bg)', color: props.textColor || 'var(--om-text-primary)', textAlign: props.alignment || 'center' }}>
            <div className="container">
                <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                    <EditableText nodeId={nodeId} path="props.message" tag="span" />
                </span>
            </div>
        </section>
    );
};
PromoBanner.displayName = 'PromoBanner';

interface ReviewsSectionProps extends BaseComponentProps {
    starColor?: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    return (
        <section className="reviews-section py-20" style={{ background: props.bgColor || 'var(--db-bg)' }}>
            <div className="container">
                <h2 className="text-center mb-12" style={{ color: props.headlineColor || '#fff' }}>
                    <EditableText nodeId={nodeId} path="props.title" tag="span" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="review-card p-12 border border-white/10 bg-white/[0.02]" style={{ borderRadius: `${props.borderRadius || 0}px` }}>
                            <div className="stars mb-4 opacity-40" style={{ color: props.starColor || 'var(--om-text-primary)' }}>★★★★★</div>
                            <p className="mb-4" style={{ fontStyle: 'italic', opacity: 0.8, color: props.textColor || '' }}>
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
};
ReviewsSection.displayName = 'ReviewsSection';

interface ProductGridProps extends BaseComponentProps {
    desktopColumns?: number;
    gridGap?: number;
    category?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    const desktopCols = props.desktopColumns || 4;
    const gap = props.gridGap !== undefined ? `${props.gridGap}px` : '2rem';

    return (
        <section className="dynamic-products py-24" style={{ background: 'var(--om-bg)' }}>
            <div className="container">
                <div className="section-header mb-16">
                    <span className="eyebrow uppercase tracking-[0.4em] font-black text-xs italic" style={{ color: 'var(--om-text-muted)' }}>
                        <EditableText nodeId={nodeId} path="props.eyebrow" tag="span" />
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mt-4" style={{ color: 'var(--om-text-primary)' }}>
                        <EditableText nodeId={nodeId} path="props.title" tag="span" />
                    </h2>
                </div>
                <div 
                    className="grid" 
                    style={{ 
                        gridTemplateColumns: `repeat(${desktopCols}, minmax(0, 1fr))`,
                        gap 
                    }}
                >
                    <div className="product-placeholder p-12 border border-white/5 bg-white/[0.02] text-center" style={{ borderRadius: '8px', gridColumn: '1 / -1' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                            Products matching &quot;{props.category || 'all'}&quot; will materialize here.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
ProductGrid.displayName = 'ProductGrid';

interface SpacerProps extends BaseComponentProps { height?: string; }
const Spacer: React.FC<SpacerProps> = ({ ...props }) => {
    if (!props) return null;
    return (
        <div style={{ height: props.height || '40px', background: 'transparent' }} />
    );
};
Spacer.displayName = 'Spacer';

interface AtomicButtonProps extends BaseComponentProps {
    buttonColor?: string;
}

const AtomicButton: React.FC<AtomicButtonProps> = ({ nodeId, ...props }) => {
    if (!props) return null;
    return (
        <div className="py-8 text-center" style={{ background: props.bgColor || 'var(--om-bg)' }}>
            <button 
                type="button"
                className="btn-primary" 
                style={{ 
                    padding: '12px 32px', 
                    borderRadius: `${props.borderRadius || 4}px`, 
                    background: props.buttonColor || 'var(--accent-primary)', 
                    color: props.textColor || '#000', 
                    border: 'none', 
                    fontWeight: 900, 
                    fontSize: '0.8rem', 
                    cursor: 'pointer' 
                }}
            >
                <EditableText nodeId={nodeId} path="props.label" tag="span" />
            </button>
        </div>
    );
};
AtomicButton.displayName = 'AtomicButton';

interface FeaturedProductProps extends BaseComponentProps {
    productId?: string;
}

const FeaturedProduct: React.FC<FeaturedProductProps> = ({ nodeId, ...props }) => {
    // OSTT FIX: Safe window access without 'any'
    const win = typeof window !== 'undefined' ? (window as unknown as { __OMNORA_TENANT_ID__?: string }) : null;
    const tenantId = win?.__OMNORA_TENANT_ID__ || null;
    
    const { data: products = [] } = useQuery({
        queryKey: ['products', tenantId],
        queryFn: () => databaseClient.getProductsByMerchant(tenantId!),
        enabled: !!tenantId && !!props?.productId,
    });

    const product = React.useMemo(() => {
        if (!props?.productId) return null;
        return products.find(p => p.id === props?.productId);
    }, [products, props?.productId]);

    if (!props) return null;

    const content = (
        <section className="featured-product py-24" style={{ background: props.bgColor || 'var(--om-bg)' }}>
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="product-image-scaffold aspect-square bg-white/[0.02] border border-white/5 overflow-hidden" style={{ borderRadius: `${props.borderRadius || 0}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product ? (
                            <img src={product.featured_image} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            <span style={{ fontSize: '0.7rem', opacity: 0.1, fontWeight: 900, letterSpacing: '0.2em' }}>PRODUCT_ENTITY_SNAPSHOT</span>
                        )}
                    </div>
                    <div className="product-info">
                        <span className="eyebrow uppercase tracking-[0.3em] font-black text-xs italic" style={{ color: 'var(--om-text-muted)' }}>
                            {product ? (product.product_type || 'FEATURED ARTIFACT') : 'FEATURED ARTIFACT'}
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 mt-4">
                            {product ? product.title : <EditableText nodeId={nodeId} path="props.title" tag="span" />}
                        </h2>
                        <p className="mb-8 opacity-70">
                            {product ? product.description : <EditableText nodeId={nodeId} path="props.description" tag="span" />}
                        </p>
                        <div className="flex items-center gap-10">
                            <span className="text-3xl font-black tracking-tighter text-white">
                                {product ? `$${Number(product.base_price)?.toLocaleString()}` : ''}
                            </span>
                            <button type="button" className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-white/90 transition-all">
                                MATERIALIZE NOW
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    if (product) {
        // OSTT FIX: Typecast isolated to prevent global 'any' bleed
        return <StorefrontProvider scopedProduct={product as unknown as Record<string, unknown>}>{content}</StorefrontProvider>;
    }

    return content;
};
FeaturedProduct.displayName = 'FeaturedProduct';

interface AtomicContainerProps {
    nodeId: string;
    children?: React.ReactNode;
}

const AtomicContainer: React.FC<AtomicContainerProps> = ({ nodeId, children }) => {
    const { nodes, mode } = useOmnora();
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);
    const node = nodes[nodeId];
    if (!node) return null;

    const finalStyle: React.CSSProperties = {
        display: node.styles?.display || 'flex',
        flexDirection: (node.styles?.flexDirection as React.CSSProperties['flexDirection']) || 'column',
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
AtomicContainer.displayName = 'AtomicContainer';

// Initialization: Register all available components with their default state contracts
const initializeRegistry = () => {
    registerComponent(SECTION_TYPES.CONTAINER, { component: AtomicContainer, defaultProps: {} });
    registerComponent(SECTION_TYPES.SPACER, { component: Spacer, defaultProps: { height: '40px' } });

    const heroDefaults = {
        headline: 'Welcome to our Store',
        subheadline: 'Discover amazing products',
        ctaText: 'Shop Now',
        layout: 'background',
        height: '80vh'
    };
    // OSTT FIX: Isolated casting for dynamic registry payload
    registerComponent(SECTION_TYPES.HERO, { component: HeroSection as React.FC<BlockProps>, defaultProps: heroDefaults });
    registerComponent(SECTION_TYPES.HERO_SPLIT, { component: HeroSection as React.FC<BlockProps>, defaultProps: { ...heroDefaults, layout: 'left' } });
    registerComponent(SECTION_TYPES.HERO_SECTION, { component: HeroSection as React.FC<BlockProps> }); 

    registerComponent(SECTION_TYPES.TEXT_BLOCK, {
        component: TextContent as React.FC<BlockProps>,
        defaultProps: { title: 'Our Story', body: 'Share your brand mission here...' }
    });
    registerComponent(SECTION_TYPES.TEXT, { component: TextContent as React.FC<BlockProps> }); 

    registerComponent(SECTION_TYPES.FEATURED_PRODUCT, {
        component: FeaturedProduct as React.FC<BlockProps>,
        defaultProps: { title: 'Signature Piece', description: 'Limited edition luxury item.' }
    });

    registerComponent(SECTION_TYPES.PROMO_BANNER, {
        component: PromoBanner as React.FC<BlockProps>,
        defaultProps: { message: 'FREE SHIPPING ON ALL ORDERS OVER $200' }
    });
    registerComponent(SECTION_TYPES.ANNOUNCEMENT_BAR, { component: PromoBanner as React.FC<BlockProps> }); 

    registerComponent(SECTION_TYPES.PRODUCT_GRID, {
        component: ProductGrid as React.FC<BlockProps>,
        defaultProps: { title: 'New Arrivals', eyebrow: 'LATEST' }
    });
    registerComponent(SECTION_TYPES.PRODUCTS, { component: ProductGrid as React.FC<BlockProps> }); 
    registerComponent(SECTION_TYPES.BEST_SELLERS, { component: ProductGrid as React.FC<BlockProps>, defaultProps: { title: 'Best Sellers', category: 'popular' } });

    registerComponent(SECTION_TYPES.CART_DRAWER, { component: OmnoraCartDrawer as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.CHECKOUT_BLOCK, { component: OmnoraCartDrawer as React.FC<BlockProps> }); 
    registerComponent(SECTION_TYPES.VARIANT_SELECTOR, { component: OmnoraVariantSelector as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.BUY_NOW, { component: OmnoraBuyNowButton as React.FC<BlockProps> });

    registerComponent(SECTION_TYPES.TRUST_BADGES, {
        component: TrustSection as React.FC<BlockProps>,
        defaultProps: { badge1Label: 'Fast Delivery', badge2Label: 'Secure Payment' }
    });
    registerComponent(SECTION_TYPES.TRUST_SECTION, { component: TrustSection as React.FC<BlockProps> }); 
    registerComponent(SECTION_TYPES.TRUST_SEALS, { component: OmnoraTrustSeals as React.FC<BlockProps> });

    registerComponent(SECTION_TYPES.REVIEW_BLOCK, {
        component: ReviewsSection as React.FC<BlockProps>,
        defaultProps: { title: 'Client Testimonials', review1: 'Incredible quality and service.', author1: 'James W.' }
    });
    registerComponent(SECTION_TYPES.REVIEWS, { component: ReviewsSection as React.FC<BlockProps> }); 

    registerComponent(SECTION_TYPES.POLICY_BLOCK, { component: OmnoraPolicyBlock as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.HEADER, { component: HeroSection as React.FC<BlockProps>, defaultProps: { height: '100px' } });
    registerComponent(SECTION_TYPES.FOOTER, { component: AtomicContainer as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.MEGAMENU, { component: OmnoraMegaMenu as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.SMART_SEARCH, {
        component: OmnoraSmartSearch as React.FC<BlockProps>,
        defaultProps: { placeholder: 'Search for luxury pieces...' }
    });
    registerComponent(SECTION_TYPES.RECENTLY_VIEWED, { component: OmnoraRecentlyViewed as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.UPSELL_BUNDLE, { component: OmnoraUpsellBundle as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.GEO_SWITCHER, { component: OmnoraGeoSwitcher as React.FC<BlockProps> });

    registerComponent(SECTION_TYPES.COUNTDOWN_BANNER, { component: PromoBanner as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.UPSELL_WIDGET, { component: FeaturedProduct as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.WHATSAPP_BUTTON, { component: AtomicButton as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.FAQ_BLOCK, { component: TextContent as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.NEWSLETTER, { component: PromoBanner as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.FEATURE_BLOCK, { component: TrustSection as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.IMAGE_BLOCK, { component: FeaturedProduct as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.PRODUCT_GALLERY_GRID, { component: OmnoraProductGrid as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.MEDIA_GALLERY, { component: OmnoraMediaGallery as React.FC<BlockProps> });
    registerComponent(SECTION_TYPES.FEATURE_GRID_V5, FeatureGridv5_Definition);
};

initializeRegistry();

interface InsertMarkerProps {
    index: number;
    parentId: string | null;
}

const InsertMarker: React.FC<InsertMarkerProps> = ({ index, parentId }) => {
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
                type="button"
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
InsertMarker.displayName = 'InsertMarker';

export interface DynamicSectionProps {
    blocks?: string[];
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({ blocks }) => {
    const { nodes, mode } = useOmnora();
    if (!nodes) return null;

    // OSTT FIX: Strongly typed filtering mapping
    const rootBlockIds = blocks || Object.values(nodes).filter((n: unknown) => {
        const nodeObj = n as { id: string; parentId: string | null };
        return nodeObj && nodeObj.parentId === null;
    }).map((n: unknown) => (n as { id: string }).id);

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
DynamicSection.displayName = 'DynamicSection';