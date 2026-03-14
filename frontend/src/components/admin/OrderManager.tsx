/**
 * OrderManager: Merchant Order Table with Fulfillment Actions
 *
 * Full data table of all orders with inline status dropdowns.
 * useSyncExternalStore for real-time reactivity.
 * Registered in BuilderRegistry as 'admin_order_manager'.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { orderStore, type Order, type OrderStatus } from '../../platform/core/OrderStore';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const A = {
    bg: '#070710',
    surface: '#0d0d18',
    card: '#111125',
    surface2: '#14142a',
    border: '#1e1e3a',
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

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: A.amber, bg: A.amberDim },
    confirmed: { label: 'Confirmed', color: A.blue, bg: A.blueDim },
    processing: { label: 'Processing', color: A.accent, bg: A.accentGlow },
    shipped: { label: 'Shipped', color: A.green, bg: A.greenDim },
    delivered: { label: 'Delivered', color: A.green, bg: A.greenDim },
    cancelled: { label: 'Cancelled', color: A.red, bg: A.redDim },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderManagerProps {
    nodeId: string;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OrderManager: React.FC<OrderManagerProps> = ({ nodeId }) => {
    const version = useSyncExternalStore(
        useCallback((cb: () => void) => orderStore.subscribe(cb), []),
        () => orderStore.getVersion(),
    );

    const allOrders = useMemo(() => orderStore.getAllOrders(), [version]);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOrders = useMemo(() => {
        let orders = allOrders;
        if (filterStatus !== 'all') {
            orders = orders.filter(o => o.status === filterStatus);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            orders = orders.filter(o =>
                o.id.toLowerCase().includes(q) ||
                o.customer.name.toLowerCase().includes(q) ||
                o.customer.email.toLowerCase().includes(q)
            );
        }
        return orders;
    }, [allOrders, filterStatus, searchQuery]);

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
                marginBottom: 20,
            }}>
                <h3 style={{
                    fontSize: 16, fontWeight: 800, margin: 0,
                    letterSpacing: '-0.02em', color: A.text,
                }}>
                    Order Management
                </h3>
                <span style={{ fontSize: 12, color: A.textMuted }}>
                    {filteredOrders.length} of {allOrders.length} orders
                </span>
            </div>

            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 16,
                padding: '12px 16px',
                background: A.card,
                border: `1px solid ${A.border}`,
                borderRadius: 12,
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '0 1 260px' }}>
                    <span style={{
                        position: 'absolute', left: 10, top: '50%',
                        transform: 'translateY(-50%)', fontSize: 13, opacity: 0.4,
                    }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 12px 8px 32px',
                            background: A.surface2, border: `1px solid ${A.border}`,
                            borderRadius: 8, color: A.text, fontSize: 12,
                            fontWeight: 500, outline: 'none', fontFamily: 'inherit',
                        }}
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as OrderStatus | 'all')}
                    style={{
                        background: A.surface2, border: `1px solid ${A.border}`,
                        borderRadius: 8, padding: '8px 12px',
                        color: A.text, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                    }}
                >
                    <option value="all">All Statuses</option>
                    {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div style={{
                background: A.card,
                border: `1px solid ${A.border}`,
                borderRadius: 14,
                overflow: 'hidden',
            }}>
                {/* Table Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 1.2fr 100px 100px 140px 60px',
                    gap: 8,
                    padding: '12px 20px',
                    borderBottom: `1px solid ${A.border}`,
                    background: A.surface2,
                }}>
                    {['Order ID', 'Customer', 'Email', 'Date', 'Total', 'Status', ''].map(h => (
                        <span key={h} style={{
                            fontSize: 10, fontWeight: 700, color: A.textMuted,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>
                            {h}
                        </span>
                    ))}
                </div>

                {/* Rows */}
                {filteredOrders.length === 0 ? (
                    <div style={{
                        padding: 40, textAlign: 'center',
                        color: A.textMuted, fontSize: 13,
                    }}>
                        {allOrders.length === 0
                            ? 'No orders yet. They will appear here once customers check out.'
                            : 'No orders match your filters.'}
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <OrderRow key={order.id} order={order} />
                    ))
                )}
            </div>
        </div>
    );
};

// ─── Order Row ────────────────────────────────────────────────────────────────

const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
    const [hov, setHov] = useState(false);
    const cfg = STATUS_CONFIG[order.status];

    const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        orderStore.updateOrderStatus(order.id, e.target.value as OrderStatus);
    }, [order.id]);

    const handleDelete = useCallback(() => {
        if (confirm(`Delete order ${order.id}? This action cannot be undone.`)) {
            orderStore.deleteOrder(order.id);
        }
    }, [order.id]);

    const date = new Date(order.createdAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 1.2fr 100px 100px 140px 60px',
                gap: 8,
                padding: '14px 20px',
                borderBottom: `1px solid ${A.border}`,
                background: hov ? A.surface2 : 'transparent',
                transition: 'background 0.1s',
                alignItems: 'center',
            }}
        >
            {/* Order ID */}
            <span style={{ fontSize: 12, fontWeight: 700, color: A.accent }}>
                {order.id}
            </span>

            {/* Customer Name */}
            <span style={{
                fontSize: 12, fontWeight: 600, color: A.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {order.customer.name}
            </span>

            {/* Email */}
            <span style={{
                fontSize: 12, color: A.textDim,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {order.customer.email}
            </span>

            {/* Date */}
            <span style={{ fontSize: 11, color: A.textMuted }}>
                {dateStr}
            </span>

            {/* Total */}
            <span style={{ fontSize: 13, fontWeight: 700, color: A.text }}>
                ${order.total.toFixed(2)}
            </span>

            {/* Status Dropdown */}
            <select
                value={order.status}
                onChange={handleStatusChange}
                style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.color}30`,
                    borderRadius: 6,
                    padding: '5px 8px',
                    color: cfg.color,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
            >
                {ALL_STATUSES.map(s => (
                    <option key={s} value={s} style={{ background: A.card, color: A.text }}>
                        {STATUS_CONFIG[s].label}
                    </option>
                ))}
            </select>

            {/* Delete */}
            <button
                onClick={handleDelete}
                title="Delete order"
                style={{
                    background: hov ? A.redDim : 'transparent',
                    border: 'none', borderRadius: 6,
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: hov ? A.red : 'transparent',
                    fontSize: 12, transition: 'all 0.12s',
                }}
            >
                🗑
            </button>
        </div>
    );
};

export default OrderManager;
