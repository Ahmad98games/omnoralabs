import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { Package, Truck, CheckCircle, XCircle, Clock, RefreshCw, ShoppingBag, ArrowRight } from 'lucide-react';
import './AdminOrders.css';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    orderNumber?: string;
    user?: { name: string; email: string };
    guestCustomer?: { name: string; email: string };
    items: OrderItem[];
    totalAmount: number;
    status: 'INITIATED' | 'pending' | 'receipt_submitted' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; colorClass: string; icon: any }> = {
    INITIATED: { label: 'Initiated', colorClass: 'status-gray', icon: Clock },
    pending: { label: 'Pending Payment', colorClass: 'status-yellow', icon: Clock },
    receipt_submitted: { label: 'Receipt Review', colorClass: 'status-blue', icon: CheckCircle },
    approved: { label: 'Approved', colorClass: 'status-emerald', icon: CheckCircle },
    processing: { label: 'Processing', colorClass: 'status-indigo', icon: Package },
    shipped: { label: 'Shipped', colorClass: 'status-purple', icon: Truck },
    delivered: { label: 'Delivered', colorClass: 'status-green', icon: CheckCircle },
    cancelled: { label: 'Cancelled', colorClass: 'status-red', icon: XCircle },
};

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await client.get('/orders/admin/all');
            setOrders(data.orders || []);
        } catch (error) {
            showToast('Failed to fetch orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const updateStatus = async (orderId: string, newStatus: string) => {
        if (processingId) return; // Prevent double-tap
        setProcessingId(orderId);
        try {
            await client.put(`/orders/${orderId}/status`, { status: newStatus });
            showToast(`Order updated to ${newStatus}`, 'success');
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus as any } : o));
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Update failed', 'error');
            fetchOrders();
        } finally {
            setProcessingId(null);
        }
    };

    const renderActionButtons = (order: Order) => {
        const s = order.status;
        const isProcessing = processingId === order._id;

        if (['INITIATED', 'pending', 'receipt_submitted'].includes(s)) {
            return (
                <button
                    onClick={() => updateStatus(order._id, 'approved')}
                    className="btn-action btn-approve"
                    disabled={!!processingId}
                >
                    {isProcessing ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />}
                    {isProcessing ? 'Saving...' : 'Approve'}
                </button>
            );
        }
        if (s === 'approved') return (
            <button
                onClick={() => updateStatus(order._id, 'processing')}
                className="btn-action btn-process"
                disabled={!!processingId}
            >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <Package size={14} />}
                {isProcessing ? '...' : 'Process'}
            </button>
        );
        if (s === 'processing') return (
            <button
                onClick={() => updateStatus(order._id, 'shipped')}
                className="btn-action btn-ship"
                disabled={!!processingId}
            >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <Truck size={14} />}
                {isProcessing ? '...' : 'Ship'}
            </button>
        );
        if (s === 'shipped') return (
            <button
                onClick={() => updateStatus(order._id, 'delivered')}
                className="btn-action btn-deliver"
                disabled={!!processingId}
            >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />}
                {isProcessing ? '...' : 'Complete'}
            </button>
        );

        return null;
    };

    return (
        <div className="admin-orders-page animate-fade-in">
            <div className="page-header">
                <h2>
                    <ShoppingBag className="header-icon" />
                    Order Management
                </h2>
                <button className="refresh-btn" onClick={fetchOrders} title="Refresh Orders" disabled={loading}>
                    <RefreshCw size={18} className={loading ? "spin" : ""} />
                </button>
            </div>

            <div className="orders-table-wrapper">
                <table className="orders-list-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.INITIATED;
                            const StatusIcon = config.icon;

                            return (
                                <tr key={order._id}>
                                    <td className="font-mono text-accent">
                                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            <div className="customer-name">
                                                {order.user?.name || order.guestCustomer?.name || 'Guest'}
                                            </div>
                                            <div className="customer-email">
                                                {order.user?.email || order.guestCustomer?.email || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="items-cell">
                                            <span className="item-count">{(order.items || []).length} Items</span>
                                            <span className="item-detail">
                                                {order.items?.[0]?.name || 'Unknown Item'}
                                                {(order.items || []).length > 1 && ` +${order.items.length - 1} more`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="price-cell">
                                        PKR {order.totalAmount?.toLocaleString()}
                                    </td>
                                    <td>
                                        <div className={`status-badge ${config.colorClass}`}>
                                            <StatusIcon size={12} strokeWidth={3} />
                                            {config.label}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons-group">
                                            {renderActionButtons(order)}

                                            {!['delivered', 'cancelled', 'rejected'].includes(order.status) && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Cancel this order?')) updateStatus(order._id, 'cancelled');
                                                    }}
                                                    className="icon-btn-danger"
                                                    title="Cancel Order"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {orders.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="empty-state">No active orders found.</td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={6} className="empty-state">Syncing Data Stream...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}