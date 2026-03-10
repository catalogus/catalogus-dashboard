create or replace function public.get_admin_content_dashboard_metrics(
  p_start_date date,
  p_end_date date,
  p_low_stock_threshold integer default 5
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with profile_counts as (
    select count(*)::int as new_users
    from public.profiles
    where created_at >= p_start_date::timestamptz
      and created_at < (p_end_date::timestamptz + interval '1 day')
  ),
  active_books as (
    select
      count(*)::int as active_books,
      count(*) filter (where coalesce(stock, 0) <= p_low_stock_threshold)::int as low_stock,
      count(*) filter (where is_digital is true)::int as digital_books,
      count(*) filter (where is_digital is not true)::int as physical_books,
      coalesce(
        jsonb_agg(
          jsonb_build_object('id', id, 'title', title, 'stock', coalesce(stock, 0))
          order by stock asc, title asc
        ) filter (where coalesce(stock, 0) > 0 and coalesce(stock, 0) <= p_low_stock_threshold),
        '[]'::jsonb
      ) as low_stock_books,
      coalesce(
        jsonb_agg(
          jsonb_build_object('id', id, 'title', title)
          order by title asc
        ) filter (where coalesce(stock, 0) <= 0),
        '[]'::jsonb
      ) as out_of_stock_books
    from public.books
    where is_active = true
  ),
  published_posts as (
    select count(*)::int as total_posts
    from public.posts
    where status = 'published'
  ),
  newsletter_counts as (
    select
      count(*)::int as newsletter_signups,
      count(*) filter (where status = 'verified')::int as newsletter_verified
    from public.newsletter_subscriptions
  )
  select jsonb_build_object(
    'last_updated', now(),
    'summary', jsonb_build_object(
      'revenue', 0,
      'paid_orders', 0,
      'total_orders', 0,
      'avg_order_value', 0,
      'paid_rate', 0,
      'new_customers', 0,
      'newsletter_signups', newsletter_counts.newsletter_signups,
      'newsletter_verified', newsletter_counts.newsletter_verified,
      'active_books', active_books.active_books,
      'low_stock', active_books.low_stock,
      'digital_books', active_books.digital_books,
      'physical_books', active_books.physical_books,
      'new_users', profile_counts.new_users,
      'total_posts', published_posts.total_posts
    ),
    'summary_compare', jsonb_build_object(),
    'trend', '[]'::jsonb,
    'status_breakdown', '[]'::jsonb,
    'top_books', '[]'::jsonb,
    'inventory', jsonb_build_object(
      'low_stock_books', active_books.low_stock_books,
      'out_of_stock_books', active_books.out_of_stock_books
    ),
    'recent_orders', '[]'::jsonb
  )
  from profile_counts, active_books, published_posts, newsletter_counts;
$$;

grant execute on function public.get_admin_content_dashboard_metrics(date, date, integer) to authenticated;
