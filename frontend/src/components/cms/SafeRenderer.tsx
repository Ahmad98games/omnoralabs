/**
 * 🛠️ OMNORA LABS | [SAFE RENDERER]
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ComponentRegistry, DEFAULT_PROPS, resolveComponentType } from './ComponentRegistry';
import { StoreTemporarilyPaused } from './StoreTemporarilyPaused';
import { Kernel } from '../../lib/kernel/Kernel';
import { OmnoraLogger } from '../../lib/kernel/utils/logger';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { useAuth } from '../../context/AuthContext';
import { StorefrontFallback } from './StorefrontFallback';

import { NodesContext } from '../../context/BuilderContext';
import { useContext } from 'react';

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        OmnoraLogger.error('SAFE-RENDERER', `Component Crash: ${error} ${errorInfo}`);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={S_ErrorFallback}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>⚠️ Component Failed to Load</h3>
                    <p style={{ fontSize: '11px', opacity: 0.7, margin: 0 }}>
                        {this.state.error?.message || 'Unknown runtime error'}
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export const CanvasEmptyState: React.FC<{ message?: string; subMessage?: string }> = ({ message, subMessage }) => {
    return (
        <div style={S_Placeholder}>
            <div style={{ fontSize: '28px', marginBottom: '12px', color: '#a1a1aa' }}>✦</div>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                {message || 'Empty Canvas'}
            </h3>
            <p style={{ color: '#71717a', fontSize: '13px', maxWidth: '320px', margin: '0 auto', lineHeight: '1.5' }}>
                {subMessage || 'Drag a block here to start building your store.'}
            </p>
        </div>
    );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

export const SkeletonLoader: React.FC = () => {
    return (
        <div style={{ padding: '24px', width: '100%', height: '100%', background: '#030304' }}>
            <motion.div
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                style={{ height: '200px', background: '#18181b', borderRadius: '12px', marginBottom: '16px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[1, 2].map(i => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ duration: 1, delay: i * 0.3, repeat: Infinity, repeatType: 'reverse' }}
                        style={{ height: '160px', background: '#18181b', borderRadius: '8px' }}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SafeRendererProps {
    blocks?: any[];
    loading?: boolean;
    isBuilder?: boolean;
    fbPixelId?: string;
    ttPixelId?: string;
    walletDaysRemaining?: number;
}

// ─── SafeRenderer ─────────────────────────────────────────────────────────────

export const SafeRenderer: React.FC<SafeRendererProps> = ({
    blocks,
    loading,
    isBuilder = false,
    fbPixelId,
    ttPixelId,
    walletDaysRemaining,
}) => {
    const [isClient, setIsClient] = useState(false);
    const [hydratedStorefrontBlocks, setHydratedStorefrontBlocks] = useState<any[]>([]);
    const [isForceRender, setIsForceRender] = useState(false);

    const nodesContext = useContext(NodesContext);

    // Builder state — uses Context when building to synchronize with Sidebars/Toolbar
    const nodes = isBuilder ? (nodesContext?.nodes || {}) : {};
    const activePageId = isBuilder ? (nodesContext?.activePageId || '') : '';
    const pageLayouts = isBuilder ? (nodesContext?.pageLayouts || {}) : {};
    const selectedNodeId = isBuilder ? nodesContext?.selectedNodeId : null;

    const lastDroppedNodeId = useBuilderStore(s => s.lastDroppedNodeId);
    const isDraggingGlobal = useBuilderStore(s => s.isDragging);
    const isHydrating = useBuilderStore(s => s.isHydrating);

    const { user } = useAuth();
    const location = useLocation();
    const [walletDays, setWalletDays] = useState<number | undefined>(walletDaysRemaining);
    const billingCache = useRef<{ cachedDays?: number; lastCheckedRoute?: string }>({});

    // ── Billing enforcement (storefront only) ──────────────────────────────
    useEffect(() => {
        if (isBuilder || !user) return;

        const checkBilling = async () => {
            const currentRoute = location.pathname;

            if (
                billingCache.current.lastCheckedRoute === currentRoute &&
                billingCache.current.cachedDays !== undefined
            ) {
                setWalletDays(billingCache.current.cachedDays);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('merchants')
                    .select('wallet_days_remaining')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    const days = data.wallet_days_remaining;
                    setWalletDays(days);
                    billingCache.current = { cachedDays: days, lastCheckedRoute: currentRoute };

                    if (days <= -1 && days >= -3) {
                        console.warn(`[Audit] Store in grace period: ${days} days. Path: ${currentRoute}`);
                    }
                }
            } catch (err) {
                OmnoraLogger.error('SAFE-RENDERER', `Billing query failure: ${err}`);
            }
        };

        checkBilling();
    }, [isBuilder, user, location.pathname]);

    // ── Force-render escape hatch (5s loading freeze) ─────────────────────
    useEffect(() => {
        if (!loading) {
            setIsForceRender(false);
            return;
        }
        const timer = setTimeout(() => {
            OmnoraLogger.warn('SAFE-RENDERER', 'Load threshold exceeded (>5s). Force-rendering.');
            setIsForceRender(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    // ── Client mount + pixel init ──────────────────────────────────────────
    useEffect(() => {
        setIsClient(true);
        if (!isBuilder) {
            import('../../utils/PixelManager').then(({ PixelManager }) => {
                PixelManager.init(fbPixelId, ttPixelId);
            });
        }
    }, [isBuilder, fbPixelId, ttPixelId]);

    // ── Storefront block hydration via OmnoraKernel ────────────────────────
    // Only runs when blocks prop is provided (storefront path).
    // Builder path uses nodes from Zustand directly — never uses this state.
    useEffect(() => {
        if (!isClient || !blocks || blocks.length === 0) return;

        Kernel.hydrate(blocks).then(ast => {
            setHydratedStorefrontBlocks(ast.blocks || ast);
        });

        performance.mark('safe-render-start');
        return () => {
            performance.mark('safe-render-end');
            try {
                performance.measure('ast-render-duration', 'safe-render-start', 'safe-render-end');
                const measure = performance.getEntriesByName('ast-render-duration')[0];
                if (measure && measure.duration > 100) {
                    OmnoraLogger.warn('SAFE-RENDERER', `Render exceeded 100ms: ${measure.duration.toFixed(2)}ms`);
                }
                performance.clearMarks('safe-render-start');
                performance.clearMarks('safe-render-end');
                performance.clearMeasures('ast-render-duration');
            } catch { /* ignore */ }
        };
    }, [blocks, isClient]);

    // ── Early returns ──────────────────────────────────────────────────────

    // Hydration guard — prevents SSR mismatch flash
    if (!isClient) {
        return <div style={{ minHeight: '100vh', background: '#0e0e12' }} />;
    }

    // Loading state with escape hatch
    if (loading && !isForceRender) {
        return <SkeletonLoader />;
    }

    // Billing hard lock (storefront only, never in builder)
    if (!isBuilder && walletDays !== undefined && walletDays <= -4) {
        return <StoreTemporarilyPaused />;
    }

    // ── BUILDER RENDER PATH ────────────────────────────────────────────────
    // Uses Zustand nodes directly. Completely separate from storefront path.
    if (isBuilder) {
        // Guard: no active page selected
        if (!activePageId) {
            return (
                <CanvasEmptyState
                    message="No page selected"
                    subMessage="Select a page from the toolbar above to start editing."
                />
            );
        }

        // Safe block resolution — never throws on undefined
        const rawBuilderBlocks = pageLayouts?.[activePageId];
        const safeBuilderBlocks = Array.isArray(rawBuilderBlocks) ? rawBuilderBlocks : [];

        // Guard: page exists but has no blocks yet
        if (safeBuilderBlocks.length === 0 && !isHydrating) {
            return (
                <CanvasEmptyState
                    message="This page is empty"
                    subMessage="Open the Elements panel on the left and drag a block to get started."
                />
            );
        }

        // Guard: still hydrating
        if (isHydrating) {
            return <SkeletonLoader />;
        }

        return (
            <ErrorBoundary fallback={<StorefrontFallback />}>
                <div style={{ position: 'relative', width: '100%' }}>
                    {safeBuilderBlocks.map((blockId: any, index: number) => {
                        const node = typeof blockId === 'string' ? nodes[blockId] : blockId;
                        if (!node || !node.type) return null;

                        const realType = resolveComponentType(node.type);
                        const registryItem = ComponentRegistry[realType];
                        if (!registryItem) return null;

                        const Component = registryItem as React.FC<any>;
                        const finalProps = {
                            ...(DEFAULT_PROPS[realType]?.defaultProps || {}),
                            ...(node.props || {}),
                            isBuilder: true,
                        };

                        return (
                            <ErrorBoundary
                                key={node.id || index}
                                fallback={
                                    <div style={{
                                        padding: 24,
                                        border: '1px solid #7f1d1d',
                                        background: '#450a0a',
                                        color: '#fca5a5',
                                        borderRadius: 8,
                                        margin: '12px',
                                        textAlign: 'center',
                                    }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            ⚠️ Block Crashed ({node.type})
                                        </h3>
                                        <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '16px' }}>
                                            This component encountered a fatal runtime error.
                                        </p>
                                        <button
                                            onClick={() => useBuilderStore.getState().deleteNode(node.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#7f1d1d',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            🗑️ Delete Corrupted Block
                                        </button>
                                    </div>
                                }
                            >
                                <Suspense fallback={
                                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                                        Loading {node.type}...
                                    </div>
                                }>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        {/* Selection overlay — captures clicks without modifying block styles */}
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                useBuilderStore.getState().setSelectedNodeId(node.id);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                border: selectedNodeId === node.id
                                                    ? '2px solid var(--accent-primary, #FF6B35)'
                                                    : 'none',
                                                // Pointer events logic:
                                                // - During drag: none (let drag system handle)
                                                // - When selected: none (let inner elements be interactive)
                                                // - Unselected: auto (capture the selection click)
                                                pointerEvents: (isDraggingGlobal || selectedNodeId === node.id)
                                                    ? 'none'
                                                    : 'auto',
                                                zIndex: 10,
                                                cursor: selectedNodeId === node.id ? 'default' : 'pointer',
                                                borderRadius: '4px',
                                            }}
                                        />
                                        <div className={node.id === lastDroppedNodeId ? 'dropped-block' : ''}>
                                            <Component {...finalProps} />
                                        </div>
                                    </div>
                                </Suspense>
                            </ErrorBoundary>
                        );
                    })}
                </div>
            </ErrorBoundary>
        );
    }

    // ── STOREFRONT RENDER PATH ─────────────────────────────────────────────
    // Uses blocks prop hydrated through OmnoraKernel.
    // Completely separate from builder path above.

    // No blocks prop provided at all
    if (!blocks) {
        return <SkeletonLoader />;
    }

    // Blocks provided but kernel hydration not yet complete
    if (blocks.length > 0 && hydratedStorefrontBlocks.length === 0) {
        return <SkeletonLoader />;
    }

    // Empty storefront page
    if (hydratedStorefrontBlocks.length === 0) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#71717a', fontSize: '14px' }}>This page has no content yet.</p>
            </div>
        );
    }

    let renderedBlocks: React.ReactNode[] = [];
    try {
        renderedBlocks = hydratedStorefrontBlocks.map((node: any, index: number) => {
            if (!node || !node.type) return null;

            const realType = resolveComponentType(node.type);
            const registryItem = ComponentRegistry[realType];
            if (!registryItem) return null;

            const Component = registryItem as React.FC<any>;
            const finalProps = {
                ...(DEFAULT_PROPS[realType]?.defaultProps || {}),
                ...(node.props || {}),
                isBuilder: false,
            };

            return (
                <ErrorBoundary
                    key={node.id || index}
                    fallback={
                        <div style={{
                            padding: 24,
                            border: '1px solid #7f1d1d',
                            background: '#450a0a',
                            color: '#fca5a5',
                            borderRadius: 8,
                            margin: '12px',
                            textAlign: 'center',
                        }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                ⚠️ Section Failed ({node.type})
                            </h3>
                        </div>
                    }
                >
                    <Suspense fallback={
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            Loading section...
                        </div>
                    }>
                        <Component {...finalProps} />
                    </Suspense>
                </ErrorBoundary>
            );
        });
    } catch (err) {
        OmnoraLogger.error('SAFE-RENDERER', `FATAL STOREFRONT MAP CRASH: ${err}`);
        return <StorefrontFallback />;
    }

    return (
        <ErrorBoundary fallback={<StorefrontFallback />}>
            <div style={{ position: 'relative', width: '100%' }}>
                {renderedBlocks}
            </div>
        </ErrorBoundary>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S_ErrorFallback: React.CSSProperties = {
    padding: '20px',
    textAlign: 'center',
    background: '#1C1616',
    color: '#EF4444',
    borderRadius: '8px',
    border: '1px solid #7F1D1D',
    margin: '12px',
    fontFamily: 'monospace',
};

const S_Placeholder: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    width: '100%',
    textAlign: 'center',
    border: '2px dashed #27272a',
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.2)',
    padding: '20px',
};