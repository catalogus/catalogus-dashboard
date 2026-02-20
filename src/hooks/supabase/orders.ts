import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase } from '@/lib/supabase'
import { logAuditEvent } from '@/lib/audit'
import type { Order, OrderUpdate } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type OrderStatus = Database['public']['Enums']['order_status']

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return fallback
}

export function useOrders(
  status?: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  return useQuery({
    queryKey: queryKeys.orders.all(status, page, pageSize, search),
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (status && status !== 'all') {
        query = query.eq('status', status as OrderStatus)
      }

      if (search) {
        const term = search.trim()
        if (term) {
          query = query.or(
            `customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,order_number.ilike.%${term}%`,
          )
        }
      }

      const { data, error, count } = await query
      if (error) throw error
      return {
        data: data as Order[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

export function useOrderStats() {
  return useQuery({
    queryKey: queryKeys.orders.stats(),
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('status')
      if (error) throw error

      return {
        total: data?.length || 0,
        paid: data?.filter((o) => o.status === 'paid').length || 0,
        pending: data?.filter((o) => o.status === 'pending' || o.status === 'processing').length || 0,
        failed: data?.filter((o) => o.status === 'failed' || o.status === 'cancelled').length || 0,
      }
    },
  })
}

export type MpesaTransactionStatus = {
  completed_at: string
  created_at: string
  result_desc: string
  status: string
  transaction_id: string
}

export function useMpesaTransactionStatus(orderId?: string) {
  return useQuery({
    queryKey: queryKeys.orders.mpesaStatus(orderId),
    queryFn: async () => {
      if (!orderId) return [] as MpesaTransactionStatus[]

      const { data, error } = await supabase.rpc('get_mpesa_transaction_status', {
        p_order_id: orderId,
      })

      if (error) throw error
      return (data ?? []) as MpesaTransactionStatus[]
    },
    enabled: !!orderId,
    staleTime: 30_000,
  })
}

export function useRefreshMpesaStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('mpesa-admin', {
        body: { action: 'status', orderId },
      })

      if (error) throw error
      if (!data?.success) {
        throw new Error(data?.message || 'Falha ao actualizar estado M-Pesa')
      }

      return data as { success: boolean; message?: string }
    },
    onSuccess: async (data, orderId) => {
      await logAuditEvent({
        action: 'payment.mpesa_status_checked',
        entityType: 'orders',
        entityId: orderId,
        outcome: 'success',
        summary: data?.message || 'Estado M-Pesa actualizado',
        changedFields: ['mpesa_last_response'],
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.root() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.mpesaStatus(orderId) })
    },
    onError: async (error: unknown, orderId) => {
      await logAuditEvent({
        action: 'payment.mpesa_status_checked',
        entityType: 'orders',
        entityId: orderId,
        outcome: 'error',
        summary: getErrorMessage(error, 'Falha ao actualizar estado M-Pesa'),
      })
    },
  })
}

export function useReverseMpesaTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, amount }: { orderId: string; amount?: number }) => {
      const { data, error } = await supabase.functions.invoke('mpesa-admin', {
        body: { action: 'reverse', orderId, amount },
      })

      if (error) throw error
      if (!data?.success) {
        throw new Error(data?.message || 'Falha ao reverter transaccao M-Pesa')
      }

      return data as { success: boolean; message?: string }
    },
    onSuccess: async (data, variables) => {
      await logAuditEvent({
        action: 'payment.mpesa_reverse_requested',
        entityType: 'orders',
        entityId: variables.orderId,
        outcome: 'success',
        summary: data?.message || 'Pedido de reversao M-Pesa enviado',
        meta: {
          amount: variables.amount ?? null,
        },
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.root() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.mpesaStatus(variables.orderId) })
    },
    onError: async (error: unknown, variables) => {
      await logAuditEvent({
        action: 'payment.mpesa_reverse_requested',
        entityType: 'orders',
        entityId: variables.orderId,
        outcome: 'error',
        summary: getErrorMessage(error, 'Falha ao solicitar reversao M-Pesa'),
        meta: {
          amount: variables.amount ?? null,
        },
      })
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & OrderUpdate) => {
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.root() })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() })
    },
  })
}
