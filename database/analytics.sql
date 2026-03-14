-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  OMNORA OS — High-Fidelity Analytics Aggregator (RPC)                      ║
-- ║  Performance-Optimized PostgreSQL Logic for Cinematic Dashboards           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION get_high_fidelity_stats(p_merchant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_revenue NUMERIC;
    v_order_count BIGINT;
    v_total_views BIGINT;
    v_conversion_rate NUMERIC;
    v_daily_stats JSONB;
BEGIN
    -- 1. Aggregate Overall KPIs
    SELECT COALESCE(SUM(grand_total), 0), COUNT(*)
    INTO v_total_revenue, v_order_count
    FROM orders
    WHERE merchant_id = p_merchant_id
      AND financial_status IN ('paid', 'shipped', 'delivered', 'PAID', 'SHIPPED', 'DELIVERED');

    SELECT COUNT(*)
    INTO v_total_views
    FROM interaction_logs
    WHERE merchant_id = p_merchant_id
      AND event_type IN ('page_view', 'product_view');

    -- Calculate Conversion Rate (Orders / Unique Sessions or Views)
    -- Using views as a proxy for visitors in this simplified version
    IF v_total_views > 0 THEN
        v_conversion_rate := ROUND((v_order_count::NUMERIC / v_total_views::NUMERIC) * 100, 2);
    ELSE
        v_conversion_rate := 0;
    END IF;

    -- 2. Aggregate Daily Time-Series (Last 30 Days)
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            '1 day'::INTERVAL
        )::DATE AS d
    ),
    daily_orders AS (
        SELECT created_at::DATE AS d, SUM(grand_total) as rev, COUNT(*) as cnt
        FROM orders
        WHERE merchant_id = p_merchant_id
          AND created_at >= CURRENT_DATE - INTERVAL '29 days'
          AND financial_status IN ('paid', 'shipped', 'delivered', 'PAID', 'SHIPPED', 'DELIVERED')
        GROUP BY 1
    ),
    daily_views AS (
        SELECT created_at::DATE AS d, COUNT(*) as cnt
        FROM interaction_logs
        WHERE merchant_id = p_merchant_id
          AND created_at >= CURRENT_DATE - INTERVAL '29 days'
          AND event_type IN ('page_view', 'product_view')
        GROUP BY 1
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', ds.d,
            'revenue', COALESCE(o.rev, 0),
            'orders', COALESCE(o.cnt, 0),
            'views', COALESCE(v.cnt, 0)
        ) ORDER BY ds.d ASC
    )
    INTO v_daily_stats
    FROM date_series ds
    LEFT JOIN daily_orders o ON ds.d = o.d
    LEFT JOIN daily_views v ON ds.d = v.d;

    -- 3. Package and Return JSON
    RETURN jsonb_build_object(
        'kpis', jsonb_build_object(
            'totalRevenue', v_total_revenue,
            'orderCount', v_order_count,
            'views', v_total_views,
            'conversionRate', v_conversion_rate
        ),
        'dailyStats', v_daily_stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
