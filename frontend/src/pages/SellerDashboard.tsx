import * as React from 'react';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
    LayoutDashboard,
    Package,
    TrendingUp,
    Plus,
    ArrowLeft,
    Hammer,
    ShoppingBag,
    Settings,
    HelpCircle,
    CreditCard,
    ShieldCheck,
    Globe,
    Zap,
    RefreshCw
} from 'lucide-react';
import './SellerDashboard.css';
import { AdminProductManager } from '../components/seller/AdminProductManager';
import { AdminOrderManager } from '../components/seller/AdminOrderManager';
import { AdminOverview } from '../components/seller/AdminOverview';
import SellerAnalytics from '../components/seller/SellerAnalytics';
import SellerProfile from './seller/SellerProfile';

const ProductEditor = React.lazy(() => import('../components/seller/ProductEditor'));
import { BuilderProvider } from '../context/BuilderContext';
import { BuilderLayout } from '../components/builder/BuilderLayout';
import { TourOverlay } from '../components/cms/help/TourOverlay';
import { BuilderHelpPage } from './builder/BuilderHelpPage';
import AdminBillingManager from '../components/admin/AdminBillingManager';
import AdminPaymentSettings from '../components/admin/AdminPaymentSettings';
const DomainSettings = React.lazy(() => import('../components/seller/DomainSettings').then(m => ({ default: m.DomainSettings })));
import { InstallButton } from '../components/seller/InstallButton';
import { RecoveryList } from '../components/merchant/RecoveryList';
import { StoreGenerator } from '../components/seller/StoreGenerator';
import { AutoSaveManager } from '../components/builder/AutoSaveManager';
import { GlobalKeyboardShortcuts } from '../components/builder/GlobalKeyboardShortcuts';
import { BuilderNode, PageMetadata } from '../context/BuilderContext';

interface DashboardPageNode {
    title: string;
    layout: string[];
    [key: string]: unknown;
}

interface DashboardContent {
    id?: string;
    pages: Record<string, DashboardPageNode>;
}

const DEFAULT_CONTENT: DashboardContent = { 
    id: 'default-kernel-manifest',
    pages: { home: { title: 'Home', layout: [] } } 
};

const OmnoraLoading: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        width: '100%',
    }}>
        <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            borderTopColor: '#fff',
            animation: 'spin 0.6s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

const NAV = [
    { id: 'overview',        label: 'Analytics Console', icon: LayoutDashboard },
    { id: 'performance',     label: 'Traffic Engine',    icon: TrendingUp },
    { id: 'orders',          label: 'Fulfillment',       icon: ShoppingBag },
    { id: 'recovery',        label: 'Recovery Hub',      icon: RefreshCw },
    { id: 'inventory',       label: 'Product Vault',     icon: Package },
    { id: 'product-editor',  label: 'Materialize',       icon: Plus },
    { id: 'builder',         label: 'Visual Designer',   icon: Hammer },
    { id: 'billing',         label: 'License',           icon: ShieldCheck },
    { id: 'payments',        label: 'Ledger Settings',   icon: CreditCard },
    { id: 'domain',          label: 'Network',           icon: Globe },
    { id: 'profile',         label: 'System Config',     icon: Settings },
    { id: 'help',            label: 'Documentation',     icon: HelpCircle },
];

interface ErrorBoundaryProps {
    children: React.ReactNode; 
    tabName: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class TabErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '60px', background: 'var(--surface-low)', borderRadius: '12px', border: '1px solid var(--border-mid)', textAlign: 'center' }}>
                    <p style={{ color: '#fff', fontWeight: 700, marginBottom: '8px' }}>Module Isolation Failure</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{this.props.tabName} encountered an unhandled exception.</p>
                    <button type="button" onClick={() => this.setState({ hasError: false })} style={{ marginTop: '16px', padding: '8px 16px', background: '#fff', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Reset Module</button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function SellerDashboard() {
    const { user, profile, isInitialized } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [mobileSidebarOpen, setMob] = useState(false);
    const [loading, setLoading] = useState(true);
    const [localContent, setLocalContent] = useState<DashboardContent | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [tourOpen, setTourOpen] = useState(searchParams.get('tour') === 'true');
    const [forgeOpen, setForgeOpen] = useState(false);
    const [forgePrompt, setForgePrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const isBuilder = activeTab === 'builder';

    // 🏗️ Gated Identity Bridge
    const initialBuilderData = useMemo(() => {
        if (!localContent?.pages?.home) return undefined;
        
        const homeNode = localContent.pages.home as DashboardPageNode;
        
        // If data is already in new normalized format
        const possibleNewData = homeNode as unknown as { nodes: Record<string, BuilderNode>; pages: Record<string, PageMetadata>; activePageId: string };
        if (possibleNewData.nodes && possibleNewData.pages) {
            return possibleNewData;
        }

        // Migration Path: Bridge legacy array-based layout into Registry format
        const layoutArray = Array.isArray(homeNode.layout) ? homeNode.layout : [];
        const nodesRegistry: Record<string, BuilderNode> = {};
        
        layoutArray.forEach((node: unknown) => {
            const bNode = node as BuilderNode;
            if (bNode && bNode.id) nodesRegistry[bNode.id] = bNode;
        });

        return {
            nodes: nodesRegistry,
            pages: {
                'home': { 
                    id: 'home', 
                    title: 'Home', 
                    slug: 'home', 
                    status: 'draft', 
                    type: 'system', 
                    lastUpdated: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    seoMeta: { title: 'Home', description: '' }
                } as PageMetadata
            },
            activePageId: 'home'
        };
    }, [localContent]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab && NAV.some(n => n.id === tab)) setActiveTab(tab);
    }, [searchParams, activeTab]);

    const fetchContent = React.useCallback(async (_signal?: AbortSignal) => {
        if (!user) return;
        try {
            // Atomic Fetch from Kernel Manifest
            const { data, error: fetchError } = await supabase
                .from('store_pages')
                .select('ast_manifest')
                .eq('tenant_id', user.id)
                .eq('slug', 'home')
                .order('is_published', { ascending: false }) // Prefer published
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data?.ast_manifest) {
                // Bridge: Use the ast_manifest as the local content
                setLocalContent(data.ast_manifest as unknown as DashboardContent);
                setError(null);
            } else {
                // Initialize default if missing
                console.log('[Omnora OS] No manifest found. Initializing skeleton...');
                setLocalContent(DEFAULT_CONTENT);
            }
        } catch (err: unknown) {
             console.error('[Omnora OS] Kernel Sync Failure:', err);
             setLocalContent(DEFAULT_CONTENT);
             setError(`Kernel Link Error`);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { 
        if (user) {
            const controller = new AbortController();
            fetchContent(controller.signal); 
            return () => controller.abort();
        }
    }, [user, fetchContent]);

    const save = async () => {
        if (!user) return;
        setSaveStatus('saving');
        try {
            const { error: upsertError } = await supabase
                .from('store_pages')
                .upsert({
                    tenant_id: user.id,
                    slug: 'home',
                    ast_manifest: localContent,
                    is_published: true
                }, { onConflict: 'tenant_id, slug, is_published' });

            if (upsertError) throw upsertError;
            
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('[Omnora OS] Deployment Failure:', err);
            setSaveStatus('error');
        }
    };
    if (!isInitialized || loading) return <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Initializing Omnora Kernel...</div>;

    const storeName = profile?.display_name 
                    || user?.user_metadata?.store_name 
                    || user?.user_metadata?.full_name 
                    || 'Omnora Store';

    return (
        <div className={`seller-dashboard ${isBuilder ? 'builder-active' : ''}`}>
            {!isBuilder && (
                <aside className={`seller-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                    <div className="sidebar-brand">
                        <div className="brand-wrapper">
                            <img 
                                src="/omnoralabs.png" 
                                alt="Omnora Logo" 
                                style={{ width: '24px', height: '24px', objectFit: 'contain', marginRight: '12px' }} 
                            />
                            <div className="brand-info">
                                <p>{storeName}</p>
                                <p>Omnora OS</p>
                            </div>
                        </div>
                    </div>
                    <nav className="sidebar-nav">
                        <p className="nav-section-title">Operations</p>
                        {NAV.slice(0, 6).map(({ id, label, icon: Icon }) => (
                            <button type="button" key={id} onClick={() => setActiveTab(id)} className={`nav-btn ${activeTab === id ? 'active' : ''}`}>
                                <Icon size={16} strokeWidth={2.5} />
                                <span>{label}</span>
                            </button>
                        ))}
                        <p className="nav-section-title">Design</p>
                        {NAV.slice(6, 7).map(({ id, label, icon: Icon }) => (
                            <button type="button" key={id} onClick={() => setActiveTab(id)} className={`nav-btn ${activeTab === id ? 'active' : ''}`}>
                                <Icon size={16} strokeWidth={2.5} />
                                <span>{label}</span>
                            </button>
                        ))}
                        <p className="nav-section-title">Infrastructure</p>
                        {NAV.slice(7).map(({ id, label, icon: Icon }) => (
                            <button type="button" key={id} onClick={() => setActiveTab(id)} className={`nav-btn ${activeTab === id ? 'active' : ''}`}>
                                <Icon size={16} strokeWidth={2.5} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="sidebar-footer">
                        <Link to="/" className="back-link">
                            <ArrowLeft size={14} strokeWidth={3} />
                            <span>System Exit</span>
                        </Link>
                    </div>
                </aside>
            )}

            <div className="dashboard-main">
                {!isBuilder && (
                    <header className="top-header">
                        <div className="header-left">
                            <h1>
                                <span style={{ opacity: 0.4, fontWeight: 500 }}>System / </span>
                                {NAV.find(n => n.id === activeTab)?.label || 'Console'}
                            </h1>
                        </div>
                        <div className="header-right">
                            {error && <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600, marginRight: '16px' }}>{error}</span>}
                            {saveStatus !== 'idle' && <span className={`save-status ${saveStatus}`}>{saveStatus === 'saving' ? 'Syncing...' : 'System Synced'}</span>}
                            <InstallButton />
                            <button type="button" onClick={save} disabled={saveStatus === 'saving'} className="save-btn">Deploy</button>
                        </div>
                    </header>
                )}

                <main className="scroll-content">
                    <div className="content-wrapper">
                        {activeTab === 'overview' && <TabErrorBoundary tabName="Overview"><AdminOverview /></TabErrorBoundary>}
                        {activeTab === 'performance' && <TabErrorBoundary tabName="Analytics"><SellerAnalytics /></TabErrorBoundary>}
                        {activeTab === 'inventory' && <TabErrorBoundary tabName="Products"><AdminProductManager /></TabErrorBoundary>}
                        {activeTab === 'orders' && <TabErrorBoundary tabName="Orders"><AdminOrderManager /></TabErrorBoundary>}
                        {activeTab === 'recovery' && <TabErrorBoundary tabName="Recovery"><RecoveryList /></TabErrorBoundary>}
                        {activeTab === 'product-editor' && <TabErrorBoundary tabName="Editor"><Suspense fallback={<OmnoraLoading />}><ProductEditor /></Suspense></TabErrorBoundary>}
                        {activeTab === 'billing' && <TabErrorBoundary tabName="License"><AdminBillingManager /></TabErrorBoundary>}
                        {activeTab === 'payments' && <TabErrorBoundary tabName="Payments"><AdminPaymentSettings /></TabErrorBoundary>}
                        {activeTab === 'domain' && <TabErrorBoundary tabName="Network"><Suspense fallback={<OmnoraLoading />}><DomainSettings /></Suspense></TabErrorBoundary>}
                        {activeTab === 'profile' && <TabErrorBoundary tabName="System"><SellerProfile /></TabErrorBoundary>}
                        {activeTab === 'help' && <TabErrorBoundary tabName="Guide"><BuilderHelpPage /></TabErrorBoundary>}
                    </div>

                    {activeTab === 'builder' && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#09090b', overflow: 'hidden' }}>
                            {!isInitializing && user ? (
                                <BuilderProvider
                                    initialData={initialBuilderData}
                                    isPreview={false}
                                    tenantId={user?.id || ''}
                                    userName={profile?.display_name || 'Your Store'}
                                >
                                    <AutoSaveManager />
                                    <GlobalKeyboardShortcuts />
                                    <BuilderLayout />
                                    <TourOverlay 
                                        isOpen={tourOpen} 
                                        onClose={() => { 
                                            setTourOpen(false); 
                                            const p = new URLSearchParams(searchParams); 
                                            p.delete('tour'); 
                                            setSearchParams(p); 
                                        }} 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveTab('overview')} 
                                        style={{ 
                                            position: 'fixed', 
                                            bottom: '24px', 
                                            left: '50%', 
                                            transform: 'translateX(-50%)', 
                                            zIndex: 1001, 
                                            padding: '8px 20px', 
                                            background: 'rgba(15, 16, 17, 0.9)', 
                                            backdropFilter: 'blur(10px)', 
                                            border: '1px solid rgba(255, 255, 255, 0.08)', 
                                            borderRadius: '20px', 
                                            color: '#8B8F97', 
                                            fontSize: '12px', 
                                            fontWeight: 800, 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        ← Exit Builder
                                    </button>
                                </BuilderProvider>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                    Initializing Omnora Designer...
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'overview' && !localContent?.pages?.home && (
                        <div className="content-wrapper">
                            <div style={{ background: 'var(--surface-low)', border: '1px solid var(--accent-gold-soft)', padding: '60px 40px', borderRadius: '24px', textAlign: 'center', marginTop: '40px' }}>
                                <Zap size={32} style={{ color: 'var(--accent-gold)', marginBottom: '24px' }} />
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Neural Forge / <span style={{ color: 'var(--accent-gold)' }}>Inactive</span></h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 32px' }}>Storefront manifest missing. Ignite the neural engine to materialize your brand.</p>
                                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                    <textarea style={{ width: '100%', background: '#000', border: '1px solid var(--border-mid)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '14px', minHeight: '120px', marginBottom: '16px', outline: 'none' }} placeholder="Vision description..." value={forgePrompt} onChange={(e) => setForgePrompt(e.target.value)} />
                                    <button type="button" onClick={() => setForgeOpen(true)} disabled={!forgePrompt.trim()} style={{ width: '100%', padding: '16px', background: 'var(--accent-gold)', color: '#000', borderRadius: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Ignite the Forge</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
                <AnimatePresence>
                    {forgeOpen && <StoreGenerator prompt={forgePrompt} onComplete={() => { fetchContent(); setForgeOpen(false); setActiveTab('builder'); }} onCancel={() => setForgeOpen(false)} />}
                </AnimatePresence>
            </div>
            {mobileSidebarOpen && (
                <button 
                    type="button"
                    onClick={() => setMob(false)} 
                    className="backdrop" 
                    aria-label="Close sidebar"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 99
                    }}
                />
            )}
        </div>
    );
}