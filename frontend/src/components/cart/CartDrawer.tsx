/**
 * CartDrawer: Global Slide-out Cart UI
 * 
 * Subscribes to CartStore via useCart hook.
 * Renders conditionally based on isOpen state.
 * CSS transform transitions for premium slide animation.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useCart, cartActions } from '../../hooks/useCart';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { supabase } from '../../lib/supabaseClient';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.12)',
    danger: '#ff4d6a',
    dangerDim: 'rgba(255,77,106,0.1)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    success: '#34d399',
};

export interface CartDrawerProps {
    isBuilder?: boolean;
    triggerIcon?: 'bag' | 'cart' | 'basket';
    drawerPosition?: 'right' | 'left';
    showProductImages?: boolean;
    showQuantityControls?: boolean;
    upsellEnabled?: boolean;
    upsellTitle?: string;
    upsellProductIds?: string[]; // 🛍️ Added upsell array pool source
    showFreeShippingBar?: boolean;
    freeShippingThreshold?: number;
    checkoutButtonText?: string;
    checkoutButtonColor?: string;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isBuilder = false,
    drawerPosition = 'right',
    showProductImages = true,
    showQuantityControls = true,
    upsellEnabled = false,
    upsellTitle = 'You Might Also Like',
    showFreeShippingBar = false,
    freeShippingThreshold = 50,
    checkoutButtonText = 'Proceed to Checkout',
    checkoutButtonColor = '#7c6dfa',
    upsellProductIds = [],
    triggerIcon: _triggerIcon = 'bag', // OSTT FIX: Marked as unused to satisfy linter
}) => {
    const cart = useCart();
    const backdropRef = useRef<HTMLDivElement>(null);
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [promoMsg, setPromoMsg] = useState('');
    
    // OSTT FIX: Defined proper interface for upsell products
    interface UpsellProduct {
        id: string;
        title: string;
        price: number;
        image?: string;
    }
    const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);

    const isOpen = isBuilder || cart.isOpen;

    // 🛡️ Fetch Real Upsells using pool IDs from the storefront config
    useEffect(() => {
        const fetchUpsells = async () => {
            if (!upsellEnabled || !upsellProductIds?.length) {
                setUpsellProducts([]);
                return;
            }
            try {
                const { data } = await supabase
                    .from('products')
                    .select('id, title, price, image')
                    .in('id', upsellProductIds);
                
                if (data) {
                    // Filter out items already inside the cart
                    const filtered = data.filter(p => !cart.items.some(i => i.id === p.id));
                    setUpsellProducts(filtered);
                }
            } catch (err) {
                console.error('[CartDrawer] Error fetching upsell products:', err);
            }
        };
        fetchUpsells();
    }, [upsellEnabled, upsellProductIds, cart.items]);

    // Lock body scroll when cart is open
    useEffect(() => {
        if (isOpen && !isBuilder) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, isBuilder]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && cart.isOpen && !isBuilder) cartActions.closeCart();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cart.isOpen, isBuilder]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current && !isBuilder) cartActions.closeCart();
    };

    const handleCheckout = () => {
        cartActions.closeCart();
        window.location.hash = '#/checkout';
        window.dispatchEvent(new CustomEvent('omnora:navigate', { detail: { path: '/checkout' } }));
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoStatus('loading');
        const merchantId = 'default_merchant'; // TODO: from MerchantAuthContext
        const result = await databaseClient.validateDiscountCode(promoCode.trim(), merchantId);
        if (result) {
            cartActions.applyDiscount({ code: result.code, type: result.type, value: result.value });
            setPromoMsg(`Code ${result.code} applied! -${result.type === 'percentage' ? `${result.value}%` : `$${result.value.toFixed(2)}`}`);
            setPromoStatus('success');
        } else {
            setPromoMsg('Invalid or expired code.');
            setPromoStatus('error');
        }
    };

    const handleRemovePromo = () => {
        cartActions.clearDiscount();
        setPromoCode('');
        setPromoMsg('');
        setPromoStatus('idle');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                ref={backdropRef}
                onClick={handleBackdropClick}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99990,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: isBuilder ? 'none' : 'opacity 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
            />

            {/* Drawer */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: drawerPosition === 'right' ? 0 : 'auto',
                    left: drawerPosition === 'left' ? 0 : 'auto',
                    bottom: 0,
                    width: 420,
                    maxWidth: '90vw',
                    background: T.bg,
                    borderLeft: drawerPosition === 'right' ? `1px solid ${T.border}` : 'none',
                    borderRight: drawerPosition === 'left' ? `1px solid ${T.border}` : 'none',
                    zIndex: 99991,
                    transform: isOpen ? 'translateX(0)' : drawerPosition === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
                    transition: isBuilder ? 'none' : 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    boxShadow: isOpen ? (drawerPosition === 'right' ? '-20px 0 60px rgba(0,0,0,0.5)' : '20px 0 60px rgba(0,0,0,0.5)') : 'none',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', borderBottom: `1px solid ${T.border}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>🛒</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
                            Your Cart
                        </span>
                        {cart.totalItems > 0 && (
                            <span style={{
                                background: T.accent, color: '#fff',
                                fontSize: 10, fontWeight: 700,
                                padding: '2px 8px', borderRadius: 20,
                                letterSpacing: '0.05em',
                            }}>
                                {cart.totalItems}
                            </span>
                        )}
                    </div>
                    {!isBuilder && (
                        <button
                            onClick={cartActions.closeCart}
                            style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 8, width: 32, height: 32,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: T.textDim, fontSize: 14,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.color = T.text; }}
                            onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textDim; }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Free Shipping Bar */}
                {showFreeShippingBar && (
                    <div style={{ padding: '12px 24px', background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: T.textDim }}>
                            <span style={{ fontWeight: 600 }}>Free Shipping Progress</span>
                            <span>
                                {cart.totalAmount >= freeShippingThreshold 
                                    ? "Unlocked! 🎉" 
                                    : `$${Math.max(0, freeShippingThreshold - cart.totalAmount).toFixed(2)} away`}
                            </span>
                        </div>
                        <div style={{ height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ 
                                height: '100%', 
                                width: `${Math.min(100, (cart.totalAmount / freeShippingThreshold) * 100)}%`, 
                                background: T.success,
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                )}

                {/* Items */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '16px 24px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${T.border} transparent`,
                }}>
                    {cart.items.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', gap: 12,
                        }}>
                            <span style={{ fontSize: 48, opacity: 0.3 }}>🛍️</span>
                            <p style={{ color: T.textDim, fontSize: 14, fontWeight: 500, margin: 0 }}>
                                Your cart is empty
                            </p>
                            <p style={{ color: T.textMuted, fontSize: 12, margin: 0 }}>
                                Add items to get started
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {cart.items.map(item => (
                                <CartItemRow 
                                    key={`${item.id}-${item.variantId || 'default'}`} 
                                    item={item} 
                                    showProductImages={showProductImages}
                                    showQuantityControls={showQuantityControls}
                                />
                            ))}

                            {/* Upsell Widget */}
                            {upsellEnabled && upsellProducts.length > 0 && (
                                <div style={{ marginTop: 12, padding: '14px', background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 10px' }}>{upsellTitle}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {upsellProducts.map(prod => (
                                            <div key={prod.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 8, background: T.surface2, flexShrink: 0, overflow: 'hidden' }}>
                                                    {prod.image ? (
                                                        <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎁</div>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.title}</p>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: T.accent, margin: '4px 0 0' }}>+${prod.price.toFixed(2)}</p>
                                                </div>
                                                <button 
                                                    onClick={() => cartActions.addItem({ id: prod.id, title: prod.title, price: prod.price, image: prod.image || '' })}
                                                    style={{ padding: '6px 14px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(cart.items.length > 0 || isBuilder) && (
                    <div style={{
                        borderTop: `1px solid ${T.border}`,
                        padding: '20px 24px',
                        background: T.surface,
                    }}>
                        {/* Subtotal */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 6,
                        }}>
                            <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Subtotal
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: T.textDim }}>
                                ${cart.totalAmount.toFixed(2)}
                            </span>
                        </div>

                        {/* Promo Code Input */}
                        {!cart.appliedDiscount ? (
                            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                <input
                                    value={promoCode}
                                    disabled={isBuilder}
                                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="Promo code"
                                    onKeyDown={e => { if (e.key === 'Enter') handleApplyPromo(); }}
                                    style={{
                                        flex: 1, padding: '8px 12px', background: T.surface2,
                                        border: `1px solid ${T.border}`, borderRadius: 8,
                                        color: T.text, fontSize: 12, fontWeight: 600,
                                        fontFamily: 'monospace', outline: 'none',
                                        letterSpacing: '0.05em',
                                    }}
                                />
                                <button
                                    onClick={handleApplyPromo}
                                    disabled={promoStatus === 'loading' || isBuilder}
                                    style={{
                                        padding: '8px 16px', background: T.accent,
                                        border: 'none', borderRadius: 8,
                                        color: '#fff', fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer', opacity: promoStatus === 'loading' || isBuilder ? 0.5 : 1,
                                    }}
                                >
                                    {promoStatus === 'loading' ? '…' : 'Apply'}
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '6px 10px', borderRadius: 8,
                                background: 'rgba(52,211,153,0.08)', marginBottom: 8,
                            }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: T.success }}>
                                    🏷️ {cart.appliedDiscount.code}
                                </span>
                                <button onClick={handleRemovePromo} style={{
                                    background: 'none', border: 'none', color: T.textMuted,
                                    fontSize: 12, cursor: 'pointer', fontWeight: 600,
                                }}>
                                    Remove
                                </button>
                            </div>
                        )}

                        {/* Promo feedback */}
                        {promoMsg && (
                            <p style={{
                                fontSize: 11, fontWeight: 600, margin: '0 0 8px',
                                color: promoStatus === 'success' ? T.success : T.danger,
                            }}>{promoMsg}</p>
                        )}

                        {/* Discount row */}
                        {cart.discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: T.success, fontWeight: 600 }}>Discount</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: T.success }}>-${cart.discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Total */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 6, paddingTop: 6, borderTop: `1px solid ${T.border}`,
                        }}>
                            <span style={{ fontSize: 12, color: T.text, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Total
                            </span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                                ${cart.finalTotal.toFixed(2)}
                            </span>
                        </div>

                        <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 16px', lineHeight: 1.4 }}>
                            Shipping & taxes calculated at checkout.
                        </p>

                        {/* Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={isBuilder}
                            style={{
                                width: '100%', padding: '14px 24px',
                                background: checkoutButtonColor,
                                border: 'none', borderRadius: 12,
                                color: '#fff', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', letterSpacing: '0.03em',
                                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                                boxShadow: `0 4px 20px rgba(124,109,250,0.1)`,
                                opacity: isBuilder ? 0.8 : 1
                            }}
                        >
                            {checkoutButtonText} — ${cart.finalTotal.toFixed(2)}
                        </button>

                        {/* Clear Cart */}
                        <button
                            onClick={cartActions.clearCart}
                            style={{
                                width: '100%', padding: '10px 24px', marginTop: 8,
                                background: 'transparent', border: `1px solid ${T.border}`,
                                borderRadius: 10, color: T.textDim, fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}
                        >
                            Clear Cart
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

// ─── Cart Item Row ────────────────────────────────────────────────────────────

const CartItemRow: React.FC<{ 
    item: import('../../platform/core/CartStore').CartItem;
    showProductImages?: boolean;
    showQuantityControls?: boolean;
}> = ({ item, showProductImages = true, showQuantityControls = true }) => {
    return (
        <div style={{
            display: 'flex', gap: 14,
            padding: 14, background: T.surface,
            border: `1px solid ${T.border}`, borderRadius: 12,
            transition: 'border-color 0.15s',
        }}>
            {/* Product Image */}
            {showProductImages && (
                <div style={{
                    width: 72, height: 72, borderRadius: 8, overflow: 'hidden',
                    background: T.surface2, flexShrink: 0,
                }}>
                    <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: 13, fontWeight: 600, color: T.text,
                    margin: '0 0 4px', lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {item.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>
                        ${item.price.toFixed(2)}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span style={{
                            fontSize: 11, color: T.textMuted,
                            textDecoration: 'line-through',
                        }}>
                            ${item.compareAtPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {showQuantityControls ? (
                        <>
                            <QtyButton
                                label="−"
                                onClick={() => cartActions.updateQuantity(item.id, item.quantity - 1, item.variantId)}
                            />
                            <span style={{
                                width: 32, textAlign: 'center',
                                fontSize: 12, fontWeight: 700, color: T.text,
                            }}>
                                {item.quantity}
                            </span>
                            <QtyButton
                                label="+"
                                onClick={() => cartActions.updateQuantity(item.id, item.quantity + 1, item.variantId)}
                            />
                        </>
                    ) : (
                        <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500 }}>Qty: {item.quantity}</span>
                    )}

                    {/* Remove */}
                    <button
                        onClick={() => cartActions.removeItem(item.id, item.variantId)}
                        style={{
                            marginLeft: 'auto',
                            background: T.dangerDim, border: 'none', borderRadius: 6,
                            width: 28, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: T.danger, fontSize: 12,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.danger; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.dangerDim; e.currentTarget.style.color = T.danger; }}
                        title="Remove item"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Quantity Button ──────────────────────────────────────────────────────────

const QtyButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: 28, height: 28, borderRadius: 6,
            border: `1px solid ${T.border}`, background: T.surface2,
            color: T.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentDim; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface2; }}
    >
        {label}
    </button>
);

export default CartDrawer;
