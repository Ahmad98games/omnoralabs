-- 🏗️ OMNORA OS: INDUSTRIAL AUTH HARDENING
-- Adding role-based access and profile fields to merchants (tenants)

-- 1. Add Role Column (Default to 'customer' for safety)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin', 'super-admin'));

-- 2. Add Full Name (Mapping to 'display_name' if needed, but adding a dedicated field for industrial clarity)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 3. Sync display_name with full_name where applicable
UPDATE merchants SET full_name = display_name WHERE full_name IS NULL;

-- 4. Add Indexes for Role-based queries
CREATE INDEX IF NOT EXISTS idx_merchants_role ON merchants(role);
