import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
    LayoutDashboard,
    Package,
    FileText,
    TrendingUp,
    Save,
    CheckCircle2,
    Plus,
    Trash2,
    ArrowLeft,
    Hammer,
    ChevronRight,
    Store,
    ShoppingBag,
    Eye,
    DollarSign,
    Bell,
    User,
    Settings,
    LogOut,
    X,
    HelpCircle,
    CreditCard,
    ShieldCheck,
    Globe,
    Zap
} from 'lucide-react';
import './SellerDashboard.css';
import { AdminProductManager } from '../components/seller/AdminProductManager';
import { AdminOrderManager } from '../components/seller/AdminOrderManager';
import { AdminOverview } from '../components/seller/AdminOverview';
import SellerAnalytics from '../components/seller/SellerAnalytics';

// Code-split: Heavy editor module loaded on demand
const ProductEditor = React.lazy(() => import('../components/seller/ProductEditor'));
import { SmartSidebar } from '../components/cms/SmartSidebar';
import { BuilderProvider } from '../context/BuilderContext';
import { LiveCanvas } from '../components/cms/LiveCanvas';
import { ElementLibrary } from '../components/cms/ElementLibrary';
import { BuilderToolbar } from '../components/cms/BuilderToolbar';
import { useBuilder } from '../context/BuilderContext';
import { TourOverlay } from '../components/cms/help/TourOverlay';
import { BuilderHelpPage } from './builder/BuilderHelpPage';
import AdminBillingManager from '../components/admin/AdminBillingManager';
import AdminPaymentSettings from '../components/admin/AdminPaymentSettings';
const DomainSettings = React.lazy(() => import('../components/seller/DomainSettings').then(m => ({ default: m.DomainSettings })));
import { StoreGenerator } from '../components/seller/StoreGenerator';

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
    return (
        <div className="auto-save-toast">
            ✓ Auto-saved
        </div>
    );
};

// ─── Global Keyboard Shortcuts (Undo/Redo) ────────────────────────────────────
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

    return null; // Logic only
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'performance', label: 'Analytics', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Products', icon: Package },
    { id: 'product-editor', label: 'New Product', icon: Plus },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'builder', label: 'Site Builder', icon: Hammer },
    { id: 'billing', label: 'SaaS Subscription', icon: ShieldCheck },
    { id: 'payments', label: 'Payment Gateway', icon: CreditCard },
    { id: 'domain', label: 'Custom Domain', icon: Globe },
    { id: 'help', label: 'Builder Guide', icon: HelpCircle },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
// Replace your existing KpiCard component with this:
const KpiCard = ({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) => (
    <div className="kpi-card">
        <div className="kpi-header">
            <div className="kpi-info">
                <p className="kpi-label">{label}</p>
                <p className="kpi-value">{value}</p>
            </div>
            {/* CLEAN CODE: Injecting CSS variable instead of hardcoded background */}
            <div className="kpi-icon-wrapper" style={{ '--kpi-bg': color } as React.CSSProperties}>
                <Icon size={20} color="#fff" />
            </div>
        </div>
        {sub && <p className="kpi-sub">{sub}</p>}
    </div>
);

// ─── Page card ─────────────────────────────────────────────────────────────────

const PageCard = ({ slug, onEdit, onDelete }: { slug: string; onEdit: () => void; onDelete: () => void }) => (
    <div className="page-card">
        <div className="page-info-wrapper">
            <div className="page-icon">
                <FileText size={16} color="#6B7280" />
            </div>
            <div className="page-slug-info">
                <p>{slug.replace(/-/g, ' ')}</p>
                <p>/{slug}</p>
            </div>
        </div>
        <div className="page-actions">
            <button onClick={onEdit} className="edit-btn">Edit</button>
            {slug !== 'home' && (
                <button onClick={onDelete} className="delete-btn">Delete</button>
            )}
        </div>
    </div>
);

// ─── Add Page Modal ───────────────────────────────────────────────────────────

const AddPageModal = ({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) => {
    const [name, setName] = useState('');
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                // Inside AddPageModal component, replace the header with this:
                <div className="modal-header">
                    <h3>Create new page</h3>
                    <button
                        onClick={onClose}
                        className="modal-close"
                        aria-label="Close modal"
                        title="Close"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <div className="form-field">
                    <label htmlFor="newPageName">Page name</label>
                    <input
                        id="newPageName"
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="e.g. About Us"
                        className="form-input"
                        onKeyDown={e => e.key === 'Enter' && onAdd(name)}
                        autoFocus
                    />
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
                    <button onClick={() => onAdd(name)} className="btn-confirm">Create page</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function SellerDashboard() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [mobileSidebarOpen, setMob] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(true);
    const [stats, setStats] = useState({ totalSales: 0, activeProducts: 0, pendingOrders: 0, viewCount: 0 });
    const [loading, setLoading] = useState(true);
    const [localContent, setLocalContent] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [addPageOpen, setAddPageOpen] = useState(false);
    const [tourOpen, setTourOpen] = useState(searchParams.get('tour') === 'true');
    const [forgeOpen, setForgeOpen] = useState(false);
    const [forgePrompt, setForgePrompt] = useState('');

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
                client.get('/cms/content'),
            ]);
            if (statsRes.data.success) setStats(statsRes.data.stats);
            if (cmsRes.data.success) setLocalContent(cmsRes.data.content);
        } catch (err) {
            console.error('Failed to fetch dashboard content:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const save = async () => {
        setSaveStatus('saving');
        try {
            await client.put('/cms/content', { content: localContent });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch { setSaveStatus('error'); }
    };

    const deletePage = (slug: string) => {
        if (slug === 'home') return;
        if (window.confirm(`Delete the "${slug}" page?`)) {
            const pages = { ...localContent.pages };
            delete pages[slug];
            setLocalContent((p: any) => ({ ...p, pages }));
        }
    };

    const addPage = (name: string) => {
        if (!name.trim()) return;
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        setLocalContent((p: any) => ({
            ...p,
            pages: { ...p.pages, [slug]: { title: name, layout: [{ type: 'hero', data: { headline: name } }] } }
        }));
        setAddPageOpen(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: '#6B7280' }}>
                Loading your dashboard…
            </div>
        );
    }

    const storeName = localContent?.configuration?.name || user?.name || 'My Store';
    const isBuilder = activeTab === 'builder';

    return (
        <div className="seller-dashboard">

            {/* ── Sidebar ── */}
            <aside className={`seller-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                {/* Brand */}
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

                {/* Nav */}
                <nav className="sidebar-nav">
                    <p className="nav-section-title">Menu</p>
                    {NAV.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => { setActiveTab(id); setMob(false); }}
                                className={`nav-btn ${active ? 'active' : ''}`}
                            >
                                <Icon size={17} />
                                {label}
                                {active && <ChevronRight size={14} className="chevron" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} /> Back to store
                    </Link>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="dashboard-main">

                {/* Top header */}
                <header className="top-header">
                    <div className="header-left">
                        {/* Mobile hamburger */}
                        <button onClick={() => setMob(o => !o)} className="menu-trigger">
                            ☰
                        </button>
                        <h1>
                            {NAV.find(n => n.id === activeTab)?.label ?? 'Dashboard'}
                        </h1>
                    </div>
                    <div className="header-right">
                        {saveStatus === 'saving' && <span className="save-status">Saving…</span>}
                        {saveStatus === 'saved' && <span className="save-status success"><CheckCircle2 size={14} /> Saved</span>}
                        {saveStatus === 'error' && <span className="save-status error">Save failed</span>}
                        <button onClick={save} className="save-btn">
                            <Save size={15} /> Save changes
                        </button>
                    </div>
                </header>

                {/* Scrollable content */}
                <main className={`scroll-content ${isBuilder ? 'builder-mode' : ''}`}>

                    {/* ── Overview ── */}
                    {activeTab === 'overview' && <AdminOverview />}

                    {/* ── Analytics ── */}
                    {activeTab === 'performance' && <SellerAnalytics />}

                    {/* ── Products ── */}
                    {activeTab === 'inventory' && <AdminProductManager />}

                    {/* ── Orders ── */}
                    {activeTab === 'orders' && <AdminOrderManager />}

                    {/* ── Product Editor (Code-Split) ── */}
                    {activeTab === 'product-editor' && (
                        <Suspense fallback={
                            <div className="p-8 flex items-center justify-center min-h-[400px]">
                                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                            </div>
                        }>
                            <ProductEditor />
                        </Suspense>
                    )}

                    {/* ── Pages ── */}
                    {activeTab === 'pages' && (
                        <div>
                            <div className="page-management-header">
                                <div className="header-info">
                                    <h2>Pages</h2>
                                    <p>Manage your store pages</p>
                                </div>
                                <button onClick={() => setAddPageOpen(true)} className="add-page-btn">
                                    <Plus size={15} /> Add page
                                </button>
                            </div>
                            <div className="pages-list">
                                {Object.keys(localContent?.pages || {}).map(slug => (
                                    <PageCard key={slug} slug={slug} onEdit={() => setActiveTab('builder')} onDelete={() => deletePage(slug)} />
                                ))}
                                {Object.keys(localContent?.pages || {}).length === 0 && (
                                    <div className="empty-state">
                                        No pages yet. <button onClick={() => setAddPageOpen(true)}>Create one.</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Builder (full-screen) ── */}
                    {activeTab === 'builder' && (
                        <BuilderProvider initialData={localContent?.pages?.home} isPreview={false} tenantId={user?.id}>
                            <AutoSaveManager />
                            <GlobalKeyboardShortcuts />
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                <BuilderToolbar onToggleLibrary={() => setLibraryOpen(o => !o)} libraryOpen={libraryOpen} />
                                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                    <ElementLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
                                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                        <LiveCanvas />
                                    </div>
                                    <SmartSidebar />
                                </div>
                            </div>
                            <TourOverlay isOpen={tourOpen} onClose={() => {
                                setTourOpen(false);
                                // Clean up URL
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('tour');
                                setSearchParams(newParams);
                            }} />
                        </BuilderProvider>
                    )}

                    {/* ── SaaS Subscription ── */}
                    {activeTab === 'billing' && <AdminBillingManager />}

                    {/* ── Payment Gateway ── */}
                    {activeTab === 'payments' && <AdminPaymentSettings />}

                    {/* ── Custom Domain ── */}
                    {activeTab === 'domain' && <DomainSettings />}

                    {/* ── Help Guide ── */}
                    {activeTab === 'help' && (
                        <div style={{ height: '100%', overflow: 'auto' }}>
                            <BuilderHelpPage />
                        </div>
                    )}
                </main>

                {/* AI Forge Prompt Modal */}
                {activeTab === 'overview' && !localContent?.pages?.home && (
                    <div className="empty-state-forge p-8">
                        <div className="forge-card bg-[#0A0A0A] border border-[var(--accent-gold)]/20 p-8 rounded-3xl text-center max-w-lg mx-auto mt-20 shadow-[0_0_50px_rgba(212,175,55,0.05)]">
                            <Zap size={40} className="text-[var(--accent-gold)] mx-auto mb-6 animate-pulse" />
                            <h2 className="text-2xl font-black text-white italic uppercase mb-2">Omnora <span className="text-[var(--accent-gold)]">Forge</span></h2>
                            <p className="text-gray-400 text-sm mb-8 font-medium">Your store is an empty canvas. Let our Neural Engine build a luxury storefront for you in seconds.</p>
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

                {/* Matrix Loader Overlay */}
                <AnimatePresence>
                    {forgeOpen && (
                        <StoreGenerator 
                            prompt={forgePrompt} 
                            onComplete={() => {
                                fetchContent(); // Refresh dashboard data
                                setForgeOpen(false);
                                setActiveTab('builder'); // Transition to builder to see the result
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

            {/* Add page modal */}
            {addPageOpen && <AddPageModal onClose={() => setAddPageOpen(false)} onAdd={addPage} />}
        </div>
    );
}
