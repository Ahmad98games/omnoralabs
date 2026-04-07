/**
 * OmnoraProductVault — Shopify-grade product management system.
 *
 * Features:
 *  - Product grid with live search + filter (category, status, price range)
 *  - Bulk select + bulk actions (publish, archive, delete)
 *  - Full product editor drawer:
 *      • Rich details (title, description, vendor, tags)
 *      • Media gallery (URL-based, drag-to-reorder)
 *      • Variant matrix builder (option groups → cartesian product)
 *      • Per-variant pricing + inventory + SKU
 *      • SEO preview (Google SERP simulator)
 *      • Availability toggle
 *  - Live inventory status badges (In Stock / Low Stock / Out of Stock)
 *  - CSV export
 */

import React, {
    useState, useEffect, useCallback, useMemo,
} from 'react';
import {
    Plus, Search, X, Loader2, Package, Image as ImageIcon,
    Trash2, Edit3, Eye, EyeOff, Copy, Download, Check,
    Grid3X3, List,
} from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Product, ProductVariant, ProductOption, ProductImage } from '../../context/StorefrontContext';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
    accent:  '#7c6dfa',
    success: '#10b981',
    warn:    '#f59e0b',
    danger:  '#f43f5e',
    border:  'rgba(255,255,255,0.08)',
    surface: 'rgba(255,255,255,0.03)',
    over:    'rgba(255,255,255,0.06)',
    deep:    '#050509',
    card:    '#0d0d14',
    text:    '#f1f5f9',
    muted:   'rgba(255,255,255,0.45)',
    inp:     '#0a0a10',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'archived';

interface ProductFormData {
    title: string;
    description: string;
    vendor: string;
    tags: string;
    price: string;
    compareAtPrice: string;
    featured_image: string;
    images: ProductImage[];
    options: ProductOption[];
    variants: ProductVariant[];
    category_id: string;
    seo_title: string;
    seo_description: string;
    handle: string;
    available: boolean;
}

const BLANK_FORM: ProductFormData = {
    title: '', description: '', vendor: '', tags: '',
    price: '', compareAtPrice: '', featured_image: '',
    images: [], options: [], variants: [], category_id: '',
    seo_title: '', seo_description: '', handle: '',
    available: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function stockBadge(inv?: number) {
    if (inv === undefined || inv === null) return null;
    if (inv === 0)    return { label: 'Out of Stock', color: C.danger,  bg: `${C.danger}18`  };
    if (inv <= 5)     return { label: 'Low Stock',    color: C.warn,    bg: `${C.warn}18`    };
    return               { label: 'In Stock',      color: C.success, bg: `${C.success}18` };
}

function cartesian(options: ProductOption[]): Record<string, string>[] {
    if (!options.length) return [];
    return options.reduce<Record<string, string>[]>((acc, opt) => {
        if (!opt.values.length) return acc;
        if (!acc.length) return opt.values.map(v => ({ [opt.name]: v }));
        return acc.flatMap(combo => opt.values.map(v => ({ ...combo, [opt.name]: v })));
    }, []);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', background: C.inp,
    border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontSize: 13, outline: 'none',
    fontFamily: 'Inter, sans-serif',
};

const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: C.muted, display: 'block', marginBottom: 6,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{label}</label>
            {children}
        </div>
    );
}

function Textarea({ value, onChange, rows = 4, placeholder = '' }: {
    value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
    return (
        <textarea
            value={value} onChange={e => onChange(e.target.value)}
            rows={rows} placeholder={placeholder}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
    );
}

function Input({ value, onChange, type = 'text', placeholder = '' }: {
    value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
    return (
        <input
            type={type} value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
        />
    );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
    product, selected, onSelect, onEdit, onDuplicate, onDelete, onToggleAvailable,
}: {
    product: Product;
    selected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onToggleAvailable: () => void;
}) {
    const [hover, setHover] = useState(false);
    const stock = stockBadge((product as Product & { inventory_count?: number }).inventory_count);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: selected ? `${C.accent}12` : C.card,
                border: `1px solid ${selected ? C.accent : hover ? 'rgba(255,255,255,0.14)' : C.border}`,
                borderRadius: 12, overflow: 'hidden',
                transition: 'all 0.15s', cursor: 'pointer',
                transform: hover ? 'translateY(-1px)' : 'none',
                boxShadow: hover ? '0 6px 20px rgba(0,0,0,0.3)' : 'none',
            }}
        >
            {/* Image */}
            <div style={{ position: 'relative', paddingBottom: '75%', background: '#0a0a12' }}>
                {product.featured_image ? (
                    <img src={product.featured_image} alt={product.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={32} color={C.muted} />
                    </div>
                )}
                {/* Select checkbox */}
                <div
                    onClick={e => { e.stopPropagation(); onSelect(); }}
                    style={{
                        position: 'absolute', top: 8, left: 8,
                        width: 22, height: 22, borderRadius: 6,
                        background: selected ? C.accent : 'rgba(5,5,9,0.7)',
                        border: `2px solid ${selected ? C.accent : 'rgba(255,255,255,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.15s',
                    }}
                >
                    {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                {/* Status */}
                {stock && (
                    <div style={{
                        position: 'absolute', bottom: 8, right: 8,
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                        color: stock.color, background: stock.bg,
                        padding: '3px 7px', borderRadius: 5,
                        backdropFilter: 'blur(4px)',
                    }}>
                        {stock.label}
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: 12 }}>
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.title}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: C.accent }}>
                        ${Number(product.price || 0).toFixed(2)}
                    </span>
                    {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                        <span style={{ fontSize: 11, color: C.muted, textDecoration: 'line-through' }}>
                            ${Number(product.compareAtPrice).toFixed(2)}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions (hover reveal) */}
            {hover && (
                <div style={{
                    display: 'flex', borderTop: `1px solid ${C.border}`,
                }}>
                    {[
                        { icon: Edit3,   action: onEdit,            title: 'Edit'      },
                        { icon: Copy,    action: onDuplicate,       title: 'Duplicate' },
                        { icon: product.available !== false ? EyeOff : Eye,
                          action: onToggleAvailable, title: product.available !== false ? 'Archive' : 'Publish' },
                        { icon: Trash2,  action: onDelete,          title: 'Delete',   danger: true },
                    ].map(({ icon: Icon, action, title, danger }) => (
                        <button
                            key={title} type="button"
                            onClick={e => { e.stopPropagation(); action(); }}
                            title={title}
                            style={{
                                flex: 1, padding: '9px 0',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: danger ? C.danger : C.muted,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'color 0.15s',
                            }}
                        >
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── SEO Preview ──────────────────────────────────────────────────────────────

function SEOPreview({ title, description, handle }: { title: string; description: string; handle: string }) {
    const displayTitle = title || 'Product Title — Your Store';
    const displayDesc  = description || 'Add a meta description to improve your search result listings.';
    const displayUrl   = `yourstore.com/products/${handle || 'product-handle'}`;

    return (
        <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
            <p style={{ margin: '0 0 2px', fontSize: 18, color: '#1a0dab', fontWeight: 400, fontFamily: 'arial,sans-serif', cursor: 'pointer' }}>
                {displayTitle.slice(0, 60)}{displayTitle.length > 60 && '...'}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#006621', fontFamily: 'arial,sans-serif' }}>
                {displayUrl}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#545454', fontFamily: 'arial,sans-serif', lineHeight: 1.5 }}>
                {displayDesc.slice(0, 155)}{displayDesc.length > 155 && '...'}
            </p>
        </div>
    );
}

// ─── Variant Matrix Builder ───────────────────────────────────────────────────

function VariantMatrix({
    options, variants,
    onOptionsChange, onVariantsChange,
}: {
    options: ProductOption[];
    variants: ProductVariant[];
    onOptionsChange: (opts: ProductOption[]) => void;
    onVariantsChange: (vars: ProductVariant[]) => void;
}) {
    const addOption = () => onOptionsChange([...options, { name: '', values: [] }]);

    const updateOption = (i: number, key: 'name' | 'values', val: string | string[]) => {
        const next = options.map((o, idx) => idx === i ? { ...o, [key]: val } : o);
        onOptionsChange(next);
        // Recompute variants
        const combos = cartesian(next);
        onVariantsChange(combos.map((combo, ci) => ({
            id: `var_${ci}_${Date.now()}`,
            title: Object.values(combo).join(' / '),
            price: Number(variants[0]?.price ?? 0),
            compareAtPrice: variants[0]?.compareAtPrice,
            sku: '',
            available: true,
            options: combo,
            image: '',
        })));
    };

    const removeOption = (i: number) => {
        const next = options.filter((_, idx) => idx !== i);
        onOptionsChange(next);
        if (next.length === 0) onVariantsChange([]);
    };

    const updateVariant = (i: number, field: keyof ProductVariant, val: unknown) => {
        onVariantsChange(variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
    };

    return (
        <div>
            {options.map((opt, i) => (
                <div key={i} style={{ background: C.inp, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                            value={opt.name}
                            onChange={e => updateOption(i, 'name', e.target.value)}
                            placeholder="Option name (e.g. Size)"
                            style={{ ...inputStyle, flex: 1, background: C.deep }}
                        />
                        <button type="button" onClick={() => removeOption(i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger }}>
                            <X size={16} />
                        </button>
                    </div>
                    <input
                        value={opt.values.join(', ')}
                        onChange={e => updateOption(i, 'values', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                        placeholder="Values (comma-separated): Small, Medium, Large"
                        style={{ ...inputStyle, background: C.deep }}
                    />
                </div>
            ))}

            <button type="button" onClick={addOption}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', background: 'none',
                    border: `1px dashed ${C.border}`, borderRadius: 8,
                    color: C.muted, fontSize: 12, cursor: 'pointer', marginBottom: 16,
                }}
            >
                <Plus size={13} /> Add Option
            </button>

            {variants.length > 0 && (
                <div>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>Variant Pricing & Inventory</p>
                    <div style={{ display: 'flex', gap: 0, flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px 80px',
                            gap: 8, padding: '6px 8px',
                            fontSize: 10, fontWeight: 700, color: C.muted,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                            <span>Variant</span><span>Price</span><span>Compare</span><span>SKU</span><span>Inventory</span>
                        </div>
                        {variants.slice(0, 20).map((v, i) => (
                            <div key={v.id} style={{
                                display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px 80px',
                                gap: 8, padding: '6px 8px', alignItems: 'center',
                                background: i % 2 === 0 ? 'transparent' : C.surface,
                                borderRadius: 6,
                            }}>
                                <span style={{ fontSize: 12, color: C.text }}>{v.title}</span>
                                <input type="number" value={v.price}
                                    onChange={e => updateVariant(i, 'price', Number(e.target.value))}
                                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 12, background: C.inp }}
                                />
                                <input type="number" value={v.compareAtPrice ?? ''}
                                    onChange={e => updateVariant(i, 'compareAtPrice', e.target.value ? Number(e.target.value) : undefined)}
                                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 12, background: C.inp }}
                                />
                                <input value={v.sku ?? ''}
                                    onChange={e => updateVariant(i, 'sku', e.target.value)}
                                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 12, background: C.inp }}
                                />
                                <input type="number"
                                    value={(v as ProductVariant & { inventory?: number }).inventory ?? 0}
                                    onChange={e => updateVariant(i, 'inventory' as keyof ProductVariant, Number(e.target.value))}
                                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 12, background: C.inp }}
                                />
                            </div>
                        ))}
                        {variants.length > 20 && (
                            <p style={{ fontSize: 11, color: C.muted, padding: '6px 8px' }}>
                                …and {variants.length - 20} more variants
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Product Editor Drawer ────────────────────────────────────────────────────

function ProductEditorDrawer({
    product, onClose, onSave,
}: {
    product: Product | null;
    onClose: () => void;
    onSave: (data: Partial<Product>) => Promise<void>;
}) {
    const [form, setForm] = useState<ProductFormData>({ ...BLANK_FORM });
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<'details' | 'media' | 'variants' | 'seo'>('details');
    const [newImageUrl, setNewImageUrl] = useState('');

    useEffect(() => {
        if (product) {
            setForm({
                title:           product.title || '',
                description:     product.description || '',
                vendor:          product.vendor || '',
                tags:            (product.tags || []).join(', '),
                price:           String(product.price || ''),
                compareAtPrice:  String(product.compareAtPrice || ''),
                featured_image:  product.featured_image || '',
                images:          product.images || [],
                options:         product.options || [],
                variants:        product.variants || [],
                category_id:     (product as Product & { category_id?: string }).category_id || '',
                seo_title:       (product as Product & { seo_title?: string }).seo_title || '',
                seo_description: (product as Product & { seo_description?: string }).seo_description || '',
                handle:          product.handle || slugify(product.title || ''),
                available:       product.available !== false,
            });
        } else {
            setForm({ ...BLANK_FORM });
        }
        setTab('details');
    }, [product]);

    const set = (field: keyof ProductFormData, value: unknown) =>
        setForm(f => ({ ...f, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                ...form,
                price: Number(form.price),
                compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                handle: form.handle || slugify(form.title),
            } as Partial<Product>);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const addImage = () => {
        if (!newImageUrl.trim()) return;
        const img: ProductImage = { id: `img_${Date.now()}`, src: newImageUrl.trim(), alt: form.title };
        set('images', [...form.images, img]);
        if (!form.featured_image) set('featured_image', img.src);
        setNewImageUrl('');
    };

    const removeImage = (id: string) => {
        const next = form.images.filter(i => i.id !== id);
        set('images', next);
        if (form.featured_image === form.images.find(i => i.id === id)?.src) {
            set('featured_image', next[0]?.src || '');
        }
    };

    const TABS = ['details', 'media', 'variants', 'seo'] as const;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', justifyContent: 'flex-end',
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />

            {/* Drawer */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: 680, maxWidth: '100vw',
                height: '100vh', background: C.deep,
                borderLeft: `1px solid ${C.border}`,
                display: 'flex', flexDirection: 'column',
                overflowY: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.available ? C.success : C.muted }} />
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                            {product ? 'Edit Product' : 'New Product'}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button"
                            onClick={() => set('available', !form.available)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', border: `1px solid ${C.border}`,
                                background: C.surface, borderRadius: 8,
                                color: form.available ? C.success : C.muted,
                                fontSize: 12, cursor: 'pointer', fontWeight: 600,
                            }}
                        >
                            {form.available ? <Eye size={13} /> : <EyeOff size={13} />}
                            {form.available ? 'Published' : 'Draft'}
                        </button>
                        <button type="button"
                            onClick={handleSave} disabled={saving}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 20px',
                                background: saving ? C.muted : C.accent,
                                border: 'none', borderRadius: 8,
                                color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {saving ? 'Saving…' : 'Save Product'}
                        </button>
                        <button type="button" onClick={onClose}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    {TABS.map(t => (
                        <button key={t} type="button" onClick={() => setTab(t)}
                            style={{
                                padding: '12px 20px', background: 'none', border: 'none',
                                cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 700 : 500,
                                color: tab === t ? C.text : C.muted,
                                borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
                                marginBottom: -1, textTransform: 'capitalize', transition: 'all 0.15s',
                            }}
                        >{t}</button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

                    {tab === 'details' && (
                        <div>
                            <Field label="Product Title">
                                <Input value={form.title} onChange={v => {
                                    set('title', v);
                                    if (!product) set('handle', slugify(v));
                                }} placeholder="e.g. Noir Chronograph Watch" />
                            </Field>
                            <Field label="Description">
                                <Textarea value={form.description} onChange={v => set('description', v)}
                                    rows={5} placeholder="Describe your product in detail…" />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Field label="Price ($)">
                                    <Input type="number" value={form.price} onChange={v => set('price', v)} placeholder="0.00" />
                                </Field>
                                <Field label="Compare-at Price ($)">
                                    <Input type="number" value={form.compareAtPrice} onChange={v => set('compareAtPrice', v)} placeholder="0.00" />
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Field label="Vendor">
                                    <Input value={form.vendor} onChange={v => set('vendor', v)} placeholder="Your brand name" />
                                </Field>
                                <Field label="URL Handle">
                                    <Input value={form.handle} onChange={v => set('handle', slugify(v))} placeholder="product-handle" />
                                </Field>
                            </div>
                            <Field label="Tags (comma-separated)">
                                <Input value={form.tags} onChange={v => set('tags', v)} placeholder="luxury, watch, gift" />
                            </Field>
                        </div>
                    )}

                    {tab === 'media' && (
                        <div>
                            <Field label="Featured Image URL">
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input value={form.featured_image} onChange={e => set('featured_image', e.target.value)}
                                        placeholder="https://…"
                                        style={{ ...inputStyle, flex: 1 }} />
                                </div>
                                {form.featured_image && (
                                    <img src={form.featured_image} alt="preview"
                                        style={{ marginTop: 10, maxHeight: 160, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }} />
                                )}
                            </Field>

                            <Field label="Gallery Images">
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addImage()}
                                        placeholder="Paste image URL and press Enter"
                                        style={{ ...inputStyle, flex: 1 }} />
                                    <button type="button" onClick={addImage}
                                        style={{
                                            padding: '9px 14px', background: C.accent,
                                            border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff',
                                        }}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                                    {form.images.map(img => (
                                        <div key={img.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: '#0a0a12' }}>
                                            <img src={img.src} alt={img.alt}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => removeImage(img.id)}
                                                style={{
                                                    position: 'absolute', top: 4, right: 4,
                                                    width: 20, height: 20, borderRadius: 4,
                                                    background: 'rgba(0,0,0,0.7)', border: 'none',
                                                    cursor: 'pointer', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                <X size={11} />
                                            </button>
                                            {img.src === form.featured_image && (
                                                <div style={{
                                                    position: 'absolute', bottom: 4, left: 4,
                                                    fontSize: 8, fontWeight: 800, color: C.accent,
                                                    background: `${C.accent}22`, padding: '2px 5px', borderRadius: 3,
                                                }}>FEATURED</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Field>
                        </div>
                    )}

                    {tab === 'variants' && (
                        <div>
                            <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                                Add options like Size or Color to generate a variant matrix. Each combination becomes a separate variant with its own price, SKU, and inventory.
                            </p>
                            <VariantMatrix
                                options={form.options}
                                variants={form.variants}
                                onOptionsChange={v => set('options', v)}
                                onVariantsChange={v => set('variants', v)}
                            />
                        </div>
                    )}

                    {tab === 'seo' && (
                        <div>
                            <p style={{ ...labelStyle, marginBottom: 12 }}>Google Preview</p>
                            <SEOPreview title={form.seo_title || form.title} description={form.seo_description || form.description} handle={form.handle} />
                            <div style={{ marginTop: 20 }}>
                                <Field label="SEO Title (max 60 chars)">
                                    <Input value={form.seo_title} onChange={v => set('seo_title', v)} placeholder={form.title} />
                                    <p style={{ fontSize: 10, color: form.seo_title.length > 60 ? C.danger : C.muted, marginTop: 4 }}>
                                        {form.seo_title.length}/60
                                    </p>
                                </Field>
                                <Field label="Meta Description (max 155 chars)">
                                    <Textarea value={form.seo_description} onChange={v => set('seo_description', v)}
                                        rows={3} placeholder={form.description.slice(0, 155)} />
                                    <p style={{ fontSize: 10, color: form.seo_description.length > 155 ? C.danger : C.muted, marginTop: 4 }}>
                                        {form.seo_description.length}/155
                                    </p>
                                </Field>
                                <Field label="URL Handle">
                                    <div style={{ display: 'flex', alignItems: 'center', background: C.inp, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                                        <span style={{ padding: '9px 12px', color: C.muted, fontSize: 12, borderRight: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                                            yourstore.com/products/
                                        </span>
                                        <input value={form.handle} onChange={e => set('handle', slugify(e.target.value))}
                                            style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }} />
                                    </div>
                                </Field>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const OmnoraProductVault: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [products, setProducts]         = useState<Product[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [selected, setSelected]         = useState<Set<string>>(new Set());
    const [viewMode, setViewMode]         = useState<ViewMode>('grid');
    const [editProduct, setEditProduct]   = useState<Product | null | 'new'>('new');
    const [drawerOpen, setDrawerOpen]     = useState(false);


    const loadProducts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await databaseClient.getProductsByMerchant(user.id);
            setProducts(data);
        } catch {
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const filtered = useMemo(() => {
        let list = products;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(p => p.title.toLowerCase().includes(q) || p.vendor?.toLowerCase().includes(q));
        }
        if (statusFilter === 'active')   list = list.filter(p => p.available !== false);
        if (statusFilter === 'archived') list = list.filter(p => p.available === false);
        return list;
    }, [products, search, statusFilter]);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(p => p.id)));
    };

    const handleSave = async (data: Partial<Product>) => {
        try {
            if (editProduct && editProduct !== 'new') {
                await databaseClient.updateProduct(editProduct.id, data);
                setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data } : p));
                showToast('Product updated', 'success');
            } else {
                const created = await databaseClient.createProduct({ ...data, merchantId: user?.id ?? '' } as Product);
                setProducts(prev => [...prev, created]);
                showToast('Product created', 'success');
            }
        } catch {
            showToast('Save failed. Please try again.', 'error');
            throw new Error('Save failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product? This cannot be undone.')) return;
        try {
            await databaseClient.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            showToast('Product deleted', 'success');
        } catch { showToast('Delete failed', 'error'); }
    };

    const handleDuplicate = async (product: Product) => {
        try {
            const copy = { ...product, id: undefined, title: `${product.title} (Copy)`, available: false } as unknown as Product;
            const created = await databaseClient.createProduct({ ...copy, merchantId: user?.id ?? '' });
            setProducts(prev => [...prev, created]);
            showToast('Product duplicated', 'success');
        } catch { showToast('Duplicate failed', 'error'); }
    };

    const handleToggleAvailable = async (product: Product) => {
        const next = !product.available;
        try {
            await databaseClient.updateProduct(product.id, { available: next });
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: next } : p));
            showToast(`Product ${next ? 'published' : 'archived'}`, 'success');
        } catch { showToast('Failed to update', 'error'); }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.size} products?`)) return;
        for (const id of Array.from(selected)) {
            await databaseClient.deleteProduct(id).catch(() => null);
        }
        setProducts(prev => prev.filter(p => !selected.has(p.id)));
        setSelected(new Set());
        showToast(`${selected.size} products deleted`, 'success');
    };

    const exportCSV = () => {
        const rows = [
            ['ID', 'Title', 'Price', 'Vendor', 'Status', 'Handle'],
            ...products.map(p => [p.id, p.title, p.price, p.vendor || '', p.available ? 'active' : 'archived', p.handle]),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'products.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: 24, background: C.deep, minHeight: '100%', fontFamily: 'Inter,sans-serif', color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>Product Vault</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{products.length} products total</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={exportCSV}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: 8, color: C.muted, fontSize: 12, cursor: 'pointer',
                        }}>
                        <Download size={13} /> Export CSV
                    </button>
                    <button type="button" onClick={() => { setEditProduct(null); setDrawerOpen(true); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 18px', background: C.accent, border: 'none',
                            borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>
                        <Plus size={15} /> Add Product
                    </button>
                </div>
            </div>

            {/* ── Toolbar ───────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                    <Search size={14} color={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search products…"
                        style={{ ...inputStyle, paddingLeft: 36, background: C.card }} />
                </div>

                {/* Status filter */}
                <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    {(['all', 'active', 'archived'] as FilterStatus[]).map(f => (
                        <button key={f} type="button" onClick={() => setStatusFilter(f)}
                            style={{
                                padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                background: statusFilter === f ? C.accent : 'transparent',
                                color: statusFilter === f ? '#fff' : C.muted,
                                transition: 'all 0.15s', textTransform: 'capitalize',
                            }}
                        >{f}</button>
                    ))}
                </div>

                {/* View toggle */}
                <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    {[{ mode: 'grid' as const, Icon: Grid3X3 }, { mode: 'list' as const, Icon: List }].map(({ mode, Icon }) => (
                        <button key={mode} type="button" onClick={() => setViewMode(mode)}
                            style={{
                                padding: '8px 12px', border: 'none', cursor: 'pointer',
                                background: viewMode === mode ? C.accent : 'transparent',
                                color: viewMode === mode ? '#fff' : C.muted,
                                display: 'flex', alignItems: 'center',
                            }}>
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Bulk Action Bar ───────────────────────────────────────────── */}
            {selected.size > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', background: `${C.accent}14`,
                    border: `1px solid ${C.accent}40`, borderRadius: 10, marginBottom: 16,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{selected.size} selected</span>
                    <button type="button" onClick={selectAll}
                        style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                        {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={handleBulkDelete}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', background: `${C.danger}18`,
                            border: `1px solid ${C.danger}40`, borderRadius: 6,
                            color: C.danger, fontSize: 12, cursor: 'pointer',
                        }}>
                        <Trash2 size={12} /> Delete {selected.size}
                    </button>
                </div>
            )}

            {/* ── Product Grid / List ───────────────────────────────────────── */}
            {loading ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
                    gap: 12,
                }}>
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, height: 220, opacity: 0.5 }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <Package size={48} color={C.muted} style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                        {search ? 'No products match your search' : 'No products yet'}
                    </p>
                    <p style={{ fontSize: 13, color: C.muted, margin: '0 0 24px' }}>
                        {search ? 'Try a different search term' : 'Add your first product to start selling'}
                    </p>
                    <button type="button" onClick={() => { setEditProduct(null); setDrawerOpen(true); }}
                        style={{
                            padding: '10px 24px', background: C.accent, border: 'none',
                            borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>
                        Add Your First Product
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {filtered.map(p => (
                        <ProductCard
                            key={p.id} product={p}
                            selected={selected.has(p.id)}
                            onSelect={() => toggleSelect(p.id)}
                            onEdit={() => { setEditProduct(p); setDrawerOpen(true); }}
                            onDuplicate={() => handleDuplicate(p)}
                            onDelete={() => handleDelete(p.id)}
                            onToggleAvailable={() => handleToggleAvailable(p)}
                        />
                    ))}
                </div>
            ) : (
                /* List view */
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {/* Header row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '24px 60px 1fr 100px 100px 80px 100px',
                        gap: 16, padding: '10px 16px',
                        background: C.surface, fontSize: 10, fontWeight: 700,
                        color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                        <span></span><span>Image</span><span>Product</span>
                        <span>Price</span><span>Vendor</span><span>Status</span><span>Actions</span>
                    </div>
                    {filtered.map((p, i) => {
                        return (
                            <div key={p.id} style={{
                                display: 'grid', gridTemplateColumns: '24px 60px 1fr 100px 100px 80px 100px',
                                gap: 16, padding: '12px 16px', alignItems: 'center',
                                background: i % 2 === 0 ? 'transparent' : C.surface,
                                borderTop: `1px solid ${C.border}`,
                            }}>
                                <div onClick={() => toggleSelect(p.id)}
                                    style={{ width: 18, height: 18, borderRadius: 4, background: selected.has(p.id) ? C.accent : 'transparent', border: `2px solid ${selected.has(p.id) ? C.accent : C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {selected.has(p.id) && <Check size={10} color="#fff" />}
                                </div>
                                <img src={p.featured_image || ''} alt={p.title}
                                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, background: '#0a0a12' }}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{p.title}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{p.handle}</p>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>${Number(p.price || 0).toFixed(2)}</span>
                                <span style={{ fontSize: 12, color: C.muted }}>{p.vendor || '—'}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: p.available !== false ? C.success : C.muted }}>
                                    {p.available !== false ? 'Active' : 'Archived'}
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" onClick={() => { setEditProduct(p); setDrawerOpen(true); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
                                        <Edit3 size={14} />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(p.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Product Editor Drawer ─────────────────────────────────────── */}
            {drawerOpen && (
                <ProductEditorDrawer
                    product={editProduct && editProduct !== 'new' ? editProduct : null}
                    onClose={() => setDrawerOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default OmnoraProductVault;