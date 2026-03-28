import React, { Suspense } from 'react';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { getRegistryEntry } from '../../platform/core/Registry';
import { BlockFloatingToolbar } from './BlockFloatingToolbar';
import { BlockSelectionOverlay } from './BlockSelectionOverlay';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CanvasBlockProps {
    node: any;
    index: number;
}

/**
 * 🧱 CANVAS BLOCK (Task 3.1)
 * Memoized container that ONLY re-renders on specific node/index changes.
 */
export const CanvasBlock: React.FC<CanvasBlockProps> = React.memo(({ node, index }) => {
    // 🛡️ High-Performance Selection (Industrial Rule)
    const isSelected = useBuilderStore(s => s.selectedNodeId === node.id);
    const isDragging = useBuilderStore(s => s.isDragging);
    const isLastDropped = useBuilderStore(s => s.lastDroppedNodeId === node.id);

    // Resolve component from Registry
    const entry = getRegistryEntry(node.type);
    if (!entry) return <UnknownBlockFallback type={node.type} nodeId={node.id} />;

    const { component: Component } = entry;

    return (
        <ErrorBoundary fallback={<BlockCrashFallback nodeId={node.id} />}>
            <Suspense fallback={<BlockSkeleton />}>
                <div 
                    className={`canvas-block relative group w-full ${isLastDropped ? 'animate-drop-glow' : ''}`}
                    style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    data-node-id={node.id}
                >
                    {/* Interaction Layers */}
                    <BlockSelectionOverlay 
                        nodeId={node.id} 
                        isSelected={isSelected} 
                        isDragging={isDragging} 
                    />
                    
                    <BlockFloatingToolbar 
                        nodeId={node.id} 
                        index={index} 
                        isSelected={isSelected} 
                    />

                    {/* Actual Component Render */}
                    <div style={{ pointerEvents: isSelected ? 'auto' : 'none' }}>
                        <Component {...node.props} nodeId={node.id} isBuilder={true} />
                    </div>
                </div>
            </Suspense>
        </ErrorBoundary>
    );
}, (prev, next) => {
    // 🛡️ Industrial Memoization (Zero Wasted Renders)
    return (
        prev.node.id === next.node.id && 
        JSON.stringify(prev.node.props) === JSON.stringify(next.node.props) &&
        prev.index === next.index
    );
});

// ─── Fallbacks ───────────────────────────────────────────────────────────────

const UnknownBlockFallback = ({ type, nodeId }: any) => (
    <div className="p-8 border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-xl text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
        <div className="text-sm font-bold text-red-500 uppercase tracking-widest">Unknown Type: {type}</div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono">{nodeId}</div>
    </div>
);

const BlockCrashFallback = ({ nodeId }: any) => (
    <div className="p-8 border-2 border-zinc-800 bg-zinc-900 rounded-xl text-center">
        <AlertTriangle className="mx-auto text-orange-500 mb-2" size={24} />
        <div className="text-sm font-bold text-white uppercase">Block Rendering Error</div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono italic">Node: {nodeId}</div>
    </div>
);

const BlockSkeleton = () => (
    <div className="w-full h-48 bg-zinc-900/50 animate-pulse rounded-2xl flex items-center justify-center border border-zinc-800">
        <Loader2 className="animate-spin text-zinc-800" />
    </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
