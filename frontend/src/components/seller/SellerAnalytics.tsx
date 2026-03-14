import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
    TrendingUp,
    BarChart2,
    MousePointer2,
    Target,
    Save,
    Activity,
    Users,
    Zap
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import './SellerAnalytics.css';

const mockChartData = [
    { name: 'Mon', views: 400, conv: 240 },
    { name: 'Tue', views: 300, conv: 139 },
    { name: 'Wed', views: 200, conv: 980 },
    { name: 'Thu', views: 278, conv: 390 },
    { name: 'Fri', views: 189, conv: 480 },
    { name: 'Sat', views: 239, conv: 380 },
    { name: 'Sun', views: 349, conv: 430 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--accent-gold)',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#fff'
            }}>
                <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '4px' }}>{label}</p>
                <p style={{ margin: 0 }}>{`VIEWS: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const EmptyState = ({ title, message }: { title: string, message: string }) => (
    <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--db-border)', borderRadius: '8px' }}>
        <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(var(--accent-gold-rgb), 0.1)',
            color: 'var(--accent-gold)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
        }}>
            <TrendingUp size={32} />
        </div>
        <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{title}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 1.5rem' }}>{message}</p>
        <button className="btn-luxury highlight-btn" style={{ borderRadius: '8px', padding: '0.75rem 1.5rem', fontSize: '0.75rem' }}>
            GENERATE FIRST SALE
        </button>
    </div>
);

export default function SellerAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [config, setConfig] = useState({ targetMonthlySales: 10000 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await client.get('/cms/performance-hub');
                if (data.success) {
                    setStats(data.stats);
                    setConfig(data.config);
                }
            } catch (err) {
                console.error('Failed to load performance data');
            } finally {
                // Shimmer visibility sync
                setTimeout(() => setLoading(false), 800);
            }
        };
        fetchData();
    }, []);

    const saveTargets = async () => {
        setSaving(true);
        try {
            await client.post('/cms/performance-hub/targets', config);
            alert('PERFORMANCE SYNC: Targets updated in DRAFT state.');
        } catch (err) {
            alert('Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="performance-hub animate-fade-in">
            <div className="analytics-kpi-grid">
                {[1, 2, 3].map(i => (
                    <div key={i} className="kpi-card skeleton-tile" style={{ height: '100px' }}></div>
                ))}
            </div>
            <div className="chart-panel panel skeleton-tile" style={{ height: '350px', marginBottom: '1.5rem' }}></div>
            <div className="hub-main-grid">
                <div className="panel skeleton-tile" style={{ height: '280px' }}></div>
                <div className="panel skeleton-tile" style={{ height: '280px' }}></div>
            </div>
        </div>
    );

    const hasEvents = stats?.recentEvents && stats.recentEvents.length > 0;

    return (
        <div className="performance-hub animate-fade-in" style={{ fontFamily: "var(--font-sans)" }}>
            <div className="section-header">
                <div>
                    <h2 style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>PERFORMANCE HUB</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Business-grade analytics and strategic forecasting</p>
                </div>
                <div className="hub-status-badge" style={{ borderRadius: '100px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--db-border)' }}>
                    <Activity size={14} className="text-gold" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>SECURE DATA LINK ACTIVE</span>
                </div>
            </div>

            <div className="analytics-kpi-grid">
                <div className="kpi-card" style={{ borderRadius: '8px' }}>
                    <div className="kpi-icon gold" style={{ borderRadius: '8px' }}><Users size={24} /></div>
                    <div className="kpi-data">
                        <span className="label">CLIENT VISITS</span>
                        <div className="value-group">
                            <span className="value data-monospace" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.05em' }}>{stats?.views || 0}</span>
                            <span className="trend positive" style={{ fontSize: '0.7rem', fontWeight: 900 }}>+12%</span>
                        </div>
                    </div>
                </div>
                <div className="kpi-card" style={{ borderRadius: '8px' }}>
                    <div className="kpi-icon" style={{ borderRadius: '8px', color: '#E5E4E2', background: 'rgba(255,255,255,0.03)' }}><Zap size={24} /></div>
                    <div className="kpi-data">
                        <span className="label">INTERACTIONS</span>
                        <div className="value-group">
                            <span className="value data-monospace" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.05em' }}>{stats?.clicks || 0}</span>
                        </div>
                    </div>
                </div>
                <div className="kpi-card" style={{ borderRadius: '8px' }}>
                    <div className="kpi-icon" style={{ borderRadius: '8px', color: '#C5A059', background: 'rgba(197, 160, 89, 0.05)' }}><Target size={24} /></div>
                    <div className="kpi-data">
                        <span className="label">CONVERSION RATIO</span>
                        <div className="value-group">
                            <span className="value data-monospace" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.05em' }}>{((stats?.conversions || 0) / (stats?.views || 1) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="chart-panel panel" style={{ borderRadius: '8px', marginBottom: '1.5rem', height: '350px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--db-border)' }}>
                <div className="panel-header" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>VISIT DENSITY (WEEKLY TREND)</h3>
                    <TrendingUp size={16} style={{ opacity: 0.3 }} />
                </div>
                <div style={{ width: '100%', height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="views"
                                stroke="var(--accent-gold)"
                                strokeWidth={3}
                                dot={{ fill: 'var(--accent-gold)', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="hub-main-grid">
                <div className="panel configuration-panel" style={{ borderRadius: '8px', border: '1px solid var(--db-border)' }}>
                    <div className="panel-header">
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800 }}><Target size={16} /> REVENUE FORECASTING</h3>
                        <span className="draft-badge">DRAFT</span>
                    </div>
                    <div className="builder-input-group">
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MONTHLY REVENUE TARGET (PKR)</label>
                        <input
                            type="number"
                            value={config.targetMonthlySales}
                            onChange={(e) => setConfig({ ...config, targetMonthlySales: parseInt(e.target.value) })}
                            className="builder-input"
                            style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                        />
                        <p className="helper-text" style={{ fontSize: '0.65rem', marginTop: '0.4rem' }}>Establish your monthly revenue benchmark for strategic tracking.</p>
                    </div>
                    <button
                        className="btn-luxury highlight-btn"
                        onClick={saveTargets}
                        disabled={saving}
                        style={{ borderRadius: '8px', padding: '1rem', width: '100%', fontWeight: 900 }}
                    >
                        {saving ? 'SYNCING...' : <><Save size={16} /> SAVE PERFORMANCE TARGETS</>}
                    </button>
                </div>

                <div className="panel stream-panel" style={{ borderRadius: '8px', border: '1px solid var(--db-border)' }}>
                    <div className="panel-header">
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800 }}><Activity size={16} /> REAL-TIME EVENT STREAM</h3>
                    </div>
                    <div className="event-stream">
                        {hasEvents ? (
                            stats.recentEvents.map((event: any, idx: number) => (
                                <div key={idx} className="event-item" style={{ borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                                    <span className="event-time data-monospace" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{new Date(event.createdAt).toLocaleTimeString()}</span>
                                    <span className="event-type" style={{ fontWeight: 800 }}>{(event.type || 'unknown').replace('_', ' ').toUpperCase()}</span>
                                    <span className="event-path" style={{ opacity: 0.5 }}>{event.path || '/'}</span>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                title="No Data Detected"
                                message="Your digital territory currently has no detectable client activity. Launch a campaign to hydrate this stream."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
