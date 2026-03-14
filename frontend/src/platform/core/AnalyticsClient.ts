import { supabase } from '../../lib/supabaseClient';

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    activeProducts: number;
}

export interface ChartDataPoint {
    date: string;
    revenue: number;
    orders?: number;
}

export class AnalyticsClient {
    private static instance: AnalyticsClient;

    private constructor() {}

    public static getInstance(): AnalyticsClient {
        if (!AnalyticsClient.instance) {
            AnalyticsClient.instance = new AnalyticsClient();
        }
        return AnalyticsClient.instance;
    }

    /**
     * Retrieves top-level aggregate statistics for the merchant dashboard.
     */
    public async getDashboardStats(merchantId: string): Promise<DashboardStats> {
        // Fallback calculations using direct table queries
        // In a strict production environment, this would hit highly optimized PostgreSQL aggregates
        
        try {
            // Get completed orders for revenue
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('merchant_id', merchantId)
                .in('financial_status', ['paid', 'partially_refunded']);

            if (ordersError) throw ordersError;

            // Get total order count (including unfulfilled/pending to track volume)
            const { count: orderCount, error: countError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId);

            if (countError) throw countError;

            // Get active products
            const { count: productCount, error: productError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId)
                .eq('status', 'active');

            if (productError) throw productError;

            const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

            return {
                totalRevenue,
                totalOrders: orderCount || 0,
                activeProducts: productCount || 0
            };

        } catch (err: any) {
            console.error("AnalyticsClient: Failed to fetch dashboard stats", err);
            // Return safe fallbacks to prevent breaking the UI
            return { totalRevenue: 0, totalOrders: 0, activeProducts: 0 };
        }
    }

    /**
     * Retrieves the last N days of revenue for the AreaChart.
     */
    public async getSalesChartData(merchantId: string, days: number = 7): Promise<ChartDataPoint[]> {
        try {
            // Generating the date range
            const chartData: ChartDataPoint[] = [];
            const today = new Date();
            
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                chartData.push({
                    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue: 0,
                    orders: 0
                });
            }

            // Fetch aggregate data if available
            const { data: orders } = await supabase
                .from('orders')
                .select('created_at, total_amount')
                .eq('merchant_id', merchantId)
                .in('financial_status', ['paid', 'partially_refunded'])
                .gte('created_at', new Date(today.setDate(today.getDate() - days)).toISOString());

            if (orders) {
                orders.forEach(order => {
                    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const existingPoint = chartData.find(p => p.date === orderDate);
                    if (existingPoint) {
                        existingPoint.revenue += (order.total_amount || 0);
                        existingPoint.orders = (existingPoint.orders || 0) + 1;
                    }
                });
            }

            return chartData;
        } catch (err: any) {
            console.error("AnalyticsClient: Failed to fetch charting data", err);
            return [];
        }
    }
}

export const analyticsClient = AnalyticsClient.getInstance();
