import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        pendingOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) {
            fetchDashboardData();
        }
    }, [isAdmin]);

    const fetchDashboardData = async () => {
        try {
            const [ordersRes] = await Promise.all([
                client.get('/orders/admin/all')
            ]);

            const orders = ordersRes.data.orders || [];

            setStats({
                totalOrders: orders.length,
                totalRevenue: orders.reduce((sum: number, o: any) => sum + o.total, 0),
                totalCustomers: new Set(orders.map((o: any) => o.user)).size,
                pendingOrders: orders.filter((o: any) => o.status === 'pending').length
            });

            setRecentOrders(orders.slice(0, 5));
        } catch (error) {
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="admin-unauthorized">
                <h2>Access Denied</h2>
                <p>You need admin privileges to access this page.</p>
                <Link to="/">Go Home</Link>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-container">
                <h1>Admin Dashboard</h1>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-content">
                            <h3>{stats.totalOrders}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <h3>PKR {stats.totalRevenue.toLocaleString()}</h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <h3>{stats.totalCustomers}</h3>
                            <p>Customers</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <h3>{stats.pendingOrders}</h3>
                            <p>Pending Orders</p>
                        </div>
                    </div>
                </div>

                <div className="admin-sections">
                    <div className="admin-section">
                        <h2>Quick Actions</h2>
                        <div className="action-buttons">
                            <Link to="/admin/products" className="action-btn">
                                Manage Products
                            </Link>
                            <Link to="/admin/orders" className="action-btn">
                                View All Orders
                            </Link>
                            <Link to="/admin/customers" className="action-btn">
                                Customer List
                            </Link>
                        </div>
                    </div>

                    <div className="admin-section">
                        <h2>Recent Orders</h2>
                        <div className="orders-table">
                            {recentOrders.length === 0 ? (
                                <p>No orders yet</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order: any) => (
                                            <tr key={order._id}>
                                                <td>{order.orderNumber}</td>
                                                <td>{order.user?.name || 'N/A'}</td>
                                                <td>PKR {order.total.toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-badge ${order.status}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
