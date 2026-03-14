/**
 * UpsellWidget: AOV Booster Block
 *
 * Reads StorefrontContext for catalog products + CartStore for current items.
 * Renders products NOT already in the cart as upsell suggestions.
 * Fully reactive — adding an upsell item updates the widget.
 * Registered in BuilderRegistry as 'upsell_widget'.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { useStorefront } from '../../context/StorefrontContext';
import type { Product } from '../../context/StorefrontContext';
import { useCart, cartActions } from '../../hooks/useCart';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UpsellWidgetProps {
    nodeId: string;
    title?: string;
    maxItems?: number;
    layout?: 'horizontal' | 'compact';
    accentColor?: string;
    bgColor?: string;
    children?: React.ReactNode;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    success: '#34d399',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const UpsellWidget: React.FC<UpsellWidgetProps> = ({
    nodeId,
    title = 'Frequently Bought Together',
    maxItems = 3,
    layout = 'horizontal',
    accentColor = '#7c6dfa',
    bgColor = '#13131a',
}) => {
    const { state } = useStorefront();
    const cart = useCart();

    // Get products NOT in the cart
    const upsellProducts = useMemo(() => {
        const allProducts: Product[] = state.collection?.fullProducts || [];
        const cartIds = new Set(cart.items.map((i: { id: string }) => i.id));

        return allProducts
            .filter((p: Product) => !cartIds.has(p.id))
            .slice(0, maxItems);
    }, [state.collection, cart.items, maxItems]);

    if (upsellProducts.length === 0) {
        return null; // Hide if nothing to upsell
    }

    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '24px',
                background: bgColor,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
            }}
        >
            <h3 style={{
                fontSize: 15, fontWeight: 800, color: T.text,
                margin: '0 0 18px', letterSpacing: '-0.02em',
            }}>
                {title}
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: layout === 'compact' ? 'column' : 'row',
                gap: 12,
            }}>
                {upsellProducts.map((product: Product) => (
                    <UpsellCard
                        key={product.id}
                        product={product}
                        accentColor={accentColor}
                        isCompact={layout === 'compact'}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Upsell Card ──────────────────────────────────────────────────────────────

const UpsellCard: React.FC<{
    product: Product;
    accentColor: string;
    isCompact: boolean;
}> = ({ product, accentColor, isCompact }) => {
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const imgSrc = product.images[0]?.src || '';

    const handleAdd = useCallback(() => {
        setAdding(true);
        setTimeout(() => {
            cartActions.addItem({
                id: product.id,
                variantId: product.id,
                title: product.title,
                price: product.price,
                image: imgSrc,
            });
            setAdding(false);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
        }, 300);
    }, [product, imgSrc]);

    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discount = hasDiscount
        ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
        : 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: isCompact ? 'row' : 'column',
            gap: 12,
            flex: isCompact ? undefined : 1,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: 12,
            transition: 'border-color 0.15s',
        }}>
            {/* Image */}
            <div style={{
                width: isCompact ? 56 : '100%',
                height: isCompact ? 56 : 100,
                borderRadius: 8, overflow: 'hidden',
                background: '#0d0d18', flexShrink: 0,
            }}>
                {imgSrc && (
                    <img src={imgSrc} alt={product.title} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{
                    fontSize: 12, fontWeight: 600, color: T.text,
                    margin: 0, lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {product.title}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>
                        ${product.price.toFixed(2)}
                    </span>
                    {hasDiscount && (
                        <>
                            <span style={{ fontSize: 11, color: T.textMuted, textDecoration: 'line-through' }}>
                                ${product.compareAtPrice!.toFixed(2)}
                            </span>
                            <span style={{
                                fontSize: 9, fontWeight: 700, color: T.success,
                                background: 'rgba(52,211,153,0.1)',
                                padding: '2px 6px', borderRadius: 4,
                            }}>
                                -{discount}%
                            </span>
                        </>
                    )}
                </div>

                <button
                    onClick={handleAdd}
                    disabled={adding || added}
                    style={{
                        marginTop: 'auto',
                        padding: '7px 14px',
                        background: added
                            ? 'rgba(52,211,153,0.1)'
                            : `${accentColor}18`,
                        border: `1px solid ${added ? T.success + '30' : accentColor + '30'}`,
                        borderRadius: 8,
                        color: added ? T.success : accentColor,
                        fontSize: 11, fontWeight: 700,
                        cursor: adding || added ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        letterSpacing: '0.02em',
                    }}
                >
                    {adding ? '...' : added ? '✓ Added' : '+ Add'}
                </button>
            </div>
        </div>
    );
};

export default UpsellWidget;
