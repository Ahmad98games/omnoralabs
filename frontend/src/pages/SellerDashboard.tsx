import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios, { AxiosError } from 'axios';
import client from '../api/client';
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
import { useBuilder } from '../context/BuilderContext';
import cmsApi from '../api/cmsApi';
import { TourOverlay } from '../components/cms/help/TourOverlay';
import { BuilderHelpPage } from './builder/BuilderHelpPage';
import AdminBillingManager from '../components/admin/AdminBillingManager';
import AdminPaymentSettings from '../components/admin/AdminPaymentSettings';
const DomainSettings = React.lazy(() => import('../components/seller/DomainSettings').then(m => ({ default: m.DomainSettings })));
import { InstallButton } from '../components/seller/InstallButton';
import { RecoveryList } from '../components/merchant/RecoveryList';
import { StoreGenerator } from '../components/seller/StoreGenerator';

// OSTT FIX: Add missing types
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

// ─── Loading Component ────────────────────────────────────────────────────────
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

// ─── Auto-save manager ────────────────────────────────────────────────────────
const AutoSaveManager: React.FC = () => {
    const { hasUnsavedChanges, saveDraft } = useBuilder();
    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const id = setInterval(async () => {
            await saveDraft();
        }, 30_000);
        return () => clearInterval(id);
    }, [hasUnsavedChanges, saveDraft]);
    return null;
};

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────
const GlobalKeyboardShortcuts: React.FC = () => {
    // OSTT FIX: removed unused canUndo, canRedo from destructor to bypass missing type error
    const { undo, redo } = useBuilder();
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) { e.preventDefault(); redo(); }
                else { e.preventDefault(); undo(); }
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault(); redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);
    return null;
};

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
    const hasFetchedRef = React.useRef(false);

    // OSTT FIX: Move hook out of conditional block to satisfy rule of hooks
    const initialDataMemo = React.useMemo(() => {
        const homeNode = localContent?.pages?.home as DashboardPageNode | undefined;
        return {
            id: localContent?.id || 'home-root',
            layout: homeNode?.layout || [],
            configuration: (localContent as { configuration?: Record<string, unknown> })?.configuration || {}
        };
    }, [localContent]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab && NAV.some(n => n.id === tab)) setActiveTab(tab);
    }, [searchParams, activeTab]);

    const fetchContent = React.useCallback(async (signal?: AbortSignal) => {
        if (!isInitialized || !user) return;
        try {
            const cmsResult = await cmsApi.get('/cms/dashboard', { signal });
            if (cmsResult.data?.success) {
                setLocalContent(cmsResult.data.content);
                setError(null);
            }
        } catch (err: unknown) {
            if (axios.isCancel(err)) return;
            
            const axiosError = err as AxiosError; 
            if (axiosError.response?.status === 401) {
                console.error('[Omnora Auth] Unauthorized Access. Redirecting to Login.');
                await supabase.auth.signOut();
                window.location.replace('/login');
                return;
            }

            console.error('[Omnora CMS] Fetch Failure:', err);
            setLocalContent(DEFAULT_CONTENT);
            setError(`Kernel Sync Failure (${err.response?.status || 'Network Error'})`);
        } finally {
            setLoading(false);
        }
    }, [isInitialized, user]);

    useEffect(() => { 
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const controller = new AbortController();
        fetchContent(controller.signal); 

        return () => controller.abort();
    }, [fetchContent]);

    const save = async () => {
        setSaveStatus('saving');
        try {
            await client.put('/cms/content', { content: localContent });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch {
            setSaveStatus('error');
        }
    };

    if (!isInitialized || loading) return <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Initializing Omnora Kernel...</div>;

    // OSTT FIX: Standardized profile property extraction and fallback
    const storeName = (profile && 'store_name' in profile ? profile.store_name : undefined) 
                    || user?.user_metadata?.store_name 
                    || user?.user_metadata?.full_name 
                    || 'Omnora Store';
    
    const isBuilder = activeTab === 'builder';

    return (
        <div className={`seller-dashboard ${isBuilder ? 'builder-active' : ''}`}>
            {!isBuilder && (
                <aside className={`seller-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                    <div className="sidebar-brand">
                        <div className="brand-wrapper">
                            <img 
                                src="/logo.png" 
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

                    {isBuilder && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#050505' }}>
                            <BuilderProvider
                                initialData={initialDataMemo}
                                isPreview={false}
                                tenantId={user?.id}
                                userName={user?.user_metadata?.full_name || 'Your'}
                            >
                                <AutoSaveManager />
                                <GlobalKeyboardShortcuts />
                                <BuilderLayout />
                                <TourOverlay isOpen={tourOpen} onClose={() => { setTourOpen(false); const p = new URLSearchParams(searchParams); p.delete('tour'); setSearchParams(p); }} />
                                <button type="button" onClick={() => setActiveTab('overview')} style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 1001, padding: '12px 24px', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '100px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }} className="exit-builder-btn">Exit Designer</button>
                                <style>{`.exit-builder-btn:hover { background: #fff !important; color: #000 !important; }`}</style>
                            </BuilderProvider>
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