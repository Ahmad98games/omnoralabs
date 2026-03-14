import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsClient, DashboardStats, ChartDataPoint } from '../platform/core/AnalyticsClient';
import { localAIEngine } from '../lib/LocalAIEngine';
import { Loader2, TrendingUp, DollarSign, Package, Sparkles } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css'; // Preserving the CSS import just in case, though styles are inline

export default function AdminDashboard() {
    const { user } = useAuth();
    // Assuming user.id serves as the merchantId in this architecture based on previous context
    const merchantId = user?.id || ''; 

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [insightStatus, setInsightStatus] = useState<'idle' | 'initializing' | 'analyzing' | 'done' | 'error'>('idle');
    const [insights, setInsights] = useState<string>('');
    const [progressText, setProgressText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [dashboardStats, salesData] = await Promise.all([
                    analyticsClient.getDashboardStats(merchantId),
                    analyticsClient.getSalesChartData(merchantId, 7)
                ]);
                setStats(dashboardStats);
                setChartData(salesData);
            } catch (err) {
                console.error("Dashboard failed to load analytics:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (merchantId) {
            fetchData();
        }
    }, [merchantId]);

    const handleGenerateInsights = async () => {
        if (!stats) return;
        setInsightStatus('initializing');
        
        try {
            // First boot the local Engine if it isn't already active
            await localAIEngine.init((progress) => {
                setProgressText(progress.text);
            });

            setInsightStatus('analyzing');
            
            // Generate insights passing our analytics client output
            const analysis = await localAIEngine.analyzeData({ stats, chartData });
            setInsights(analysis);
            setInsightStatus('done');
            
        } catch (err: any) {
            console.error("AI Insight failure:", err);
            setInsights(err.message || 'Engine failure.');
            setInsightStatus('error');
        }
    };

    if (isLoading) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0a0a0f', minHeight: '100vh' }}>
                <Loader2 className="spin" color="#7c6dfa" size={32} />
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', background: '#0a0a0f', minHeight: '100vh', color: '#f0f0f5', fontFamily: "'Inter', sans-serif" }}>
            <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: '#fff' }}>Dashboard overview</h1>
            
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                
                {/* Revenue Card */}
                <div style={{ background: 'rgba(20, 20, 28, 0.4)', border: '1px solid rgba(124, 109, 250, 0.1)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: '#8b8ba0', fontSize: '14px', fontWeight: 500 }}>Total Revenue</span>
                        <div style={{ padding: '8px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '8px', color: '#34d399' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>
                        ${(stats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '13px' }}>
                        <TrendingUp size={14} color="#34d399" />
                        <span style={{ color: '#34d399', fontWeight: 500 }}>+12.5%</span>
                        <span style={{ color: '#8b8ba0' }}>from last week</span>
                    </div>
                </div>

                {/* Orders Card */}
                <div style={{ background: 'rgba(20, 20, 28, 0.4)', border: '1px solid rgba(124, 109, 250, 0.1)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: '#8b8ba0', fontSize: '14px', fontWeight: 500 }}>Total Orders</span>
                        <div style={{ padding: '8px', background: 'rgba(124, 109, 250, 0.1)', borderRadius: '8px', color: '#7c6dfa' }}>
                            <Package size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>
                        {(stats?.totalOrders || 0).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '13px' }}>
                        <TrendingUp size={14} color="#34d399" />
                        <span style={{ color: '#34d399', fontWeight: 500 }}>+4.2%</span>
                        <span style={{ color: '#8b8ba0' }}>from last week</span>
                    </div>
                </div>

                {/* AOV Card */}
                <div style={{ background: 'rgba(20, 20, 28, 0.4)', border: '1px solid rgba(124, 109, 250, 0.1)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: '#8b8ba0', fontSize: '14px', fontWeight: 500 }}>Avg Order Value</span>
                        <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', color: '#38bdf8' }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>
                        ${stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '13px' }}>
                        <span style={{ color: '#8b8ba0' }}>Avg per fulfilled carton</span>
                    </div>
                </div>
            </div>

            {/* Main Sales Chart */}
            <div style={{ background: 'rgba(20, 20, 28, 0.4)', border: '1px solid rgba(124, 109, 250, 0.1)', borderRadius: '16px', padding: '24px', marginBottom: '32px', height: '400px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#fff', marginBottom: '24px' }}>Revenue (7 Days)</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c6dfa" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#7c6dfa" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#8b8ba0" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#8b8ba0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} dx={-10} />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <Tooltip 
                            contentStyle={{ background: '#14141c', border: '1px solid rgba(124, 109, 250, 0.3)', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff' }}
                            itemStyle={{ color: '#7c6dfa', fontWeight: 600 }}
                            formatter={(value: any) => [`$${value}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#7c6dfa" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Omnora AI Copilot Insights Panel */}
            <div style={{ background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.8) 0%, rgba(15, 15, 20, 0.9) 100%)', border: '1px solid rgba(124, 109, 250, 0.2)', borderRadius: '16px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(124, 109, 250, 0.2)', borderRadius: '8px', color: '#7c6dfa' }}>
                        <Sparkles size={24} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Copilot Analytics Analyst</h3>
                </div>
                <p style={{ color: '#8b8ba0', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '800px' }}>
                    Leverage your local WebGPU capabilities to confidentially analyze your daily metrics without transmitting store data to third-party endpoints.
                </p>
                
                {insightStatus === 'idle' && (
                    <button 
                        onClick={handleGenerateInsights}
                        style={{
                            background: 'linear-gradient(135deg, #7c6dfa 0%, #5848c2 100%)',
                            color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px',
                            fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 12px rgba(124, 109, 250, 0.3)', transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Sparkles size={16} />
                        Generate AI Revenue Insights
                    </button>
                )}

                {insightStatus === 'initializing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#7c6dfa', fontSize: '14px', fontWeight: 500 }}>
                            <Loader2 className="spin" size={16} />
                            Booting Local Neural Network...
                        </div>
                        <span style={{ fontSize: '12px', color: '#8b8ba0', fontFamily: 'monospace' }}>{progressText.split('[')[0]}</span>
                    </div>
                )}

                {insightStatus === 'analyzing' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#7c6dfa', fontSize: '14px', fontWeight: 500 }}>
                        <Loader2 className="spin" size={16} />
                        Crunching analytical aggregates...
                    </div>
                )}

                {insightStatus === 'done' && (
                    <div style={{ background: '#14141c', border: '1px solid rgba(124, 109, 250, 0.1)', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ fontSize: '14px', color: '#e0e0e5', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                            {insights}
                        </div>
                    </div>
                )}
                
                {insightStatus === 'error' && (
                    <div style={{ color: '#ff4d6a', fontSize: '14px', padding: '16px', background: 'rgba(255, 77, 106, 0.1)', borderRadius: '8px' }}>
                        {insights}
                    </div>
                )}
            </div>
            
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}