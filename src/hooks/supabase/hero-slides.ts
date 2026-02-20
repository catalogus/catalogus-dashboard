import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HeroSlide, HeroSlideInsert, HeroSlideUpdate } from '@/lib/supabase'
import { queryKeys } from '@/hooks/supabase/query-keys'

export function useHeroSlides() {
  return useQuery({
    queryKey: queryKeys.heroSlides.all(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('order_weight', { ascending: true })
      if (error) throw error
      return data as HeroSlide[]
    },
  })
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (slide: HeroSlideInsert) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .insert(slide)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides.all() })
    },
  })
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & HeroSlideUpdate) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides.all() })
    },
  })
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides.all() })
    },
  })
}

export function useBooksForHero() {
  return useQuery({
    queryKey: queryKeys.heroSlides.booksForHero(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, cover_url')
        .order('title', { ascending: true })
      if (error) throw error
      return data as { id: string; title: string; cover_url: string | null }[]
    },
    staleTime: 60_000,
  })
}

export function useAuthorsForHero() {
  return useQuery({
    queryKey: queryKeys.heroSlides.authorsForHero(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name, photo_url')
        .eq('featured', true)
        .order('name', { ascending: true })
      if (error) throw error
      return data as { id: string; name: string; photo_url: string | null }[]
    },
    staleTime: 60_000,
  })
}

export function usePostsForHero() {
  return useQuery({
    queryKey: queryKeys.heroSlides.postsForHero(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, featured_image_url')
        .eq('status', 'published')
        .order('title', { ascending: true })
      if (error) throw error
      return data as {
        id: string
        title: string
        slug: string | null
        featured_image_url: string | null
      }[]
    },
    staleTime: 60_000,
  })
}
