/**
 * AdminDiscountManager: Promo Code CMS
 *
 * Manage discount/promo codes for the store.
 * Registered in BuilderRegistry as 'admin_discount_manager'.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { DiscountCode } from '../../platform/core/DatabaseTypes';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f', surface: '#111118', surface2: '#1a1a24', surface3: '#222230',
    border: '#2a2a3a', accent: '#7c6dfa', accentDim: 'rgba(124,109,250,0.15)',
    text: '#f0f0f5', textDim: '#8b8ba0', textMuted: '#5a5a70',
    danger: '#ff4d6a', dangerDim: 'rgba(255,77,106,0.12)',
    success: '#34d399', successDim: 'rgba(52,211,153,0.12)',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AdminDiscountManagerProps {
    nodeId: string;
    merchantId?: string;
    children?: React.ReactNode;
}

export const adminDiscountManagerSchema = {
    merchantId: { type: 'text' as const, label: 'Merchant ID', defaultValue: '' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminDiscountManager: React.FC<AdminDiscountManagerProps> = ({ nodeId, merchantId = '' }) => {
    const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        code: '', type: 'percentage' as 'percentage' | 'fixed',
        value: '', isActive: true, usageLimit: '',
    });

    const load = useCallback(async () => {
        if (!merchantId) { setLoading(false); return; }
        setLoading(true);
        try { setDiscounts(await databaseClient.getDiscountsByMerchant(merchantId)); }
        catch (err) { console.error('[DiscountManager] Load:', err); }
        finally { setLoading(false); }
    }, [merchantId]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!merchantId || !form.code.trim() || !form.value) return;
        setSaving(true);
        try {
            await databaseClient.createDiscount(merchantId, {
                code: form.code.trim().toUpperCase(),
                type: form.type,
                value: parseFloat(form.value) || 0,
                isActive: form.isActive,
                usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : undefined,
            });
            await load();
            setModalOpen(false);
            setForm({ code: '', type: 'percentage', value: '', isActive: true, usageLimit: '' });
        } catch (err) { console.error('[DiscountManager] Save:', err); }
        finally { setSaving(false); }
    };

    const handleToggle = async (d: DiscountCode) => {
        await databaseClient.updateDiscount(d.id, { isActive: !d.isActive });
        await load();
    };

    const handleDelete = async (id: string) => {
        if (!merchantId) return;
        await databaseClient.deleteDiscount(merchantId, id);
        await load();
    };

    if (!merchantId) {
        return (
            <div data-node-id={nodeId} style={{ padding: 40, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
                <p style={{ color: T.textMuted, fontSize: 14 }}>Set <strong>Merchant ID</strong> in block settings.</p>
            </div>
        );
    }

    return (
        <div data-node-id={nodeId} style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: T.bg, minHeight: 300 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Discounts</h2>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{discounts.length} promo code{discounts.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setModalOpen(true)} style={btnPrimary}>+ Add Promo Code</button>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={spinnerStyle} />
                </div>
            ) : discounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <span style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.2 }}>🏷️</span>
                    <p style={{ color: T.textDim, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No promo codes</p>
                    <p style={{ color: T.textMuted, fontSize: 12, margin: 0 }}>Click "Add Promo Code" to create BLACKFRIDAY20, etc.</p>
                </div>
            ) : (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 70px 60px',
                        padding: '10px 16px', background: T.surface2,
                        fontSize: 10, fontWeight: 700, color: T.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <span>Code</span><span>Type</span><span>Value</span><span>Used</span><span>Status</span><span />
                    </div>
                    {discounts.map(d => (
                        <div key={d.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 70px 60px',
                            padding: '12px 16px', alignItems: 'center',
                            borderTop: `1px solid ${T.border}`,
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                {d.code}
                            </span>
                            <span style={{ fontSize: 11, color: T.textDim }}>
                                {d.type === 'percentage' ? '% off' : '$ off'}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                                {d.type === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                            </span>
                            <span style={{ fontSize: 12, color: T.textDim }}>
                                {d.usageCount}{d.usageLimit ? `/${d.usageLimit}` : ''}
                            </span>
                            <button
                                onClick={() => handleToggle(d)}
                                style={{
                                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                    border: 'none', cursor: 'pointer',
                                    background: d.isActive ? T.successDim : T.dangerDim,
                                    color: d.isActive ? T.success : T.danger,
                                }}
                            >
                                {d.isActive ? 'Active' : 'Off'}
                            </button>
                            <button
                                onClick={() => handleDelete(d.id)}
                                style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 16, padding: 4 }}
                            >🗑</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div style={overlayStyle} onClick={() => setModalOpen(false)}>
                    <div style={modalSt} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>New Promo Code</h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 20, cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={labelSt}>Code</label>
                                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    placeholder="BLACKFRIDAY20" style={{ ...inputSt, fontFamily: 'monospace', letterSpacing: '0.08em' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelSt}>Type</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                                        style={{ ...inputSt, appearance: 'auto' as any }}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelSt}>Value</label>
                                    <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                                        placeholder={form.type === 'percentage' ? '20' : '10.00'} style={inputSt} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelSt}>Usage Limit (optional)</label>
                                    <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                                        placeholder="Unlimited" style={inputSt} />
                                </div>
                                <div>
                                    <label style={labelSt}>Active</label>
                                    <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: 8,
                                            border: `1.5px solid ${form.isActive ? T.success : T.border}`,
                                            background: form.isActive ? T.successDim : T.surface2,
                                            color: form.isActive ? T.success : T.textDim,
                                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        }}>
                                        {form.isActive ? '✓ Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                            <button onClick={() => setModalOpen(false)} style={btnSecondary}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.code.trim() || !form.value}
                                style={{ ...btnPrimary, opacity: saving || !form.code.trim() || !form.value ? 0.5 : 1 }}>
                                {saving ? 'Creating…' : 'Create Code'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes omnoraDiscSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelSt: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};
const inputSt: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: T.surface2,
    border: `1.5px solid ${T.border}`, borderRadius: 8, color: T.text,
    fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', background: `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
    border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,109,250,0.3)',
};
const btnSecondary: React.CSSProperties = {
    padding: '10px 20px', background: T.surface2,
    border: `1px solid ${T.border}`, borderRadius: 8, color: T.textDim,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10000,
};
const modalSt: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
    padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
};
const spinnerStyle: React.CSSProperties = {
    width: 24, height: 24, border: '2.5px solid #27272a', borderTopColor: T.accent,
    borderRadius: '50%', display: 'inline-block', animation: 'omnoraDiscSpin 0.7s linear infinite',
};

export default AdminDiscountManager;
