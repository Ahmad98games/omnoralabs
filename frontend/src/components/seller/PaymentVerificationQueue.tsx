import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

interface PendingOrder {
    _id: string;
    orderNumber: string;
    customer: { name: string; phone: string; };
    totalAmount: number;
    paymentMethod: string;
    verificationStatus: string;
    paymentProof?: string;
    createdAt: string;
}

const METHOD_LABELS: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    easypaisa: 'Easypaisa',
    jazzcash: 'JazzCash',
};

const S = {
    wrap: { padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' } as React.CSSProperties,
    title: { fontSize: 20, fontWeight: 700, color: '#E8ECF1', marginBottom: 6 } as React.CSSProperties,
    sub: { fontSize: 13, color: '#6B7280', marginBottom: 24 } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, background: '#111318', borderRadius: 12, overflow: 'hidden' } as React.CSSProperties,
    th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: '#0d0f15', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    td: { padding: '14px 16px', fontSize: 13, color: '#D1D5DB', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' as const },
    badge: (v: string): React.CSSProperties => ({
        display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 800,
        background: v === 'receipt_uploaded' ? 'rgba(251,191,36,0.15)' : 'rgba(107,114,128,0.15)',
        color: v === 'receipt_uploaded' ? '#fbbf24' : '#6B7280',
    }),
    btn: (color: string): React.CSSProperties => ({
        padding: '6px 14px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 12,
        cursor: 'pointer', background: color === 'green' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
        color: color === 'green' ? '#4ade80' : '#f87171', marginLeft: 6,
    }),
    empty: { textAlign: 'center' as const, padding: 40, color: '#4B5563', fontSize: 14 },
};

const PaymentVerificationQueue: React.FC = () => {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/payment-methods/pending');
            setOrders(res.data.orders || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const verify = async (orderId: string, decision: 'approved' | 'rejected') => {
        setProcessing(orderId);
        try {
            await apiClient.post(`/payment-methods/verify/${orderId}`, { decision });
            setOrders(o => o.filter(x => x._id !== orderId));
        } catch (e) { console.error(e); }
        setProcessing(null);
    };

    return (
        <div style={S.wrap}>
            <h2 style={S.title}>Payment Verification</h2>
            <p style={S.sub}>Approve or reject manual payments (Bank Transfer, Easypaisa, JazzCash)</p>

            {loading ? (
                <div style={S.empty}>Loading…</div>
            ) : orders.length === 0 ? (
                <div style={{ ...S.empty, background: '#111318', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    ✅ No pending verifications
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {['Order #', 'Customer', 'Method', 'Amount', 'Status', 'Receipt', 'Action'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(ord => (
                                <tr key={ord._id} style={{ opacity: processing === ord._id ? 0.5 : 1 }}>
                                    <td style={S.td}><span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{ord.orderNumber}</span></td>
                                    <td style={S.td}>
                                        <div style={{ fontWeight: 600, color: '#E8ECF1' }}>{ord.customer.name}</div>
                                        <div style={{ fontSize: 11, color: '#6B7280' }}>{ord.customer.phone}</div>
                                    </td>
                                    <td style={S.td}>{METHOD_LABELS[ord.paymentMethod] || ord.paymentMethod}</td>
                                    <td style={S.td}><strong style={{ color: '#4ade80' }}>PKR {ord.totalAmount?.toLocaleString()}</strong></td>
                                    <td style={S.td}><span style={S.badge(ord.verificationStatus)}>{ord.verificationStatus.replace('_', ' ').toUpperCase()}</span></td>
                                    <td style={S.td}>
                                        {ord.paymentProof
                                            ? <a href={ord.paymentProof} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 12 }}>View Receipt ↗</a>
                                            : <span style={{ color: '#4B5563', fontSize: 12 }}>Not uploaded</span>
                                        }
                                    </td>
                                    <td style={S.td}>
                                        <button style={S.btn('green')} disabled={!!processing} onClick={() => verify(ord._id, 'approved')}>✓ Approve</button>
                                        <button style={S.btn('red')} disabled={!!processing} onClick={() => verify(ord._id, 'rejected')}>✗ Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentVerificationQueue;
