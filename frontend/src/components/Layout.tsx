import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingCart, User, LogOut, Menu, X, Search,
    LayoutDashboard
} from 'lucide-react';
import './Layout.css';
import Footer from './Footer';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import { useStorefront } from '../hooks/useStorefront';
import { OmnoraBanner } from './storefront/OmnoraBanner';
import { OmnoraNotification } from './storefront/OmnoraNotification';
import { useCartStore } from '../store/cartStore';
import { useStoreHydration } from '../hooks/useStoreHydration';
import { PwaInstallPrompt } from './pwa/PwaInstallPrompt';
import { ROUTES } from '../routes';
import { CartDrawer } from './storefront/CartDrawer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isHydrated = useStoreHydration(useCartStore);
    const { getItemCount, setCartOpen } = useCartStore();
    const itemCount = getItemCount();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    const { user, logout, isAdmin } = useAuth();
    const { storeSlug, content } = useStorefront();
    const navigate = useNavigate();
    const location = useLocation();

    // Territory-Aware Routing Logic
    const getBaseUrl = () => storeSlug ? `/store/${storeSlug}` : '';
    const isInsideTerritory = !!storeSlug;
    const isTerritoryOwner = user && content && user.id === content.seller;

    // Scroll handler for header effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                setSearchFocused(false);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Sovereign Engine: CSS Variable Injection & Weighted Luxury
    useEffect(() => {
        const root = document.documentElement;
        const theme = content?.globalStyles || {};

        // Forced Obsidian Aesthetic
        root.style.setProperty('--bg-surface', '#030304');
        root.style.setProperty('--p-color', theme.primaryColor || '#D4AF37'); // Gold/Royal default
        root.style.setProperty('--s-color', theme.accentColor || '#FFFFFF');
        root.style.setProperty('--glass-blur', theme.surfaceBlur || '20px');
        root.style.setProperty('--glass-opacity', String(theme.glassOpacity || 0.1));

        // Weighted Luxury Transition Timing
        root.style.setProperty('--transition-weighted', 'cubic-bezier(0.4, 0, 0.2, 1)');

        return () => {
            // Cleanup or reset if needed
        };
    }, [content]);

    // Prevent scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [menuOpen]);

    // Navigation handlers
    const closeMenu = () => {
        setMenuOpen(false);
        setSearchFocused(false);
    };

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`${getBaseUrl()}/collection?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            closeMenu();
        }
    };

    const handleLogout = async () => {
        await logout();
        closeMenu();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="layout" style={isTerritoryOwner ? { paddingTop: '44px' } : {}}>
            {isTerritoryOwner && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '44px',
                    background: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    zIndex: 9999,
                    borderBottom: '1px solid #222'
                }}>
                    <span style={{ color: '#9C9890', fontSize: '13px' }}>
                        You are viewing your storefront
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate('/seller?tab=builder')}
                        style={{
                            background: '#FF6B35',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        ← Back to Builder
                    </button>
                </div>
            )}

            {/* Modern Header */}
            <header className={`header ${scrolled ? 'scrolled' : ''}`} style={isTerritoryOwner ? { top: '44px' } : {}}>
                <div className="header-container">
                    {/* Brand Sovereignty */}
                    <Link to={getBaseUrl() || ROUTES.HOME} className="brand" onClick={closeMenu}>
                        <div className="brand-logo" style={{ background: 'transparent' }}>
                            <img
                                src="/images/omnoralabs_brand.png"
                                alt="Omnora Labs"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                        <span className="brand-name">
                            {content?.configuration?.name || (isInsideTerritory ? storeSlug?.toUpperCase() : "Omnora Labs")}
                        </span>
                    </Link>

                    {/* Desktop Navigation (Sovereign Aware) */}
                    <nav className="nav-desktop">
                        {isInsideTerritory ? (
                            // DYNAMIC TERRITORY MENU (OSTT FIX: Strictly typed object entries mapping)
                            Object.entries((content?.pages as Record<string, { heroHeadline?: string; title?: string }>) || {}).map(([slug, page]) => {
                                const targetPath = slug === 'home' ? getBaseUrl() : `${getBaseUrl()}/${slug}`;
                                return (
                                    <Link
                                        key={slug}
                                        to={targetPath}
                                        className={`nav-link ${isActive(targetPath) ? 'active' : ''}`}
                                    >
                                        {typeof page?.heroHeadline === 'string' ? page.heroHeadline.split(' ')[0] : (page?.title || "Page")}
                                    </Link>
                                );
                            })
                        ) : (
                            // FIXED PLATFORM MENU
                            <>
                                <Link to={ROUTES.HOME} className={`nav-link ${isActive(ROUTES.HOME) ? 'active' : ''}`}>Home</Link>
                                <Link to={ROUTES.COLLECTION} className={`nav-link ${isActive(ROUTES.COLLECTION) ? 'active' : ''}`}>Entities</Link>
                                <Link to={ROUTES.ABOUT} className={`nav-link ${isActive(ROUTES.ABOUT) ? 'active' : ''}`}>Engine</Link>
                                <Link to={ROUTES.CONTACT} className={`nav-link ${isActive(ROUTES.CONTACT) ? 'active' : ''}`}>Contact</Link>
                                <Link to={ROUTES.BUILDER_HELP} className={`nav-link ${isActive(ROUTES.BUILDER_HELP) ? 'active' : ''}`}>How to Build</Link>
                            </>
                        )}

                        {/* Sovereign Exit: Return to Command Center if owner */}
                        {isTerritoryOwner && (
                            <Link to="/seller/dashboard" className="nav-link highlight-exit">
                                <LayoutDashboard size={14} /> Command Center
                            </Link>
                        )}
                    </nav>

                    {/* Action Bar */}
                    <div className="header-actions">
                        {/* Search */}
                        <div className={`search-box ${searchFocused ? 'focused' : ''}`}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                            />
                        </div>

                        {/* User Menu */}
                        <div className="action-group">
                            {user ? (
                                <>
                                    {isAdmin && (
                                        <Link to="/admin" className="icon-btn" title="Admin Dashboard">
                                            <LayoutDashboard size={20} />
                                        </Link>
                                    )}
                                    <Link to="/profile" className="icon-btn" title="Profile">
                                        <User size={20} />
                                    </Link>
                                    <button type="button" onClick={handleLogout} className="icon-btn" title="Logout">
                                        <LogOut size={20} />
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="icon-btn" title="Sign In">
                                    <User size={20} />
                                </Link>
                            )}

                            {/* Cart */}
                            <button type="button" onClick={() => setCartOpen(true)} className="icon-btn cart-icon" title="Shopping Cart">
                                <ShoppingCart size={20} />
                                {isHydrated && itemCount > 0 && (
                                    <span className="cart-count">{itemCount}</span>
                                )}
                            </button>

                            {/* Mobile Menu Toggle */}
                            <button
                                type="button"
                                className="menu-toggle"
                                onClick={() => setMenuOpen(!menuOpen)}
                                aria-label="Toggle menu"
                            >
                                {menuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {/* Mobile Search */}
                    <div className="mobile-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    {/* Mobile Navigation Links */}
                    <nav className="mobile-nav">
                        <Link to={getBaseUrl() || "/"} onClick={closeMenu}>
                            {isInsideTerritory ? 'Home' : 'Platform Hub'}
                        </Link>
                        <Link to={`${getBaseUrl()}/collection`} onClick={closeMenu}>Entities</Link>
                        {!isInsideTerritory && (
                            <Link to="/collection?category=digital" onClick={closeMenu}>Digital Assets</Link>
                        )}
                        <Link to={`${getBaseUrl()}/about`} onClick={closeMenu}>Engine</Link>
                        <Link to={`${getBaseUrl()}/contact`} onClick={closeMenu}>Contact</Link>
                        <Link to="/builder/help" onClick={closeMenu}>How to Build</Link>

                        {user && (
                            <>
                                <div className="mobile-divider"></div>
                                {isTerritoryOwner && (
                                    <Link to="/seller/dashboard" onClick={closeMenu} className="mobile-highlight-exit">
                                        Command Center
                                    </Link>
                                )}
                                {isAdmin && !isInsideTerritory && (
                                    <Link to="/admin" onClick={closeMenu}>Admin Dashboard</Link>
                                )}
                                <Link to="/profile" onClick={closeMenu}>My Profile</Link>
                                <button type="button" onClick={() => { closeMenu(); setCartOpen(true); }} className="nav-link text-left w-full h-auto py-3 mt-0 mb-0">
                                    Cart {isHydrated && itemCount > 0 && `(${itemCount})`}
                                </button>
                                <button type="button" onClick={handleLogout} className="mobile-logout">
                                    Logout
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="main-content">
                <GlobalErrorBoundary>
                    {children}
                </GlobalErrorBoundary>
            </main>

            {/* Acquisition Banner for Storefronts */}
            <OmnoraBanner isStorefront={isInsideTerritory} />

            {/* PLG Notification */}
            <OmnoraNotification />

            {/* Guardrail 4: Powered by Omnora badge for free-tier storefronts */}
            {isInsideTerritory && content && (content as { plan?: string })?.plan !== 'pro' && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
                    <a
                        href="https://omnora.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-[11px] text-gray-400 hover:text-white hover:border-indigo-500/30 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]"
                    >
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        </span>
                        Powered by <span className="font-bold text-white">Omnora OS</span>
                    </a>
                </div>
            )}

            {/* Footer */}
            <Footer />

            {/* PWA Install Logic */}
            <PwaInstallPrompt />

            {/* Cart Drawer */}
            <CartDrawer />
        </div>
    );
}