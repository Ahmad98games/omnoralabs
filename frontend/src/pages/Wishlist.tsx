import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import './Wishlist.css';

type Product = {
    _id: string;
    name: string;
    price: number;
    image: string;
    inStock: boolean;
};

export default function Wishlist() {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const res = await client.get('/wishlist');
            setWishlist(res.data.products || []);
        } catch (error) {
            // Fallback to localStorage
            const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setWishlist(saved);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId: string) => {
        try {
            await client.delete(`/wishlist/${productId}`);
            setWishlist(wishlist.filter(p => p._id !== productId));
            showToast('Removed from wishlist', 'success');
        } catch (error) {
            // Fallback to localStorage
            const updated = wishlist.filter(p => p._id !== productId);
            localStorage.setItem('wishlist', JSON.stringify(updated));
            setWishlist(updated);
            showToast('Removed from wishlist', 'success');
        }
    };

    const addToCart = (product: Product) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i: any) => i.id === product._id);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast(`${product.name} added to cart`, 'success');
    };

    if (loading) {
        return <div className="loading">Loading wishlist...</div>;
    }

    return (
        <div className="wishlist-page">
            <div className="wishlist-container">
                <h1>My Wishlist</h1>
                <p className="wishlist-count">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>

                {wishlist.length === 0 ? (
                    <div className="empty-wishlist">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                        <h2>Your wishlist is empty</h2>
                        <p>Save items you love for later!</p>
                        <Link to="/collection" className="luxury-button">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlist.map((product) => (
                            <div key={product._id} className="wishlist-card">
                                <button
                                    className="remove-btn"
                                    onClick={() => removeFromWishlist(product._id)}
                                    aria-label="Remove from wishlist"
                                >
                                    ×
                                </button>
                                <Link to={`/product/${product._id}`}>
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => e.currentTarget.src = '/images/bath bomb.png'}
                                    />
                                </Link>
                                <div className="card-content">
                                    <Link to={`/product/${product._id}`}>
                                        <h3>{product.name}</h3>
                                    </Link>
                                    <p className="price">PKR {product.price.toLocaleString()}</p>
                                    {product.inStock ? (
                                        <button
                                            className="luxury-button add-to-cart-btn"
                                            onClick={() => addToCart(product)}
                                        >
                                            Add to Cart
                                        </button>
                                    ) : (
                                        <button className="out-of-stock-btn" disabled>
                                            Out of Stock
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
