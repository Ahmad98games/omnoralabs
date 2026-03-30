import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    ShoppingBag, 
    Eye, 
    Zap, 
    DollarSign
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { StoreAnalytics } from '../../platform/core/DatabaseTypes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ── Animated Number Component ────────────────────────────────────────────────
const CountingPulse = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        const totalDuration = 1500;
        const increment = end / (totalDuration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span className="font-mono tracking-wider">
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    );
};

// ── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: number;
    trend?: string;
    icon: React.ElementType;
    prefix?: string;
    suffix?: string;
}

const StatCard = ({ label, value, trend, icon: Icon, prefix = "", suffix = "" }: StatCardProps) => (
    <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="kpi-card"
    >
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
            <CountingPulse value={value} prefix={prefix} suffix={suffix} />
        </div>
        {trend && (
            <div className={`kpi-trend ${trend.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                {trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                {trend}
            </div>
        )}
        <div className="absolute top-4 right-4 text-ghost opacity-20">
            <Icon size={20} strokeWidth={1.5} />
        </div>
    </motion.div>
);

// ── Custom Tooltip for Recharts ──────────────────────────────────────────────
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        color: string;
        value: number;
        name: string;
    }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--surface-high)', border: '1px solid var(--border-mid)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-ghost)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
                {payload.map((entry: { color?: string; value: number; name: string }, index: number) => (
                    <p key={index} style={{ fontSize: '12px', fontWeight: 800, color: entry.color }}>
                        {entry.value.toLocaleString()} 
                        <span style={{ fontSize: '9px', marginLeft: '4px', opacity: 0.6 }}>{entry.name}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const AdminOverview = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commandSummary, setCommandSummary] = useState<string>('Analyzing encrypted metrics...');

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const data = await databaseClient.getStoreAnalytics(user.id);
                setAnalytics(data);
                try {
                    const sumRes = await axios.post('/api/cms/performance-hub/summary', { stats: data });
                    if (sumRes.data?.summary) setCommandSummary(sumRes.data.summary);
                } catch {
                    setCommandSummary('AI Insight: Revenue streams showing positive trajectory.');
                }
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : 'Metrics inaccessible';
                showToast(msg, 'error');
                setAnalytics({ totalRevenue: 0, orderCount: 0, views: 0, conversionRate: 0, dailyStats: [], recentOrders: [] } as StoreAnalytics);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [user, showToast]);

    if (isLoading) return (
        <div className="kpi-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="kpi-card" style={{ height: '140px' }}>
                    <Skeleton baseColor="var(--surface-mid)" highlightColor="var(--surface-high)" height="20px" width="50%" />
                    <Skeleton baseColor="var(--surface-mid)" highlightColor="var(--surface-high)" height="40px" style={{ marginTop: '12px' }} />
                </div>
            ))}
        </div>
    );

    const stats = [
        { label: 'GROSS REVENUE', value: analytics?.totalRevenue || 0, prefix: 'PKR ', trend: '+12.4%', icon: DollarSign },
        { label: 'ORDERS FULFILLED', value: analytics?.orderCount || 0, trend: '+4.2%', icon: ShoppingBag },
        { label: 'NETWORK TRAFFIC', value: analytics?.views || 0, trend: '+18.1%', icon: Eye },
        { label: 'CONVERSION VELOCITY', value: analytics?.conversionRate || 0, suffix: '%', trend: '+0.8%', icon: Zap }
    ];

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* AI HUD */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    background: 'var(--surface-low)', 
                    borderLeft: '2px solid var(--accent-gold)',
                    borderRight: '1px solid var(--border-low)',
                    borderTop: '1px solid var(--border-low)',
                    borderBottom: '1px solid var(--border-low)',
                    padding: '16px 24px', 
                    borderRadius: '8px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
            >
                <div style={{ color: 'var(--accent-gold)', fontWeight: 900, fontSize: '10px', letterSpacing: '0.1em' }}>NEURAL FEED /</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontStyle: 'italic', fontWeight: 500 }}>“{commandSummary}”</div>
            </motion.div>

            {/* KPI GRID */}
            <div className="kpi-grid">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* CHART VIEW */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="table-container"
                style={{ marginBottom: '32px', padding: '32px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>Revenue Velocity</h2>
                        <p style={{ fontSize: '10px', color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Last 30 Continuous Cycles</p>
                    </div>
                </div>

                <div style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.dailyStats || []}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-low)" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-ghost)', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-ghost)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                                tickFormatter={(val) => `PKR ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#fff" 
                                strokeWidth={2}
                                fill="url(#colorRev)" 
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* LIVE FEED */}
            <div className="table-container">
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Live Settlement Feed</h3>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>View Ledger →</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Entity</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Settlement</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics?.recentOrders.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No active settlements synchronized.</td>
                            </tr>
                        ) : (
                            analytics?.recentOrders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-ghost)' }}>#{order.id.slice(-8).toUpperCase()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '28px', height: '28px', background: 'var(--surface-high)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '10px', fontWeight: 900 }}>{(order.customerName || 'A')[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '13px' }}>{order.customerName || 'Anonymous Entity'}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-ghost)' }}>{order.customerEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`pill ${order.status === 'PAID' ? 'pill-success' : 'pill-pending'}`}>{order.status}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                        {order.currency || 'PKR'} {order.totalAmount.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
