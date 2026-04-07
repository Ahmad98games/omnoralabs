/**
 * OmnoraOrderCommand — Shopify-grade order management.
 *
 * Features:
 *  - Kanban board: Pending → Paid → Processing → Shipped → Delivered / Cancelled
 *  - Order detail drawer with line items, customer info, fulfillment timeline
 *  - Quick status transitions with optimistic updates
 *  - Search + filter by status, date range, revenue
 *  - Print invoice + WhatsApp share (existing InvoiceGenerator util)
 *  - Revenue summary strip above the board
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, Loader2, Printer, MessageCircle,
    Clock, Zap, Truck, CheckCircle2, XCircle,
    DollarSign, ShoppingBag, TrendingUp, User,
    ChevronRight, X, RefreshCw,
} from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { shareInvoiceToWhatsApp } from '../../utils/InvoiceGenerator';
import { PrintView } from './PrintView';
import type { Order } from '../../platform/core/DatabaseTypes';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
    accent:  '#7c6dfa',
    success: '#10b981',
    warn:    '#f59e0b',
    info:    '#06b6d4',
    danger:  '#f43f5e',
    purple:  '#8b5cf6',
    border:  'rgba(255,255,255,0.08)',
    surface: 'rgba(255,255,255,0.03)',
    over:    'rgba(255,255,255,0.06)',
    deep:    '#050509',
    card:    '#0d0d14',
    text:    '#f1f5f9',
    muted:   'rgba(255,255,255,0.45)',
};

// ─── Status config ────────────────────────────────────────────────────────────
type OrderStatus = Order['status'];

interface StatusConfig {
    label: string;
    color: string;
    bg: string;
    Icon: React.ElementType;
    next: OrderStatus | null;
    nextLabel?: string;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
    PENDING:   { label: 'Pending',   color: C.warn,    bg: `${C.warn}14`,    Icon: Clock,        next: 'PAID',      nextLabel: 'Mark Paid'      },
    PAID:      { label: 'Paid',      color: C.accent,  bg: `${C.accent}14`,  Icon: Zap,          next: 'SHIPPED',   nextLabel: 'Mark Shipped'   },
    SHIPPED:   { label: 'Shipped',   color: C.info,    bg: `${C.info}14`,    Icon: Truck,        next: 'DELIVERED', nextLabel: 'Mark Delivered' },
    DELIVERED: { label: 'Delivered', color: C.success, bg: `${C.success}14`, Icon: CheckCircle2, next: null                                     },
    CANCELLED: { label: 'Cancelled', color: C.danger,  bg: `${C.danger}14`,  Icon: XCircle,      next: null                                     },
};

const KANBAN_COLUMNS: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(n: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

function fmtDate(s: string) {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(s: string): string {
    const diff = (Date.now() - new Date(s).getTime()) / 1000;
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
    const { label, color, bg, Icon } = STATUS_CONFIG[status];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
            color, background: bg, borderRadius: 5, padding: '3px 8px',
        }}>
            <Icon size={10} /> {label}
        </span>
    );
}

function KPIBar({ orders }: { orders: Order[] }) {
    const total     = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const today     = orders.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    });
    const todayRev  = today.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const pending   = orders.filter(o => o.status === 'PENDING').length;
    const aov       = orders.length ? total / orders.length : 0;

    const kpis = [
        { label: 'Total Revenue', value: fmtCurrency(total),        Icon: DollarSign,  color: C.accent  },
        { label: "Today's Sales", value: fmtCurrency(todayRev),     Icon: TrendingUp,  color: C.success },
        { label: 'Total Orders',  value: orders.length.toString(),  Icon: ShoppingBag, color: C.purple  },
        { label: 'Pending',       value: pending.toString(),         Icon: Clock,       color: C.warn    },
        { label: 'Avg Order',     value: fmtCurrency(aov),          Icon: TrendingUp,  color: C.info    },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            {kpis.map(k => (
                <div key={k.label} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${k.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <k.Icon size={15} color={k.color} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>{k.value}</p>
                        <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
    order, onOpen, onAdvance, advancing,
}: {
    order: Order;
    onOpen: () => void;
    onAdvance: () => void;
    advancing: boolean;
}) {
    const cfg = STATUS_CONFIG[order.status];
    const items = (order.items || []) as { title?: string; quantity?: number; price?: number }[];

    return (
        <div
            onClick={onOpen}
            style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: 14, cursor: 'pointer',
                transition: 'all 0.15s', marginBottom: 8,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>#{order.id.slice(-6).toUpperCase()}</span>
                <StatusBadge status={order.status} />
            </div>

            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.text }}>{order.customerName}</p>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: C.muted }}>{order.customerEmail}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.accent }}>{fmtCurrency(order.totalAmount, order.currency)}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(order.createdAt)}</span>
            </div>

            {items.length > 0 && (
                <p style={{ margin: '0 0 10px', fontSize: 11, color: C.muted }}>
                    {items.slice(0, 2).map(i => i.title || 'Item').join(', ')}
                    {items.length > 2 && ` +${items.length - 2} more`}
                </p>
            )}

            {cfg.next && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onAdvance(); }}
                    disabled={advancing}
                    style={{
                        width: '100%', padding: '7px 0',
                        background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`,
                        borderRadius: 6, cursor: advancing ? 'not-allowed' : 'pointer',
                        color: cfg.color, fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}
                >
                    {advancing ? <Loader2 size={11} className="animate-spin" /> : <ChevronRight size={11} />}
                    {cfg.nextLabel}
                </button>
            )}
        </div>
    );
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────

function OrderDrawer({
    order, onClose, onUpdateStatus,
}: {
    order: Order;
    onClose: () => void;
    onUpdateStatus: (status: OrderStatus) => Promise<void>;
}) {
    const [updating, setUpdating] = useState(false);
    const [printOrder, setPrintOrder] = useState<Order | null>(null);
    const cfg = STATUS_CONFIG[order.status];
    const items = (order.items || []) as { id?: string; title?: string; quantity?: number; price?: number; image?: string }[];

    const timeline: { status: OrderStatus; done: boolean }[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'].map(s => ({
        status: s as OrderStatus,
        done: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'].indexOf(order.status) >= ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'].indexOf(s),
    }));

    const advance = async () => {
        if (!cfg.next) return;
        setUpdating(true);
        try { await onUpdateStatus(cfg.next); }
        finally { setUpdating(false); }
    };

    useEffect(() => {
        if (printOrder) {
            setTimeout(() => { window.print(); setPrintOrder(null); }, 300);
        }
    }, [printOrder]);

    return (
        <>
            {printOrder && <PrintView order={printOrder} />}
            <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
                <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} />
                <div style={{
                    position: 'relative', zIndex: 1,
                    width: 560, maxWidth: '100vw', height: '100vh',
                    background: C.deep, borderLeft: `1px solid ${C.border}`,
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                                    Order #{order.id.slice(-6).toUpperCase()}
                                </h3>
                                <StatusBadge status={order.status} />
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{fmtDate(order.createdAt)}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={() => setPrintOrder(order)}
                                style={{ padding: '7px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <Printer size={13} /> Invoice
                            </button>
                            <button type="button" onClick={() => shareInvoiceToWhatsApp(order.customerName, order)}
                                style={{ padding: '7px 12px', background: `${C.success}14`, border: `1px solid ${C.success}40`, borderRadius: 7, cursor: 'pointer', color: C.success, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <MessageCircle size={13} /> WhatsApp
                            </button>
                            <button type="button" onClick={onClose}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

                        {/* Fulfillment timeline */}
                        {order.status !== 'CANCELLED' && (
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Fulfillment Progress</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                    {timeline.map((step, i) => {
                                        const stepCfg = STATUS_CONFIG[step.status];
                                        const StepIcon = stepCfg.Icon;
                                        return (
                                            <React.Fragment key={step.status}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: '50%',
                                                        background: step.done ? stepCfg.color : C.surface,
                                                        border: `2px solid ${step.done ? stepCfg.color : C.border}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.3s',
                                                    }}>
                                                        <StepIcon size={14} color={step.done ? '#fff' : C.muted} />
                                                    </div>
                                                    <span style={{ fontSize: 9, color: step.done ? stepCfg.color : C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>{stepCfg.label}</span>
                                                </div>
                                                {i < timeline.length - 1 && (
                                                    <div style={{ flex: 1, height: 2, background: timeline[i + 1].done ? C.success : C.border, marginBottom: 16, transition: 'background 0.3s' }} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Customer */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, margin: '0 0 12px' }}>Customer</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${C.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={18} color={C.accent} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{order.customerName}</p>
                                    <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{order.customerEmail}</p>
                                </div>
                            </div>
                        </div>

                        {/* Line items */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, margin: '0 0 12px' }}>Items ({items.length})</p>
                            {items.map((item, i) => (
                                <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {item.image && <img src={item.image} alt={item.title || ''} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />}
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{item.title || 'Product'}</p>
                                            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Qty: {item.quantity || 1}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
                                        {fmtCurrency((item.price || 0) * (item.quantity || 1), order.currency)}
                                    </span>
                                </div>
                            ))}
                            {/* Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span>
                                <span style={{ fontSize: 16, fontWeight: 900, color: C.accent }}>{fmtCurrency(order.totalAmount, order.currency)}</span>
                            </div>
                        </div>

                        {/* Status actions */}
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <div style={{ display: 'flex', gap: 10 }}>
                                {cfg.next && (
                                    <button type="button" onClick={advance} disabled={updating}
                                        style={{
                                            flex: 1, padding: '12px 0',
                                            background: cfg.color, border: 'none',
                                            borderRadius: 8, cursor: updating ? 'not-allowed' : 'pointer',
                                            color: '#fff', fontSize: 13, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        }}>
                                        {updating ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                                        {cfg.nextLabel}
                                    </button>
                                )}
                                <button type="button"
                                    onClick={async () => { setUpdating(true); try { await onUpdateStatus('CANCELLED'); } finally { setUpdating(false); } }}
                                    disabled={updating}
                                    style={{
                                        padding: '12px 18px', background: `${C.danger}14`,
                                        border: `1px solid ${C.danger}40`, borderRadius: 8,
                                        cursor: 'pointer', color: C.danger, fontSize: 12,
                                    }}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const OmnoraOrderCommand: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [orders, setOrders]         = useState<Order[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [advancingId, setAdv]       = useState<string | null>(null);
    const [openOrder, setOpenOrder]   = useState<Order | null>(null);
    const [view, setView]             = useState<'kanban' | 'list'>('kanban');

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await databaseClient.getOrders(user.id);
            setOrders(data);
        } catch { showToast('Failed to load orders', 'error'); }
        finally { setLoading(false); }
    }, [user, showToast]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        if (!search) return orders;
        const q = search.toLowerCase();
        return orders.filter(o =>
            o.customerName?.toLowerCase().includes(q) ||
            o.customerEmail?.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q)
        );
    }, [orders, search]);

    const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
        setAdv(orderId);
        try {
            await databaseClient.updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (openOrder?.id === orderId) setOpenOrder(prev => prev ? { ...prev, status: newStatus } : null);
            showToast(`Order marked as ${STATUS_CONFIG[newStatus].label}`, 'success');
        } catch { showToast('Status update failed', 'error'); }
        finally { setAdv(null); }
    };

    const groupedOrders = useMemo(() =>
        KANBAN_COLUMNS.reduce<Record<OrderStatus, Order[]>>((acc, col) => ({
            ...acc,
            [col]: filtered.filter(o => o.status === col),
        }), {} as Record<OrderStatus, Order[]>),
    [filtered]);

    return (
        <div style={{ padding: 24, background: C.deep, minHeight: '100%', fontFamily: 'Inter,sans-serif', color: C.text }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>Order Command</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{orders.length} orders total</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search orders…"
                            style={{ padding: '8px 12px 8px 32px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, outline: 'none', width: 220 }} />
                    </div>
                    <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                        {[{ v: 'kanban', label: '⬛ Kanban' }, { v: 'list', label: '≡ List' }].map(({ v, label }) => (
                            <button key={v} type="button" onClick={() => setView(v as 'kanban' | 'list')}
                                style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: view === v ? C.accent : 'transparent', color: view === v ? '#fff' : C.muted }}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={load} style={{ padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <KPIBar orders={orders} />

            {/* Main content */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: C.muted }}>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading orders…</span>
                </div>
            ) : view === 'kanban' ? (
                /* Kanban Board */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 12, overflowX: 'auto' }}>
                    {KANBAN_COLUMNS.map(col => {
                        const cfg = STATUS_CONFIG[col];
                        const colOrders = groupedOrders[col] || [];
                        return (
                            <div key={col} style={{ minWidth: 220 }}>
                                {/* Column header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <cfg.Icon size={13} color={cfg.color} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 7px' }}>
                                        {colOrders.length}
                                    </span>
                                </div>
                                {/* Cards */}
                                <div style={{ minHeight: 100 }}>
                                    {colOrders.length === 0 ? (
                                        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 10, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 11, color: C.muted }}>Empty</span>
                                        </div>
                                    ) : colOrders.map(order => (
                                        <OrderCard
                                            key={order.id} order={order}
                                            onOpen={() => setOpenOrder(order)}
                                            onAdvance={() => handleUpdateStatus(order.id, cfg.next!)}
                                            advancing={advancingId === order.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List view */
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 120px 120px',
                        gap: 16, padding: '10px 16px',
                        background: C.surface, fontSize: 10, fontWeight: 700,
                        color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                        <span>Customer</span><span>Date</span><span>Items</span>
                        <span>Amount</span><span>Status</span><span>Action</span>
                    </div>
                    {filtered.map((o, i) => {
                        const cfg = STATUS_CONFIG[o.status];
                        const items = (o.items || []) as { id?: string }[];
                        return (
                            <div key={o.id} onClick={() => setOpenOrder(o)} style={{
                                display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 120px 120px',
                                gap: 16, padding: '12px 16px', alignItems: 'center',
                                background: i % 2 === 0 ? 'transparent' : C.surface,
                                borderTop: `1px solid ${C.border}`,
                                cursor: 'pointer',
                            }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{o.customerName}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>#{o.id.slice(-6).toUpperCase()}</p>
                                </div>
                                <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(o.createdAt)}</span>
                                <span style={{ fontSize: 12, color: C.muted }}>{items.length} items</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{fmtCurrency(o.totalAmount, o.currency)}</span>
                                <StatusBadge status={o.status} />
                                {cfg.next ? (
                                    <button type="button" onClick={e => { e.stopPropagation(); handleUpdateStatus(o.id, cfg.next!); }}
                                        disabled={advancingId === o.id}
                                        style={{ padding: '5px 10px', background: `${cfg.color}14`, border: `1px solid ${cfg.color}40`, borderRadius: 6, cursor: 'pointer', color: cfg.color, fontSize: 11, fontWeight: 700 }}>
                                        {advancingId === o.id ? '…' : cfg.nextLabel}
                                    </button>
                                ) : <span />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Order Detail Drawer */}
            {openOrder && (
                <OrderDrawer
                    order={openOrder}
                    onClose={() => setOpenOrder(null)}
                    onUpdateStatus={status => handleUpdateStatus(openOrder.id, status)}
                />
            )}
        </div>
    );
};

export default OmnoraOrderCommand;