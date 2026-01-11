import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Package, ShoppingBag, Users,
    LogOut, ExternalLink, Menu, X, ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import './AdminLayout.css';

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // FIXED: Added ': string' to satisfy TypeScript
    const isActive = (path: string) => location.pathname.includes(path) ? 'active' : '';

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="admin-layout">
            {/* Sidebar Overlay (Mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-badge">
                        <img src="/images/omnora store.png" alt="Omnora Admin" style={{ height: '24px', objectFit: 'contain' }} />
                        <h2>OMNORA <span className="admin-tag">ADMIN</span></h2>
                    </div>
                    <button className="close-btn mobile-only" onClick={closeSidebar}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group-label">MANAGEMENT</div>

                    <Link to="/admin/dashboard" className={`nav-item ${isActive('dashboard')}`} onClick={closeSidebar}>
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/products" className={`nav-item ${isActive('products')}`} onClick={closeSidebar}>
                        <Package size={18} />
                        <span>Inventory</span>
                    </Link>
                    <Link to="/admin/orders" className={`nav-item ${isActive('orders')}`} onClick={closeSidebar}>
                        <ShoppingBag size={18} />
                        <span>Orders</span>
                    </Link>
                    <Link to="/admin/users" className={`nav-item ${isActive('users')}`} onClick={closeSidebar}>
                        <Users size={18} />
                        <span>Customers</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <Link to="/" className="nav-item view-site" target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={18} />
                        <span>Live Store</span>
                    </Link>
                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <LogOut size={18} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                <header className="admin-header">
                    <button className="menu-btn mobile-only" onClick={() => setSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="header-title">
                        <h1>System Overview</h1>
                        <span className="status-indicator">
                            <span className="blink-dot"></span> Online
                        </span>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}