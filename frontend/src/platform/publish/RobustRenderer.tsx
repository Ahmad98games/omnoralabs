/**
 * 🛠️ OMNORA PLATFORM | [ROBUST RENDERER]
 * ---------------------------------------------------------
 * OSTT Update: Fixed Prop-Types validation errors for React.FC components.
 * ---------------------------------------------------------
 */

import React, { useMemo, useEffect, createContext, useContext } from 'react';
import { getRegistryEntry } from '../core/Registry';
import { PlatformBlock } from '../core/types';
import { precomputeAdjacencyMap } from '../core/normalize';
import { useGlobalThemeStore } from '../../stores/useGlobalThemeStore';
import { supabase } from '../../lib/supabaseClient';

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
    children: React.ReactNode;
    blockId: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class BlockErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error(`[SRE Block Crash] ${this.props.blockId}:`, error);
        
        // OSTT FIX: Using correctly typed promise chaining instead of `.catch` on `insert`
        supabase.from('telemetry').insert({
            type: 'component_crash',
            block_id: this.props.blockId,
            message: error.message,
            stack: info.componentStack,
            created_at: new Date().toISOString()
        }).then(({ error: insertError }) => {
            if (insertError) {
                console.warn('[Telemetry] Failed to log crash', insertError);
            }
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: 'rgba(220, 38, 38, 0.05)', border: '1px dashed #dc2626', color: '#ef4444', fontSize: '12px', textAlign: 'center', margin: '8px', borderRadius: '6px' }}>
                    ⚠️ Component failed to load
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Render Context ──────────────────────────────────────────────────────────
interface CleanRenderContextType {
    nodes: Record<string, PlatformBlock>;
    adjacencyMap: Record<string, string[]>;
    viewport: 'desktop' | 'tablet' | 'mobile';
}

const CleanRenderContext = createContext<CleanRenderContextType | null>(null);

const useCleanRender = () => {
    const ctx = useContext(CleanRenderContext);
    if (!ctx) throw new Error('[RobustRenderer] Must be used within RobustRenderer.');
    return ctx;
};

// ─── Main Renderer ───────────────────────────────────────────────────────────
export interface RobustRendererProps {
    nodes: Record<string, PlatformBlock>;
    rootIds: string[];
    viewport?: 'desktop' | 'tablet' | 'mobile';
}

export const RobustRenderer = React.memo((props: RobustRendererProps) => {
    const { nodes, rootIds, viewport = 'desktop' } = props;

    const validatedNodes = useMemo(() => {
        const out: Record<string, PlatformBlock> = {};
        Object.entries(nodes || {}).forEach(([id, node]) => {
            out[id] = {
                ...node,
                props: node.props || {},
                styles: node.styles || {},
                children: node.children || []
            };
        });
        return out;
    }, [nodes]);

    const adjacencyMap = useMemo(() => precomputeAdjacencyMap(validatedNodes), [validatedNodes]);
    const adSensePublisherId = useGlobalThemeStore((s) => s.adSensePublisherId);

    useEffect(() => {
        if (!adSensePublisherId) return;
        const scriptId = 'google-adsense-script';
        if (document.getElementById(scriptId)) return;
        const s = document.createElement('script');
        s.id = scriptId; s.async = true;
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSensePublisherId}`;
        s.crossOrigin = 'anonymous';
        document.head.appendChild(s);
    }, [adSensePublisherId]);

    const contextValue = useMemo<CleanRenderContextType>(() => ({
        nodes: validatedNodes,
        adjacencyMap,
        viewport,
    }), [validatedNodes, adjacencyMap, viewport]);

    if (!rootIds || rootIds.length === 0) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#52525b' }}>Empty storefront.</div>;
    }

    return (
        <CleanRenderContext.Provider value={contextValue}>
            {rootIds.map(id => <CleanNode key={`clean-${id}`} id={id} />)}
        </CleanRenderContext.Provider>
    );
});

RobustRenderer.displayName = 'RobustRenderer';

// ─── Atomic Node ─────────────────────────────────────────────────────────────
interface CleanNodeProps {
    id: string;
}

const CleanNode = React.memo((props: CleanNodeProps) => {
    const { id } = props;
    const { nodes, adjacencyMap, viewport } = useCleanRender();
    const node = nodes[id];

    const activeStyles = useMemo(() => {
        if (!node) return {};
        return {
            ...(node.styles || {}),
            ...(viewport === 'desktop' ? {} : (node.responsive?.[viewport] || {}))
        };
    }, [node, viewport]);

    if (!node) return null;
    if (node.hidden?.[viewport]) return null;

    const entry = getRegistryEntry(node.type);
    if (!entry) return null;

    const { component: Component, capabilities = [] } = entry;
    const canHaveChildren = capabilities.includes('layout');
    const childIds = adjacencyMap[id];

    const children = (canHaveChildren && childIds && childIds.length > 0) ? (
        <>{childIds.map((childId: string) => <CleanNode key={`clean-${childId}`} id={childId} />)}</>
    ) : null;

    return (
        <div 
            id={id} 
            className={`omnora-live ${node.type.toLowerCase()}`} 
            style={{ position: 'relative', width: '100%', ...(activeStyles as React.CSSProperties) }}
        >
            <BlockErrorBoundary blockId={id}>
                <Component {...node.props} nodeId={id}>
                    {children}
                </Component>
            </BlockErrorBoundary>
        </div>
    );
});

CleanNode.displayName = 'CleanNode';