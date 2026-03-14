/**
 * AdminDashboard: Merchant Control Center (Metrics Block)
 *
 * Reads OrderStore via useSyncExternalStore for real-time metrics.
 * Displays revenue, order count, status breakdown, and recent orders.
 * Registered in BuilderRegistry as 'admin_dashboard'.
 */
import React, { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { orderStore, type Order, type OrderStatus } from '../../platform/core/OrderStore';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const A = {
    bg: '#070710',
    surface: '#0d0d18',
    surface2: '#14142a',
    card: '#111125',
    border: '#1e1e3a',
    borderHov: '#2a2a50',
    accent: '#7c6dfa',
    accentGlow: 'rgba(124,109,250,0.15)',
    green: '#34d399',
    greenDim: 'rgba(52,211,153,0.1)',
    amber: '#fbbf24',
    amberDim: 'rgba(251,191,36,0.1)',
    blue: '#60a5fa',
    blueDim: 'rgba(96,165,250,0.1)',
    red: '#f87171',
    redDim: 'rgba(248,113,113,0.1)',
    text: '#e8e8f0',
    textDim: '#8888a8',
    textMuted: '#555570',
};

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: A.amber, bg: A.amberDim },
    confirmed: { label: 'Confirmed', color: A.blue, bg: A.blueDim },
    processing: { label: 'Processing', color: A.accent, bg: A.accentGlow },
    shipped: { label: 'Shipped', color: A.green, bg: A.greenDim },
    delivered: { label: 'Delivered', color: A.green, bg: A.greenDim },
    cancelled: { label: 'Cancelled', color: A.red, bg: A.redDim },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AdminDashboardProps {
    nodeId: string;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ nodeId }) => {
    // Reactive subscription
    const version = useSyncExternalStore(
        useCallback((cb: () => void) => orderStore.subscribe(cb), []),
        () => orderStore.getVersion(),
    );

    const metrics = useMemo(() => ({
        totalRevenue: orderStore.getTotalRevenue(),
        totalOrders: orderStore.getOrderCount(),
        pending: orderStore.getOrdersByStatus('pending').length + orderStore.getOrdersByStatus('confirmed').length,
        processing: orderStore.getOrdersByStatus('processing').length,
        shipped: orderStore.getOrdersByStatus('shipped').length,
        delivered: orderStore.getOrdersByStatus('delivered').length,
        recentOrders: orderStore.getRecentOrders(5),
    }), [version]);

    const avgOrderValue = metrics.totalOrders > 0
        ? Math.round((metrics.totalRevenue / metrics.totalOrders) * 100) / 100
        : 0;

    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                color: A.text,
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24,
            }}>
                <div>
                    <h2 style={{
                        fontSize: 22, fontWeight: 800, margin: '0 0 4px',
                        letterSpacing: '-0.03em', color: A.text,
                    }}>
                        Dashboard
                    </h2>
                    <p style={{ fontSize: 12, color: A.textMuted, margin: 0 }}>
                        Merchant Control Center
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: A.greenDim, borderRadius: 8,
                    padding: '6px 12px',
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: A.green }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: A.green }}>Live</span>
                </div>
            </div>

            {/* Metrics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                marginBottom: 24,
            }}>
                <MetricCard
                    label="Total Revenue"
                    value={`$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    accent={A.green}
                    accentBg={A.greenDim}
                    icon="💰"
                />
                <MetricCard
                    label="Total Orders"
                    value={String(metrics.totalOrders)}
                    accent={A.accent}
                    accentBg={A.accentGlow}
                    icon="📦"
                />
                <MetricCard
                    label="Avg Order Value"
                    value={`$${avgOrderValue.toFixed(2)}`}
                    accent={A.blue}
                    accentBg={A.blueDim}
                    icon="📊"
                />
                <MetricCard
                    label="Pending / In Progress"
                    value={`${metrics.pending + metrics.processing}`}
                    accent={A.amber}
                    accentBg={A.amberDim}
                    icon="⏳"
                />
            </div>

            {/* Status Breakdown */}
            <div style={{
                background: A.card, border: `1px solid ${A.border}`,
                borderRadius: 14, padding: '18px 20px',
                marginBottom: 24,
            }}>
                <span style={{
                    fontSize: 11, fontWeight: 700, color: A.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    display: 'block', marginBottom: 14,
                }}>
                    Fulfillment Pipeline
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(status => {
                        const count = orderStore.getOrdersByStatus(status).length;
                        const cfg = STATUS_CONFIG[status];
                        return (
                            <div key={status} style={{
                                flex: 1, textAlign: 'center',
                                background: cfg.bg, borderRadius: 10,
                                padding: '12px 8px',
                                border: `1px solid transparent`,
                                transition: 'border-color 0.15s',
                            }}>
                                <span style={{
                                    fontSize: 20, fontWeight: 800, color: cfg.color,
                                    display: 'block', marginBottom: 4,
                                }}>
                                    {count}
                                </span>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, color: cfg.color,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    opacity: 0.8,
                                }}>
                                    {cfg.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Orders */}
            <div style={{
                background: A.card, border: `1px solid ${A.border}`,
                borderRadius: 14, overflow: 'hidden',
            }}>
                <div style={{
                    padding: '16px 20px', borderBottom: `1px solid ${A.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: A.text }}>Recent Orders</span>
                    <span style={{ fontSize: 11, color: A.textMuted }}>Last {metrics.recentOrders.length}</span>
                </div>
                {metrics.recentOrders.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: A.textMuted, fontSize: 13 }}>
                        No orders yet. They will appear here once customers check out.
                    </div>
                ) : (
                    <div>
                        {metrics.recentOrders.map(order => (
                            <RecentOrderRow key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricCard: React.FC<{
    label: string; value: string; accent: string; accentBg: string; icon: string;
}> = ({ label, value, accent, accentBg, icon }) => (
    <div style={{
        background: A.card, border: `1px solid ${A.border}`,
        borderRadius: 12, padding: '18px 16px',
        transition: 'border-color 0.15s',
    }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        }}>
            <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
            }}>
                {icon}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, letterSpacing: '0.02em' }}>
                {label}
            </span>
        </div>
        <span style={{
            fontSize: 22, fontWeight: 800, color: accent,
            letterSpacing: '-0.03em',
        }}>
            {value}
        </span>
    </div>
);

const RecentOrderRow: React.FC<{ order: Order }> = ({ order }) => {
    const cfg = STATUS_CONFIG[order.status];
    const date = new Date(order.createdAt);
    const timeAgo = getTimeAgo(date);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 20px',
            borderBottom: `1px solid ${A.border}`,
            transition: 'background 0.1s',
        }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: A.accent, width: 80, flexShrink: 0 }}>
                {order.id}
            </span>
            <span style={{
                flex: 1, fontSize: 12, color: A.textDim,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {order.customer.email}
            </span>
            <span style={{ fontSize: 12, color: A.textMuted, width: 70, textAlign: 'right', flexShrink: 0 }}>
                {timeAgo}
            </span>
            <span style={{
                fontSize: 13, fontWeight: 700, color: A.text, width: 80, textAlign: 'right', flexShrink: 0,
            }}>
                ${order.total.toFixed(2)}
            </span>
            <span style={{
                fontSize: 10, fontWeight: 700, color: cfg.color,
                background: cfg.bg, borderRadius: 6,
                padding: '3px 10px', textTransform: 'uppercase',
                letterSpacing: '0.06em', flexShrink: 0,
            }}>
                {cfg.label}
            </span>
        </div>
    );
};

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default AdminDashboard;
