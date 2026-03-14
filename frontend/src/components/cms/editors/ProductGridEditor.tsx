/**
 * ProductGridEditor: Dynamic CMS-to-AST Data Binding Module
 * 
 * Phase 47: Principal Full-Stack Architecture
 * 
 * This editor replaces the generic schema editor for 'product_grid'
 * blocks in the Visual Builder's right sidebar. It provides:
 * 
 * 1. Dynamic Category Picker — fetches categories from merchant products
 * 2. Specific Products Picker — multi-select modal for hand-picking items
 * 3. Layout & Aesthetic Controls — columns, gap, cardStyle, imageAspect
 * 
 * All changes dispatch through the Dispatcher → NodeStore pipeline
 * for instant canvas reactivity.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNodeSelector } from '../../../hooks/useNodeSelector';
import { dispatcher } from '../../../platform/core/Dispatcher';
import { databaseClient } from '../../../platform/core/DatabaseClient';
import type { Product } from '../../../context/StorefrontContext';
import {
    Grid3X3, Package, Tag, SlidersHorizontal,
    Check, X, Search, Loader2
} from 'lucide-react';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
    section: {
        marginBottom: 20,
        padding: '14px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.04)',
    } as React.CSSProperties,
    sectionHeader: {
        fontSize: 9, fontWeight: 900 as const,
        color: '#7c6dfa', textTransform: 'uppercase' as const,
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 14, letterSpacing: '0.1em',
    } as React.CSSProperties,
    label: {
        fontSize: 10, color: '#71717a', fontWeight: 700 as const,
        display: 'block', marginBottom: 5, textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    } as React.CSSProperties,
    input: {
        width: '100%', padding: '7px 10px',
        background: '#13131a', border: '1px solid #2a2a3a',
        borderRadius: 6, color: '#e4e4e7', fontSize: 12,
        fontFamily: 'inherit', outline: 'none',
        transition: 'border-color 0.15s',
    } as React.CSSProperties,
    select: {
        width: '100%', padding: '7px 10px',
        background: '#13131a', border: '1px solid #2a2a3a',
        borderRadius: 6, color: '#e4e4e7', fontSize: 12,
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
    } as React.CSSProperties,
    toggle: (active: boolean) => ({
        width: 36, height: 18, borderRadius: 10, position: 'relative' as const,
        border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        background: active ? '#7c6dfa' : '#2a2a3a',
    }),
    toggleDot: (active: boolean) => ({
        position: 'absolute' as const, top: 3, width: 12, height: 12,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        left: active ? 21 : 3,
    }),
    row: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
    } as React.CSSProperties,
    fieldGroup: { marginBottom: 14 } as React.CSSProperties,
    productChip: (selected: boolean) => ({
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
        background: selected ? 'rgba(124,109,250,0.12)' : '#13131a',
        border: `1px solid ${selected ? '#7c6dfa' : '#2a2a3a'}`,
        transition: 'all 0.15s',
    }),
    productChipImg: {
        width: 32, height: 32, borderRadius: 6, objectFit: 'cover' as const,
        background: '#1a1a24',
    } as React.CSSProperties,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductGridEditor: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const node = useNodeSelector(nodeId, (n) => ({ props: n.props }));

    // ── Async CMS Data ────────────────────────────────────────────────
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const tenantId = (window as any).__OMNORA_TENANT_ID__ || 'default_merchant';
                const [pData, cData] = await Promise.all([
                    databaseClient.getProductsByMerchant(tenantId),
                    databaseClient.getCategories(tenantId)
                ]);
                setProducts(pData);
                setCategories(cData);
            } catch (err) {
                console.error('[ProductGridEditor] Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtered products for the picker
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const q = searchQuery.toLowerCase();
        return products.filter((p: Product) =>
            p.title.toLowerCase().includes(q) ||
            p.tags?.some((t: string) => t.toLowerCase().includes(q))
        );
    }, [products, searchQuery]);

    if (!node) return null;

    // ── AST Mutation Helper ───────────────────────────────────────────
    const updateProp = (key: string, value: any) => {
        dispatcher.dispatch({
            nodeId,
            path: `props.${key}`,
            value,
            type: 'visual',
            source: 'editor',
        });
    };

    const props = node.props || {};
    const selectionMode = props.selectionMode || 'category'; // 'category' | 'specific'
    const selectedProductIds: string[] = props.productIds || [];

    const toggleProductId = (id: string) => {
        const current = [...selectedProductIds];
        const idx = current.indexOf(id);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(id);
        updateProp('productIds', current);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* ─── DATA SOURCE ─────────────────────────────────────────── */}
            <div style={S.section}>
                <div style={S.sectionHeader}>
                    <Package size={11} /> DATA SOURCE
                </div>

                {/* Selection Mode Toggle */}
                <div style={S.row}>
                    <span style={{ fontSize: 11, color: '#a1a1aa' }}>Mode</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['category', 'specific'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => updateProp('selectionMode', mode)}
                                style={{
                                    padding: '4px 10px', borderRadius: 5, fontSize: 10,
                                    fontWeight: 700, border: '1px solid',
                                    cursor: 'pointer', textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    background: selectionMode === mode ? 'rgba(124,109,250,0.15)' : 'transparent',
                                    borderColor: selectionMode === mode ? '#7c6dfa' : '#2a2a3a',
                                    color: selectionMode === mode ? '#a78bfa' : '#52525b',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {mode === 'category' ? 'By Category' : 'Pick Products'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category Picker */}
                {selectionMode === 'category' && (
                    <div style={S.fieldGroup}>
                        <label style={S.label}>Category / Tag Filter</label>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', color: '#52525b', fontSize: 11 }}>
                                <Loader2 size={12} className="animate-spin" /> Loading categories...
                            </div>
                        ) : (
                            <select
                                value={props.category_id || ''}
                                onChange={(e) => updateProp('category_id', e.target.value)}
                                style={S.select}
                            >
                                <option value="">All Products</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Specific Products Picker */}
                {selectionMode === 'specific' && (
                    <div style={S.fieldGroup}>
                        <label style={S.label}>
                            Select Products ({selectedProductIds.length} selected)
                        </label>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <Search size={12} style={{ position: 'absolute', left: 10, top: 9, color: '#52525b' }} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ ...S.input, paddingLeft: 28 }}
                            />
                        </div>

                        {/* Product List */}
                        <div style={{
                            maxHeight: 240, overflowY: 'auto',
                            display: 'flex', flexDirection: 'column', gap: 4,
                            scrollbarWidth: 'thin',
                        }}>
                            {loading ? (
                                <div style={{ padding: 20, textAlign: 'center', color: '#52525b', fontSize: 11 }}>
                                    <Loader2 size={14} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                                    Fetching your catalog...
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', color: '#52525b', fontSize: 11 }}>
                                    No products found. Add products in the Seller Dashboard.
                                </div>
                            ) : (
                                filteredProducts.map(p => {
                                    const isSelected = selectedProductIds.includes(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => toggleProductId(p.id)}
                                            style={S.productChip(isSelected)}
                                        >
                                            {p.featured_image ? (
                                                <img src={p.featured_image} alt="" style={S.productChipImg} />
                                            ) : (
                                                <div style={{ ...S.productChipImg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Package size={14} color="#52525b" />
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 11, fontWeight: 600, color: '#e4e4e7',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {p.title}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#71717a' }}>
                                                    ${p.price?.toFixed(2)}
                                                </div>
                                            </div>
                                            {isSelected && <Check size={14} color="#7c6dfa" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── LAYOUT CONTROLS ─────────────────────────────────────── */}
            <div style={S.section}>
                <div style={S.sectionHeader}>
                    <Grid3X3 size={11} /> GRID LAYOUT
                </div>

                <div style={S.fieldGroup}>
                    <label style={S.label}>Columns</label>
                    <input
                        type="number" min={1} max={6}
                        value={props.columns ?? 3}
                        onChange={(e) => updateProp('columns', Math.max(1, Math.min(6, Number(e.target.value))))}
                        style={S.input}
                    />
                </div>

                <div style={S.fieldGroup}>
                    <label style={S.label}>Gap</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="range" min={0} max={60} step={4}
                            value={props.gap ?? 20}
                            onChange={(e) => updateProp('gap', Number(e.target.value))}
                            style={{ flex: 1, accentColor: '#7c6dfa' }}
                        />
                        <span style={{ fontSize: 11, color: '#a1a1aa', minWidth: 32, textAlign: 'right' }}>
                            {props.gap ?? 20}px
                        </span>
                    </div>
                </div>

                <div style={S.fieldGroup}>
                    <label style={S.label}>Products Limit</label>
                    <input
                        type="number" min={1} max={50}
                        value={props.limit ?? 12}
                        onChange={(e) => updateProp('limit', Math.max(1, Number(e.target.value)))}
                        style={S.input}
                    />
                </div>

                <div style={S.row}>
                    <span style={{ fontSize: 11, color: '#a1a1aa' }}>Show Sort Filter</span>
                    <button onClick={() => updateProp('showFilter', !props.showFilter)} style={S.toggle(props.showFilter !== false)}>
                        <div style={S.toggleDot(props.showFilter !== false)} />
                    </button>
                </div>
            </div>

            {/* ─── AESTHETIC CONTROLS ──────────────────────────────────── */}
            <div style={S.section}>
                <div style={S.sectionHeader}>
                    <SlidersHorizontal size={11} /> CARD AESTHETICS
                </div>

                <div style={S.fieldGroup}>
                    <label style={S.label}>Card Style</label>
                    <select
                        value={props.cardStyle || 'minimal'}
                        onChange={(e) => updateProp('cardStyle', e.target.value)}
                        style={S.select}
                    >
                        <option value="minimal">Minimal</option>
                        <option value="cinematic-dark">Cinematic Dark</option>
                        <option value="outlined">Outlined</option>
                    </select>
                </div>

                <div style={S.fieldGroup}>
                    <label style={S.label}>Image Aspect Ratio</label>
                    <select
                        value={props.imageAspect || 'portrait'}
                        onChange={(e) => updateProp('imageAspect', e.target.value)}
                        style={S.select}
                    >
                        <option value="portrait">Portrait (3:4)</option>
                        <option value="square">Square (1:1)</option>
                        <option value="widescreen">Widescreen (16:9)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ProductGridEditor;
