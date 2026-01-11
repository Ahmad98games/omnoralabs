import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client, { trackEvent } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FALLBACK_IMAGE } from '../constants';
import SmartImage from '../components/SmartImage'; // Utilizing our custom component
import { SkeletonProductDetail } from '../components/Skeleton';
import { ShoppingBag, Minus, Plus, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import './Product.css';

// Guaranteed "Cinematic" load time
const MINIMUM_LOAD_TIME = 800; 

type Product = {
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description?: string;
    isFeatured?: boolean;
    isNew?: boolean;
    stock?: number; // Optional on frontend if backend doesn't always send it
}

type CartItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

export default function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        let isMounted = true;
        const startTime = Date.now();
        
        async function load() {
            let fetchedProduct: Product | null = null;
            let fetchError: string | null = null;

            try {
                setLoading(true);
                const res = await client.get(`/products/${id}`);
                // Handle different API response structures
                fetchedProduct = res.data.data || res.data; 
            } catch (e: any) {
                fetchError = e?.message || 'Access Denied: Product data unavailable.';
            }

            if (!isMounted) return;

            // Enforce minimum cinematic delay
            const timeElapsed = Date.now() - startTime;
            const delayRemaining = MINIMUM_LOAD_TIME - timeElapsed;
            await new Promise(resolve => setTimeout(resolve, Math.max(0, delayRemaining)));
            
            if (!isMounted) return;

            setProduct(fetchedProduct);
            setError(fetchError);
            setLoading(false);
        }

        load();
        return () => { isMounted = false };
    }, [id]);

    const handleQuantityUpdate = (delta: number) => {
        const maxStock = product?.stock ?? 100; // Default high if unknown
        let newQty = quantity + delta;
        newQty = Math.max(1, Math.min(newQty, maxStock));
        setQuantity(newQty);
    };

    const addToCart = () => {
        if (!product) return;

        const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i) => i.id === product._id);
        const currentStock = product.stock ?? 100;
        
        let finalQtyToAdd = quantity;

        if (existing) {
            if ((existing.quantity + quantity) > currentStock) {
                showToast(`Stock limit reached. Only ${Math.max(0, currentStock - existing.quantity)} more available.`, 'warning');
                return;
            }
            existing.quantity += quantity;
        } else {
            if (quantity > currentStock) {
                showToast(`Insufficient stock. Only ${currentStock} available.`, 'warning');
                return;
            }
            cart.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated')); // Update Navbar
        
        trackEvent({
            type: 'add_to_cart',
            sessionId: localStorage.getItem('sid') || 'guest',
            payload: { productId: product._id, price: product.price, quantity }
        });

        showToast(`Added ${quantity} x ${product.name} to bag`, 'success');
    };

    if (loading) return <div className="product-page"><SkeletonProductDetail /></div>;

    if (error || !product) {
        return (
            <div className="product-page">
                <div className="empty-state-magnum">
                    <h3>404: Asset Not Found</h3>
                    <p>The product you are looking for has been decommissioned or moved.</p>
                    <button onClick={() => navigate('/collection')} className="btn-action">
                        Return to Collection
                    </button>
                </div>
            </div>
        );
    }

    const isOutOfStock = product.stock === 0;

    return (
        <div className="product-page">
            <div className="noise-layer" />
            
            <div className="container">
                {/* Breadcrumbs */}
                <nav className="breadcrumbs-nav">
                    <Link to="/" className="crumb-link">Home</Link> / 
                    <Link to="/collection" className="crumb-link">Collection</Link> / 
                    <span className="crumb-active">{product.name}</span>
                </nav>

                <div className="product-grid-layout">
                    {/* Left: Image */}
                    <div className="product-visual">
                        <div className="image-frame">
                            <SmartImage 
                                src={product.image || FALLBACK_IMAGE} 
                                alt={product.name}
                                aspectRatio="1/1"
                                className="main-product-img"
                                priority={true}
                            />
                            {product.isNew && <span className="corner-badge">NEW ARRIVAL</span>}
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="product-intel">
                        <h1 className="p-title">{product.name}</h1>
                        
                        <div className="p-meta">
                            <span className="p-price">PKR {product.price.toLocaleString()}</span>
                            {product.isFeatured && <span className="p-tag">FEATURED</span>}
                        </div>

                        <div className="p-divider"></div>

                        <div className="p-description">
                            <h3>Specifications</h3>
                            <p>{product.description || "No description data available for this asset."}</p>
                        </div>

                        {/* Controls */}
                        <div className="p-controls">
                            <div className="qty-wrapper">
                                <label>QUANTITY</label>
                                <div className="qty-dial">
                                    <button 
                                        onClick={() => handleQuantityUpdate(-1)} 
                                        disabled={quantity <= 1 || isOutOfStock}
                                        className="qty-btn"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="qty-val">{quantity}</span>
                                    <button 
                                        onClick={() => handleQuantityUpdate(1)} 
                                        disabled={product.stock !== undefined && quantity >= product.stock}
                                        className="qty-btn"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={addToCart} 
                                className="btn-add-cart"
                                disabled={isOutOfStock}
                            >
                                {isOutOfStock ? 'OUT OF STOCK' : (
                                    <>
                                        ADD TO BAG <ShoppingBag size={18} />
                                    </>
                                )}
                            </button>
                        </div>

                        {product.stock !== undefined && (
                            <p className={`stock-indicator ${product.stock < 5 ? 'low' : ''}`}>
                                {isOutOfStock 
                                    ? 'Stock Depleted.' 
                                    : `Inventory Level: ${product.stock} Units`}
                            </p>
                        )}

                        {/* Trust Signals */}
                        <div className="trust-grid">
                            <div className="trust-item">
                                <ShieldCheck size={20} className="trust-icon" />
                                <span>Quality Assured</span>
                            </div>
                            <div className="trust-item">
                                <Truck size={20} className="trust-icon" />
                                <span>Secure Shipping</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}