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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductCardProps {
    product: Product;
    /** If true, render the built-in card UI. If false, render children with scoped context only. */
    renderBuiltIn?: boolean;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    renderBuiltIn = true,
    children,
}) => {
    const selectedVariant = product.variants.find(v => v.id === product.selectedVariantId)
        ?? product.variants[0]
        ?? null;

    const displayPrice = selectedVariant?.price ?? product.price;
    const comparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
    const hasDiscount = comparePrice && comparePrice > displayPrice;
    const discountPct = hasDiscount
        ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
        : 0;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!product.available) return;

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

    return (
        <StorefrontProvider scopedProduct={product}>
            {renderBuiltIn ? (
                <div
                    style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 14,
                        overflow: 'hidden',
                        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        fontFamily: "'Inter', -apple-system, sans-serif",
                        cursor: 'pointer',
                        position: 'relative',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
                        const btn = e.currentTarget.querySelector('[data-quick-add]') as HTMLElement;
                        if (btn) btn.style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        const btn = e.currentTarget.querySelector('[data-quick-add]') as HTMLElement;
                        if (btn) btn.style.opacity = '0';
                    }}
                >
                    {/* Image */}
                    <div style={{
                        position: 'relative', width: '100%',
                        paddingBottom: '100%', overflow: 'hidden',
                        background: T.surface2,
                    }}>
                        <img
                            src={product.featured_image}
                            alt={product.title}
                            style={{
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                            }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />

                        {/* Discount Badge */}
                        {hasDiscount && (
                            <div style={{
                                position: 'absolute', top: 10, left: 10,
                                background: T.danger, color: '#fff',
                                fontSize: 10, fontWeight: 800,
                                padding: '4px 8px', borderRadius: 6,
                                letterSpacing: '0.05em',
                            }}>
                                -{discountPct}%
                            </div>
                        )}

                        {/* Sold Out Badge */}
                        {!product.available && (
                            <div style={{
                                position: 'absolute', top: 10, right: 10,
                                background: 'rgba(0,0,0,0.7)', color: T.textDim,
                                fontSize: 10, fontWeight: 700,
                                padding: '4px 8px', borderRadius: 6,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>
                                Sold Out
                            </div>
                        )}

                        {/* Quick Add Button */}
                        {product.available && (
                            <button
                                data-quick-add
                                onClick={handleQuickAdd}
                                style={{
                                    position: 'absolute', bottom: 10, left: 10, right: 10,
                                    padding: '10px 0',
                                    background: 'rgba(124,109,250,0.9)',
                                    backdropFilter: 'blur(8px)',
                                    border: 'none', borderRadius: 8,
                                    color: '#fff', fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', opacity: 0,
                                    transition: 'opacity 0.2s, transform 0.2s',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Quick Add
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px 16px' }}>
                        <p style={{
                            fontSize: 11, fontWeight: 600, color: T.textMuted,
                            margin: '0 0 4px', textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}>
                            {product.vendor}
                        </p>
                        <p style={{
                            fontSize: 14, fontWeight: 600, color: T.text,
                            margin: '0 0 8px', lineHeight: 1.3,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {product.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                fontSize: 15, fontWeight: 800, color: T.accent,
                                letterSpacing: '-0.02em',
                            }}>
                                ${displayPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                                <span style={{
                                    fontSize: 12, color: T.textMuted,
                                    textDecoration: 'line-through',
                                }}>
                                    ${comparePrice.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Variant Swatches (mini) */}
                        {product.options.length > 0 && product.options[0].values.length > 1 && (
                            <div style={{
                                display: 'flex', gap: 4, marginTop: 10,
                                flexWrap: 'wrap',
                            }}>
                                {product.options[0].values.slice(0, 4).map(val => (
                                    <span key={val} style={{
                                        fontSize: 10, color: T.textDim,
                                        background: T.surface2,
                                        border: `1px solid ${T.border}`,
                                        padding: '2px 8px', borderRadius: 4,
                                        fontWeight: 500,
                                    }}>
                                        {val}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Custom children with scoped context */
                children
            )}
        </StorefrontProvider>
    );
};

export default ProductCard;
