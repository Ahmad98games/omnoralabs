-- 🛡️ OMNORA OS: SHOPIFY PARITY SCHEMA (PART 1)

-- 1. Products
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL DEFAULT 0,
    compare_price numeric(10,2),
    cost_price numeric(10,2),
    sku text,
    barcode text,
    track_inventory boolean DEFAULT true,
    inventory_count integer DEFAULT 0,
    low_stock_threshold integer DEFAULT 5,
    weight numeric,
    weight_unit text DEFAULT 'kg',
    images jsonb DEFAULT '[]',
    tags text[] DEFAULT '{}',
    collection_ids uuid[] DEFAULT '{}',
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    is_featured boolean DEFAULT false,
    sales_count integer DEFAULT 0,
    seo_title text,
    seo_description text,
    slug text UNIQUE NOT NULL,
    metafields jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Product Options
CREATE TABLE IF NOT EXISTS product_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g. "Color", "Size"
    values text[] NOT NULL, -- e.g. ["Red", "Blue"]
    position integer DEFAULT 1
);

-- 3. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    title text NOT NULL, -- e.g. "Red / Large"
    option1 text,
    option2 text,
    option3 text,
    price numeric(10,2) NOT NULL,
    compare_price numeric(10,2),
    sku text,
    barcode text,
    inventory_count integer DEFAULT 0,
    image_url text,
    position integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 1001),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id uuid, -- Link to customers table
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    fulfilment_status text DEFAULT 'unfulfilled' CHECK (fulfilment_status IN ('unfulfilled', 'partial', 'fulfilled', 'returned')),
    line_items jsonb NOT NULL DEFAULT '[]',
    subtotal_cents integer NOT NULL,
    discount_cents integer DEFAULT 0,
    shipping_cents integer DEFAULT 0,
    tax_cents integer DEFAULT 0,
    total_cents integer NOT NULL,
    currency text DEFAULT 'USD',
    shipping_address jsonb,
    billing_address jsonb,
    customer_note text,
    internal_note text,
    tags text[] DEFAULT '{}',
    discount_codes text[] DEFAULT '{}',
    tracking_number text,
    tracking_url text,
    tracking_carrier text,
    payment_gateway text,
    payment_reference text,
    refund_amount_cents integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Customers
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    total_orders integer DEFAULT 0,
    total_spent_cents integer DEFAULT 0,
    average_order_cents integer DEFAULT 0,
    tags text[] DEFAULT '{}',
    accepts_marketing boolean DEFAULT false,
    notes text,
    default_address jsonb,
    addresses jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    last_order_at timestamptz,
    UNIQUE(merchant_id, email)
);

-- 6. Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    code text NOT NULL,
    type text NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y')),
    value numeric NOT NULL,
    minimum_order_cents integer DEFAULT 0,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    per_customer_limit integer DEFAULT 1,
    applies_to text DEFAULT 'all',
    applies_to_ids uuid[] DEFAULT '{}',
    starts_at timestamptz DEFAULT now(),
    ends_at timestamptz,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(merchant_id, code)
);

-- 7. Inventory Adjustments & Reservations
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    adjustment integer NOT NULL,
    reason text NOT NULL,
    reference_id uuid,
    new_count integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL,
    session_id text NOT NULL,
    expires_at timestamptz NOT NULL,
    order_id uuid REFERENCES orders(id),
    created_at timestamptz DEFAULT now()
);

-- 8. Collections
CREATE TABLE IF NOT EXISTS collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text,
    slug text UNIQUE NOT NULL,
    type text DEFAULT 'manual' CHECK (type IN ('manual', 'smart')),
    conditions jsonb DEFAULT '[]',
    sort_order text DEFAULT 'manual',
    product_count integer DEFAULT 0,
    seo_title text,
    seo_description text,
    is_visible boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_products (
    collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    position integer DEFAULT 0,
    PRIMARY KEY (collection_id, product_id)
);
