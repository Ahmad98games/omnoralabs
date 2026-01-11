import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client, { trackEvent } from '../api/client';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, Filter, ChevronDown, WifiOff, PackageOpen } from 'lucide-react';
import SmartImage from '../components/SmartImage';
import './OmnoraCollection.css';

// Types
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
type SortOption = 'default' | 'new' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

// --- SUB-COMPONENT: Product Card ---
const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void }) => (
  <article className="card-magnum animate-fade-in-up">
    <Link to={`/product/${product._id}`} className="card-img-box">
      <SmartImage
        src={product.image}
        alt={product.name}
        className="card-img"
        aspectRatio="3/4" // Locks the ratio to prevent layout shift
        priority={false}
      />

      <div className="card-badges">
        {product.isNew && <span className="badge-neon">NEW ARRIVAL</span>}
        {product.isFeatured && <span className="badge-neon badge-gold">FEATURED</span>}
      </div>

      {/* Desktop Overlay */}
      <div className="card-overlay">
        <button
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
          className="btn-quick-add"
        >
          ADD TO BAG
        </button>
      </div>
    </Link>

    <div className="card-details">
      <div className="card-meta">
        <Link to={`/product/${product._id}`} className="card-title">
          {product.name}
        </Link>
        <span className="card-price">PKR {product.price.toLocaleString()}</span>
      </div>
      
      {product.description && (
        <p className="card-desc">{product.description}</p>
      )}
    </div>

    {/* Mobile Action */}
    <div className="mobile-action">
        <button onClick={() => onAddToCart(product)} className="btn-mobile-add">
            <ShoppingBag size={16} /> ADD
        </button>
    </div>
  </article>
);

// --- SUB-COMPONENT: Skeleton Loader ---
// Matches the ProductCard structure for seamless loading transition
const CollectionSkeleton = () => (
    <div className="card-magnum skeleton-card">
        <div className="skeleton-box img-ratio"></div>
        <div className="card-details">
            <div className="skeleton-box text-line"></div>
            <div className="skeleton-box text-line short"></div>
        </div>
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
  
  // Filters State
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');

  const { showToast } = useToast();
  useScrollReveal();

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setLoading(true);
      setError(null);
      
      try {
        const query = searchParams.get('q');
        const category = searchParams.get('category');
        let response;

        // Determine Endpoint
        if (query) {
          response = await client.get('/products/search', { params: { q: query } });
        } else if (category) {
          response = await client.get(`/products/category/${encodeURIComponent(category)}`);
        } else {
          response = await client.get('/products');
        }

        if (!isMounted) return;

        // Data Normalization
        let data = response.data || [];
        if (data.data && Array.isArray(data.data)) data = data.data;
        else if (data.products && Array.isArray(data.products)) data = data.products; // Handle { products: [...] } format
        
        const fetchedData: Product[] = Array.isArray(data) ? data : [];

        // --- Client-Side Processing ---
        // 1. Filtering
        const filtered = fetchedData.filter((p) => {
            if (priceRange === 'under-500') return p.price < 500;
            if (priceRange === '500-1000') return p.price >= 500 && p.price <= 1000;
            if (priceRange === 'over-1000') return p.price > 1000;
            return true;
        });

        // 2. Sorting
        const sorted = [...filtered];
        switch (sortBy) {
            case 'price-low': sorted.sort((a, b) => a.price - b.price); break;
            case 'price-high': sorted.sort((a, b) => b.price - a.price); break;
            case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'new': sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
            default: break; // Default (Featured logic typically handled by backend or default order)
        }

        setProducts(sorted);
      } catch (e) {
        console.error('Fetch error:', e);
        // Fallback Logic could go here, or just show error state
        setError('Unable to retrieve collection data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => { isMounted = false; };
  }, [searchParams, sortBy, priceRange]);

  const handleAddToCart = (product: Product) => {
    try {
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
          quantity: 1
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated')); // Update Navbar Badge

      trackEvent({
        type: 'add_to_cart',
        sessionId: localStorage.getItem('sid') || 'guest',
        payload: { productId: product._id, price: product.price }
      });

      showToast(`${product.name} added to bag`, 'success');
    } catch (error) {
      showToast('System error. Please try again.', 'error');
    }
  };

  const activeFilterLabel = searchParams.get('q') 
    ? `Results for "${searchParams.get('q')}"` 
    : searchParams.get('category') || 'Full Collection';

  return (
    <div className="collection-page">
      <div className="noise-layer" />

      {/* 1. HERO */}
      <header className="collection-hero">
        <div className="hero-bg">
          {/* Use a high-res texture or product shot here */}
          <img src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2940&auto=format&fit=crop" alt="Omnora Collection" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span>ARCHIVE</span>
            {activeFilterLabel}
          </h1>
          <p className="hero-subtitle">
            Hand-crafted artifacts for the modern sanctuary.
          </p>
        </div>
      </header>

      <div className="container">
        
        {/* 2. TOOLBAR */}
        <div className="toolbar-sticky">
          <div className="toolbar-inner">
            <div className="toolbar-count">
              {products.length} <span className="text-muted">ARTIFACTS FOUND</span>
            </div>

            <div className="toolbar-controls">
              <div className="select-wrapper">
                <Filter size={14} className="select-icon" />
                <select 
                    value={priceRange} 
                    onChange={(e) => setPriceRange(e.target.value as PriceRange)}
                    className="magnum-select"
                >
                  <option value="all">FILTER: ALL PRICES</option>
                  <option value="under-500">UNDER PKR 500</option>
                  <option value="500-1000">PKR 500 - 1,000</option>
                  <option value="over-1000">OVER PKR 1,000</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>

              <div className="select-wrapper">
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="magnum-select"
                >
                  <option value="default">SORT: FEATURED</option>
                  <option value="new">NEW ARRIVALS</option>
                  <option value="price-low">PRICE: LOW TO HIGH</option>
                  <option value="price-high">PRICE: HIGH TO LOW</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. GRID */}
        <main className="product-grid-magnum">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <CollectionSkeleton key={i} />)
          ) : error ? (
            <div className="empty-state-magnum">
              <WifiOff size={48} />
              <h3>Signal Lost</h3>
              <p>Unable to retrieve artifacts from the archive.</p>
              <button onClick={() => window.location.reload()} className="btn-retry">RECONNECT</button>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-magnum">
              <PackageOpen size={48} />
              <h3>Archive Empty</h3>
              <p>No artifacts match your current filter criteria.</p>
              <button onClick={() => setPriceRange('all')} className="btn-retry">RESET FILTERS</button>
            </div>
          ) : (
            products.map(product => (
              <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
            ))
          )}
        </main>

      </div>
    </div>
  );
}