import React from 'react';
import { useBuilder } from '../../../context/BuilderContext';
import { Megaphone, ExternalLink, Palette, Clock } from 'lucide-react';

export const PromoModule: React.FC = () => {
    const { selectedNodeId, nodeTree, updateNode, commitHistory } = useBuilder();
    const node = selectedNodeId ? nodeTree[selectedNodeId] : null;

    if (!node || node.type !== 'promo_banner') return null;

    const updateProp = (key: string, value: any) => {
        updateNode(node.id, `props.${key}`, value);
    };

    return (
        <div className="module-container">
            {/* Banner Content */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Megaphone size={12} /> BANNER CONTENT
                </span>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>CAMPAIGN MESSAGE</label>
                    <textarea
                        autoFocus
                        value={node.props.message || ''}
                        onChange={(e) => updateProp('message', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px', minHeight: '60px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>CTA TEXT</label>
                        <input
                            type="text"
                            value={node.props.ctaText || 'SHOP NOW'}
                            onChange={(e) => updateProp('ctaText', e.target.value)}
                            onBlur={commitHistory}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>LINK URL</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={node.props.ctaLink || '#'}
                                onChange={(e) => updateProp('ctaLink', e.target.value)}
                                onBlur={commitHistory}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px', paddingRight: '28px' }}
                            />
                            <ExternalLink size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Style */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Palette size={12} /> APPEARANCE
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px' }}>SHOW DISMISS BUTTON</span>
                    <button
                        onClick={() => updateProp('isDismissible', !node.props.isDismissible)}
                        style={{
                            width: '32px', height: '16px', borderRadius: '10px',
                            background: node.props.isDismissible ? 'var(--accent-primary)' : '#333',
                            position: 'relative', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '2px', left: node.props.isDismissible ? '18px' : '2px',
                            width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                        }} />
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px' }}>STICKY TO TOP</span>
                    <button
                        onClick={() => updateProp('isSticky', !node.props.isSticky)}
                        style={{
                            width: '32px', height: '16px', borderRadius: '10px',
                            background: node.props.isSticky ? 'var(--accent-primary)' : '#333',
                            position: 'relative', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '2px', left: node.props.isSticky ? '18px' : '2px',
                            width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                        }} />
                    </button>
                </div>
            </div>

            {/* Countdown / Schedule */}
            <div className="module-section">
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Clock size={12} /> URGENCY (OPTIONAL)
                </span>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>EXPIRY DATE</label>
                    <input
                        type="datetime-local"
                        value={node.props.expiryDate || ''}
                        onChange={(e) => updateProp('expiryDate', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '8px', fontSize: '11px' }}
                    />
                </div>
            </div>
        </div>
    );
};
