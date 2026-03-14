/**
 * CleanRenderer: Zero-Overhead Recursive Render Engine
 *
 * This is the PRODUCTION storefront renderer. It is intentionally
 * stripped of ALL builder UI:
 *   ✗ No ComponentWrapper (no drag, no pointer events, no hover outlines)
 *   ✗ No BuilderContext dependency
 *   ✗ No Sidebar, Toolbar, or Selection logic
 *
 * It DOES support:
 *   ✓ Recursive node rendering from StorefrontConfig
 *   ✓ IntersectionObserver scroll animations (Phase 12)
 *   ✓ Responsive style merging (Phase 11)
 *   ✓ Data binding via Registry components
 *   ✓ ThemeManager CSS variables
 */

import React, { useMemo, useRef, useState, useEffect, createContext, useContext } from 'react';
import { getRegistryEntry } from '../core/Registry';
import { PlatformBlock } from '../core/types';
import { precomputeAdjacencyMap } from '../core/normalize';

// ─── Animation Presets (shared with ComponentWrapper) ─────────────────────────

const ANIM_INITIAL: Record<string, React.CSSProperties> = {
    fadeIn: { opacity: 0 },
    slideUp: { opacity: 0, transform: 'translateY(40px)' },
    zoomIn: { opacity: 0, transform: 'scale(0.85)' },
    blurReveal: { opacity: 0, filter: 'blur(12px)' },
};

const ANIM_FINAL: Record<string, React.CSSProperties> = {
    fadeIn: { opacity: 1 },
    slideUp: { opacity: 1, transform: 'translateY(0)' },
    zoomIn: { opacity: 1, transform: 'scale(1)' },
    blurReveal: { opacity: 1, filter: 'blur(0px)' },
};

// ─── Clean Render Context ─────────────────────────────────────────────────────

interface CleanRenderContextType {
    nodes: Record<string, PlatformBlock>;
    adjacencyMap: Record<string, string[]>;
    viewport: 'desktop' | 'tablet' | 'mobile';
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
    rootIds: string[];     // top-level block IDs for the current page
    viewport?: 'desktop' | 'tablet' | 'mobile';
}

/**
 * CleanRenderer: The entry point for the live storefront.
 * Takes a flat node map + root IDs and renders them recursively.
 */
export const CleanRenderer: React.FC<CleanRendererProps> = React.memo(({
    nodes,
    rootIds,
    viewport = 'desktop',
}) => {
    const adjacencyMap = useMemo(() => precomputeAdjacencyMap(nodes), [nodes]);

    const contextValue = useMemo<CleanRenderContextType>(() => ({
        nodes,
        adjacencyMap,
        viewport,
    }), [nodes, adjacencyMap, viewport]);

    if (!rootIds || rootIds.length === 0) return null;

    return (
        <CleanRenderContext.Provider value={contextValue}>
            {rootIds.map(id => (
                <CleanNode key={`clean-${id}`} id={id} />
            ))}
        </CleanRenderContext.Provider>
    );
});

// ─── Recursive Clean Node ─────────────────────────────────────────────────────

interface CleanNodeProps {
    id: string;
}

const CleanNode: React.FC<CleanNodeProps> = React.memo(({ id }) => {
    const { nodes, adjacencyMap, viewport } = useCleanRender();
    const node = nodes[id];
    if (!node) return null;

    // Skip hidden nodes on this viewport
    const isHidden = node.hidden?.[viewport];
    if (isHidden) return null;

    // Resolve registry entry
    const entry = getRegistryEntry(node.type);
    if (!entry) return null;

    const { component: Component, capabilities = [] } = entry;
    const canHaveChildren = capabilities.includes('layout');

    // Recursive children
    const childIds = adjacencyMap[id];
    const children = (canHaveChildren && childIds && childIds.length > 0) ? (
        <>
            {childIds.map((childId: string) => (
                <CleanNode key={`clean-${childId}`} id={childId} />
            ))}
        </>
    ) : null;

    // Merge responsive styles
    const activeStyles = useMemo(() => {
        const base = node.styles || {};
        const responsiveOverride = viewport === 'desktop' ? {} : (node.responsive?.[viewport] || {});
        return { ...base, ...responsiveOverride };
    }, [node, viewport]);

    // Animation support
    const hasAnim = node.animations && node.animations.type && node.animations.type !== 'none';

    return (
        <CleanAnimatedDiv
            nodeId={id}
            type={node.type}
            style={activeStyles}
            animations={hasAnim ? node.animations : undefined}
        >
            <Component {...node.props} nodeId={id}>
                {children}
            </Component>
        </CleanAnimatedDiv>
    );
});

// ─── Clean Animated Div (IntersectionObserver only) ───────────────────────────

interface CleanAnimatedDivProps {
    nodeId: string;
    type: string;
    style: React.CSSProperties;
    animations?: {
        type: 'fadeIn' | 'slideUp' | 'zoomIn' | 'blurReveal' | 'none';
        duration: number;
        delay: number;
        once: boolean;
    };
    children: React.ReactNode;
}

/**
 * CleanAnimatedDiv: A minimal DOM wrapper for each block.
 * No pointer events, no drag logic, no hover outlines.
 * Only handles: styles, responsive layout, and scroll-triggered animations.
 */
const CleanAnimatedDiv: React.FC<CleanAnimatedDivProps> = ({ nodeId, type, style, animations, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const hasAnim = !!animations && animations.type !== 'none';

    useEffect(() => {
        if (!hasAnim) { setVisible(true); return; }
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
    }, [hasAnim, animations?.once]);

    const animStyle: React.CSSProperties = useMemo(() => {
        if (!hasAnim || !animations) return {};
        const dur = animations.duration ?? 600;
        const del = animations.delay ?? 0;
        const initial = ANIM_INITIAL[animations.type] || {};
        const final_ = ANIM_FINAL[animations.type] || {};
        const active = visible ? final_ : initial;
        return {
            ...active,
            transition: `opacity ${dur}ms ease ${del}ms, transform ${dur}ms ease ${del}ms, filter ${dur}ms ease ${del}ms`,
        };
    }, [hasAnim, animations, visible]);

    return (
        <div
            ref={ref}
            id={nodeId}
            className={`omnora-live ${type.toLowerCase()}`}
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
