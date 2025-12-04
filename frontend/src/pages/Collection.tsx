import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client, { trackEvent } from '../api/client'
import './Collection.css'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useToast } from '../context/ToastContext'
import AdPlacementZone from '../components/AdPlacementZone'
import adConfig from '../config/adConfig.json'
// Used for better loading visualization
import SkeletonProductCard from '../components/SkeletonProductCard'
import { FALLBACK_IMAGE } from '../constants'

type Product = {
    _id: string
    name: string
    price: number
    image: string
    category: string
    description?: string
    isFeatured?: boolean
    isNew?: boolean
}

// ----------------------------------------------------
// 1. DEFINE FOOTER COMPONENT
// ----------------------------------------------------
const Footer = () => (
    <footer className="footer">
        <div className="container">
            {/* Added style for centering content */}
            <div className="footer-bottom" style={{ textAlign: 'center' }}>
                &copy; {new Date().getFullYear()} Omnora. All rights reserved. | Operated and Developed By Ahmad Mahboob
            </div>
        </div>
    </footer>
);


export default function Collection() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState('default')
    // Removed unused state: [viewMode, setViewMode]
    const [priceRange, setPriceRange] = useState<'all' | 'under-500' | '500-1000' | 'over-1000'>('all')

    const { showToast } = useToast()
    const headerRef = useScrollReveal()
    const gridRef = useScrollReveal()

    // Define how many skeleton cards to show during load
    const SKELETON_COUNT = 8;

    useEffect(() => {
        let isMounted = true
        async function load() {
            try {
                setLoading(true)
                setError(null)
                const q = searchParams.get('q')
                const cat = searchParams.get('category')
                let res

                // --- Product Fetching Logic with Fallback ---
                try {
                    if (q) {
                        res = await client.get(`/products/search`, { params: { q } })
                    } else if (cat) {
                        res = await client.get(`/products/category/${encodeURIComponent(cat)}`)
                    } else {
                        res = await client.get(`/products`)
                    }
                } catch (apiError) {
                    console.warn('API connection failed, using fallback data:', apiError)
                    // Fallback data is loaded silently - no toast needed
                    // Import fallback data dynamically
                    const { fallbackProducts } = await import('../data/fallbackProducts')
                    res = { data: { success: true, data: fallbackProducts } }
                }

                if (!isMounted) return

                let data = res.data || []
                // Normalize data structure
                if (data.data && Array.isArray(data.data)) {
                    data = data.data
                } else if (Array.isArray(res.data)) {
                    data = res.data
                }

                if (!Array.isArray(data)) {
                    data = []
                }

                // --- Filtering & Sorting ---

                // Apply price filter
                let filteredData = data.filter((p: Product) => {
                    if (priceRange === 'under-500') return p.price < 500
                    if (priceRange === '500-1000') return p.price >= 500 && p.price <= 1000
                    if (priceRange === 'over-1000') return p.price > 1000
                    return true
                })

                // Client-side sorting
                if (sortBy === 'price-low') {
                    filteredData.sort((a: any, b: any) => a.price - b.price)
                } else if (sortBy === 'price-high') {
                    filteredData.sort((a: any, b: any) => b.price - a.price)
                } else if (sortBy === 'name-asc') {
                    filteredData.sort((a: any, b: any) => a.name.localeCompare(b.name))
                } else if (sortBy === 'name-desc') {
                    filteredData.sort((a: any, b: any) => b.name.localeCompare(a.name))
                } else if (sortBy === 'featured') {
                    filteredData.sort((a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
                } else if (sortBy === 'new') {
                    filteredData.sort((a: any, b: any) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
                }

                setProducts(filteredData)

            } catch (e: any) {
                console.error('Critical error loading products:', e)
                setError('Failed to load products. Please check your connection.')

                // Final fallback if even the dynamic import fails (highly unlikely)
                try {
                    const { fallbackProducts } = await import('../data/fallbackProducts')
                    setProducts(fallbackProducts)
                } catch (fallbackError) {
                    setProducts([]); // Set to empty array on total failure
                }
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [searchParams, sortBy, priceRange])

    const addToCart = (p: Product) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const existing = cart.find((i: any) => i.id === p._id)
        if (existing) existing.quantity++
        else cart.push({ id: p._id, name: p.name, price: p.price, image: p.image, quantity: 1 })

        localStorage.setItem('cart', JSON.stringify(cart))
        window.dispatchEvent(new Event('cart-updated'))
        trackEvent({ type: 'add_to_cart', sessionId: localStorage.getItem('sid') || '', payload: { productId: p._id, price: p.price } })
        showToast(`Added ${p.name} to bag`, 'success')
    }

    // Use the products state directly since filtering is done in useEffect
    const displayedProducts = products
    // Calculate ad insertion index (e.g., after the 3rd or 4th item)
    const adInsertIndex = 4;

    return (
        <>
            <div className="collection-page">
                <header className="collection-hero" ref={headerRef}>
                    <div className="collection-hero-content animate-fade-in-up">
                        <h1 className="collection-title">Bath Bomb Collection</h1>
                        <p className="collection-subtitle">Immerse yourself in luxury with our handcrafted bath bombs. Each one is carefully formulated with premium ingredients for the ultimate relaxation experience.</p>
                    </div>
                </header>

                <div className="collection-container">
                    <div className="breadcrumbs animate-fade-in">
                        <Link to="/">Home</Link> / <span>Bath Bombs</span>
                    </div>

                    {/* Top Banner Ad Zone */}
                    <AdPlacementZone
                        type="banner"
                        config={adConfig.collection.topBanner}
                        zoneName="Collection Top Banner"
                    />

                    <div className="collection-toolbar animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            <p>Showing **{displayedProducts.length}** {displayedProducts.length === 1 ? 'product' : 'products'}</p>

                            {/* Price Filter */}
                            <div className="filter-group">
                                <label htmlFor="priceFilter">Price:</label>
                                <select
                                    id="priceFilter"
                                    className="sort-select"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(e.target.value as any)}
                                >
                                    <option value="all">All Prices</option>
                                    <option value="under-500">Under PKR 500</option>
                                    <option value="500-1000">PKR 500 - 1000</option>
                                    <option value="over-1000">Over PKR 1000</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="sortBy">Sort By:</label>
                            <select
                                id="sortBy"
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="default">Featured</option>
                                <option value="new">New Arrivals</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name-asc">Name: A-Z</option>
                                <option value="name-desc">Name: Z-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="product-display-section">
                        {/* 1. SKELETON LOADING STATE (Enhanced UX) */}
                        {loading ? (
                            <div className="product-grid" ref={gridRef}>
                                {/* Render multiple SkeletonProductCard components */}
                                {Array(SKELETON_COUNT).fill(0).map((_, index) => (
                                    <SkeletonProductCard key={index} />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="empty-state">
                                <h3>Oops! Something went wrong</h3>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="add-to-cart-btn"
                                    style={{ maxWidth: '300px', margin: '0 auto' }}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : displayedProducts.length === 0 ? (
                            <div className="empty-state">
                                <h3>No products found 🛁</h3>
                                <p>Try adjusting your filters, clearing your search query, or check back later for new arrivals.</p>
                            </div>
                        ) : (
                            <div className="product-grid" ref={gridRef}>
                                {/* 2. CONSOLIDATED PRODUCT RENDERING WITH AD INJECTION */}
                                {displayedProducts.map((p, index) => (
                                    <>
                                        {/* Inject Ad after 'adInsertIndex' products (e.g., after the 4th card) */}
                                        {index === adInsertIndex && (
                                            <div key="mid-ad-banner" style={{ gridColumn: '1 / -1', margin: '2rem 0' }}>
                                                <AdPlacementZone
                                                    type="banner"
                                                    config={adConfig.collection.midContentBanner}
                                                    zoneName="Mid-Content Banner"
                                                />
                                            </div>
                                        )}

                                        <div key={p._id} className="product-card hover-lift">
                                            <Link to={`/product/${p._id}`} className="product-image-link">
                                                <div className="product-image-placeholder">
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        onError={(e) => e.currentTarget.src = FALLBACK_IMAGE}
                                                    />
                                                </div>
                                            </Link>
                                            <div className="product-info">
                                                <Link to={`/product/${p._id}`} className="product-title">
                                                    {p.name}
                                                    {p.isNew && <span style={{
                                                        marginLeft: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.5rem',
                                                        background: 'var(--color-aqua)',
                                                        color: 'var(--color-bg-dark)',
                                                        borderRadius: '0.25rem',
                                                        fontWeight: 700
                                                    }}>NEW</span>}
                                                    {p.isFeatured && <span style={{
                                                        marginLeft: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.5rem',
                                                        background: 'var(--color-silver)',
                                                        color: 'var(--color-bg-dark)',
                                                        borderRadius: '0.25rem',
                                                        fontWeight: 700
                                                    }}>★</span>}
                                                </Link>
                                                {p.description && (
                                                    <p className="product-description">{p.description}</p>
                                                )}
                                                <p className="product-price">PKR **{p.price.toLocaleString()}**</p>
                                                <button
                                                    onClick={() => addToCart(p)}
                                                    className="add-to-cart-btn hover-scale"
                                                >
                                                    Add to Bag
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Ad Zone - Hidden on mobile */}
                    <div style={{ display: 'none' }} className="sidebar-ad-desktop">
                        <AdPlacementZone
                            type="sidebar"
                            config={adConfig.collection.sidebarAd}
                            zoneName="Collection Sidebar Ad"
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </>
    )
}