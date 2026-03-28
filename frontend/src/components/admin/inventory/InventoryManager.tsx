import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Package, History, AlertCircle, TrendingDown, TrendingUp, Save, Search, RefreshCcw } from 'lucide-react';

export const InventoryManager: React.FC = () => {
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [adjustment, setAdjustment] = useState(0);
    const [reason, setReason] = useState('correction');
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('product_variants')
            .select('*, products(title)')
            .order('inventory_count', { ascending: true }); // Show low stock first
        if (!error) setVariants(data || []);
        setLoading(false);
    };

    const fetchLogs = async (vId: string) => {
        const { data } = await supabase
            .from('inventory_adjustments')
            .select('*')
            .eq('variant_id', vId)
            .order('created_at', { ascending: false })
            .limit(10);
        setLogs(data || []);
    };

    const handleAdjust = async () => {
        if (!selectedVariant || adjustment === 0) return;

        const newCount = selectedVariant.inventory_count + adjustment;

        // --- 🛡️ INDUSTRIAL LOG-BASED ADJUSTMENT ---
        const { error: logError } = await supabase.from('inventory_adjustments').insert({
            variant_id: selectedVariant.id,
            adjustment,
            reason,
            new_count: newCount,
            created_at: new Date().toISOString()
        });

        if (!logError) {
            const { error: updateError } = await supabase
                .from('product_variants')
                .update({ inventory_count: newCount })
                .eq('id', selectedVariant.id);
            
            if (!updateError) {
                fetchInventory();
                setSelectedVariant(null);
                setAdjustment(0);
            }
        }
    };

    const InputStyle = { 
        width: '100%', padding: '10px 12px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 8, color: '#fff', fontSize: '13px', outline: 'none' 
    };

    return (
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
            {/* Left Column: Inventory List */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Inventory</h1>
                        <p style={{ fontSize: 13, color: '#71717a' }}>Log-based stock control and audit trail</p>
                    </div>
                </div>

                <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#09090b', borderBottom: '1px solid #27272a' }}>
                            <tr>
                                <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>PRODUCT / VARIANT</th>
                                <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>SKU</th>
                                <th style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: '#71717a' }}>ON HAND</th>
                                <th style={{ padding: '16px', width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Loading inventory...</td></tr>
                            ) : variants.map(v => (
                                <tr 
                                    key={v.id} 
                                    onClick={() => { setSelectedVariant(v); fetchLogs(v.id); }}
                                    style={{ 
                                        borderBottom: '1px solid #27272a', cursor: 'pointer',
                                        background: selectedVariant?.id === v.id ? 'rgba(255, 107, 53, 0.05)' : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{v.products?.title}</div>
                                        <div style={{ fontSize: 12, color: '#71717a' }}>{v.title}</div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: 13, color: '#71717a' }}>{v.sku || 'N/A'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                                            color: v.inventory_count <= 5 ? '#ef4444' : '#fff'
                                        }}>
                                            {v.inventory_count}
                                            {v.inventory_count <= 5 && <AlertCircle size={14} />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}><RefreshCcw size={14} color="#27272a" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Column: Adjustment Panel & Logs */}
            <div style={{ position: 'sticky', top: 24, height: 'fit-content' }}>
                {selectedVariant ? (
                    <>
                        <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Adjust Inventory</h3>
                            <div style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>{selectedVariant.products?.title} - {selectedVariant.title}</div>
                            
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 11, color: '#71717a', fontWeight: 600, display: 'block', marginBottom: 8 }}>Adjustment (+/-)</label>
                                <input type="number" value={adjustment} onChange={e => setAdjustment(Number(e.target.value))} style={InputStyle} />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 11, color: '#71717a', fontWeight: 600, display: 'block', marginBottom: 8 }}>Reason</label>
                                <select value={reason} onChange={e => setReason(e.target.value)} style={InputStyle}>
                                    <option value="correction">Correction</option>
                                    <option value="received">Received</option>
                                    <option value="damaged">Damaged / Loss</option>
                                    <option value="restocked">Restocked / Return</option>
                                </select>
                            </div>

                            <button onClick={handleAdjust} style={{ width: '100%', padding: '12px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Save size={18} /> Update Stock
                            </button>
                        </div>

                        <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                <History size={16} color="#71717a" />
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Adjustment History</h3>
                            </div>
                            {logs.map(log => (
                                <div key={log.id} style={{ padding: '12px 0', borderBottom: '1px solid #1c1c22', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: log.adjustment > 0 ? '#22c55e' : '#ef4444' }}>
                                            {log.adjustment > 0 ? '+' : ''}{log.adjustment} ({log.reason})
                                        </div>
                                        <div style={{ fontSize: 10, color: '#71717a' }}>{new Date(log.created_at).toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{log.new_count}</div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ background: '#131316', border: '1px dashed #27272a', borderRadius: 12, padding: 48, textAlign: 'center', color: '#71717a' }}>
                        <Package size={32} color="#27272a" style={{ marginBottom: 16 }} />
                        <p style={{ fontSize: 13 }}>Select a variant to manage inventory and view audit logs</p>
                    </div>
                )}
            </div>
        </div>
    );
};
