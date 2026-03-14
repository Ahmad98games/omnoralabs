import React from 'react';
import { useBuilder } from '../../../context/BuilderContext';
import { Layout, Bell, Menu } from 'lucide-react';
import { LogoPicker } from '../../../components/media/LogoPicker';

export const HeaderModule: React.FC = () => {
    const { selectedNodeId, nodeTree, updateNode, commitHistory } = useBuilder();
    const node = selectedNodeId ? nodeTree[selectedNodeId] : null;

    if (!node || node.type !== 'header') return null;

    const updateProp = (key: string, value: any) => {
        updateNode(node.id, `props.${key}`, value);
    };

    return (
        <div className="module-container">
            {/* Logo Settings */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Layout size={12} /> BRAND IDENTITY
                </span>

                <LogoPicker
                    value={node.props.logoUrl}
                    onChange={(url) => updateProp('logoUrl', url)}
                    label="Brand Logo"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LOGO WIDTH</span>
                        <input
                            type="text"
                            value={node.props.logoWidth || '120px'}
                            onChange={(e) => updateProp('logoWidth', e.target.value)}
                            onBlur={commitHistory}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '11px' }}
                        />
                    </div>
                    <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>STICKY</span>
                        <select
                            value={String(node.props.sticky || false)}
                            onChange={(e) => updateProp('sticky', e.target.value === 'true')}
                            onBlur={commitHistory}
                            style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '6px', fontSize: '11px' }}
                        >
                            <option value="true">YES</option>
                            <option value="false">NO</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Menu Layout */}
            <div className="module-section" style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Menu size={12} /> NAVIGATION LAYOUT
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['left', 'center', 'split'].map(align => (
                        <button
                            key={align}
                            onClick={() => updateProp('menuAlignment', align)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: node.props.menuAlignment === align ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${node.props.menuAlignment === align ? 'var(--accent-primary)' : '#333'}`,
                                color: node.props.menuAlignment === align ? 'var(--accent-primary)' : '#fff',
                                fontSize: '9px',
                                fontWeight: 800,
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                            }}
                        >
                            {align}
                        </button>
                    ))}
                </div>
            </div>

            {/* Announcement Bar */}
            <div className="module-section">
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Bell size={12} /> ANNOUNCEMENT BAR
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px' }}>ENABLE PROMO BAR</span>
                    <button
                        onClick={() => updateProp('showAnnouncement', !node.props.showAnnouncement)}
                        style={{
                            width: '32px',
                            height: '16px',
                            borderRadius: '10px',
                            background: node.props.showAnnouncement ? 'var(--accent-primary)' : '#333',
                            position: 'relative',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '2px',
                            left: node.props.showAnnouncement ? '18px' : '2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s'
                        }} />
                    </button>
                </div>
                {node.props.showAnnouncement && (
                    <textarea
                        value={node.props.announcementText || ''}
                        onChange={(e) => updateProp('announcementText', e.target.value)}
                        onBlur={commitHistory}
                        placeholder="Free shipping on orders over $100..."
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '11px', minHeight: '60px' }}
                    />
                )}
            </div>
        </div>
    );
};
