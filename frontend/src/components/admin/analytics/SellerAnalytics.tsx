import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, DollarSign, ShoppingCart, Calendar, Map, Activity } from 'lucide-react';

export const SellerAnalytics: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        // Simulate complex aggregation for Part 2 demo
        // In production, these should be pre-aggregated views in Postgres.
        const mockRevenue = Array.from({ length: 14 }).map((_, i) => ({
            date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString(),
            revenue: Math.floor(Math.random() * 5000) + 2000,
            orders: Math.floor(Math.random() * 50) + 10
        }));

        setData({
            revenue: mockRevenue,
            stats: {
                totalRevenue: '$48,290.00',
                orderCount: '842',
                aov: '$57.35',
                conversion: '3.2%'
            }
        });
        setLoading(false);
    };

    const COLORS = ['#FF6B35', '#F7C59F', '#71717a', '#27272a'];

    const StatCard = ({ title, value, icon: Icon, trend }: any) => (
        <div style={{ padding: 24, background: '#131316', border: '1px solid #27272a', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ p: 8, background: 'rgba(255, 107, 53, 0.1)', borderRadius: 8, color: '#FF6B35' }}><Icon size={18} /></div>
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>+{trend}%</div>
            </div>
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 600, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{value}</div>
        </div>
    );

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Analytics</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Industrial-grade commerce intelligence</p>
                </div>
            </div>

            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <StatCard title="Total Revenue" value={data?.stats.totalRevenue} icon={DollarSign} trend="12.5" />
                <StatCard title="Orders" value={data?.stats.orderCount} icon={ShoppingCart} trend="8.2" />
                <StatCard title="Avg. Order Value" value={data?.stats.aov} icon={Activity} trend="4.1" />
                <StatCard title="Conversion Rate" value={data?.stats.conversion} icon={Users} trend="1.7" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Revenue Chart */}
                <div style={{ padding: 24, background: '#131316', border: '1px solid #27272a', borderRadius: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Revenue Over Time</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.revenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 8 }} />
                                <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cohort Analysis Mockup */}
                <div style={{ padding: 24, background: '#131316', border: '1px solid #27272a', borderRadius: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Cohort Retention</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ color: '#71717a' }}>
                                <th style={{ textAlign: 'left', padding: '12px' }}>MONTH</th>
                                <th style={{ padding: '12px' }}>SIZE</th>
                                <th style={{ padding: '12px' }}>M1</th>
                                <th style={{ padding: '12px' }}>M2</th>
                                <th style={{ padding: '12px' }}>M3</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['Jan 2026', 'Feb 2026', 'Mar 2026'].map((m, i) => (
                                <tr key={m} style={{ borderTop: '1px solid #27272a' }}>
                                    <td style={{ padding: '12px', fontWeight: 700, color: '#fff' }}>{m}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#71717a' }}>1,200</td>
                                    <td style={{ padding: '12px', textAlign: 'center', background: `rgba(255, 107, 53, ${0.4 - i*0.1})`, color: '#fff' }}>100%</td>
                                    <td style={{ padding: '12px', textAlign: 'center', background: `rgba(255, 107, 53, ${0.2 - i*0.05})`, color: '#fff' }}>{(15 - i*2)}%</td>
                                    <td style={{ padding: '12px', textAlign: 'center', background: `rgba(255, 107, 53, ${0.1 - i*0.03})`, color: '#fff' }}>{(8 - i)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Revenue Heatmap (Hourly) */}
            <div style={{ padding: 24, background: '#131316', border: '1px solid #27272a', borderRadius: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Hourly Revenue Heatmap</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 4 }}>
                    {Array.from({ length: 24 * 7 }).map((_, i) => {
                        const intensity = Math.random();
                        return (
                            <div 
                                key={i} 
                                title={`Hour: ${i % 24}`}
                                style={{ 
                                    aspectRatio: '1', 
                                    background: intensity > 0.8 ? '#FF6B35' : intensity > 0.5 ? 'rgba(255, 107, 53, 0.4)' : '#1c1c22',
                                    borderRadius: 2
                                }} 
                            />
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#71717a', marginTop: 12 }}>
                    <span>12 AM</span>
                    <span>12 PM</span>
                    <span>11 PM</span>
                </div>
            </div>
        </div>
    );
};
