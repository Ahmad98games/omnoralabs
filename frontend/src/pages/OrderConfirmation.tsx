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
            <div className="confirmation-luxury">
                <div className="loading-luxury">
                    <Loader2 size={32} className="animate-spin text-gold" />
                    <p className="font-serif italic text-muted">Awaiting Order Confirmation...</p>
                </div>
            </div>
        );
    }

    const displayId = order?.orderNumber || id || 'UNKNOWN';
    const displayTotal = order?.totalAmount || order?.total || 0;

    return (
        <div className="confirmation-luxury reveal">
            <div className="confirmation-card-luxury animate-scale-up">

                {/* SUCCESS HEADER */}
                <div className="success-header-lux">
                    <div className="icon-pulse-wrapper">
                        <div className="icon-pulse-ring-gold"></div>
                        <div className="success-icon-gold">
                            <CheckCircle size={40} strokeWidth={1} />
                        </div>
                    </div>
                    <h1 className="subtitle-serif">Placed Under Craftsmanship</h1>
                    <p className="success-sub-lux italic">
                        Thank you for choosing GSG. <br />
                        Your boutique pieces are now being prepared.
                    </p>
                </div>

                {/* ORDER DETAILS GRID */}
                <div className="details-grid-luxury">
                    <div className="detail-row-lux">
                        <span className="detail-label-lux">ORDER REFERENCE</span>
                        <div className="detail-value-lux" onClick={copyOrderId}>
                            <span>#{displayId}</span>
                            <Copy size={12} className="copy-icon-lux" />
                        </div>
                    </div>
                    <div className="detail-row-lux">
                        <span className="detail-label-lux">TOTAL AMOUNT</span>
                        <span className="detail-value-lux text-gold">
                            PKR {displayTotal.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* WHATSAPP ACTION */}
                <div className="whatsapp-section-luxury">
                    <div className="wa-header-lux">
                        <h3 className="font-serif">Finalize Your Order</h3>
                        <span className="badge-luxury">RECOMMENDED</span>
                    </div>
                    <p className="wa-desc-lux">
                        To prioritize your order craftsmanship and receive instant updates, connect with our concierge on WhatsApp.
                    </p>

                    <button onClick={handleWhatsAppClick} className="btn-luxury-wa">
                        <MessageCircle size={18} />
                        <span>CONFIRM ON WHATSAPP</span>
                    </button>
                </div>

                {/* SECURITY BADGE */}
                <div className="security-notice">
                    <ShieldCheck size={16} />
                    <span>Secure Encrypted Transaction</span>
                </div>

                {/* HOME LINK */}
                <Link to="/" className="back-link-luxury">
                    <ArrowLeft size={16} /> RETURN TO COLLECTION
                </Link>

            </div>
        </div>
    );
}