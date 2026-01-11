import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
    Activity,
    DollarSign,
    Users,
    ShoppingBag,
    RefreshCw,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';
import './AdminDashboard.css';

interface DashboardStats {
    revenue: number;
    customers: number;
    activeOrders: number;
    avgOrderValue: number;
}

interface OrderFunnel {
    initiated: number;
    pending: number;
    processing: number;
    completed: number;
}

interface RecentOrder {
    _id: string;
    orderNumber?: string;
    user?: { name: string; email: string };
    guestCustomer?: { name: string; email: string };
    totalAmount: number;
    status: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const { isAdmin } = useAuth();

    const [stats, setStats] = useState<DashboardStats>({
        revenue: 0, customers: 0, activeOrders: 0, avgOrderValue: 0
    });
    const [funnel, setFunnel] = useState<OrderFunnel>({
        initiated: 0, pending: 0, processing: 0, completed: 0
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const processData = (orders: any[]) => {
        if (!Array.isArray(orders)) return;

        const validOrders = orders.filter((o: any) => !['cancelled', 'rejected'].includes(o?.status));

        const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + (o?.totalAmount || 0), 0);

        const uniqueCustomers = new Set(orders.map((o: any) =>
            o?.user?._id || o?.guestCustomer?.email || 'guest'
        )).size;

        const newFunnel = {
            initiated: orders.filter((o: any) => o?.status === 'INITIATED').length,
            pending: orders.filter((o: any) => ['pending', 'receipt_submitted'].includes(o?.status)).length,
            processing: orders.filter((o: any) => ['approved', 'processing'].includes(o?.status)).length,
            completed: orders.filter((o: any) => ['shipped', 'delivered'].includes(o?.status)).length
        };

        setStats({
            revenue: totalRevenue,
            customers: uniqueCustomers,
            activeOrders: newFunnel.pending + newFunnel.processing,
            avgOrderValue: validOrders.length ? totalRevenue / validOrders.length : 0
        });

        setFunnel(newFunnel);
        setRecentOrders(orders.slice(0, 8));
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await client.get('/orders/admin/all');
            if (data.orders) {
                processData(data.orders);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Live Sync Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [isAdmin, fetchData]);

    if (!isAdmin) return <div className="access-denied">ACCESS DENIED</div>;

    return (
        <div className="dashboard-container animate-fade-in">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>COMMAND CENTER</h1>
                    <div className="live-badge">
                        <span className="pulse-dot"></span>
                        LIVE FEED • {lastUpdated.toLocaleTimeString()}
                    </div>
                </div>
                <div className="header-right">
                    <button className="refresh-btn" onClick={fetchData} disabled={loading}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} />
                        {loading ? "SYNCING..." : "SYNC NOW"}
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="stat-card revenue-card">
                    <div className="stat-header">
                        <div className="stat-icon"><DollarSign size={20} /></div>
                        <span className="trend-badge positive"><TrendingUp size={12} /> +12%</span>
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">TOTAL REVENUE</span>
                        <span className="stat-value">PKR {stats.revenue.toLocaleString()}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon blue"><Users size={20} /></div>
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">UNIQUE CLIENTS</span>
                        <span className="stat-value">{stats.customers}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon purple"><ShoppingBag size={20} /></div>
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">AVG. ORDER VALUE</span>
                        <span className="stat-value">PKR {Math.round(stats.avgOrderValue).toLocaleString()}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon orange"><Activity size={20} /></div>
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">ACTIVE ORDERS</span>
                        <span className="stat-value">{stats.activeOrders}</span>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="main-grid">

                {/* Funnel Panel */}
                <div className="panel funnel-panel">
                    <div className="panel-header">
                        <h3>CONVERSION PIPELINE</h3>
                        <Activity size={16} className="panel-icon" />
                    </div>
                    <div className="funnel-container">
                        {[
                            { label: 'Initiated', val: funnel.initiated, max: 100 }, // Mock max for demo
                            { label: 'Pending', val: funnel.pending, max: 80, opacity: 0.8 },
                            { label: 'Processing', val: funnel.processing, max: 60, opacity: 0.6 },
                            { label: 'Completed', val: funnel.completed, max: 40, color: 'success' }
                        ].map((step, i) => (
                            <div key={i} className="funnel-step">
                                <div
                                    className={`step-bar ${step.color || ''}`}
                                    style={{ height: `${Math.min(100, Math.max(10, step.val * 5))}%`, opacity: step.opacity || 1 }}
                                >
                                    <span className="step-val">{step.val}</span>
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Orders Panel */}
                <div className="panel activity-panel">
                    <div className="panel-header">
                        <h3>RECENT TRANSMISSIONS</h3>
                        <ArrowUpRight size={16} className="panel-icon" />
                    </div>
                    <div className="table-wrapper">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>ENTITY</th>
                                    <th>STATUS</th>
                                    <th className="text-right">VALUE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order._id}>
                                        <td className="mono-text id-cell">
                                            #{order?.orderNumber || order?._id?.slice(-4) || '----'}
                                        </td>
                                        <td className="entity-cell">
                                            {order?.user?.name || order?.guestCustomer?.name || 'Guest'}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${order?.status}`}>
                                                {order?.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="text-right mono-text highlight">
                                            {order.totalAmount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="dashboard-footer">
                <div className="system-status">
                    <span className="status-dot green"></span> SYSTEM OPERATIONAL
                </div>
                <div className="credits">
                    ENGINEERED BY <span className="highlight">AHMAD MAHBOOB</span>
                </div>
            </footer>
        </div>
    );
}