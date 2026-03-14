import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, MessageCircle, Minus, Plus } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BuilderProvider } from '../context/BuilderContext';
// import SovereignWidget from '../components/cms/SovereignWidget';
import '../styles/product.css';

const BRAND_PLACEHOLDER = '/images/placeholder_gsg.png';

interface Variant {
    label: string;
    stock: number;
    priceOverride?: number;
}

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
    isBestseller?: boolean;
    showLowStockWarning?: boolean;
    variants?: Variant[];
}

export default function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [product, setProduct] = useState<IGSGProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [siteContent, setSiteContent] = useState<any>(null);
    const { updateSellerStyles } = useTheme();
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string>('M');
    const [isProcessing, setIsProcessing] = useState(false);

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
                if (data.variants?.length > 0) {
                    setSelectedSize(data.variants[0].label);
                }
            } catch (err: any) {
                if (!axios.isCancel(err)) {
                    setError({
                        message: err.response?.data?.error || err.message || 'Failed to load details',
                        code: err.code || (err.response ? `API_${err.response.status}` : 'NETWORK_ERROR')
                    });
                }
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();

        async function fetchCMS() {
            try {
                const { data } = await client.get('/cms/content');
                if (data.success && data.content) {
                    setSiteContent(data.content);
                    if (data.content.globalStyles) updateSellerStyles(data.content.globalStyles);
                }
            } catch (err) {
                console.error('CMS Fetch failed', err);
            }
        }
        fetchCMS();

        return () => controller.abort();
    }, [id, updateSellerStyles]);

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

    const handleWhatsAppOrder = async () => {
        if (!product || isProcessing) return;

        setIsProcessing(true);
        try {
            // Save order as PENDING_CONFIRMATION before redirect
            const payload = {
                items: [{
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    size: selectedSize,
                    image: product.image
                }],
                totalAmount: product.price * quantity,
                status: 'PENDING_CONFIRMATION'
            };

            const res = await client.post('/orders', payload);
            const orderId = res.data?.order?.orderNumber || res.data?.order?._id || 'INQUIRY';

            const message = `🚀 *NEW ORDER REQUEST* (#${orderId})
        
Order from: ${window.location.origin}
--------------------------------
*Product:* ${product.name}
*Selection:* ${selectedSize}
*Price:* PKR ${(product.price || 0).toLocaleString()}
*Quantity:* ${quantity}
--------------------------------
*Product Link:* ${window.location.href}

Please confirm availability and shipping timeline.`;

            window.open(`https://wa.me/923097613611?text=${encodeURIComponent(message.trim())}`, '_blank');
        } catch (err: any) {
            console.error('WhatsApp Persistence Failed', err);
            showToast('Unable to initiate secure order. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="p-loading-lux">Refining Details...</div>;

    if (error || !product) return (
        <div className="product-detail-page">
            <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>
                <h2>Something went wrong</h2>
                <p style={{ color: 'red', fontWeight: 'bold' }}>{error?.message || 'We could not find the piece you are looking for.'}</p>
                <button onClick={() => navigate('/collection')} className="btn-luxury-outline">Back to Collection</button>
            </div>
        </div>
    );

    const isOutOfStock = (product.variants?.length ?? 0) > 0
        ? (product.variants?.find(v => v.label === selectedSize)?.stock ?? 0) === 0
        : (product.stock ?? 0) === 0;

    const availableStock = (product.variants?.length ?? 0) > 0
        ? (product.variants?.find(v => v.label === selectedSize)?.stock ?? 0)
        : (product.stock ?? 0);

    const isPreview = window.location.search.includes('preview=true');

    return (
        <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
            <div className="product-detail-page scroll-reveal">
                <div className="container">
                    <Link to="/collection" className="back-link-lux">
                        <ArrowLeft size={16} /> BACK TO COLLECTION
                    </Link>

                    <div className="product-container">
                        {/* Gallery */}
                        <div className="product-gallery">
                            <div className="main-image-box">
                                <img src={product.image || BRAND_PLACEHOLDER} alt={product.name} />
                                {product.isBestseller && <div className="bestseller-badge">BESTSELLER</div>}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="product-info-stack">
                            <span className="p-brand-lux">OMNORA ATELIER</span>
                            <h1 className="p-name-lux serif">{product.name}</h1>
                            <div className="p-price-lux">PKR {(product.price || 0).toLocaleString()}</div>

                            <p className="p-desc-lux">{product.description}</p>

                            {/* Variants Selection */}
                            {(product.variants?.length ?? 0) > 0 && (
                                <div className="selection-group">
                                    <span className="group-label">SELECT VARIANT</span>
                                    <div className="size-grid">
                                        {product.variants?.map(v => (
                                            <button
                                                key={v.label}
                                                className={`size-option ${selectedSize === v.label ? 'active' : ''}`}
                                                onClick={() => setSelectedSize(v.label)}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Indicator */}
                            {product.showLowStockWarning && availableStock > 0 && availableStock < 5 && (
                                <div className="stock-pulse">
                                    <span className="pulse-dot"></span>
                                    HURRY! ONLY {availableStock} LEFT IN STOCK
                                </div>
                            )}

                            {isOutOfStock && (
                                <div className="sold-out-notice">SOLD OUT</div>
                            )}

                            {/* Quantity */}
                            {!isOutOfStock && (
                             <div className="selection-group" style={{ marginTop: '2rem' }}>
    <span className="group-label">QUANTITY</span>
    <div className="qty-control">
        <button 
            aria-label="Decrease quantity"
            title="Decrease"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
            <Minus size={14} aria-hidden="true" />
        </button>
        <span>{quantity}</span>
        <button 
            aria-label="Increase quantity"
            title="Increase"
            onClick={() => setQuantity(quantity + 1)}
        >
            <Plus size={14} aria-hidden="true" />
        </button>
    </div>
</div>
                            )}

                            {/* Actions */}
                            <div className="p-actions-lux">
                                {!isOutOfStock && (
                                    <>
                                        <button className="btn-luxury-action" onClick={handleAddToCart}>
                                            <ShoppingBag size={18} /> ADD TO SHOPPING BAG
                                        </button>
                                        <button className="btn-luxury-outline" onClick={handleWhatsAppOrder}>
                                            <MessageCircle size={18} /> BUY NOW VIA WHATSAPP
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Trust */}
                            <div className="trust-indicators">
                                <div className="trust-card">
                                    <Truck size={20} />
                                    <span>Fast Delivery (3-5 Days)</span>
                                </div>
                                <div className="trust-card">
                                    <ShieldCheck size={20} />
                                    <span>Genuine Craftsmanship</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BuilderProvider>
    );
}
