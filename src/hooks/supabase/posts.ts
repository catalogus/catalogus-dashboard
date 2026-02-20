import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post, PostInsert, PostUpdate } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type PostStatus = Database['public']['Tables']['posts']['Row']['status']
type PostCategoryMapRow = Database['public']['Tables']['post_categories_map']['Row']

export function usePosts({
  status,
  page = 1,
  pageSize = 20,
  search,
  categoryId,
  language = 'all',
  sortBy = 'newest',
}: {
  status?: string
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  language?: 'all' | 'pt' | 'en'
  sortBy?: 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'featured'
}) {
  return useQuery({
    queryKey: ['posts', status, page, pageSize, search, categoryId, language, sortBy],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('posts')
        .select('*, profiles:author_id(name, photo_url)', { count: 'exact' })
        .range(from, to)

      if (status && status !== 'all') {
        query = query.eq('status', status as PostStatus)
      }

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      if (language && language !== 'all') {
        query = query.eq('language', language)
      }

      if (categoryId && categoryId !== 'all') {
        const { data: postCategoryRows, error: mapError } = await supabase
          .from('post_categories_map')
          .select('post_id')
          .eq('category_id', categoryId)

        if (mapError) throw mapError

        const postIds = (postCategoryRows || []).map((row: Pick<PostCategoryMapRow, 'post_id'>) => row.post_id)
        if (postIds.length === 0) {
          return { data: [], totalCount: 0, totalPages: 0 }
        }
        query = query.in('id', postIds)
      }

      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'title_asc':
          query = query.order('title', { ascending: true })
          break
        case 'title_desc':
          query = query.order('title', { ascending: false })
          break
        case 'featured':
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data, totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    },
  })
}

export function usePostStats() {
  return useQuery({
    queryKey: ['post-stats'],
    queryFn: async () => {
      const [publishedRes, draftRes, trashRes, totalRes] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'trash'),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
      ])

      if (publishedRes.error) throw publishedRes.error
      if (draftRes.error) throw draftRes.error
      if (trashRes.error) throw trashRes.error
      if (totalRes.error) throw totalRes.error

      return {
        published: publishedRes.count || 0,
        draft: draftRes.count || 0,
        trash: trashRes.count || 0,
        total: totalRes.count || 0,
      }
    },
  })
}

export function usePostStatusCountsWithFilters({
  search,
  categoryId,
  language = 'all',
}: {
  search?: string
  categoryId?: string
  language?: 'all' | 'pt' | 'en'
}) {
  return useQuery({
    queryKey: ['post-status-counts-filtered', search, categoryId, language],
    queryFn: async () => {
      let filteredPostIds: string[] | undefined

      if (categoryId && categoryId !== 'all') {
        const { data: postCategoryRows, error: mapError } = await supabase
          .from('post_categories_map')
          .select('post_id')
          .eq('category_id', categoryId)

        if (mapError) throw mapError

        filteredPostIds = (postCategoryRows || []).map((row: Pick<PostCategoryMapRow, 'post_id'>) => row.post_id)
        if (filteredPostIds.length === 0) {
          return { published: 0, draft: 0, trash: 0 }
        }
      }

      const countForStatus = async (status: 'published' | 'draft' | 'trash') => {
        let query = supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', status)

        if (search) {
          query = query.ilike('title', `%${search}%`)
        }

        if (language && language !== 'all') {
          query = query.eq('language', language)
        }

        if (filteredPostIds) {
          query = query.in('id', filteredPostIds)
        }

        const { count, error } = await query
        if (error) throw error
        return count || 0
      }

      const [published, draft, trash] = await Promise.all([
        countForStatus('published'),
        countForStatus('draft'),
        countForStatus('trash'),
      ])

      return { published, draft, trash }
    },
  })
}

export function usePostCategories() {
  return useQuery({
    queryKey: ['post-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_categories').select('*').order('name')
      if (error) throw error
      return data
    },
  })
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id(name, photo_url)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function usePostCategoriesMap(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-categories-map', postId],
    queryFn: async () => {
      if (!postId) return []
      const { data, error } = await supabase.from('post_categories_map').select('category_id').eq('post_id', postId)
      if (error) throw error
      return data?.map((item: Pick<PostCategoryMapRow, 'category_id'>) => item.category_id) || []
    },
    enabled: !!postId,
  })
}

export function useAuthorsList() {
  return useQuery({
    queryKey: ['authors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, photo_url')
        .in('role', ['author', 'admin'])
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ post, categories }: { post: PostInsert; categories?: string[] }) => {
      const { data, error } = await supabase.from('posts').insert(post).select().single()
      if (error) throw error

      if (categories && categories.length > 0) {
        const categoryMappings = categories.map((catId) => ({
          post_id: data.id,
          category_id: catId,
        }))
        await supabase.from('post_categories_map').insert(categoryMappings)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, post, categories }: { id: string; post: PostUpdate; categories?: string[] }) => {
      const { data, error } = await supabase.from('posts').update(post).eq('id', id).select().single()
      if (error) throw error

      if (categories !== undefined) {
        await supabase.from('post_categories_map').delete().eq('post_id', id)
        if (categories.length > 0) {
          const categoryMappings = categories.map((catId) => ({
            post_id: id,
            category_id: catId,
          }))
          await supabase.from('post_categories_map').insert(categoryMappings)
        }
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['post-categories-map', variables.id] })
    },
  })
}

export function useBulkUpdatePosts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: PostUpdate }) => {
      const { data, error } = await supabase.from('posts').update(updates).in('id', ids).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
    },
  })
}

export function useMovePostsToTrash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, fromStatus }: { ids: string[]; fromStatus: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ status: 'trash', previous_status: fromStatus as PostStatus })
        .in('id', ids)
        .select('id')
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
    },
  })
}

export function useRestorePostsFromTrash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: selectedPosts, error: fetchError } = await supabase
        .from('posts')
        .select('id, previous_status')
        .in('id', ids)

      if (fetchError) throw fetchError

      const grouped = (selectedPosts || []).reduce((acc: Record<string, string[]>, post: Pick<Post, 'id' | 'previous_status'>) => {
        const nextStatus = post.previous_status || 'draft'
        if (!acc[nextStatus]) acc[nextStatus] = []
        acc[nextStatus].push(post.id)
        return acc
      }, {})

      for (const [status, postIds] of Object.entries(grouped)) {
        const { error } = await supabase
          .from('posts')
          .update({ status: status as PostStatus, previous_status: null })
          .in('id', postIds)
        if (error) throw error
      }

      return selectedPosts
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
    },
  })
}

export function useDeletePostsPermanently() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('posts').delete().in('id', ids)
      if (error) throw error
      return ids
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
    },
  })
}

export function useTranslatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expired. Please sign in again to translate posts.')
      }

      const { error } = await supabase.functions.invoke('translate-post', {
        body: { post_id: postId },
      })

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-stats'] })
    },
  })
}
