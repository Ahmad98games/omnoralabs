-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  OMNORA OS — Supabase PostgreSQL Schema                                    ║
-- ║  Multi-Tenant SaaS + AI/ML Optimization Layer                              ║
-- ║                                                                            ║
-- ║  Run in Supabase SQL Editor (Dashboard → SQL → New Query)                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Secure hashing
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector for embeddings

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CORE SaaS & BUILDER LAYER
-- ─────────────────────────────────────────────────────────────────────────────

-- 1A. Merchants (Tenants)
CREATE TABLE merchants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    store_slug      TEXT UNIQUE,                          -- e.g. 'calviro' → calviro.omnora.com
    custom_domain   TEXT UNIQUE,                          -- e.g. 'www.calviro.com'
    subscription    TEXT NOT NULL DEFAULT 'free'
                    CHECK (subscription IN ('free', 'starter', 'pro', 'enterprise')),
    api_key         TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    avatar_url      TEXT,
    metadata        JSONB DEFAULT '{}',                   -- Flexible KV store (feature flags, locale, etc.)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchants_email       ON merchants (email);
CREATE INDEX idx_merchants_store_slug  ON merchants (store_slug);
CREATE INDEX idx_merchants_domain      ON merchants (custom_domain);
CREATE INDEX idx_merchants_subscription ON merchants (subscription);


-- 1B. Store Configs (Builder State — JSONB)
-- Stores the full serialized React node tree, theme variables, symbol registry,
-- and navigation menus. One active config per merchant.
CREATE TABLE store_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    version         INT NOT NULL DEFAULT 1,               -- Incremental version for rollback
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE = live storefront

    -- The full builder state (mirrors Publisher.ts output)
    node_tree       JSONB NOT NULL DEFAULT '{}',           -- Recursive React node hierarchy
    theme_vars      JSONB NOT NULL DEFAULT '{}',           -- CSS variables: { "--primary-color": "#7c6dfa" }
    symbol_registry JSONB NOT NULL DEFAULT '{}',           -- Global Symbols (master components)
    nav_menus       JSONB NOT NULL DEFAULT '{}',           -- { "main-nav": [...], "footer-nav": [...] }
    page_layouts    JSONB NOT NULL DEFAULT '{}',           -- Custom page node trees: { "about": {...}, "contact": {...} }

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_configs_merchant  ON store_configs (merchant_id);
CREATE INDEX idx_store_configs_published ON store_configs (merchant_id, is_published);
-- GIN index for deep JSONB queries (e.g. searching theme vars or node props)
CREATE INDEX idx_store_configs_theme     ON store_configs USING GIN (theme_vars);


-- 1C. Custom Pages (CMS)
CREATE TABLE pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL,                         -- e.g. 'about' → /pages/about
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published')),
    node_tree       JSONB NOT NULL DEFAULT '{}',           -- Page-specific layout
    seo_title       TEXT,
    seo_description TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, slug)                             -- No duplicate slugs per merchant
);

CREATE INDEX idx_pages_merchant ON pages (merchant_id);
CREATE INDEX idx_pages_slug     ON pages (merchant_id, slug);


-- 1D. Store Pages (Modern AST NodeStore — JSONB)
-- Migrated from MongoDB. Stores the full multi-page manifest hierarchy.
CREATE TABLE store_pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    slug            TEXT NOT NULL,                         -- 'home', 'about', '_site_config'
    ast_manifest    JSONB NOT NULL DEFAULT '{}',           -- The actual NodeStore chunk
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,        -- FALSE = draft sandbox
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, slug, is_published)                 -- One draft and one published per slug
);

CREATE INDEX idx_store_pages_tenant ON store_pages (tenant_id);
CREATE INDEX idx_store_pages_lookup ON store_pages (tenant_id, slug, is_published);
-- GIN index for hardcore deep-structure AST queries
CREATE INDEX idx_store_pages_ast    ON store_pages USING GIN (ast_manifest);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. E-COMMERCE LAYER
-- ─────────────────────────────────────────────────────────────────────────────

-- 2A. Products
CREATE TABLE products (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id       UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    description       TEXT,
    handle            TEXT NOT NULL,                       -- URL slug: 'classic-chronograph'
    product_type      TEXT,                                -- e.g. 'Watch', 'Accessory'
    vendor            TEXT,
    tags              TEXT[] DEFAULT '{}',                  -- Array of tags for filtering
    status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'draft', 'archived')),

    -- Pricing
    base_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
    compare_at_price  NUMERIC(12,2),                      -- Strikethrough price
    cost_price        NUMERIC(12,2),                      -- COGS for margin calculations
    currency          TEXT NOT NULL DEFAULT 'USD',

    -- Inventory
    inventory_count   INT NOT NULL DEFAULT 0,
    track_inventory   BOOLEAN NOT NULL DEFAULT TRUE,
    allow_backorder   BOOLEAN NOT NULL DEFAULT FALSE,

    -- Media
    featured_image    TEXT,
    images            JSONB DEFAULT '[]',                  -- Array of { url, alt, position }

    -- Variants & Options (JSONB for flexibility)
    options           JSONB DEFAULT '[]',                  -- [{ name: "Size", values: ["S","M","L"] }]
    variants          JSONB DEFAULT '[]',                  -- [{ title, price, sku, available, ... }]

    -- SEO
    seo_title         TEXT,
    seo_description   TEXT,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, handle)
);

CREATE INDEX idx_products_merchant   ON products (merchant_id);
CREATE INDEX idx_products_handle     ON products (merchant_id, handle);
CREATE INDEX idx_products_status     ON products (merchant_id, status);
CREATE INDEX idx_products_type       ON products (product_type);
CREATE INDEX idx_products_tags       ON products USING GIN (tags);
CREATE INDEX idx_products_price      ON products (base_price);


-- 2B. Customers
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    first_name      TEXT,
    last_name       TEXT,
    phone           TEXT,
    accepts_marketing BOOLEAN NOT NULL DEFAULT FALSE,

    -- Address
    address_line1   TEXT,
    address_line2   TEXT,
    city            TEXT,
    state           TEXT,
    zip             TEXT,
    country         TEXT DEFAULT 'US',

    -- Aggregated stats (denormalized for fast reads)
    total_orders    INT NOT NULL DEFAULT 0,
    total_spent     NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_order_at   TIMESTAMPTZ,

    -- AI: cluster assignment
    segment_id      UUID REFERENCES customer_segments(id) ON DELETE SET NULL,

    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, email)
);

CREATE INDEX idx_customers_merchant  ON customers (merchant_id);
CREATE INDEX idx_customers_email     ON customers (merchant_id, email);
CREATE INDEX idx_customers_segment   ON customers (segment_id);
CREATE INDEX idx_customers_spent     ON customers (total_spent DESC);


-- 2C. Orders
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_number    SERIAL,                               -- Human-readable order number

    -- Financials
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    grand_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'USD',

    -- Discount
    discount_code   TEXT,
    discount_type   TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  NUMERIC(12,2),

    -- Status
    financial_status TEXT NOT NULL DEFAULT 'pending'
                     CHECK (financial_status IN ('pending', 'paid', 'refunded', 'partially_refunded', 'voided')),
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
                       CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled', 'cancelled')),

    -- Customer Info Snapshot (in case customer record is deleted)
    shipping_address JSONB DEFAULT '{}',
    billing_address  JSONB DEFAULT '{}',
    customer_email   TEXT,
    customer_name    TEXT,

    -- Payment
    payment_method   TEXT,                                -- 'stripe', 'paypal', etc.
    payment_id       TEXT,                                -- External payment provider ID
    checkout_token   TEXT UNIQUE,

    notes            TEXT,
    metadata         JSONB DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_merchant     ON orders (merchant_id);
CREATE INDEX idx_orders_customer     ON orders (customer_id);
CREATE INDEX idx_orders_status       ON orders (financial_status);
CREATE INDEX idx_orders_fulfillment  ON orders (fulfillment_status);
CREATE INDEX idx_orders_created      ON orders (created_at DESC);
CREATE INDEX idx_orders_number       ON orders (merchant_id, order_number);


-- 2D. Order Items (Line Items)
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id      TEXT,                                  -- Matches variant in product JSONB

    title           TEXT NOT NULL,                         -- Snapshot (product may change later)
    sku             TEXT,
    quantity        INT NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(12,2) NOT NULL DEFAULT 0,     -- unit_price * quantity
    image_url       TEXT,

    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order    ON order_items (order_id);
CREATE INDEX idx_order_items_product  ON order_items (product_id);


-- 2E. Discount Codes
CREATE TABLE discount_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value           NUMERIC(12,2) NOT NULL,                -- e.g. 20.00 (%) or 10.00 ($)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit     INT,                                   -- NULL = unlimited
    usage_count     INT NOT NULL DEFAULT 0,
    min_order_value NUMERIC(12,2),                         -- Minimum cart value to activate
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, code)
);

CREATE INDEX idx_discounts_merchant  ON discount_codes (merchant_id);
CREATE INDEX idx_discounts_code      ON discount_codes (merchant_id, code);
CREATE INDEX idx_discounts_active    ON discount_codes (merchant_id, is_active);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AI & ML OPTIMIZATION LAYER
-- ─────────────────────────────────────────────────────────────────────────────

-- 3A. Customer Segments (AI-generated clusters)
-- Created BEFORE customers table references it via FK.
CREATE TABLE customer_segments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                         -- e.g. 'High-Value Repeaters', 'Bargain Hunters'
    description     TEXT,
    algorithm       TEXT NOT NULL DEFAULT 'kmeans',        -- 'kmeans', 'dbscan', 'rule_based'
    cluster_id      INT,                                   -- Numeric cluster label from ML pipeline

    -- Cluster centroid / profile (normalized feature vector)
    centroid        JSONB DEFAULT '{}',                    -- { avg_order_value: 85, frequency: 3.2, recency_days: 12 }
    member_count    INT NOT NULL DEFAULT 0,
    rules           JSONB DEFAULT '{}',                    -- Rule-based segment conditions

    confidence      NUMERIC(5,4),                          -- Model confidence (0.0000 – 1.0000)
    model_version   TEXT,                                  -- Which model version generated this
    last_computed   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_segments_merchant   ON customer_segments (merchant_id);
CREATE INDEX idx_segments_algorithm  ON customer_segments (algorithm);


-- 3B. Product Embeddings (Semantic Search via pgvector)
-- Stores OpenAI/Cohere embeddings for each product.
-- Used for: "Find similar products", semantic search, recommendation input.
CREATE TABLE product_embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

    -- The embedding vector (OpenAI text-embedding-3-small = 1536 dims)
    embedding       vector(1536) NOT NULL,

    -- Metadata about how the embedding was generated
    model           TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    input_text      TEXT,                                  -- The concatenated text that was embedded
    token_count     INT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (product_id)                                    -- One embedding per product
);

CREATE INDEX idx_embeddings_merchant ON product_embeddings (merchant_id);
CREATE INDEX idx_embeddings_product  ON product_embeddings (product_id);

-- HNSW index for fast approximate nearest neighbor search
-- ef_construction=128, m=16 are good defaults for ~100k products
CREATE INDEX idx_embeddings_hnsw ON product_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 128);

-- Alternative: IVFFlat index (faster build, slightly less accurate)
-- Uncomment if you prefer IVFFlat over HNSW:
-- CREATE INDEX idx_embeddings_ivfflat ON product_embeddings
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);


-- 3C. Interaction Logs (Behavioral Tracking for Recommendations)
-- Time-series table tracking every customer interaction.
-- Used for: Collaborative Filtering, conversion funnels, sales forecasting.
CREATE TABLE interaction_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
    session_id      TEXT,                                  -- Anonymous session tracking
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Interaction type
    event_type      TEXT NOT NULL
                    CHECK (event_type IN (
                        'page_view', 'product_view', 'search', 'add_to_cart',
                        'remove_from_cart', 'begin_checkout', 'purchase',
                        'wishlist_add', 'share', 'review'
                    )),

    -- Engagement signals
    dwell_time_ms   INT,                                   -- Time spent on page (milliseconds)
    scroll_depth    NUMERIC(5,2),                           -- 0.00 – 100.00 (%)
    search_query    TEXT,                                   -- For 'search' events
    referrer        TEXT,                                   -- Traffic source

    -- Context
    device_type     TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    page_url        TEXT,
    metadata        JSONB DEFAULT '{}',                    -- Additional event-specific data

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for analytics queries
CREATE INDEX idx_interactions_merchant   ON interaction_logs (merchant_id);
CREATE INDEX idx_interactions_customer   ON interaction_logs (customer_id);
CREATE INDEX idx_interactions_product    ON interaction_logs (product_id);
CREATE INDEX idx_interactions_event      ON interaction_logs (event_type);
CREATE INDEX idx_interactions_session    ON interaction_logs (session_id);
CREATE INDEX idx_interactions_time       ON interaction_logs (created_at DESC);
-- Composite index for recommendation queries: "What did this customer interact with?"
CREATE INDEX idx_interactions_cust_event ON interaction_logs (customer_id, event_type, created_at DESC);
-- Composite index for product analytics: "How is this product performing?"
CREATE INDEX idx_interactions_prod_event ON interaction_logs (product_id, event_type, created_at DESC);


-- 3D. Sales Forecasting - Daily Aggregates (Materialized View / Table)
-- Pre-aggregated daily sales data for time-series forecasting models (Prophet, ARIMA).
CREATE TABLE daily_sales_aggregates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    sale_date       DATE NOT NULL,

    units_sold      INT NOT NULL DEFAULT 0,
    revenue         NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_given  NUMERIC(12,2) NOT NULL DEFAULT 0,
    order_count     INT NOT NULL DEFAULT 0,
    avg_order_value NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Pre-computed features for ML
    day_of_week     SMALLINT,                              -- 0=Sun, 6=Sat
    is_weekend      BOOLEAN,
    week_number     SMALLINT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, product_id, sale_date)
);

CREATE INDEX idx_daily_sales_merchant ON daily_sales_aggregates (merchant_id);
CREATE INDEX idx_daily_sales_date     ON daily_sales_aggregates (sale_date DESC);
CREATE INDEX idx_daily_sales_product  ON daily_sales_aggregates (merchant_id, product_id, sale_date DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MEDIA LIBRARY
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    storage_path    TEXT NOT NULL,                         -- Supabase Storage path
    public_url      TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    file_size       INT NOT NULL,                          -- Bytes
    width           INT,                                   -- Image dimensions
    height          INT,
    alt_text        TEXT,
    folder          TEXT DEFAULT '/',                       -- Virtual folder structure
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_merchant ON media_assets (merchant_id);
CREATE INDEX idx_media_folder   ON media_assets (merchant_id, folder);
CREATE INDEX idx_media_type     ON media_assets (mime_type);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. NAVIGATION MENUS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE nav_menus (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                         -- 'main-nav', 'footer-nav'
    links           JSONB NOT NULL DEFAULT '[]',           -- [{ id, label, url }]
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, name)
);

CREATE INDEX idx_nav_menus_merchant ON nav_menus (merchant_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- 6A. Auto-update `updated_at` timestamp on any row modification
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with `updated_at`
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            tbl
        );
    END LOOP;
END;
$$;


-- 6B. Semantic Search function (pgvector cosine similarity)
-- Usage: SELECT * FROM search_products_semantic('merchant-uuid', query_embedding, 10);
CREATE OR REPLACE FUNCTION search_products_semantic(
    p_merchant_id UUID,
    p_query_embedding vector(1536),
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    handle TEXT,
    base_price NUMERIC,
    featured_image TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.handle,
        p.base_price,
        p.featured_image,
        1 - (pe.embedding <=> p_query_embedding) AS similarity
    FROM product_embeddings pe
    JOIN products p ON p.id = pe.product_id
    WHERE pe.merchant_id = p_merchant_id
      AND p.status = 'active'
    ORDER BY pe.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- 6C. Get popular products by interaction count (for trending/recommendations)
CREATE OR REPLACE FUNCTION get_trending_products(
    p_merchant_id UUID,
    p_days INT DEFAULT 7,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    interaction_count BIGINT,
    purchase_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        il.product_id,
        p.title,
        COUNT(*) AS interaction_count,
        COUNT(*) FILTER (WHERE il.event_type = 'purchase') AS purchase_count
    FROM interaction_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.merchant_id = p_merchant_id
      AND il.product_id IS NOT NULL
      AND il.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY il.product_id, p.title
    ORDER BY interaction_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ROW-LEVEL SECURITY (Supabase Multi-Tenancy)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tenant-scoped tables
ALTER TABLE merchants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_configs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_embeddings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_menus           ENABLE ROW LEVEL SECURITY;

-- Merchant can only access their own data
-- (Assumes Supabase Auth sets auth.uid() = merchant.id)
CREATE POLICY merchant_isolation ON merchants
    FOR ALL USING (id = auth.uid());

CREATE POLICY store_configs_isolation ON store_configs
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY pages_isolation ON pages
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY products_isolation ON products
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY customers_isolation ON customers
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY orders_isolation ON orders
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY order_items_isolation ON order_items
    FOR ALL USING (
        order_id IN (SELECT id FROM orders WHERE merchant_id = auth.uid())
    );

CREATE POLICY discounts_isolation ON discount_codes
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY segments_isolation ON customer_segments
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY embeddings_isolation ON product_embeddings
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY interactions_isolation ON interaction_logs
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY daily_sales_isolation ON daily_sales_aggregates
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY media_isolation ON media_assets
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY nav_menus_isolation ON nav_menus
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY store_pages_isolation ON store_pages
    FOR ALL USING (tenant_id = auth.uid());

-- Public Access Policy: Allows anonymous reads for published pages
CREATE POLICY store_pages_public_read ON store_pages
    FOR SELECT USING (is_published = TRUE);

ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. AI FORGE LAYER & INVENTORY RPC
-- ─────────────────────────────────────────────────────────────────────────────

-- 8A. AI Content Cache & Log
CREATE TABLE ai_content (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,                         -- 'hero-headline', 'product-desc'
    context_hash    TEXT NOT NULL,                         -- SHA-256 slice for deduplication
    prompt          TEXT NOT NULL,
    result          TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    language        TEXT DEFAULT 'english',
    error_msg       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (merchant_id, type, context_hash)
);

CREATE INDEX idx_ai_content_lookup ON ai_content (merchant_id, type, context_hash);

-- 8B. AI Quotas (Real-time tracking)
CREATE TABLE ai_quotas (
    merchant_id     UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
    monthly_used    INT NOT NULL DEFAULT 0,
    monthly_limit   INT NOT NULL DEFAULT 50,
    minute_used     INT NOT NULL DEFAULT 0,
    last_reset_min  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reset_mon  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quotas  ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_content_isolation ON ai_content
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY ai_quotas_isolation ON ai_quotas
    FOR ALL USING (merchant_id = auth.uid());


