import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../../lib/supabaseClient';
import { PixelManager } from '../../../api/PixelManager';
import { Shield, Lock, CreditCard, Truck, ChevronRight, Package, AlertTriangle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const CheckoutFlow: React.FC<{ cart: any[] }> = ({ cart }) => {
    const [step, setStep] = useState<'info' | 'shipping' | 'payment'>('info');
    const [info, setInfo] = useState({ email: '', first_name: '', last_name: '', address: '', city: '', zip: '', country: 'US' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalCents = cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);

    const handleNext = () => {
        if (step === 'info') setStep('shipping');
        else if (step === 'shipping') setStep('payment');
    };

    return (
        <div style={{ maxWidth: 1100, margin: '60px auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 60, padding: '0 20px' }}>
            {/* Left: Multi-step Flow */}
            <div>
                <nav style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: step === 'info' ? '#FF6B35' : '#71717a' }}>Information</span>
                    <ChevronRight size={14} color="#27272a" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: step === 'shipping' ? '#FF6B35' : '#71717a' }}>Shipping</span>
                    <ChevronRight size={14} color="#27272a" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: step === 'payment' ? '#FF6B35' : '#71717a' }}>Payment</span>
                </nav>

                <main style={{ background: '#131316', borderRadius: 20, border: '1px solid #27272a', padding: 40 }}>
                    {step === 'info' && <InfoStep info={info} setInfo={setInfo} onNext={handleNext} />}
                    {step === 'shipping' && <ShippingStep onNext={handleNext} />}
                    {step === 'payment' && (
                        <Elements stripe={stripePromise}>
                            <PaymentStep cart={cart} info={info} totalCents={totalCents} />
                        </Elements>
                    )}
                </main>
            </div>

            {/* Right: Cart Summary */}
            <aside style={{ position: 'sticky', top: 40, height: 'fit-content' }}>
                <div style={{ padding: 24, background: '#09090b', border: '1px solid #27272a', borderRadius: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Order Summary</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                        {cart.map(item => (
                            <div key={item.variant_id} style={{ display: 'flex', gap: 16 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#1c1c22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.title}</div>
                                    <div style={{ fontSize: 11, color: '#71717a' }}>Qty: {item.quantity}</div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${((item.price_cents * item.quantity) / 100).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: '1px solid #27272a', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#FF6B35' }}>${(totalCents / 100).toFixed(2)}</span>
                    </div>
                </div>
            </aside>
        </div>
    );
};

const InfoStep = ({ info, setInfo, onNext }: any) => (
    <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Shipping Address</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <input placeholder="First Name" value={info.first_name} onChange={e => setInfo({...info, first_name: e.target.value})} style={InputStyle} />
            <input placeholder="Last Name" value={info.last_name} onChange={e => setInfo({...info, last_name: e.target.value})} style={InputStyle} />
        </div>
        <input placeholder="Address" value={info.address} onChange={e => setInfo({...info, address: e.target.value})} style={{...InputStyle, marginBottom: 16}} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
            <input placeholder="City" value={info.city} onChange={e => setInfo({...info, city: e.target.value})} style={InputStyle} />
            <input placeholder="ZIP" value={info.zip} onChange={e => setInfo({...info, zip: e.target.value})} style={InputStyle} />
            <select value={info.country} onChange={e => setInfo({...info, country: e.target.value})} style={InputStyle}>
                <option value="US">USA</option>
                <option value="CA">Canada</option>
                <option value="GB">UK</option>
            </select>
        </div>
        <button onClick={onNext} style={ButtonStyle}>Continue to Shipping</button>
    </div>
);

const ShippingStep = ({ onNext }: any) => (
    <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Shipping Method</h2>
        <div style={{ padding: 24, border: '1px solid #FF6B35', background: 'rgba(255, 107, 53, 0.05)', borderRadius: 12, marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Standard Shipping</div>
                    <div style={{ fontSize: 12, color: '#71717a' }}>3 - 5 business days</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>FREE</div>
            </div>
        </div>
        <button onClick={onNext} style={ButtonStyle}>Continue to Payment</button>
    </div>
);

const PaymentStep = ({ cart, info, totalCents }: any) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handlePayment = async (e: any) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);

        // 🛡️ ATOMIC INVENTORY LOCK (Task 2.8)
        // 1. Create Payment Intent + Reserve Stock
        const response = await fetch('/api/checkout/reserve', {
            method: 'POST',
            body: JSON.stringify({ cart, email: info.email })
        });
        const { clientSecret, error } = await response.json();

        if (error) {
            alert(error);
            setLoading(false);
            return;
        }

        // 2. Confirm Payment
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: elements.getElement(CardElement)! }
        });

        if (result.error) {
            alert(result.error.message);
            // 🛡️ RECOVERY: Reservation will auto-release after 15m or manual retry logic
        } else {
            PixelManager.track('purchase', { value: totalCents / 100, orderId: result.paymentIntent.id });
            window.location.href = `/checkout/success?order=${result.paymentIntent.id}`;
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handlePayment}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Payment Information</h2>
            <div style={{ padding: 20, border: '1px solid #27272a', borderRadius: 12, marginBottom: 40, background: '#09090b' }}>
                <CardElement options={{ style: { base: { color: '#fff', fontSize: '16px', '::placeholder': { color: '#71717a' } } } }} />
            </div>
            <div style={{ display: 'flex', items: 'center', gap: 8, color: '#71717a', fontSize: 12, marginBottom: 32 }}>
                <Lock size={14} /> Encrypted & Secure Payment
            </div>
            <button disabled={loading} style={ButtonStyle}>{loading ? 'Syncing...' : `Pay $${(totalCents / 100).toFixed(2)}`}</button>
        </form>
    );
};

const InputStyle = { width: '100%', padding: '14px 16px', background: '#09090b', border: '1px solid #27272a', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' };
const ButtonStyle = { width: '100%', padding: '16px', background: '#FF6B35', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' };
