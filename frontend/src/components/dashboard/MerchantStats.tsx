import React, { useState, useEffect } from 'react';
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
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

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
                    ordersCount: orders.length
                }));
            }

            setLoading(false);
        };

        if (merchantId) fetchStats();
    }, [merchantId]);

    const conversionRate = ((stats.ordersCount / stats.visitorsCount) * 100).toFixed(1);

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
        </div>
    );
};
