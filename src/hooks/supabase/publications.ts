import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Publication, PublicationInsert, PublicationUpdate } from '@/lib/supabase'

export function usePublications() {
  return useQuery({
    queryKey: ['publications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('publications').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Publication[]
    },
  })
}

export function usePublicationStats() {
  return useQuery({
    queryKey: ['publication-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('publications').select('is_active, is_featured, page_count')
      if (error) throw error

      return {
        total: data?.length || 0,
        active: data?.filter((p) => p.is_active).length || 0,
        featured: data?.filter((p) => p.is_featured).length || 0,
        processed: data?.filter((p) => p.page_count && p.page_count > 0).length || 0,
      }
    },
  })
}

export function useCreatePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (publication: PublicationInsert) => {
      const { data, error } = await supabase.from('publications').insert(publication).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['publication-stats'] })
    },
  })
}

export function useUpdatePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & PublicationUpdate) => {
      const { data, error } = await supabase
        .from('publications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['publication-stats'] })
    },
  })
}

export function useDeletePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('publications').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['publication-stats'] })
    },
  })
}
