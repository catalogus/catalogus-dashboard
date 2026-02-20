import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AuditEvent } from '@/lib/supabase'

export function useAuditEvents({
  page = 1,
  pageSize = 25,
  action,
  entityType,
  outcome,
  actorId,
  search,
}: {
  page?: number
  pageSize?: number
  action?: string
  entityType?: string
  outcome?: string
  actorId?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['audit-events', page, pageSize, action, entityType, outcome, actorId, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('audit_events')
        .select('*', { count: 'exact' })
        .order('occurred_at', { ascending: false })
        .range(from, to)

      if (action && action !== 'all') {
        query = query.eq('action', action)
      }

      if (entityType && entityType !== 'all') {
        query = query.eq('entity_type', entityType)
      }

      if (outcome && outcome !== 'all') {
        query = query.eq('outcome', outcome)
      }

      if (actorId && actorId !== 'all') {
        query = query.eq('actor_id', actorId)
      }

      const term = search?.trim()
      if (term) {
        query = query.or(
          `summary.ilike.%${term}%,action.ilike.%${term}%,entity_type.ilike.%${term}%,actor_name.ilike.%${term}%`,
        )
      }

      const { data, error, count } = await query
      if (error) throw error

      return {
        data: (data ?? []) as AuditEvent[],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    },
  })
}

export function usePurgeAuditEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (days: number = 90) => {
      const { data, error } = await supabase.rpc('purge_old_audit_events', { p_days: days })
      if (error) throw error
      return data as number
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    },
  })
}
