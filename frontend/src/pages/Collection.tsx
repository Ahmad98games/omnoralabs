import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, ShoppingBag, WifiOff, PackageOpen } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/collection.css';

// Types
// Hardened Data Contract
interface IGSGProduct {
    _id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
    isNew?: boolean;
    stock?: number;
}

const BRAND_PLACEHOLDER = '/images/placeholder_gsg.png';

const CATEGORIES = [
    { id: 'all', name: 'All Collection' },
    { id: 'unstitched', name: 'Unstitched' },
    { id: 'ready-to-wear', name: 'Ready-to-Wear' },
    { id: 'formal', name: 'Formal Wear' },
    { id: 'seasonal', name: 'Seasonal' },
];

const PRICE_RANGES = [
    { id: 'all', name: 'All Prices' },
    { id: 'under-2500', name: 'Under PKR 2,500' },
    { id: '2500-5000', name: 'PKR 2,500 - 5,000' },
    { id: '5000-10000', name: 'PKR 5,000 - 10,000' },
    { id: 'over-10000', name: 'Over PKR 10,000' },
];

export default function Collection() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<IGSGProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { showToast } = useToast();

    const activeCategory = searchParams.get('category') || 'all';
    const activeSort = searchParams.get('sort') || 'newest';
    const activePriceRange = searchParams.get('priceRange') || 'all';

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProducts() {
            setLoading(true);
            setError(null);
            try {
                const res = await client.get('/products', { signal: controller.signal });
                const data = res.data?.data || res.data?.products || res.data || [];
                setProducts(Array.isArray(data) ? data : []);
            } catch (err: any) {
                if (!axios.isCancel(err)) {
                    setError({
                        message: err.response?.data?.error || err.message || 'Connection failed',
                        code: err.code || (err.response ? `API_${err.response.status}` : 'NETWORK_ERROR')
                    });
                    console.error('FETCH_ERROR:', err);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
        return () => controller.abort();
    }, []);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (activeCategory !== 'all') {
            result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
        }

        // Filter by price
        if (activePriceRange !== 'all') {
            result = result.filter(p => {
                if (activePriceRange === 'under-2500') return p.price < 2500;
                if (activePriceRange === '2500-5000') return p.price >= 2500 && p.price <= 5000;
                if (activePriceRange === '5000-10000') return p.price >= 5000 && p.price <= 10000;
                if (activePriceRange === 'over-10000') return p.price > 10000;
                return true;
            });
        }

        // Sort
        if (activeSort === 'price-low') result.sort((a, b) => a.price - b.price);
        if (activeSort === 'price-high') result.sort((a, b) => b.price - a.price);
        if (activeSort === 'newest') result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

        return result;
    }, [products, activeCategory, activePriceRange, activeSort]);

    const updateFilter = (key: string, value: string) => {
        const nextParams = new URLSearchParams(searchParams);
        if (value === 'all') nextParams.delete(key);
        else nextParams.set(key, value);
        setSearchParams(nextParams);
    };

    const handleAddToCart = (e: React.MouseEvent, product: IGSGProduct) => {
        e.preventDefault();
        e.stopPropagation();
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i: any) => i.id === product._id);
        if (existing) existing.quantity += 1;
        else cart.push({ id: product._id, name: product.name, price: product.price, image: product.image, quantity: 1 });

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast(`${product.name} added to bag`, 'success');
    };

    return (
        <div className="collection-page">
            <header className="collection-hero-luxury">
                <img
                    src="/brain/267393fd-15ea-4545-93a9-82ddcad349ad/gold_she_hero_banner_1768764516155.png"
                    alt="GSG Collection"
                />
                <div className="collection-hero-overlay">
                    <span className="eyebrow text-white">THE CURATED SELECTION</span>
                    <h1 className="subtitle-serif text-white">Elegant Catalogue</h1>
                </div>
            </header>

            <div className="container">
                <div className="collection-layout">
                    {/* Desktop Sidebar */}
                    <aside className="shop-sidebar">
                        <div className="filter-group">
                            <h3 className="filter-title">Categories</h3>
                            <ul className="filter-list">
                                {CATEGORIES.map(cat => (
                                    <li key={cat.id} className="filter-item">
                                        <button
                                            onClick={() => updateFilter('category', cat.id)}
                                            className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                        >
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="filter-group">
                            <h3 className="filter-title">Price Range</h3>
                            <ul className="filter-list">
                                {PRICE_RANGES.map(range => (
                                    <li key={range.id} className="filter-item">
                                        <button
                                            onClick={() => updateFilter('priceRange', range.id)}
                                            className={`filter-btn ${activePriceRange === range.id ? 'active' : ''}`}
                                        >
                                            {range.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="shop-main">
                        <div className="collection-toolbar-lux">
                            <div className="count-label-lux font-serif italic">
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'} Found
                            </div>
                            <div className="sort-box">
                                <select
                                    value={activeSort}
                                    onChange={(e) => updateFilter('sort', e.target.value)}
                                    className="sort-select"
                                >
                                    <option value="newest">Newest Arrivals</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="product-grid">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="skeleton-card" style={{ height: '400px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="empty-state container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <WifiOff size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                                <h2>Connection Issue</h2>
                                <p style={{ color: 'red', fontWeight: 'bold' }}>{error.message}</p>
                                <p style={{ fontSize: '0.8rem', color: '#999' }}>Diagnostic Code: {error.code}</p>
                                <button onClick={() => window.location.reload()} className="btn-primary-gsg" style={{ marginTop: '1rem' }}>RETRY</button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="empty-state container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <PackageOpen size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                                <h2>No pieces found</h2>
                                <p>Try adjusting your search or filters to find what you're looking for.</p>
                                <button onClick={() => setSearchParams({})} className="btn-primary-gsg" style={{ marginTop: '1rem' }}>RESET ALL FILTERS</button>
                            </div>
                        ) : (
                            <div className="product-grid">
                                {filteredProducts.map(product => (
                                    <Link to={`/product/${product._id}`} key={product._id} className="fashion-card">
                                        <div className="card-img-wrapper">
                                            <img
                                                src={product.image || BRAND_PLACEHOLDER}
                                                alt={product.name || 'Fashion Piece'}
                                                onError={(e) => { (e.target as HTMLImageElement).src = BRAND_PLACEHOLDER; }}
                                            />
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className="quick-add-btn"
                                                style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'white', border: 'none', padding: '0.6rem', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                                            >
                                                <ShoppingBag size={18} />
                                            </button>
                                        </div>
                                        <div className="card-info-lux">
                                            <div className="card-category-lux">{product.category || 'Collection'}</div>
                                            <h3 className="card-name-lux font-serif">{product.name || 'Unlabeled Piece'}</h3>
                                            <div className="card-price-lux">
                                                {product.price ? `PKR ${product.price.toLocaleString()}` : 'Price on Request'}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
