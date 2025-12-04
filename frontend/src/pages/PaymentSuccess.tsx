import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const orderNumber = searchParams.get('order') || 'N/A';

    useEffect(() => {
        // Clear cart after successful payment
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cart-updated'));
    }, []);

    return (
        <div className="payment-success-page">
            <div className="success-container animate-fade-in">
                <div className="success-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#00D924" strokeWidth="2" />
                        <path d="M8 12L11 15L16 9" stroke="#00D924" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                <h1>Payment Successful!</h1>
                <p className="success-message">
                    Your order has been placed successfully.
                </p>

                <div className="order-info">
                    <div className="info-row">
                        <span>Order Number:</span>
                        <strong>#{orderNumber}</strong>
                    </div>
                    <div className="info-row">
                        <span>Status:</span>
                        <strong className="status-badge">Processing</strong>
                    </div>
                </div>

                <p className="confirmation-text">
                    A confirmation email has been sent to your email address with order details.
                </p>

                <div className="action-buttons">
                    <Link to={`/orders/${orderNumber}`} className="luxury-button">
                        View Order Details
                    </Link>
                    <Link to="/collection" className="luxury-button-outline">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
