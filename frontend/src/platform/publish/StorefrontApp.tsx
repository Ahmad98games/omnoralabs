import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { publisher } from './Publisher';
import type { StorefrontConfig } from '../core/DatabaseTypes';
import { CleanRenderer } from './CleanRenderer';
import { ThemeManager } from '../../components/cms/ThemeManager';
import { StorefrontProvider, storefrontStore } from '../../context/StorefrontContext';
import { TemplateResolver } from '../core/TemplateResolver';
import { CustomerAuthProvider } from '../../context/CustomerAuthContext';
import { StorefrontAnalytics } from '../../components/cms/StorefrontAnalytics';
import { SEOHead } from '../../components/cms/SEOHead';

// ─── LAZY LOADED ROUTE COMPONENTS ───────────────────────────────────────────
const Cart = lazy(() => import('../../pages/Cart'));
const Checkout = lazy(() => import('../../pages/Checkout'));
const Search = lazy(() => import('../../pages/Search'));
const CustomPage = lazy(() => import('../../pages/CustomPage'));
const OrderConfirmation = lazy(() => import('../../pages/OrderConfirmation'));
const CustomerDashboard = lazy(() => import('../../components/storefront/CustomerProfile'));

// ─── Viewport Detection ──────────────────────────────────────────────────────
type Viewport = 'desktop' | 'tablet' | 'mobile';
function detectViewport(): Viewport {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w <= 640) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
}

export interface StorefrontAppProps {
    storeId: string;
}

const OMNORA_CORE_VERSION = '1.1.0'; // 🛠️ PRODUCTION HARDENING

export const StorefrontApp: React.FC<StorefrontAppProps> = ({ storeId }) => {
    const [config, setConfig] = useState<StorefrontConfig | null>(() => {
        try {
            const cachedVersion = localStorage.getItem('OMNORA_VERSION');
            if (cachedVersion !== OMNORA_CORE_VERSION) {
                localStorage.clear();
                localStorage.setItem('OMNORA_VERSION', OMNORA_CORE_VERSION);
                return null;
            }
            const cached = localStorage.getItem(`omnora_cache_${storeId}`);
            return cached ? JSON.parse(cached) : null;
        } catch { return null; }
    });
    
    const [loading, setLoading] = useState(!config);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [viewport, setViewport] = useState<Viewport>(detectViewport);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;
        const loadConfig = async () => {
            try {
                const forceRefresh = window.location.search.includes('revalidate=true');
                if (!config || forceRefresh) {
                    const loaded = await publisher.loadByDomain(storeId);
                    if (mounted && loaded) {
                        setConfig(loaded);
                        storefrontStore.setMerchantId(loaded.merchantId);
                        localStorage.setItem(`omnora_cache_${storeId}`, JSON.stringify(loaded));
                    } else if (mounted && !config) {
                        setLoadError('No published store found.');
                    }
                }
            } catch (err) {
                if (mounted && !config) setLoadError('Failed to load storefront.');
                console.error('[StorefrontApp] Load error:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadConfig();
        return () => { mounted = false; };
    }, [storeId, config]);

    useEffect(() => {
        const handleResize = () => setViewport(detectViewport());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const resolvedRoute = useMemo(() => {
        if (!config) return null;
        return TemplateResolver.resolve(location.pathname);
    }, [config, location.pathname]);

    const rootIds = useMemo(() => {
        if (!config || !resolvedRoute) return [];
        return config.pageLayouts[resolvedRoute.layoutId] || config.pageLayouts['index'] || [];
    }, [config, resolvedRoute]);

    if (loading && !config) return <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white/5 font-black uppercase tracking-[0.3em] animate-pulse text-xs">Omnora Kernel Initializing</div>;
    if (loadError && !config) return (
        <div className="min-h-screen bg-[#000000] text-white/20 flex flex-col items-center justify-center font-black uppercase tracking-widest text-xs text-center p-8">
            <div className="mb-4">NULL MANIFEST ERROR</div>
            <a href="/" className="text-white border-b border-white/20 pb-1 hover:border-white transition-all">Reload System</a>
        </div>
    );

    return (
        <CustomerAuthProvider>
            <StorefrontProvider>
                <ThemeManager theme={config!.theme} />
                <StorefrontAnalytics />
                <SEOHead 
                    storeName={config!.storeName} 
                    description={config!.seoDescription}
                />
                
                <div className="omnora-sovereign-shell min-h-screen bg-[#000000] text-white font-sans selection:bg-white selection:text-black">
                    <Suspense fallback={<div className="h-[2px] w-full bg-white/20 overflow-hidden fixed top-0 left-0 z-[9999]"><div className="h-full bg-white w-1/3 animate-pulse" /></div>}>
                        <Routes>
                            <Route index element={<CleanRenderer nodes={config!.nodes} rootIds={rootIds} viewport={viewport} pageId="home" />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/thank-you" element={<OrderConfirmation />} />

                            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                            <Route path="/account/*" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />

                            <Route path="/:slug" element={<CustomPage config={config!} viewport={viewport} />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </StorefrontProvider>
        </CustomerAuthProvider>
    );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="animate-in fade-in duration-500">{children}</div>;
};

export default StorefrontApp;
