import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface MerchantStatsProps {
    merchantId: string;
}

/**
 * MerchantStats: Dashboard Analytics Layout
 * 
 * Calculates Total Revenue (Delivered), Pending Revenue, and Conversion Rate.
 */
export const MerchantStats: React.FC<MerchantStatsProps> = ({ merchantId }) => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingRevenue: 0,
        ordersCount: 0,
        visitorsCount: 1250, // Fallback/Mock for conversion rate math
        abandonedTotal: 0,
        recoveredTotal: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            const { data: abandonedCarts } = await supabase
                .from('abandoned_carts')
                .select('recovered')
                .eq('merchant_id', merchantId);

            let abandoned = 0, recovered = 0;
            if (abandonedCarts) {
                abandoned = abandonedCarts.length;
                recovered = abandonedCarts.filter(c => c.recovered).length;
            }

            const { data: orders, error } = await supabase
                .from('orders')
                .select('status, total_amount')
                .eq('merchant_id', merchantId);

            if (!error && orders) {
                let total = 0;
                let pending = 0;

                orders.forEach(order => {
                    if (order.status === 'Delivered') {
                        total += order.total_amount;
                    } else if (order.status === 'Payment_Under_Review' || order.status === 'Pending_Payment') {
                        pending += order.total_amount;
                    }
                });

                setStats(prev => ({
                    ...prev,
                    totalRevenue: total,
                    pendingRevenue: pending,
                    ordersCount: orders.length,
                    abandonedTotal: abandoned,
                    recoveredTotal: recovered
                }));
            }

            setLoading(false);
        };

        if (merchantId) fetchStats();
    }, [merchantId]);

    const conversionRate = ((stats.ordersCount / stats.visitorsCount) * 100).toFixed(1);

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                <RefreshCw className="animate-spin" style={{ margin: '0 auto 12px' }} size={24} />
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em' }}>CALCULATING ANALYTICS...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {/* Total Revenue */}
            <div style={{ background: '#13131a', padding: 20, borderRadius: 8, border: '1px solid #2a2a3a' }}>
                <p style={{ color: '#888', fontSize: '12px' }}>Total Revenue (Delivered)</p>
                <h3 style={{ color: '#10b981', fontSize: '24px', fontWeight: 700, marginTop: 4 }}>
                    Rs. {stats.totalRevenue.toLocaleString()}
                </h3>
            </div>

            {/* Pending Revenue */}
            <div style={{ background: '#13131a', padding: 20, borderRadius: 8, border: '1px solid #2a2a3a' }}>
                <p style={{ color: '#888', fontSize: '12px' }}>Pending / Reviewing</p>
                <h3 style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 700, marginTop: 4 }}>
                    Rs. {stats.pendingRevenue.toLocaleString()}
                </h3>
            </div>

            {/* Conversion Rate */}
            <div style={{ background: '#13131a', padding: 20, borderRadius: 8, border: '1px solid #2a2a3a' }}>
                <p style={{ color: '#888', fontSize: '12px' }}>Conversion Rate</p>
                <h3 style={{ color: '#6366f1', fontSize: '24px', fontWeight: 700, marginTop: 4 }}>
                    {conversionRate}%
                </h3>
                <p style={{ color: '#444', fontSize: '10px', marginTop: 2 }}>Based on {stats.visitorsCount} uniques</p>
            </div>

            {/* Smart Cart Recovery Rate */}
            <div style={{ background: '#13131a', padding: 20, borderRadius: 8, border: '1px solid #2a2a3a' }}>
                <p style={{ color: '#888', fontSize: '12px' }}>Cart Recovery Rate</p>
                <h3 style={{ color: '#ec4899', fontSize: '24px', fontWeight: 700, marginTop: 4 }}>
                    {stats.abandonedTotal > 0 ? ((stats.recoveredTotal / stats.abandonedTotal) * 100).toFixed(1) : '0.0'}%
                </h3>
                <p style={{ color: '#444', fontSize: '10px', marginTop: 2 }}>
                    Recovered: {stats.recoveredTotal} / {stats.abandonedTotal}
                </p>
            </div>
        </div>
    );
};
