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
    const navigate = useNavigate();
    const location = useLocation();

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
            navigate(`/collection?q=${encodeURIComponent(searchQuery.trim())}`);
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
                    {/* Brand */}
             <Link to="/" className="brand" onClick={closeMenu}>
    <div className="brand-logo">
        <img
            src="/images/omnora.jpg"
            alt="Gold She Garments"
            width={24}
            height={24}
        />
    </div>
    <span className="brand-name">GoldShe</span>
</Link>

                    {/* Desktop Navigation */}
                    <nav className="nav-desktop">
                        <Link 
                            to="/" 
                            className={`nav-link ${isActive('/') ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/collection" 
                            className={`nav-link ${isActive('/collection') ? 'active' : ''}`}
                        >
                            Shop All
                        </Link>
                        <Link 
                            to="/collection?category=stitched" 
                            className="nav-link"
                        >
                            Ready to Wear
                        </Link>
                        <Link 
                            to="/about" 
                            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                        >
                            About
                        </Link>
                        <Link 
                            to="/contact" 
                            className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                        >
                            Contact
                        </Link>
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
                        <Link to="/" onClick={closeMenu}>Home</Link>
                        <Link to="/collection" onClick={closeMenu}>Shop All</Link>
                        <Link to="/collection?category=stitched" onClick={closeMenu}>Ready to Wear</Link>
                        <Link to="/about" onClick={closeMenu}>About</Link>
                        <Link to="/contact" onClick={closeMenu}>Contact</Link>
                        
                        {user && (
                            <>
                                <div className="mobile-divider"></div>
                                {isAdmin && (
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

            {/* Footer */}
            <Footer />
        </div>
    );
}
