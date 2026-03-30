import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { useStorefront } from '../../context/StorefrontContext';

// OSTT FIX: Local strict representation of product to bypass generic import issues
interface FeaturedProductModel {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    description: string;
    image?: string;
    featured_image?: string;
    product_type?: string;
    base_price?: number;
}

export interface FeaturedProductProps {
    nodeId: string;
    isBuilder?: boolean;
    productId?: string;
    layout?: 'media-left' | 'media-right' | 'media-top';
    mediaSize?: number;
    showDescription?: boolean;
    showVariants?: boolean;
    showReviews?: boolean;
}

export const FeaturedProduct: React.FC<FeaturedProductProps> = ({
    nodeId,
    isBuilder = false,
    productId = '',
    layout = 'media-left',
    mediaSize = 50,
    showDescription = true,
    showVariants = true,
    showReviews = true,
}) => {
    // OSTT FIX: Removed unused 'state' variable
    useStorefront();
    const [selectedSize, setSelectedSize] = useState('M');

    const { data: productData = null } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            if (!productId) return null;
            return await databaseClient.getProductById(productId);
        },
        enabled: !!productId && !isBuilder
    });

    const product = productData as unknown as FeaturedProductModel | null;

    const mockProduct: FeaturedProductModel = {
        id: 'mock-1',
        title: 'Premium Chronograph Watch',
        price: 249.99,
        compareAtPrice: 320.00,
        description: 'A timeless timepiece combining precision engineering with elegant aesthetics.',
        image: 'https://images.unsplash.com/photo-1524592093837-8f3893e792fb?w=800&q=80',
        featured_image: 'https://images.unsplash.com/photo-1524592093837-8f3893e792fb?w=800&q=80',
        base_price: 249.99,
        product_type: 'WATCH'
    };

    const isTop = layout === 'media-top';
    const mediaWidth = isTop ? '100%' : `${mediaSize}%`;
    const contentWidth = isTop ? '100%' : `${100 - mediaSize}%`;

    const activeProduct = isBuilder ? mockProduct : product;

    if (!activeProduct && !isBuilder) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#8b8ba0' }}>Select a product in sidebar...</div>;
    }

    const renderContent = () => (
        <div style={{ flex: `0 0 ${contentWidth}`, padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            {showReviews && (
                <div style={{ color: '#D4AF37', fontSize: '13px' }}>
                    ★★★★★ <span style={{ color: '#8b8ba0', marginLeft: '4px' }}>(12 Reviews)</span>
                </div>
            )}
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: 0 }}>{activeProduct?.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>${activeProduct?.price?.toFixed(2) || activeProduct?.base_price?.toFixed(2)}</span>
                {activeProduct?.compareAtPrice && (
                    <span style={{ textDecoration: 'line-through', color: '#5a5a70', fontSize: '14px' }}>${activeProduct.compareAtPrice.toFixed(2)}</span>
                )}
            </div>
            {showDescription && (
                <p style={{ color: '#8b8ba0', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{activeProduct?.description}</p>
            )}

            {showVariants && (
                <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>Size:</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['S', 'M', 'L'].map(size => (
                            <button 
                                type="button"
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                style={{
                                    padding: '8px 16px', borderRadius: '4px', border: selectedSize === size ? '1px solid #7c6dfa' : '1px solid #2a2a3a',
                                    background: selectedSize === size ? 'rgba(124,109,250,0.1)' : 'transparent', color: selectedSize === size ? '#7c6dfa' : '#fff',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button type="button" style={{ marginTop: '20px', padding: '14px', background: '#7c6dfa', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Buy Now
            </button>
        </div>
    );

    const renderMedia = () => (
        <div style={{ flex: `0 0 ${mediaWidth}`, position: 'relative', overflow: 'hidden', minHeight: isTop ? '300px' : 'auto' }}>
            <img 
                src={activeProduct?.featured_image || activeProduct?.image} 
                alt="Product" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
            {isBuilder && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', color: '#D4AF37', fontSize: '10px', fontWeight: 700 }}>
                    Product Preview
                </div>
            )}
        </div>
    );

    return (
        <section 
            data-node-id={nodeId} 
            style={{ 
                display: 'flex', 
                flexDirection: isTop ? 'column' : (layout === 'media-left' ? 'row' : 'row-reverse'), 
                background: '#0d0d14', borderRadius: '16px', overflow: 'hidden', 
                border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Inter', sans-serif" 
            }}
        >
            {renderMedia()}
            {renderContent()}
        </section>
    );
};

export default FeaturedProduct;