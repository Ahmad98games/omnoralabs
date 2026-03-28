import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Package, Plus, Search, Filter, MoreHorizontal, Archive, Trash2, CheckCircle, ExternalLink } from 'lucide-react';

export const AdminProductManager: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

    useEffect(() => {
        fetchProducts();
    }, [statusFilter]);

    const fetchProducts = async () => {
        setLoading(true);
        let query = supabase
            .from('products')
            .select('*, merchants(store_name)')
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error) setProducts(data || []);
        setLoading(false);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const bulkUpdateStatus = async (status: string) => {
        if (selectedIds.length === 0) return;
        const { error } = await supabase
            .from('products')
            .update({ status })
            .in('id', selectedIds);
        
        if (!error) {
            fetchProducts();
            setSelectedIds([]);
        }
    };

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Products</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Manage your catalog and inventory</p>
                </div>
                <button 
                    style={{ 
                        padding: '10px 20px', background: '#FF6B35', color: '#fff', 
                        borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}
                >
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* Toolbar */}
            <div style={{ 
                background: '#131316', border: '1px solid #27272a', borderRadius: 12, 
                padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center',
                marginBottom: 20
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="#71717a" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', padding: '10px 12px 10px 40px', background: '#09090b',
                            border: '1px solid #27272a', borderRadius: 8, color: '#fff', fontSize: 13
                        }}
                    />
                </div>
                
                <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    style={{ background: '#09090b', border: '1px solid #27272a', padding: '10px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>

                {selectedIds.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, borderLeft: '1px solid #27272a', paddingLeft: 16 }}>
                        <button onClick={() => bulkUpdateStatus('active')} style={{ padding: '8px 12px', background: '#27272a', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer' }}>Activate</button>
                        <button onClick={() => bulkUpdateStatus('archived')} style={{ padding: '8px 12px', background: '#27272a', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer' }}>Archive</button>
                        <button style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                    </div>
                )}
            </div>

            {/* List */}
            <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#09090b', borderBottom: '1px solid #27272a' }}>
                        <tr>
                            <th style={{ padding: '16px', width: 40 }}>
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => setSelectedIds(e.target.checked ? filteredProducts.map(p => p.id) : [])}
                                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                                />
                            </th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>PRODUCT</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>INVENTORY</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>PRICE</th>
                            <th style={{ padding: '16px', width: 40 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Loading products...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>No products found</td></tr>
                        ) : filteredProducts.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #27272a', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(p.id)}
                                        onChange={() => toggleSelect(p.id)}
                                    />
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#1c1c22', flexShrink: 0, overflow: 'hidden' }}>
                                            {p.images?.[0] && <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.title}</div>
                                            <div style={{ fontSize: 12, color: '#71717a' }}>{p.sku || 'No SKU'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                                        background: p.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : p.status === 'archived' ? 'rgba(239, 68, 68, 0.1)' : '#27272a',
                                        color: p.status === 'active' ? '#22c55e' : p.status === 'archived' ? '#ef4444' : '#a1a1aa'
                                    }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: 13, color: p.inventory_count <= p.low_stock_threshold ? '#ef4444' : '#fff' }}>
                                        {p.inventory_count} in stock
                                    </div>
                                    {p.inventory_count <= p.low_stock_threshold && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>LOW STOCK</div>}
                                </td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#fff' }}>
                                    ${p.price}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <button style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><MoreHorizontal size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
