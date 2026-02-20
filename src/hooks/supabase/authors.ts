import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Author, AuthorInsert, AuthorUpdate } from '@/lib/supabase'

export function useAuthors(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: ['authors', page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('authors')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: data as Author[], totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    },
  })
}

export function useAuthorStats() {
  return useQuery({
    queryKey: ['author-stats'],
    queryFn: async () => {
      const { count: total, error: e1 } = await supabase.from('authors').select('*', { count: 'exact', head: true })
      if (e1) throw e1

      const { count: featured, error: e2 } = await supabase
        .from('authors')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)
      if (e2) throw e2

      const { count: linkedProfiles, error: e3 } = await supabase
        .from('authors')
        .select('*', { count: 'exact', head: true })
        .not('profile_id', 'is', null)
      if (e3) throw e3

      const { count: pendingClaims, error: e4 } = await supabase
        .from('authors')
        .select('*', { count: 'exact', head: true })
        .eq('claim_status', 'pending')
      if (e4) throw e4

      return {
        total: total || 0,
        featured: featured || 0,
        linkedProfiles: linkedProfiles || 0,
        pendingClaims: pendingClaims || 0,
      }
    },
  })
}

export function useCreateAuthor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (author: AuthorInsert) => {
      const { data, error } = await supabase.from('authors').insert(author).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] })
      queryClient.invalidateQueries({ queryKey: ['author-stats'] })
    },
  })
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & AuthorUpdate) => {
      const { data, error } = await supabase.from('authors').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] })
      queryClient.invalidateQueries({ queryKey: ['author-stats'] })
    },
  })
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('authors').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] })
      queryClient.invalidateQueries({ queryKey: ['author-stats'] })
    },
  })
}
