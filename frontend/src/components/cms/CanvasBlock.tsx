import React, { Suspense, ReactNode } from 'react';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { getRegistryEntry, RegistryEntry } from '../../platform/core/Registry';
import { BlockFloatingToolbar } from './BlockFloatingToolbar';
import { BlockSelectionOverlay } from './BlockSelectionOverlay';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface NodeProps {
    [key: string]: unknown;
}

interface BuilderNodeData {
    id: string;
    type: string;
    props: NodeProps;
}

interface CanvasBlockProps {
    node: BuilderNodeData;
    index: number;
}

/**
 * 🧱 CANVAS BLOCK (Task 3.1)
 * Memoized container that ONLY re-renders on specific node/index changes.
 */
const CanvasBlockContent = ({ node, index }: CanvasBlockProps) => {
    const isSelected = useBuilderStore(s => s.selectedNodeId === node.id);
    const isDragging = useBuilderStore(s => s.isDragging);
    const isLastDropped = useBuilderStore(s => s.lastDroppedNodeId === node.id);

    const entry = getRegistryEntry(node.type) as RegistryEntry;
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

                    <div style={{ pointerEvents: isSelected ? 'auto' : 'none' }}>
                        <Component {...(node.props as Record<string, unknown>)} nodeId={node.id} isBuilder={true} />
                    </div>
                </div>
            </Suspense>
        </ErrorBoundary>
    );
};

export const CanvasBlock = React.memo(CanvasBlockContent, (prev: CanvasBlockProps, next: CanvasBlockProps) => {
    return (
        prev.node.id === next.node.id && 
        JSON.stringify(prev.node.props) === JSON.stringify(next.node.props) &&
        prev.index === next.index
    );
});
CanvasBlock.displayName = 'CanvasBlock';

const UnknownBlockFallback = ({ type, nodeId }: { type: string; nodeId: string }) => (
    <div className="p-8 border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-xl text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
        <div className="text-sm font-bold text-red-500 uppercase tracking-widest">Unknown Type: {type}</div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono">{nodeId}</div>
    </div>
);

const BlockCrashFallback = ({ nodeId }: { nodeId: string }) => (
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

interface ErrorBoundaryProps { fallback: ReactNode; children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}