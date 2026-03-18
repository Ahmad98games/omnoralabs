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
        <div className="flex flex-col h-full bg-[#0A0A0A] text-white font-sans">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <Layers size={14} className="text-[#D4AF37]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Page Structure</span>
            </div>

            {blocks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-white/30 font-mono">
                    No sections on this page.
                </div>
            ) : (
                <Reorder.Group 
                    axis="y" 
                    values={blocks} 
                    onReorder={handleReorder}
                    className="flex-1 overflow-y-auto px-2 py-3 space-y-2"
                >
                    {blocks.map((id) => {
                        const node = nodes[id];
                        if (!node) return null;
                        const isSelected = selectedNodeId === id;

                        return (
                            <Reorder.Item 
                                key={id} 
                                value={id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors
                                    ${selectedNodeId === id ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : 'bg-[#141416] border-white/5 hover:border-white/10'}
                                `}
                                onClick={() => selectNode(id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-white/30 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-semibold text-white/90 capitalize">
                                            {node.type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[9px] font-mono text-white/40">
                                            {id.split('_').pop()}
                                        </span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                                    className="text-white/30 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                                >
                                    <Trash2 size={12} />
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
