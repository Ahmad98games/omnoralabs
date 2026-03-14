/**
 * BuyButton v2: Variant-aware Smart Block
 * 
 * Phase 3 Upgrade: Uses selectedVariant from StorefrontContext
 * instead of base product data. Dispatches variant-specific line items
 * to CartStore.
 */
import React, { useState, useCallback } from 'react';
import { useStorefront } from '../../context/StorefrontContext';
import { cartActions } from '../../hooks/useCart';

export interface BuyButtonProps {
    nodeId: string;
    buttonText?: string;
    buttonColor?: string;
    textColor?: string;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    showPrice?: boolean;
    children?: React.ReactNode;
}

const SIZE_MAP = {
    small: { padding: '10px 20px', fontSize: 13 },
    medium: { padding: '14px 28px', fontSize: 15 },
    large: { padding: '18px 36px', fontSize: 17 },
};

export const BuyButton: React.FC<BuyButtonProps> = ({
    nodeId,
    buttonText = 'Add to Cart',
    buttonColor = '#7c6dfa',
    textColor = '#ffffff',
    size = 'medium',
    fullWidth = true,
    showPrice = true,
}) => {
    const { state } = useStorefront();
    const product = state.product;
    const selectedVariant = state.selectedVariant;
    const [isAdding, setIsAdding] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    const sizeStyle = SIZE_MAP[size] || SIZE_MAP.medium;

    const handleClick = useCallback(() => {
        if (!product || isAdding) return;

        // Use selectedVariant if available, fall back to base product
        const variant = selectedVariant;
        const isVariantSoldOut = variant ? !variant.available : !product.available;
        if (isVariantSoldOut) return;

        setIsAdding(true);

        cartActions.addItem({
            id: product.id,
            variantId: variant?.id,
            title: variant
                ? `${product.title} — ${variant.title}`
                : product.title,
            price: variant?.price ?? product.price,
            compareAtPrice: variant?.compareAtPrice ?? product.compareAtPrice,
            image: variant?.image ?? product.featured_image,
            handle: product.handle,
        });

        setTimeout(() => {
            setIsAdding(false);
            setJustAdded(true);
            cartActions.openCart();
            setTimeout(() => setJustAdded(false), 2000);
        }, 400);
    }, [product, selectedVariant, isAdding]);

    // No product in context
    if (!product) {
        return (
            <div
                data-node-id={nodeId}
                style={{
                    padding: sizeStyle.padding,
                    background: '#2a2a3a',
                    borderRadius: 12,
                    color: '#8b8ba0',
                    fontSize: sizeStyle.fontSize,
                    fontWeight: 600,
                    textAlign: 'center',
                    opacity: 0.6,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                No product in context
            </div>
        );
    }

    const isSoldOut = selectedVariant ? !selectedVariant.available : !product.available;
    const displayPrice = selectedVariant?.price ?? product.price;
    const label = isSoldOut
        ? 'Sold Out'
        : justAdded
            ? '\u2713 Added!'
            : isAdding
                ? 'Adding...'
                : buttonText;

    return (
        <button
            data-node-id={nodeId}
            onClick={handleClick}
            disabled={isSoldOut || isAdding}
            style={{
                width: fullWidth ? '100%' : 'auto',
                padding: sizeStyle.padding,
                background: isSoldOut
                    ? '#2a2a3a'
                    : justAdded
                        ? '#059669'
                        : `linear-gradient(135deg, ${buttonColor}, ${adjustColor(buttonColor, 30)})`,
                border: 'none',
                borderRadius: 12,
                color: isSoldOut ? '#5a5a70' : textColor,
                fontSize: sizeStyle.fontSize,
                fontWeight: 700,
                cursor: isSoldOut ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                fontFamily: "'Inter', -apple-system, sans-serif",
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                transform: isAdding ? 'scale(0.97)' : 'scale(1)',
                boxShadow: isSoldOut
                    ? 'none'
                    : justAdded
                        ? '0 4px 20px rgba(5,150,105,0.3)'
                        : `0 4px 20px ${hexToRgba(buttonColor, 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                if (!isSoldOut && !isAdding) {
                    e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                    e.currentTarget.style.boxShadow = `0 8px 30px ${hexToRgba(buttonColor, 0.4)}`;
                }
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isSoldOut ? 'none' : `0 4px 20px ${hexToRgba(buttonColor, 0.3)}`;
            }}
        >
            {!justAdded && !isAdding && !isSoldOut && (
                <span style={{ fontSize: sizeStyle.fontSize - 1 }}>{'\uD83D\uDED2'}</span>
            )}

            {isAdding && (
                <span style={{
                    display: 'inline-block',
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'omnoraCartSpin 0.6s linear infinite',
                }} />
            )}

            <span>{label}</span>

            {showPrice && !isSoldOut && !justAdded && !isAdding && (
                <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '3px 10px',
                    borderRadius: 8,
                    fontSize: sizeStyle.fontSize - 3,
                    fontWeight: 800,
                    marginLeft: 4,
                }}>
                    ${displayPrice.toFixed(2)}
                </span>
            )}

            <style>{`
                @keyframes omnoraCartSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </button>
    );
};

function adjustColor(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return `rgba(${(num >> 16) & 0xff},${(num >> 8) & 0xff},${num & 0xff},${alpha})`;
}

export default BuyButton;
