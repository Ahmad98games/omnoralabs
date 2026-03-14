import React, { useState, useEffect, useMemo } from 'react';
import { useNodeSelector } from '../../../hooks/useNodeSelector';
import { dispatcher } from '../../../platform/core/Dispatcher';
import { databaseClient } from '../../../platform/core/DatabaseClient';
import type { Product } from '../../../context/StorefrontContext';
import { Package, Search, Loader2, Check, Star } from 'lucide-react';

const S = {
    section: {
        marginBottom: 20,
        padding: '14px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.04)',
    } as React.CSSProperties,
    label: {
        fontSize: 10, color: '#71717a', fontWeight: 700,
        display: 'block', marginBottom: 8, textTransform: 'uppercase',
        letterSpacing: '0.05em',
    } as React.CSSProperties,
    input: {
        width: '100%', padding: '7px 10px',
        background: '#13131a', border: '1px solid #2a2a3a',
        borderRadius: 6, color: '#e4e4e7', fontSize: 12,
        outline: 'none', marginBottom: 10
    } as React.CSSProperties,
    productCard: (selected: boolean) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px', borderRadius: 8, cursor: 'pointer',
        background: selected ? 'rgba(212,175,55,0.1)' : 'transparent',
        border: `1px solid ${selected ? '#D4AF37' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s'
    })
};

export const FeaturedProductEditor: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const node = useNodeSelector(nodeId, (n) => ({ props: n.props }));
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const tenantId = (window as any).__OMNORA_TENANT_ID__ || 'default_tenant';
                const data = await databaseClient.getProductsByMerchant(tenantId);
                setProducts(data);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = useMemo(() => 
        products.filter(p => p.title.toLowerCase().includes(query.toLowerCase())),
    [products, query]);

    if (!node) return null;

    const currentId = node.props?.productId;

    return (
        <div className="space-y-4">
            <div style={S.section}>
                <div className="flex items-center gap-2 mb-4 text-[var(--accent-gold)]">
                    <Star size={12} fill="currentColor" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Featured Binding</span>
                </div>

                <label style={S.label}>Select Product to Feature</label>
                <div className="relative">
                    <Search size={12} className="absolute left-3 top-2.5 text-gray-600" />
                    <input 
                        style={{ ...S.input, paddingLeft: '32px' }}
                        placeholder="Search catalog..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-10 text-center opacity-30 text-[10px]">SYNCING CATALOG...</div>
                    ) : filtered.map(p => (
                        <div 
                            key={p.id}
                            style={S.productCard(currentId === p.id)}
                            onClick={() => {
                                dispatcher.dispatch({
                                    nodeId,
                                    path: 'props.productId',
                                    value: currentId === p.id ? null : p.id,
                                    type: 'visual',
                                    source: 'editor'
                                });
                            }}
                        >
                            <img src={p.featured_image} alt="" className="w-10 h-10 rounded object-cover bg-black" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-white truncate">{p.title}</div>
                                <div className="text-[9px] text-gray-500">${p.price.toLocaleString()}</div>
                            </div>
                            {currentId === p.id && <Check size={14} className="text-[var(--accent-gold)]" />}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-[10px] text-blue-400 leading-relaxed">
                    <b>Pro Tip:</b> Binding a product will automatically sync the Title, Description, and Image from your live inventory.
                </p>
            </div>
        </div>
    );
};

export default FeaturedProductEditor;
