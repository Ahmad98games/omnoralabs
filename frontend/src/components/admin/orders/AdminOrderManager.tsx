import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { ShoppingBag, Search, Filter, Truck, MoreVertical, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';

export const AdminOrderManager: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

    useEffect(() => {
        fetchOrders();
        
        // --- ⚡ Real-time Order Monitoring ---
        const channel = supabase
            .channel('orders_sync')
            .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        let query = supabase
            .from('orders')
            .select(`
                *,
                customers (full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error) setOrders(data || []);
        setLoading(false);
    };

    const StatusBadge = ({ status, type }: { status: string, type: 'status' | 'payment' }) => {
        const colors: any = {
            pending: { bg: '#27272a', text: '#a1a1aa' },
            paid: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
            shipped: { bg: 'rgba(56, 189, 248, 0.1)', text: '#38bdf8' },
            delivered: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
            cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
        };
        const config = colors[status.toLowerCase()] || colors.pending;
        return (
            <span style={{ 
                padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800,
                background: config.bg, color: config.text, textTransform: 'uppercase'
            }}>
                {status}
            </span>
        );
    };

    const generatePackingSlip = (order: any) => {
        const win = window.open('', '_blank');
        if (!win) return;
        
        const html = `
            <html>
                <head><title>Packing Slip - #${order.order_number}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; border-bottom: 1px solid #eee; padding: 10px 0; }
                    td { padding: 15px 0; border-bottom: 1px solid #f9f9f9; }
                </style>
                </head>
                <body>
                    <div class="header">
                        <h1>PACKING SLIP</h1>
                        <div>
                            <strong>Order #${order.order_number}</strong><br/>
                            Date: ${new Date(order.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="grid">
                        <div>
                            <strong>Ship To:</strong><br/>
                            ${order.shipping_address?.name}<br/>
                            ${order.shipping_address?.street}<br/>
                            ${order.shipping_address?.city}, ${order.shipping_address?.zip}
                        </div>
                    </div>
                    <table>
                        <thead><tr><th>Item</th><th>Qty</th></tr></thead>
                        <tbody>
                            ${order.line_items.map((item: any) => `
                                <tr><td>${item.title} ${item.variant_title ? `(${item.variant_title})` : ''}</td><td>${item.qty}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
        win.print();
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Orders</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Track and fulfill customer orders</p>
                </div>
                <button style={{ padding: '10px 20px', background: '#27272a', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* List */}
            <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#09090b', borderBottom: '1px solid #27272a' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>ORDER</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>DATE</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>CUSTOMER</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>PAYMENT</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>FULFILLMENT</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>TOTAL</th>
                            <th style={{ padding: '16px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Syncing orders...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>No orders found</td></tr>
                        ) : orders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #27272a', transition: 'background 0.2s', cursor: 'pointer' }}>
                                <td style={{ padding: '16px', fontWeight: 700, color: '#fff' }}>#{o.order_number}</td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#71717a' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{(o.customers as any)?.full_name || 'Guest'}</div>
                                    <div style={{ fontSize: 11, color: '#71717a' }}>{(o.customers as any)?.email}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <StatusBadge status={o.payment_status} type="payment" />
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <StatusBadge status={o.status || o.fulfilment_status} type="status" />
                                </td>
                                <td style={{ padding: '16px', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                                    ${(o.total_cents / 100).toFixed(2)}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button onClick={() => generatePackingSlip(o)} title="Packing Slip" style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><FileText size={18} /></button>
                                        <button style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
