import React from 'react';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { ChevronUp, ChevronDown, Copy, Trash2, GripVertical } from 'lucide-react';

interface BlockFloatingToolbarProps {
    nodeId: string;
    index: number;
    isSelected: boolean;
}

/**
 * 🛠️ BLOCK FLOATING TOOLBAR (Task 3.1)
 * High-performance pill that appears above the selected block.
 */
export const BlockFloatingToolbar: React.FC<BlockFloatingToolbarProps> = ({ nodeId, index, isSelected }) => {
    // 🛡️ High-Performance Store Action Selection (Industrial Rule)
    const moveNode = useBuilderStore(s => s.moveNode);
    const duplicateNode = useBuilderStore(s => s.duplicateNode);
    const deleteNode = useBuilderStore(s => s.deleteNode);

    if (!isSelected) return null;

    return (
        <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-[100] flex items-center bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 gap-1 animate-in slide-in-from-bottom-2 duration-300"
            style={{ pointerEvents: 'auto' }}
        >
            <div className="px-2 text-zinc-600 cursor-grab active:cursor-grabbing border-r border-zinc-800 mr-1 py-1">
                <GripVertical size={16} />
            </div>

            <ToolbarButton 
                onClick={() => moveNode(nodeId, 'up')} 
                icon={<ChevronUp size={16} />} 
                tooltip="Move Up" 
            />
            
            <ToolbarButton 
                onClick={() => moveNode(nodeId, 'down')} 
                icon={<ChevronDown size={16} />} 
                tooltip="Move Down" 
            />

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <ToolbarButton 
                onClick={() => duplicateNode(nodeId)} 
                icon={<Copy size={15} />} 
                tooltip="Duplicate" 
            />

            <ToolbarButton 
                onClick={() => deleteNode(nodeId)} 
                icon={<Trash2 size={16} className="text-red-500" />} 
                tooltip="Delete" 
                className="hover:bg-red-500/10"
            />
        </div>
    );
};

const ToolbarButton = ({ onClick, icon, tooltip, className = "" }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 group relative ${className}`}
        title={tooltip}
    >
        {icon}
        {/* Tooltip on hover */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold uppercase tracking-wider">
            {tooltip}
        </span>
    </button>
);
