import React, { useState, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Globe, Plus, ChevronDown, ChevronUp, RotateCcw, AlertTriangle } from 'lucide-react';
import { AddPageModal } from './AddPageModal';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { nodeStore } from '../../platform/core/NodeStore';
import { useSyncExternalStore } from 'react';

const T = {
    bg:        'var(--surface-overlay)',
    border:    'var(--border-subtle)',
    text:      'var(--text-primary)',
    muted:     'var(--text-secondary)',
    accent:    'var(--accent-primary)',
    accentSub: 'var(--accent-subtle)',
    danger:    'var(--danger)',
    success:   'var(--success)',
    warning:   'var(--warning)',
} as const;

export const TopBarPageSelector: React.FC = () => {
    const {
        pages, activePageId, setActivePageId, deletePage
    } = useBuilder();

    const nodes = useBuilderStore(state => state.nodes);
    const pageLayouts = useSyncExternalStore(
        React.useCallback((onStoreChange: () => void) => nodeStore.subscribe(onStoreChange), []),
        () => nodeStore.getState().pageLayouts
    );

    const [isOpen, setIsOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    const safePages = pages?.byId ?? {};
    const pageIds = pages?.allIds ?? [];

    const systemPages = pageIds.filter((id: string) => safePages[id]?.type === 'system');
    const templatePages = pageIds.filter((id: string) => safePages[id]?.type === 'template');
    const customPages = pageIds.filter((id: string) => safePages[id]?.type === 'custom');

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        return (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 6px', whiteSpace: 'nowrap', flex: 1, alignItems: 'center' }}>
                {pageIds.map((id) => {
                    const p = safePages[id];
                    const isActive = id === activePageId;
                    if (!p) return null;
                    return (
                        <button
                            key={id}
                            onClick={() => setActivePageId(id)}
                            style={{
                                padding: '6px 14px', borderRadius: '20px', 
                                background: isActive ? T.accentSub : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${isActive ? T.accent : 'rgba(0,0,0,0.05)'}`,
                                color: isActive ? T.accent : '#d1d5db',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s', flexShrink: 0
                            }}
                        >
                            {p.title}
                        </button>
                    );
                })}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                        width: 32, height: 32, borderRadius: '50%', 
                        background: 'rgba(0,0,0,0.03)',
                        border: `1px solid rgba(0,0,0,0.05)`,
                        color: T.muted, cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <Plus size={14} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Page Picker Trigger */}
            <button
                ref={btnRef}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: 32, padding: '0 10px',
                    background: isOpen ? T.accentSub : 'transparent',
                    border: `1px solid ${isOpen ? T.accent : T.border}`,
                    borderRadius: '7px 0 0 7px', color: isOpen ? T.accent : T.muted,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0,
                    transition: 'all 0.15s'
                }}
            >
                <Globe size={13} />
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {safePages[activePageId]?.title || activePageId || 'Home'}
                </span>
                {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {/* Plus Icon Trigger for AddPageModal */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                    height: 32, width: 32,
                    background: 'transparent',
                    border: `1px solid ${T.border}`,
                    borderLeft: 'none',
                    borderRadius: '0 7px 7px 0', color: T.muted,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                }}
                onMouseOver={e => (e.currentTarget.style.color = T.accent)}
                onMouseOut={e => (e.currentTarget.style.color = T.muted)}
            >
                <Plus size={14} />
            </button>

            {/* Dropdown Menu Portalled or Absolute */}
            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                    <div
                        style={{
                            position: 'absolute',
                            top: 44,
                            left: 140, // Position relative to layout start
                            background: 'var(--surface-overlay)', border: `1px solid ${T.border}`,
                            borderRadius: 10, minWidth: 220, padding: 6,
                            zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            maxHeight: '350px', overflowY: 'auto'
                        }}
                    >
                        {[
                            { label: 'System Pages', ids: systemPages },
                            { label: 'Templates', ids: templatePages },
                            { label: 'Custom Pages', ids: customPages }
                        ].map((group: any) => group.ids.length > 0 && (
                            <div key={group.label} style={{ marginBottom: 12 }}>
                                <p style={{
                                    fontSize: 9, fontWeight: 900, color: T.muted,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    padding: '0 8px', marginBottom: 6, opacity: 0.6
                                }}>{group.label}</p>
                                {group.ids.map((id: string) => {
                                    const p = safePages[id];
                                    const isActive = id === activePageId;
                                    return (
                                        <div key={id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <button
                                                onClick={() => { setActivePageId(id); setIsOpen(false); }}
                                                style={{
                                                    flex: 1, padding: '8px 10px',
                                                    background: isActive ? T.accentSub : 'none',
                                                    border: 'none', borderRadius: 7,
                                                    color: isActive ? T.accent : 'var(--text-primary)',
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {(() => {
                                                    const layout = pageLayouts?.[id] || [];
                                                    const isCorrupted = layout.length > 0 && layout.some((nodeId: string) => !nodes[nodeId]);
                                                    
                                                    if (isCorrupted) {
                                                        return <AlertTriangle size={12} style={{ color: T.danger, flexShrink: 0 }} title="Broken Layout Nodes Map" />;
                                                    }
                                                    return (
                                                        <div style={{
                                                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                                            background: (p.status || 'draft') === 'live' ? T.success : T.warning,
                                                        }} />
                                                    );
                                                })()}
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{p.title}</span>
                                                    <span style={{ fontSize: 10, opacity: 0.5 }}>{p.slug}</span>
                                                </div>
                                            </button>

                                            {!p.isLocked && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deletePage(id); }}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6, background: 'none',
                                                        border: 'none', color: T.muted, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                    onMouseOver={e => (e.currentTarget.style.color = T.danger)}
                                                    onMouseOut={e => (e.currentTarget.style.color = T.muted)}
                                                >
                                                    <RotateCcw size={12} style={{ transform: 'rotate(45deg)' }} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Add Page Modal Trigger */}
            <AddPageModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
        </div>
    );
};
