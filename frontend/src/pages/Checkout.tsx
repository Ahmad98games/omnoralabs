import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { 
    ShieldCheck, 
    Globe, 
    CreditCard, 
    Truck, 
    Loader2, 
    ArrowRight, 
    ArrowLeft,
    MapPin,
    User,
    Phone,
    Mail
} from 'lucide-react';
import './Checkout.css';

type CartItem = { id: string; name: string; price: number; image?: string; quantity: number };

export default function Checkout() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentTab, setPaymentTab] = useState<'local' | 'international'>('local');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    // Animation Refs
    const customerRef = useScrollReveal();
    const shippingRef = useScrollReveal();
    const paymentRef = useScrollReveal();
    const summaryRef = useScrollReveal();

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        address: '', city: '', state: '', postalCode: '',
        country: 'Pakistan', notes: ''
    });

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
        setItems(data);
        if (data.length === 0) navigate('/cart');
    }, [navigate]);

    const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
    const shipping = useMemo(() => form.country === 'Pakistan' ? 250 : 5000, [form.country]);
    const total = subtotal + shipping; // Tax removed for simplicity or add back if needed

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        if (!form.firstName.trim() || !form.lastName.trim()) return 'Full Name is required.';
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Valid Email is required.';
        if (!form.phone.trim()) return 'Phone Number is required.';
        if (!form.address.trim()) return 'Shipping Address is required.';
        if (!form.city.trim()) return 'City is required.';
        return null;
    };

    const placeOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            showToast(validationError, 'error');
            // Scroll to top to see error
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                customerInfo: {
                    name: `${form.firstName} ${form.lastName}`,
                    email: form.email,
                    phone: form.phone
                },
                shippingAddress: {
                    address: form.address,
                    city: form.city,
                    state: form.state,
                    postalCode: form.postalCode,
                    country: form.country
                },
                paymentMethod: paymentMethod,
                items: items.map(i => ({
                    productId: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                })),
                totalAmount: total,
                notes: form.notes
            };

            const res = await client.post('/orders', payload);

            if (res.data?.success && res.data?.order) {
                // Clear Cart
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cart-updated'));

                // Navigate to Success/Confirmation Page
                // We pass the order object state so the next page doesn't need to refetch immediately
                navigate(`/order-confirmation/${res.data.order._id}`, {
                    state: { order: res.data.order }
                });
            } else {
                throw new Error(res.data?.error || 'Order creation failed');
            }
        } catch (e: any) {
            console.error(e);
            const msg = e?.response?.data?.error || 'Connection interrupted. Please try again.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getPaymentMethodName = () => {
        const methods: Record<string, string> = {
            cod: 'Cash on Delivery',
            meezan: 'Meezan Bank Transfer',
            jazzcash: 'JazzCash Mobile',
            easypaisa: 'EasyPaisa Mobile',
            payoneer: 'Payoneer (Intl)'
        };
        return methods[paymentMethod] || paymentMethod;
    };

    return (
        <div className="checkout-page">
            <header className="page-header">
                <h1 className="page-title">SECURE CHECKOUT</h1>
                <p className="page-subtitle">ENCRYPTED TRANSACTION CHANNEL</p>
            </header>

            <div className="checkout-container">
                <div className="breadcrumbs">
                    <ul className="breadcrumbs-list">
                        <li className="breadcrumbs-item"><Link to="/" className="breadcrumbs-link">HOME</Link></li>
                        <li className="breadcrumbs-item"><Link to="/cart" className="breadcrumbs-link">BAG</Link></li>
                        <li className="breadcrumbs-item">CHECKOUT</li>
                    </ul>
                </div>

                <div className="checkout-content">
                    {/* LEFT COLUMN: FORM */}
                    <div className="checkout-form-container">
                        <form onSubmit={placeOrder} noValidate>
                            
                            {/* Error Banner */}
                            {error && (
                                <div className="alert-box error" role="alert">
                                    <ShieldCheck size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Section 1: Customer */}
                            <div className="form-section" ref={customerRef}>
                                <h2 className="form-section-title"><User size={20} /> Identity Protocol</h2>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName">First Name</label>
                                        <input id="firstName" name="firstName" value={form.firstName} onChange={handleInputChange} className="form-input" placeholder="AHMAD" required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastName">Last Name</label>
                                        <input id="lastName" name="lastName" value={form.lastName} onChange={handleInputChange} className="form-input" placeholder="MAHBOOB" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Digital Contact (Email)</label>
                                    <div className="input-icon-wrapper">
                                        <Mail size={16} className="input-icon" />
                                        <input id="email" type="email" name="email" value={form.email} onChange={handleInputChange} className="form-input indent" placeholder="name@domain.com" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Comm Link (Phone)</label>
                                    <div className="input-icon-wrapper">
                                        <Phone size={16} className="input-icon" />
                                        <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleInputChange} className="form-input indent" placeholder="+92 300 0000000" required />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Shipping */}
                            <div className="form-section" ref={shippingRef}>
                                <h2 className="form-section-title"><MapPin size={20} /> Drop Coordinates</h2>
                                <div className="form-group">
                                    <label htmlFor="address">Street Address</label>
                                    <input id="address" name="address" value={form.address} onChange={handleInputChange} className="form-input" placeholder="House #, Street #, Sector" required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="city">City</label>
                                        <input id="city" name="city" value={form.city} onChange={handleInputChange} className="form-input" placeholder="LAHORE" required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="postalCode">Postal Code</label>
                                        <input id="postalCode" name="postalCode" value={form.postalCode} onChange={handleInputChange} className="form-input" placeholder="54000" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="country">Region / Country</label>
                                    <select id="country" name="country" value={form.country} onChange={handleInputChange} className="form-input">
                                        <option value="Pakistan">PAKISTAN</option>
                                        <option value="International">INTERNATIONAL (Zone 1)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="notes">Tactical Notes (Optional)</label>
                                    <textarea id="notes" name="notes" value={form.notes} onChange={handleInputChange} className="form-input" rows={2} placeholder="Gate codes, landmarks, or special handling..." />
                                </div>
                            </div>

                            {/* Section 3: Payment */}
                            <div className="form-section" ref={paymentRef}>
                                <h2 className="form-section-title"><CreditCard size={20} /> Transaction Method</h2>

                                <div className="payment-tabs">
                                    <button type="button" className={`payment-tab ${paymentTab === 'local' ? 'active' : ''}`} onClick={() => setPaymentTab('local')}>
                                        <Truck size={16} /> DOMESTIC (PK)
                                    </button>
                                    <button type="button" className={`payment-tab ${paymentTab === 'international' ? 'active' : ''}`} onClick={() => setPaymentTab('international')}>
                                        <Globe size={16} /> GLOBAL
                                    </button>
                                </div>

                                <div className="payment-options">
                                    {paymentTab === 'local' ? (
                                        <>
                                            {[
                                                { id: 'cod', name: 'Cash on Delivery', desc: 'Pay upon successful delivery.' },
                                                { id: 'meezan', name: 'Meezan Bank', desc: 'Direct secure bank transfer.' },
                                                { id: 'jazzcash', name: 'JazzCash', desc: 'Mobile wallet transfer.' },
                                                { id: 'easypaisa', name: 'EasyPaisa', desc: 'Mobile wallet transfer.' }
                                            ].map((m) => (
                                                <label key={m.id} className={`payment-option ${paymentMethod === m.id ? 'selected' : ''}`}>
                                                    <input type="radio" name="paymentMethod" value={m.id} checked={paymentMethod === m.id} onChange={(e) => setPaymentMethod(e.target.value)} />
                                                    <div className="option-content">
                                                        <span className="option-name">{m.name}</span>
                                                        <span className="option-desc">{m.desc}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </>
                                    ) : (
                                        <label className={`payment-option ${paymentMethod === 'payoneer' ? 'selected' : ''}`}>
                                            <input type="radio" name="paymentMethod" value="payoneer" checked={paymentMethod === 'payoneer'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                            <div className="option-content">
                                                <span className="option-name">Payoneer / Wise</span>
                                                <span className="option-desc">Secure international transfer.</span>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} className="place-order-btn">
                                {submitting ? (
                                    <span className="flex-center"><Loader2 className="animate-spin" /> INITIALIZING...</span>
                                ) : (
                                    <span className="flex-center">CONFIRM ORDER <ArrowRight size={20} style={{ marginLeft: '10px' }} /></span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: SUMMARY */}
                    <div className="order-summary-container" ref={summaryRef}>
                        <h2 className="form-section-title">Manifest</h2>
                        <div className="summary-items">
                            {items.map(i => (
                                <div key={i.id} className="summary-item">
                                    <span className="item-name">{i.name} <span className="item-qty">x{i.quantity}</span></span>
                                    <span className="item-price">PKR {(i.price * i.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>PKR {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping ({form.country})</span>
                                <span>PKR {shipping.toLocaleString()}</span>
                            </div>
                            <div className="summary-total">
                                <span>TOTAL</span>
                                <span>PKR {total.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="security-badge">
                            <ShieldCheck size={16} /> 256-BIT ENCRYPTED
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}