import React, { useState, useMemo } from 'react';
import { useOmnora } from '../../client/OmnoraContext';
import { EditableText } from '../EditableComponents';
import { useQuery } from '@tanstack/react-query';
import { databaseClient } from '../../../platform/core/DatabaseClient';
import { ProductCard } from '../../../components/cart/ProductCard';
import { StorefrontProvider } from '../../../context/StorefrontContext';

/**
 * OmnoraProductGrid: Flexible layout engine with Standard/Mesh support.
 */
export const OmnoraProductGrid: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes, viewport, mode } = useOmnora();
    const node = nodes[nodeId];

    const tenantId = (window as any).__OMNORA_TENANT_ID__ || 'default_tenant';

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', tenantId],
        queryFn: () => databaseClient.getProductsByMerchant(tenantId),
        enabled: !!tenantId,
    });

    if (!node) return null;

    const isMesh = node.props?.layout === 'mesh';
    const viewportMap: Record<string, 'base' | 'md' | 'sm'> = { desktop: 'base', tablet: 'md', mobile: 'sm' };
    const vp = viewportMap[viewport] || 'base';
    const cols = node.responsive?.[vp]?.columns || (viewport === 'desktop' ? 4 : viewport === 'tablet' ? 2 : 1);

    const filteredProducts = useMemo(() => {
        if (node.props?.selectionMode === 'specific' && node.props?.productIds?.length > 0) {
            return node.props.productIds.map((id: string) => products.find(p => p.id === id)).filter(Boolean);
        }
        if (node.props?.category_id) {
            return products.filter((p: any) => p.category_id === node.props.category_id);
        }
        return products;
    }, [products, node.props?.selectionMode, node.props?.productIds, node.props?.category_id]);

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: node.styles?.gap || '30px',
        alignItems: isMesh ? 'start' : 'stretch',
        ...node.styles
    };

    if (isLoading) return <div className="p-20 text-center opacity-20">FETCHING COLLECTION...</div>;

    return (
        <section className="omnora-product-grid" style={{ padding: '60px 0' }}>
            <div style={gridStyle}>
                {filteredProducts.map((product: any, i: number) => (
                    <StorefrontProvider key={product.id} scopedProduct={product}>
                        <div style={{
                            height: isMesh && i % 2 === 0 ? '450px' : '400px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '20px',
                            transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)'
                        }} className="group">
                            <img 
                                src={product.featured_image} 
                                alt={product.title} 
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                            
                            <div className="relative z-10">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-gold)] block mb-1">
                                    {product.type || 'LUXURY PIECE'}
                                </span>
                                <h3 className="text-sm font-bold text-white mb-2">{product.title}</h3>
                                <div className="text-xs font-medium text-gray-400">
                                    ${product.price.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </StorefrontProvider>
                ))}
                
                {mode === 'edit' && filteredProducts.length === 0 && (
                    <div className="col-span-full p-20 border border-dashed border-white/10 text-center text-gray-500 rounded-2xl">
                        NO PRODUCTS FOUND IN THIS COLLECTION
                    </div>
                )}
            </div>
        </section>
    );
};

/**
 * OmnoraMediaGallery: Product visualizer with Lens Zoom and thumbnail scroll.
 */
export const OmnoraMediaGallery: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const node = nodes[nodeId];

    if (!node) return null;

    const images = node.props?.images || ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1000'];

    const isHoveredForced = node.forcedState === 'hover';
    const showZoom = isHovered || isHoveredForced;

    return (
        <div className="omnora-media-gallery" style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...node.styles }}>
            <div
                className="main-visual-container"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    background: '#0a0a0b',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'crosshair'
                }}
            >
                <img
                    src={images[activeIndex]}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: showZoom ? 'scale(1.15)' : 'scale(1)',
                        transition: `transform ${node.motion?.duration || 400}ms ${node.motion?.curve || 'cubic-bezier(0.4, 0, 0.2, 1)'}`
                    }}
                    alt="Main Visual"
                />
            </div>

            <div className="thumbnail-row" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {images.map((img: string, idx: number) => (
                    <div
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        style={{
                            width: '80px',
                            height: '100px',
                            flexShrink: 0,
                            border: `2px solid ${activeIndex === idx ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer',
                            opacity: activeIndex === idx ? 1 : 0.6,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Thumb" />
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * OmnoraVariantSelector: Multi-state size/color choice node.
 */
export const OmnoraVariantSelector: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const [selected, setSelected] = useState<string | null>(null);
    const node = nodes[nodeId];

    if (!node) return null;

    const variants = node.props?.variants || ['S', 'M', 'L', 'XL'];

    return (
        <div className="omnora-variant-selector" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', color: '#555' }}>SELECT SIZE</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {variants.map((v: string) => {
                    const isSelected = selected === v;
                    const isDisabled = node.props?.disabledVariants?.includes(v);

                    return (
                        <button
                            key={v}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setSelected(v)}
                            style={{
                                padding: '12px 20px',
                                background: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: isSelected ? '#000' : (isDisabled ? '#333' : '#fff'),
                                fontSize: '11px',
                                fontWeight: 900,
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                opacity: isDisabled ? 0.3 : 1,
                                textDecoration: isDisabled ? 'line-through' : 'none'
                            }}
                        >
                            {v}
                        </button>
                    );
                })}
            </div>
            {selected && (
                <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', marginTop: '4px' }}>
                    READY FOR DISPATCH: {selected}
                </div>
            )}
        </div>
    );
};
