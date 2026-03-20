import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface Order {
    id: string;
    customer_name: string;
    total_amount: number;
    currency: string;
    status: 'Pending_Payment' | 'Payment_Under_Review' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    created_at: string;
    items: any[];
    screenshot_url?: string;
}

interface OrderListTableProps {
    merchantId: string;
}

/**
 * OrderListTable: Order Lifecycle Management Tracker
 * 
 * Lists orders with status enum dropdown triggers, filtering, and proof upload dialogs.
 */
export const OrderListTable: React.FC<OrderListTableProps> = ({ merchantId }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const statuses = [
        'Pending_Payment',
        'Payment_Under_Review',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled'
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            let query = supabase
                .from('orders')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;
            if (!error && data) setOrders(data as Order[]);
            setLoading(false);
        };

        if (merchantId) fetchOrders();
    }, [merchantId, filterStatus]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (!error) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
        } else {
            alert('Failed to update status.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending_Payment': return '#f59e0b';
            case 'Payment_Under_Review': return '#3b82f6';
            case 'Processing': return '#6366f1';
            case 'Shipped': return '#10b981';
            case 'Delivered': return '#059669';
            case 'Cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    if (loading) return <div style={{ color: '#fff' }}>Loading orders...</div>;

    return (
        <div style={{ background: '#13131a', padding: 20, borderRadius: 8, border: '1px solid #2a2a3a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>Manage Orders</h2>
                
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ background: '#1a1a24', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                >
                    <option value="all">All Statuses</option>
                    {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#e4e4e7' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                            <th style={{ padding: '12px 8px', fontSize: '13px', color: '#888' }}>Order ID</th>
                            <th style={{ padding: '12px 8px', fontSize: '13px', color: '#888' }}>Customer</th>
                            <th style={{ padding: '12px 8px', fontSize: '13px', color: '#888' }}>Amount</th>
                            <th style={{ padding: '12px 8px', fontSize: '13px', color: '#888' }}>Status</th>
                            <th style={{ padding: '12px 8px', fontSize: '13px', color: '#888' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #1a1a24' }}>
                                <td style={{ padding: '12px 8px', fontSize: '13px' }}>#{order.id.slice(0,8)}</td>
                                <td style={{ padding: '12px 8px', fontSize: '13px' }}>{order.customer_name}</td>
                                <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 600 }}>{order.currency} {order.total_amount}</td>
                                <td style={{ padding: '12px 8px' }}>
                                    <span style={{ 
                                        background: `${getStatusColor(order.status)}20`, 
                                        color: getStatusColor(order.status),
                                        padding: '3px 8px', 
                                        borderRadius: 4, 
                                        fontSize: '11px',
                                        fontWeight: 500
                                    }}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 8px' }}>
                                    <select 
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '12px', cursor: 'pointer' }}
                                    >
                                        {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                    </select>
                                    
                                    {order.screenshot_url && (
                                        <button 
                                            onClick={() => window.open(order.screenshot_url, '_blank')}
                                            style={{ marginLeft: 8, background: '#3b82f6', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: 4, fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            View Proof
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
