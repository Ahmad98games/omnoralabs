import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, MessageCircle, Minus, Plus } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/product.css';

// Hardened Data Contract
interface IGSGProduct {
    _id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
    description?: string;
    stock?: number;
    fabric?: string;
    work?: string;
}

const BRAND_PLACEHOLDER = '/images/placeholder_gsg.png';

export default function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [product, setProduct] = useState<IGSGProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string>('M');

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProduct() {
            setLoading(true);
            setError(null);
            try {
                const res = await client.get(`/products/${id}`, { signal: controller.signal });
                const data = res.data?.data || res.data || null;
                if (!data) throw new Error('Product not found');
                setProduct(data);
            } catch (err: any) {
                if (!axios.isCancel(err)) {
                    setError({
                        message: err.response?.data?.error || err.message || 'Failed to load details',
                        code: err.code || (err.response ? `API_${err.response.status}` : 'NETWORK_ERROR')
                    });
                    console.error('FETCH_ERROR:', err);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
        return () => controller.abort();
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i: any) => i.id === product._id && i.size === selectedSize);

        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                size: selectedSize
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast(`${product.name} Added to Bag`, 'success');
    };

    const handleWhatsAppOrder = () => {
        if (!product) return;
        const message = `Hello Gold She Garments! I would like to order:
*Product:* ${product.name || 'Fashion Piece'}
*Size:* ${selectedSize}
*Price:* PKR ${(product.price || 0).toLocaleString()}
*Link:* ${window.location.href}`;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const baseUrl = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com/send';

        window.open(`${baseUrl}?phone=923097613611&text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) return (
        <div className="product-detail-page">
            <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>
                <p className="description-small italic">Curating details for you...</p>
            </div>
        </div>
    );

    if (error || !product) return (
        <div className="product-detail-page">
            <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>
                <h2>Something went wrong</h2>
                <p style={{ color: 'red', fontWeight: 'bold' }}>{error?.message || 'We could not find the piece you are looking for.'}</p>
                <p style={{ fontSize: '0.8rem', color: '#999' }}>Diagnostic Code: {error?.code || '404'}</p>
                <button onClick={() => navigate('/collection')} className="btn-primary-gsg" style={{ marginTop: '1rem' }}>Back to Collection</button>
            </div>
        </div>
    );

    const isOutOfStock = product?.stock === 0;

    return (
        <div className="product-detail-page">
            <div className="container">
                <Link to="/collection" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={16} /> Back to Collection
                </Link>

                <div className="product-container">
                    {/* Gallery */}
                    <div className="product-gallery">
                        <div className="main-image-box">
                            <img
                                src={product.image || BRAND_PLACEHOLDER}
                                alt={product.name || 'Fashion Piece'}
                                onError={(e) => { (e.target as HTMLImageElement).src = BRAND_PLACEHOLDER; }}
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="product-info-stack">
                        <div className="p-brand-lux eyebrow">The GSG Atelier</div>
                        <h1 className="p-name-lux subtitle-serif">{product.name}</h1>
                        <div className="p-price-lux text-gold">PKR {product.price?.toLocaleString()}</div>

                        <div className="p-desc-lux legal-text-lux">
                            {product.description || "Elegant and timeless Pakistani fashion piece, designed for style and comfort."}
                            <div className="p-meta-lux mt-4 italic text-muted">
                                {product.fabric && <div><strong>FABRIC:</strong> {product.fabric.toUpperCase()}</div>}
                                {product.work && <div><strong>WORK:</strong> {product.work.toUpperCase()}</div>}
                            </div>
                        </div>

                        <div className="form-group">
                            <span className="group-label">Select Size</span>
                            <div className="size-grid">
                                {['S', 'M', 'L', 'XL'].map(size => (
                                    <button
                                        key={size}
                                        className={`size-option ${selectedSize === size ? 'active' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
 <Link
    to="/size-guide"
    style={{
        background: 'none',
        border: 'none',
        color: 'var(--royal-blue)',
        fontSize: '0.8rem',
        textDecoration: 'underline',
        marginTop: '0.5rem',
        cursor: 'pointer',
        display: 'inline-block'
    }}
>
    View Size Guide
</Link>
                        </div>

                        <div className="form-group">
                            <span className="group-label">Quantity</span>
                            <div className="qty-control" style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', width: 'fit-content', padding: '0.5rem', borderRadius: '4px' }}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={16} /></button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={16} /></button>
                            </div>
                        </div>

                        <div className="p-actions-lux">
                            <button
                                onClick={handleAddToCart}
                                className="btn-luxury-action"
                                disabled={isOutOfStock}
                            >
                                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
                            </button>
                            <button
                                onClick={handleWhatsAppOrder}
                                className="btn-luxury-outline w-100"
                            >
                                <MessageCircle size={18} /> ORDER ON WHATSAPP
                            </button>
                        </div>

                        <div className="trust-indicators">
                            <div className="trust-card">
                                <ShieldCheck size={20} />
                                <span>Premium Quality Fabric</span>
                            </div>
                            <div className="trust-card">
                                <Truck size={20} />
                                <span>3-5 Day Secure Shipping</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
