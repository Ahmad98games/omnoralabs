-- 🛡️ OMNORA OS: INDUSTRIAL TELEMETRY & SEARCH HARDENING (v1.1)
-- 🏗️ Execute this to enable Law 7 compliance and Sovereign Manifests.

-- 1. SOVEREIGN MANIFESTS
-- Separate the active builder state (node_tree) from the live storefront (published_manifest).
ALTER TABLE IF EXISTS store_configs ADD COLUMN IF NOT EXISTS published_manifest JSONB DEFAULT '{}'::jsonb;

-- 2. INDUSTRIAL TELEMETRY (Law 7)
-- Track every automated notification for audit and compliance.
CREATE TABLE IF NOT EXISTS email_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,                         -- 'order_confirmation', 'welcome', etc.
    recipient       TEXT NOT NULL,
    status          TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
    error_msg       TEXT,
    metadata        JSONB DEFAULT '{}',                   -- Template data snapshot
    sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Email Logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can view their own email logs" ON email_logs
    FOR SELECT USING (merchant_id = auth.uid());

-- 3. FULL-TEXT SEARCH SCALES (Law 4 Optimization)
-- Add optimized search_vector columns and GIN indexes.

-- Products (Hardened for missing tables)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        -- Add column if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'search_vector') THEN
            ALTER TABLE products ADD COLUMN search_vector tsvector 
                GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || COALESCE(description, ''))) STORED;
        END IF;
        -- Add index if missing
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_search_vector') THEN
            CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector);
        END IF;
    END IF;
END $$;

-- Blog Posts (Hardened for missing tables)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
        -- Add column if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'search_vector') THEN
            ALTER TABLE blog_posts ADD COLUMN search_vector tsvector 
                GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || COALESCE(content->>'text', ''))) STORED;
        END IF;
        -- Add index if missing
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_blog_search_vector') THEN
            CREATE INDEX idx_blog_search_vector ON blog_posts USING GIN (search_vector);
        END IF;
    END IF;
END $$;

-- 4. CACHE RELOAD
NOTIFY pgrst, 'reload schema';
