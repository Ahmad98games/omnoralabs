import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useInventorySync(productId: string, initialCount: number = 0) {
    const [inventoryCount, setInventoryCount] = useState<number>(initialCount);
    const [debouncedIsOutOfStock, setDebouncedIsOutOfStock] = useState<boolean>(initialCount <= 0);

    // Sync if initial prop changes
    useEffect(() => {
        setInventoryCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        if (!productId) return;

        let isMounted = true;
        let pollInterval: ReturnType<typeof setInterval> | null = null;

        // Fallback Polling
        const fetchLatestStock = async () => {
            if (!isMounted) return;
            const { data, error } = await supabase
                .from('products')
                .select('inventory_count')
                .eq('id', productId)
                .single();
            
            if (!error && data && isMounted) {
                setInventoryCount(data.inventory_count);
            }
        };

        // Listen for Postgres UPDATEs on this specific product
        const channel = supabase
            .channel(`public:products:inventory:${productId}`)
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'products',
                    filter: `id=eq.${productId}`
                },
                (payload) => {
                    if (isMounted && payload.new && typeof payload.new.inventory_count === 'number') {
                        setInventoryCount(payload.new.inventory_count);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') {
                    fetchLatestStock();
                }
            });

        pollInterval = setInterval(fetchLatestStock, 30_000); // 30s fallback

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, [productId]);

    // 300ms Debounce to prevent flicker during rapid stock changes
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedIsOutOfStock(inventoryCount <= 0);
        }, 300);
        return () => clearTimeout(handler);
    }, [inventoryCount]);

    return {
        inventoryCount,
        isOutOfStock: debouncedIsOutOfStock,
    };
}
