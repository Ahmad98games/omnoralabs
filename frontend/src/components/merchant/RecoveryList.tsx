import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { AbandonedCartService, AbandonedCartInfo } from '../../../services/AbandonedCartService';
import { ShoppingCart, Phone, Clock, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';

export interface ExtendedCartInfo extends AbandonedCartInfo {
    last_recovery_at?: string;
}

export const RecoveryList: React.FC = () => {
    const { user } = useAuth();
    const [carts, setCarts] = useState<AbandonedCartInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchCarts();
        }
    }, [user]);

    const fetchCarts = async () => {
        setLoading(true);
        // Using user.id as merchant_id
        const list = await AbandonedCartService.getAbandonedCarts(user!.id);
        setCarts(list as any);
        setLoading(false);
    };

    const handleRecover = async (cart: ExtendedCartInfo) => {
        // Build url and open WA
        const storeSlug = user?.user_metadata?.store_slug || 'mystore';
        const url = AbandonedCartService.generateRecoveryLink(
            cart.customer_phone,
            cart.customer_name,
            storeSlug,
            cart.cart_id
        );
        window.open(url, '_blank');
        
        // Update Timestamp to enforce 24h limit
        await AbandonedCartService.updateRecoveryAttempt(cart.cart_id);
        fetchCarts(); // Refresh to show new timestamp
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-gold)] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (carts.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <ShoppingCart size={40} className="mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No abandoned carts right now!</h3>
                <p>Your conversion rate is looking great.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto text-white">
            <h2 className="text-2xl font-black italic tracking-wider uppercase text-[var(--accent-gold)] mb-8 flex items-center gap-3">
                <AlertCircle /> Cart Recovery Center
            </h2>

            <div className="grid gap-6">
                {carts.map(cart => {
                    let isLocked = false;
                    let lastAttemptStr = 'Never';

                    if (cart.last_recovery_at) {
                        const lastDate = new Date(cart.last_recovery_at);
                        const diffHours = (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60);
                        if (diffHours < 24) isLocked = true;
                        
                        lastAttemptStr = lastDate.toLocaleString();
                    }

                    return (
                        <div key={cart.cart_id} className="bg-[#111] border border-[var(--accent-gold)]/20 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-lg mb-1">{cart.customer_name || 'Anonymous Guest'}</p>
                                <p className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                    <Phone size={14} /> {cart.customer_phone}
                                </p>
                                <p className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <Clock size={12} /> Cart ID: {cart.cart_id.substring(0, 8)}...
                                </p>
                                <p className="text-xs text-[var(--accent-gold)]/70">
                                    Last Attempted: {lastAttemptStr}
                                </p>
                            </div>

                            <div className="text-right flex flex-col items-end gap-3">
                                <span className="text-xl font-black text-green-400">${cart.cart_value.toFixed(2)}</span>
                                <button
                                    onClick={() => handleRecover(cart)}
                                    disabled={isLocked}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-transform ${isLocked ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#1ebd57] text-white hover:scale-105'}`}
                                >
                                    {isLocked ? <CheckCircle size={18} /> : <MessageCircle size={18} />}
                                    {isLocked ? 'Sent (24h Cooldown)' : 'Recover via WhatsApp'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
