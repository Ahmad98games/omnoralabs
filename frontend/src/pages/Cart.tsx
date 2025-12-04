import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Cart.css'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useToast } from '../context/ToastContext'
import { FALLBACK_IMAGE } from '../constants'

type CartItem = { id: string; name: string; price: number; image?: string; quantity: number }

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([])
  const navigate = useNavigate()
  const { showToast } = useToast()
  const contentRef = useScrollReveal()

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[]
    setItems(data)
  }, [])

  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems)
    localStorage.setItem('cart', JSON.stringify(newItems))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const removeItem = (id: string) => {
    updateCart(items.filter(i => i.id !== id))
    showToast('Item removed from bag', 'info')
  }

  const updateQty = (id: string, delta: number) => {
    updateCart(items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const clearCart = () => {
    if (confirm('Are you sure you want to empty your bag?')) {
      updateCart([])
      showToast('Bag cleared', 'info')
    }
  }

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  if (items.length === 0) {
    return (
      <div className="cart-page empty-cart animate-fade-in">
        <div className="empty-cart-content">
          <h2>Your bag is empty</h2>
          <p>Treat yourself to something luxurious.</p>
          <Link to="/collection" className="luxury-button hover-lift">Start Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <header className="cart-hero">
        <div className="cart-hero-content animate-fade-in-up">
          <h1 className="cart-title">Your Shopping Bag</h1>
          <p className="cart-subtitle">Review your luxury selections</p>
        </div>
      </header>

      <div className="cart-container" ref={contentRef}>
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-header">
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            {items.map(item => (
              <div key={item.id} className="cart-item animate-slide-in-right">
                <div className="item-info">
                  <div className="item-image-placeholder">
                    <img src={item.image} alt={item.name} onError={(e) => e.currentTarget.src = FALLBACK_IMAGE} />
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    <p>PKR {item.price.toLocaleString()}</p>
                    <button onClick={() => removeItem(item.id)} className="remove-btn">Remove</button>
                  </div>
                </div>
                <div className="item-quantity">
                  <button onClick={() => updateQty(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div className="item-total">
                  PKR {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
            <button onClick={clearCart} className="clear-cart-btn hover-scale">Clear Bag</button>
          </div>

          <div className="order-summary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <p className="shipping-note">Shipping & taxes calculated at checkout</p>
            <div className="summary-total">
              <span>Total</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="luxury-button checkout-btn hover-lift">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    </div>
  )
}
