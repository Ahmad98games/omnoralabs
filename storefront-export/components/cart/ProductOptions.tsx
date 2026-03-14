/**
 * ProductOptions: Variant Selection Block
 * 
 * Reads options + variants from StorefrontContext, renders
 * pill-style selectors for each option (Color, Size, Band...),
 * and calls setSelectedVariantByOptions when user clicks.
 *
 * Registered in BuilderRegistry as 'product_options'.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStorefront, type ProductVariant } from '../../context/StorefrontContext';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.12)',
    accentGlow: 'rgba(124,109,250,0.25)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    danger: '#ff4d6a',
    success: '#34d399',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductOptionsProps {
    nodeId: string;
    layout?: 'pills' | 'dropdown';
    showLabels?: boolean;
    showPrice?: boolean;
    showAvailability?: boolean;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductOptions: React.FC<ProductOptionsProps> = ({
    nodeId,
    layout = 'pills',
    showLabels = true,
    showPrice = true,
    showAvailability = true,
}) => {
    const { state, setSelectedVariantByOptions } = useStorefront();
    const product = state.product;
    const selectedVariant = state.selectedVariant;

    // Build current selected options from variant
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    // Sync local state with store's selectedVariant
    useEffect(() => {
        if (selectedVariant?.options) {
            setSelectedOptions(selectedVariant.options);
        }
    }, [selectedVariant]);

    // Precompute which option values lead to available variants
    const availabilityMap = useMemo(() => {
        if (!product) return {};
        const map: Record<string, Record<string, boolean>> = {};
        for (const option of product.options) {
            map[option.name] = {};
            for (const value of option.values) {
                // Check if there's at least one variant with this option value that is available
                const hypothetical = { ...selectedOptions, [option.name]: value };
                const matchingVariant = product.variants.find(v =>
                    Object.entries(hypothetical).every(([k, val]) => v.options[k] === val)
                );
                map[option.name][value] = matchingVariant?.available ?? false;
            }
        }
        return map;
    }, [product, selectedOptions]);

    const handleOptionSelect = useCallback((optionName: string, value: string) => {
        const next = { ...selectedOptions, [optionName]: value };
        setSelectedOptions(next);
        setSelectedVariantByOptions(next);
    }, [selectedOptions, setSelectedVariantByOptions]);

    // No product
    if (!product) {
        return (
            <div data-node-id={nodeId} style={{
                padding: 20, background: T.surface, borderRadius: 12,
                border: `1px dashed ${T.border}`, color: T.textMuted,
                fontSize: 13, textAlign: 'center',
                fontFamily: "'Inter', sans-serif",
            }}>
                No product in context
            </div>
        );
    }

    // No options (single variant)
    if (!product.options || product.options.length === 0) {
        return null;
    }

    return (
        <div
            data-node-id={nodeId}
            style={{
                display: 'flex', flexDirection: 'column', gap: 20,
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {product.options.map(option => (
                <div key={option.name}>
                    {/* Option Label */}
                    {showLabels && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginBottom: 10,
                        }}>
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: T.textDim,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                            }}>
                                {option.name}
                            </span>
                            {selectedOptions[option.name] && (
                                <span style={{
                                    fontSize: 12, fontWeight: 600, color: T.text,
                                }}>
                                    {selectedOptions[option.name]}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Option Values */}
                    {layout === 'pills' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {option.values.map(value => {
                                const isSelected = selectedOptions[option.name] === value;
                                const isAvailable = availabilityMap[option.name]?.[value] ?? true;

                                return (
                                    <OptionPill
                                        key={value}
                                        value={value}
                                        isSelected={isSelected}
                                        isAvailable={isAvailable}
                                        showAvailability={showAvailability}
                                        onClick={() => handleOptionSelect(option.name, value)}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <select
                            value={selectedOptions[option.name] || ''}
                            onChange={e => handleOptionSelect(option.name, e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px',
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 10, color: T.text,
                                fontSize: 14, fontWeight: 500,
                                cursor: 'pointer', outline: 'none',
                                appearance: 'none',
                                fontFamily: 'inherit',
                            }}
                        >
                            {option.values.map(value => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    )}
                </div>
            ))}

            {/* Selected Variant Summary */}
            {showPrice && selectedVariant && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    background: T.accentDim, borderRadius: 10,
                    border: `1px solid ${T.accentGlow}`,
                }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                        ${selectedVariant.price.toFixed(2)}
                    </span>
                    {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                        <span style={{
                            fontSize: 14, color: T.textMuted,
                            textDecoration: 'line-through',
                        }}>
                            ${selectedVariant.compareAtPrice.toFixed(2)}
                        </span>
                    )}
                    {!selectedVariant.available && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, color: T.danger,
                            background: 'rgba(255,77,106,0.1)',
                            padding: '3px 10px', borderRadius: 6,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            Sold Out
                        </span>
                    )}
                    {selectedVariant.available && selectedVariant.sku && (
                        <span style={{
                            fontSize: 11, color: T.textMuted,
                            marginLeft: 'auto',
                        }}>
                            SKU: {selectedVariant.sku}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Option Pill ──────────────────────────────────────────────────────────────

const OptionPill: React.FC<{
    value: string;
    isSelected: boolean;
    isAvailable: boolean;
    showAvailability: boolean;
    onClick: () => void;
}> = ({ value, isSelected, isAvailable, showAvailability, onClick }) => {
    const [hov, setHov] = React.useState(false);

    const isDisabled = showAvailability && !isAvailable;

    return (
        <button
            onClick={isDisabled ? undefined : onClick}
            onMouseEnter={() => !isDisabled && setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: `1.5px solid ${isSelected ? T.accent
                        : hov ? T.textDim
                            : T.border
                    }`,
                background: isSelected ? T.accentDim : hov ? T.surface2 : T.surface,
                color: isDisabled ? T.textMuted
                    : isSelected ? T.accent
                        : T.text,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
                opacity: isDisabled ? 0.45 : 1,
                textDecoration: isDisabled ? 'line-through' : 'none',
                position: 'relative',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
                boxShadow: isSelected
                    ? `0 0 0 1px ${T.accentGlow}, 0 2px 8px ${T.accentDim}`
                    : 'none',
            }}
        >
            {value}
        </button>
    );
};

export default ProductOptions;
