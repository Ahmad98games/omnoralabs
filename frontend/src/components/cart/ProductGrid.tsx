/**
 * ProductGrid: Collection Grid Layout
 * 
 * Phase 46: Full AST Binding & Aesthetic Freedom Upgrade.
 * 
 * Reads collection.fullProducts from StorefrontContext and renders
 * a responsive CSS Grid of ProductCard components.
 * 
 * ALL display settings (columns, gap, limit, cardStyle, imageAspect)
 * are read directly from the Zustand AST via props, ensuring
 * real-time reactivity when the builder's SettingsPanel changes values.
 * 
 * Registered in BuilderRegistry as 'product_grid'.
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStorefront, type Product } from '../../context/StorefrontContext';
import { ProductCard } from './ProductCard';
import { databaseClient } from '../../platform/core/DatabaseClient';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    text: '#ffffff',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

// ─── Sort Types ───────────────────────────────────────────────────────────────

export type SortKey = 'default' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc';

// ─── Card Style Presets ───────────────────────────────────────────────────────

type CardStyle = 'minimal' | 'cinematic-dark' | 'outlined';
type ImageAspect = 'portrait' | 'square' | 'widescreen';

const CARD_STYLES: Record<CardStyle, React.CSSProperties> = {
    'minimal': {
        background: 'transparent',
        borderRadius: 12,
        overflow: 'hidden',
    },
    'cinematic-dark': {
        background: '#0d0d14',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        border: '1px solid rgba(124,109,250,0.15)',
    },
    'outlined': {
        background: 'transparent',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
    },
};

const ASPECT_RATIOS: Record<ImageAspect, string> = {
    'portrait': '3 / 4',
    'square': '1 / 1',
    'widescreen': '16 / 9',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductGridProps {
    nodeId: string;
    columns?: number;
    gap?: number;
    limit?: number;
    showFilter?: boolean;
    cardStyle?: CardStyle;
    imageAspect?: ImageAspect;
    selectionMode?: 'category' | 'specific';
    categorySlug?: string;
    productIds?: string[];
    children?: React.ReactNode;
}

// ─── Sort Utility ─────────────────────────────────────────────────────────────

function sortProducts(products: Product[], sortKey: SortKey): Product[] {
    switch (sortKey) {
        case 'price-asc':
            return [...products].sort((a, b) => a.price - b.price);
        case 'price-desc':
            return [...products].sort((a, b) => b.price - a.price);
        case 'title-asc':
            return [...products].sort((a, b) => a.title.localeCompare(b.title));
        case 'title-desc':
            return [...products].sort((a, b) => b.title.localeCompare(a.title));
        case 'default':
        default:
            return products;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductGrid: React.FC<ProductGridProps> = ({
    nodeId,
    columns = 3,
    gap = 20,
    limit = 12,
    showFilter = true,
    cardStyle = 'minimal',
    imageAspect = 'portrait',
    selectionMode = 'category',
    categorySlug = '',
    productIds = [],
}) => {
    const { state } = useStorefront();
    const collection = state.collection;
    const [sortKey, setSortKey] = useState<SortKey>('default');

    const { 
        data: liveProducts = [], 
        isLoading 
    } = useQuery({
        queryKey: ['products', (window as any).__OMNORA_TENANT_ID__ || state.merchantId],
        queryFn: async () => {
            const tenantId = (window as any).__OMNORA_TENANT_ID__ || state.merchantId;
            if (!tenantId) return [];
            return await databaseClient.getProductsByMerchant(tenantId);
        },
        enabled: !!((window as any).__OMNORA_TENANT_ID__ || state.merchantId),
        staleTime: 5 * 60 * 1000, 
    });

    // Clamp columns to safe range
    const safeColumns = Math.max(1, Math.min(6, columns));
    const safeGap = Math.max(0, gap);
    const safeLimit = Math.max(1, limit);
    const activeCardStyle = CARD_STYLES[cardStyle] || CARD_STYLES.minimal;
    const activeAspect = ASPECT_RATIOS[imageAspect] || ASPECT_RATIOS.portrait;

    // Phase 47: Dynamic CMS filtering — category or specific products
    const productsToRender = useMemo(() => {
        const source = liveProducts.length > 0 ? liveProducts : (collection?.fullProducts ?? []);
        
        let filtered = source;

        if (selectionMode === 'specific' && productIds.length > 0) {
            // Specific Products mode: show only hand-picked items in order
            filtered = productIds
                .map(id => source.find(p => p.id === id))
                .filter(Boolean) as Product[];
        } else if (selectionMode === 'category' && categorySlug) {
            // Category mode: filter by tag or type
            const slug = categorySlug.toLowerCase();
            filtered = source.filter(p =>
                p.tags?.some(t => t.toLowerCase() === slug) ||
                (p.type && p.type.toLowerCase() === slug)
            );
        }

        const sorted = sortProducts(filtered, sortKey);
        return sorted.slice(0, safeLimit);
    }, [liveProducts, collection, sortKey, safeLimit, selectionMode, categorySlug, productIds]);

    if (isLoading) {
         return (
             <div data-node-id={nodeId} style={{ display: 'grid', gridTemplateColumns: `repeat(${safeColumns}, 1fr)`, gap: safeGap }}>
                {Array.from({ length: safeColumns }).map((_, i) => (
                    <div key={i} style={{ ...activeCardStyle }}>
                         <Skeleton baseColor="#1a1a1a" highlightColor="#2a2a2a" style={{ aspectRatio: activeAspect }} />
                         <div style={{ padding: 16 }}>
                             <Skeleton baseColor="#1a1a1a" highlightColor="#2a2a2a" height={20} width="80%" />
                             <Skeleton baseColor="#1a1a1a" highlightColor="#2a2a2a" height={16} width="40%" style={{ marginTop: 8 }} />
                         </div>
                    </div>
                ))}
             </div>
         );
    }

    if (productsToRender.length === 0) {
        return (
            <div
                data-node-id={nodeId}
                style={{
                    padding: '80px 40px',
                    textAlign: 'center',
                    background: '#050505',
                    borderRadius: 24,
                    border: `1px solid rgba(255,255,255,0.05)`,
                    color: T.text,
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Cyberpunk accent */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '200px', height: '1px', background: 'linear-gradient(90deg, transparent, #7c6dfa, transparent)' }} />
                
                <span style={{ fontSize: 48, display: 'block', marginBottom: 20, filter: 'drop-shadow(0 0 10px rgba(124,109,250,0.5))' }}>✨</span>
                <h3 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #8b8ba0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    New Collection Dropping Soon
                </h3>
                <p style={{ fontSize: 15, color: T.textMuted, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                    We are currently curating our finest selection of products. Stay tuned for the official launch.
                </p>
            </div>
        );
    }

    return (
        <div data-node-id={nodeId} style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Filter Bar */}
            {showFilter && productsToRender.length > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 32, padding: '12px 20px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                    border: `1px solid rgba(255,255,255,0.05)`,
                    backdropFilter: 'blur(10px)',
                }}>
                    <span style={{
                        fontSize: 13, color: T.textDim, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase'
                    }}>
                        {productsToRender.length} {productsToRender.length === 1 ? 'Piece' : 'Pieces'}
                    </span>
                    <select
                        value={sortKey}
                        onChange={e => setSortKey(e.target.value as SortKey)}
                        style={{
                            background: 'transparent', border: 'none',
                            color: T.text, fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', outline: 'none',
                            fontFamily: 'inherit',
                        }}
                    >
                        <option value="default">Featured Selection</option>
                        <option value="price-asc">Price: Ascending</option>
                        <option value="price-desc">Price: Descending</option>
                        <option value="title-asc">Alphabetical: A-Z</option>
                        <option value="title-desc">Alphabetical: Z-A</option>
                    </select>
                </div>
            )}

            {/* Grid — uses inline styles for safe runtime control (no JIT purge trap) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${safeColumns}, 1fr)`,
                gap: safeGap,
            }}>
                {productsToRender.map(product => (
                    <div key={product.id} style={activeCardStyle}>
                        {/* Image with aspect ratio control */}
                        <div style={{ aspectRatio: activeAspect, overflow: 'hidden', background: '#111' }}>
                            <img
                                src={product.featured_image || product.images?.[0]?.src}
                                alt={product.title}
                                loading="lazy"
                                style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            />
                        </div>

                        {/* Product Info */}
                        <div style={{
                            padding: cardStyle === 'minimal' ? '14px 0' : '14px 16px',
                        }}>
                            <div style={{
                                fontSize: 13, fontWeight: 600, color: T.text,
                                marginBottom: 6, lineHeight: 1.3,
                                letterSpacing: '-0.01em',
                            }}>
                                {product.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                                    ${product.price?.toFixed(2)}
                                </span>
                                {product.compareAtPrice && product.compareAtPrice > product.price && (
                                    <span style={{
                                        fontSize: 12, color: T.textMuted,
                                        textDecoration: 'line-through',
                                    }}>
                                        ${product.compareAtPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductGrid;
