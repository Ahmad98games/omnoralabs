'use client';

/**
 * CleanRenderer: Zero-Overhead Recursive Render Engine
 * Refactored for OSTT: Fixed cascading renders and added explicit prop validation.
 */

import React, { useMemo, useRef, useState, useEffect, createContext, useContext } from 'react';
import { getRegistryEntry } from '../core/Registry';
import { PlatformBlock } from '../core/types';
import { precomputeAdjacencyMap } from '../core/normalize';

// ─── Animation Styles Stylesheet ───────────────────────────────────────────────
const AnimationStyles = React.memo(() => (
    <style>{`
        @media (prefers-reduced-motion: no-preference) {
            .omnora-anim-entry {
                opacity: 0;
                transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), 
                            transform 600ms cubic-bezier(0.16, 1, 0.3, 1), 
                            filter 600ms ease;
                will-change: opacity, transform;
            }
            .omnora-anim-entry.visible {
                opacity: 1 !important;
                transform: translate(0, 0) scale(1) !important;
                filter: blur(0px) !important;
            }
            .omnora-anim-fadein { opacity: 0; }
            .omnora-anim-slideup { opacity: 0; transform: translateY(40px); }
            .omnora-anim-zoomin { opacity: 0; transform: scale(0.92); }
            .omnora-anim-blur { opacity: 0; filter: blur(12px); }
        }
    `}</style>
));
AnimationStyles.displayName = 'AnimationStyles';

// ─── Clean Render Context ─────────────────────────────────────────────────────
interface CleanRenderContextType {
    nodes: Record<string, PlatformBlock>;
    adjacencyMap: Record<string, string[]>;
    viewport: 'desktop' | 'tablet' | 'mobile';
    globalAnimations: boolean;
}

const CleanRenderContext = createContext<CleanRenderContextType | null>(null);

const useCleanRender = () => {
    const ctx = useContext(CleanRenderContext);
    if (!ctx) throw new Error('[CleanRenderer] Must be used within CleanRenderer.');
    return ctx;
};

// ─── Public API ───────────────────────────────────────────────────────────────
export interface CleanRendererProps {
    nodes: Record<string, PlatformBlock>;
    rootIds: string[];
    viewport?: 'desktop' | 'tablet' | 'mobile';
    pageId?: string;
    globalAnimations?: boolean;
}

export const CleanRenderer = React.memo((props: CleanRendererProps) => {
    const { 
        nodes, 
        rootIds, 
        viewport = 'desktop', 
        pageId = 'default_page', 
        globalAnimations = true 
    } = props;

    const adjacencyMap = useMemo(() => precomputeAdjacencyMap(nodes), [nodes]);

    const contextValue = useMemo(() => ({ 
        nodes, 
        adjacencyMap, 
        viewport, 
        globalAnimations 
    }), [nodes, adjacencyMap, viewport, globalAnimations]);

    return (
        <CleanRenderContext.Provider value={contextValue}>
            <AnimationStyles />
            <div className="omnora-renderer-sovereign" data-page-id={pageId}>
                {rootIds.map((id, index) => (
                    <NodeRenderer key={id} nodeId={id} index={index} />
                ))}
            </div>
        </CleanRenderContext.Provider>
    );
});
CleanRenderer.displayName = 'CleanRenderer';

// ─── Internal Node Switch ────────────────────────────────────────────────────
interface NodeRendererProps {
    nodeId: string;
    index?: number;
}

// OSTT FIX: Removed React.memo from internal wrapper and destructured args explicitly without `propTypes` check
const NodeRenderer: React.FC<NodeRendererProps> = ({ nodeId, index = 0 }) => {
    const { nodes, adjacencyMap } = useCleanRender();
    const block = nodes[nodeId];

    if (!block) return null;

    const entry = getRegistryEntry(block.type);
    if (!entry) return null;

    const Component = entry.component;
    const childrenIds = adjacencyMap[nodeId] || [];

    // OSTT FIX: Safely cast block.props as Record to allow dot chaining
    const propsObject = (block.props || {}) as Record<string, unknown>;

    return (
        <CleanAnimatedDiv 
            nodeId={nodeId} 
            type={block.type} 
            style={propsObject.style as React.CSSProperties} 
            animations={propsObject.animations as Record<string, unknown>}
            index={index}
        >
            <Component data={propsObject} nodeId={nodeId}>
                {childrenIds.map((childId, idx) => (
                    <NodeRenderer key={childId} nodeId={childId} index={idx} />
                ))}
            </Component>
        </CleanAnimatedDiv>
    );
};

// ─── Animation Wrapper ──────────────────────────────────────────────────────
interface CleanAnimatedDivProps {
    nodeId: string;
    type: string;
    style?: React.CSSProperties;
    animations?: Record<string, unknown>;
    index?: number;
    children: React.ReactNode;
}

const DEFAULT_ANIMATIONS: Record<string, { type: string; duration: number; stagger?: number }> = {
    hero: { type: 'fadein', duration: 800, stagger: 100 },
    section: { type: 'slideup', duration: 600, stagger: 80 },
    product_card: { type: 'zoomin', duration: 400, stagger: 50 },
};

// OSTT FIX: Destructured directly and removed PropTypes
const CleanAnimatedDiv: React.FC<CleanAnimatedDivProps> = ({ nodeId, type, style, animations, index = 0, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { globalAnimations } = useCleanRender();

    const defaultAnim = useMemo(() => 
        DEFAULT_ANIMATIONS[type.toLowerCase()] || { type: 'fadein', duration: 600 },
    [type]);

    const animType = animations?.type as string | undefined;
    const animOnce = animations?.once as boolean | undefined;

    const resolvedType = animType !== 'none' ? (animType || defaultAnim.type) : 'none';
    const hasAnim = resolvedType !== 'none';

    const shouldAnimate = hasAnim && globalAnimations;
    const [visible, setVisible] = useState(!shouldAnimate);

    useEffect(() => {
        if (!shouldAnimate) return;

        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (animOnce !== false) obs.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [shouldAnimate, animOnce]);

    const animStyle = useMemo(() => {
        if (!shouldAnimate) return {};
        const baseDelay = (animations?.delay as number) ?? 0;
        const staggerConstant = defaultAnim.stagger ?? 0;
        const staggerDelay = staggerConstant ? Math.min(index, 4) * staggerConstant : 0;
        const delay = baseDelay + staggerDelay;
        const dur = (animations?.duration as number) ?? defaultAnim.duration ?? 600;

        return {
            transitionDuration: `${dur}ms`,
            transitionDelay: `${delay}ms`,
        } as React.CSSProperties;
    }, [shouldAnimate, animations, index, defaultAnim]);

    return (
        <div
            ref={ref}
            id={nodeId}
            className={`omnora-live ${type.toLowerCase()} ${shouldAnimate ? `omnora-anim-entry omnora-anim-${resolvedType.toLowerCase()}` : ''} ${visible ? 'visible' : ''}`}
            style={{ position: 'relative', width: '100%', ...style, ...animStyle }}
            data-omnora-node={nodeId}
        >
            {children}
        </div>
    );
};