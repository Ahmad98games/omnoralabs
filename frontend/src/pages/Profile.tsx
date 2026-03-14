import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import client from '../api/client';
import {
    User,
    Package,
    MapPin,
    Key,
    LogOut,
    ChevronRight,
    Clock,
    Loader2
} from 'lucide-react';
import './Profile.css';

type Order = {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    items: any[];
};

export default function Profile() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);

    // Form States
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await client.get('/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.put('/users/profile', formData);
            showToast('Profile data updated', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Password mismatch', 'error');
            return;
        }
        setLoading(true);
        try {
            await client.put('/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            showToast('Security protocols updated', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Password update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    return (
        <div className="profile-page">
            <div className="noise-layer" />

            <div className="container">
                <div className="profile-layout">

                    {/* SIDEBAR NAVIGATION */}
                    <aside className="profile-sidebar-luxury">
                        <div className="user-profile-card">
                            <div className="avatar-gold">
                                {getInitials(user?.name || 'User')}
                            </div>
                            <div className="user-info">
                                <h3 className="font-serif">{user?.name}</h3>
                                <span className="user-rank">{(user as any)?.isAdmin ? 'ATELIER ADMIN' : 'VALUED CLIENT'}</span>
                            </div>
                        </div>

                        <nav className="sidebar-nav">
                            <button
                                className={`nav-btn ${activeTab === 'account' ? 'active' : ''}`}
                                onClick={() => setActiveTab('account')}
                            >
                                <User size={18} /> Account Settings
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveTab('orders')}
                            >
                                <Package size={18} /> Order History
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'addresses' ? 'active' : ''}`}
                                onClick={() => setActiveTab('addresses')}
                            >
                                <MapPin size={18} /> Locations
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'password' ? 'active' : ''}`}
                                onClick={() => setActiveTab('password')}
                            >
                                <Key size={18} /> Security
                            </button>
                        </nav>

                        <button onClick={logout} className="logout-btn">
                            <LogOut size={18} /> Disconnect
                        </button>
                    </aside>

                    {/* MAIN CONTENT AREA */}
                    <main className="profile-content">

                        {/* ACCOUNT TAB */}
                        {activeTab === 'account' && (
                            <div className="panel-luxury reveal">
                                <div className="panel-header-luxury">
                                    <h2 className="subtitle-serif">Client Profile</h2>
                                    <p className="description-small italic">Manage your personal atelier preferences.</p>
                                </div>
                                <form onSubmit={handleUpdateProfile} className="luxury-profile-form">
                                    <div className="form-group-lux">
                                        <label>FULL NAME</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="lux-form-input"
                                        />
                                    </div>
                                    <div className="form-group-lux">
                                        <label>EMAIL ADDRESS</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="lux-form-input"
                                            disabled
                                        />
                                    </div>
                                    <button type="submit" className="btn-luxury-action" disabled={loading}>
                                        {loading ? 'SAVING...' : 'SAVE CHANGES'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ORDERS TAB */}
                        {activeTab === 'orders' && (
                            <div className="panel-luxury reveal">
                                <div className="panel-header-luxury">
                                    <h2 className="subtitle-serif">Order History</h2>
                                    <p className="description-small italic">Refining your past atelier acquisitions.</p>
                                </div>

                                {loading ? (
                                    <div className="loading-luxury">Refining data...</div>
                                ) : orders.length === 0 ? (
                                    <div className="empty-state-luxury">
                                        <Package size={48} strokeWidth={1} className="text-gold mb-4" />
                                        <p>No boutique records found.</p>
                                        <Link to="/collection" className="btn-luxury-outline">Shop the Collection</Link>
                                    </div>
                                ) : (
                                    <div className="orders-list-luxury">
                                        {orders.map((order) => (
                                            <div key={order._id} className="order-row-luxury">
                                                <div className="ord-info">
                                                    <span className="ord-id">#{order.orderNumber || order._id.slice(-6)}</span>
                                                    <span className="ord-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="ord-amount">PKR {order.total.toLocaleString()}</div>
                                                <div className="ord-status">
                                                    <span className={`status-pill ${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <Link to={`/orders/${order._id}`} className="view-link-lux">
                                                    DETAILS <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ADDRESSES TAB */}
                        {activeTab === 'addresses' && (
                            <div className="panel-animate">
                                <div className="panel-header">
                                    <h2>Drop Coordinates</h2>
                                    <p>Manage shipping destinations.</p>
                                </div>
                                <div className="empty-state">
                                    <MapPin size={48} />
                                    <p>Address management module coming in Omnora v2.1.</p>
                                </div>
                            </div>
                        )}

                        {/* PASSWORD TAB */}
                        {activeTab === 'password' && (
                            <div className="panel-luxury reveal">
                                <div className="panel-header-luxury">
                                    <h2 className="subtitle-serif">Security Settings</h2>
                                    <p className="description-small italic">Secure your atelier access.</p>
                                </div>
                                <form onSubmit={handleChangePassword} className="luxury-profile-form">
                                    <div className="form-group-lux">
                                        <label>CURRENT PASSWORD</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="lux-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group-lux">
                                            <label>NEW PASSWORD</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="lux-form-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group-lux">
                                            <label>CONFIRM PASSWORD</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="lux-form-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-luxury-action" disabled={loading}>
                                        {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                                    </button>
                                </form>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
}