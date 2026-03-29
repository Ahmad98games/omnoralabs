import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CleanRenderer } from '../platform/publish/CleanRenderer';
import { TemplateResolver } from '../platform/core/TemplateResolver';
import type { StorefrontConfig } from '../platform/core/DatabaseTypes';

interface CustomPageProps {
    config: StorefrontConfig;
    viewport: 'desktop' | 'tablet' | 'mobile';
}

/**
 * CustomPage: The dynamic CMS engine for catch-all routes.
 * 
 * DESIGN:
 * - Resolves the current URL to a template/layout via TemplateResolver.
 * - Hydrates the CleanRenderer with the specific node tree from the manifest.
 * - ZERO builder overhead.
 */
export default function CustomPage({ config, viewport }: CustomPageProps) {
    const location = useLocation();

    // ── Resolve Layout ────────────────────────────────────────────────────
    const resolvedRoute = useMemo(() => {
        return TemplateResolver.resolve(location.pathname);
    }, [location.pathname]);

    // ── Determine Root Nodes ──────────────────────────────────────────────
    const rootIds = useMemo(() => {
        if (!config || !resolvedRoute) return [];
        // Priority: Current Slug Layout → Page Category Layout → Default Index
        return (
            config.pageLayouts[resolvedRoute.layoutId] || 
            config.pageLayouts['page_default'] || 
            config.pageLayouts['index'] || 
            []
        );
    }, [config, resolvedRoute]);

    if (!resolvedRoute || rootIds.length === 0) {
        return (
            <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center text-center px-6">
                <div className="text-white/5 font-black text-9xl mb-4 tracking-tighter">404</div>
                <h1 className="text-xl font-bold uppercase tracking-widest text-white/40 mb-12">The requested sector does not exist</h1>
                <a href="/" className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-white/90 transition-all">
                    Return to Home
                </a>
            </div>
        );
    }

    return (
        <CleanRenderer 
            nodes={config.nodes} 
            rootIds={rootIds} 
            viewport={viewport} 
            pageId={resolvedRoute.layoutId} 
            globalAnimations={config.pages?.[resolvedRoute.layoutId]?.globalAnimations ?? true}
        />
    );
}
