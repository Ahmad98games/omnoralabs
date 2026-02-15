import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import {
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    MapPin,
    CreditCard,
    Copy,
    Loader2
} from 'lucide-react';
import './OrderDetail.css';

type OrderItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
};

type Order = {
    _id: string;
    orderNumber: string;
    items: OrderItem[];
    shippingAddress: {
        name: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        phone: string;
    };
    paymentMethod: string;
    total: number;
    subtotal: number;
    shippingCost: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
            // Quiet fail for guest users or network issues
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('WARNING: Confirm order cancellation?')) return;

        try {
            await client.put(`/orders/${id}/cancel`);
            showToast('Order terminated successfully', 'success');
            fetchOrder(); // Refresh data
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Cancellation failed', 'error');
        }
    };

    const copyOrderId = () => {
        if (order?.orderNumber) {
            navigator.clipboard.writeText(order.orderNumber);
            showToast('Order ID copied to clipboard', 'info');
        }
    };

    if (loading) return (
        <div className="loading-luxury">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="font-serif italic text-muted">Retrieving Order Details...</p>
        </div>
    );

    if (!order) {
        return (
            <div className="order-not-found-luxury">
                <h2 className="subtitle-serif">Order Not Found</h2>
                <p>The requested boutique record does not exist in our archives.</p>
                <Link to="/profile" className="btn-luxury-outline">Return to Profile</Link>
            </div>
        );
    }

    // Helper to determine active step for timeline
    const getStepStatus = (step: string) => {
        const statusMap = { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 };
        const current = statusMap[order.status];
        const target = statusMap[step as keyof typeof statusMap];

        if (order.status === 'cancelled') return 'cancelled';
        if (current >= target) return 'completed';
        return 'pending';
    };

    return (
        <div className="order-detail-luxury reveal">
            <div className="container">
                {/* Header */}
                <div className="order-header-luxury">
                    <div className="header-left">
                        <Link to="/profile" className="back-link-lux">
                            <ArrowLeft size={14} /> BACK TO PROFILE
                        </Link>
                        <div className="order-title-group" onClick={copyOrderId} title="Click to Copy">
                            <h1 className="subtitle-serif">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</h1>
                            <Copy size={14} className="copy-icon-lux" />
                        </div>
                        <span className="order-date-lux">
                            ORDERED BY THE CLIENT ON {new Date(order.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            }).toUpperCase()}
                        </span>
                    </div>
                    <div className={`status-pill-lg ${order.status}`}>
                        {order.status}
                    </div>
                </div>

                <div className="order-grid">
                    {/* LEFT COLUMN */}
                    <div className="order-main-content">

                        {/* Timeline */}
                        <div className="panel-luxury timeline-lux">
                            <h3 className="panel-title-lux">DELIVERY STATUS</h3>
                            <div className="timeline-track">
                                <div className={`track-step ${getStepStatus('pending')}`}>
                                    <div className="step-icon"><Clock size={18} /></div>
                                    <div className="step-info">
                                        <span className="step-label">Order Placed</span>
                                        <span className="step-time">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <div className={`track-step ${getStepStatus('processing')}`}>
                                    <div className="step-icon"><Package size={18} /></div>
                                    <div className="step-info">
                                        <span className="step-label">Processing</span>
                                        <span className="step-desc">Preparing items</span>
                                    </div>
                                </div>
                                <div className={`track-step ${getStepStatus('shipped')}`}>
                                    <div className="step-icon"><Truck size={18} /></div>
                                    <div className="step-info">
                                        <span className="step-label">Shipped</span>
                                        {order.trackingNumber && <span className="step-desc">#{order.trackingNumber}</span>}
                                    </div>
                                </div>
                                <div className={`track-step ${getStepStatus('delivered')}`}>
                                    <div className="step-icon"><CheckCircle size={18} /></div>
                                    <div className="step-info">
                                        <span className="step-label">Delivered</span>
                                        {order.deliveredAt && <span className="step-time">{new Date(order.deliveredAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="panel-luxury items-lux">
                            <h3 className="panel-title-lux">ORDER MANIFEST</h3>
                            <div className="items-list">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="manifest-item-lux">
                                        <div className="item-thumb-lux">
                                            <img src={item.image || '/placeholder.png'} alt={item.name} />
                                        </div>
                                        <div className="item-meta-lux">
                                            <h4 className="font-serif">{item.name}</h4>
                                            <span className="item-qty-lux">QUANTITY: {item.quantity}</span>
                                        </div>
                                        <div className="item-cost-lux">
                                            PKR {(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="order-sidebar">

                        {/* Summary */}
                        <div className="panel-luxury summary-lux">
                            <h3 className="panel-title-lux">FINANCIAL SUMMARY</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>PKR {order.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>PKR {order.shippingCost.toLocaleString()}</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span className="total-value">PKR {order.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="panel-luxury details-lux">
                            <div className="detail-group-lux">
                                <h4 className="detail-header-lux">SHIPPING TO</h4>
                                <p>{order.shippingAddress.name}</p>
                                <p className="text-muted">{order.shippingAddress.address}</p>
                                <p className="text-muted">
                                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                                </p>
                                <p className="text-muted">{order.shippingAddress.phone}</p>
                            </div>

                            <div className="detail-divider"></div>

                            <div className="detail-group-lux mt-4">
                                <h4 className="detail-header-lux">PAYMENT METHOD</h4>
                                <p className="payment-badge-lux">{order.paymentMethod.replace(/_/g, ' ')}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        {['pending', 'processing'].includes(order.status) && (
                            <button onClick={handleCancelOrder} className="btn-luxury-outline w-100">
                                CANCEL ORDER
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}