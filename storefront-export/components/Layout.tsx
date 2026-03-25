/**
 * 🛠️ OMNORA LABS | KERNEL INTERFACE (GLOBAL LAYOUT)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "The interface is the bridge between logic and reality."
 * ---------------------------------------------------------
 */

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingCart, User, LogOut, Menu, X, Search,
    LayoutDashboard, Heart, Terminal, Database, Activity
} from 'lucide-react';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import Footer from './Footer';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import { useStorefront } from '../hooks/useStorefront';
import { OmnoraBanner } from './storefront/OmnoraBanner';
import './Layout.css';

interface ManifestNode {
    quantity: number;
}

export default function Layout() {
    const [manifestSize, setManifestSize] = useState(0);
    const [isProtocolMenuOpen, setIsProtocolMenuOpen] = useState(false);
    const [isSystemScrolled, setIsSystemScrolled] = useState(false);
    const [searchProtocolQuery, setSearchProtocolQuery] = useState('');
    const [isRegistrySearchFocused, setIsRegistrySearchFocused] = useState(false);

    const { user, logout, isAdmin } = useAuth();
    const { storeSlug, content } = useStorefront();
    const navigate = useNavigate();
    const location = useLocation();

    // Territory-Aware Routing Protocol
    const getTerritoryRoot = () => storeSlug ? `/store/${storeSlug}` : '';
    const isWithinBoundary = !!storeSlug;
    const isKernelOwner = user && content && user.id === content.seller;

    // System Scroll Monitoring
    useEffect(() => {
        const handleSystemScroll = () => {
            setIsSystemScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleSystemScroll);
        return () => window.removeEventListener('scroll', handleSystemScroll);
    }, []);

    // Global Protocol Escape Sequences
    useEffect(() => {
        const handleProtocolEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsProtocolMenuOpen(false);
                setIsRegistrySearchFocused(false);
            }
        };
        window.addEventListener('keydown', handleProtocolEscape);
        return () => window.removeEventListener('keydown', handleProtocolEscape);
    }, []);

    // Sovereign Engine: Variable Injection
    useEffect(() => {
        const rootNode = document.documentElement;
        const themeRegistry = content?.globalStyles || {};

        // Forced Industrial Aesthetic (Obsidian Base)
        rootNode.style.setProperty('--bg-surface', '#030304');
        rootNode.style.setProperty('--p-color', themeRegistry.primaryColor || '#D4AF37');
        rootNode.style.setProperty('--s-color', themeRegistry.accentColor || '#FFFFFF');
        rootNode.style.setProperty('--glass-blur', themeRegistry.surfaceBlur || '24px');
        rootNode.style.setProperty('--glass-opacity', String(themeRegistry.glassOpacity || 0.08));

        // System Transition Weight
        rootNode.style.setProperty('--transition-weighted', 'cubic-bezier(0.2, 0, 0, 1)');

        return () => {
            OmnoraLogger.info("Kernel Interface theme cycle completed.");
        };
    }, [content]);

    // System Lock: Prevent background propagation when overlay is active
    useEffect(() => {
        document.body.style.overflow = isProtocolMenuOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isProtocolMenuOpen]);

    // Manifest Synchronization
    const synchronizeManifestState = useCallback(() => {
        try {
            const manifest: ManifestNode[] = JSON.parse(localStorage.getItem('cart') || '[]');
            const totalActivationNodes = manifest.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            setManifestSize(totalActivationNodes);
        } catch (fault) {
            OmnoraLogger.error("Manifest synchronization fault", fault);
            setManifestSize(0);
        }
    }, []);

    useEffect(() => {
        synchronizeManifestState();
        window.addEventListener('cart-updated', synchronizeManifestState);
        return () => window.removeEventListener('cart-updated', synchronizeManifestState);
    }, [synchronizeManifestState]);

    const closeProtocolOverlays = () => {
        setIsProtocolMenuOpen(false);
        setIsRegistrySearchFocused(false);
    };

    const executeRegistrySearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchProtocolQuery.trim()) {
            OmnoraLogger.info(`Executing registry search protocol for: ${searchProtocolQuery}`);
            navigate(`${getTerritoryRoot()}/collection?q=${encodeURIComponent(searchProtocolQuery.trim())}`);
            setSearchProtocolQuery('');
            closeProtocolOverlays();
        }
    };

    const executeSystemLogout = async () => {
        OmnoraLogger.info("Initiating system-wide logout protocol...");
        await logout();
        closeProtocolOverlays();
        navigate('/');
    };

    const checkActiveProtocol = (path: string) => location.pathname === path;

    return (
        <div className="layout">
            <header className={`header ${isSystemScrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    {/* SYSTEM_IDENTITY */}
                    <Link to={getTerritoryRoot() || '/'} className="brand" onClick={closeProtocolOverlays}>
                        <div className="brand-logo">
                            <img
                                src={content?.configuration?.assets?.logo || "/images/omnora.jpg"}
                                alt={content?.configuration?.name || "Omnora"}
                                width={24}
                                height={24}
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                        <span className="brand-name font-mono uppercase" style={{ letterSpacing: '2px', fontWeight: 700 }}>
                            {content?.configuration?.name || (isWithinBoundary ? storeSlug?.toUpperCase() : "OMNORA_LABS")}
                        </span>
                    </Link>

                    {/* PROTOCOL_NAVIGATION */}
                    <nav className="nav-desktop">
                        {isWithinBoundary ? (
                            Object.entries(content?.pages || {}).map(([slug, page]: [string, any]) => (
                                <Link
                                    key={slug}
                                    to={`${getTerritoryRoot()}/${slug === 'home' ? '' : slug}`}
                                    className={`nav-link font-mono xsmall ${checkActiveProtocol(`${getTerritoryRoot()}/${slug === 'home' ? '' : slug}`) ? 'active' : ''}`}
                                >
                                    {slug.toUpperCase()}
                                </Link>
                            ))
                        ) : (
                            <>
                                <Link to="/" className={`nav-link font-mono xsmall ${checkActiveProtocol('/') ? 'active' : ''}`}>ROOT</Link>
                                <Link to="/collection" className={`nav-link font-mono xsmall ${checkActiveProtocol('/collection') ? 'active' : ''}`}>REGISTRY</Link>
                                <Link to="/about" className={`nav-link font-mono xsmall ${checkActiveProtocol('/about') ? 'active' : ''}`}>KERNEL_SPECS</Link>
                                <Link to="/contact" className={`nav-link font-mono xsmall ${checkActiveProtocol('/contact') ? 'active' : ''}`}>UPLINK</Link>
                                <Link to="/builder/help" className={`nav-link font-mono xsmall ${checkActiveProtocol('/builder/help') ? 'active' : ''}`}>DOCUMENTATION</Link>
                            </>
                        )}

                        {isKernelOwner && (
                            <Link to="/seller/dashboard" className="nav-link highlight-exit font-mono xsmall">
                                <Activity size={14} /> SYSTEM_CONTROL
                            </Link>
                        )}
                    </nav>

                    {/* SYSTEM_ACTIONS */}
                    <div className="header-actions">
                        <div className={`search-box ${isRegistrySearchFocused ? 'focused' : ''}`}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="REGISTRY_SEARCH..."
                                style={{ fontFamily: 'var(--font-mono)' }}
                                value={searchProtocolQuery}
                                onChange={(e) => setSearchProtocolQuery(e.target.value)}
                                onKeyDown={executeRegistrySearch}
                                onFocus={() => setIsRegistrySearchFocused(true)}
                                onBlur={() => setIsRegistrySearchFocused(false)}
                            />
                        </div>

                        <div className="action-group">
                            {user ? (
                                <>
                                    {isAdmin && (
                                        <Link to="/admin" className="icon-btn" title="ADMIN_PANEL">
                                            <Database size={20} />
                                        </Link>
                                    )}
                                    <Link to="/profile" className="icon-btn" title="USER_NODE">
                                        <User size={20} />
                                    </Link>
                                    <button onClick={executeSystemLogout} className="icon-btn" title="SYSTEM_DISCONNECT">
                                        <LogOut size={20} />
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="icon-btn" title="PROTOCOL_AUTH">
                                    <User size={20} />
                                </Link>
                            )}

                            <Link to="/cart" className="icon-btn cart-icon" title="DEPLOYMENT_MANIFEST">
                                <ShoppingCart size={20} />
                                {manifestSize > 0 && (
                                    <span className="cart-count font-mono">{manifestSize}</span>
                                )}
                            </Link>

                            <button
                                className="menu-toggle"
                                onClick={() => setIsProtocolMenuOpen(!isProtocolMenuOpen)}
                                aria-label="TOGGLE_SYSTEM_MENU"
                            >
                                {isProtocolMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* PROTOCOL_OVERLAY (MOBILE) */}
            <div className={`mobile-menu ${isProtocolMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    <div className="mobile-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH_REGISTRY..."
                            style={{ fontFamily: 'var(--font-mono)' }}
                            value={searchProtocolQuery}
                            onChange={(e) => setSearchProtocolQuery(e.target.value)}
                            onKeyDown={executeRegistrySearch}
                        />
                    </div>

                    <nav className="mobile-nav font-mono uppercase">
                        <Link to={getTerritoryRoot() || "/"} onClick={closeProtocolOverlays}>ROOT</Link>
                        <Link to={`${getTerritoryRoot()}/collection`} onClick={closeProtocolOverlays}>REGISTRY</Link>
                        {!isWithinBoundary && (
                            <Link to="/collection?category=digital" onClick={closeProtocolOverlays}>DATA_ASSETS</Link>
                        )}
                        <Link to={`${getTerritoryRoot()}/about`} onClick={closeProtocolOverlays}>KERNEL_SPECS</Link>
                        <Link to={`${getTerritoryRoot()}/contact`} onClick={closeProtocolOverlays}>UPLINK</Link>
                        <Link to="/builder/help" onClick={closeProtocolOverlays}>DOCUMENTATION</Link>

                        {user && (
                            <>
                                <div className="mobile-divider"></div>
                                {isKernelOwner && (
                                    <Link to="/seller/dashboard" onClick={closeProtocolOverlays} className="mobile-highlight-exit">
                                        SYSTEM_CONTROL
                                    </Link>
                                )}
                                {isAdmin && !isWithinBoundary && (
                                    <Link to="/admin" onClick={closeProtocolOverlays}>ADMIN_REGISTRY</Link>
                                )}
                                <Link to="/profile" onClick={closeProtocolOverlays}>USER_NODE</Link>
                                <Link to="/cart" onClick={closeProtocolOverlays}>
                                    MANIFEST {manifestSize > 0 && `(${manifestSize})`}
                                </Link>
                                <button onClick={executeSystemLogout} className="mobile-logout font-mono uppercase" style={{ textAlign: 'left' }}>
                                    SYSTEM_DISCONNECT
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            <main className="main-content">
                <GlobalErrorBoundary>
                    <Outlet />
                </GlobalErrorBoundary>
            </main>

            <OmnoraBanner isStorefront={isWithinBoundary} />
            <Footer />
        </div>
    );
}
