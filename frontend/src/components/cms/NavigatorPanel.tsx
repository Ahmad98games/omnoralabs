import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { useBuilder } from '../../context/BuilderContext';
import { getRegistryEntry } from './BuilderRegistry';
import { Layers, GripVertical, Trash2 } from 'lucide-react';

export const NavigatorPanel: React.FC = () => {
    const { pageLayouts, activePageId, reorderPageLayout, nodes, deleteNode, selectNode, selectedNodeId } = useBuilder();
    
    const blocks = pageLayouts[activePageId] || [];

    const handleReorder = (newOrder: string[]) => {
        reorderPageLayout(newOrder);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-overlay)', fontFamily: 'var(--font-sans)' }}>
            {blocks.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
                    No sections on this page.
                </div>
            ) : (
                <Reorder.Group 
                    axis="y" 
                    values={blocks} 
                    onReorder={handleReorder}
                    style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                    {blocks.map((id) => {
                        const node = nodes[id];
                        if (!node) return null;
                        const isSel = selectedNodeId === id;

                        return (
                            <Reorder.Item 
                                key={id} 
                                value={id}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                    background: 'var(--surface-raised)',
                                    border: `2px solid ${isSel ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                    boxShadow: isSel ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                                    transition: 'all 0.1s'
                                }}
                                onClick={() => selectNode(id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ color: 'var(--text-tertiary)', cursor: 'grab' }}>
                                        <GripVertical size={14} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                            {node.type.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                            #{id.split('_').pop()}
                                        </span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                                    style={{
                                        background: 'none', border: 'none', padding: 4, borderRadius: 4,
                                        color: 'var(--text-tertiary)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseOver={e => (e.currentTarget.style.color = 'var(--danger)')}
                                    onMouseOut={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            )}
        </div>
    );
};

export default NavigatorPanel;
