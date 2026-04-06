import React, { useCallback, useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Plus } from 'lucide-react';

interface CanvasDropZoneProps {
    index: number;
    pageId: string;
}

/**
 * 📍 CANVAS DROP ZONE
 *
 * Handles drag-and-drop insertion of blocks between existing canvas nodes.
 * Previously broken: it called useBuilderStore(s => s.addNode) which expects
 * a full BuilderNode shape, but was passed { type, pageId, index } — causing
 * a silent no-op and a crash when nodes[activeId] was undefined on empty pages.
 *
 * Fix: delegate entirely to BuilderContext.addNode which:
 *   1. Resolves the type through COMPONENT_ALIASES
 *   2. Validates against the registry (reportRegistryError on miss)
 *   3. Hydrates default props from the registered schema
 *   4. Inserts at the correct index in pageLayouts
 *   5. Commits to history for undo/redo
 */
export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({ index, pageId }) => {
    const [isOver, setIsOver] = useState(false);
    const { addNode } = useBuilder();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only fire leave when the cursor exits the actual zone div,
        // not when it crosses a child element boundary.
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            setIsOver(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);

        const type = e.dataTransfer.getData('text/plain');
        if (!type?.trim()) return;

        // addNode(type, props, parentId, insertionIndex)
        // parentId = null → root-level page block
        // insertionIndex = index → position in pageLayouts[activePageId]
        addNode(type, {}, null, index);
    }, [addNode, index]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-drop-index={index}
            data-page-id={pageId}
            className={`w-full transition-all duration-200 relative group
                ${isOver ? 'h-24 my-3' : 'h-3 hover:h-6'}
            `}
        >
            {/* Insertion rail */}
            <div
                className={`absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-all duration-200
                    ${isOver
                        ? 'bg-orange-500 opacity-100 scale-x-100'
                        : 'bg-orange-500/25 opacity-0 group-hover:opacity-100 scale-x-95 group-hover:scale-x-100'
                    }`}
            />

            {/* Drop indicator pill — only when actively dragging over */}
            {isOver && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                    bg-zinc-900 border border-orange-500/60 text-orange-400
                    px-4 py-1.5 rounded-full flex items-center gap-1.5
                    text-[11px] font-bold tracking-wide shadow-2xl
                    animate-in zoom-in-90 duration-150 pointer-events-none"
                >
                    <Plus size={12} strokeWidth={2.5} />
                    Drop to insert
                </div>
            )}
        </div>
    );
};