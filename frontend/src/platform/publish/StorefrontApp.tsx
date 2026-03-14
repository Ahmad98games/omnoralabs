/**
 * StorefrontApp: The Live Customer-Facing Website (Phase 14 — Cloud-Enabled)
 *
 * Now fetches StorefrontConfig from the CLOUD via IDatabaseClient,
 * resolving by domain or storeId from URL parameters.
 *
 * Resolution order:
 *   1. ?store={storeSlug} URL parameter → databaseClient.getStoreConfigByDomain()
 *   2. Merchant subdomain parsing (e.g., my-store.omnora.com)
 *   3. Fallback: localStorage (offline/dev mode)
 *
 * SEPARATION OF CONCERNS:
 *   ✗ No BuilderContext, SmartSidebar, Toolbar, or EditingOverlay
 *   ✓ StorefrontProvider (data layer)
 *   ✓ ThemeManager (CSS variables)
 *   ✓ TemplateResolver (URL → page layout)
 *   ✓ CleanRenderer (zero-overhead rendering)
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { publisher } from './Publisher';
import type { StorefrontConfig } from '../core/DatabaseTypes';
import { CleanRenderer } from './CleanRenderer';
import { ThemeManager } from '../../components/cms/ThemeManager';
import { StorefrontProvider, storefrontStore } from '../../context/StorefrontContext';
import { TemplateResolver, type ResolvedTemplate } from '../core/TemplateResolver';

// ─── Viewport Detection ──────────────────────────────────────────────────────

type Viewport = 'desktop' | 'tablet' | 'mobile';

function detectViewport(): Viewport {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w <= 640) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
}

/**
 * Extract store domain from URL params or subdomain.
 * ?store=my-watches → "my-watches.omnora.com"
 */
function resolveStoreDomain(): string | null {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store') || params.get('storeId');
    if (storeParam) return `${storeParam}.omnora.com`;

    // Subdomain detection: my-store.omnora.com
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[parts.length - 2] === 'omnora') {
        return hostname;
    }

    return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface StorefrontAppProps {
    /** Override the URL path for testing (defaults to window.location.pathname) */
    initialPath?: string;
    /** Override the store domain for testing */
    storeDomain?: string;
}

export const StorefrontApp: React.FC<StorefrontAppProps> = ({ initialPath, storeDomain }) => {
    const [config, setConfig] = useState<StorefrontConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [viewport, setViewport] = useState<Viewport>(detectViewport);
    const [currentPath, setCurrentPath] = useState(initialPath || window.location.pathname);

    // ── Load StorefrontConfig from cloud or fallback ──────────────────────
    useEffect(() => {
        let mounted = true;

        const loadConfig = async () => {
            const domain = storeDomain || resolveStoreDomain();

            try {
                let loaded: StorefrontConfig | null = null;

                if (domain) {
                    // PRIMARY: Cloud fetch by domain
                    loaded = await publisher.loadByDomain(domain);
                    if (loaded && mounted) {
                        console.log(
                            `%c[Omnora Storefront] ☁️ Cloud store loaded%c\n  Domain: ${domain}\n  Build: ${loaded.buildId}`,
                            'color: #34d399; font-weight: bold;',
                            'color: #a1a1aa;'
                        );
                    }
                }

                if (!loaded) {
                    // FALLBACK: localStorage
                    loaded = await publisher.loadPublishedConfig();
                    if (loaded && mounted) {
                        console.log(
                            `%c[Omnora Storefront] 💾 Loaded from localStorage%c\n  Build: ${loaded.buildId}`,
                            'color: #facc15; font-weight: bold;',
                            'color: #a1a1aa;'
                        );
                    }
                }

                if (mounted && loaded) {
                    setConfig(loaded);
                    // Update global storefront context with merchantId
                    storefrontStore.setMerchantId(loaded.merchantId);
                }
                if (mounted && !loaded) {
                    setLoadError('No published store found.');
                }
            } catch (err) {
                if (mounted) setLoadError('Failed to load storefront.');
                console.error('[Omnora Storefront] Load error:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadConfig();
        return () => { mounted = false; };
    }, [storeDomain]);

    // ── Viewport listener ─────────────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => setViewport(detectViewport());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Client-side navigation ────────────────────────────────────────────
    useEffect(() => {
        const handlePopState = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = useCallback((path: string) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    }, []);

    // ── Resolve the current page template ─────────────────────────────────
    const resolvedRoute: ResolvedTemplate | null = useMemo(() => {
        if (!config) return null;
        return TemplateResolver.resolve(currentPath);
    }, [config, currentPath]);

    // ── Determine which root node IDs to render ───────────────────────────
    const rootIds: string[] = useMemo(() => {
        if (!config || !resolvedRoute) return [];
        const layoutKey = resolvedRoute.layoutId;
        return config.pageLayouts[layoutKey] || config.pageLayouts['index'] || [];
    }, [config, resolvedRoute]);

    // ── Loading State ─────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={loadingStyle}>
                <div style={spinnerStyle} />
                <p style={{ color: '#a1a1aa', fontSize: '14px', marginTop: 16 }}>Loading storefront…</p>
            </div>
        );
    }

    // ── Error / Empty / Suspended State ───────────────────────────────────

    if (config && (config as any)._isSuspended) {
        return (
            <div style={emptyStyle}>
                <h2 style={{ color: '#fff', marginBottom: 8, fontSize: '24px' }}>Store Currently Unavailable</h2>
                <p style={{ color: '#71717a', fontSize: '15px', maxWidth: 400, lineHeight: 1.5 }}>
                    This storefront has been disabled. If you are the owner, please contact platform administration.
                </p>
            </div>
        );
    }

    if (loadError || !config) {
        return (
            <div style={emptyStyle}>
                <h2 style={{ color: '#fff', marginBottom: 8 }}>No Published Site</h2>
                <p style={{ color: '#71717a', fontSize: '14px', maxWidth: 400 }}>
                    {loadError || 'Open the Omnora Builder and click "Publish" to deploy your storefront.'}
                </p>
            </div>
        );
    }

    // ── Live Storefront ───────────────────────────────────────────────────

    return (
        <StorefrontProvider>
            <ThemeManager theme={config.theme} />
            <div
                className="omnora-storefront-live"
                style={{
                    minHeight: '100vh',
                    backgroundColor: 'var(--theme-bg, #050508)',
                    color: 'var(--theme-text-primary, #f0f0f5)',
                    fontFamily: 'var(--theme-font-body)',
                }}
            >
                <CleanRenderer
                    nodes={config.nodes}
                    rootIds={rootIds}
                    viewport={viewport}
                />
            </div>
        </StorefrontProvider>
    );
};

// ─── Style Constants ──────────────────────────────────────────────────────────

const loadingStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: '#050508',
};

const spinnerStyle: React.CSSProperties = {
    width: 32, height: 32,
    border: '3px solid #27272a',
    borderTopColor: '#7c6dfa',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
};

const emptyStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: '#050508',
    textAlign: 'center', padding: '2rem',
};

export default StorefrontApp;
