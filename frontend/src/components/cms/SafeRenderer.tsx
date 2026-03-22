import React, { useState, useEffect, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ComponentRegistry, DEFAULT_PROPS } from './ComponentRegistry';
import { StoreTemporarilyPaused } from './StoreTemporarilyPaused';
import { OmnoraKernel } from '../../platform/kernel/OmnoraKernel';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { useAuth } from '../../context/AuthContext';
import { StorefrontFallback } from './StorefrontFallback';

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
        console.error('[SafeRenderer Crash]', error, errorInfo);
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

export const CanvasEmptyState: React.FC = () => {
    return (
        <div style={S_Placeholder}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧩</div>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Empty Canvas</h3>
            <p style={{ color: '#71717a', fontSize: '13px', maxWidth: '280px', margin: '0 auto 16px' }}>
                Drag a block here to start building your store.
            </p>
            <div style={{ padding: '6px 12px', border: '1px dashed #333', borderRadius: '4px', fontSize: '11px', color: '#52525b' }}>
                Canvas Ready
            </div>
        </div>
    );
};

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

interface SafeRendererProps {
    blocks?: any[];
    loading?: boolean;
    isBuilder?: boolean;
    fbPixelId?: string;
    ttPixelId?: string;
    walletDaysRemaining?: number;
}

export const SafeRenderer: React.FC<SafeRendererProps> = ({ blocks, loading, isBuilder = false, fbPixelId, ttPixelId, walletDaysRemaining }) => {
    const [isClient, setIsClient] = useState(false);
    const [hydratedBlocks, setHydratedBlocks] = useState<any[]>([]);
    const [isForceRender, setIsForceRender] = useState(false);
    const nodes = useBuilderStore(s => s.nodes); 
    const lastDroppedNodeId = useBuilderStore(s => s.lastDroppedNodeId); 
    const selectedNodeId = useBuilderStore(s => s.selectedNodeId);
    const isDraggingGlobal = useBuilderStore(s => s.isDragging);

    const { user } = useAuth();
    const location = useLocation();
    const [walletDays, setWalletDays] = useState<number | undefined>(walletDaysRemaining);
    const billingCache = useRef<{ cachedDays?: number; lastCheckedRoute?: string }>({});

    // 🛡️ Cached Billing Enforcement Query
    useEffect(() => {
        if (isBuilder || !user) return;

        const checkBilling = async () => {
            const currentRoute = location.pathname;
            
            if (billingCache.current.lastCheckedRoute === currentRoute && billingCache.current.cachedDays !== undefined) {
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

                    // 🛡️ Grace Period Invisible Audit Telemetry [-1, -3] bounds
                    if (days <= -1 && days >= -3) {
                         console.warn(`[Audit Telemetry] Store in grace-period: ${days} days left. Path: ${currentRoute}`);
                         // Silent insert if system_logs was available
                    }
                }
            } catch (err) {
                console.error('[SafeRenderer] Billing query failure:', err);
            }
        };

        checkBilling();
    }, [isBuilder, user, location.pathname]);

    // Timeout: If loading freezes over 5000ms natively force render what we have.
    useEffect(() => {
        if (!loading) {
            setIsForceRender(false);
            return;
        }
        const timer = setTimeout(() => {
            console.warn('[SafeRenderer] Infinite load threshold hit (>5s). Aborting and native rendering.');
            setIsForceRender(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        setIsClient(true);
        if (!isBuilder) {
            import('../../utils/PixelManager').then(({ PixelManager }) => {
                PixelManager.init(fbPixelId, ttPixelId);
            });
        }
    }, [isBuilder, fbPixelId, ttPixelId]);

    useEffect(() => {
        if (!isClient || !blocks || blocks.length === 0) return;

        // Omnora Kernel Shield
        OmnoraKernel.getInstance().hydrate(blocks).then(ast => {
            setHydratedBlocks(ast.blocks || ast);
        });

        performance.mark('safe-render-start');
        
        return () => {
            performance.mark('safe-render-end');
            try {
                performance.measure('ast-render-duration', 'safe-render-start', 'safe-render-end');
                const measure = performance.getEntriesByName('ast-render-duration')[0];
                if (measure && measure.duration > 100) {
                    console.warn(`[SafeRenderer Performance] Render duration exceeds 100ms: ${measure.duration.toFixed(2)}ms`);
                }
                performance.clearMarks('safe-render-start');
                performance.clearMarks('safe-render-end');
                performance.clearMeasures('ast-render-duration');
            } catch (err) { /* silent measures failure */ }
        };
    }, [blocks, isClient]);

    if (!blocks) return <SkeletonLoader />;
    if (loading && !isForceRender) return <SkeletonLoader />;
    if (!isClient) return <div style={{ minHeight: '100vh', background: '#0e0e12' }} />; // Hydration Guard
    
    // Enforcement Middleware
    if (!isBuilder && walletDays !== undefined) {
        if (walletDays <= -4) {
             return <StoreTemporarilyPaused />;
        }
    }

    if (!hydratedBlocks) return <SkeletonLoader />;

    const finalBlocks = Array.isArray(hydratedBlocks) ? hydratedBlocks : [];
    if (finalBlocks.length === 0) return <CanvasEmptyState />;

    let renderedBlocks: React.ReactNode[] = [];
    try {
        renderedBlocks = finalBlocks.map((blockId: any, index: number) => {
            // Support both object passing or ID strings passing
            const node = typeof blockId === 'string' ? nodes[blockId] : blockId;
            if (!node || !node.type) return null;

            const registryItem = ComponentRegistry[node.type];
            if (!registryItem) return null;

            // Support both React.lazy Exotic components or inline FC components
            const Component = registryItem as React.FC<any>; 
            // Kernel has already safely sanitized node.props against DEFAULT_PROPS schema
            const finalProps = { 
                ...(DEFAULT_PROPS[node.type]?.defaultProps || {}), 
                ...(node.props || {}), 
                isBuilder 
            };

            return (
                <ErrorBoundary key={node.id || index} fallback={
                    <div style={{ padding: 24, border: '1px solid #7f1d1d', background: '#450a0a', color: '#fca5a5', borderRadius: 8, margin: '12px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Block Crashed ({node.type})</h3>
                        <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '16px' }}>This component encountered a fatal runtime error and was halted.</p>
                        {isBuilder && (
                            <button 
                                onClick={() => useBuilderStore.getState().deleteNode(node.id)}
                                style={{ padding: '6px 12px', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                [ 🗑️ Delete Corrupted Block ]
                            </button>
                        )}
                    </div>
                }>
                    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading {node.type}...</div>}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            {isBuilder && (
                                <div 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        useBuilderStore.getState().setSelectedNodeId(node.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        border: (selectedNodeId === node.id) ? '2px solid var(--accent-primary, #7c6dfa)' : 'none',
                                        pointerEvents: (isDraggingGlobal || (selectedNodeId === node.id)) ? 'none' : 'auto',
                                        zIndex: 10,
                                        cursor: (selectedNodeId === node.id) ? 'default' : 'pointer',
                                        borderRadius: '4px'
                                    }}
                                />
                            )}
                            <div className={node.id === lastDroppedNodeId ? 'dropped-block' : ''}>
                                <Component {...finalProps} />
                            </div>
                        </div>
                    </Suspense>
                </ErrorBoundary>
            );

        });
    } catch (err) {
        console.error('[SafeRenderer] FATAL MAP CRASH:', err);
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

const S_ErrorFallback: React.CSSProperties = {
    padding: '20px', textAlign: 'center', background: '#1C1616', color: '#EF4444',
    borderRadius: '8px', border: '1px solid #7F1D1D', margin: '12px', fontFamily: 'monospace'
};

const S_Placeholder: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '60vh', width: '100%', textAlign: 'center',
    border: '2px dashed #27272a', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', padding: '20px'
};
