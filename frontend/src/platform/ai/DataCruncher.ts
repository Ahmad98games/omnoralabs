import { supabase } from '../../lib/supabaseClient';

export interface MinifiedStoreState {
    time: string;
    metrics: {
        rev_7d: number;
        orders_7d: number;
        capi_fidelity: number;
        wallet_days: number;
    };
    alerts: {
        low_stock: any[]; // [ { sku, name, stock } ]
    };
}

export class DataCruncher {
    /**
     * Executes parallel Supabase calls to extract dense storefront metrics,
     * stripping out massive DB columns into a highly minified token-efficient 
     * JSON payload for LLM processing (Max ~500 tokens).
     */
    static async captureStoreState(merchantId: string, signal?: AbortSignal): Promise<MinifiedStoreState | null> {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const dateIso = sevenDaysAgo.toISOString();

            // Fire parallel queries with AbortSignal
            const [ordersRes, productsRes, trackingRes, merchantRes] = await Promise.all([
                // 1. Orders last 7 days
                supabase.from('orders')
                        .select('total_amount, created_at')
                        .eq('merchant_id', merchantId)
                        .gte('created_at', dateIso)
                        .abortSignal(signal),
                
                // 2. Products
                supabase.from('products')
                        .select('title, stock, variants')
                        .eq('merchant_id', merchantId)
                        .abortSignal(signal),

                // 3. Tracking Logs
                supabase.from('tracking_logs')
                        .select('status')
                        .eq('merchant_id', merchantId)
                        .gte('created_at', dateIso)
                        .abortSignal(signal),

                // 4. Wallet/Subscription Health
                supabase.from('merchants')
                        .select('wallet_days_remaining')
                        .eq('id', merchantId)
                        .single()
                        .abortSignal(signal)
            ]);

            // Crunch Orders
            const orders = ordersRes.data || [];
            const rev_7d = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            
            // Crunch Products (Native stock + deeply nested Variants stock limit < 5)
            const lowStockItems: any[] = [];
            (productsRes.data || []).forEach(p => {
                // If base product is out of stock / low
                if (p.stock !== null && p.stock < 5) {
                    lowStockItems.push({ item: p.title, stock: p.stock });
                }
                
                // If variant nested stock is low
                if (p.variants && Array.isArray(p.variants)) {
                    p.variants.forEach((v: any) => {
                        if (v.stock !== null && v.stock < 5) {
                            lowStockItems.push({ item: `${p.title} (${v.name})`, stock: v.stock });
                        }
                    });
                }
            });

            // Tracking Fidelity
            const logs = trackingRes.data || [];
            const totalLogs = logs.length;
            const okLogs = logs.filter(l => l.status === 'ok').length;
            const capi_fidelity = totalLogs > 0 ? (okLogs / totalLogs) * 100 : 0;

            const walletDays = merchantRes.data?.wallet_days_remaining || 0;

            const state: MinifiedStoreState = {
                time: new Date().toISOString().split('T')[0],
                metrics: {
                    rev_7d: Math.round(rev_7d),
                    orders_7d: orders.length,
                    capi_fidelity: Math.round(capi_fidelity),
                    wallet_days: walletDays
                },
                alerts: {
                    low_stock: lowStockItems.slice(0, 10) // Limit to top 10 bounds to save tokens
                }
            };

            return state;
        } catch (error) {
            console.error('[DataCruncher] Error computing store state:', error);
            return null;
        }
    }
}
