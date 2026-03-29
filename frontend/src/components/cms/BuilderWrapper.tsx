import React, { useCallback, useState } from 'react';
import { useOmnora } from '../../context/OmnoraContext';

export const BuilderWrapper: React.FC<{ nodeId: string; children: React.ReactNode }> = ({ nodeId, children }) => {
    const { mode, selectedNodeId, selectNode, nodes, viewport, isBuilderActive } = useOmnora();
    const node = nodes[nodeId];
    const [isHovered, setIsHovered] = useState(false);

    const isSelected = selectedNodeId === nodeId;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [isBuilderActive, mode, nodeId, selectNode]);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    return (
        <div
            className={`builder-wrapper ${isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-node-id={nodeId}
            style={{
                position: 'relative',
                outline: mode === 'edit' && isSelected ? '2px solid #005bd3' : mode === 'edit' && isHovered ? '1px solid rgba(0,91,211,0.5)' : 'none',
                outlineOffset: '-2px',
                opacity: isHiddenOnDevice ? 0.3 : 1,
                display: (isHiddenOnDevice && mode === 'preview') ? 'none' : 'block',
                cursor: mode === 'edit' ? 'pointer' : 'default',
            }}
        >
            {mode === 'edit' && isSelected && (
                <div style={{
                    position: 'absolute', top: 0, left: 0,
                    background: '#005bd3', color: '#fff', fontSize: '10px',
                    padding: '2px 6px', fontWeight: 'bold', zIndex: 100,
                    pointerEvents: 'none'
                }}>
                    Section Selected
                </div>
            )}
            
            {mode === 'edit' && isHiddenOnDevice && (
                <span style={{
                    position: 'absolute', top: 0, right: 0, zIndex: 100,
                    fontSize: 8, background: 'var(--accent-primary)',
                    color: '#000', padding: '2px 4px', fontWeight: 900,
                }}>HIDDEN</span>
            )}
            
            {children}
            
            {/* Outline blocker to prevent accidental clicks passing through if necessary in block-level selection */}
            {mode === 'edit' && <div style={{position: 'absolute', inset:0, zIndex: 10, pointerEvents: 'none'}} />}
        </div>
    );
};