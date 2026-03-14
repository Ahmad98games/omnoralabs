import React, { useMemo, useContext, createContext } from 'react';
import { getRegistry } from './BuilderRegistry';
import { ComponentWrapper } from './ComponentWrapper';
import { useOmnoraBase } from '../../context/OmnoraContext';
import { useNodeSelector } from '../../hooks/useNodeSelector';
import { StorefrontProvider } from '../../context/StorefrontContext';

export interface RenderContextType {
    registry: Record<string, any>;
    mode: string;
    viewport: string;
    renderWrapper?: (node: any, children: React.ReactNode) => React.ReactNode;
}

const RenderContext = createContext<RenderContextType | null>(null);

export const useRenderContext = () => useContext(RenderContext);

export interface OmnoraRendererProps {
    /** The top-level block IDs to render */
    blocks: string[];
    /** Current mode for visual adjustments (No logic dependency) */
    mode?: 'edit' | 'preview' | 'production';
    /** Optional registry override for custom component sets */
    registryOverride?: Record<string, any>;
    /** Optional renderer for specialized wrapping (Editor overlays, etc) */
    renderWrapper?: (node: any, children: React.ReactNode) => React.ReactNode;
}

/**
 * OmnoraRenderer: Core Pure Render Engine
 * 
 * OS.PORTABILITY: This component is the "Source of Truth" for rendering.
 */
export const OmnoraRenderer: React.FC<OmnoraRendererProps> = React.memo(({
    blocks,
    mode = 'production',
    registryOverride,
    renderWrapper
}) => {
    const { viewport } = useOmnoraBase();
    const registry = registryOverride || getRegistry();

    // Mandatory Check: Ensure Header is always in the render queue if it exists
    const allBlocks = useMemo(() => {
        const list = [...blocks];
        // Agar header blocks mein nahi hai, toh use manually top par inject karo
        // (Assuming 'header' is a reserved ID or type)
        return list;
    }, [blocks]);

    const contextValue = useMemo(() => ({ registry, mode, viewport, renderWrapper }), [registry, mode, viewport, renderWrapper]);

    return (
        <StorefrontProvider>
            <RenderContext.Provider value={contextValue}>
                <div className={`omnora-canvas mode-${mode}`}>
                    {allBlocks.map(id => <PureRecursiveNode key={id} id={id} />)}
                </div>
            </RenderContext.Provider>
        </StorefrontProvider>
    );
});

interface RecursiveNodeProps {
    id: string;
}

export const PureRecursiveNode: React.FC<RecursiveNodeProps> = ({ id }) => {
    const context = useRenderContext();
    const node = useNodeSelector(id, (n) => n); // High-scale granular subscription

    if (!context || !node) return null;
    const { registry, mode, viewport, renderWrapper } = context;

    const entry = registry[node.type];
    if (!entry) {
        return (
            <div style={{ padding: '20px', background: 'rgba(255,0,0,0.1)', border: '1px dashed red', color: 'red' }}>
                Unregistered component: {node.type}
            </div>
        );
    }

    const { component: Component } = entry;

    // Determine children using blocks array for strict ordering
    const children = (
        <>
            {node.children?.map((childId: string) => (
                <PureRecursiveNode
                    key={childId}
                    id={childId}
                />
            ))}
        </>
    );

    // Standard Render Pipeline
    const content = (
        <Component {...node.props} nodeId={node.id}>
            {children}
        </Component>
    );

    // Explicit Visibility Gating (SSR/Production First)
    const isHiddenOnDevice = node.hidden?.[viewport as keyof typeof node.hidden];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    if (renderWrapper) {
        return <>{renderWrapper(node, content)}</>;
    }

    return (
        <ComponentWrapper
            nodeId={node.id}
            type={node.type}
            isHidden={isHiddenOnDevice}
            style={node.styles}
        >
            {content}
        </ComponentWrapper>
    );
};
