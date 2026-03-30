import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { Order } from '../../platform/core/DatabaseTypes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { PrintView } from './PrintView';
import { generateInvoice, shareInvoiceToWhatsApp } from '../../utils/InvoiceGenerator';

export const AdminOrderManager = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [printOrder, setPrintOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (printOrder) {
            setTimeout(() => {
                window.print();
                setPrintOrder(null);
            }, 300);
        }
    }, [printOrder]);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await databaseClient.getOrders(user.id);
            setOrders(data);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Fulfillment feed synchronization failed';
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
        setUpdatingOrderId(orderId);
        try {
            await databaseClient.updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            showToast(`Order marked as ${newStatus.toLowerCase()}`, 'success');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Status update failed';
            showToast(msg, 'error');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getStatusPillClass = (status: Order['status']) => {
        switch (status) {
            case 'PENDING': return 'pill-pending';
            case 'PAID': return 'pill-success';
            case 'SHIPPED': return 'pill-info';
            case 'DELIVERED': return 'pill-success';
            default: return 'pill-pending';
        }
    };



    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Fulfillment / <span style={{ opacity: 0.4 }}>Settlement Feed</span>
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-ghost)', marginTop: '8px' }}>Real-time synchronization of global order manifests and financial clearing.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-ghost)' }} />
                        <input
                            type="text"
                            placeholder="Identify Order..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'var(--surface-low)',
                                border: '1px solid var(--border-low)',
                                borderRadius: '8px',
                                padding: '10px 16px 10px 36px',
                                fontSize: '12px',
                                color: '#fff',
                                width: '280px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="table-container">
                <div className="table-header">
                    <h3>Command Central Settlement</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Manifest ID</th>
                            <th>Cycle Date</th>
                            <th>Entity / Customer</th>
                            <th>Clearing Value</th>
                            <th>Protocol Status</th>
                            <th style={{ textAlign: 'right' }}>Authorization</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={80} height={14} /></td>
                                    <td><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={100} height={14} /></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={120} height={14} />
                                            <Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={150} height={10} />
                                        </div>
                                    </td>
                                    <td><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={60} height={14} /></td>
                                    <td><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={70} height={20} borderRadius={10} /></td>
                                    <td style={{ textAlign: 'right' }}><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={80} height={32} borderRadius={6} /></td>
                                </tr>
                            ))
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '100px', color: 'var(--text-ghost)', fontStyle: 'italic' }}>Zero-order state detected. Awaiting synchronization with the network.</td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 800 }}>
                                        #{order.id.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td style={{ fontSize: '11px', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)' }}>
                                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '13px' }}>{order.customerName || 'Anonymous Entity'}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)' }}>{order.customerEmail}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '13px' }}>
                                        {order.currency || 'USD'} {order.totalAmount.toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`pill ${getStatusPillClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', opacity: 0.1, transition: 'opacity 0.2s' }}>
                                            {updatingOrderId === order.id ? (
                                                <Loader2 size={14} className="animate-spin text-accent-gold" />
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => generateInvoice(order, user?.user_metadata?.store_name || user?.user_metadata?.store_slug || 'My Store')}
                                                        style={{ background: 'var(--surface-high)', border: '1px solid var(--border-low)', borderRadius: '4px', color: 'var(--text-ghost)', padding: '4px 8px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}
                                                    >PDF</button>
                                                    <button 
                                                        onClick={() => setPrintOrder(order)} 
                                                        style={{ background: 'var(--surface-high)', border: '1px solid var(--border-low)', borderRadius: '4px', color: 'var(--text-ghost)', padding: '4px 8px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}
                                                    >PRINT</button>
                                                    <button 
                                                        onClick={() => shareInvoiceToWhatsApp(order, order.customerPhone || '')}
                                                        style={{ background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: '4px', color: '#25D366', padding: '4px 8px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}
                                                    >WA</button>
                                                    
                                                    {order.status === 'PAID' && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                                                            style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}
                                                        >DISPATCH</button>
                                                    )}
                                                    
                                                    {order.status === 'SHIPPED' && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                                            style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}
                                                        >FINALIZE</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Hidden Thermal Print Component */}
            {printOrder && (
                <div className="fixed top-0 left-0 bg-white z-[9999] opacity-0 print:opacity-100">
                    <PrintView order={printOrder} storeName={user?.user_metadata?.store_name || user?.user_metadata?.store_slug || 'Store'} />
                </div>
            )}
        </div>
    );
};
