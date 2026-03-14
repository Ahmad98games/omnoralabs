import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    ShoppingBag, 
    Eye, 
    Zap, 
    ArrowUpRight, 
    Clock, 
    DollarSign, 
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

        let totalDuration = 1500;
        let increment = end / (totalDuration / 16);
        
        let timer = setInterval(() => {
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
        <span>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    );
};

// ── Stat Card Component ──────────────────────────────────────────────────────
const StatCard = ({ label, value, trend, icon: Icon, color, glowColor, prefix = "", suffix = "" }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 transition-all duration-500 hover:border-[var(--accent-gold)]/30 hover:shadow-[0_0_50px_rgba(212,175,55,0.05)]"
    >
        {/* Glow Effect */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-opacity group-hover:opacity-20 ${glowColor}`} />
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-white/5 to-white/0 ring-1 ring-white/10 ${color}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <ArrowUpRight size={10} />
                        {trend}
                    </div>
                )}
            </div>
            
            <div className="space-y-1">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{label}</p>
                <h3 className="text-3xl font-bold tracking-tight text-white flex items-baseline gap-1">
                    <CountingPulse value={value} prefix={prefix} suffix={suffix} />
                </h3>
            </div>
        </div>
    </motion.div>
);

// ── Custom Tooltip for Recharts ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color }}>
                            {entry.value.toLocaleString()}
                            <span className="text-[10px] font-normal text-gray-500">{entry.name}</span>
                        </p>
                    ))}
                </div>
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

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const data = await databaseClient.getStoreAnalytics(user.id);
                setAnalytics(data);
            } catch (error: any) {
                showToast(error.message || 'Failed to fetch analytics', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [user, showToast]);

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                            <Skeleton baseColor="#111" highlightColor="#222" height={120} borderRadius={16} />
                        </div>
                    ))}
                </div>
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8">
                    <Skeleton baseColor="#111" highlightColor="#222" height={400} borderRadius={16} />
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Revenue',
            value: analytics?.totalRevenue || 0,
            prefix: 'PKR ',
            trend: '+12.5%',
            icon: DollarSign,
            color: 'text-[var(--accent-gold)]',
            glowColor: 'bg-[var(--accent-gold)]'
        },
        {
            label: 'Orders',
            value: analytics?.orderCount || 0,
            trend: '+4.2%',
            icon: ShoppingBag,
            color: 'text-white',
            glowColor: 'bg-white'
        },
        {
            label: 'Visitors',
            value: analytics?.views || 0,
            trend: '+18.1%',
            icon: Eye,
            color: 'text-white',
            glowColor: 'bg-white'
        },
        {
            label: 'Conversion',
            value: analytics?.conversionRate || 0,
            suffix: '%',
            trend: '+0.8%',
            icon: Zap,
            color: 'text-[var(--accent-gold)]',
            glowColor: 'bg-[var(--accent-gold)]'
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 text-white selection:bg-[var(--accent-gold)]/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black tracking-tighter text-white uppercase italic"
                    >
                        Omnora <span className="text-[var(--accent-gold)]">Insight</span>
                    </motion.h1>
                    <p className="text-gray-500 mt-2 text-xs font-medium uppercase tracking-[0.3em]">
                        Performance Command Center — Live Feed
                    </p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                    Real-time Tracking Enabled
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Performance Chart */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group"
            >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-gold)]/20 to-transparent" />
                
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <TrendingUp size={20} className="text-[var(--accent-gold)]" />
                            Revenue Streams
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Daily interaction x revenue flow</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
                            Revenue
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                            Views
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.dailyStats || []}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(val) => `PKR ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(212,175,55,0.2)', strokeWidth: 2 }} />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                name="Revenue"
                                stroke="#D4AF37" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                                filter="drop-shadow(0 0 10px rgba(212,175,55,0.3))"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="views" 
                                name="Views"
                                stroke="#FFFFFF" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1} 
                                fill="url(#colorViews)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-[var(--accent-gold)]" />
                            Live Transaction Feed
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Direct oversight of your latest customer interactions.</p>
                    </div>
                    <button className="text-[var(--accent-gold)] hover:text-white transition-colors text-[10px] font-bold flex items-center gap-2 uppercase tracking-[0.2em] group">
                        Enter Ledger <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.02] border-b border-white/5 text-gray-500">
                                <tr>
                                    <th className="px-8 py-5 font-bold uppercase tracking-[0.2em] text-[10px]">Reference</th>
                                    <th className="px-8 py-5 font-bold uppercase tracking-[0.2em] text-[10px]">Entity</th>
                                    <th className="px-8 py-5 font-bold uppercase tracking-[0.2em] text-[10px]">Status</th>
                                    <th className="px-8 py-5 font-bold uppercase tracking-[0.2em] text-[10px] text-right">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {analytics?.recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-600 font-medium italic">
                                            No active transactions in current cycle.
                                        </td>
                                    </tr>
                                ) : (
                                    analytics?.recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/[0.02] transition-all duration-300 group">
                                            <td className="px-8 py-5 font-mono text-[10px] text-[var(--accent-gold)]">
                                                ORD-{order.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white group-hover:border-[var(--accent-gold)]/50 transition-colors">
                                                        {(order.customerName || 'A').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-[11px] uppercase tracking-wider">
                                                            {order.customerName || 'Anonymous'}
                                                        </p>
                                                        <p className="text-[9px] text-gray-600 font-mono mt-0.5">{order.customerEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${
                                                    order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-white/5 text-white/40 border-white/10'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <p className="text-white font-bold tracking-tight text-sm">
                                                    {order.currency || 'PKR'} {order.totalAmount.toLocaleString()}
                                                </p>
                                                <p className="text-[9px] text-gray-600 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
