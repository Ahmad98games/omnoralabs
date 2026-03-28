import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { CanvasBlock } from './CanvasBlock';
import { CanvasDropZone } from './CanvasDropZone';
import { Loader2, PlusSquare } from 'lucide-react';

/**
 * 🎨 ATOMIC CANVAS (Task 3.1)
 * Pure dynamic renderer with Zero Wasted Renders.
 */
export const LiveCanvas: React.FC = React.memo(() => {
    // 🛡️ High-Performance Selection (Industrial Rule)
    const { blocks, isHydrating, activePageId } = useBuilderStore(
        useShallow(s => ({
            blocks: s.nodes[s.activePageId] ?? [],
            isHydrating: s.isHydrating,
            activePageId: s.activePageId
        }))
    );

    if (isHydrating) return <CanvasSkeleton />;
    
    if (!activePageId) return (
        <CanvasEmptyState 
            message="No Page Selected" 
            sub="Select or create a page from the top toolbar to begin building." 
        />
    );

    if (blocks.length === 0) return (
        <CanvasEmptyState 
            message="This Page is Empty" 
            sub="Open the Elements panel and drag a block here to start." 
        />
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

const CanvasSkeleton = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Loader2 className="animate-spin text-orange-500" size={48} />
    </div>
);

const CanvasEmptyState = ({ message, sub }: { message: string; sub: string }) => (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center text-center p-12">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mb-6 text-orange-500">
            <PlusSquare size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
        <p className="text-zinc-500 max-w-sm leading-relaxed">{sub}</p>
    </div>
);