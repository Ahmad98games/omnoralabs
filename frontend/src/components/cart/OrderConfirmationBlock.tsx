/**
 * OrderConfirmationBlock: Thank-You Receipt View
 *
 * Reads orderId from URL hash or custom event, looks up the order
 * in OrderStore, and displays a styled receipt.
 * Registered in BuilderRegistry as 'order_confirmation'.
 */
import React, { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { orderStore, type Order } from '../../platform/core/OrderStore';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.12)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    success: '#34d399',
    successDim: 'rgba(52,211,153,0.1)',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderConfirmationBlockProps {
    nodeId: string;
    orderId?: string;   // Can be passed directly or extracted from URL
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OrderConfirmationBlock: React.FC<OrderConfirmationBlockProps> = ({
    nodeId,
    orderId: propOrderId,
}) => {
    // Subscribe to OrderStore for reactivity
    const version = useSyncExternalStore(
        useCallback((cb: () => void) => orderStore.subscribe(cb), []),
        () => orderStore.getVersion(),
    );

    // Extract orderId from hash, custom event, or prop
    const [resolvedOrderId, setResolvedOrderId] = useState<string>(() => {
        if (propOrderId) return propOrderId;
        // Try hash: #/thank-you?orderId=OMN-1024
        const hash = window.location.hash;
        const match = hash.match(/orderId=([A-Z]+-\d+)/);
        return match?.[1] || '';
    });

    // Listen for navigation events
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.orderId) setResolvedOrderId(detail.orderId);
        };
        window.addEventListener('omnora:navigate', handler);
        return () => window.removeEventListener('omnora:navigate', handler);
    }, []);

    // Also try latest order as fallback
    const order: Order | undefined = resolvedOrderId
        ? orderStore.getOrderById(resolvedOrderId)
        : orderStore.getLatestOrder();

    if (!order) {
        return (
            <div data-node-id={nodeId} style={{
                padding: 60, textAlign: 'center',
                fontFamily: "'Inter', sans-serif",
            }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.3 }}>📦</span>
                <p style={{ color: T.textDim, fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>No order found</p>
                <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                    {resolvedOrderId ? `Order ${resolvedOrderId} not found.` : 'Place an order first.'}
                </p>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        confirmed: T.success,
        processing: '#f59e0b',
        shipped: '#3b82f6',
        delivered: T.success,
        cancelled: '#ef4444',
    };

    return (
        <div
            data-node-id={nodeId}
            style={{
                maxWidth: 600,
                margin: '0 auto',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Success Header */}
            <div style={{
                textAlign: 'center',
                padding: '40px 24px 32px',
                background: T.successDim,
                border: `1px solid rgba(52,211,153,0.2)`,
                borderRadius: 16,
                marginBottom: 24,
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 32,
                    background: `linear-gradient(135deg, ${T.success}, #6ee7b7)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 28,
                }}>
                    ✓
                </div>
                <h2 style={{
                    fontSize: 24, fontWeight: 800, color: T.text,
                    margin: '0 0 8px', letterSpacing: '-0.02em',
                }}>
                    Order Confirmed!
                </h2>
                <p style={{ fontSize: 14, color: T.textDim, margin: '0 0 12px' }}>
                    Thank you for your purchase, {order.customer.name.split(' ')[0]}!
                </p>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: T.surface, borderRadius: 10,
                    padding: '8px 16px', border: `1px solid ${T.border}`,
                }}>
                    <span style={{ fontSize: 12, color: T.textDim }}>Order ID</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: T.accent, letterSpacing: '-0.01em' }}>
                        {order.id}
                    </span>
                </div>
            </div>

            {/* Order Details Card */}
            <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 14, overflow: 'hidden',
            }}>
                {/* Status */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                }}>
                    <span style={{ fontSize: 12, color: T.textDim }}>Status</span>
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: statusColors[order.status] || T.text,
                        background: `${statusColors[order.status] || T.text}15`,
                        padding: '4px 12px', borderRadius: 6,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        {order.status}
                    </span>
                </div>

                {/* Customer Info */}
                <div style={{
                    padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                }}>
                    <InfoCell label="Email" value={order.customer.email} />
                    <InfoCell label="Phone" value={order.customer.phone || '—'} />
                    <InfoCell label="Address" value={order.customer.address} span />
                </div>

                {/* Line Items */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: T.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: 12,
                    }}>
                        Items ({order.items.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {order.items.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 8,
                                    overflow: 'hidden', background: T.surface2, flexShrink: 0,
                                }}>
                                    <img src={item.image} alt={item.title} style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                    }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: 13, fontWeight: 600, color: T.text,
                                        margin: 0, whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {item.title}
                                    </p>
                                    <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>
                                        Qty: {item.quantity}
                                    </p>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flexShrink: 0 }}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <TotalRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
                    <TotalRow label="Tax" value={`$${order.tax.toFixed(2)}`} />
                    <TotalRow label="Shipping" value="Free" dim />
                    <div style={{
                        borderTop: `1px solid ${T.border}`,
                        paddingTop: 12, marginTop: 4,
                        display: 'flex', justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Total</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: T.accent, letterSpacing: '-0.02em' }}>
                            ${order.total.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Date */}
            <p style={{
                textAlign: 'center', fontSize: 11, color: T.textMuted,
                marginTop: 16,
            }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
            </p>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoCell: React.FC<{ label: string; value: string; span?: boolean }> = ({ label, value, span }) => (
    <div style={span ? { gridColumn: '1 / -1' } : undefined}>
        <span style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <p style={{ fontSize: 13, color: T.text, fontWeight: 500, margin: '2px 0 0' }}>{value}</p>
    </div>
);

const TotalRow: React.FC<{ label: string; value: string; dim?: boolean }> = ({ label, value, dim }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: T.textDim }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: dim ? T.textMuted : T.text }}>{value}</span>
    </div>
);

export default OrderConfirmationBlock;
