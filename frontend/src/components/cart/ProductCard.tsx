/**
 * ProductCard: Scoped "Micro-Context" Wrapper
 *
 * Each card wraps its content in a <StorefrontProvider scopedProduct={...}>
 * so that {{product.title}} inside the card resolves to THIS card's product,
 * not the global page product.
 *
 * This is the critical architecture that enables Product Grids.
 */
import React from 'react';
import { StorefrontProvider, type Product } from '../../context/StorefrontContext';
import { cartActions } from '../../hooks/useCart';
import { useInventorySync } from '../../hooks/useInventorySync';
import { OmnoraImage } from '../cms/OmnoraImage';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.12)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    danger: '#ff4d6a',
    success: '#34d399',
};

export interface ProductCardProps {
    product: Product;
    renderBuiltIn?: boolean;
    children?: React.ReactNode;
    cardStyle?: 'minimal' | 'bordered' | 'shadowed';
    imageAspectRatio?: 'square' | 'portrait' | 'landscape';
    showPrice?: boolean;
    showAddToCart?: boolean;
    showBadge?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    renderBuiltIn = true,
    children,
    cardStyle = 'minimal',
    imageAspectRatio = 'square',
    showPrice = true,
    showAddToCart = true,
    showBadge = true,
}) => {
    const selectedVariant = product.variants.find(v => v.id === product.selectedVariantId)
        ?? product.variants[0]
        ?? null;

    const { isOutOfStock } = useInventorySync(product.id, (product as any).inventory_count !== undefined ? (product as any).inventory_count : 1);

    const isAvailable = product.available && !isOutOfStock;

    const displayPrice = selectedVariant?.price ?? product.price;
    const comparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
    const hasDiscount = comparePrice && comparePrice > displayPrice;
    const discountPct = hasDiscount
        ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
        : 0;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAvailable) return;

        cartActions.addItem({
            id: product.id,
            variantId: selectedVariant?.id,
            title: selectedVariant
                ? `${product.title} — ${selectedVariant.title}`
                : product.title,
            price: displayPrice,
            compareAtPrice: comparePrice,
            image: selectedVariant?.image ?? product.featured_image,
            handle: product.handle,
        });
        cartActions.openCart();
    };

    const ASPECT_RATIOS = {
        square: '100%',
        portrait: '133%', 
        landscape: '56.25%', 
    };

    return (
        <StorefrontProvider scopedProduct={product}>
            {renderBuiltIn ? (
                <div
                    style={{
                        background: T.surface,
                        border: cardStyle === 'bordered' ? `1px solid ${T.border}` : 'none',
                        boxShadow: cardStyle === 'shadowed' ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
                        borderRadius: 14,
                        overflow: 'hidden',
                        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        fontFamily: "'Inter', -apple-system, sans-serif",
                        cursor: 'pointer',
                        position: 'relative',
                    }}
                    onMouseEnter={e => {
                        if (cardStyle === 'bordered') e.currentTarget.style.borderColor = T.accent;
                        if (cardStyle === 'shadowed') {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (cardStyle === 'bordered') e.currentTarget.style.borderColor = T.border;
                        if (cardStyle === 'shadowed') {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                        }
                    }}
                >
                    {/* Image */}
                    <div style={{
                        position: 'relative', width: '100%',
                        paddingBottom: ASPECT_RATIOS[imageAspectRatio], 
                        overflow: 'hidden',
                        background: T.surface2,
                    }}>
                        <div style={{ position: 'absolute', inset: 0 }}>
                            <OmnoraImage
                                src={product.featured_image}
                                alt={product.title}
                                isOutOfStock={isOutOfStock}
                                style={{
                                    width: '100%', height: '100%',
                                    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                                }}
                            />
                        </div>

                        {/* Discount Badge */}
                        {showBadge && hasDiscount && (
                            <div style={{
                                position: 'absolute', top: 10, left: 10,
                                background: T.danger, color: '#fff',
                                fontSize: 10, fontWeight: 800,
                                padding: '4px 8px', borderRadius: 6,
                            }}>
                                -{discountPct}%
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px 16px' }}>
                        <p style={{
                            fontSize: 14, fontWeight: 600, color: T.text,
                            margin: '0 0 8px', lineHeight: 1.3,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {product.title}
                        </p>
                        {showPrice && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: T.accent }}>
                                    ${displayPrice.toFixed(2)}
                                </span>
                                {hasDiscount && (
                                    <span style={{ fontSize: 12, color: T.textMuted, textDecoration: 'line-through' }}>
                                        ${comparePrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        )}

                        {showAddToCart && isAvailable && (
                            <button
                                onClick={handleQuickAdd}
                                style={{
                                    width: '100%', marginTop: '14px', padding: '10px',
                                    background: T.accent, border: 'none', borderRadius: '8px',
                                    color: '#fff', fontSize: '13px', fontWeight: 700,
                                    cursor: 'pointer', transition: 'background 0.2s',
                                    textAlign: 'center'
                                }}
                            >
                                Buy Now
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                children
            )}
        </StorefrontProvider>
    );
};

export default ProductCard;
