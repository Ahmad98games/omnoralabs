import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle, Package, Receipt, ArrowRight, Loader2, Loader } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useBuilder } from '../../context/BuilderContext';
import { useToast } from '../../context/ToastContext';

interface OrderItem {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    fulfillment: string;
    grandTotal: number;
    email: string;
    items: OrderItem[];
    createdAt: string;
}

export const ThankYouPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    const { register, customer } = useCustomerAuth();
    const { activeMerchantId } = useBuilder(); // Global active merchant for the storefront
    const { showToast } = useToast();

    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);

    const [regName, setRegName] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            try {
                let orderRes;
                if (sessionId) {
                    orderRes = await supabase.from('orders').select('*').eq('stripe_session_id', sessionId).single();
                } else if (orderId) {
                    orderRes = await supabase.from('orders').select('*').eq('id', orderId).single();
                } else {
                    throw new Error("Missing order identifier format.");
                }

                if (orderRes.error || !orderRes.data) throw new Error("Order not found or still processing.");
                const orderData = orderRes.data;

                const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderData.id);

                setOrder({
                    id: orderData.id,
                    orderNumber: orderData.id.slice(0, 8).toUpperCase(),
                    status: orderData.financial_status,
                    fulfillment: orderData.fulfillment_status,
                    grandTotal: orderData.grand_total,
                    email: orderData.customer_email,
                    items: items || [],
                    createdAt: new Date(orderData.created_at).toLocaleDateString()
                });
            } catch (err: any) {
                console.error("Order fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [sessionId, orderId]);

    const handleGuestAccountUpcode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order || !activeMerchantId) return;
        setIsRegistering(true);
        try {
            await register(regName, order.email, regPassword, activeMerchantId);
            showToast("Account Created. Welcome to the portal!", "success");
            navigate('/account');
        } catch (err: any) {
            showToast(err.message || "Failed to create account.", "error");
        } finally {
            setIsRegistering(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg, #000)' }}>
                <Loader2 className="spin" size={40} color="var(--color-primary, #fff)" />
                <p style={{ marginTop: '20px', color: 'var(--color-text-secondary, #666)', fontFamily: 'var(--font-sans)', letterSpacing: '2px' }}>VERIFYING PAYMENT...</p>
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: '100px 20px', textAlign: 'center', background: 'var(--color-bg, #000)', color: 'var(--color-text, #fff)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Order Processing</h1>
                <p style={{ color: 'var(--color-text-secondary, #666)' }}>We are confirming your transaction with the blockchain or provider. Please refresh in a moment.</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg, #000)', color: 'var(--color-text, #fff)', fontFamily: 'var(--font-sans)', padding: '80px 20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
                
                {/* Visual Premium Receipt */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '40px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <div style={{ background: 'var(--color-primary, #7c6dfa)', padding: '16px', borderRadius: '50%', color: '#000', outline: '4px solid rgba(124, 109, 250, 0.2)' }}>
                            <CheckCircle size={32} />
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <p style={{ color: 'var(--color-text-secondary, #a0a0a0)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Transaction Complete</p>
                        <h2 style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-1px', margin: 0 }}>${order.grandTotal.toFixed(2)}</h2>
                        <p style={{ color: 'var(--color-text, #fff)', fontSize: '14px', marginTop: '12px', opacity: 0.8 }}>Order #{order.orderNumber}</p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '24px 0', marginBottom: '32px' }}>
                        {order.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i !== order.items.length - 1 ? '16px' : '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={16} color="var(--color-text-secondary, #a0a0a0)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #888)' }}>Qty: {item.quantity}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 500 }}>${item.total_price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-secondary, #a0a0a0)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Receipt size={14} /> Tracking emailed to:</span>
                        <span style={{ color: 'var(--color-text, #fff)' }}>{order.email}</span>
                    </div>
                </div>

                {/* Account Growth Hack Panel */}
                {!customer && (
                    <div style={{ alignSelf: 'start', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'var(--color-primary, #7c6dfa)', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />
                        
                        <h3 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '12px' }}>Track Your Order.</h3>
                        <p style={{ color: 'var(--color-text-secondary, #a0a0a0)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
                            Save your receipt and track shipping live by securing your guest purchase into a permanent account. 
                        </p>

                        <form onSubmit={handleGuestAccountUpcode}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary, #8b8ba0)', marginBottom: '8px' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    value={order.email} 
                                    disabled 
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'var(--color-text-secondary, #a0a0a0)', outline: 'none', cursor: 'not-allowed', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary, #8b8ba0)', marginBottom: '8px' }}>Your Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter your name"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'var(--color-text, #fff)', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary, #8b8ba0)', marginBottom: '8px' }}>Create Password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'var(--color-text, #fff)', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isRegistering}
                                style={{
                                    width: '100%', background: 'var(--color-primary, #fff)', color: 'var(--color-bg, #000)',
                                    border: 'none', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: 600,
                                    cursor: isRegistering ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s ease', opacity: isRegistering ? 0.7 : 1
                                }}
                            >
                                {isRegistering ? <Loader className="spin" size={18} /> : (
                                    <>
                                        Secure My Order <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
