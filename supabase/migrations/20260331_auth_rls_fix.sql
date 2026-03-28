-- 🛡️ OMNORA OS: AUTH RLS PATCH (Task 10.2)
-- Hardening first-time signup for Google OAuth & Email Registration

-- 1. Hardening Merchants Table
ALTER TABLE IF EXISTS merchants ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Users can insert their own merchant profile') THEN
        CREATE POLICY "Users can insert their own merchant profile"
            ON merchants FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 2. Hardening Customers Table
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can insert their own customer profile') THEN
        CREATE POLICY "Users can insert their own customer profile"
            ON customers FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 3. Recovery: Ensure SELECT policies are present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Users can view their own merchant profile') THEN
        CREATE POLICY "Users can view their own merchant profile"
            ON merchants FOR SELECT
            USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view their own customer profile') THEN
        CREATE POLICY "Users can view their own customer profile"
            ON customers FOR SELECT
            USING (auth.uid() = id);
    END IF;
END $$;
