import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import client from '../api/client';
import { openWhatsApp } from '../utils/whatsappOrderService';
import { 
    CheckCircle, 
    MessageCircle, 
    Copy, 
    ArrowLeft, 
    Loader2, 
    ShieldCheck, 
    Smartphone 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './OrderConfirmation.css';

// 1. Defined Interface
interface OrderData {
    _id: string;
    orderNumber?: string;
    totalAmount?: number;
    total?: number;
    paymentMethod: string;
    items?: any[];
}

export default function OrderConfirmation() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { showToast } = useToast();

    const [order, setOrder] = useState<OrderData | null>(location.state?.order || null);
    const [loading, setLoading] = useState(!location.state?.order);

    useEffect(() => {
        if (order) return;

        const fetchOrder = async () => {
            try {
                if (!id) return;
                const res = await client.get(`/orders/${id}`);
                if (res.data.success) {
                    setOrder(res.data.order);
                }
            } catch (error: any) {
                console.warn('Order fetch issue (Guest/Network):', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, order]);

    const handleWhatsAppClick = () => {
        if (order) {
            // --- FIX: Create a Safe Payload for TypeScript ---
            // The utility expects 'orderNumber' to be a string, but our interface says it's optional.
            // We force it to exist by falling back to '_id' if 'orderNumber' is missing.
            const safePayload = {
                ...order,
                orderNumber: order.orderNumber || order._id,
                total: order.totalAmount || order.total || 0
            };

            // Cast to 'any' to bypass strict interface mismatch in the utility, 
            // since we manually ensured the data is correct above.
            openWhatsApp(safePayload as any, 'automation');
        } else if (id) {
            // Fallback if we only have ID
            const fallbackUrl = `https://wa.me/923097613611?text=${encodeURIComponent(`Hello, I placed order #${id}. Please confirm details.`)}`;
            window.open(fallbackUrl, '_blank');
        }
    };

    const copyOrderId = () => {
        const targetId = order?.orderNumber || id || '';
        navigator.clipboard.writeText(targetId);
        showToast('Order ID copied to clipboard', 'success');
    };

    if (loading) {
        return (
            <div className="confirmation-page">
                <div className="loading-state">
                    <Loader2 size={48} className="animate-spin text-cyan" />
                    <p>Securing Transaction Data...</p>
                </div>
            </div>
        );
    }

    const displayId = order?.orderNumber || id || 'UNKNOWN';
    const displayTotal = order?.totalAmount || order?.total || 0;

    return (
        <div className="confirmation-page">
            <div className="noise-layer" />
            
            <div className="confirmation-card animate-scale-up">
                
                {/* SUCCESS HEADER */}
                <div className="success-header">
                    <div className="icon-pulse-wrapper">
                        <div className="icon-pulse-ring"></div>
                        <div className="success-icon">
                            <CheckCircle size={40} strokeWidth={3} />
                        </div>
                    </div>
                    <h1 className="success-title">Order Confirmed!</h1>
                    <p className="success-sub">
                        Thank you for choosing Omnora. <br />
                        Your sanctuary awaits.
                    </p>
                </div>

                {/* ORDER DETAILS GRID */}
                <div className="order-details-grid">
                    <div className="detail-item">
                        <span className="detail-label">Order Reference</span>
                        <div className="detail-value-row" onClick={copyOrderId}>
                            <span className="mono-text">{displayId}</span>
                            <Copy size={14} className="copy-icon" />
                        </div>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value text-green">
                            PKR {displayTotal.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* WHATSAPP ACTION */}
                <div className="whatsapp-section">
                    <div className="wa-header">
                        <h3>Finalize Your Order</h3>
                        <span className="badge-recommended">RECOMMENDED</span>
                    </div>
                    <p className="wa-desc">
                        To speed up processing and receive your payment receipt instantly, connect with us on WhatsApp.
                    </p>
                    
                    <button onClick={handleWhatsAppClick} className="btn-whatsapp">
                        <MessageCircle size={20} />
                        <span>Confirm on WhatsApp</span>
                    </button>

                    <div className="wa-footer">
                        <Smartphone size={14} />
                        <span>Direct line to our support team</span>
                    </div>
                </div>

                {/* SECURITY BADGE */}
                <div className="security-notice">
                    <ShieldCheck size={16} />
                    <span>Secure Encrypted Transaction</span>
                </div>

                {/* HOME LINK */}
                <Link to="/" className="back-home-link">
                    <ArrowLeft size={16} /> Return to Collection
                </Link>

            </div>
        </div>
    );
}