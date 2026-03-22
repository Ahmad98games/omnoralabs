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
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { databaseClient } from '../../platform/core/DatabaseClient';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { OmnoraImage } from '../cms/OmnoraImage';

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
    isBuilder?: boolean;
    title?: string;
    columns?: number;
    gap?: number;
    limit?: number;
    productSource?: 'auto' | 'collection' | 'bestsellers' | 'manual';
    collectionId?: string;
    productIds?: string | string[];
    cardStyle?: 'minimal' | 'bordered' | 'shadowed';
    imageAspectRatio?: 'square' | 'portrait' | 'landscape';
    showPrice?: boolean;
    showAddToCart?: boolean;
    showBadge?: boolean;
}

// ─── Sort Utility ─────────────────────────────────────────────────────────────

function sortProducts(products: any[], sortKey: string): any[] {
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
    isBuilder = false,
    title = '',
    columns = 3,
    gap = 20,
    limit = 12,
    productSource = 'auto',
    collectionId = '',
    productIds = [],
    cardStyle = 'minimal',
    imageAspectRatio = 'portrait',
    showPrice = true,
    showAddToCart = true,
    showBadge = true,
}) => {
    const { state } = useStorefront();
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

    const safeColumns = Number(columns);
    const safeGap = Number(gap);
    const safeLimit = Number(limit);

    const productsToRender = useMemo(() => {
        let filtered = liveProducts;

        if (productSource === 'manual') {
            const idList = typeof productIds === 'string' ? productIds.split(',').map(id => id.trim()) : productIds;
            if (idList.length > 0) {
                filtered = idList.map(id => liveProducts.find(p => p.id === id)).filter(Boolean) as Product[];
            }
        } else if (productSource === 'collection' && collectionId) {
            filtered = liveProducts.filter(p => p.category_id === collectionId || p.type?.toLowerCase() === collectionId.toLowerCase());
        } else if (productSource === 'bestsellers') {
            filtered = liveProducts.filter(p => p.tags?.some(t => t.toLowerCase() === 'best seller' || t.toLowerCase() === 'popular'));
        }

        return sortProducts(filtered, sortKey).slice(0, safeLimit);
    }, [liveProducts, productSource, productIds, collectionId, sortKey, safeLimit]);

    const handleVibeSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vibeQuery.trim()) {
            setVibeTags([]);
            return;
        }
        setIsVibeLoading(true);
        try {
            const res = await axios.get(`/api/search/vibe?q=${encodeURIComponent(vibeQuery)}`);
            if (res.data?.success) {
                setVibeTags(res.data.tags.map((t: string) => t.toLowerCase()));
            }
        } catch (err) {
            console.error("Vibe search failed:", err);
            setVibeTags(vibeQuery.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(w => w.length > 3));
        } finally {
            setIsVibeLoading(false);
        }
    };

    const categories = ['all', ...new Set((liveProducts.length > 0 ? liveProducts : (collection?.fullProducts ?? []))
        .map(p => p.type || p.tags?.[0]).filter(Boolean))];

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
            {title && (
                <h2 style={{ 
                    fontSize: '26px', fontWeight: 800, color: '#fff', 
                    marginBottom: '24px', letterSpacing: '-0.02em',
                    fontFamily: 'var(--font-heading, inherit)' 
                }}>
                    {title}
                </h2>
            )}

            <div 
                style={{
                     display: 'grid',
                     gridTemplateColumns: `repeat(${safeColumns}, 1fr)`,
                     gap: `${safeGap}px`,
                }}
            >
                {productsToRender.map((product) => (
                    <div key={product.id} style={{ position: 'relative' }}>
                        <ProductCard 
                            product={product} 
                            cardStyle={cardStyle}
                            imageAspectRatio={imageAspectRatio}
                            showPrice={showPrice}
                            showAddToCart={showAddToCart}
                            showBadge={showBadge}
                        />
                        {isBuilder && (
                            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', color: '#D4AF37', fontSize: '10px', fontWeight: 700, zIndex: 10 }}>
                                Product Preview
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductGrid;
