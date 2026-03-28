-- 🏗️ OMNORA OS: COMPREHENSIVE INDUSTRIAL KERNEL PATCH (v1.0)
-- 🛡️ Execute this in the Supabase SQL Editor to synchronize the Database with the Industrial Frontend.

-- 1. HARDENING MERCHANTS (Tenants)
ALTER TABLE IF EXISTS merchants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin', 'super-admin'));
ALTER TABLE IF EXISTS merchants ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS merchants ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Users can insert their own merchant profile') THEN
        CREATE POLICY "Users can insert their own merchant profile" ON merchants FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Users can view their own merchant profile') THEN
        CREATE POLICY "Users can view their own merchant profile" ON merchants FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Users can update their own merchant profile') THEN
        CREATE POLICY "Users can update their own merchant profile" ON merchants FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- 2. HARDENING CUSTOMERS (Shoppers)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can insert their own customer profile') THEN
        CREATE POLICY "Users can insert their own customer profile" ON customers FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view their own customer profile') THEN
        CREATE POLICY "Users can view their own customer profile" ON customers FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can update their own customer profile') THEN
        CREATE POLICY "Users can update their own customer profile" ON customers FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- 3. LOGISTICS: ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'US',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Users can manage their own addresses') THEN
        CREATE POLICY "Users can manage their own addresses" ON addresses FOR ALL USING (auth.uid() = customer_id);
    END IF;
END $$;

-- 4. COMMERCE: ORDERS & ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id),
    total_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_cents INTEGER NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
        CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can view their own order items') THEN
        CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
            EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
        );
    END IF;
END $$;

-- 5. CACHE RELOAD
NOTIFY pgrst, 'reload schema';
