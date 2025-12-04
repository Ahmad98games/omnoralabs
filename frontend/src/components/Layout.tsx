import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, ShoppingCart, User, LogOut, Menu, X, Mail, MessageSquare, Info, LayoutDashboard, Twitter, Instagram, Facebook } from 'lucide-react';
// Define the types for the HeaderIcon component props
type HeaderIconProps = {
    children: React.ReactNode;
    to: string;
    onClick?: () => void;
    className?: string;
};

// Define the type for a cart item
interface CartItem {
    quantity: number;
    // Add other properties if they exist in your cart items, e.g., id: string; name: string; price: number;
}

// Helper component for cleaner header actions
const HeaderIcon = ({ children, to, onClick = () => { }, className = '' }: HeaderIconProps) => (
    <Link to={to} className={`nav-icon-link ${className}`} onClick={onClick}>
        {children}
    </Link>
);

export default function Layout() {
    const [cartCount, setCartCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Function to close menu after interaction
    const handleNavAction = useCallback(() => {
        if (menuOpen) setMenuOpen(false);
    }, [menuOpen]);

    // Cart Logic: Memoized callback for robust cart update logic
    const updateCartCount = useCallback(() => {
        try {
            // Use the defined CartItem interface for type safety
            const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            // Ensure item quantity is treated as a number
            const total = cart.reduce((sum: number, item: CartItem) => sum + (Number(item.quantity) || 0), 0);
            setCartCount(total);
        } catch (error) {
            console.error("Error parsing cart from localStorage:", error);
            setCartCount(0);
        }
    }, []);

    useEffect(() => {
        updateCartCount();
        // Register and clean up event listener for external cart changes
        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);
    }, [updateCartCount]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            // In a real app, you would show a user-facing error message here
        }
    };

    // Map the main navigation links for cleaner rendering
    const primaryNavLinks = [
        { to: "/", label: "Home", icon: Home },
        { to: "/collection", label: "Shop", icon: null },
        { to: "/about", label: "About", icon: Info },
        { to: "/contact", label: "Contact", icon: Mail },
        { to: "/faq", label: "FAQ", icon: MessageSquare },
    ];

    return (
        <div className="layout">
            <header className="header">
                <div className="container header-container">
                    {/* LOGO */}
                    <Link to="/" className="logo" onClick={handleNavAction}>
                        <img src="/images/omnora.jpg" alt="Omnora Logo" className="logo-img" />
                        <span className="logo-text">Omnora</span>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
                        {primaryNavLinks.map(link => (
                            <Link key={link.to} to={link.to} className="nav-link" onClick={handleNavAction}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Search Bar - Desktop only */}
                    <div className="nav-search hidden-mobile">
                        <Mail size={18} />
                        <input
                            type="search"
                            placeholder="Search products..."
                            aria-label="Search"
                        />
                    </div>

                    {/* USER and CART ACTIONS */}
                    <div className="nav-actions">
                        {user ? (
                            <>
                                {/* Profile */}
                                <HeaderIcon to="/profile" onClick={handleNavAction}>
                                    <User size={24} aria-label="Profile" />
                                </HeaderIcon>

                                {/* Admin Link */}
                                {user.role === 'admin' && (
                                    <HeaderIcon to="/admin" onClick={handleNavAction}>
                                        <LayoutDashboard size={24} aria-label="Admin Dashboard" />
                                    </HeaderIcon>
                                )}

                                {/* Logout Button */}
                                <button
                                    onClick={() => { handleLogout(); handleNavAction(); }}
                                    className="nav-icon-link logout-btn"
                                    aria-label="Logout"
                                >
                                    <LogOut size={24} />
                                </button>
                            </>
                        ) : (
                            // Login Link
                            <HeaderIcon to="/login" onClick={handleNavAction}>
                                <User size={24} aria-label="Login" />
                            </HeaderIcon>
                        )}

                        {/* Cart Link with Badge */}
                        <HeaderIcon to="/cart" className="cart-link" onClick={handleNavAction}>
                            <ShoppingCart size={24} aria-label="Shopping Cart" />
                            {cartCount > 0 && (
                                <>
                                    <span className="cart-badge">{cartCount}</span>
                                    {/* Screen reader text for accessibility */}
                                    <span className="sr-only">Items in cart: {cartCount}</span>
                                </>
                            )}
                        </HeaderIcon>
                    </div>

                    {/* MENU TOGGLE BUTTON */}
                    <button
                        className="menu-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* FOOTER - Added Social Icons */}
            <footer className="footer">
                <div className="container footer-container">
                    <div className="footer-section">
                        <h4>Omnora</h4>
                        <p>Premium handcrafted bath bombs for modern self-care. Join us for a relaxing experience.</p>
                        <div className="social-links">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter"><Twitter size={20} /></a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram"><Instagram size={20} /></a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook"><Facebook size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <Link to="/about" onClick={handleNavAction}>About Us</Link>
                        <Link to="/contact" onClick={handleNavAction}>Contact</Link>
                        <Link to="/faq" onClick={handleNavAction}>FAQ</Link>
                        <Link to="/collection" onClick={handleNavAction}>Shop All</Link>
                    </div>

                    <div className="footer-section">
                        <h4>Legal</h4>
                        <Link to="/terms" onClick={handleNavAction}>Terms of Service</Link>
                        <Link to="/privacy" onClick={handleNavAction}>Privacy Policy</Link>
                        <Link to="/shipping" onClick={handleNavAction}>Shipping & Returns</Link>
                    </div>

                    <div className="footer-section contact-info">
                        <h4>Contact</h4>
                        <p>Email: <a href="mailto:omnorainfo28@gmail.com">omnorainfo28@gmail.com</a></p>
                        <p>Phone: <a href="tel:+923334355475">+92 333 4355475</a></p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Omnora. All rights reserved. | Developed By Ahmad Mahboob</p>
                </div>
            </footer>
        </div>
    );
}
