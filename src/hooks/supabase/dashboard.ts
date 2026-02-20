import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase } from '@/lib/supabase'

export function useDashboardMetrics(startDate?: string, endDate?: string) {
  const today = new Date().toISOString().slice(0, 10)
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return useQuery({
    queryKey: queryKeys.dashboard.metrics(startDate, endDate),
    queryFn: async () => {
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
