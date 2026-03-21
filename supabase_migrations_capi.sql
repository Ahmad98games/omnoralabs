-- Tracking Logs for meta CAPI
CREATE TABLE IF NOT EXISTS tracking_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL,
    merchant_id text NOT NULL,
    status text NOT NULL DEFAULT 'error' CHECK (status IN ('ok', 'error')),
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_merchant ON tracking_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_event_id ON tracking_logs(event_id);
