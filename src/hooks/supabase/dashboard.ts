import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase } from '@/lib/supabase'

export function useDashboardMetrics(startDate?: string, endDate?: string, includeCommerce = true) {
  const today = new Date().toISOString().slice(0, 10)
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return useQuery({
    queryKey: [...queryKeys.dashboard.metrics(startDate, endDate), includeCommerce],
    queryFn: async () => {
      if (!includeCommerce) {
        const [profilesResult, booksResult, postsResult, newsletterResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, created_at')
            .gte('created_at', startDate || defaultStart)
            .lte('created_at', endDate || today),
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
            low_stock: books.filter((book) => (book.stock ?? 0) <= 5).length,
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
              .filter((book) => (book.stock ?? 0) > 0 && (book.stock ?? 0) <= 5)
              .map((book) => ({ id: book.id, title: book.title, stock: book.stock ?? 0 })),
            out_of_stock_books: books
              .filter((book) => (book.stock ?? 0) <= 0)
              .map((book) => ({ id: book.id, title: book.title })),
          },
          recent_orders: [],
        }
      }

      const { data, error } = await supabase.rpc('get_admin_dashboard_metrics', {
        p_start_date: startDate || defaultStart,
        p_end_date: endDate || today,
        p_timezone: 'Africa/Maputo',
        p_low_stock_threshold: 5,
        p_top_books_limit: 5,
        p_recent_orders_limit: 6,
      })
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}
