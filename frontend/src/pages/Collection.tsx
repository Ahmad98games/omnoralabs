import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, ShoppingBag, WifiOff, PackageOpen } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BuilderProvider } from '../context/BuilderContext';
// import SovereignWidget from '../components/cms/SovereignWidget';
import '../styles/collection.css';
import { transformProductList, IGSGProduct as IProduct } from '../utils/productTransformer';
import { ROUTES } from '../routes';

// Types
// Hardened Data Contract
// Hardened Data Contract moved to productTransformer

const BRAND_PLACEHOLDER = '/images/placeholder_omnora.png';

const CATEGORIES = [
    { id: 'all', name: 'Universal Registry' },
    { id: 'digital', name: 'Digital Nodes' },
    { id: 'modular', name: 'Modular Components' },
    { id: 'hardware', name: 'Industrial Hardware' },
    { id: 'protocol', name: 'System Protocols' },
];

const PRICE_RANGES = [
    { id: 'all', name: 'All Prices' },
    { id: 'under-100', name: 'Under 100 Credits' },
    { id: '100-500', name: '100 - 500 Credits' },
    { id: '500-1000', name: '500 - 1,000 Credits' },
    { id: 'over-1000', name: 'Over 1,000 Credits' },
];

export default function Collection() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [loadingLegacy, setLoadingLegacy] = useState(true);
    const [errorLegacy, setErrorLegacy] = useState<{ message: string; code?: string } | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [siteContent, setSiteContent] = useState<any>(null);
    const { updateSellerStyles } = useTheme();

    const { showToast } = useToast();

    const activeCategory = searchParams.get('category') || 'all';
    const activeSort = searchParams.get('sort') || 'newest';
    const activePriceRange = searchParams.get('priceRange') || 'all';

    // ─── Phase 49: Catalog RAM Caching ──────────────────────────────────────
    const { 
        data: fetchedProducts = [], 
        isLoading: productsLoading,
        error: productsError
    } = useQuery({
        queryKey: ['products', 'catalog'],
        queryFn: async () => {
            const res = await client.get('/products');
            const data = res.data?.data || res.data?.products || res.data || [];
            return Array.isArray(data) ? data : [];
        },
        staleTime: 60 * 1000, 
    });

    const { data: cmsData } = useQuery({
        queryKey: ['storefront', 'global'],
        queryFn: async () => {
            const { data } = await client.get('/cms/content');
            return data;
        },
        staleTime: 60 * 1000,
    });

    // ─── Phase 49: Catalog RAM Caching ──────────────────────────────────────
    const products = useMemo(() => transformProductList(fetchedProducts), [fetchedProducts]);

    useEffect(() => {
        if (cmsData?.success && cmsData?.content) {
            setSiteContent(cmsData.content);
            if (cmsData.content.globalStyles) updateSellerStyles(cmsData.content.globalStyles);
        }
    }, [cmsData, updateSellerStyles]);

    // Derived states from Query
    const loading = productsLoading;
    const errorState = productsError ? { 
        message: (productsError as any).message,
        code: (productsError as any).code || 'FETCH_ERROR' 
    } : null;

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (activeCategory !== 'all') {
            result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
        }

        // Filter by price
        if (activePriceRange !== 'all') {
            result = result.filter(p => {
                if (activePriceRange === 'under-100') return p.price < 100;
                if (activePriceRange === '100-500') return p.price >= 100 && p.price <= 500;
                if (activePriceRange === '500-1000') return p.price >= 500 && p.price <= 1000;
                if (activePriceRange === 'over-1000') return p.price > 1000;
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

    const handleAddToCart = (e: React.MouseEvent, product: IProduct) => {
        e.preventDefault();
        e.stopPropagation();
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i: any) => i.id === product.id);
        if (existing) existing.quantity += 1;
        else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('carexport default function Collection() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { siteContent } = useOmnora();
    const { showToast } = useToast();

    const activeCategory = searchParams.get('category') || 'all';
    const activeSort = searchParams.get('sort') || 'newest';
    const activePriceRange = searchParams.get('priceRange') || 'all';

    const { 
        data: fetchedProducts = [], 
        isLoading: loading,
        error: productsError
    } = useQuery({
        queryKey: ['products', 'catalog'],
        queryFn: async () => {
            const res = await client.get('/products');
            const data = res.data?.data || res.data?.products || res.data || [];
            return Array.isArray(data) ? data : [];
        },
        staleTime: 60 * 1000, 
    });

    const products = useMemo(() => transformProductList(fetchedProducts), [fetchedProducts]);

    const filteredProducts = useMemo(() => {
        let result = [...products];
        if (activeCategory !== 'all') {
            result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
        }
        if (activePriceRange !== 'all') {
            result = result.filter(p => {
                if (activePriceRange === 'under-100') return p.price < 100;
                if (activePriceRange === '100-500') return p.price >= 100 && p.price <= 500;
                if (activePriceRange === '500-1000') return p.price >= 500 && p.price <= 1000;
                if (activePriceRange === 'over-1000') return p.price > 1000;
                return true;
            });
        }
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

    const handleAddToCart = (e: React.MouseEvent, product: IProduct) => {
        e.preventDefault();
        e.stopPropagation();
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i: any) => i.id === product.id);
        if (existing) existing.quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast(`${product.name} Added to Queue`, 'success');
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 font-sans pt-24">
            {/* 🏗️ CATALOGUE HEADER */}
            <header className="relative py-20 border-b border-white/5 bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent opacity-50" />
                <div className="container relative z-10 px-6">
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/40 block mb-4">The Kernel Registry</span>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">Active Catalogue</h1>
                    <p className="text-white/20 text-sm font-medium tracking-tight italic">Universal Index of Materialized Entities</p>
                </div>
            </header>

            <div className="container px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* 📂 INDUSTRIAL SIDEBAR (Task 3.2) */}
                    <aside className="w-full lg:w-64 space-y-12 shrink-0">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30 border-b border-white/5 pb-2">Registry Groups</h3>
                            <div className="flex flex-col gap-1">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => updateFilter('category', cat.id)}
                                        className={`text-left py-2 px-3 text-sm font-bold tracking-tight transition-all duration-300 border-l-2 ${activeCategory === cat.id ? 'border-white text-white bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30 border-b border-white/5 pb-2">Price Range</h3>
                            <div className="flex flex-col gap-1">
                                {PRICE_RANGES.map(range => (
                                    <button
                                        key={range.id}
                                        onClick={() => updateFilter('priceRange', range.id)}
                                        className={`text-left py-2 px-3 text-sm font-bold tracking-tight transition-all duration-300 border-l-2 ${activePriceRange === range.id ? 'border-white text-white bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'}`}
                                    >
                                        {range.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* 📦 CONTENT GRID */}
                    <main className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                            <div className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">
                                {filteredProducts.length} Nodes Registered
                            </div>
                            <select
                                value={activeSort}
                                onChange={(e) => updateFilter('sort', e.target.value)}
                                className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <option value="newest" className="bg-[#050505]">Latest Releases</option>
                                <option value="price-low" className="bg-[#050505]">Credits: Low to High</option>
                                <option value="price-high" className="bg-[#050505]">Credits: High to Low</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[3/4] bg-white/[0.02] animate-pulse border border-white/5" />
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="py-40 text-center border border-dashed border-white/10">
                                <PackageOpen size={48} className="mx-auto text-white/10 mb-6" />
                                <h2 className="text-xl font-black uppercase tracking-tight mb-2">No nodes found</h2>
                                <p className="text-white/20 text-sm mb-8">Try adjusting your registry filters.</p>
                                <button onClick={() => setSearchParams({})} className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest">Reset Registry</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5 border border-white/5 overflow-hidden">
                                {filteredProducts.map(product => (
                                    <Link 
                                        to={`/product/${product.id}`} 
                                        key={product.id} 
                                        className="group bg-[#000000] relative aspect-[3/4] overflow-hidden flex flex-col p-6 transition-colors hover:bg-white/[0.02]"
                                    >
                                        <div className="flex-1 relative mb-6 overflow-hidden">
                                            <img
                                                src={product.image || BRAND_PLACEHOLDER}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100"
                                            />
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className="absolute bottom-4 right-4 p-3 bg-white text-black opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                            >
                                                <ShoppingBag size={18} />
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-white/20">{product.category || 'Entity'}</div>
                                            <h3 className="text-sm font-black uppercase tracking-tighter truncate">{product.name}</h3>
                                            <div className="text-xs font-medium text-white/40 tabular-nums">
                                                {product.price ? `${product.price.toLocaleString()} Credits` : 'Quote Required'}
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
</main>
                    </div>
                </div>

                {/* <SovereignWidget /> */}
            </div>
        </BuilderProvider>
    );
}
