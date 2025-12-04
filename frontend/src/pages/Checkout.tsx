import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client, { trackEvent } from '../api/client'
import './Checkout.css'
import { useToast } from '../context/ToastContext'
import { useScrollReveal } from '../hooks/useScrollReveal'

type CartItem = { id: string; name: string; price: number; image?: string; quantity: number }

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [paymentTab, setPaymentTab] = useState<'local' | 'international'>('local')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const { showToast } = useToast()
  const formRef = useScrollReveal()
  const summaryRef = useScrollReveal()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    notes: '',
    // Payment specific fields
    paymentReference: '',
    paymentDate: '',
    senderAccount: ''
  })

  const navigate = useNavigate()

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[]
    setItems(data)
    if (data.length === 0) {
      navigate('/cart')
    }
  }, [navigate])

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const tax = useMemo(() => subtotal * 0.05, [subtotal]) // 5% tax as per legacy
  const shipping = useMemo(() => form.country === 'Pakistan' ? 250 : 5000, [form.country])
  const total = subtotal + tax + shipping

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (items.length === 0) return

    // Basic Validation
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !form.city) {
      setError('Please fill all required fields')
      return
    }

    // Payment Validation
    if (paymentMethod !== 'cod' && !form.paymentReference) {
      setError('Please provide payment transaction reference')
      return
    }

    setSubmitting(true)
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
        notes: form.notes,
        paymentReference: form.paymentReference,
        paymentDate: form.paymentDate,
        senderAccount: form.senderAccount
      }

      const res = await client.post('/orders', payload)
      if (res.data?.success) {
        trackEvent({ type: 'order_created', sessionId: localStorage.getItem('sid') || '', payload: { orderNumber: res.data.orderNumber, total } })
        localStorage.removeItem('cart')
        setItems([])
        window.dispatchEvent(new Event('cart-updated'))
        showToast(`Order placed successfully! Order #: ${res.data.order.orderNumber}`, 'success')
        setTimeout(() => navigate(`/order-confirmation/${res.data.order._id}`), 1000)
      } else {
        const msg = res.data?.error || 'Failed to place order'
        setError(msg)
        showToast(msg, 'error')
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to place order'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="checkout-page">
      <header className="page-header" style={{ textAlign: 'center', padding: '3rem 0', background: 'var(--surface-color)' }}>
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Complete your purchase</p>
      </header>

      <div className="checkout-container">
        <div className="breadcrumbs" style={{ marginBottom: '2rem' }}>
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item"><Link to="/" className="breadcrumbs-link">Home</Link></li>
            <li className="breadcrumbs-item"><Link to="/cart" className="breadcrumbs-link">Shopping Bag</Link></li>
            <li className="breadcrumbs-item">Checkout</li>
          </ul>
        </div>

        <div className="checkout-content">
          <div className="checkout-form-container" ref={formRef}>
            <form id="checkoutForm" onSubmit={placeOrder}>
              {/* Customer Info */}
              <div className="form-section animate-fade-in-up">
                <h2 className="form-section-title">Customer Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input name="firstName" value={form.firstName} onChange={handleInputChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleInputChange} className="form-input" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} className="form-input" required />
                </div>
              </div>

              {/* Shipping Info */}
              <div className="form-section">
                <h2 className="form-section-title">Shipping Information</h2>
                <div className="form-group">
                  <label>Street Address</label>
                  <input name="address" value={form.address} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleInputChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label>State/Province</label>
                    <input name="state" value={form.state} onChange={handleInputChange} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input name="postalCode" value={form.postalCode} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <select name="country" value={form.country} onChange={handleInputChange} className="form-input">
                      <option value="Pakistan">Pakistan</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Delivery Notes (Optional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleInputChange} className="form-input" rows={3} />
                </div>
              </div>

              {/* Payment Info */}
              <div className="form-section">
                <h2 className="form-section-title">Payment Information</h2>

                <div className="payment-tabs">
                  <button type="button" className={`payment-tab ${paymentTab === 'local' ? 'active' : ''}`} onClick={() => setPaymentTab('local')}>Pakistani Payment Methods</button>
                  <button type="button" className={`payment-tab ${paymentTab === 'international' ? 'active' : ''}`} onClick={() => setPaymentTab('international')}>International Payment Methods</button>
                </div>

                {paymentTab === 'local' ? (
                  <div className="payment-options">
                    <div className="payment-option">
                      <label>
                        <div className="payment-option-header">
                          <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
                          <span className="payment-option-name">Cash on Delivery</span>
                        </div>
                        <span className="payment-option-description">Pay when you receive your order</span>
                      </label>
                    </div>
                    <div className="payment-option">
                      <label>
                        <div className="payment-option-header">
                          <input type="radio" name="paymentMethod" value="meezan" checked={paymentMethod === 'meezan'} onChange={(e) => setPaymentMethod(e.target.value)} />
                          <span className="payment-option-name">Meezan Bank Transfer</span>
                        </div>
                        <span className="payment-option-description">Pay via bank transfer to our Meezan Bank account</span>
                      </label>
                    </div>
                    <div className="payment-option">
                      <label>
                        <div className="payment-option-header">
                          <input type="radio" name="paymentMethod" value="jazzcash" checked={paymentMethod === 'jazzcash'} onChange={(e) => setPaymentMethod(e.target.value)} />
                          <span className="payment-option-name">JazzCash</span>
                        </div>
                        <span className="payment-option-description">Pay with your JazzCash mobile account</span>
                      </label>
                    </div>
                    <div className="payment-option">
                      <label>
                        <div className="payment-option-header">
                          <input type="radio" name="paymentMethod" value="easypaisa" checked={paymentMethod === 'easypaisa'} onChange={(e) => setPaymentMethod(e.target.value)} />
                          <span className="payment-option-name">EasyPaisa</span>
                        </div>
                        <span className="payment-option-description">Pay with your EasyPaisa mobile account</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="payment-options">
                    <div className="payment-option">
                      <label>
                        <div className="payment-option-header">
                          <input type="radio" name="paymentMethod" value="payoneer" checked={paymentMethod === 'payoneer'} onChange={(e) => setPaymentMethod(e.target.value)} />
                          <span className="payment-option-name">Payoneer</span>
                        </div>
                        <span className="payment-option-description">Pay securely via Payoneer</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Dynamic Payment Details */}
                {paymentMethod === 'meezan' && (
                  <div className="payment-details">
                    <h3>Bank Transfer Details</h3>
                    <div className="bank-details">
                      <p><strong>Bank Name:</strong> Meezan Bank</p>
                      <p><strong>Account Name:</strong> Omnora</p>
                      <p><strong>Account Number:</strong> 0123-4567-8901-2345</p>
                      <p className="bank-note">Please use your order number as the payment reference.</p>
                    </div>
                    <div className="form-group">
                      <label>Transaction Reference</label>
                      <input name="paymentReference" value={form.paymentReference} onChange={handleInputChange} className="form-input" placeholder="Enter transaction ID" required />
                    </div>
                  </div>
                )}

                {paymentMethod === 'jazzcash' && (
                  <div className="payment-details">
                    <h3>JazzCash Details</h3>
                    <div className="bank-details">
                      <p><strong>Account Number:</strong> +92 305 10345</p>
                      <p><strong>Account Name:</strong> Omnora</p>
                    </div>
                    <div className="form-group">
                      <label>Transaction ID</label>
                      <input name="paymentReference" value={form.paymentReference} onChange={handleInputChange} className="form-input" placeholder="Enter transaction ID" required />
                    </div>
                  </div>
                )}

                {paymentMethod === 'easypaisa' && (
                  <div className="payment-details">
                    <h3>EasyPaisa Details</h3>
                    <div className="bank-details">
                      <p><strong>Account Number:</strong> +92 333 4355475</p>
                      <p><strong>Account Name:</strong> Omnora</p>
                    </div>
                    <div className="form-group">
                      <label>Transaction ID</label>
                      <input name="paymentReference" value={form.paymentReference} onChange={handleInputChange} className="form-input" placeholder="Enter transaction ID" required />
                    </div>
                  </div>
                )}

                {paymentMethod === 'payoneer' && (
                  <div className="payment-details">
                    <h3>Payoneer Details</h3>
                    <div className="bank-details">
                      <p><strong>Bank Name:</strong> Citibank</p>
                      <p><strong>Transfer Type:</strong> Local transfer</p>
                      <p><strong>Bank Address:</strong> 111 Wall Street New York, NY 10043 USA</p>
                      <p><strong>Routing (ABA):</strong> 031100209</p>
                      <p><strong>SWIFT Code:</strong> CITIUS33</p>
                      <p><strong>Account Number:</strong> 70580140001852822</p>
                      <p><strong>Account Type:</strong> CHECKING</p>
                      <p><strong>Beneficiary Name:</strong> Ahmad Mahboob Malik Mahboob Rabbani</p>
                    </div>
                    <div className="form-group">
                      <label>Transaction Reference</label>
                      <input name="paymentReference" value={form.paymentReference} onChange={handleInputChange} className="form-input" placeholder="Enter transaction ID" required />
                    </div>
                  </div>
                )}
              </div>

              {error && <div style={{ color: 'crimson', marginBottom: '1rem' }}>{error}</div>}
              {success && <div style={{ color: 'seagreen', marginBottom: '1rem' }}>{success}</div>}

              <button type="submit" disabled={submitting} className="luxury-button place-order-btn">
                {submitting ? 'Processing...' : `Place Order (PKR ${total.toLocaleString()})`}
              </button>
            </form>
          </div>

          <div className="order-summary-container" ref={summaryRef}>
            <h2 className="form-section-title">Order Summary</h2>
            <div className="summary-items">
              {items.map(i => (
                <div key={i.id} className="summary-item">
                  <span>{i.name} x{i.quantity}</span>
                  <span>PKR {(i.price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Tax (5%)</span>
                <span>PKR {tax.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>PKR {shipping.toLocaleString()}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>PKR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
