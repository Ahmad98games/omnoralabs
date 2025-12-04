import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import './OrderDetail.css';

type Order = {
    _id: string;
    orderNumber: string;
    items: any[];
    shippingAddress: any;
    paymentMethod: string;
    total: number;
    subtotal: number;
    shippingCost: number;
    status: string;
    createdAt: string;
    trackingNumber?: string;
    deliveredAt?: string;
};

export default function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await client.get(`/orders/${id}`);
            setOrder(res.data.order);
        } catch (error) {
            showToast('Failed to load order', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            await client.put(`/orders/${id}/cancel`);
            showToast('Order cancelled successfully', 'success');
            fetchOrder();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to cancel order', 'error');
        }
    };

    if (loading) {
        return <div className="loading">Loading order...</div>;
    }

    if (!order) {
        return (
            <div className="order-not-found">
                <h2>Order Not Found</h2>
                <Link to="/profile">Back to Profile</Link>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return '#28a745';
            case 'shipped': return '#17a2b8';
            case 'processing': return '#ffc107';
            case 'cancelled': return '#dc3545';
            default: return '#6c757d';
        }
    };

    return (
        <div className="order-detail-page">
            <div className="order-detail-container">
                <div className="order-header">
                    <div>
                        <h1>Order #{order.orderNumber}</h1>
                        <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {order.status.toUpperCase()}
                    </div>
                </div>

                <div className="order-content-grid">
                    <div className="order-main">
                        {/* Status Timeline */}
                        <div className="status-timeline">
                            <h3>Order Status</h3>
                            <div className="timeline">
                                <div className={`timeline-item ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <strong>Order Placed</strong>
                                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className={`timeline-item ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <strong>Processing</strong>
                                        <p>Your order is being prepared</p>
                                    </div>
                                </div>
                                <div className={`timeline-item ${['shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <strong>Shipped</strong>
                                        {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
                                    </div>
                                </div>
                                <div className={`timeline-item ${order.status === 'delivered' ? 'completed' : ''}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <strong>Delivered</strong>
                                        {order.deliveredAt && <p>{new Date(order.deliveredAt).toLocaleString()}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="order-items-section">
                            <h3>Order Items</h3>
                            <div className="order-items-list">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="order-item">
                                        <img src={item.image || '/images/bath bomb.png'} alt={item.name} />
                                        <div className="item-details">
                                            <h4>{item.name}</h4>
                                            <p>Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="item-price">
                                            PKR {(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="order-sidebar">
                        {/* Order Summary */}
                        <div className="summary-card">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>PKR {order.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>PKR {order.shippingCost.toLocaleString()}</span>
                            </div>
                            <div className="summary-row total">
                                <strong>Total</strong>
                                <strong>PKR {order.total.toLocaleString()}</strong>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="address-card">
                            <h3>Shipping Address</h3>
                            <p><strong>{order.shippingAddress.name}</strong></p>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.phone}</p>
                        </div>

                        {/* Payment Method */}
                        <div className="payment-card">
                            <h3>Payment Method</h3>
                            <p className="payment-method">{order.paymentMethod.toUpperCase()}</p>
                        </div>

                        {/* Actions */}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button onClick={handleCancelOrder} className="cancel-order-btn">
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
