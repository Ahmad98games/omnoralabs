import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, cartActions } from '../../hooks/useCart';
import { orderStore, type OrderLineItem } from '../../platform/core/OrderStore';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { supabase } from '../../lib/supabaseClient';
import { useStorefront } from '../../context/StorefrontContext';
import { PixelManager } from '../../utils/PixelManager';
import { CouponValidator } from '../../utils/CouponValidator';
import { AbandonedCartService } from '../../services/AbandonedCartService';

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
    stripe: '#635bff',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CheckoutBlockProps {
    nodeId: string;
    children?: React.ReactNode;
}

type PaymentMode = 'form' | 'processing' | 'stripe-redirect';

// ─── Component ────────────────────────────────────────────────────────────────

export const CheckoutBlock: React.FC<CheckoutBlockProps> = ({ nodeId }) => {
    const cart = useCart();
    const { state } = useStorefront();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('form');
    const [formData, setFormData] = useState({
        name: '', email: '', address: '', city: '', zip: '', phone: '',
    });

    const cartIdRef = React.useRef(crypto.randomUUID());
    const checkoutSessionIdRef = React.useRef(crypto.randomUUID());
    const trackingEventIdRef = React.useRef(crypto.randomUUID());
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Auto-save draft logic for abandoned carts
    React.useEffect(() => {
        if (formData.phone.length > 5 && cart.items.length > 0) {
            const timeout = setTimeout(() => {
                AbandonedCartService.saveDraft({
                    cart_id: cartIdRef.current,
                    merchant_id: state.merchantId || 'default_merchant',
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    cart_json: cart,
                    cart_value: cart.finalTotal
                });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [formData.phone, formData.name, cart]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [promoMsg, setPromoMsg] = useState('');

    const validate = useCallback((): boolean => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = 'Name is required';
        if (!formData.email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
        if (!formData.address.trim()) e.address = 'Address is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [formData]);

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    // ── Promo Code Handler ─────────────────────────────────────────────────
    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoStatus('loading');
        const merchantId = state.merchantId || 'default_merchant';
        const result = await CouponValidator.validateCoupon(promoCode.trim(), merchantId);
        if (result) {
            cartActions.applyDiscount({ id: result.id, code: result.code, type: result.type, value: result.value } as any);
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

    // ── Standard Place Order (local save + redirect) ──────────────────────
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || cart.items.length === 0) return;

        setIsSubmitting(true);

        // ── Distributed Checkout Idempotency Check ──
        for (const item of lineItems) {
            const { data, error } = await supabase.rpc('deduct_inventory_v2', {
                p_id: item.id,
                p_quantity: item.quantity,
                p_session_key: checkoutSessionIdRef.current
            });

            if (error || (data && !data.success)) {
                setIsSubmitting(false);
                setCheckoutError(data?.error || error?.message || 'Maazrat! Ye item abhi abhi stock se khatam ho gaya.');
                return;
            }
        }

        PixelManager.trackEvent('Purchase', { value: cart.finalTotal, currency: 'USD', eventID: trackingEventIdRef.current });

        if (cart.appliedDiscount && (cart.appliedDiscount as any).id) {
            await CouponValidator.incrementUsedCount((cart.appliedDiscount as any).id);
        }

        const orderId = orderStore.placeOrder(
            {
                name: formData.name.trim(), email: formData.email.trim(),
                address: formData.address.trim(), city: formData.city.trim(),
                zip: formData.zip.trim(), phone: formData.phone.trim(),
                tracking_event_id: trackingEventIdRef.current
            },
            lineItems, cart.finalTotal,
        );

        // Smart Abandoned Cart: Auto-Conversion by Phone Number
        if (formData.phone) {
            AbandonedCartService.markRecoveredByPhone(formData.phone, state.merchantId || 'default_merchant');
        }

        cartActions.clearCart();
        setIsSubmitting(false);
        window.location.hash = `#/thank-you?orderId=${orderId}`;
        window.dispatchEvent(new CustomEvent('omnora:navigate', { detail: { path: '/thank-you', orderId } }));
    }, [formData, cart, validate]);

    // ── Stripe Checkout (hosted checkout redirect) ───────────────────
    const handleStripeCheckout = useCallback(async () => {
        if (!validate() || cart.items.length === 0) return;

        setPaymentMode('processing');
        setIsSubmitting(true);

        try {
            // Call Supabase Edge Function to create Stripe Checkout Session
            const { data, error } = await supabase.functions.invoke('process-merchant-checkout', {
                body: {
                    merchantId: state.merchantId,
                    customerEmail: formData.email.trim(),
                    cartItems: cart.items.map(item => ({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        variantId: item.variantId,
                    })),
                }
            });

            if (error) throw error;
            if (data?.checkoutUrl) {
                setPaymentMode('stripe-redirect');
                console.log(`[Omnora Checkout - BYOK] 🔀 Redirecting to Stripe: ${data.checkoutUrl}`);
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('No checkout URL returned.');
            }
        } catch (err) {
            console.error('[Omnora Checkout] Stripe session failed:', err);
            alert('Payment integration error. Please try again later.');
            setPaymentMode('form');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, cart, validate, state.merchantId]);

    const tax = Math.round(cart.finalTotal * 0.08 * 100) / 100;
    const grandTotal = Math.round((cart.finalTotal + tax) * 100) / 100;

    // Empty cart state
    if (cart.items.length === 0 && !isSubmitting) {
        return (
            <div data-node-id={nodeId} style={{
                padding: 60, textAlign: 'center',
                fontFamily: "'Inter', sans-serif",
            }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.3 }}>🛒</span>
                <p style={{ color: T.textDim, fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Your cart is empty</p>
                <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Add items before checking out.</p>
            </div>
        );
    }

    return (
        <div
            data-node-id={nodeId}
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 380px',
                gap: 32,
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Left: Customer Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{
                    fontSize: 22, fontWeight: 800, color: T.text,
                    margin: 0, letterSpacing: '-0.02em',
                }}>
                    Checkout
                </h2>

                {/* Contact Section */}
                <Section title="Contact Information">
                    <FormField label="Full Name" value={formData.name} onChange={handleChange('name')} error={errors.name} placeholder="John Doe" />
                    <FormField label="Email" value={formData.email} onChange={handleChange('email')} error={errors.email} placeholder="john@example.com" type="email" />
                    <FormField label="Phone (Optional)" value={formData.phone} onChange={handleChange('phone')} placeholder="+1 (555) 000-0000" />
                </Section>

                {/* Shipping Section */}
                <Section title="Shipping Address">
                    <FormField label="Address" value={formData.address} onChange={handleChange('address')} error={errors.address} placeholder="123 Main Street" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FormField label="City" value={formData.city} onChange={handleChange('city')} placeholder="New York" />
                        <FormField label="ZIP Code" value={formData.zip} onChange={handleChange('zip')} placeholder="10001" />
                    </div>
                </Section>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        width: '100%', padding: '16px 24px',
                        background: isSubmitting
                            ? T.surface2
                            : `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
                        border: 'none', borderRadius: 12,
                        color: '#fff', fontSize: 15, fontWeight: 700,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.02em',
                        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: isSubmitting ? 'none' : `0 4px 20px rgba(124,109,250,0.3)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                >
                    {isSubmitting && (
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            style={{
                                width: 16, height: 16,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff', borderRadius: '50%',
                                display: 'inline-block',
                            }} 
                        />
                    )}
                    {isSubmitting && paymentMode !== 'stripe-redirect' ? 'Processing...' : `Place Order — $${grandTotal.toFixed(2)}`}
                </button>

                {/* Stripe Pay with Card */}
                <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={isSubmitting}
                    style={{
                        width: '100%', padding: '14px 24px',
                        background: isSubmitting
                            ? T.surface2
                            : `linear-gradient(135deg, ${T.stripe}, #8b7dff)`,
                        border: 'none', borderRadius: 12,
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.02em',
                        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(99,91,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                >
                    {paymentMode === 'processing' && (
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            style={{
                                width: 16, height: 16,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff', borderRadius: '50%',
                                display: 'inline-block',
                            }} 
                        />
                    )}
                    {paymentMode === 'stripe-redirect' ? '🔀 Redirecting to Stripe…'
                        : paymentMode === 'processing' ? 'Creating Session…'
                            : `💳 Pay with Card — $${grandTotal.toFixed(2)}`}
                </button>
            </form>

            {/* High-Priority Error Modal */}
            <AnimatePresence>
                {checkoutError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                background: T.surface, border: `1px solid ${T.danger}`,
                                borderRadius: 20, padding: 32, maxWidth: 400, width: '90%',
                                textAlign: 'center', boxShadow: '0 20px 60px rgba(255,77,106,0.3)'
                            }}
                        >
                            <div style={{
                                width: 64, height: 64, borderRadius: 32, background: 'rgba(255,77,106,0.1)',
                                color: T.danger, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                ⚠️
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Order Failed</h3>
                            <p style={{ fontSize: 15, color: T.textDim, margin: '0 0 24px', lineHeight: 1.5 }}>
                                {checkoutError}
                            </p>
                            <button
                                onClick={() => {
                                    setCheckoutError(null);
                                    checkoutSessionIdRef.current = crypto.randomUUID(); // Re-roll session ID so we can try again if they remove item
                                }}
                                style={{
                                    background: T.danger, color: '#fff', border: 'none',
                                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', width: '100%'
                                }}
                            >
                                Try Again
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right: Order Summary */}
            <div style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: 24,
                alignSelf: 'start',
                position: 'sticky',
                top: 80,
            }}>
                <h3 style={{
                    fontSize: 14, fontWeight: 700, color: T.text,
                    margin: '0 0 16px', letterSpacing: '-0.01em',
                }}>
                    Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {cart.items.map(item => (
                        <div key={`${item.id}-${item.variantId || 'd'}`} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 8,
                                overflow: 'hidden', background: T.surface2, flexShrink: 0,
                                position: 'relative',
                            }}>
                                <img src={item.image} alt={item.title} style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <span style={{
                                    position: 'absolute', top: -4, right: -4,
                                    width: 18, height: 18, borderRadius: 9,
                                    background: T.accent, color: '#fff',
                                    fontSize: 9, fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {item.quantity}
                                </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: 12, fontWeight: 600, color: T.text,
                                    margin: 0, whiteSpace: 'nowrap',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {item.title}
                                </p>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flexShrink: 0 }}>
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{
                    borderTop: `1px solid ${T.border}`,
                    marginTop: 16, paddingTop: 16,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <SummaryRow label="Subtotal" value={`$${cart.totalAmount.toFixed(2)}`} />

                    {/* Promo Code Input */}
                    {!cart.appliedDiscount ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="Promo code"
                                onKeyDown={e => { if (e.key === 'Enter') handleApplyPromo(); }}
                                style={{
                                    flex: 1, padding: '7px 10px', background: T.surface2,
                                    border: `1px solid ${T.border}`, borderRadius: 6,
                                    color: T.text, fontSize: 11, fontWeight: 600,
                                    fontFamily: 'monospace', outline: 'none',
                                    letterSpacing: '0.05em',
                                }}
                            />
                            <button
                                onClick={handleApplyPromo}
                                disabled={promoStatus === 'loading'}
                                style={{
                                    padding: '7px 14px', background: T.accent,
                                    border: 'none', borderRadius: 6,
                                    color: '#fff', fontSize: 10, fontWeight: 700,
                                    cursor: 'pointer', opacity: promoStatus === 'loading' ? 0.5 : 1,
                                }}
                            >
                                {promoStatus === 'loading' ? '…' : 'Apply'}
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '5px 8px', borderRadius: 6,
                            background: 'rgba(52,211,153,0.08)',
                        }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.success }}>
                                🏷️ {cart.appliedDiscount.code}
                            </span>
                            <button onClick={handleRemovePromo} style={{
                                background: 'none', border: 'none', color: T.textMuted,
                                fontSize: 11, cursor: 'pointer', fontWeight: 600,
                            }}>Remove</button>
                        </div>
                    )}

                    {promoMsg && (
                        <p style={{
                            fontSize: 10, fontWeight: 600, margin: 0,
                            color: promoStatus === 'success' ? T.success : T.danger,
                        }}>{promoMsg}</p>
                    )}

                    {cart.discountAmount > 0 && (
                        <SummaryRow label="Discount" value={`-$${cart.discountAmount.toFixed(2)}`} accent />
                    )}

                    <SummaryRow label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
                    <SummaryRow label="Shipping" value="Free" dimValue />
                    <div style={{
                        borderTop: `1px solid ${T.border}`,
                        paddingTop: 12, marginTop: 4,
                        display: 'flex', justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Total</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: T.accent, letterSpacing: '-0.02em' }}>
                            ${grandTotal.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: 20, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 12,
    }}>
        <span style={{
            fontSize: 11, fontWeight: 700, color: T.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
            {title}
        </span>
        {children}
    </div>
);

const FormField: React.FC<{
    label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string; placeholder?: string; type?: string;
}> = ({ label, value, onChange, error, placeholder, type = 'text' }) => (
    <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6 }}>
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%', padding: '11px 14px',
                background: T.surface2,
                border: `1.5px solid ${error ? T.danger : T.border}`,
                borderRadius: 10, color: T.text,
                fontSize: 14, fontWeight: 500,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
            }}
            onFocus={e => { if (!error) e.currentTarget.style.borderColor = T.accent; }}
            onBlur={e => { if (!error) e.currentTarget.style.borderColor = T.border; }}
        />
        {error && <span style={{ fontSize: 11, color: T.danger, marginTop: 4, display: 'block' }}>{error}</span>}
    </div>
);

const SummaryRow: React.FC<{ label: string; value: string; dimValue?: boolean; accent?: boolean }> = ({ label, value, dimValue, accent }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: accent ? T.success : T.textDim }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: accent ? T.success : dimValue ? T.textMuted : T.text }}>{value}</span>
    </div>
);

export default CheckoutBlock;
