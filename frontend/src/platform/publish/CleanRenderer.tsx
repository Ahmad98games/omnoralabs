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

            /* Type Presets */
            .omnora-anim-fadein { opacity: 0; }
            .omnora-anim-slideup { opacity: 0; transform: translateY(40px); }
            .omnora-anim-zoomin { opacity: 0; transform: scale(0.92); }
            .omnora-anim-blur { opacity: 0; filter: blur(12px); }

            /* Default Blocks Fallbacks */
            .omnora-anim-def-hero { opacity: 0; transform: scale(0.98); }
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
    rootIds: string[]; // top-level block IDs for the current page
    viewport?: 'desktop' | 'tablet' | 'mobile';
    pageId?: string;    // 🛡️ Stale render guard identifier
    globalAnimations?: boolean; // 🎬 Global animation toggle
}

/**
 * CleanRenderer: The entry point for the live storefront.
 * Takes a flat node map + root IDs and renders them recursively.
 */
export const CleanRenderer: React.FC<CleanRendererProps> = React.memo(({
    nodes,
    rootIds,
    viewport = 'desktop',
    pageId = 'default_page',
    globalAnimations = true,
}) => {
    // 👁️ Live Preview Overrides
    const [liveNodes, setLiveNodes] = useState<Record<string, PlatformBlock>>(nodes);
    const isPreview = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return new URLSearchParams(window.location.search).get('preview') === 'true';
    }, []);

    // Sync live nodes if prop nodes changes on static renders
    useEffect(() => {
        setLiveNodes(nodes);
    }, [nodes]);

    useEffect(() => {
        if (!isPreview) return;

        const handleMessage = (e: MessageEvent) => {
            // 🛡️ 1. Origin Security Validation Guard
            if (e.origin !== window.location.origin) return;

            // 🛡️ 2. Type Guard & Stale Render check
            if (e.data?.type === 'OMNORA_PREVIEW_UPDATE') {
                if (e.data.activePageId && e.data.activePageId !== pageId) {
                    // Ignore stale updates from different pages in flight triggers
                    return; 
                }
                if (e.data.nodes) {
                    setLiveNodes(e.data.nodes);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isPreview, pageId]);

    const adjacencyMap = useMemo(() => precomputeAdjacencyMap(liveNodes), [liveNodes]);
    const adSensePublisherId = useGlobalThemeStore((s) => s.adSensePublisherId);

    // Inject AdSense script safely if configured
    useEffect(() => {
        if (!adSensePublisherId) return;
        
        const scriptId = 'google-adsense-script';
        if (document.getElementById(scriptId)) return;

        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSensePublisherId}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }, [adSensePublisherId]);

    const contextValue = useMemo<CleanRenderContextType>(() => ({
        nodes: liveNodes,
        adjacencyMap,
        viewport,
        globalAnimations,
    }), [liveNodes, adjacencyMap, viewport, globalAnimations]);

    if (!rootIds || rootIds.length === 0) return null;

    return (
        <CleanRenderContext.Provider value={contextValue}>
            <AnimationStyles />
            <div style={{ position: 'relative', width: '100%' }}>
                {/* 🛡️ Interaction Blocker Overlay during Preview Mode maps */}
                {isPreview && (
                    <div 
                        style={{ 
                            position: 'fixed', inset: 0, zIndex: 9999, 
                            background: 'rgba(0,0,0,0.01)', cursor: 'not-allowed' 
                        }} 
                        title="(Preview Mode) Interactions Disabled" 
                    />
                )}

                {rootIds.map(id => (
                    <CleanNode key={`clean-${id}`} id={id} />
                ))}
            </div>
        </CleanRenderContext.Provider>
    );
});

// ─── Recursive Clean Node ─────────────────────────────────────────────────────

interface CleanNodeProps {
    id: string;
    index?: number;
}

const CleanNode: React.FC<CleanNodeProps> = React.memo(({ id, index = 0 }) => {
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
            {childIds.map((childId: string, idx: number) => (
                <CleanNode key={`clean-${childId}`} id={childId} index={idx} />
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
            index={index}
        >
            <Component {...node.props} nodeId={id}>
                {children}
            </Component>
        </CleanAnimatedDiv>
    );
});

// ─── Default Animation Type Mappings ───────────────────────────────────────────

const DEFAULT_ANIMATIONS: Record<string, { type: string; duration?: number; stagger?: number }> = {
    hero_banner: { type: 'def-hero', duration: 600 },
    product_grid: { type: 'slideup', stagger: 80, duration: 600 },
    text_section: { type: 'fadein', duration: 400 },
    trust_badges: { type: 'fadein', stagger: 60 },
    customer_reviews: { type: 'slideup' },
    faq_accordion: { type: 'none' }, // 🛡️ Interactive contents bypass
};

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
    index?: number;
    children: React.ReactNode;
}

/**
 * CleanAnimatedDiv: A minimal DOM wrapper for each block.
 */
const CleanAnimatedDiv: React.FC<CleanAnimatedDivProps> = ({ nodeId, type, style, animations, index = 0, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const { globalAnimations } = useCleanRender();

    const defaultAnim = DEFAULT_ANIMATIONS[type.toLowerCase()] || { type: 'fadein' };
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
        const staggerDelay = staggerConstant ? Math.min(index, 4) * staggerConstant : 0; // 🛡️ Cap at index 4 (320ms max)
        const delay = baseDelay + staggerDelay;
        const dur = animations?.duration ?? defaultAnim.duration ?? 600;

        return {
            transitionDuration: `${dur}ms`,
            transitionDelay: `${delay}ms`,
        };
    }, [hasAnim, animations, globalAnimations, index, defaultAnim]);

    // 🛡️ Bypasses adding component nodes frames if animations toggled off
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

    const animTypeClass = resolvedType.toLowerCase();

    return (
        <div
            ref={ref}
            id={nodeId}
            className={`omnora-live ${type.toLowerCase()} ${hasAnim ? `omnora-anim-entry omnora-anim-${animTypeClass}` : ''} ${visible ? 'visible' : ''}`}
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
