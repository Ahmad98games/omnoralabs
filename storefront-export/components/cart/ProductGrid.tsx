/**
 * ProductGrid: Collection Grid Layout
 * 
 * Reads collection.fullProducts from StorefrontContext and renders
 * a responsive CSS Grid of ProductCard components.
 * Supports customizable columns, gap, and limit.
 * 
 * Registered in BuilderRegistry as 'product_grid'.
 */
import React, { useMemo, useState } from 'react';
import { useStorefront, type Product } from '../../context/StorefrontContext';
import { ProductCard } from './ProductCard';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

// ─── Sort Types ───────────────────────────────────────────────────────────────

export type SortKey = 'default' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductGridProps {
    nodeId: string;
    columns?: number;
    gap?: number;
    limit?: number;
    showFilter?: boolean;
    children?: React.ReactNode;
}

// ─── Sort Utility ─────────────────────────────────────────────────────────────

function sortProducts(products: Product[], sortKey: SortKey): Product[] {
    switch (sortKey) {
        case 'price-asc':
            return [...products].sort((a, b) => a.price - b.price);
        case 'price-desc':
            return [...products].sort((a, b) => b.price - a.price);
        case 'title-asc':
            return [...products].sort((a, b) => a.title.localeCompare(b.title));
        case 'title-desc':
            return [...products].sort((a, b) => b.title.localeCompare(a.title));
        case 'default':
        default:
            return products;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductGrid: React.FC<ProductGridProps> = ({
    nodeId,
    columns = 3,
    gap = 20,
    limit = 12,
    showFilter = true,
}) => {
    const { state } = useStorefront();
    const collection = state.collection;
    const [sortKey, setSortKey] = useState<SortKey>('default');

    const products = useMemo(() => {
        if (!collection) return [];
        const source = collection.fullProducts ?? [];
        const sorted = sortProducts(source, sortKey);
        return sorted.slice(0, limit);
    }, [collection, sortKey, limit]);

    // No collection
    if (!collection) {
        return (
            <div
                data-node-id={nodeId}
                style={{
                    padding: 40, textAlign: 'center',
                    background: T.surface, borderRadius: 14,
                    border: `1px dashed ${T.border}`,
                    color: T.textMuted, fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <span style={{ fontSize: 32, display: 'block', marginBottom: 12, opacity: 0.3 }}>🛍️</span>
                No collection in context. Use TemplateResolver or set a collection.
            </div>
        );
    }

    return (
        <div data-node-id={nodeId} style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Collection Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{
                    fontSize: 24, fontWeight: 800, color: T.text,
                    margin: '0 0 6px', letterSpacing: '-0.02em',
                }}>
                    {collection.title}
                </h2>
                <p style={{
                    fontSize: 13, color: T.textDim, margin: 0,
                    lineHeight: 1.5,
                }}>
                    {collection.description}
                </p>
            </div>

            {/* Filter Bar */}
            {showFilter && products.length > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 20, padding: '10px 14px',
                    background: T.surface, borderRadius: 10,
                    border: `1px solid ${T.border}`,
                }}>
                    <span style={{
                        fontSize: 12, color: T.textDim, fontWeight: 500,
                    }}>
                        {products.length} {products.length === 1 ? 'product' : 'products'}
                    </span>
                    <select
                        value={sortKey}
                        onChange={e => setSortKey(e.target.value as SortKey)}
                        style={{
                            background: T.bg, border: `1px solid ${T.border}`,
                            borderRadius: 8, padding: '6px 12px',
                            color: T.text, fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', outline: 'none',
                            fontFamily: 'inherit',
                        }}
                    >
                        <option value="default">Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="title-asc">Name: A-Z</option>
                        <option value="title-desc">Name: Z-A</option>
                    </select>
                </div>
            )}

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap,
            }}>
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        renderBuiltIn={true}
                    />
                ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <div style={{
                    padding: 40, textAlign: 'center',
                    color: T.textMuted, fontSize: 14,
                }}>
                    No products in this collection.
                </div>
            )}
        </div>
    );
};

export default ProductGrid;
