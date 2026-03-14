import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Loader2, Calendar, Mail, DollarSign, MoreVertical, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { Order } from '../../platform/core/DatabaseTypes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const AdminOrderManager = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const fetchOrders = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await databaseClient.getOrders(user.id);
            setOrders(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch orders', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
        setUpdatingOrderId(orderId);
        try {
            await databaseClient.updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            showToast(`Order marked as ${newStatus.toLowerCase()}`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update status', 'error');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getStatusStyles = (status: Order['status']) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'PAID':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'SHIPPED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'DELIVERED':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />;
            case 'PAID': return <DollarSign size={14} />;
            case 'SHIPPED': return <Truck size={14} />;
            case 'DELIVERED': return <CheckCircle size={14} />;
        }
    };

    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-white font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <ShoppingBag className="text-indigo-500" />
                        Order Command Center
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm max-w-xl">
                        Monitor incoming sales, track payment status, and manage fulfillment across your cinematic storefront.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-72 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Cyberpunk accent line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0A0A0A] border-b border-white/5 text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Order ID</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Total</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="bg-[#050505]">
                                        <td className="px-6 py-4"><Skeleton baseColor="#111" highlightColor="#222" width={80} height={14} /></td>
                                        <td className="px-6 py-4"><Skeleton baseColor="#111" highlightColor="#222" width={100} height={14} /></td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <Skeleton baseColor="#111" highlightColor="#222" width={120} height={14} />
                                                <Skeleton baseColor="#111" highlightColor="#222" width={150} height={10} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton baseColor="#111" highlightColor="#222" width={60} height={14} /></td>
                                        <td className="px-6 py-4"><Skeleton baseColor="#111" highlightColor="#222" width={70} height={20} borderRadius={10} /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton baseColor="#111" highlightColor="#222" width={32} height={32} borderRadius={6} /></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                                            <div className="w-20 h-20 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center relative mb-2">
                                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
                                                <ShoppingBag size={40} className="text-indigo-500 relative z-10" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white tracking-tight">Your first sale is just around the corner.</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed">
                                                When a customer places an order on your storefront, it will appear here instantly for you to manage.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-indigo-400">
                                            #{order.id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-600" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wider text-[10px] mb-0.5">
                                                    {order.customerName || 'Anonymous'}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
                                                    <Mail size={10} />
                                                    {order.customerEmail}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white tracking-tight">
                                            {order.currency || '$'} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${getStatusStyles(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {updatingOrderId === order.id ? (
                                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                                ) : (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {order.status === 'PAID' && (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                                                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all"
                                                            >
                                                                Mark Shipped
                                                            </button>
                                                        )}
                                                        {order.status === 'SHIPPED' && (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                                                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all"
                                                            >
                                                                Mark Delivered
                                                            </button>
                                                        )}
                                                        <button className="p-2 text-gray-600 hover:text-white transition-colors">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
