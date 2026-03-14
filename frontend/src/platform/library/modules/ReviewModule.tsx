import React from 'react';
import { useBuilder } from '../../../context/BuilderContext';
import { Quote, User, Star, ShieldCheck, Image as ImageIcon } from 'lucide-react';

export const ReviewModule: React.FC = () => {
    const { selectedNodeId, nodeTree, updateNode, commitHistory } = useBuilder();
    const node = selectedNodeId ? nodeTree[selectedNodeId] : null;

    if (!node || node.type !== 'reviews') return null;

    const updateProp = (key: string, value: any) => {
        updateNode(node.id, `props.${key}`, value);
    };

    return (
        <div className="module-container">
            {/* Review Content */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Quote size={12} /> TESTIMONIAL CONTENT
                </span>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>REVIEW TEXT</label>
                    <textarea
                        autoFocus
                        value={node.props.review1 || ''}
                        onChange={(e) => updateProp('review1', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px', minHeight: '80px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>AUTHOR NAME</label>
                        <input
                            type="text"
                            value={node.props.author1 || ''}
                            onChange={(e) => updateProp('author1', e.target.value)}
                            onBlur={commitHistory}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>AUTHOR AVATAR URL</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={node.props.avatar1 || ''}
                                onChange={(e) => updateProp('avatar1', e.target.value)}
                                onBlur={commitHistory}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px', paddingRight: '28px' }}
                            />
                            <ImageIcon size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratings & Badges */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Star size={12} /> TRUST SIGNALS
                </span>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, display: 'block', marginBottom: '6px' }}>STAR RATING (1-5)</label>
                    <input
                        type="range" min="1" max="5" step="1"
                        value={node.props.rating1 || 5}
                        onChange={(e) => updateProp('rating1', parseInt(e.target.value))}
                        onBlur={commitHistory}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px', gap: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill={i < (node.props.rating1 || 5) ? 'var(--accent-primary)' : 'transparent'} color={i < (node.props.rating1 || 5) ? 'var(--accent-primary)' : '#333'} />
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={14} color="#4ade80" />
                        <span style={{ fontSize: '11px' }}>VERIFIED CUSTOMER</span>
                    </div>
                    <button
                        onClick={() => updateProp('isVerified1', !node.props.isVerified1)}
                        style={{
                            width: '32px', height: '16px', borderRadius: '10px',
                            background: node.props.isVerified1 ? 'var(--accent-primary)' : '#333',
                            position: 'relative', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '2px', left: node.props.isVerified1 ? '18px' : '2px',
                            width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                        }} />
                    </button>
                </div>
            </div>
        </div>
    );
};
