import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client, { trackEvent } from '../api/client'
import './Product.css'
import { useToast } from '../context/ToastContext'
import { FALLBACK_IMAGE } from '../constants'
import { SkeletonProductDetail } from '../components/Skeleton'
import '../components/Skeleton.css'

type Product = {
    _id: string
    name: string
    price: number
    image: string
    category: string
    description?: string
    isFeatured?: boolean
    isNew?: boolean
    stock?: number
}

export default function Product() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [quantity, setQuantity] = useState(1)
    const { showToast } = useToast()

    useEffect(() => {
        let isMounted = true
        async function load() {
            try {
                setLoading(true)
                setError(null)
                const res = await client.get(`/products/${id}`)
                if (!isMounted) return

                let data = res.data
                if (data.data) {
                    data = data.data
                }

                setProduct(data)
            } catch (e: any) {
                if (isMounted) {
                    setError(e?.message || 'Failed to load product')
                }
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [id])

    const addToCart = () => {
        if (!product) return

        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const existing = cart.find((i: any) => i.id === product._id)

        if (existing) {
            existing.quantity += quantity
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            })
        }

        localStorage.setItem('cart', JSON.stringify(cart))
        window.dispatchEvent(new Event('cart-updated'))
        trackEvent({
            type: 'add_to_cart',
            sessionId: localStorage.getItem('sid') || '',
            payload: { productId: product._id, price: product.price, quantity }
        })
        showToast(`Added ${quantity} x ${product.name} to bag`, 'success')
    }

    if (loading) {
        return (
            <div className="product-page">
                <SkeletonProductDetail />
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="product-page">
                <div className="empty-state">
                    <h3>Product Not Found</h3>
                    <p>{error || 'The product you are looking for does not exist.'}</p>
                    <button onClick={() => navigate('/collection')} className="add-to-cart-btn">
                        Browse Collection
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="product-page">
            <div className="breadcrumbs">
                <Link to="/">Home</Link> / <Link to="/collection">Collection</Link> / <span>{product.name}</span>
            </div>

            <div className="product-detail-container">
                <div className="product-image-section">
                    <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) => e.currentTarget.src = FALLBACK_IMAGE}
                    />
                </div>

                <div className="product-info-section">
                    <h1 className="product-name">{product.name}</h1>

                    {product.isNew && (
                        <span className="badge badge-new">NEW</span>
                    )}
                    {product.isFeatured && (
                        <span className="badge badge-featured">★ FEATURED</span>
                    )}

                    <p className="product-price">PKR {product.price.toLocaleString()}</p>

                    {product.description && (
                        <div className="product-description">
                            <h3>Description</h3>
                            <p>{product.description}</p>
                        </div>
                    )}

                    <div className="product-actions">
                        <div className="quantity-selector">
                            <label htmlFor="quantity">Quantity:</label>
                            <div className="quantity-controls">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    id="quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                />
                                <button onClick={() => setQuantity(quantity + 1)}>
                                    +
                                </button>
                            </div>
                        </div>

                        <button onClick={addToCart} className="add-to-cart-btn">
                            Add to Bag
                        </button>
                    </div>

                    {product.stock !== undefined && (
                        <p className="stock-info">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
