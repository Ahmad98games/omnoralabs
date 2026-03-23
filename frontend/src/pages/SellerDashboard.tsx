import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
    LayoutDashboard,
    Package,
    TrendingUp,
    Save,
    CheckCircle2,
    Plus,
    ArrowLeft,
    Hammer,
    ChevronRight,
    Store,
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
import { useStorefront } from '../hooks/useStorefront';
import { useToast } from '../context/ToastContext';
import { useBuilder } from '../context/BuilderContext';
import cmsApi from '../api/cmsApi';
import { TourOverlay } from '../components/cms/help/TourOverlay';
import { BuilderHelpPage } from './builder/BuilderHelpPage';
import AdminBillingManager from '../components/admin/AdminBillingManager';
import AdminPaymentSettings from '../components/admin/AdminPaymentSettings';
const DomainSettings = React.lazy(() => import('../components/seller/DomainSettings').then(m => ({ default: m.DomainSettings })));
import { StoreGenerator } from '../components/seller/StoreGenerator';
import { InstallButton } from '../components/seller/InstallButton';
import { RecoveryList } from '../components/merchant/RecoveryList';

// ─── Auto-save manager (lives inside BuilderProvider) ─────────────────────────
const AutoSaveManager: React.FC = () => {
    const { hasUnsavedChanges, saveDraft } = useBuilder();
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const id = setInterval(async () => {
            await saveDraft();
            setToast('Auto-saved');
            setTimeout(() => setToast(null), 2000);
        }, 15_000);
        return () => clearInterval(id);
    }, [hasUnsavedChanges, saveDraft]);

    if (!toast) return null;
    return <div className="auto-save-toast">✓ Auto-saved</div>;
};

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────
const GlobalKeyboardShortcuts: React.FC = () => {
    const { undo, redo, canUndo, canRedo } = useBuilder();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) {
                    if (canRedo) { e.preventDefault(); redo(); }
                } else {
                    if (canUndo) { e.preventDefault(); undo(); }
                }
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                if (canRedo) { e.preventDefault(); redo(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    return null;
};

// ─── Nav items ────────────────────────────────────────────────────────────────
// Pages tab removed — all page management lives inside the Site Builder.
// Merchants add, rename, delete, and switch pages via the builder toolbar.
const NAV = [
    { id: 'overview',        label: 'Overview',          icon: LayoutDashboard },
    { id: 'performance',     label: 'Analytics',         icon: TrendingUp },
    { id: 'orders',          label: 'Orders',            icon: ShoppingBag },
    { id: 'recovery',        label: 'Abandoned Carts',   icon: RefreshCw },
    { id: 'inventory',       label: 'Products',          icon: Package },
    { id: 'product-editor',  label: 'New Product',       icon: Plus },
    { id: 'builder',         label: 'Site Builder',      icon: Hammer },
    { id: 'billing',         label: 'SaaS Subscription', icon: ShieldCheck },
    { id: 'payments',        label: 'Payment Gateway',   icon: CreditCard },
    { id: 'domain',          label: 'Custom Domain',     icon: Globe },
    { id: 'profile',         label: 'Store Settings',    icon: Settings },
    { id: 'help',            label: 'Builder Guide',     icon: HelpCircle },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({
    label,
    value,
    sub,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: any;
    color: string;
}) => (
    <div className="kpi-card">
        <div className="kpi-header">
            <div className="kpi-info">
                <p className="kpi-label">{label}</p>
                <p className="kpi-value">{value}</p>
            </div>
            <div className="kpi-icon-wrapper" style={{ '--kpi-bg': color } as React.CSSProperties}>
                <Icon size={20} color="#fff" />
            </div>
        </div>
        {sub && <p className="kpi-sub">{sub}</p>}
    </div>
);

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function SellerDashboard() {
    const { user, profile, isInitialized, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [mobileSidebarOpen, setMob] = useState(false);
    const [stats, setStats] = useState({
        totalSales: 0,
        activeProducts: 0,
        pendingOrders: 0,
        viewCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [localContent, setLocalContent] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [tourOpen, setTourOpen] = useState(searchParams.get('tour') === 'true');
    const [forgeOpen, setForgeOpen] = useState(false);
    const [forgePrompt, setForgePrompt] = useState('');

    // Sync active tab from URL params
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab && NAV.some(n => n.id === tab)) {
            setActiveTab(tab);
        }
        if (searchParams.get('tour') === 'true' && !tourOpen) {
            setTourOpen(true);
        }
    }, [searchParams]);

    const fetchContent = async () => {
        try {
            const [statsRes, cmsRes] = await Promise.all([
                client.get('/cms/performance-hub'),
                cmsApi.get('/cms/dashboard'),
            ]);

            if (statsRes.data.success) setStats(statsRes.data.stats);

            if (cmsRes.data.success && cmsRes.data.content) {
                setLocalContent(cmsRes.data.content);
            } else {
                setLocalContent({
                    pages: {
                        home: {
                            title: 'Home',
                            layout: [{ type: 'hero', data: { headline: 'Welcome to your Workspace' } }],
                        },
                    },
                });
            }
        } catch (err) {
            console.error('Failed to fetch dashboard content:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isInitialized) fetchContent();
    }, [isInitialized]);

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

    if (!isInitialized) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#050505',
                color: '#F1D592',
                fontFamily: 'serif',
                fontSize: '18px',
                letterSpacing: '0.05em',
            }}>
                Loading...
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#F9FAFB',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: '#6B7280',
            }}>
                Loading your dashboard…
            </div>
        );
    }

    const storeName =
        profile?.store_name ||
        user?.user_metadata?.store_name ||
        user?.name ||
        'Your Store';

    const isBuilder = activeTab === 'builder';

    return (
        <div className="seller-dashboard">

            {/* ── Sidebar ── */}
            <aside className={`seller-sidebar w-[220px] bg-[#050505] backdrop-blur-xl border-r border-[#1A1A1A] custom-scrollbar overflow-y-auto ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-wrapper">
                        <div className="brand-icon">
                            <Store size={18} color="#fff" />
                        </div>
                        <div className="brand-info">
                            <p>{storeName}</p>
                            <p>Seller Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <p className="nav-section-title">Menu</p>
                    {NAV.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => { setActiveTab(id); setMob(false); }}
                                className={`nav-btn ${active ? 'active' : ''}`}
                            >
                                <Icon size={17} />
                                {label}
                                {active && <ChevronRight size={14} className="chevron" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} /> Back to store
                    </Link>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="dashboard-main">

                {/* Top header */}
                <header className="top-header bg-[#050505]/80 backdrop-blur-xl border-b border-[#1A1A1A]">
                    <div className="header-left">
                        <button onClick={() => setMob(o => !o)} className="menu-trigger">
                            ☰
                        </button>
                        <h1 className="text-xl text-[#F9F9F9] tracking-tight">
                            <span className="font-sans font-medium opacity-80">Greetings, </span>
                            <span className="font-serif font-light text-[#F1D592]">{storeName}</span>
                        </h1>
                    </div>
                    <div className="header-right flex items-center">
                        {saveStatus === 'saving' && (
                            <span className="save-status mr-4">Saving…</span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="save-status success mr-4">
                                <CheckCircle2 size={14} /> Saved
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="save-status error mr-4">Save failed</span>
                        )}
                        <InstallButton />
                        <button
                            onClick={save}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F1D592] to-[#D4AF37] text-black font-bold text-sm transition-transform duration-300 hover:scale-105 shadow-[0_10px_30px_rgba(241,213,146,0.15)] hover:shadow-[0_15px_40px_rgba(241,213,146,0.25)]"
                        >
                            <Save size={15} /> Save changes
                        </button>
                    </div>
                </header>

                {/* Scrollable content */}
                <main className={`scroll-content ${isBuilder ? 'builder-mode' : ''}`}>

                    {activeTab === 'overview' && <AdminOverview />}

                    {activeTab === 'performance' && <SellerAnalytics />}

                    {activeTab === 'inventory' && <AdminProductManager />}

                    {activeTab === 'orders' && <AdminOrderManager />}

                    {activeTab === 'recovery' && <RecoveryList />}

                    {activeTab === 'product-editor' && (
                        <Suspense fallback={
                            <div className="p-8 flex items-center justify-center min-h-[400px]">
                                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                            </div>
                        }>
                            <ProductEditor />
                        </Suspense>
                    )}

                    {/*
                        Pages tab removed entirely.
                        All page management (add, rename, delete, switch) is handled
                        inside the Site Builder via the TopBarPageSelector and toolbar.
                        Keeping a separate pages manager caused addPage() crashes and
                        state desync between the dashboard local content and Zustand store.
                    */}

                    {activeTab === 'builder' && (
                        <BuilderProvider
                            initialData={localContent?.pages?.home}
                            isPreview={false}
                            tenantId={user?.id}
                            userName={user?.full_name || 'Your'}
                        >
                            <AutoSaveManager />
                            <GlobalKeyboardShortcuts />
                            <BuilderLayout />
                            <TourOverlay
                                isOpen={tourOpen}
                                onClose={() => {
                                    setTourOpen(false);
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.delete('tour');
                                    setSearchParams(newParams);
                                }}
                            />
                        </BuilderProvider>
                    )}

                    {activeTab === 'billing' && <AdminBillingManager />}

                    {activeTab === 'payments' && <AdminPaymentSettings />}

                    {activeTab === 'domain' && (
                        <Suspense fallback={
                            <div className="p-8 flex items-center justify-center min-h-[400px]">
                                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                            </div>
                        }>
                            <DomainSettings />
                        </Suspense>
                    )}

                    {activeTab === 'profile' && <SellerProfile />}

                    {activeTab === 'help' && (
                        <div style={{ height: '100%', overflow: 'auto' }}>
                            <BuilderHelpPage />
                        </div>
                    )}
                </main>

                {/* AI Forge — shown on overview when store has no home page yet */}
                {activeTab === 'overview' && !localContent?.pages?.home && (
                    <div className="empty-state-forge p-8">
                        <div className="forge-card bg-[#0A0A0A] border border-[var(--accent-gold)]/20 p-8 rounded-3xl text-center max-w-lg mx-auto mt-20 shadow-[0_0_50px_rgba(212,175,55,0.05)]">
                            <Zap size={40} className="text-[var(--accent-gold)] mx-auto mb-6 animate-pulse" />
                            <h2 className="text-2xl font-black text-white italic uppercase mb-2">
                                Omnora <span className="text-[var(--accent-gold)]">Forge</span>
                            </h2>
                            <p className="text-gray-400 text-sm mb-8 font-medium">
                                Your store is an empty canvas. Let our Neural Engine build a luxury storefront for you in seconds.
                            </p>
                            <div className="space-y-4">
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-[var(--accent-gold)] outline-none min-h-[100px] transition-all resize-none"
                                    placeholder="Describe your store (e.g. A high-end watch boutique with minimalist aesthetics and a focus on craftsmanship)"
                                    value={forgePrompt}
                                    onChange={(e) => setForgePrompt(e.target.value)}
                                />
                                <button
                                    onClick={() => setForgeOpen(true)}
                                    disabled={!forgePrompt.trim()}
                                    className="w-full py-4 bg-[var(--accent-gold)] text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50"
                                >
                                    Ignite the Forge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {forgeOpen && (
                        <StoreGenerator
                            prompt={forgePrompt}
                            onComplete={() => {
                                fetchContent();
                                setForgeOpen(false);
                                setActiveTab('builder');
                            }}
                            onCancel={() => setForgeOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile sidebar backdrop */}
            {mobileSidebarOpen && (
                <div onClick={() => setMob(false)} className="backdrop" />
            )}
        </div>
    );
}