import React from 'react';
import { useOmnora } from '../../client/OmnoraContext';
import { Box, Tag, DollarSign, Star } from 'lucide-react';

export const FeatureModule: React.FC = () => {
    const { selectedNodeId, nodes, updateNode, commitHistory } = useOmnora();
    const node = selectedNodeId ? nodes[selectedNodeId] : null;

    if (!node || node.type !== 'featured_product') return null;

    const updateProp = (key: string, value: any) => {
        updateNode?.(node.id, `props.${key}`, value);
    };

    return (
        <div className="module-container">
            {/* Product Meta */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Box size={12} /> PRODUCT IDENTITY
                </span>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>PRODUCT TITLE</label>
                    <input
                        autoFocus
                        type="text"
                        value={node.props.title || ''}
                        onChange={(e) => updateProp('title', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px' }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>DESCRIPTION OVERRIDE</label>
                    <textarea
                        value={node.props.description || ''}
                        onChange={(e) => updateProp('description', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px', minHeight: '60px' }}
                    />
                </div>
            </div>

            {/* Commerce Toggles */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <DollarSign size={12} /> PRICE & SALES
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px' }}>SHOW PRICE</span>
                    <button
                        onClick={() => updateProp('showPrice', !node.props.showPrice)}
                        style={{
                            width: '32px', height: '16px', borderRadius: '10px',
                            background: node.props.showPrice ? 'var(--accent-primary)' : '#333',
                            position: 'relative', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '2px', left: node.props.showPrice ? '18px' : '2px',
                            width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                        }} />
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px' }}>ENABLE QUICK BUY</span>
                    <button
                        onClick={() => updateProp('enableQuickBuy', !node.props.enableQuickBuy)}
                        style={{
                            width: '32px', height: '16px', borderRadius: '10px',
                            background: node.props.enableQuickBuy ? 'var(--accent-primary)' : '#333',
                            position: 'relative', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '2px', left: node.props.enableQuickBuy ? '18px' : '2px',
                            width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                        }} />
                    </button>
                </div>
            </div>

            {/* Badges & Trust */}
            <div className="module-section">
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Tag size={12} /> MERCHANDISING
                </span>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>BADGE TEXT (e.g. BESTSELLER)</label>
                    <input
                        type="text"
                        value={node.props.badgeText || ''}
                        onChange={(e) => updateProp('badgeText', e.target.value)}
                        onBlur={commitHistory}
                        placeholder="OFFERING 20% OFF"
                        style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '8px', fontSize: '11px' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Star size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '10px' }}>SHOW CUSTOMER RATING</span>
                    <input
                        type="checkbox"
                        checked={node.props.showRating}
                        onChange={(e) => updateProp('showRating', e.target.checked)}
                        style={{ marginLeft: 'auto' }}
                    />
                </div>
            </div>
        </div>
    );
};
