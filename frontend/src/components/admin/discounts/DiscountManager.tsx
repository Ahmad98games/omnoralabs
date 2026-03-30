import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Ticket, Plus, Trash2, Users } from 'lucide-react';

interface Discount {
    id: string;
    code: string;
    type: string;
    value: number;
    usage_count: number;
    usage_limit: number | null;
    is_active: boolean;
    ends_at: string | null;
}

export const DiscountManager: React.FC = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newDiscount, setNewDiscount] = useState({
        code: '', type: 'percentage', value: 10, minimum_order_cents: 0, 
        usage_limit: null as number | null, begins_at: new Date().toISOString()
    });

    const reloadDiscounts = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('discounts')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!error && data) setDiscounts(data as Discount[]);
        } catch (err) {
            console.error('[DiscountManager] reloadDiscounts failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (mounted) await reloadDiscounts(false);
        };
        init();
        return () => { mounted = false; };
    }, [reloadDiscounts]);

    const handleCreate = async () => {
        const { error } = await supabase
            .from('discounts')
            .insert({ ...newDiscount });
        if (!error) {
            setIsCreating(false);
            reloadDiscounts();
        }
    };

    const toggleStatus = async (id: string, current: boolean) => {
        await supabase.from('discounts').update({ is_active: !current }).eq('id', id);
        reloadDiscounts();
    };

    const InputStyle = { 
        width: '100%', padding: '10px 12px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 8, color: '#fff', fontSize: '13px', outline: 'none' 
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Discounts</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Manage promotional codes and coupons</p>
                </div>
                {!isCreating && (
                    <button type="button" onClick={() => setIsCreating(true)} style={{ padding: '10px 20px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} /> Create Discount
                    </button>
                )}
            </div>

            {isCreating && (
                <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, padding: 32, marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>New Discount Code</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Discount Code</label>
                            <input placeholder="e.g. SUMMERSALE" value={newDiscount.code} onChange={e => setNewDiscount({...newDiscount, code: e.target.value.toUpperCase()})} style={InputStyle} />
                        </div>
                        <div>
                             <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Type</label>
                             <select value={newDiscount.type} onChange={e => setNewDiscount({...newDiscount, type: e.target.value})} style={InputStyle}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed_amount">Fixed Amount ($)</option>
                                <option value="free_shipping">Free Shipping</option>
                             </select>
                        </div>
                        <div>
                             <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Value</label>
                             <input type="number" value={newDiscount.value} onChange={e => setNewDiscount({...newDiscount, value: Number(e.target.value)})} style={InputStyle} />
                        </div>
                         <div>
                             <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Min Purchase Amount ($)</label>
                             <input type="number" value={newDiscount.minimum_order_cents / 100} onChange={e => setNewDiscount({...newDiscount, minimum_order_cents: Number(e.target.value) * 100})} style={InputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#71717a', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button type="button" onClick={handleCreate} style={{ padding: '10px 24px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Discount</button>
                    </div>
                </div>
            )}

            <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#09090b', borderBottom: '1px solid #27272a' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>CODE</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>TYPE</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>USAGE</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>EXPIRY</th>
                            <th style={{ padding: '16px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Syncing promotion engine...</td></tr>
                        ) : discounts.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>No discounts configured</td></tr>
                        ) : discounts.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid #27272a' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Ticket size={16} color="#FF6B35" />
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{d.code}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => toggleStatus(d.id, d.is_active)}
                                        style={{ 
                                            padding: '4px 12px', borderRadius: 100, fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer',
                                            background: d.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: d.is_active ? '#22c55e' : '#ef4444'
                                        }}
                                    >
                                        {d.is_active ? 'ACTIVE' : 'DISABLED'}
                                    </button>
                                </td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#fff' }}>
                                    {d.type === 'percentage' ? `${d.value}% Off` : `$${d.value} Off`}
                                </td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#fff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Users size={14} color="#71717a" />
                                        {d.usage_count} used {d.usage_limit ? `/ ${d.usage_limit}` : ''}
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#71717a' }}>
                                    {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : 'Never'}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <button type="button" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};