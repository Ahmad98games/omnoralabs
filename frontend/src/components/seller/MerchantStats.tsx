import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

export const MerchantStats: React.FC = () => {
    const { user } = useAuth();
    
    // Core KPIs
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [successfulCapiEvents, setSuccessfulCapiEvents] = useState(0);
    
    // ROAS Config
    const [adSpend, setAdSpend] = useState<string>(''); // Allow user mapping
    const [roas, setRoas] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    const fetchAnalytics = async () => {
        if (!user) return;

        // 1. Fetch Orders natively
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('merchant_id', user.id);

        let revenue = 0;
        let count = 0;
        if (orders) {
            revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            count = orders.length;
            setTotalRevenue(revenue);
            setTotalOrders(count);
        }

        // 2. Fetch Tracking Fidelity
        const { count: capiCount } = await supabase
            .from('tracking_logs')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', user.id)
            .eq('status', 'ok');

        setSuccessfulCapiEvents(capiCount || 0);
    };

    // Auto-compute ROAS instantly on Ad Spend change
    useEffect(() => {
        const spendVal = parseFloat(adSpend);
        if (spendVal && spendVal > 0) {
            setRoas(totalRevenue / spendVal);
        } else {
            setRoas(null);
        }
    }, [adSpend, totalRevenue]);

    // Tracking Fidelity Metric
    // Prevent divide by 0 if no orders exist yet
    const trackingFidelity = totalOrders > 0 
        ? Math.min(Math.round((successfulCapiEvents / totalOrders) * 100), 100)
        : 0;

    return (
        <div className="p-8 space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Performance & ROAS Analytics</h1>
            
            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800">
                    <p className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-widest">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-400">Rs. {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800">
                    <p className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-widest">Total Orders</p>
                    <p className="text-3xl font-bold text-white">{totalOrders}</p>
                </div>
                <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800 relative overflow-hidden">
                    <p className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-widest relative z-10">Tracking Fidelity</p>
                    <div className="flex items-baseline space-x-2 relative z-10">
                        <p className={`text-3xl font-bold ${trackingFidelity >= 90 ? 'text-blue-400' : 'text-orange-400'}`}>
                            {trackingFidelity}%
                        </p>
                        <span className="text-xs text-gray-500">[{successfulCapiEvents} captured]</span>
                    </div>
                </div>
            </div>

            {/* ROAS Calculator Engine */}
            <div className="bg-gradient-to-br from-[#121118] to-[#18181b] p-6 rounded-xl border border-indigo-500/30">
                <h2 className="text-xl font-bold text-white mb-6">Return on Ad Spend (ROAS) Calculator</h2>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Total Ad Spend (PKR)</label>
                        <input 
                            type="number"
                            value={adSpend}
                            onChange={(e) => setAdSpend(e.target.value)}
                            placeholder="Enter your Meta/TikTok Spend"
                            className="w-full bg-[#0a0a0c] border border-gray-700 px-4 py-3 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500">Compare external marketing budget against your rigid store revenue.</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center border-l border-gray-800 pl-8">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Calculated ROAS</p>
                        {roas !== null ? (
                            <div className="flex items-end gap-2 text-indigo-400">
                                <span className="text-5xl font-black">{roas.toFixed(2)}x</span>
                            </div>
                        ) : (
                            <p className="text-gray-600 font-mono">Awaiting Spend Data...</p>
                        )}
                        {roas !== null && roas >= 3 && <p className="text-green-500 text-xs mt-2 font-bold uppercase">Highly Profitable Engine</p>}
                        {roas !== null && roas < 1 && <p className="text-red-500 text-xs mt-2 font-bold uppercase">Operating at a Loss</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
