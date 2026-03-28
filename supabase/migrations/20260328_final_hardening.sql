-- 🏗️ OMNORA OS: INDUSTRIAL HARDENING (Task 7.3)
-- High-Availability Commerce Engine (Pessimistic Locking & Idempotency)

CREATE EXTENSION IF NOT EXISTS pgsodium;
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- 1. Idempotency Shield (Webhook Registry)
CREATE TABLE processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    provider TEXT DEFAULT 'stripe',
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Industrial Schema: Blog & Social
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    seo_meta JSONB DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(merchant_id, slug)
);

CREATE TABLE social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'facebook', 'tiktok', 'pinterest'
    access_token_encrypted BYTEA, -- High-Security Encryption (pgsodium)
    catalog_id TEXT,
    pixel_id TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(merchant_id, platform)
);

-- 3. Logistics & Self-Healing
CREATE TABLE shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    countries TEXT[] DEFAULT '{}',
    rates JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Law 6: Self-Healing Trigger for Shipping Zones
CREATE OR REPLACE FUNCTION auto_provision_logistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO shipping_zones (merchant_id, name, countries, rates)
    VALUES (NEW.id, 'Default International', '{"US", "CA", "GB"}', '[{"name": "Standard", "price": 0}]');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER provision_logistics_on_signup
AFTER INSERT ON merchants
FOR EACH ROW EXECUTE FUNCTION auto_provision_logistics();

-- 4. PESSIMISTIC STOCK LOCKING (Industrial Task 7.3)
CREATE OR REPLACE FUNCTION atomic_stock_decrement(
    p_variant_id UUID,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- 🛡️ SELECT FOR UPDATE: Pessimistically locks the row for this transaction
    SELECT inventory_count INTO current_stock
    FROM product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF current_stock >= p_quantity THEN
        UPDATE product_variants
        SET inventory_count = inventory_count - p_quantity,
            updated_at = now()
        WHERE id = p_variant_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. O(1) PERFORMANCE INDEXING (B-Tree)
CREATE INDEX idx_blog_merchant ON blog_posts(merchant_id);
CREATE INDEX idx_blog_created ON blog_posts(created_at DESC);
CREATE INDEX idx_social_merchant ON social_connections(merchant_id);
CREATE INDEX idx_shipping_merchant ON shipping_zones(merchant_id);
CREATE INDEX idx_webhooks_stripe ON processed_webhook_events(stripe_event_id);

-- 6. MODDATETIME TRIGGERS
CREATE TRIGGER set_blog_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
CREATE TRIGGER set_social_updated_at BEFORE UPDATE ON social_connections FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
CREATE TRIGGER set_shipping_updated_at BEFORE UPDATE ON shipping_zones FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
