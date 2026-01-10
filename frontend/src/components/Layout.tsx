import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingCart, User, LogOut, Menu, X, Search,
    Instagram, Facebook, LayoutDashboard, ChevronRight
} from 'lucide-react';
import './OmnoraLayout.css';
import Footer from './Footer';

interface CartItem {
    quantity: number;
}

export default function Layout() {
    const [cartCount, setCartCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. SCROLL DETECTION (For Glass Effect)
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 2. MOBILE MENU SCROLL LOCK
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [menuOpen]);

    // 3. CART LOGIC (Robust)
    const updateCartCount = useCallback(() => {
        try {
            const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            const total = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            setCartCount(total);
        } catch (error) {
            setCartCount(0);
        }
    }, []);

    useEffect(() => {
        updateCartCount();
        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);
    }, [updateCartCount]);

    const handleNavAction = () => setMenuOpen(false);

    const handleLogout = async () => {
        try {
            await logout();
            handleNavAction();
            navigate('/');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    // Helper for active link state
    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <div className="layout">

            {/* === HEADER === */}
            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-container">

                    {/* LOGO */}
                    <Link to="/" className="logo" onClick={handleNavAction}>
                        <img src="/images/omnora store.png" alt="Omnora" className="logo-img" />
                        <span className="logo-text">OMNORA STORE</span>
                    </Link>

                    {/* DESKTOP NAV */}
                    <nav className="nav-desktop">
                        <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                        <Link to="/collection" className={`nav-link ${isActive('/collection')}`}>Shop</Link>
                        <Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
                        <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link>
                        <Link to="/faq" className={`nav-link ${isActive('/faq')}`}>FAQ</Link>
                        <Link to="/tech" className={`nav-link ${isActive('/tech')}`}>Tech Stack</Link>
                    </nav>

                    {/* ACTIONS */}
                    <div className="nav-actions">

                        {/* Search (Desktop) */}
                        <div className="search-terminal">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search Artifacts..."
                                className="search-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') navigate(`/collection?q=${e.currentTarget.value}`)
                                }}
                            />
                        </div>

                        {/* User Profile / Login */}
                        {user ? (
                            <>
                                {isAdmin && (
                                    <Link to="/admin" className="action-btn" title="Dashboard">
                                        <LayoutDashboard size={22} />
                                    </Link>
                                )}
                                <Link to="/profile" className="action-btn" title="Profile">
                                    <User size={22} />
                                </Link>
                                <button onClick={handleLogout} className="action-btn" title="Logout">
                                    <LogOut size={22} />
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="action-btn" title="Login">
                                <User size={22} />
                            </Link>
                        )}

                        {/* Cart */}
                        <Link to="/cart" className="action-btn" title="Cart">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>

                        {/* Mobile Toggle */}
                        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* === MOBILE OVERLAY MENU === */}
            <div className={`mobile-overlay ${menuOpen ? 'open' : ''}`}>
                <Link to="/" className="mobile-link" onClick={handleNavAction}>Home</Link>
                <Link to="/collection" className="mobile-link" onClick={handleNavAction}>Collection</Link>
                <Link to="/about" className="mobile-link" onClick={handleNavAction}>About</Link>
                <Link to="/contact" className="mobile-link" onClick={handleNavAction}>Contact</Link>
                <Link to="/faq" className="mobile-link" onClick={handleNavAction}>FAQ</Link>
                <Link to="/tech" className="mobile-link" onClick={handleNavAction}>Tech Stack</Link>
            </div>

            {/* === MAIN CONTENT === */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* === FOOTER === */}
            <Footer /> {/* Enhanced Footer */}

        </div>
    );
}