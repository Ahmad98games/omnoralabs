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
import { EmptyState } from '../ui/EmptyState';

/**
 * 🎨 ATOMIC CANVAS (Task 3.1)
 * Pure dynamic renderer with Zero Wasted Renders.
 */
export const LiveCanvas: React.FC = React.memo(() => {
    const blocks = useBuilderStore(s => s.nodes[s.activePageId] ?? []);
    const isHydrating = useBuilderStore(s => s.isHydrating);
    const activePageId = useBuilderStore(s => s.activePageId);

    if (isHydrating) return <CanvasSkeleton />;
    
    if (!activePageId) return (
        <div className="w-full h-[80vh] flex items-center justify-center p-12">
            <EmptyState 
                icon={PlusSquare}
                title="No Page Selected" 
                description="Select or initialize a registry node from the supervisor console to begin composition." 
            />
        </div>
    );

    if (blocks.length === 0) return (
        <div className="w-full h-[80vh] flex items-center justify-center p-12">
            <EmptyState 
                icon={PlusSquare}
                title="Page Registry Empty" 
                description="The current registry contains zero active elements. Drag-and-drop units from the elements bay to initialize." 
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

const CanvasSkeleton = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#000000] backdrop-blur-sm relative overflow-hidden">
        {/* Industrial Pulse */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,0.03),_transparent)] animate-[pulse_2s_infinite]" />
        <Loader2 className="animate-spin text-white/20" size={32} strokeWidth={1} />
    </div>
);