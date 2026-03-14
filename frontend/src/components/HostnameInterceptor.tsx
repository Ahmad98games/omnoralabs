import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Layout } from './Layout';
import Home from '../pages/HomeWithAds';
import Collection from '../pages/Collection';
import Product from '../pages/Product';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import About from '../pages/About';
import { ThankYouPage } from './storefront/ThankYouPage';
import { CustomerDashboard } from './storefront/CustomerDashboard';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { CustomerAuthProvider } from '../context/CustomerAuthContext';
import { Store, Globe } from 'lucide-react';
import { StorefrontAnalytics } from './cms/StorefrontAnalytics';
import { SEOHead } from './cms/SEOHead';
import { useStorefront } from '../hooks/useStorefront';
import { useQuery } from '@tanstack/react-query';
import { databaseClient } from '../platform/core/DatabaseClient';

const PLATFORM_DOMAINS = [
    'localhost', 
    'omnora.com', 
    'omnora.vercel.app', 
    'omnora-os.vercel.app',
    'vercel.app', 
    '127.0.0.1'
];

const isPlatformDomain = (hostname: string) => {
    return PLATFORM_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
};

export const HostnameInterceptor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCustomDomain, setIsCustomDomain] = useState(false);

    useEffect(() => {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        // Internal Vercel Rewrite detection (if applicable via path)
        const siteMatch = pathname.match(/^\/_sites\/([^\/]+)/);
        const resolvedHost = siteMatch ? siteMatch[1] : hostname;

        if (isPlatformDomain(hostname) && !siteMatch) {
            setIsCustomDomain(false);
            setLoading(false);
            return;
        }

        setIsCustomDomain(true);

        const fetchStore = async () => {
            try {
                // Check if already resolved by another layer
                if ((window as any).__OMNORA_TENANT_ID__) {
                    setStoreId((window as any).__OMNORA_TENANT_ID__);
                    setLoading(false);
                    return;
                }

                // Query by Custom Domain OR internal slug
                const { data, error } = await supabase
                    .from('merchants')
                    .select('id, store_slug')
                    .or(`custom_domain.eq."${resolvedHost}",store_slug.eq."${resolvedHost}"`)
                    .single();

                if (data && !error) {
                    const activeTenant = data.store_slug || data.id;
                    (window as any).__OMNORA_TENANT_ID__ = activeTenant;
                    setStoreId(activeTenant);
                }
            } catch (err) {
                console.error("[Omnora Edge] Hostname verification failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStore();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
                    <Store size={48} className="text-white/20 mb-6 relative z-10" />
                </div>
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            </div>
        );
    }

    if (isCustomDomain) {
        if (!storeId) {
            return (
                <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans">
                    <SEOHead storeName="Domain Not Bound | Omnora" />
                    <div className="max-w-md text-center px-6">
                        <Globe size={64} className="mx-auto text-white/5 mb-8" />
                        <h1 className="text-4xl font-black mb-4 tracking-tighter">Domain Not Bound</h1>
                        <p className="text-gray-500 text-lg leading-relaxed">
                            The domain <span className="text-indigo-400 font-mono text-sm">{window.location.hostname}</span> is not mapped to an active Omnora OS storefront.
                        </p>
                        <div className="mt-10 h-1 w-24 bg-indigo-500/20 mx-auto rounded-full" />
                    </div>
                </div>
            );
        }

        return <StorefrontRouter storeId={storeId} />;
    }

    return <>{children}</>;
};

// Extracted Storefront Router to handle active page SEO context
const StorefrontRouter: React.FC<{ storeId: string }> = ({ storeId }) => {
    const { content } = useStorefront();
    const location = useLocation();
    const path = location.pathname.split('/').filter(Boolean).pop() || 'home';
    
    // Resolve active page metadata from AST
    const activePage = useMemo(() => {
        if (!content?.pages) return null;
        return content.pages[path] || content.pages['home'];
    }, [content, path]);

    // Handle dynamic product SEO if on product page
    const productId = location.pathname.includes('/product/') ? location.pathname.split('/').pop() : null;
    const { data: product } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => databaseClient.getProductById(productId!),
        enabled: !!productId
    });

    return (
        <CustomerAuthProvider>
            <StorefrontAnalytics />
            <SEOHead 
                storeName={activePage?.seoMeta?.title} 
                description={activePage?.seoMeta?.description}
                ogImage={activePage?.seoMeta?.ogImage}
                productData={product}
            />
            <Routes>
                <Route element={<Layout children={<Outlet />} />}>
                    <Route path="/" element={<Home />} />
                    <Route path="collection" element={<Collection />} />
                    <Route path="product/:id" element={<Product />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="about" element={<About onBack={() => window.history.back()} />} />
                    <Route path="thank-you" element={<ThankYouPage />} />
                    <Route path="account" element={<CustomerDashboard />} />
                    <Route path="*" element={<Home />} />
                </Route>
            </Routes>
        </CustomerAuthProvider>
    );
}
