import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingCart, User, LogOut, Menu, X, Search,
    LayoutDashboard, ShieldCheck
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
    const [searchQuery, setSearchQuery] = useState('');

    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. SCROLL PHYSICS (Glass Effect Trigger)
    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            if (offset > 50) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 2. SCROLL LOCK (When Menu is Open)
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
    }, [menuOpen]);

    // 3. CART SYNC SYSTEM
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

    // 4. NAVIGATION HANDLERS
    const handleNavAction = () => setMenuOpen(false);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/collection?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            setMenuOpen(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        handleNavAction();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <div className="layout">

            {/* === COMMAND DECK (HEADER) === */}
            <header className={`header ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-active' : ''}`}>
                <div className="header-container">

                    {/* IDENTITY */}
                    <Link to="/" className="logo" onClick={handleNavAction}>
                        <div className="logo-symbol">
                            <img src="/images/omnora store.png" alt="Omnora Logo" style={{ height: '40px', objectFit: 'contain' }} />
                        </div>
                    </Link>

                    {/* DESKTOP NAVIGATION */}
                    <nav className="nav-desktop">
                        <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                        <Link to="/collection" className={`nav-link ${isActive('/collection')}`}>Collection</Link>
                        <Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
                        <Link to="/tech" className={`nav-link ${isActive('/tech')}`}>Tech</Link>
                        <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link>
                        <Link to="/faq" className={`nav-link ${isActive('/faq')}`}>FAQ</Link>
                    </nav>

                    {/* ACTIONS MODULE */}
                    <div className="nav-actions">

                        {/* Search Terminal */}
                        <div className="search-terminal">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>

                        {/* User Auth */}
                        {user ? (
                            <>
                                {isAdmin && (
                                    <Link to="/admin" className="action-btn" title="Command Center">
                                        <LayoutDashboard size={20} />
                                    </Link>
                                )}
                                <Link to="/profile" className="action-btn" title="Profile">
                                    <User size={20} />
                                </Link>
                                <button onClick={handleLogout} className="action-btn" title="Disconnect">
                                    <LogOut size={20} />
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="action-btn" title="Login">
                                <User size={20} />
                            </Link>
                        )}

                        {/* Cart */}
                        <Link to="/cart" className="action-btn cart-btn" title="Cart">
                            <ShoppingCart size={20} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>

                        {/* Mobile Toggle */}
                        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* === MOBILE OVERLAY (THE VOID) === */}
            <div className={`mobile-overlay ${menuOpen ? 'open' : ''}`}>
                <nav className="mobile-nav">
                    <Link to="/" className="mobile-link" onClick={handleNavAction}>Home</Link>
                    <Link to="/collection" className="mobile-link" onClick={handleNavAction}>Collection</Link>
                    <Link to="/about" className="mobile-link" onClick={handleNavAction}>About</Link>
                    <Link to="/tech" className="mobile-link" onClick={handleNavAction}>Technology</Link>
                    <Link to="/contact" className="mobile-link" onClick={handleNavAction}>Support</Link>
                    <Link to="/faq" className="mobile-link" onClick={handleNavAction}>FAQ</Link>

                    {/* Mobile Search Input */}
                    <div className="mobile-search-wrapper">
                        <input
                            type="text"
                            placeholder="SEARCH ARTIFACTS..."
                            className="mobile-search"
                            onKeyDown={handleSearch}
                        />
                    </div>
                </nav>
            </div>

            {/* === SYSTEM CONTENT === */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* === SYSTEM FOOTER === */}
            <Footer />
        </div>
    );
}