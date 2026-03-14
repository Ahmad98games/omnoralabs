-- ========================================================
-- OMNORA OS: SUPABASE SEEDING SCRIPT
-- Run this in the Supabase SQL Editor to hydrate your store.
-- ========================================================

-- 1. SEED DEFAULT MERCHANT (Admin)
-- Note: Replace the ID if you have a specific merchant ID from your Auth log.
INSERT INTO merchants (id, email, password_hash, display_name, store_slug, subscription, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'admin@omnora.com', 
    '$2a$10$StandardBcryptHashExampleReplaceWithReal', 
    'Omnora Admin', 
    'imperial-store', 
    'pro', 
    '{"firstName": "Omnora", "lastName": "Admin", "role": "admin"}'
) ON CONFLICT (id) DO NOTHING;

-- 2. SEED CORE CMS CONTENT (_site_config)
INSERT INTO store_pages (tenant_id, slug, ast_manifest, is_published)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '_site_config',
    '{
        "configuration": {
            "name": "Omnora Imperial Store",
            "colors": { "primary": "#d4af37", "secondary": "#1a1a1a" },
            "assets": { "logo": "/images/omnora.jpg", "favicon": "/favicon.ico" }
        },
        "pages": {
            "home": { "title": "Home", "heroHeadline": "Independent Luxury Reimagined" }
        }
    }',
    true
) ON CONFLICT (tenant_id, slug, is_published) DO NOTHING;

-- 3. SEED PRODUCTS (Default Collection)
INSERT INTO products (id, merchant_id, title, handle, description, base_price, product_type, status, featured_image)
VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Imperial Silk Tunic',
    'imperial-silk-tunic',
    'Hand-woven silk tunic with gold embroidery.',
    45000,
    'formal',
    'active',
    '/images/home/formal.png'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Atelier Signature Wrap',
    'atelier-signature-wrap',
    'Premium pashmina wrap with heritage motifs.',
    28000,
    'accessory',
    'active',
    '/images/home/about_2.png'
) ON CONFLICT (id) DO NOTHING;

-- 4. SEED SPECIFIC CMS PAGES (How-to-Build, Contact)
INSERT INTO store_pages (tenant_id, slug, ast_manifest, is_published)
VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    'how-to-build',
    '{
        "title": "How to Build Your Store",
        "nodes": [
            { "type": "Text", "content": "Welcome to the Omnora Building Guide. Step 1: Upload your logo..." }
        ]
    }',
    true
),
(
    '00000000-0000-0000-0000-000000000000',
    'contact',
    '{
        "title": "Contact Us",
        "nodes": [
            { "type": "Text", "content": "Reach out to the Atelier at contact@omnora.com" }
        ]
    }',
    true
) ON CONFLICT (tenant_id, slug, is_published) DO NOTHING;
