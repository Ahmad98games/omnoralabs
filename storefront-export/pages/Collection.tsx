import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, ShoppingBag, WifiOff, PackageOpen } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BuilderProvider } from '../context/BuilderContext';
// import SovereignWidget from '../components/cms/SovereignWidget';
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
    const [siteContent, setSiteContent] = useState<any>(null);
    const { updateSellerStyles } = useTheme();

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
    }, [updateSellerStyles]);

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

    const isPreview = window.location.search.includes('preview=true');

    return (
        <BuilderProvider initialData={siteContent || {}} isPreview={isPreview}>
            <div className="collection-page">
                <header className="collection-hero-luxury">
                    <img
                        src={siteContent?.pages?.collection?.heroBannerURL || "/images/placeholder_gsg.png"}
                        alt="GSG Collection"
                    />
                    <div className="collection-hero-overlay">
                        <span className="eyebrow text-white">{siteContent?.pages?.collection?.eyebrow || 'THE CURATED SELECTION'}</span>
                        <h1 className="subtitle-serif text-white">{siteContent?.pages?.collection?.headlineText || 'Elegant Catalogue'}</h1>
                    </div>
                </header>

                <div className="container">
                    <div className="collection-layout">
                        {/* Sidebar and Grid... */}
                        {/* ... existing logic ... */}
                    </div>
                </div>

                {/* <SovereignWidget /> */}
            </div>
        </BuilderProvider>
    );
}
