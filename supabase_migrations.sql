-- Migration for Growth Features (Pixel & Discount Engine)

-- 1. Add Pixel IDs to merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS fb_pixel_id text,
ADD COLUMN IF NOT EXISTS tt_pixel_id text;

-- 2. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id text NOT NULL, -- or uuid depending on your schema
    code text NOT NULL,
    type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value numeric NOT NULL,
    expires_at timestamp with time zone,
    usage_limit integer,
    used_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Optimize queries by code and merchant
CREATE INDEX IF NOT EXISTS idx_coupons_code_merchant ON coupons(code, merchant_id);

-- Optional: Add RLS policies for coupons if needed
-- ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON coupons FOR SELECT USING (true);


-- 3. Inventory Schema Updates
ALTER TABLE products
ADD COLUMN IF NOT EXISTS inventory_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;

-- 4. Store Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS store_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);

-- 5. Atomic Deduction RPC
CREATE OR REPLACE FUNCTION deduct_inventory(p_id text, p_quantity integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_stock integer;
    v_threshold integer;
    v_product_name text;
BEGIN
    -- 1. Lock the row for update to prevent concurrent race conditions
    SELECT inventory_count, low_stock_threshold, title 
    INTO v_new_stock, v_threshold, v_product_name
    FROM products 
    WHERE id = p_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- 2. Prevent negative inventory
    IF v_new_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient inventory. Only % items left.', v_new_stock;
    END IF;

    -- 3. Perform deduction
    UPDATE products 
    SET inventory_count = inventory_count - p_quantity 
    WHERE id = p_id 
    RETURNING inventory_count INTO v_new_stock;

    -- 4. Check low stock trigger
    IF v_new_stock <= v_threshold THEN
        INSERT INTO store_notifications (product_id, type, message)
        VALUES (p_id, 'LOW_STOCK', 'Product "' || v_product_name || '" is running low. Only ' || v_new_stock || ' left.');
    END IF;

    RETURN json_build_object(
        'success', true, 
        'remaining_inventory', v_new_stock
    );
END;
$$;


-- 8. Omnora Kernel Engine Tables
CREATE TABLE IF NOT EXISTS system_updates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    version text NOT NULL,
    active boolean DEFAULT true,
    css_payload text,
    js_payload text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    level text NOT NULL DEFAULT 'INFO',
    event text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Index for fast patch lookup
CREATE INDEX IF NOT EXISTS idx_system_updates_active ON system_updates(active);-- 6. Abandoned Cart Recovery System
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id text UNIQUE NOT NULL,
    merchant_id text NOT NULL,
    customer_name text,
    customer_phone text NOT NULL,
    cart_json jsonb NOT NULL,
    cart_value numeric NOT NULL,
    recovered boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_recovery_at timestamp with time zone
);

-- Index for dashboard fast query
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_merchant ON abandoned_carts(merchant_id) WHERE recovered = false;

-- Auto-cleanup function (to be called via pg_cron or Supabase Edge Functions manually)
CREATE OR REPLACE FUNCTION cleanup_abandoned_carts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM abandoned_carts 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;


-- 7. Checkout Idempotency
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key uuid PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now()
);

-- Upgrade atomic deduction with Idempotency
CREATE OR REPLACE FUNCTION deduct_inventory_v2(p_id text, p_quantity integer, p_session_key uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_stock integer;
    v_threshold integer;
    v_product_name text;
    v_already_processed boolean;
BEGIN
    -- 0. Check Idempotency Key
    IF p_session_key IS NOT NULL THEN
        SELECT true INTO v_already_processed FROM idempotency_keys WHERE key = p_session_key;
        IF v_already_processed THEN
            RETURN json_build_object('success', true, 'message', 'Already processed');
        END IF;
    END IF;

    -- 1. Lock the row for update to prevent concurrent race conditions
    SELECT inventory_count, low_stock_threshold, title 
    INTO v_new_stock, v_threshold, v_product_name
    FROM products 
    WHERE id = p_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- 2. Prevent negative inventory
    IF v_new_stock < p_quantity THEN
        RETURN json_build_object('success', false, 'error', 'Maazrat! Ye item abhi abhi stock se khatam ho gaya.', 'remaining', v_new_stock);
    END IF;

    -- 3. Perform deduction
    UPDATE products 
    SET inventory_count = inventory_count - p_quantity 
    WHERE id = p_id 
    RETURNING inventory_count INTO v_new_stock;

    -- 4. Check low stock trigger
    IF v_new_stock <= v_threshold THEN
        INSERT INTO store_notifications (product_id, type, message)
        VALUES (p_id, 'LOW_STOCK', 'Product "' || v_product_name || '" is running low. Only ' || v_new_stock || ' left.');
    END IF;

    -- 5. Store Idempotency Key
    IF p_session_key IS NOT NULL THEN
        INSERT INTO idempotency_keys (key) VALUES (p_session_key);
    END IF;

    RETURN json_build_object(
        'success', true, 
        'remaining_inventory', v_new_stock
    );
END;
$$;

