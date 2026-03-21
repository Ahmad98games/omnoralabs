-- 9. Manual Billing & Subscription Lifecycle Engine
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS wallet_days_remaining integer DEFAULT 14,
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS billing_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id text NOT NULL,
    amount numeric NOT NULL,
    plan text NOT NULL,
    screenshot_url text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_requests_status ON billing_requests(status);
