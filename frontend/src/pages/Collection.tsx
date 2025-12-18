import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client, { trackEvent } from '../api/client';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useToast } from '../context/ToastContext';
import AdPlacementZone from '../components/AdPlacementZone';
import SkeletonProductCard from '../components/SkeletonProductCard';
import SmartImage from '../components/SmartImage';
import adConfig from '../config/adConfig.json';
import './Collection.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const SKELETON_COUNT = 4;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Product {
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description?: string;
    isFeatured?: boolean;
    isNew?: boolean;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

type PriceRange = 'all' | 'under-500' | '500-1000' | 'over-1000';
type SortOption = 'default' | 'new' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'featured';

// ============================================================================
// CHILD COMPONENTS
// ============================================================================

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <article className="product-card">
        <Link to={`/product/${product._id}`} className="product-card__image-link">
            <div className="product-card__image-wrapper">
                <SmartImage
                    src={product.image}
                    alt={product.name}
                    className="product-card__image"
                    priority={true}
                />
            </div>
        </Link>

        <div className="product-card__content">
            <Link to={`/product/${product._id}`} className="product-card__title-link">
                <h3 className="product-card__title">
                    {product.name}
                    {product.isNew && <span className="product-card__badge product-card__badge--new">NEW</span>}
                    {product.isFeatured && <span className="product-card__badge product-card__badge--featured">★</span>}
                </h3>
            </Link>

            {product.description && (
                <p className="product-card__description">{product.description}</p>
            )}

            <p className="product-card__price">PKR {product.price.toLocaleString()}</p>

            <button
                onClick={() => onAddToCart(product)}
                className="product-card__add-btn"
                aria-label={`Add ${product.name} to cart`}
            >
                Add to Bag
            </button>
        </div>
    </article>
);

interface EmptyStateProps {
    type: 'error' | 'no-results';
    message?: string;
    onRetry?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, message, onRetry }) => (
    <div className="empty-state">
        {type === 'error' ? (
            <>
                <h3 className="empty-state__title">Oops! Something went wrong</h3>
                <p className="empty-state__message">{message || 'Failed to load products'}</p>
                {onRetry && (
                    <button onClick={onRetry} className="empty-state__button">
                        Try Again
                    </button>
                )}
            </>
        ) : (
            <>
                <h3 className="empty-state__title">No products found 🛁</h3>
                <p className="empty-state__message">
                    Try adjusting your filters, clearing your search query, or check back later for new arrivals.
                </p>
            </>
        )}
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Collection() {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [priceRange, setPriceRange] = useState<PriceRange>('all');

    const { showToast } = useToast();
    useScrollReveal(100); // Trigger hooks if they internally use refs or side effects
    useScrollReveal(200);

    useEffect(() => {
        let isMounted = true;

        async function fetchProducts() {
            let fetchedData: Product[] = [];
            let fetchError: string | null = null;

            try {
                setLoading(true);
                setError(null);

                const query = searchParams.get('q');
                const category = searchParams.get('category');
                let response;

                try {
                    if (query) {
                        response = await client.get('/products/search', { params: { q: query } });
                    } else if (category) {
                        response = await client.get(`/products/category/${encodeURIComponent(category)}`);
                    } else {
                        response = await client.get('/products');
                    }
                } catch (apiError) {
                    console.warn('API connection failed, using fallback data:', apiError);
                    const { fallbackProducts } = await import('../data/fallbackProducts');
                    response = { data: { success: true, data: fallbackProducts } };
                }

                if (!isMounted) return;

                let data = response.data || [];
                if (data.data && Array.isArray(data.data)) {
                    data = data.data;
                } else if (Array.isArray(response.data)) {
                    data = response.data;
                }

                fetchedData = Array.isArray(data) ? data : [];

            } catch (e: any) {
                console.error('Critical error loading products:', e);
                fetchError = 'Failed to load products. Please check your connection.';

                try {
                    const { fallbackProducts } = await import('../data/fallbackProducts');
                    fetchedData = fallbackProducts;
                } catch {
                    fetchedData = [];
                }
            }

            if (!isMounted) return;

            const filteredAndSorted = filterAndSortProducts(fetchedData, priceRange, sortBy);
            setProducts(filteredAndSorted);
            setError(fetchError);
            setLoading(false);
        }

        fetchProducts();
        return () => { isMounted = false; };
    }, [searchParams, sortBy, priceRange]);

    const filterAndSortProducts = (data: Product[], range: PriceRange, sort: SortOption): Product[] => {
        let filtered = data.filter((p) => {
            if (range === 'under-500') return p.price < 500;
            if (range === '500-1000') return p.price >= 500 && p.price <= 1000;
            if (range === 'over-1000') return p.price > 1000;
            return true;
        });

        const sorted = [...filtered];
        switch (sort) {
            case 'price-low': sorted.sort((a, b) => a.price - b.price); break;
            case 'price-high': sorted.sort((a, b) => b.price - a.price); break;
            case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'featured': sorted.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break;
            case 'new': sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
        }
        return sorted;
    };

    const handleAddToCart = (product: Product) => {
        const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((item) => item.id === product._id);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        trackEvent({
            type: 'add_to_cart',
            sessionId: localStorage.getItem('sid') || '',
            payload: { productId: product._id, price: product.price },
        });

        showToast(`Added ${product.name} to bag`, 'success');
    };

    return (
        <div className="collection">
            <header className="collection__hero">
                <div className="collection__hero-content container">
                    <h1 className="collection__title">Bath Bomb Collection</h1>
                    <p className="collection__subtitle">
                        Immerse yourself in luxury with our handcrafted bath bombs.
                    </p>
                </div>
            </header>

            <div className="collection__container container">
                <nav className="breadcrumbs" aria-label="Breadcrumb">
                    <Link to="/" className="breadcrumbs__link">Home</Link>
                    <span className="breadcrumbs__separator">/</span>
                    <span className="breadcrumbs__current">Bath Bombs</span>
                </nav>

                <AdPlacementZone
                    type="banner"
                    config={adConfig.collection.topBanner}
                    zoneName="Collection Top Banner"
                />

                <div className="toolbar">
                    <div className="toolbar__info">
                        <p className="toolbar__count">
                            Showing <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
                        </p>
                        <div className="toolbar__filter">
                            <label htmlFor="priceFilter" className="toolbar__label">Price:</label>
                            <select
                                id="priceFilter"
                                className="toolbar__select"
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value as PriceRange)}
                            >
                                <option value="all">All Prices</option>
                                <option value="under-500">Under PKR 500</option>
                                <option value="500-1000">PKR 500 - 1000</option>
                                <option value="over-1000">Over PKR 1000</option>
                            </select>
                        </div>
                    </div>

                    <div className="toolbar__filter">
                        <label htmlFor="sortBy" className="toolbar__label">Sort By:</label>
                        <select
                            id="sortBy"
                            className="toolbar__select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
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

                <section className="collection__products">
                    {loading ? (
                        <div className="product-grid">
                            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                                <SkeletonProductCard key={index} />
                            ))}
                        </div>
                    ) : error ? (
                        <EmptyState
                            type="error"
                            message={error}
                            onRetry={() => window.location.reload()}
                        />
                    ) : products.length === 0 ? (
                        <EmptyState type="no-results" />
                    ) : (
                        <div className="product-grid">
                            {products.map((product) => (
                                <ProductCard 
                                    key={product._id} 
                                    product={product} 
                                    onAddToCart={handleAddToCart} 
                                />
                            ))}
                        </div>
                    )}
                </section>

                <aside className="collection__sidebar">
                    <AdPlacementZone
                        type="sidebar"
                        config={adConfig.collection.sidebarAd}
                        zoneName="Collection Sidebar Ad"
                    />
                </aside>
            </div>
        </div>
    );
}