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



  const removeItem = (id: string, name: string) => {

    if (confirm(`Remove "${name}" from your bag?`)) {

      updateCart(items.filter(i => i.id !== id))

      showToast('Item removed from bag', 'info')

    }

  }



  const updateQty = (id: string, delta: number) => {

    const updatedItems = items.map(i => {

      if (i.id === id) {

        const newQty = Math.max(1, i.quantity + delta)

        return { ...i, quantity: newQty }

      }

      return i

    })

    updateCart(updatedItems)

  }



  const clearCart = () => {

    if (confirm('Are you sure you want to empty your bag? This action cannot be undone.')) {

      updateCart([])

      showToast('Shopping bag cleared', 'info')

    }

  }



  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])



  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {

    e.currentTarget.src = FALLBACK_IMAGE

    e.currentTarget.onerror = null // Prevent infinite loop

  }



  if (items.length === 0) {

    return (

      <div className="cart-page empty-cart animate-fade-in">

        <div className="empty-cart-content">

          <h2>Your Bag Is Empty</h2>

          <p>Discover our curated collection of premium products.</p>

          <Link to="/collection" className="luxury-button hover-lift">

            Explore Collection

          </Link>

        </div>

      </div>

    )

  }



  return (

    <div className="cart-luxury">
      <header className="cart-hero-mini">
        <div className="container">
          <span className="eyebrow">YOUR SELECTION</span>
          <h1 className="h1 subtitle-serif">Shopping Bag</h1>
          <p className="text-muted italic">
            {totalItems} {totalItems === 1 ? 'Piece' : 'Pieces'} • PKR {subtotal.toLocaleString()}
          </p>
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

            {items.map((item, index) => (

              <div

                key={item.id}

                className="cart-item animate-slide-in-right"

                style={{ animationDelay: `${index * 0.1}s` }}

              >

                <div className="item-info">

                  <div className="item-image-placeholder">

                    <img

                      src={item.image || FALLBACK_IMAGE}

                      alt={item.name}

                      onError={handleImageError}

                      loading="lazy"

                    />

                  </div>

                  <div>

                    <h3>{item.name}</h3>

                    <p>PKR {item.price.toLocaleString()}</p>

                    <button

                      onClick={() => removeItem(item.id, item.name)}

                      className="remove-btn"

                      aria-label={`Remove ${item.name} from cart`}

                    >

                      Remove

                    </button>

                  </div>

                </div>

                <div className="item-quantity">

                  <button

                    onClick={() => updateQty(item.id, -1)}

                    aria-label="Decrease quantity"

                    disabled={item.quantity <= 1}

                  >

                    −

                  </button>

                  <span aria-label={`Quantity: ${item.quantity}`}>

                    {item.quantity}

                  </span>

                  <button

                    onClick={() => updateQty(item.id, 1)}

                    aria-label="Increase quantity"

                  >

                    +

                  </button>

                </div>

                <div className="item-total">

                  PKR {(item.price * item.quantity).toLocaleString()}

                </div>

              </div>

            ))}

            <button

              onClick={clearCart}

              className="clear-cart-btn hover-scale"

              aria-label="Clear entire shopping bag"

            >

              Clear Bag

            </button>

          </div>



          <div className="order-summary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

            <h2>Order Summary</h2>

            <div className="summary-row">

              <span>Items ({totalItems})</span>

              <span>PKR {subtotal.toLocaleString()}</span>

            </div>

            <div className="summary-row">

              <span>Subtotal</span>

              <span>PKR {subtotal.toLocaleString()}</span>

            </div>

            <p className="shipping-note">

              Shipping, taxes, and discount codes calculated at checkout

            </p>

            <div className="summary-total">

              <span>Total</span>

              <span>PKR {subtotal.toLocaleString()}</span>

            </div>

            <button

              onClick={() => navigate('/checkout')}

              className="luxury-button checkout-btn hover-lift"

              aria-label={`Proceed to checkout with ${totalItems} items totaling PKR ${subtotal.toLocaleString()}`}

            >

              Proceed to Checkout

            </button>



            <div className="continue-shopping">
              <Link
                to="/collection"
                className="continue-link"
              >
                ← Continue Shopping
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>

  )

}