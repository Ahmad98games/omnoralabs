import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import { Heart, ShoppingBag, X, ArrowRight, Loader2 } from 'lucide-react';
import SmartImage from '../components/SmartImage';
import { FALLBACK_IMAGE } from '../constants';
import './Wishlist.css';

type Product = {
    _id: string;
    name: string;
    price: number;
    image: string;
    inStock: boolean;
    category: string;
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
            // For now, fallback to local storage since backend might not persist wishlist for guests
            // In a real app, this would merge local + server
            const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');

            // If we had a real endpoint returning populated products:
            // const res = await client.get('/wishlist');
            // setWishlist(res.data.products);

            // Simulating API delay for effect
            setTimeout(() => {
                setWishlist(saved);
                setLoading(false);
            }, 500);

        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const removeFromWishlist = (productId: string) => {
        const updated = wishlist.filter(p => p._id !== productId);
        setWishlist(updated);
        localStorage.setItem('wishlist', JSON.stringify(updated));
        showToast('Piece removed from selection', 'info');
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
        showToast(`${product.name} secured in bag`, 'success');
    };

    if (loading) {
        return (
            <div className="wishlist-luxury">
                <div className="loading-luxury">
                    <Loader2 size={32} className="animate-spin text-gold" />
                    <p className="font-serif italic">Accessing your selection...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-luxury reveal">
            <div className="luxury-hero-small">
                <div className="container">
                    <header className="wishlist-header-lux">
                        <span className="eyebrow">YOUR SELECTION</span>
                        <h1 className="subtitle-serif">Saved Pieces</h1>
                        <p className="description-small italic">
                            {wishlist.length} {wishlist.length === 1 ? 'Piece' : 'Pieces'} in your boutique collection
                        </p>
                    </header>
                </div>
            </div>

            <div className="container">

                {wishlist.length === 0 ? (
                    <div className="empty-state-luxury">
                        <Heart size={64} strokeWidth={1} className="text-gold mb-4" />
                        <h2 className="subtitle-serif">Your Boutique is Empty</h2>
                        <p>Curate your personal collection of luxury craftsmanship.</p>
                        <Link to="/collection" className="btn-luxury-outline mt-4">
                            Explore the Collection
                        </Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlist.map((product) => (
                            <div key={product._id} className="wishlist-card animate-fade-in-up">
                                <div className="card-image-box">
                                    <Link to={`/product/${product._id}`}>
                                        <SmartImage
                                            src={product.image || FALLBACK_IMAGE}
                                            alt={product.name}
                                            aspectRatio="1/1"
                                            className="wishlist-img"
                                        />
                                    </Link>
                                    <button
                                        className="btn-remove"
                                        onClick={() => removeFromWishlist(product._id)}
                                        title="Remove"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="card-details">
                                    <Link to={`/product/${product._id}`} className="product-link">
                                        <h3 className="product-title">{product.name}</h3>
                                    </Link>
                                    <p className="product-price">PKR {product.price.toLocaleString()}</p>

                                    <div className="card-actions-lux">
                                        {product.inStock !== false ? (
                                            <button
                                                className="btn-lux-bag"
                                                onClick={() => addToCart(product)}
                                            >
                                                ADD TO BAG <ShoppingBag size={14} />
                                            </button>
                                        ) : (
                                            <button className="btn-lux-disabled" disabled>
                                                OUT OF STOCK
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}