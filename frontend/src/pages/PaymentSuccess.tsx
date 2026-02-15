import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingBag, Eye } from 'lucide-react';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const orderNumber = searchParams.get('order') || 'UNKNOWN';

    useEffect(() => {
        // Clear cart logic remains the same
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cart-updated'));
    }, []);

    return (
        <div className="payment-success-page">
            <div className="noise-layer" />

            <div className="success-container animate-scale-up">

                {/* Success Icon Animation */}
                <div className="success-icon-wrapper">
                    <div className="pulse-ring"></div>
                    <CheckCircle size={48} className="success-icon" strokeWidth={2.5} />
                </div>

                <h1 className="subtitle-serif">Order Confirmed</h1>
                <p className="success-message italic">
                    Your luxury pieces are being prepared. <br />
                    Thank you for choosing the GSG Atelier.
                </p>

                {/* Ticket / Order Info */}
                <div className="order-ticket-luxury">
                    <div className="ticket-row-lux">
                        <span className="ticket-label-lux">ORDER REFERENCE</span>
                        <span className="ticket-value-lux">#{orderNumber}</span>
                    </div>
                    <div className="ticket-divider-lux"></div>
                    <div className="ticket-row-lux">
                        <span className="ticket-label-lux">STATUS</span>
                        <span className="status-pill-success">AWAITING CRAFTSMANSHIP</span>
                    </div>
                </div>

                <p className="email-note">
                    A digital receipt has been transmitted to your inbox.
                </p>

                <div className="action-buttons-luxury">
                    <Link to={`/orders/${orderNumber}`} className="btn-luxury-action">
                        VIEW ORDER DETAILS
                    </Link>
                    <Link to="/collection" className="btn-luxury-outline">
                        CONTINUE SHOPPING
                    </Link>
                </div>
            </div>
        </div>
    );
}