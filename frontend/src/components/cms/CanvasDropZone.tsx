import React, { useState } from 'react';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { Plus } from 'lucide-react';

interface CanvasDropZoneProps {
    index: number;
    pageId: string;
}

/**
 * 📍 CANVAS DROP ZONE (Task 3.1)
 * Renders between blocks and handles drag-and-drop insertion.
 * Shows horizontal line on dragOver.
 */
export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({ index, pageId }) => {
    const [isOver, setIsOver] = useState(false);
    const addNode = useBuilderStore(s => s.addNode);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        
        const type = e.dataTransfer.getData('text/plain');
        if (!type) return;

        // 🛡️ INDUSTRIAL HYDRATION (Task 3.1)
        // addNode in store handles default props via Registry
        addNode({
            type,
            pageId,
            index,
        });
    };

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full transition-all duration-300 relative group
                ${isOver ? 'h-32 my-4' : 'h-4 hover:h-8'}
            `}
        >
            {/* Insertion Line */}
            <div 
                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-300
                    ${isOver ? 'bg-orange-500 scale-x-100 opacity-100' : 'bg-orange-500/20 scale-x-[0.9] opacity-0 group-hover:opacity-100'}
                `} 
            />

            {/* Insertion Indicator Pill */}
            {isOver && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold animate-in zoom-in duration-300 shadow-2xl">
                    <Plus size={14} /> Insert Block Here
                </div>
            )}
        </div>
    );
};
