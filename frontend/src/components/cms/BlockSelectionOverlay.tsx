import React from 'react';
import { useBuilderStore } from '../../stores/useBuilderStore';

interface BlockSelectionOverlayProps {
    nodeId: string;
    isSelected: boolean;
    isDragging: boolean;
}

/**
 * 🎯 BLOCK SELECTION OVERLAY (Task 3.1)
 * Handles click-to-select and renders the selection ring.
 * Never modifies block layout or dimensions.
 */
export const BlockSelectionOverlay: React.FC<BlockSelectionOverlayProps> = ({ nodeId, isSelected, isDragging }) => {
    // 🛡️ High-Performance Store Action Selection (Industrial Rule)
    const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId);

    return (
        <div 
            onClick={(e) => { e.stopPropagation(); setSelectedNodeId(nodeId); }}
            className={`absolute inset-0 z-50 transition-all duration-300 pointer-events-auto cursor-pointer
                ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black z-[60] !pointer-events-none' : 'hover:bg-orange-500/5'}
                ${isDragging ? 'opacity-0' : 'opacity-100'}
            `}
            style={{ 
                borderRadius: 'inherit',
                boxShadow: isSelected ? '0 0 0 4px rgba(255, 107, 53, 0.2)' : 'none'
            }}
        />
    );
};
