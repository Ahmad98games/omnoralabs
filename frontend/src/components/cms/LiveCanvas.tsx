import React from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { CanvasBlock } from './CanvasBlock';
import { CanvasDropZone } from './CanvasDropZone';
import { Loader2, PlusSquare } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

/**
 * 🎨 LIVE CANVAS — Omnora Kernel Renderer
 *
 * State Authority: BuilderContext (NodeStore) — the single source of truth.
 * This component deliberately does NOT read from useBuilderStore.
 * All node mutations (addNode, deleteNode, reorder) write to NodeStore via
 * BuilderContext. Reading from the same authority eliminates the dual-store
 * desync that caused "PAGE REGISTRY EMPTY" after every element insertion.
 *
 * Render contract:
 *  - pageLayouts[activePageId] → ordered node ID array
 *  - nodeTree[id]              → hydrated, migrated BuilderNode
 *  - CanvasDropZone at every inter-block gap (index 0 … n)
 */
export const LiveCanvas: React.FC = React.memo(() => {
    const { nodeTree, pageLayouts, activePageId, isLoading } = useBuilder();

    // Derive the ordered block list from the page's layout manifest.
    // Filter out any stale IDs whose nodes were GC'd during undo/delete.
    const blockIds: string[] = pageLayouts[activePageId] ?? [];
    const blocks = blockIds
        .map(id => nodeTree[id])
        .filter(Boolean);

    if (isLoading) return <CanvasSkeleton />;
    
    if (!activePageId) return (
        <div className="w-full h-[80vh] flex items-center justify-center p-12">
            <EmptyState
                icon={PlusSquare}
                title="No Page Selected"
                description="Select or create a page to start composing."
            />
        </div>
    );

    if (blocks.length === 0) return (
        // Full-canvas drop target so the user can drag onto an empty page
        <div
            className="w-full h-[80vh] flex items-center justify-center p-12"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
                e.preventDefault();
                const type = e.dataTransfer.getData('text/plain');
                if (type) {
                    // Resolved through the CanvasDropZone at index 0 — emit a
                    // synthetic drop on the top-level zone rendered below.
                }
            }}
        >
            {/* Invisible full-canvas drop zone so first block can be dragged in */}
            <CanvasDropZone index={0} pageId={activePageId} />
            <EmptyState
                icon={PlusSquare}
                title="Canvas is Empty"
                description="Click any block in the Elements panel, or drag one here to start building."
            />
        </div>
    );

    return (
        <div className="canvas-root w-full min-h-full pb-96" style={{ background: 'transparent' }}>
            {blocks.map((node, index) => (
                <React.Fragment key={node.id}>
                    <CanvasDropZone index={index} pageId={activePageId} />
                    <CanvasBlock node={node} index={index} />
                </React.Fragment>
            ))}
            <CanvasDropZone index={blocks.length} pageId={activePageId} />
        </div>
    );
});
LiveCanvas.displayName = 'LiveCanvas';

const CanvasSkeleton = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#000000] backdrop-blur-sm relative overflow-hidden">
        {/* Industrial Pulse */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,0.03),_transparent)] animate-[pulse_2s_infinite]" />
        <Loader2 className="animate-spin text-white/20" size={32} strokeWidth={1} />
    </div>
);