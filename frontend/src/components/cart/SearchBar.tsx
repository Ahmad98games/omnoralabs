/**
 * SearchBar: Collection Product Filter Block
 *
 * Takes user input and filters the current collection's fullProducts
 * by title, vendor, or tags. Updates a local filtered list.
 * Registered in BuilderRegistry as 'search_bar'.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useStorefront, type Product } from '../../context/StorefrontContext';
import { ProductCard } from './ProductCard';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
    nodeId: string;
    placeholder?: string;
    showResults?: boolean;
    maxResults?: number;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({
    nodeId,
    placeholder = 'Search products...',
    showResults = true,
    maxResults = 6,
}) => {
    const { state } = useStorefront();
    const collection = state.collection;
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const results = useMemo<Product[]>(() => {
        if (!query.trim() || !collection) return [];
        const q = query.toLowerCase().trim();
        return (collection.fullProducts ?? [])
            .filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.vendor.toLowerCase().includes(q) ||
                p.type.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            )
            .slice(0, maxResults);
    }, [query, collection, maxResults]);

    const handleClear = useCallback(() => {
        setQuery('');
    }, []);

    const showDropdown = isFocused && query.trim().length > 0 && showResults;

    return (
        <div
            data-node-id={nodeId}
            style={{
                position: 'relative',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Input */}
            <div style={{ position: 'relative' }}>
                <span style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15, opacity: 0.4,
                    pointerEvents: 'none',
                }}>
                    🔍
                </span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    style={{
                        width: '100%',
                        padding: '13px 40px 13px 40px',
                        background: T.surface,
                        border: `1.5px solid ${isFocused ? T.accent : T.border}`,
                        borderRadius: 12,
                        color: T.text,
                        fontSize: 14,
                        fontWeight: 500,
                        outline: 'none',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxShadow: isFocused ? `0 0 0 3px rgba(124,109,250,0.1)` : 'none',
                    }}
                />
                {query && (
                    <button
                        onClick={handleClear}
                        style={{
                            position: 'absolute', right: 12, top: '50%',
                            transform: 'translateY(-50%)',
                            background: T.surface2, border: `1px solid ${T.border}`,
                            borderRadius: 6, width: 22, height: 22,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: T.textDim, fontSize: 10,
                            transition: 'all 0.12s',
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0, right: 0,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: 12,
                    zIndex: 9999,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    maxHeight: 400,
                    overflowY: 'auto',
                }}>
                    {results.length === 0 ? (
                        <div style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            color: T.textMuted,
                            fontSize: 13,
                        }}>
                            No products match "{query}"
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: T.textMuted,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                padding: '0 4px 4px',
                            }}>
                                {results.length} result{results.length !== 1 ? 's' : ''}
                            </span>
                            {results.map(product => (
                                <SearchResultRow
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Search Result Row ────────────────────────────────────────────────────────

const SearchResultRow: React.FC<{ product: Product }> = ({ product }) => {
    const [hov, setHov] = useState(false);

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                background: hov ? T.surface2 : 'transparent',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.12s',
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 8,
                overflow: 'hidden', background: T.surface2, flexShrink: 0,
            }}>
                <img
                    src={product.featured_image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: 13, fontWeight: 600, color: T.text,
                    margin: 0, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {product.title}
                </p>
                <p style={{
                    fontSize: 11, color: T.textDim, margin: '2px 0 0',
                }}>
                    {product.vendor}
                </p>
            </div>
            <span style={{
                fontSize: 13, fontWeight: 700, color: T.accent,
                flexShrink: 0,
            }}>
                ${product.price.toFixed(2)}
            </span>
        </div>
    );
};

export default SearchBar;
