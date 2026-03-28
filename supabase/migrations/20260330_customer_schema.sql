-- 🏗️ OMNORA OS: CUSTOMER SCHEMA (Separate Database Logic)
-- Creating a dedicated table for shoppers to separate from merchants/sellers.

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 3. Policies: Users can view/edit their own profile
CREATE POLICY "Users can view their own customer profile" 
    ON customers FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer profile" 
    ON customers FOR UPDATE 
    USING (auth.uid() = id);

-- 4. Sync triggers (Optional but recommended for consistency)
CREATE OR REPLACE FUNCTION public.handle_new_customer() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customers (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
