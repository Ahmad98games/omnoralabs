import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import client from '../api/client';
import './Profile.css';

type Order = {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    items: any[];
};

type Address = {
    _id?: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
};

export default function Profile() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);

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
            const res = await client.get('/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch orders');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.put('/users/profile', formData);
            showToast('Profile updated successfully', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            await client.put('/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            showToast('Password changed successfully', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
       <h1>My Account</h1>
       <p>Manage your profile and orders</p>
   </div>
   <div className="profile-tabs">
       <button
           className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
           onClick={() => setActiveTab('account')}
       >
           Account
       </button>
       <button
           className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
           onClick={() => setActiveTab('orders')}
       >
           Orders
       </button>
       <button
           className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
           onClick={() => setActiveTab('addresses')}
       >
           Addresses
       </button>
       <button
           className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
           onClick={() => setActiveTab('password')}
       >
           Password
       </button>
   </div>
   <div className="profile-content">
       {activeTab === 'account' && (
           <div className="tab-panel animate-fade-in">
               <h2>Account Information</h2>
               <form onSubmit={handleUpdateProfile} className="profile-form">
                   <div className="form-group">
                       <label>Full Name</label>
                       <input
                           type="text"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="form-input"
                       />
                   </div>
                   <div className="form-group">
                       <label>Email Address</label>
                       <input
                           type="email"
                           value={formData.email}
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                           className="form-input"
                       />
                   </div>
                   <button type="submit" className="luxury-button" disabled={loading}>
                       {loading ? 'Updating...' : 'Update Profile'}
                   </button>
               </form>
               <button onClick={logout} className="logout-btn">
                   Sign Out
               </button>
           </div>
       )}
       {activeTab === 'orders' && (
           <div className="tab-panel animate-fade-in">
               <h2>Order History</h2>
               {orders.length === 0 ? (
                   <div className="empty-state">
                       <p>No orders yet</p>
                       <Link to="/collection" className="luxury-button">
                           Start Shopping
                       </Link>
                   </div>
               ) : (
                   <div className="orders-list">
                       {orders.map((order) => (
                           <div key={order._id} className="order-card">
                               <div className="order-header">
                                   <span className="order-number">#{order.orderNumber}</span>
                                   <span className={`order-status ${order.status.toLowerCase()}`}>
                                       {order.status}
                                   </span>
                               </div>
                               <div className="order-details">
                                   <p>Total: PKR {order.total.toLocaleString()}</p>
                                   <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                               </div>
                               <Link to={`/orders/${order._id}`} className="view-order-btn">
                                   View Details →
                               </Link>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       )}
       {activeTab === 'addresses' && (
           <div className="tab-panel animate-fade-in">
               <h2>Saved Addresses</h2>
               <p>Address management coming soon</p>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="tab-panel animate-fade-in">
                            <h2>Change Password</h2>
                            <form onSubmit={handleChangePassword} className="profile-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <button type="submit" className="luxury-button" disabled={loading}>
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
