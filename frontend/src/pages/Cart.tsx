import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useToast } from '../context/ToastContext';
import SmartImage from '../components/SmartImage'; // utilizing our custom component
import './Cart.css';

type CartItem = { id: string; name: string; price: number; image: string; quantity: number };

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const contentRef = useScrollReveal();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
    setItems(data);
  }, []);

  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
    // Dispatch event for Navbar badge update
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    // No native confirm() - instant action is better UX
    updateCart(items.filter(i => i.id !== id));
    showToast('Item removed from bag', 'info');
  };

  const updateQty = (id: string, delta: number) => {
    const updatedItems = items.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    });
    updateCart(updatedItems);
  };

  const clearCart = () => {
    if (window.confirm('Purge all items from cart?')) { // Kept only for full clear safety
        updateCart([]);
        showToast('Shopping bag cleared', 'info');
    }
  };

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  if (items.length === 0) {
    return (
      <div className="cart-page empty-cart animate-fade-in">
        <div className="empty-cart-content">
          <ShoppingBag size={64} className="empty-icon" />
          <h2>Your Bag Is Empty</h2>
          <p>Discover our curated collection of premium products.</p>
          <Link to="/collection" className="luxury-button hover-lift">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-hero">
        <div className="cart-hero-content animate-fade-in-up">
          <h1 className="cart-title">Shopping Bag</h1>
          <p className="cart-subtitle">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'} • PKR {subtotal.toLocaleString()}
          </p>
        </div>
      </header>

      <div className="cart-container" ref={contentRef}>
        <div className="cart-content">
          
          {/* LEFT: CART ITEMS */}
          <div className="cart-items">
            <div className="cart-header">
              <span>Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
            </div>
            
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className="cart-item animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Product Info */}
                <div className="item-info">
                  <div className="item-image-wrapper">
                    <SmartImage 
                        src={item.image} 
                        alt={item.name} 
                        aspectRatio="1/1"
                        className="item-thumb"
                    />
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="price-tag">PKR {item.price.toLocaleString()}</p>
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="remove-btn"
                      title="Remove Item"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="item-quantity">
                  <button 
                    onClick={() => updateQty(item.id, -1)}
                    disabled={item.quantity <= 1}
                    className="qty-btn"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button 
                    onClick={() => updateQty(item.id, 1)}
                    className="qty-btn"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Total */}
                <div className="item-total">
                  PKR {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="clear-cart-btn">
              Clear Bag
            </button>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
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
            
            <div className="shipping-note">
              Shipping & taxes calculated at checkout
            </div>
            
            <div className="summary-total">
              <span>Total</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')} 
              className="luxury-button checkout-btn"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            
            <div className="continue-bar">
              <Link to="/collection" className="continue-link">
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}