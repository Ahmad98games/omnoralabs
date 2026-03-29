import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search as SearchIcon, Package, FileText, ArrowRight, Loader2 } from 'lucide-react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Search: Unified Commerce & Content Search
 * 
 * DESIGN:
 * - Debounced input (300ms).
 * - Supabase Full-Text Search (FT Search).
 * - Mixed Results: Products + Blog Posts.
 * - Absolute Black (#000000) industrial aesthetic.
 */
interface ProductResult {
    id: string;
    title: string;
    handle: string;
    featured_image: string | null;
    base_price: number;
}

interface PostResult {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
}

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<{ products: ProductResult[], posts: PostResult[] }>({ products: [], posts: [] });
    const [loading, setLoading] = useState(false);

    // ── Full-Text Search Engine ───────────────────────────────────────────
    const executeSearch = useCallback(async (text: string) => {
        // 🔒 RESILIENCE: Only search if query is substantial (3+ chars)
        if (!text.trim() || text.trim().length < 3) {
            setResults({ products: [], posts: [] });
            return;
        }

        setLoading(true);
        try {
            // 1. Search Products (using the GIN index created in migration)
            const { data: products } = await supabase
                .from('products')
                .select('id, title, handle, featured_image, base_price')
                .textSearch('title_description_search', text, {
                    type: 'websearch',
                    config: 'english'
                })
                .limit(10);

            // 2. Search Blog Posts
            const { data: posts } = await supabase
                .from('blog_posts')
                .select('id, title, slug, excerpt')
                .textSearch('title_content_search', text, {
                    type: 'websearch',
                    config: 'english'
                })
                .limit(5);

            setResults({ 
                products: products || [], 
                posts: posts || [] 
            });
        } catch (error) {
            console.error('[Search] Engine Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Debounce Logic ────────────────────────────────────────────────────
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== query) {
                setSearchParams({ q: searchTerm }, { replace: true });
            }
            executeSearch(searchTerm);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm, query, setSearchParams, executeSearch]);

    return (
        <div className="min-h-screen bg-[#000000] text-white px-6 py-20">
            <div className="max-w-4xl mx-auto">
                {/* 🔍 Search Input Shell */}
                <div className="relative group">
                    <SearchIcon className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-indigo-500 animate-pulse' : 'text-white/20 group-focus-within:text-white'}`} size={24} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="SEARCH PRODUCTS, COLLECTIONS, STORIES..."
                        className="w-full bg-[#050505] border border-white/10 rounded-full py-6 pl-16 pr-8 text-xl font-medium tracking-tight focus:outline-none focus:border-white/40 transition-all placeholder:text-white/10"
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-white/20" size={20} />
                        </div>
                    )}
                </div>

                {/* 📊 Results Grid */}
                <div className="mt-20 space-y-24">
                    
                    {/* 🦴 Industrial Skeletons */}
                    {loading && results.products.length === 0 && (
                        <SkeletonTheme baseColor="#080808" highlightColor="#111111">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-500">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-6 p-4 bg-[#050505] border border-white/5 rounded-2xl">
                                        <Skeleton height={96} width={96} border-radius={8} />
                                        <div className="flex flex-col justify-center space-y-2 flex-1">
                                            <Skeleton height={20} width="60%" />
                                            <Skeleton height={14} width="25%" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SkeletonTheme>
                    )}

                    {/* Products Section */}
                    {results.products.length > 0 && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-3 mb-10 opacity-40">
                                <Package size={16} />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em]">Products (<span className="tabular-nums">{results.products.length}</span>)</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {results.products.map(product => (
                                    <Link 
                                        key={product.id}
                                        to={`/product/${product.handle}`}
                                        className="group flex gap-6 p-4 bg-[#050505] border border-white/5 rounded-2xl hover:border-white/20 transition-all"
                                    >
                                        <div className="w-24 h-24 bg-[#080808] rounded-lg overflow-hidden flex-shrink-0">
                                            {product.featured_image && (
                                                <img src={product.featured_image} alt={product.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="text-lg font-bold tracking-tight mb-1">{product.title}</h3>
                                            <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
                                                <span className="tabular-nums">${Number(product.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </p>
                                        </div>
                                        <ArrowRight className="ml-auto self-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-indigo-400" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Stories Section */}
                    {results.posts.length > 0 && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="flex items-center gap-3 mb-10 opacity-40">
                                <FileText size={16} />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em]">Stories ({results.posts.length})</h2>
                            </div>
                            <div className="space-y-4">
                                {results.posts.map(post => (
                                    <Link 
                                        key={post.id}
                                        to={`/blog/${post.slug}`}
                                        className="group block p-8 bg-[#050505] border border-white/5 rounded-2xl hover:border-white/20 transition-all"
                                    >
                                        <h3 className="text-2xl font-black tracking-tighter mb-4 group-hover:text-indigo-400 transition-colors uppercase italic">{post.title}</h3>
                                        <p className="text-white/40 leading-relaxed line-clamp-2 mb-6">{post.excerpt}</p>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                            Read Story <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Empty State */}
                    {searchTerm && !loading && results.products.length === 0 && results.posts.length === 0 && (
                        <div className="text-center py-40 animate-in zoom-in-95 duration-500">
                            <div className="text-white/5 font-black text-8xl mb-8 tracking-tighter select-none">NULL</div>
                            <p className="text-white/20 text-lg uppercase tracking-widest font-bold">No matches found in the industrial archive</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
