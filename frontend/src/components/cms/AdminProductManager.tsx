/**
 * AdminProductManager: Merchant Product CMS
 *
 * Premium Shopify-grade admin panel for CRUD operations on products.
 * Registered in BuilderRegistry as 'admin_product_manager'.
 *
 * Features:
 *   - Data table with search/filter
 *   - Add/Edit product modal with Title, Description, Price, Image URL
 *   - Dynamic options + variants list
 *   - Real persistence via IDatabaseClient
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { MediaLibraryModal } from './MediaLibraryModal';
import type { Product, ProductVariant, ProductOption } from '../../context/StorefrontContext';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#111118',
    surface2: '#1a1a24',
    surface3: '#222230',
    border: '#2a2a3a',
    borderFocus: '#7c6dfa',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.15)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    danger: '#ff4d6a',
    dangerDim: 'rgba(255,77,106,0.12)',
    success: '#34d399',
    successDim: 'rgba(52,211,153,0.12)',
    radius: 10,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AdminProductManagerProps {
    nodeId: string;
    merchantId?: string;
    children?: React.ReactNode;
}

// ─── propSchema for BuilderRegistry ───────────────────────────────────────────

export const adminProductManagerSchema = {
    merchantId: { type: 'text' as const, label: 'Merchant ID', defaultValue: '' },
};

// ─── Blank Product Template ───────────────────────────────────────────────────

const blankProduct = (): Omit<Product, 'id'> => ({
    title: '',
    handle: '',
    description: '',
    vendor: '',
    type: '',
    tags: [],
    price: 0,
    compareAtPrice: 0,
    currency: 'USD',
    featured_image: '',
    images: [],
    options: [],
    variants: [],
    available: true,
    selectedVariantId: '',
});

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminProductManager: React.FC<AdminProductManagerProps> = ({ nodeId, merchantId = '' }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState<Omit<Product, 'id'>>(blankProduct());
    const [optionDrafts, setOptionDrafts] = useState<{ name: string; values: string }[]>([]);
    const [variantDrafts, setVariantDrafts] = useState<{ title: string; price: string; sku: string; available: boolean }[]>([]);
    const [mediaOpen, setMediaOpen] = useState(false);

    // ── Load products on mount ────────────────────────────────────────────
    const loadProducts = useCallback(async () => {
        if (!merchantId) { setLoading(false); return; }
        setLoading(true);
        try {
            const data = await databaseClient.getProductsByMerchant(merchantId);
            setProducts(data);
        } catch (err) {
            console.error('[AdminProductManager] Load failed:', err);
        } finally {
            setLoading(false);
        }
    }, [merchantId]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    // ── Filtered products ─────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase();
        return products.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q) ||
            p.vendor.toLowerCase().includes(q)
        );
    }, [products, search]);

    // ── Open modal ────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditingProduct(null);
        setForm(blankProduct());
        setOptionDrafts([]);
        setVariantDrafts([]);
        setModalOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setForm({ ...product });
        setOptionDrafts(product.options.map(o => ({ name: o.name, values: o.values.join(', ') })));
        setVariantDrafts(product.variants.map(v => ({
            title: v.title, price: String(v.price), sku: v.sku || '', available: v.available,
        })));
        setModalOpen(true);
    };

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!merchantId || !form.title.trim()) return;
        setSaving(true);

        const options: ProductOption[] = optionDrafts
            .filter(o => o.name.trim())
            .map(o => ({ name: o.name.trim(), values: o.values.split(',').map(v => v.trim()).filter(Boolean) }));

        const variants: ProductVariant[] = variantDrafts
            .filter(v => v.title.trim())
            .map((v, i) => ({
                id: `var_${Date.now()}_${i}`,
                title: v.title.trim(),
                price: parseFloat(v.price) || 0,
                sku: v.sku.trim(),
                available: v.available,
                options: {},
            }));

        const handle = form.handle || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const productData: Omit<Product, 'id'> = {
            ...form,
            handle,
            options,
            variants: variants.length > 0 ? variants : [
                { id: `var_default_${Date.now()}`, title: 'Default', price: form.price, sku: '', available: true, options: {} },
            ],
            selectedVariantId: variants[0]?.id || `var_default_${Date.now()}`,
        };

        try {
            if (editingProduct) {
                await databaseClient.updateProduct(editingProduct.id, { ...productData, id: editingProduct.id } as Product);
            } else {
                await databaseClient.createProduct(merchantId, productData);
            }
            await loadProducts();
            setModalOpen(false);
        } catch (err) {
            console.error('[AdminProductManager] Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────
    const handleDelete = async (productId: string) => {
        if (!merchantId) return;
        try {
            await databaseClient.deleteProduct(merchantId, productId);
            await loadProducts();
        } catch (err) {
            console.error('[AdminProductManager] Delete failed:', err);
        }
    };

    // ── No merchantId placeholder ─────────────────────────────────────────
    if (!merchantId) {
        return (
            <div data-node-id={nodeId} style={{ padding: 40, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
                <p style={{ color: T.textMuted, fontSize: 14 }}>Set your <strong>Merchant ID</strong> in the block settings to manage products.</p>
            </div>
        );
    }

    return (
        <div data-node-id={nodeId} style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: T.bg, borderRadius: T.radius, minHeight: 400,
        }}>
            {/* ── Header ──────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                        Products
                    </h2>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                        {products.length} product{products.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={openAdd} style={btnPrimary}>
                    + Add Product
                </button>
            </div>

            {/* ── Search ──────────────────────────────────── */}
            <div style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={inputStyle}
                />
            </div>

            {/* ── Data Table ──────────────────────────────── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={spinnerStyle} />
                    <p style={{ color: T.textMuted, fontSize: 13, marginTop: 12 }}>Loading products…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <span style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.25 }}>📦</span>
                    <p style={{ color: T.textDim, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No products yet</p>
                    <p style={{ color: T.textMuted, fontSize: 12, margin: 0 }}>Click "Add Product" to create your first item.</p>
                </div>
            ) : (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '48px 1fr 100px 100px 80px 60px',
                        padding: '10px 16px', background: T.surface2,
                        fontSize: 10, fontWeight: 700, color: T.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <span />
                        <span>Product</span>
                        <span>Price</span>
                        <span>Status</span>
                        <span>Variants</span>
                        <span />
                    </div>

                    {/* Rows */}
                    {filtered.map(product => (
                        <div
                            key={product.id}
                            onClick={() => openEdit(product)}
                            style={{
                                display: 'grid', gridTemplateColumns: '48px 1fr 100px 100px 80px 60px',
                                padding: '12px 16px', alignItems: 'center',
                                borderTop: `1px solid ${T.border}`,
                                cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = T.surface2; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                            {/* Thumbnail */}
                            <div style={{
                                width: 36, height: 36, borderRadius: 6,
                                overflow: 'hidden', background: T.surface3, flexShrink: 0,
                            }}>
                                {product.featured_image && (
                                    <img src={product.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>

                            {/* Title */}
                            <div style={{ minWidth: 0 }}>
                                <p style={{
                                    fontSize: 13, fontWeight: 600, color: T.text, margin: 0,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {product.title}
                                </p>
                                <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{product.type || product.vendor}</p>
                            </div>

                            {/* Price */}
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                                ${product.price.toFixed(2)}
                            </span>

                            {/* Status */}
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: product.available ? T.successDim : T.dangerDim,
                                color: product.available ? T.success : T.danger,
                                display: 'inline-block', width: 'fit-content',
                            }}>
                                {product.available ? 'Active' : 'Draft'}
                            </span>

                            {/* Variants count */}
                            <span style={{ fontSize: 12, color: T.textDim }}>
                                {product.variants.length}
                            </span>

                            {/* Delete */}
                            <button
                                onClick={e => { e.stopPropagation(); handleDelete(product.id); }}
                                style={{
                                    background: 'none', border: 'none', color: T.textMuted,
                                    cursor: 'pointer', fontSize: 16, padding: 4,
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.danger; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.textMuted; }}
                                title="Delete product"
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal ───────────────────────────────────── */}
            {modalOpen && (
                <div style={overlayStyle} onClick={() => setModalOpen(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>
                                {editingProduct ? 'Edit Product' : 'Add Product'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 20, cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
                            <ModalField label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Luxury Chronograph Watch" />
                            <ModalField label="Handle (URL slug)" value={form.handle} onChange={v => setForm(f => ({ ...f, handle: v }))} placeholder="auto-generated if blank" />
                            <ModalField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="A stunning timepiece…" multiline />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <ModalField label="Base Price ($)" value={String(form.price)} onChange={v => setForm(f => ({ ...f, price: parseFloat(v) || 0 }))} placeholder="299.00" />
                                <ModalField label="Compare-at Price ($)" value={String(form.compareAtPrice || '')} onChange={v => setForm(f => ({ ...f, compareAtPrice: parseFloat(v) || undefined }))} placeholder="450.00" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <ModalField label="Vendor" value={form.vendor} onChange={v => setForm(f => ({ ...f, vendor: v }))} placeholder="Omnora Atelier" />
                                <ModalField label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} placeholder="Watch" />
                            </div>

                            {/* Featured Image — Media Library integration */}
                            <div>
                                <label style={labelStyle}>Featured Image</label>
                                {form.featured_image && (
                                    <div style={{
                                        width: '100%', height: 100, borderRadius: 8,
                                        overflow: 'hidden', marginBottom: 8,
                                        background: T.surface3, border: `1px solid ${T.border}`,
                                    }}>
                                        <img src={form.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setMediaOpen(true)}
                                    style={{
                                        width: '100%', padding: '9px 14px',
                                        background: T.surface2, border: `1.5px solid ${T.border}`,
                                        borderRadius: 8, color: T.textDim, fontSize: 12,
                                        fontWeight: 600, cursor: 'pointer',
                                        transition: 'border-color 0.15s',
                                    }}
                                >
                                    📁 {form.featured_image ? 'Replace Image' : 'Open Media Library'}
                                </button>
                            </div>

                            {/* ── Options ─────────────────────── */}
                            <div>
                                <label style={labelStyle}>Options (e.g. Color, Size)</label>
                                {optionDrafts.map((opt, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 32px', gap: 8, marginBottom: 6 }}>
                                        <input value={opt.name} onChange={e => { const d = [...optionDrafts]; d[i].name = e.target.value; setOptionDrafts(d); }} placeholder="Name" style={inputSmall} />
                                        <input value={opt.values} onChange={e => { const d = [...optionDrafts]; d[i].values = e.target.value; setOptionDrafts(d); }} placeholder="Values (comma-separated)" style={inputSmall} />
                                        <button onClick={() => setOptionDrafts(d => d.filter((_, j) => j !== i))} style={miniBtn}>×</button>
                                    </div>
                                ))}
                                <button onClick={() => setOptionDrafts(d => [...d, { name: '', values: '' }])} style={linkBtn}>+ Add option</button>
                            </div>

                            {/* ── Variants ────────────────────── */}
                            <div>
                                <label style={labelStyle}>Variants</label>
                                {variantDrafts.map((v, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                        <input value={v.title} onChange={e => { const d = [...variantDrafts]; d[i].title = e.target.value; setVariantDrafts(d); }} placeholder="Title" style={inputSmall} />
                                        <input value={v.price} onChange={e => { const d = [...variantDrafts]; d[i].price = e.target.value; setVariantDrafts(d); }} placeholder="Price" style={inputSmall} />
                                        <input value={v.sku} onChange={e => { const d = [...variantDrafts]; d[i].sku = e.target.value; setVariantDrafts(d); }} placeholder="SKU" style={inputSmall} />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={v.available} onChange={e => { const d = [...variantDrafts]; d[i].available = e.target.checked; setVariantDrafts(d); }} />
                                        </label>
                                        <button onClick={() => setVariantDrafts(d => d.filter((_, j) => j !== i))} style={miniBtn}>×</button>
                                    </div>
                                ))}
                                <button onClick={() => setVariantDrafts(d => [...d, { title: '', price: String(form.price), sku: '', available: true }])} style={linkBtn}>+ Add variant</button>
                            </div>
                        </div>

                        {/* ── Modal Footer ─────────────────── */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                            <button onClick={() => setModalOpen(false)} style={btnSecondary}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
                                ...btnPrimary,
                                opacity: saving || !form.title.trim() ? 0.5 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer',
                            }}>
                                {saving ? 'Saving…' : editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes omnoraAdminSpin { to { transform: rotate(360deg); } }`}</style>

            {/* Media Library Modal for product images */}
            <MediaLibraryModal
                isOpen={mediaOpen}
                onClose={() => setMediaOpen(false)}
                onSelect={(url) => { setForm(f => ({ ...f, featured_image: url })); setMediaOpen(false); }}
                merchantId={merchantId}
            />
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ModalField: React.FC<{
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; multiline?: boolean;
}> = ({ label, value, onChange, placeholder, multiline }) => (
    <div>
        <label style={labelStyle}>{label}</label>
        {multiline ? (
            <textarea
                value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ ...inputStyle, height: 72, resize: 'vertical', fontFamily: 'inherit' }}
            />
        ) : (
            <input
                value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} style={inputStyle}
            />
        )}
    </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: T.surface2, border: `1.5px solid ${T.border}`,
    borderRadius: 8, color: T.text, fontSize: 13, fontWeight: 500,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
};

const inputSmall: React.CSSProperties = {
    ...inputStyle, padding: '7px 10px', fontSize: 12,
};

const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', background: `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
    border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.01em',
    boxShadow: '0 2px 12px rgba(124,109,250,0.3)',
    transition: 'all 0.2s',
};

const btnSecondary: React.CSSProperties = {
    padding: '10px 20px', background: T.surface2,
    border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const linkBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: T.accent,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
};

const miniBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: T.textMuted,
    fontSize: 16, cursor: 'pointer', padding: 0,
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000,
};

const modalStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: 28, width: '100%', maxWidth: 620,
    maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
};

const spinnerStyle: React.CSSProperties = {
    width: 24, height: 24,
    border: '2.5px solid #27272a', borderTopColor: T.accent,
    borderRadius: '50%', display: 'inline-block',
    animation: 'omnoraAdminSpin 0.7s linear infinite',
};

export default AdminProductManager;
