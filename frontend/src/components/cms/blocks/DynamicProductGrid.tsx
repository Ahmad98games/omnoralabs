import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Product {
    id: string;
    title: string;
    price: number;
    compare_price?: number;
    images: string[];
    slug: string;
    badge?: string;
    collection_id?: string;
}

interface DynamicProductGridProps {
    columns?: number;
    gap?: number;
    imageAspectRatio?: 'square' | 'portrait' | 'landscape';
    cardStyle?: 'minimal' | 'bordered' | 'shadowed' | 'luxury';
    productSource?: 'auto' | 'collection' | 'bestsellers' | 'manual';
    collectionId?: string;
    productIds?: string;
    limit?: number;
    showPrice?: boolean;
    showComparePrice?: boolean;
    showBadge?: boolean;
    showAddToCart?: boolean;
    showQuickView?: boolean;
    accentColor?: string;
    cardBackground?: string;
    textColor?: string;
    isBuilder?: boolean;
}

const ProductCardSkeleton = ({ aspectRatio }: { aspectRatio: string }) => (
    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#131316', border: '1px solid #27272a' }}>
        <div style={{ paddingBottom: aspectRatio, position: 'relative', background: '#1c1c22' }} />
        <div style={{ padding: '16px 12px' }}>
            <div style={{ height: 14, background: '#27272a', borderRadius: 4, marginBottom: 12, width: '80%' }} />
            <div style={{ height: 12, background: '#1c1c22', borderRadius: 4, width: '40%' }} />
        </div>
    </div>
);

const ProductCard = ({ product, imageAspectRatio, accentColor, textColor, showPrice }: any) => (
    <div className="product-card" style={{ transition: 'transform 0.2s ease' }}>
        <div style={{ 
            paddingBottom: imageAspectRatio, position: 'relative', 
            borderRadius: 12, overflow: 'hidden', background: '#131316',
            marginBottom: 12 
        }}>
            {product.images?.[0] && (
                <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            )}
            {product.badge && (
                <div style={{ 
                    position: 'absolute', top: 12, left: 12, padding: '4px 10px', 
                    background: accentColor, color: '#fff', fontSize: 10, fontWeight: 900, 
                    borderRadius: 4, textTransform: 'uppercase' 
                }}>
                    {product.badge}
                </div>
            )}
        </div>
        <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: textColor, marginBottom: 4 }}>{product.title}</h3>
            {showPrice && (
                <div style={{ fontSize: 14, fontWeight: 700, color: accentColor }}>
                    ${product.price}
                </div>
            )}
        </div>
    </div>
);

export const DynamicProductGrid: React.FC<DynamicProductGridProps> = (props) => {
    const {
        columns = 3, gap = 20, imageAspectRatio = 'portrait',
        productSource = 'auto', collectionId, productIds, limit = 8,
        showPrice = true, accentColor = '#FF6B35',
        textColor = '#FFFFFF', isBuilder = false,
    } = props;

    const [products, setProducts] = useState<Product[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProducts() {
            setStatus('loading');
            try {
                let query = supabase
                    .from('products')
                    .select('id, title, price, compare_price, images, slug, badge, collection_id')
                    .limit(limit);

                if (productSource === 'collection' && collectionId) {
                    query = query.eq('collection_id', collectionId);
                } else if (productSource === 'bestsellers') {
                    // Logic for bestsellers (simulated or real column)
                } else if (productSource === 'manual' && productIds) {
                    const ids = productIds.split(',').map(id => id.trim()).filter(Boolean);
                    query = query.in('id', ids);
                }

                const { data, error } = await query.abortSignal(controller.signal);

                if (error) throw error;
                setProducts(data ?? []);
                setStatus('ready');
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('[DynamicProductGrid]', err);
                setStatus('error');
            }
        }

        fetchProducts();
        return () => controller.abort();
    }, [productSource, collectionId, productIds, limit]);

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        width: '100%',
    };

    const paddingByRatio = {
        square: '100%',
        portrait: '133%',
        landscape: '56.25%',
    };

    if (status === 'loading') {
        return (
            <div style={gridStyle}>
                {Array.from({ length: limit }, (_, i) => (
                    <ProductCardSkeleton key={i} aspectRatio={paddingByRatio[imageAspectRatio]} />
                ))}
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div style={{ padding: 48, textAlign: 'center', color: '#71717a', border: '1px dashed #27272a', borderRadius: 16 }}>
                ⚠️ PRODUCT ENGINE OFFLINE
            </div>
        );
    }

    return (
        <div style={gridStyle}>
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                    imageAspectRatio={paddingByRatio[imageAspectRatio]}
                    showPrice={showPrice}
                    accentColor={accentColor}
                    textColor={textColor}
                />
            ))}
        </div>
    );
};
