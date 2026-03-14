import React from 'react';
import { useBuilder } from '../../../context/BuilderContext';
import { Brain, Sparkles, Globe } from 'lucide-react';

/**
 * IntelligenceEditor: Property configuration for AI/Intelligence blocks.
 * Isolated from the platform core.
 */
export const IntelligenceEditor: React.FC = () => {
    const { selectedNodeId, nodeTree, updateNode, commitHistory } = useBuilder();
    const node = selectedNodeId ? nodeTree[selectedNodeId] : null;

    if (!node) return null;

    const updateProp = (key: string, value: any) => {
        updateNode(node.id, `props.${key}`, value);
    };

    return (
        <div className="module-container" style={{ padding: '1rem' }}>
            {/* Context Intelligence */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Brain size={12} /> ENGINE CONFIGURATION
                </span>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '11px', color: '#fff', marginBottom: '8px' }}>Tracking Logic</div>
                    <select
                        value={node.props.logic || 'standard'}
                        onChange={(e) => updateProp('logic', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '6px', fontSize: '11px' }}
                    >
                        <option value="standard">Standard (Default)</option>
                        <option value="aggressive">Aggressive (Real-time)</option>
                        <option value="ai_assisted">Omnora AI (Predictive)</option>
                    </select>
                </div>
            </div>

            {/* Visual Tuning */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Sparkles size={12} /> VISUAL TUNING
                </span>

                <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>WIDGET TITLE</span>
                    <input
                        type="text"
                        value={node.props.title || ''}
                        onChange={(e) => updateProp('title', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px' }}>SHOW AVATARS</span>
                    <button
                        onClick={() => updateProp('showAvatars', !node.props.showAvatars)}
                        style={{
                            width: '32px', height: '16px', borderRadius: '10px',
                            background: node.props.showAvatars ? 'var(--accent-primary)' : '#333',
                            position: 'relative', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '2px', left: node.props.showAvatars ? '18px' : '2px',
                            width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                        }} />
                    </button>
                </div>
            </div>
        </div>
    );
};
