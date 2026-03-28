-- 🛡️ OMNORA OS: ATOMIC INVENTORY RECOVERY (Task 2.8)
-- Releases expired reservations and restores stock to product_variants.

CREATE OR REPLACE FUNCTION release_expired_reservations() 
RETURNS void AS $$
DECLARE
    res RECORD;
BEGIN
    FOR res IN 
        DELETE FROM inventory_reservations 
        WHERE expires_at < now() AND status = 'pending'
        RETURNING variant_id, quantity
    LOOP
        -- Restore stock to variants table
        UPDATE product_variants 
        SET inventory_count = inventory_count + res.quantity
        WHERE id = res.variant_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 🛡️ CRON: Run every 5 minutes (via pg_cron or Supabase Edge Function Cron)
-- SELECT release_expired_reservations();
