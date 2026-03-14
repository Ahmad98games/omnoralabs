import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Package, User, LogOut, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';
import { useToast } from '../../context/ToastContext';

interface OrderHistoryItem {
    id: string;
    orderNumber: string;
    totalAmount: number;
    financialStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
}

export const CustomerDashboard: React.FC = () => {
    const { customer, login, register, logout, isAuthenticated } = useCustomerAuth();
    const { activeMerchantId } = useBuilder(); // Needed for registration on the storefront
    const { showToast } = useToast();

    // Auth Form State
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    // Dashboard State
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && customer) {
            fetchOrders(customer.id);
        }
    }, [isAuthenticated, customer]);

    const fetchOrders = async (customerId: string) => {
        setOrdersLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedOrders = data?.map(o => ({
                id: o.id,
                orderNumber: o.id.slice(0, 8).toUpperCase(),
                totalAmount: o.grand_total,
                financialStatus: o.financial_status || 'pending',
                fulfillmentStatus: o.fulfillment_status || 'unfulfilled',
                createdAt: new Date(o.created_at).toLocaleDateString()
            })) || [];

            setOrders(formattedOrders);
        } catch (err: any) {
            console.error("Failed to load orders:", err);
            showToast("Failed to load order history.", "error");
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            if (isLoginView) {
                await login(email, password);
                showToast("Welcome back!", "success");
            } else {
                if (!activeMerchantId) throw new Error("Store reference missing. Cannot register.");
                await register(name, email, password, activeMerchantId);
                showToast("Account created successfully.", "success");
            }
        } catch (err: any) {
            showToast(err.message || "Authentication failed.", "error");
        } finally {
            setAuthLoading(false);
        }
    };

    // ─── AUTHENTICATION VIEW ──────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg, #000)', fontFamily: 'var(--font-sans)', padding: '40px 20px' }}>
                <div style={{ maxWidth: '440px', width: '100%', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '40px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <User size={32} color="var(--color-primary, #7c6dfa)" />
                        </div>
                        <h1 style={{ fontSize: '28px', color: 'var(--color-text, #fff)', fontWeight: 600, letterSpacing: '-0.5px' }}>
                            {isLoginView ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary, #a0a0a0)', marginTop: '8px', fontSize: '14px' }}>
                            {isLoginView ? 'Sign in to access your order history.' : 'Secure your past guest orders automatically.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {!isLoginView && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary, #8b8ba0)', marginBottom: '8px' }}>Full Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe"
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'var(--color-text, #fff)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary, #8b8ba0)', marginBottom: '8px' }}>Email Address</label>
                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@domain.com"
                                style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'var(--color-text, #fff)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary, #8b8ba0)', marginBottom: '8px' }}>Password</label>
                            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'var(--color-text, #fff)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        <button disabled={authLoading} type="submit" style={{
                            width: '100%', background: 'var(--color-primary, #7c6dfa)', color: '#000',
                            border: 'none', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: 600,
                            cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            marginTop: '8px', opacity: authLoading ? 0.7 : 1, transition: 'all 0.2s ease'
                        }}>
                            {authLoading ? <Loader2 className="spin" size={20} /> : (isLoginView ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <button onClick={() => setIsLoginView(!isLoginView)} style={{
                        background: 'transparent', border: 'none', color: 'var(--color-text-secondary, #a0a0a0)', width: '100%',
                        textAlign: 'center', marginTop: '24px', cursor: 'pointer', fontSize: '14px'
                    }}>
                        {isLoginView ? "Don't have an account? " : "Already have an account? "}
                        <span style={{ color: 'var(--color-primary, #7c6dfa)' }}>{isLoginView ? 'Sign Up' : 'Log In'}</span>
                    </button>
                </div>
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg, #000)', color: 'var(--color-text, #fff)', fontFamily: 'var(--font-sans)', padding: '60px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* Header Profile Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
                            Welcome, {customer?.name}!
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary, #a0a0a0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} color="var(--color-primary, #7c6dfa)" /> Your personal client portal
                        </p>
                    </div>
                    <button onClick={logout} style={{
                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text, #fff)', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
                    }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                {/* Main Content Area */}
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Package size={20} color="var(--color-primary, #7c6dfa)" /> Order History
                    </h2>

                    {ordersLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <Loader2 className="spin" size={32} color="var(--color-primary, #7c6dfa)" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
                            <AlertCircle size={32} color="var(--color-text-secondary, #666)" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Orders Found</h3>
                            <p style={{ color: 'var(--color-text-secondary, #a0a0a0)' }}>You haven't placed any orders with this store yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {orders.map(order => (
                                <div key={order.id} style={{ 
                                    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', 
                                    borderRadius: '12px', padding: '24px', display: 'flex', flexWrap: 'wrap', 
                                    justifyContent: 'space-between', alignItems: 'center', gap: '20px', transition: 'all 0.2s ease'
                                }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                                    
                                    <div>
                                        <div style={{ color: 'var(--color-text-secondary, #888)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Order Number</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600 }}>#{order.orderNumber}</div>
                                    </div>

                                    <div>
                                        <div style={{ color: 'var(--color-text-secondary, #888)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Date Placed</div>
                                        <div style={{ fontSize: '16px' }}>{order.createdAt}</div>
                                    </div>

                                    <div>
                                        <div style={{ color: 'var(--color-text-secondary, #888)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Status</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ 
                                                background: order.financialStatus === 'paid' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                color: order.financialStatus === 'paid' ? '#34d399' : '#fbbf24',
                                                padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'
                                            }}>{order.financialStatus}</span>
                                            <span style={{ 
                                                background: order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'fulfilled' ? 'rgba(124, 109, 250, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'fulfilled' ? '#7c6dfa' : '#a0a0a0',
                                                padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'
                                            }}>{order.fulfillmentStatus}</span>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--color-text-secondary, #888)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Amount</div>
                                        <div style={{ fontSize: '20px', fontWeight: 600 }}>${order.totalAmount.toFixed(2)}</div>
                                    </div>
                                    
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
