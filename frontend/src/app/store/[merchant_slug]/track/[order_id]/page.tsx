import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0; // Disable static cache for real-time tracking

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_fSTvAeJdvOl4WkUIPVz65Q_xTTScsF-';

const supabase = createClient(supabaseUrl, supabaseKey);

interface TrackingPageProps {
    params: { merchant_slug: string; order_id: string };
}

const steps = [
    { key: 'Pending_Payment', label: 'Order Placed' },
    { key: 'Payment_Under_Review', label: 'Payment Review' },
    { key: 'Processing', label: 'Processing' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Delivered', label: 'Delivered' }
];

export default async function TrackingPage({ params }: TrackingPageProps) {
    const { merchant_slug, order_id } = params;

    // 1. Fetch Order details along with Merchant Methods
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            id, 
            status, 
            total_amount, 
            currency,
            customer_name,
            merchant_id,
            merchants!inner(id, slug, payment_methods)
        `)
        .eq('id', order_id)
        .single();

    if (orderError || !order) {
        return <div style={{ color: '#fff', textAlign: 'center', padding: 50 }}>404 | Order Not Found</div>;
    }

    const currentStatus = order.status;
    const currentStepIndex = steps.findIndex(s => s.key === currentStatus);
    
    // Fallback if status doesn't match step (e.g., Cancelled)
    if (currentStatus === 'Cancelled') {
         return <div style={{ color: '#ef4444', textAlign: 'center', padding: 50 }}>🔴 This Order has been Cancelled.</div>;
    }

    const isActive = (index: number) => index <= currentStepIndex;

    const paymentMethods: any[] = order.merchants.payment_methods || [];

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px 20px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 600, margin: '0 auto', background: '#13131a', padding: 24, borderRadius: 12, border: '1px solid #2a2a3a' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 8 }}>Track Your Order</h1>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: 30 }}>Order ID: #{order_id.slice(0,12)}...</p>

                {/* Timeline Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 40 }}>
                    {/* Line Background */}
                    <div style={{ position: 'absolute', top: 12, left: '5%', right: '5%', height: 2, background: '#2a2a3a', zIndex: 0 }} />
                    {/* Active Line Fill */}
                    <div style={{ 
                        position: 'absolute', 
                        top: 12, 
                        left: '5%', 
                        width: `${(currentStepIndex / (steps.length - 1)) * 90}%`, 
                        height: 2, 
                        background: '#6366f1', 
                        zIndex: 1,
                        transition: 'width 0.4s ease'
                    }} />

                    {steps.map((step, index) => (
                        <div key={step.key} style={{ textAlign: 'center', zIndex: 2, width: '20%' }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: isActive(index) ? '#6366f1' : '#1a1a24',
                                border: isActive(index) ? 'none' : '2px solid #2a2a3a',
                                margin: '0 auto',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', color: '#fff', fontWeight: 600
                            }}>
                                {isActive(index) ? '✓' : index + 1}
                            </div>
                            <p style={{ marginTop: 8, fontSize: '11px', color: isActive(index) ? '#fff' : '#888' }}>
                                {step.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Status Specific Insights */}
                {currentStatus === 'Pending_Payment' && (
                    <div style={{ background: '#1a1a24', padding: 16, borderRadius: 8, border: '1px solid #2a2a3a', marginTop: 20 }}>
                        <h3 style={{ fontSize: '14px', color: '#f59e0b', marginBottom: 12 }}>⚠️ Payment is Pending</h3>
                        <p style={{ fontSize: '13px', color: '#ccc', marginBottom: 16 }}>Please send exactly *{order.currency} {order.total_amount}* to one of the following methods:</p>
                        
                        {paymentMethods.map((m, idx) => (
                            <div key={m.id || idx} style={{ borderBottom: '1px solid #2a2a3a', paddingBottom: 12, marginBottom: 12 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#6366f1' }}>{m.name}</p>
                                <p style={{ fontSize: '12px', color: '#888' }}>Title: {m.accountTitle}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <p style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace' }}>{m.accountNumber}</p>
                                    <button 
                                        style={{ background: '#2a2a3a', color: '#ccc', border: 'none', padding: '3px 8px', borderRadius: 4, fontSize: '11px', cursor: 'pointer' }}
                                        onClick={() => {
                                            // Next.js Server Components don't support onClick easily in plain tree without hydrations
                                            // This is mostly server rendered output, absolute safely
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p style={{ fontSize: '11px', color: '#a1a1aa', marginTop: 4, fontStyle: 'italic' }}>{m.instruction}</p>
                            </div>
                        ))}
                    </div>
                )}

                {currentStatus === 'Shipped' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: 20 }}>
                        <p style={{ fontSize: '13px', color: '#10b981' }}>🎉 Order has been Shipped! It will reach you soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
