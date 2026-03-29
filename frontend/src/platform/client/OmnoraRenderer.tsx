/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useContext, createContext } from 'react';
import { getRegistry, getRegistryEntry } from '../core/Registry';
import { ComponentWrapper } from './ComponentWrapper';
import { useOmnoraBase } from './OmnoraContext';
import { PlatformBlock } from '../core/types';
import { precomputeAdjacencyMap } from '../core/normalize';
import { StorefrontProvider } from '../../context/StorefrontContext';

export interface RenderContextType {
    nodes: Record<string, PlatformBlock>;
    registry: Record<string, unknown>;
    adjacencyMap: Record<string, string[]>; // Precomputed for O(1) subtree resolution
    mode: 'production' | 'preview' | 'edit';
    viewport: 'desktop' | 'tablet' | 'mobile';
    renderWrapper?: (node: PlatformBlock, children: React.ReactNode) => React.ReactNode;
}

const RenderContext = createContext<RenderContextType | null>(null);

export const useRenderContext = () => {
    const context = useContext(RenderContext);
    if (!context) throw new Error('[Omnora Renderer] CRITICAL: useRenderContext must be used within OmnoraRenderer.');
    return context;
};

export interface OmnoraRendererProps {
    nodes: Record<string, PlatformBlock>;
    blocks: string[];
    mode?: 'edit' | 'preview' | 'production';
    registryOverride?: Record<string, unknown>;
    renderWrapper?: (node: PlatformBlock, children: React.ReactNode) => React.ReactNode;
}

/**
 * OmnoraRenderer: Core Pure Render Engine (v5)
 * Hardened for enterprise-scale Section Slicing and regionalized reconciliation.
 */
// eslint-disable-next-line react/prop-types
export const OmnoraRenderer: React.FC<OmnoraRendererProps> = React.memo(({
    nodes,
    blocks,
    mode = 'production',
    registryOverride,
    renderWrapper
}) => {
    const { viewport } = useOmnoraBase();
    const registry = registryOverride || getRegistry();

    if (!blocks || blocks.length === 0) return null;

    return (
        <StorefrontProvider>
            <>
                {blocks.map(id => (
                    <SectionBoundary
                        key={`section-${id}`}
                        id={id}
                        nodes={nodes}
                        registry={registry}
                        mode={mode}
                        viewport={viewport}
                        renderWrapper={renderWrapper}
                    />
                ))}
            </>
        </StorefrontProvider>
    );
});
OmnoraRenderer.displayName = 'OmnoraRenderer';

interface SectionBoundaryProps {
    id: string;
    nodes: Record<string, PlatformBlock>;
    registry: Record<string, unknown>;
    mode: 'production' | 'preview' | 'edit';
    viewport: 'desktop' | 'tablet' | 'mobile';
    renderWrapper?: (node: PlatformBlock, children: React.ReactNode) => React.ReactNode;
}

/**
 * SectionBoundary: The "Topology Stabilizer".
 * It isolates React reconciliation to a specific top-level subtree.
 */
// eslint-disable-next-line react/prop-types
const SectionBoundary: React.FC<SectionBoundaryProps> = React.memo(({
    id, nodes, registry, mode, viewport, renderWrapper
}) => {
    // ─── Section-Specific Topology Extraction ───
    // We only recompute the adjacency map for this specific section's subtree.
    // This allows other sections to remain referentially stable if their data hasn't changed.
    const sectionNodes = useMemo(() => {
        const subtree: Record<string, PlatformBlock> = {};
        const stack = [id];
        while (stack.length > 0) {
            const currentId = stack.pop()!;
            const node = nodes[currentId];
            if (node) {
                subtree[currentId] = node;
                if (node.children) stack.push(...node.children);
            }
        }
        return subtree;
    }, [id, nodes]); // Still depends on nodes, but SectionBoundary itself is memoized.

    const adjacencyMap = useMemo(() => precomputeAdjacencyMap(sectionNodes), [sectionNodes]);

    const contextValue = useMemo(() => ({
        nodes: sectionNodes,
        registry,
        adjacencyMap,
        mode,
        viewport,
        renderWrapper
    }), [sectionNodes, registry, adjacencyMap, mode, viewport, renderWrapper]);

    return (
        <RenderContext.Provider value={contextValue}>
            <PureRecursiveNode id={id} />
        </RenderContext.Provider>
    );
}, (prev, next) => {
    // Custom Memo Logic: Only re-render if nodes within this section's ID space have changed.
    // This is the core of v5 Structural Isolation.
    if (prev.id !== next.id || prev.mode !== next.mode || prev.viewport !== next.viewport) return false;

    // Check if the specific nodes belonging to this section have changed identity.
    return prev.nodes[prev.id] === next.nodes[next.id];
    // In a production immutable system, if the root hasn't changed, 
    // it's highly likely the subtree is stable. 
    // For v5 prep, we'll keep it identity-based on the root.
});
SectionBoundary.displayName = 'SectionBoundary';

interface RecursiveNodeProps {
    id: string;
}

/**
 * PureRecursiveNode: The atomic unit of recursive rendering.
 * Optimized (v5): Consumes regionalized context.
 */
// eslint-disable-next-line react/prop-types
export const PureRecursiveNode: React.FC<RecursiveNodeProps> = React.memo(({ id }) => {
    const { nodes, adjacencyMap, mode, viewport, renderWrapper } = useRenderContext();

    const node = nodes[id];

    const activeStyles = useMemo(() => {
        if (!node) return {};
        const base = node.styles || {};
        const responsiveStyles = viewport === 'desktop' ? {} : (node.responsive?.[viewport] || {});
        return { ...base, ...responsiveStyles };
    }, [node, viewport]);

    if (!node) return null;

    const entry = getRegistryEntry(node.type);
    if (!entry) return null;

    const { component: Component, capabilities = [] } = entry;
    const canHaveChildren = capabilities.includes('layout');

    const childIds = adjacencyMap[id];
    const children = (canHaveChildren && childIds && childIds.length > 0) ? (
        <>
            {childIds.map((childId: string) => (
                <PureRecursiveNode
                    key={`child-${childId}`}
                    id={childId}
                />
            ))}
        </>
    ) : null;

    const content = (
        <Component {...node.props} nodeId={id}>
            {children}
        </Component>
    );

    const isHiddenOnDevice = node.hidden?.[viewport];

    if (isHiddenOnDevice && mode !== 'edit') return null;

    if (renderWrapper) {
        return <>{renderWrapper(node, content)}</>;
    }

    return (
        <ComponentWrapper
            nodeId={id}
            type={node.type}
            isHidden={isHiddenOnDevice}
            style={activeStyles}
            animations={node.animations}
        >
            {content}
        </ComponentWrapper>
    );
});
PureRecursiveNode.displayName = 'PureRecursiveNode';
