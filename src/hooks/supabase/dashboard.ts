import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase } from '@/lib/supabase'

async function fetchContentDashboardMetricsViaQueries(startDate: string, endDate: string, lowStockThreshold: number) {
  const [profilesResult, booksResult, postsResult, newsletterResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('books')
      .select('id, title, stock, is_active, is_digital')
      .eq('is_active', true),
    supabase
      .from('posts')
      .select('id')
      .eq('status', 'published'),
    supabase
      .from('newsletter_subscriptions')
      .select('id, status'),
  ])

  if (profilesResult.error) throw profilesResult.error
  if (booksResult.error) throw booksResult.error
  if (postsResult.error) throw postsResult.error
  if (newsletterResult.error) throw newsletterResult.error

  const books = booksResult.data ?? []

  return {
    last_updated: new Date().toISOString(),
    summary: {
      revenue: 0,
      paid_orders: 0,
      total_orders: 0,
      avg_order_value: 0,
      paid_rate: 0,
      new_customers: 0,
      newsletter_signups: (newsletterResult.data ?? []).length,
      newsletter_verified: (newsletterResult.data ?? []).filter((item) => item.status === 'verified').length,
      active_books: books.length,
      low_stock: books.filter((book) => (book.stock ?? 0) <= lowStockThreshold).length,
      digital_books: books.filter((book) => book.is_digital).length,
      physical_books: books.filter((book) => !book.is_digital).length,
      new_users: (profilesResult.data ?? []).length,
      total_posts: (postsResult.data ?? []).length,
    },
    summary_compare: {},
    trend: [],
    status_breakdown: [],
    top_books: [],
    inventory: {
      low_stock_books: books
        .filter((book) => (book.stock ?? 0) > 0 && (book.stock ?? 0) <= lowStockThreshold)
        .map((book) => ({ id: book.id, title: book.title, stock: book.stock ?? 0 })),
      out_of_stock_books: books
        .filter((book) => (book.stock ?? 0) <= 0)
        .map((book) => ({ id: book.id, title: book.title })),
    },
    recent_orders: [],
  }
}

function isMissingRpc(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error && typeof error.code === 'string' ? error.code : null
  const message = 'message' in error && typeof error.message === 'string' ? error.message : ''

  return code === 'PGRST202' || message.includes('get_admin_content_dashboard_metrics')
}

export function useDashboardMetrics(startDate?: string, endDate?: string, includeCommerce = true) {
  const today = new Date().toISOString().slice(0, 10)
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const lowStockThreshold = 5

  return useQuery({
    queryKey: [...queryKeys.dashboard.metrics(startDate, endDate), includeCommerce],
    queryFn: async () => {
      if (!includeCommerce) {
        const resolvedStart = startDate || defaultStart
        const resolvedEnd = endDate || today

        const { data, error } = await supabase.rpc('get_admin_content_dashboard_metrics', {
          p_start_date: resolvedStart,
          p_end_date: resolvedEnd,
          p_low_stock_threshold: lowStockThreshold,
        })

        if (error) {
          if (!isMissingRpc(error)) throw error

          return fetchContentDashboardMetricsViaQueries(resolvedStart, resolvedEnd, lowStockThreshold)
        }

        return data
      }

      const { data, error } = await supabase.rpc('get_admin_dashboard_metrics', {
        p_start_date: startDate || defaultStart,
        p_end_date: endDate || today,
        p_timezone: 'Africa/Maputo',
        p_low_stock_threshold: lowStockThreshold,
        p_top_books_limit: 5,
        p_recent_orders_limit: 6,
      })
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}
