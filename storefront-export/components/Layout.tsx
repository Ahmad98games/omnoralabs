import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingCart, User, LogOut, Menu, X, Search,
    LayoutDashboard, Heart
} from 'lucide-react';
import './Layout.css';
import Footer from './Footer';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import { useStorefront } from '../hooks/useStorefront';
import { OmnoraBanner } from './storefront/OmnoraBanner';

interface CartItem {
    quantity: number;
}

export default function Layout() {
    const [cartCount, setCartCount] = useState(0);
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

    // Cart synchronization
    const updateCartCount = useCallback(() => {
        try {
            const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            const total = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            setCartCount(total);
        } catch {
            setCartCount(0);
        }
    }, []);

    useEffect(() => {
        updateCartCount();
        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);
    }, [updateCartCount]);

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
        <div className="layout">
            {/* Modern Header */}
            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    {/* Brand Sovereignty */}
                    <Link to={getBaseUrl() || '/'} className="brand" onClick={closeMenu}>
                        <div className="brand-logo">
                            <img
                                src={content?.configuration?.assets?.logo || "/images/omnora.jpg"}
                                alt={content?.configuration?.name || "Omnora"}
                                width={24}
                                height={24}
                            />
                        </div>
                        <span className="brand-name">
                            {content?.configuration?.name || (isInsideTerritory ? storeSlug?.toUpperCase() : "GoldShe")}
                        </span>
                    </Link>

                    {/* Desktop Navigation (Sovereign Aware) */}
                    <nav className="nav-desktop">
                        {isInsideTerritory ? (
                            // DYNAMIC TERRITORY MENU
                            Object.entries(content?.pages || {}).map(([slug, page]: [string, any]) => (
                                <Link
                                    key={slug}
                                    to={`${getBaseUrl()}/${slug === 'home' ? '' : slug}`}
                                    className={`nav-link ${isActive(`${getBaseUrl()}/${slug === 'home' ? '' : slug}`) ? 'active' : ''}`}
                                >
                                    {typeof page?.heroHeadline === 'string' ? page.heroHeadline.split(' ')[0] : (page?.title || "Page")}

                                </Link>
                            ))
                        ) : (
                            // FIXED PLATFORM MENU
                            <>
                                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
                                <Link to="/collection" className={`nav-link ${isActive('/collection') ? 'active' : ''}`}>Shop All</Link>
                                <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
                                <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
                                <Link to="/builder/help" className={`nav-link ${isActive('/builder/help') ? 'active' : ''}`}>How to Build</Link>
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
                                    <button onClick={handleLogout} className="icon-btn" title="Logout">
                                        <LogOut size={20} />
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="icon-btn" title="Sign In">
                                    <User size={20} />
                                </Link>
                            )}

                            {/* Cart */}
                            <Link to="/cart" className="icon-btn cart-icon" title="Shopping Cart">
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="cart-count">{cartCount}</span>
                                )}
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
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
                        <Link to={getBaseUrl() || "/"} onClick={closeMenu}>Home</Link>
                        <Link to={`${getBaseUrl()}/collection`} onClick={closeMenu}>Shop All</Link>
                        {!isInsideTerritory && (
                            <Link to="/collection?category=stitched" onClick={closeMenu}>Ready to Wear</Link>
                        )}
                        <Link to={`${getBaseUrl()}/about`} onClick={closeMenu}>About</Link>
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
                                <Link to="/cart" onClick={closeMenu}>
                                    Cart {cartCount > 0 && `(${cartCount})`}
                                </Link>
                                <button onClick={handleLogout} className="mobile-logout">
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
                    <Outlet />
                </GlobalErrorBoundary>
            </main>

            {/* Acquisition Banner for Storefronts */}
            <OmnoraBanner isStorefront={isInsideTerritory} />

            {/* Footer */}
            <Footer />
        </div>
    );
}
