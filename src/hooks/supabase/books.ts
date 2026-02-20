import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Book, BookInsert, BookUpdate } from '@/lib/supabase'

export function useBooks(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: ['books', page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('books')
        .select('*, authors:authors_books(author_id, authors(id, name, photo_url))', { count: 'exact' })
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      return {
        data: (data || []) as Book[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

export function useBookAuthorsList() {
  return useQuery({
    queryKey: ['book-authors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name, photo_url')
        .order('name', { ascending: true })
      if (error) throw error
      return data as { id: string; name: string; photo_url: string | null }[]
    },
    staleTime: 60_000,
  })
}

export function useBookStats() {
  return useQuery({
    queryKey: ['book-stats'],
    queryFn: async () => {
      const [totalRes, activeRes, featuredRes, digitalRes, lowStockRes] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('featured', true),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('is_digital', true),
        supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('is_digital', false)
          .lte('stock', 5),
      ])

      if (totalRes.error) throw totalRes.error
      if (activeRes.error) throw activeRes.error
      if (featuredRes.error) throw featuredRes.error
      if (digitalRes.error) throw digitalRes.error
      if (lowStockRes.error) throw lowStockRes.error

      return {
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        featured: featuredRes.count || 0,
        digital: digitalRes.count || 0,
        lowStock: lowStockRes.count || 0,
      }
    },
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (book: BookInsert) => {
      const { data, error } = await supabase.from('books').insert(book).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & BookUpdate) => {
      const { data, error } = await supabase.from('books').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('book_id', id)
      if (countError) throw countError

      if ((count || 0) > 0) {
        const { error: archiveError } = await supabase
          .from('books')
          .update({ is_active: false, featured: false })
          .eq('id', id)
        if (archiveError) throw archiveError
        return { archived: true }
      }

      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
      return { archived: false }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}

export function useToggleBookActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase.from('books').update({ is_active }).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}

export function useToggleBookFeatured() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { data, error } = await supabase.from('books').update({ featured }).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}

export function useUpdateBookStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { data, error } = await supabase.from('books').update({ stock }).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}
