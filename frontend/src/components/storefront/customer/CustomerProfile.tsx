import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { User, Package, MapPin, Heart, Shield, Settings, CheckCircle2, ChevronRight } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'security'>('orders');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchCustomerData();
    }, [user]);

    const fetchCustomerData = async () => {
        setLoading(true);
        // Fetch Orders
        const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });
        
        // Fetch Profile for Addresses
        const { data: customerData } = await supabase
            .from('customers')
            .select('addresses')
            .eq('id', user.id)
            .single();

        setOrders(orderData || []);
        setAddresses(customerData?.addresses || []);
        setLoading(false);
    };

    if (!user) return <div style={{ padding: 40, textAlign: 'center', color: '#71717a' }}>Please sign in to view your profile.</div>;

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', 
                background: activeTab === id ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                color: activeTab === id ? '#FF6B35' : '#71717a', 
                border: 'none', borderLeft: activeTab === id ? '2px solid #FF6B35' : '2px solid transparent',
                width: '100%', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: 14,
                transition: 'all 0.2s'
            }}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div style={{ maxWidth: 1200, margin: '60px auto', padding: '0 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40 }}>
                {/* Sidebar */}
                <aside>
                    <div style={{ padding: '0 0 32px 0', borderBottom: '1px solid #27272a', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>
                                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{user.user_metadata?.full_name || 'My Account'}</h1>
                                <p style={{ fontSize: 13, color: '#71717a' }}>{user.email}</p>
                            </div>
                        </div>
                    </div>
                    <nav style={{ background: '#131316', borderRadius: 12, overflow: 'hidden', border: '1px solid #27272a' }}>
                        <TabButton id="orders" label="Order History" icon={Package} />
                        <TabButton id="addresses" label="Saved Addresses" icon={MapPin} />
                        <TabButton id="security" label="Security" icon={Shield} />
                    </nav>
                </aside>

                {/* Main Content */}
                <main style={{ background: '#131316', borderRadius: 16, border: '1px solid #27272a', padding: 40, minHeight: 600 }}>
                    {activeTab === 'orders' && (
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Your Orders</h2>
                            {loading ? (
                                <p style={{ color: '#71717a' }}>Syncing with fulfillment engine...</p>
                            ) : orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <Package size={48} color="#27272a" style={{ marginBottom: 16 }} />
                                    <p style={{ color: '#71717a' }}>No orders found. Start shopping!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {orders.map(order => (
                                        <div key={order.id} style={{ padding: 20, background: '#09090b', border: '1px solid #27272a', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Order #{order.order_number}</div>
                                                <div style={{ fontSize: 12, color: '#71717a' }}>{new Date(order.created_at).toLocaleDateString()} • {order.line_items?.length} items</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FF6B35' }}>${(order.total_cents / 100).toFixed(2)}</div>
                                                    <div style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 800, textTransform: 'uppercase' }}>{order.status}</div>
                                                </div>
                                                <ChevronRight size={18} color="#27272a" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Saved Addresses</h2>
                                <button style={{ padding: '8px 16px', background: '#FF6B35', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>+ Add New</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {addresses.map((addr, idx) => (
                                    <div key={idx} style={{ padding: 20, border: '1px solid #27272a', borderRadius: 12, position: 'relative' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{addr.name} {addr.is_default && <span style={{ fontSize: 10, color: '#FF6B35', marginLeft: 8 }}>DEFAULT</span>}</div>
                                        <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>
                                            {addr.street}<br/>
                                            {addr.city}, {addr.zip}<br/>
                                            {addr.country}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
