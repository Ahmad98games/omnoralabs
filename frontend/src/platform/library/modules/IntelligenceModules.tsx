import React, { useState, useEffect } from 'react';
import { History, Plus, Globe, ChevronDown } from 'lucide-react';
import { useOmnora } from '../../client/OmnoraContext';
import { EditableText } from '../EditableComponents';

/**
 * OmnoraRecentlyViewed: Dynamic product tracking slider.
 */
export const OmnoraRecentlyViewed: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes, mode } = useOmnora();
    const node = nodes[nodeId];
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (mode === 'edit') {
            // Mock data for builder
            setProducts([
                { id: 'm1', name: 'Product Alpha', price: 120, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' },
                { id: 'm2', name: 'Product Beta', price: 95, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' },
                { id: 'm3', name: 'Product Gamma', price: 210, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200' },
                { id: 'm4', name: 'Product Delta', price: 45, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' }
            ]);
        } else {
            // Actual localStorage logic in production
            try {
                const stored = localStorage.getItem('omnora_recently_viewed');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setProducts(parsed.slice(0, 4));
                    }
                }
            } catch (err) {
                console.error('Failed to parse recently viewed products:', err);
            }
        }
    }, [mode]);

    if (!node) return null;

    return (
        <section className="omnora-recently-viewed" style={{ padding: '60px 0', ...node.styles }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <EditableText nodeId={nodeId} path="props.title" style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {(products || []).map(p => (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <img src={p.img} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }} alt="" />
                        <div style={{ fontSize: '11px', fontWeight: 900, marginBottom: '4px' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>${p.price}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

/**
 * OmnoraUpsellBundle: High-conversion cross-sell block.
 */
export const OmnoraUpsellBundle: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const node = nodes[nodeId];

    if (!node) return null;

    const mainImg = node.props?.mainImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
    const accImg = node.props?.accessoryImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';

    return (
        <div className="omnora-upsell-bundle" style={{
            background: node.styles?.background || '#0a0a0b',
            border: '1px solid #1a1a1b',
            padding: '30px',
            borderRadius: node.styles?.borderRadius || '8px',
            ...node.styles
        }}>
            <div style={{ marginBottom: '20px' }}>
                <EditableText nodeId={nodeId} path="props.bundleTitle" style={{ fontSize: '12px', fontWeight: 900 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ width: '45%', position: 'relative' }}>
                    <img src={mainImg} style={{ width: '100%', borderRadius: '4px' }} alt="Main" />
                </div>
                <Plus size={20} color="var(--accent-primary)" />
                <div style={{ width: '35%', position: 'relative' }}>
                    <img src={accImg} style={{ width: '100%', borderRadius: '4px' }} alt="Accessory" />
                </div>
            </div>

            <button style={{
                width: '100%',
                padding: '18px',
                background: 'var(--accent-primary)',
                color: '#000',
                border: 'none',
                fontWeight: 900,
                fontSize: '11px',
                letterSpacing: '0.1em',
                cursor: 'pointer'
            }}>
                <EditableText nodeId={nodeId} path="props.buttonText" tag="span" />
            </button>
        </div>
    );
};

/**
 * OmnoraGeoSwitcher: Globalization selector.
 */
export const OmnoraGeoSwitcher: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const node = nodes[nodeId];

    if (!node) return null;

    return (
        <div className="omnora-geo-switcher" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', cursor: 'pointer', opacity: 0.8, ...node.styles }}>
            <Globe size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em' }}>
                <EditableText nodeId={nodeId} path="props.displayValue" tag="span" />
            </span>
            <ChevronDown size={10} strokeWidth={3} />
        </div>
    );
};
