'use client';

/**
 * CleanRenderer: Zero-Overhead Recursive Render Engine
 */

import React, { useMemo, useRef, useState, useEffect, createContext, useContext } from 'react';
import { getRegistryEntry } from '../core/Registry';
import { PlatformBlock } from '../core/types';
import { precomputeAdjacencyMap } from '../core/normalize';
import { useGlobalThemeStore } from '../../stores/useGlobalThemeStore';

// ─── Animation Styles Stylesheet ───────────────────────────────────────────────
const AnimationStyles = () => (
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
);

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

export const CleanRenderer: React.FC<CleanRendererProps> = React.memo(({
    nodes,
    rootIds,
    viewport = 'desktop',
    pageId = 'default_page',
    globalAnimations = true,
}) => {
    const adjacencyMap = useMemo(() => precomputeAdjacencyMap(nodes), [nodes]);

    return (
        <CleanRenderContext.Provider value={{ nodes, adjacencyMap, viewport, globalAnimations }}>
            <AnimationStyles />
            <div className="omnora-renderer-sovereign" data-page-id={pageId}>
                {rootIds.map((id, index) => (
                    <NodeRenderer key={id} nodeId={id} index={index} />
                ))}
            </div>
        </CleanRenderContext.Provider>
    );
});

// ─── Internal Node Switch ────────────────────────────────────────────────────

interface NodeRendererProps {
    nodeId: string;
    index?: number;
}

const NodeRenderer: React.FC<NodeRendererProps> = ({ nodeId, index = 0 }) => {
    const { nodes, adjacencyMap } = useCleanRender();
    const block = nodes[nodeId];

    if (!block) return null;

    const entry = getRegistryEntry(block.type);
    if (!entry) return null;

    const Component = entry.component;
    const childrenIds = adjacencyMap[nodeId] || [];

    return (
        <CleanAnimatedDiv 
            nodeId={nodeId} 
            type={block.type} 
            style={block.props.style} 
            animations={block.props.animations}
            index={index}
        >
            <Component {...block.props}>
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
    style: React.CSSProperties;
    animations?: {
        type?: string;
        delay?: number;
        duration?: number;
        once?: boolean;
    };
    index?: number;
    children: React.ReactNode;
}

const DEFAULT_ANIMATIONS: Record<string, { type: string; duration: number; stagger?: number }> = {
    hero: { type: 'fadein', duration: 800, stagger: 100 },
    section: { type: 'slideup', duration: 600, stagger: 80 },
    product_card: { type: 'zoomin', duration: 400, stagger: 50 },
};

const CleanAnimatedDiv: React.FC<CleanAnimatedDivProps> = ({ nodeId, type, style, animations, index = 0, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const { globalAnimations } = useCleanRender();

    const defaultAnim = DEFAULT_ANIMATIONS[type.toLowerCase()] || { type: 'fadein', duration: 600 };
    const resolvedType = animations?.type !== 'none' ? (animations?.type || defaultAnim.type) : 'none';
    const hasAnim = resolvedType !== 'none';

    useEffect(() => {
        if (!hasAnim || !globalAnimations) { setVisible(true); return; }
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (animations?.once !== false) obs.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasAnim, animations?.once, globalAnimations]);

    const animStyle: React.CSSProperties = useMemo(() => {
        if (!hasAnim || !globalAnimations) return {};
        const baseDelay = animations?.delay ?? 0;
        const staggerConstant = defaultAnim.stagger ?? 0;
        const staggerDelay = staggerConstant ? Math.min(index, 4) * staggerConstant : 0;
        const delay = baseDelay + staggerDelay;
        const dur = animations?.duration ?? defaultAnim.duration ?? 600;

        return {
            transitionDuration: `${dur}ms`,
            transitionDelay: `${delay}ms`,
        };
    }, [hasAnim, animations, globalAnimations, index, defaultAnim]);

    if (!globalAnimations) {
        return (
            <div
                id={nodeId}
                className={`omnora-live ${type.toLowerCase()}`}
                style={{ position: 'relative', width: '100%', ...style }}
                data-omnora-node={nodeId}
            >
                {children}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            id={nodeId}
            className={`omnora-live ${type.toLowerCase()} ${hasAnim ? `omnora-anim-entry omnora-anim-${resolvedType.toLowerCase()}` : ''} ${visible ? 'visible' : ''}`}
            style={{
                position: 'relative',
                width: '100%',
                ...style,
                ...animStyle,
            }}
            data-omnora-node={nodeId}
        >
            {children}
        </div>
    );
};
