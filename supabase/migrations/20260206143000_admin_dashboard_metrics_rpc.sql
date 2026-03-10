-- Admin Dashboard Metrics RPC Function
-- Created: 2026-02-06
-- Description: Aggregate KPI metrics for the admin dashboard in a single call

CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(
  p_start_date date,
  p_end_date date,
  p_timezone text default 'Africa/Maputo',
  p_low_stock_threshold int default 5,
  p_top_books_limit int default 5,
  p_recent_orders_limit int default 6
)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH params AS (
  SELECT
    p_start_date AS start_date,
    p_end_date AS end_date,
    (p_end_date - p_start_date + 1)::int AS days,
    (p_start_date - 1) AS prev_end_date,
    (p_start_date - (p_end_date - p_start_date + 1)) AS prev_start_date,
    p_timezone AS tz,
    p_low_stock_threshold AS low_stock_threshold,
    p_top_books_limit AS top_books_limit,
    p_recent_orders_limit AS recent_orders_limit
),
bounds AS (
  SELECT
    *,
    (start_date::timestamp AT TIME ZONE tz) AS start_ts,
    ((end_date + 1)::timestamp AT TIME ZONE tz) AS end_ts_excl,
    (prev_start_date::timestamp AT TIME ZONE tz) AS prev_start_ts,
    ((prev_end_date + 1)::timestamp AT TIME ZONE tz) AS prev_end_ts_excl
  FROM params
),
orders_current AS (
  SELECT o.*
  FROM orders o, bounds b
  WHERE o.created_at >= b.start_ts AND o.created_at < b.end_ts_excl
),
orders_prev AS (
  SELECT o.*
  FROM orders o, bounds b
  WHERE o.created_at >= b.prev_start_ts AND o.created_at < b.prev_end_ts_excl
),
paid_current AS (
  SELECT * FROM orders_current WHERE status = 'paid'
),
paid_prev AS (
  SELECT * FROM orders_prev WHERE status = 'paid'
),
customer_first_order AS (
  SELECT
    COALESCE(customer_id::text, LOWER(customer_email)) AS customer_key,
    MIN(created_at) AS first_order_at
  FROM orders
  GROUP BY 1
),
new_customers_current AS (
  SELECT COUNT(*)::int AS count
  FROM customer_first_order c, bounds b
  WHERE c.first_order_at >= b.start_ts AND c.first_order_at < b.end_ts_excl
),
new_customers_prev AS (
  SELECT COUNT(*)::int AS count
  FROM customer_first_order c, bounds b
  WHERE c.first_order_at >= b.prev_start_ts AND c.first_order_at < b.prev_end_ts_excl
),
newsletter_current AS (
  SELECT
    COUNT(*)::int AS signups,
    COUNT(*) FILTER (WHERE status = 'verified')::int AS verified
  FROM newsletter_subscriptions n, bounds b
  WHERE n.created_at >= b.start_ts AND n.created_at < b.end_ts_excl
),
newsletter_prev AS (
  SELECT
    COUNT(*)::int AS signups,
    COUNT(*) FILTER (WHERE status = 'verified')::int AS verified
  FROM newsletter_subscriptions n, bounds b
  WHERE n.created_at >= b.prev_start_ts AND n.created_at < b.prev_end_ts_excl
),
summary_current AS (
  SELECT
    COALESCE(SUM(p.total), 0)::numeric AS revenue,
    COUNT(p.*)::int AS paid_orders,
    COUNT(o.*)::int AS total_orders
  FROM orders_current o
  LEFT JOIN paid_current p ON p.id = o.id
),
summary_prev AS (
  SELECT
    COALESCE(SUM(p.total), 0)::numeric AS revenue,
    COUNT(p.*)::int AS paid_orders,
    COUNT(o.*)::int AS total_orders
  FROM orders_prev o
  LEFT JOIN paid_prev p ON p.id = o.id
),
books_summary AS (
  SELECT
    COUNT(*) FILTER (WHERE is_active = true)::int AS active_books,
    COUNT(*) FILTER (WHERE is_active = true AND is_digital = true)::int AS digital_books,
    COUNT(*) FILTER (WHERE is_active = true AND is_digital = false)::int AS physical_books,
    COUNT(*) FILTER (
      WHERE is_active = true AND is_digital = false AND stock <= (SELECT low_stock_threshold FROM bounds)
    )::int AS low_stock,
    COUNT(*) FILTER (
      WHERE is_active = true AND is_digital = false AND stock = 0
    )::int AS out_of_stock
  FROM books
),
status_list AS (
  SELECT UNNEST(enum_range(NULL::order_status))::text AS status
),
status_counts AS (
  SELECT s.status, COALESCE(COUNT(o.*), 0)::int AS count
  FROM status_list s
  LEFT JOIN orders_current o ON o.status::text = s.status
  GROUP BY s.status
),
trend AS (
  SELECT
    d.day::date AS date,
    COALESCE(t.revenue, 0)::numeric AS revenue,
    COALESCE(t.paid_orders, 0)::int AS paid_orders,
    COALESCE(t.total_orders, 0)::int AS total_orders
  FROM (
    SELECT generate_series(
      (SELECT start_date FROM bounds),
      (SELECT end_date FROM bounds),
      interval '1 day'
    )::date AS day
  ) d
  LEFT JOIN (
    SELECT
      (o.created_at AT TIME ZONE (SELECT tz FROM bounds))::date AS day,
      COUNT(*) FILTER (WHERE o.status = 'paid')::int AS paid_orders,
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(o.total) FILTER (WHERE o.status = 'paid'), 0)::numeric AS revenue
    FROM orders_current o
    GROUP BY 1
  ) t ON t.day = d.day
),
top_books AS (
  SELECT
    b.id AS book_id,
    b.title,
    COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue,
    b.stock,
    b.is_digital
  FROM order_items oi
  JOIN orders_current o ON o.id = oi.order_id AND o.status = 'paid'
  JOIN books b ON b.id = oi.book_id
  GROUP BY b.id
  ORDER BY revenue DESC, units_sold DESC
  LIMIT (SELECT top_books_limit FROM bounds)
),
low_stock_books AS (
  SELECT id, title, stock, cover_url, is_digital
  FROM books, bounds b
  WHERE is_active = true AND is_digital = false AND stock <= b.low_stock_threshold
  ORDER BY stock ASC, title ASC
  LIMIT 10
),
out_of_stock_books AS (
  SELECT id, title, stock, cover_url, is_digital
  FROM books
  WHERE is_active = true AND is_digital = false AND stock = 0
  ORDER BY title ASC
  LIMIT 10
),
recent_orders AS (
  SELECT id, order_number, customer_name, status::text AS status, total, created_at
  FROM orders_current
  ORDER BY created_at DESC
  LIMIT (SELECT recent_orders_limit FROM bounds)
)
SELECT json_build_object(
  'last_updated', NOW(),
  'range', json_build_object(
    'start_date', (SELECT start_date FROM bounds),
    'end_date', (SELECT end_date FROM bounds),
    'days', (SELECT days FROM bounds),
    'timezone', (SELECT tz FROM bounds)
  ),
  'compare_range', json_build_object(
    'start_date', (SELECT prev_start_date FROM bounds),
    'end_date', (SELECT prev_end_date FROM bounds),
    'days', (SELECT days FROM bounds)
  ),
  'summary', json_build_object(
    'revenue', (SELECT revenue FROM summary_current),
    'paid_orders', (SELECT paid_orders FROM summary_current),
    'total_orders', (SELECT total_orders FROM summary_current),
    'avg_order_value', CASE
      WHEN (SELECT paid_orders FROM summary_current) > 0
        THEN (SELECT revenue FROM summary_current) / (SELECT paid_orders FROM summary_current)
      ELSE NULL
    END,
    'paid_rate', CASE
      WHEN (SELECT total_orders FROM summary_current) > 0
        THEN (SELECT paid_orders FROM summary_current)::numeric / (SELECT total_orders FROM summary_current)
      ELSE NULL
    END,
    'new_customers', (SELECT count FROM new_customers_current),
    'newsletter_signups', (SELECT signups FROM newsletter_current),
    'newsletter_verified', (SELECT verified FROM newsletter_current),
    'active_books', (SELECT active_books FROM books_summary),
    'low_stock', (SELECT low_stock FROM books_summary),
    'out_of_stock', (SELECT out_of_stock FROM books_summary),
    'digital_books', (SELECT digital_books FROM books_summary),
    'physical_books', (SELECT physical_books FROM books_summary)
  ),
  'summary_compare', json_build_object(
    'revenue', (SELECT revenue FROM summary_prev),
    'paid_orders', (SELECT paid_orders FROM summary_prev),
    'total_orders', (SELECT total_orders FROM summary_prev),
    'avg_order_value', CASE
      WHEN (SELECT paid_orders FROM summary_prev) > 0
        THEN (SELECT revenue FROM summary_prev) / (SELECT paid_orders FROM summary_prev)
      ELSE NULL
    END,
    'paid_rate', CASE
      WHEN (SELECT total_orders FROM summary_prev) > 0
        THEN (SELECT paid_orders FROM summary_prev)::numeric / (SELECT total_orders FROM summary_prev)
      ELSE NULL
    END,
    'new_customers', (SELECT count FROM new_customers_prev),
    'newsletter_signups', (SELECT signups FROM newsletter_prev),
    'newsletter_verified', (SELECT verified FROM newsletter_prev)
  ),
  'trend', COALESCE((SELECT json_agg(trend ORDER BY date) FROM trend), '[]'::json),
  'status_breakdown', COALESCE((SELECT json_agg(status_counts ORDER BY status) FROM status_counts), '[]'::json),
  'top_books', COALESCE((SELECT json_agg(top_books) FROM top_books), '[]'::json),
  'inventory', json_build_object(
    'low_stock_books', COALESCE((SELECT json_agg(low_stock_books) FROM low_stock_books), '[]'::json),
    'out_of_stock_books', COALESCE((SELECT json_agg(out_of_stock_books) FROM out_of_stock_books), '[]'::json),
    'digital_count', (SELECT digital_books FROM books_summary),
    'physical_count', (SELECT physical_books FROM books_summary)
  ),
  'recent_orders', COALESCE((SELECT json_agg(recent_orders) FROM recent_orders), '[]'::json)
);
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics(date, date, text, int, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics(date, date, text, int, int, int) TO service_role;

COMMENT ON FUNCTION get_admin_dashboard_metrics(date, date, text, int, int, int) IS
  'Returns aggregated KPI metrics for the admin dashboard in a single JSON payload.';
