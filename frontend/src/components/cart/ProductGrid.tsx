import React, { useMemo } from 'react';
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

function sortProducts(products: Product[], sortKey: string): Product[] {
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

    const windowContext = typeof window !== 'undefined' ? (window as unknown as { __OMNORA_TENANT_ID__?: string }) : null;
    const activeTenantId = windowContext?.__OMNORA_TENANT_ID__ || state.merchantId;

    const { 
        data: liveProducts = [], 
        isLoading 
    } = useQuery({
        queryKey: ['products', activeTenantId],
        queryFn: async () => {
            if (!activeTenantId) return [];
            return await databaseClient.getProductsByMerchant(activeTenantId);
        },
        enabled: !!activeTenantId,
        staleTime: 5 * 60 * 1000, 
    });

    const safeColumns = Number(columns) || 3;
    const safeGap = Number(gap) || 20;
    const safeLimit = Number(limit) || 12;

    const productsToRender = useMemo(() => {
        let filtered = liveProducts;

        if (productSource === 'manual') {
            const idList = typeof productIds === 'string' ? productIds.split(',').map(id => id.trim()) : productIds;
            if (idList.length > 0) {
                filtered = idList.map(id => liveProducts.find(p => p.id === id)).filter(Boolean) as Product[];
            }
        } else if (productSource === 'collection' && collectionId) {
            // OSTT FIX: Handled missing category_id by checking type or id safely
            filtered = liveProducts.filter((p: Product & { category_id?: string }) => p.category_id === collectionId || p.type?.toLowerCase() === collectionId.toLowerCase());
        } else if (productSource === 'bestsellers') {
            filtered = liveProducts.filter(p => p.tags?.some(t => t.toLowerCase() === 'best seller' || t.toLowerCase() === 'popular'));
        }

        return sortProducts(filtered, 'default').slice(0, safeLimit);
    }, [liveProducts, productSource, productIds, collectionId, safeLimit]);

    if (isLoading) {
         return (
             <div data-node-id={nodeId} style={{ display: 'grid', gridTemplateColumns: `repeat(${safeColumns}, 1fr)`, gap: safeGap }}>
                {Array.from({ length: safeColumns }).map((_, i) => (
                    <div key={i}>
                         <Skeleton baseColor="#1a1a1a" highlightColor="#2a2a2a" style={{ aspectRatio: '3/4' }} />
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
                            // OSTT FIX: Strictly passed as standard string matching child component type
                            cardStyle={cardStyle as "minimal" | "bordered" | "shadowed"}
                            imageAspectRatio={imageAspectRatio as "square" | "portrait" | "landscape"}
                            showPrice={showPrice}
                            showAddToCart={showAddToCart}
                            showBadge={showBadge}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

ProductGrid.displayName = 'ProductGrid';
export default ProductGrid;