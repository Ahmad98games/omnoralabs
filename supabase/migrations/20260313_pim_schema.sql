-- OMNORA OS: PHASE 58 - RELATIONAL PIM SCHEMA
-- Execute this in the Supabase SQL Editor

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(merchant_id, slug)
);

-- Enable RLS for Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can manage their own categories" ON categories
    FOR ALL USING (auth.uid() = merchant_id);

-- 2. Enhanced Products Table (Updates existing)
-- If table doesn't exist, create it. If it does, we add the columns.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products') THEN
        CREATE TABLE products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
            category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            handle TEXT NOT NULL,
            description TEXT,
            base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
            compare_at_price DECIMAL(12,2),
            featured_image TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(merchant_id, handle)
        );
    ELSE
        -- Ensure category_id exists
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'products' AND column_name = 'category_id') THEN
            ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 3. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g. "Gold / Leather"
    sku TEXT,
    price_override DECIMAL(12,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    options JSONB DEFAULT '{}'::jsonb, -- e.g. {"Color": "Gold", "Size": "M"}
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can manage variants of their products" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_variants.product_id 
            AND products.merchant_id = auth.uid()
        )
    );

-- 4. Product Gallery Table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can manage images of their products" ON product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.merchant_id = auth.uid()
        )
    );

-- 5. Storage Buckets
-- Ensure 'product-assets' bucket exists in Supabase Storage.
-- (This is usually done via UI or SQL but requires 'storage' schema access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-assets', 'product-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Allow merchants to upload to their own folder)
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-assets');
CREATE POLICY "Merchant Upload Access" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Merchant Delete Access" ON storage.objects FOR DELETE USING (
    bucket_id = 'product-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);
