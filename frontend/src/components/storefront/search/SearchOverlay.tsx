import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Search, X, Layers, ChevronRight, Loader2 } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    status: string;
    featured_image?: string | null;
    price: number;
    type?: string;
}

interface Collection {
    id: string;
    title: string;
}

export const SearchOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ products: Product[], collections: Collection[] }>({ products: [], collections: [] });
    const [loading, setLoading] = useState(false);

    const executeSearch = React.useCallback(async () => {
        setLoading(true);
        
        // 🛡️ INDUSTRIAL SEARCH (Task 2.7)
        // Uses Supabase Full-Text Search on titles and descriptions
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .textSearch('title_description', query, { config: 'english' })
            .limit(5);

        const { data: collections } = await supabase
            .from('collections')
            .select('*')
            .textSearch('title', query)
            .limit(3);

        setResults({ products: (products as unknown as Product[]) || [], collections: (collections as unknown as Collection[]) || [] });
        setLoading(false);
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) executeSearch();
            else setResults({ products: [], collections: [] });
        }, 300); // 300ms Debounce

        return () => clearTimeout(timer);
    }, [query, executeSearch]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s' }}>
            <div style={{ maxWidth: 800, margin: '140px auto 0', padding: '0 20px' }}>
                <div style={{ position: 'relative', marginBottom: 60 }}>
                    <Search style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#FF6B35' }} size={24} />
                    <input 
                        autoFocus
                        placeholder="Search products, collections, or blog posts..." 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ 
                            width: '100%', padding: '24px 72px', background: '#131316', border: '1px solid #27272a', 
                            borderRadius: 16, color: '#fff', fontSize: 20, outline: 'none', fontWeight: 600,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }} 
                    />
                    {loading && <Loader2 style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} className="animate-spin" size={24} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 60 }}>
                    {/* Products Listing */}
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Products</h3>
                        {results.products.length === 0 && !loading && <p style={{ color: '#27272a', fontSize: 14 }}>Try searching for &quot;Nike&quot; or &quot;Summer&quot;</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {results.products.map(p => (
                                <div key={p.id} style={{ display: 'flex', gap: 20, alignItems: 'center', cursor: 'pointer', group: 'true' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 12, background: '#1c1c22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{p.title}</div>
                                        <div style={{ fontSize: 12, color: '#71717a' }}>{p.status} • Starting from $99</div>
                                    </div>
                                    <ChevronRight size={18} color="#27272a" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Collections Listing */}
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Collections</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {results.collections.map(c => (
                                <div key={c.id} style={{ padding: '12px 20px', background: '#131316', border: '1px solid #27272a', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.title}</span>
                                    <Layers size={14} color="#71717a" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <button onClick={onClose} style={{ position: 'fixed', top: 40, right: 40, background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={32} />
            </button>
        </div>
    );
};
