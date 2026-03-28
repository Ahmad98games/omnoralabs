-- 🛡️ OMNORA OS: SHOPIFY PARITY SCHEMA (PART 2)

-- 1. Blog Engine
CREATE TABLE IF NOT EXISTS blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    content text, -- Rich HTML
    excerpt text,
    featured_image text,
    author_name text,
    author_avatar text,
    tags text[] DEFAULT '{}',
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at timestamptz,
    seo_title text,
    seo_description text,
    read_time_minutes integer DEFAULT 1,
    view_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Email Marketing
CREATE TABLE IF NOT EXISTS email_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    email text NOT NULL,
    name text,
    tags text[] DEFAULT '{}',
    source text DEFAULT 'newsletter', -- newsletter|checkout|manual
    status text DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    subscribed_at timestamptz DEFAULT now(),
    UNIQUE(merchant_id, email)
);

CREATE TABLE IF NOT EXISTS email_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    name text NOT NULL,
    subject text,
    preview_text text,
    html_content text,
    recipient_type text DEFAULT 'all', -- all|segment|manual
    segment_conditions jsonb DEFAULT '{}',
    recipient_count integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    open_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
    scheduled_at timestamptz,
    sent_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3. Abandoned Carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    customer_email text,
    customer_name text,
    cart_items jsonb NOT NULL,
    cart_total_cents integer NOT NULL,
    recovery_url text, -- Contains cart token
    status text DEFAULT 'abandoned' CHECK (status IN ('abandoned', 'recovering', 'recovered')),
    recovery_email_1_sent_at timestamptz,
    recovery_email_2_sent_at timestamptz,
    recovery_email_3_sent_at timestamptz,
    recovered_at timestamptz,
    recovered_order_id uuid REFERENCES orders(id),
    created_at timestamptz DEFAULT now()
);

-- 4. Social Connections
CREATE TABLE IF NOT EXISTS social_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'pinterest')),
    access_token text, -- Encrypted
    account_id text,
    account_name text,
    account_avatar text,
    is_active boolean DEFAULT true,
    connected_at timestamptz DEFAULT now()
);

-- 5. Analytics (Industrial Grade)
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    session_id text,
    event_type text NOT NULL, -- page_view|product_view|add_to_cart|checkout|purchase|lead
    page_url text,
    referrer text,
    product_id uuid,
    order_id uuid,
    revenue_cents integer DEFAULT 0,
    user_agent text,
    country text,
    city text,
    created_at timestamptz DEFAULT now()
);

-- 6. Logistics (Shipping & Tax)
CREATE TABLE IF NOT EXISTS shipping_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    name text NOT NULL,
    countries text[] DEFAULT '{}',
    rates jsonb DEFAULT '[]', -- [{name, price_cents, min_weight, max_weight, min_order_cents}]
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    country text NOT NULL,
    state text,
    rate numeric NOT NULL, -- 0.08 = 8%
    is_inclusive boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 7. URL Redirects
CREATE TABLE IF NOT EXISTS url_redirects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    old_path text NOT NULL,
    new_path text NOT NULL,
    status_code integer DEFAULT 301,
    created_at timestamptz DEFAULT now(),
    UNIQUE(merchant_id, old_path)
);
