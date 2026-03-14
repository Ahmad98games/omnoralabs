import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Overview { totalRevenue: number; revenue30: number; revenue7: number; totalOrders: number; orders30: number; aov: number; conversionRate: number; }
interface ChartPoint { date: string; revenue: number; orders: number; }
interface TopProduct { name: string; revenue: number; unitsSold: number; image?: string; }
interface CustomerInsights { totalCustomers: number; repeatCustomers: number; repeatRate: number; topCustomers: any[]; }

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
    wrap: { padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 } as React.CSSProperties,
    kpi: { background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 24px' } as React.CSSProperties,
    kpiLabel: { fontSize: 11, color: '#6B7280', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 },
    kpiValue: { fontSize: 28, fontWeight: 800, color: '#E8ECF1', lineHeight: 1 } as React.CSSProperties,
    kpiSub: { fontSize: 12, color: '#4B5563', marginTop: 6 } as React.CSSProperties,
    card: { background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 20 } as React.CSSProperties,
    cardTitle: { fontSize: 14, fontWeight: 700, color: '#9AA4B2', marginBottom: 18 } as React.CSSProperties,
    tab: (active: boolean): React.CSSProperties => ({ padding: '8px 18px', borderRadius: 8, border: `1px solid ${active ? '#7c6dfa55' : 'rgba(255,255,255,0.06)'}`, background: active ? 'rgba(124,109,250,0.15)' : 'none', color: active ? '#a78bfa' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer' }),
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as React.CSSProperties,
    tag: (color: string): React.CSSProperties => ({ background: color + '22', color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }),
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────

const MiniBarChart: React.FC<{ data: ChartPoint[]; height?: number }> = ({ data, height = 120 }) => {
    if (!data.length) return null;
    const max = Math.max(...data.map(d => d.revenue), 1);
    const BAR_W = Math.max(4, Math.floor(600 / data.length) - 3);

    return (
        <div style={{ overflowX: 'auto' }}>
            <svg width={Math.max(600, data.length * (BAR_W + 3))} height={height + 32} style={{ display: 'block' }}>
                {data.map((d, i) => {
                    const barH = Math.max(2, (d.revenue / max) * height);
                    const x = i * (BAR_W + 3);
                    const y = height - barH;
                    return (
                        <g key={d.date}>
                            <rect x={x} y={y} width={BAR_W} height={barH} fill="url(#grad)" rx={2} opacity={0.85}>
                                <title>{d.date}: PKR {d.revenue.toLocaleString()} ({d.orders} orders)</title>
                            </rect>
                            {i % Math.ceil(data.length / 6) === 0 && (
                                <text x={x + BAR_W / 2} y={height + 20} textAnchor="middle" fill="#4B5563" fontSize={9}>
                                    {d.date.slice(5)}
                                </text>
                            )}
                        </g>
                    );
                })}
                <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c6dfa" />
                        <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

// ─── KPI card ─────────────────────────────────────────────────────────────────

const KPICard: React.FC<{ label: string; value: string; sub?: string; accent?: string }> = ({ label, value, sub, accent = '#7c6dfa' }) => (
    <div style={{ ...S.kpi, borderLeft: `3px solid ${accent}` }}>
        <div style={S.kpiLabel}>{label}</div>
        <div style={{ ...S.kpiValue, color: accent === '#7c6dfa' ? '#E8ECF1' : accent }}>{value}</div>
        {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SellerAnalyticsDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'products' | 'customers'>('overview');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [chart, setChart] = useState<ChartPoint[]>([]);
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [customers, setCustomers] = useState<CustomerInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartDays, setChartDays] = useState(30);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, ch, pr, cu] = await Promise.all([
                apiClient.get('/seller-analytics/overview'),
                apiClient.get(`/seller-analytics/revenue?days=${chartDays}`),
                apiClient.get('/seller-analytics/products?limit=10'),
                apiClient.get('/seller-analytics/customers'),
            ]);
            setOverview(ov.data);
            setChart(ch.data);
            setProducts(pr.data);
            setCustomers(cu.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [chartDays]);

    useEffect(() => { load(); }, [load]);

    const fmt = (n: number) => n >= 1000 ? `PKR ${(n / 1000).toFixed(1)}K` : `PKR ${n}`;

    if (loading) return (
        <div style={{ ...S.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ color: '#6B7280', fontSize: 14 }}>Loading analytics…</div>
        </div>
    );

    return (
        <div style={S.wrap}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8ECF1', margin: 0 }}>Analytics</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>Your store performance at a glance</p>
                </div>
                <button onClick={load} style={{ padding: '8px 16px', background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>↺ Refresh</button>
            </div>

            {/* KPI Grid */}
            {overview && (
                <div style={S.grid}>
                    <KPICard label="Total Revenue" value={fmt(overview.totalRevenue)} sub="All time" accent="#7c6dfa" />
                    <KPICard label="Last 30 Days" value={fmt(overview.revenue30)} sub={`${overview.orders30} orders`} accent="#3b82f6" />
                    <KPICard label="Last 7 Days" value={fmt(overview.revenue7)} accent="#06b6d4" />
                    <KPICard label="Avg. Order Value" value={`PKR ${overview.aov}`} sub="Last 30 days" accent="#8b5cf6" />
                    <KPICard label="Conversion Rate" value={`${overview.conversionRate}%`} sub="Delivered / Total orders" accent={overview.conversionRate >= 70 ? '#4ade80' : overview.conversionRate >= 40 ? '#fbbf24' : '#f87171'} />
                    <KPICard label="Total Orders" value={overview.totalOrders.toLocaleString()} accent="#f59e0b" />
                </div>
            )}

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['overview', 'revenue', 'products', 'customers'] as const).map(t => (
                    <button key={t} style={S.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* Revenue chart */}
            {activeTab === 'revenue' && (
                <div style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={S.cardTitle}>Revenue Trend</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[7, 14, 30, 90].map(d => (
                                <button key={d} onClick={() => setChartDays(d)}
                                    style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: chartDays === d ? '#7c6dfa' : 'transparent', border: `1px solid ${chartDays === d ? '#7c6dfa' : 'rgba(255,255,255,0.1)'}`, color: chartDays === d ? '#fff' : '#6B7280' }}>
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <MiniBarChart data={chart} height={140} />
                </div>
            )}

            {/* Top products */}
            {activeTab === 'products' && (
                <div style={S.card}>
                    <div style={S.cardTitle}>Top Products — Last 30 Days</div>
                    {products.length === 0 && <p style={{ color: '#4B5563', fontSize: 13 }}>No sales data yet</p>}
                    {products.map((p, i) => (
                        <div key={i} style={S.row}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9AA4B2', fontWeight: 800 }}>{i + 1}</span>
                                <div>
                                    <div style={{ fontSize: 13, color: '#E8ECF1', fontWeight: 600 }}>{p.name}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{p.unitsSold} units sold</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>PKR {p.revenue.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Customers */}
            {activeTab === 'customers' && customers && (
                <>
                    <div style={S.grid}>
                        <KPICard label="Total Customers" value={customers.totalCustomers.toString()} accent="#7c6dfa" />
                        <KPICard label="Repeat Customers" value={customers.repeatCustomers.toString()} accent="#4ade80" />
                        <KPICard label="Repeat Rate" value={`${customers.repeatRate}%`} sub="Customers who bought 2+" accent={customers.repeatRate >= 30 ? '#4ade80' : '#fbbf24'} />
                    </div>
                    <div style={S.card}>
                        <div style={S.cardTitle}>Top Customers</div>
                        {customers.topCustomers.map((c, i) => (
                            <div key={i} style={S.row}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#E8ECF1', fontWeight: 600 }}>{c.name || c.phone}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{c.orders} orders</div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>PKR {c.revenue.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerAnalyticsDashboard;
