import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { 
  HeroSlide, HeroSlideInsert, HeroSlideUpdate, 
  BookInsert, BookUpdate, 
  Author, AuthorInsert, AuthorUpdate,
  Order, OrderUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Publication, PublicationInsert, PublicationUpdate,
  PostInsert, PostUpdate
} from '@/lib/supabase'

export function useHeroSlides() {
  return useQuery({
    queryKey: ['hero-slides'],
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
        .insert(slide as any)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
    },
  })
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & HeroSlideUpdate) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
    },
  })
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
    },
  })
}

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
        query = query.eq('status', status as any)
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

        const postIds = (postCategoryRows || []).map((row: any) => row.post_id)
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
      const { count: published, error: e1 } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
      if (e1) throw e1
      
      const { count: draft, error: e2 } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
      if (e2) throw e2
      
      const { count: trash, error: e3 } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'trash')
      if (e3) throw e3
      
      const { count: total, error: e4 } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
      if (e4) throw e4
      
      return { published: published || 0, draft: draft || 0, trash: trash || 0, total: total || 0 }
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

        filteredPostIds = (postCategoryRows || []).map((row: any) => row.post_id)
        if (filteredPostIds.length === 0) {
          return { published: 0, draft: 0, trash: 0 }
        }
      }

      const countForStatus = async (status: 'published' | 'draft' | 'trash') => {
        let query = supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('status', status)

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
      const { data, error } = await supabase
        .from('post_categories')
        .select('*')
        .order('name')
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
      const { data, error } = await supabase
        .from('post_categories_map')
        .select('category_id')
        .eq('post_id', postId)
      if (error) throw error
      return data?.map((item: any) => item.category_id) || []
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
      const { data, error } = await supabase
        .from('posts')
        .insert(post as any)
        .select()
        .single()
      if (error) throw error
      
      if (categories && categories.length > 0) {
        const categoryMappings = categories.map((catId) => ({
          post_id: data.id,
          category_id: catId,
        }))
        await supabase.from('post_categories_map').insert(categoryMappings as any)
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
      const { data, error } = await supabase
        .from('posts')
        .update(post as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      
      if (categories !== undefined) {
        await supabase.from('post_categories_map').delete().eq('post_id', id)
        if (categories.length > 0) {
          const categoryMappings = categories.map((catId) => ({
            post_id: id,
            category_id: catId,
          }))
          await supabase.from('post_categories_map').insert(categoryMappings as any)
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
      const { data, error } = await supabase
        .from('posts')
        .update(updates as any)
        .in('id', ids)
        .select()
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
        .update({ status: 'trash' as any, previous_status: fromStatus as any })
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

      const grouped = (selectedPosts || []).reduce((acc: Record<string, string[]>, post: any) => {
        const nextStatus = post.previous_status || 'draft'
        if (!acc[nextStatus]) acc[nextStatus] = []
        acc[nextStatus].push(post.id)
        return acc
      }, {})

      for (const [status, postIds] of Object.entries(grouped)) {
        const { error } = await supabase
          .from('posts')
          .update({ status: status as any, previous_status: null })
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
      const { error } = await supabase
        .from('posts')
        .delete()
        .in('id', ids)
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expired. Please sign in again to translate posts.')
      }
      
      const { error } = await supabase.functions.invoke('translate-post', {
        body: { post_id: postId }
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
      return { data: (data || []) as any[], totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
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
      const { count: total, error: e1 } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
      if (e1) throw e1
      
      const { count: active, error: e2 } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      if (e2) throw e2
      
      const { count: featured, error: e3 } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)
      if (e3) throw e3
      
      const { count: digital, error: e4 } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('is_digital', true)
      if (e4) throw e4
      
      const { count: lowStock, error: e5 } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('is_digital', false)
        .lte('stock', 5)
      if (e5) throw e5
      
      return {
        total: total || 0,
        active: active || 0,
        featured: featured || 0,
        digital: digital || 0,
        lowStock: lowStock || 0,
      }
    },
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (book: BookInsert) => {
      const { data, error } = await supabase
        .from('books')
        .insert(book as any)
        .select()
        .single()
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
      const { data, error } = await supabase
        .from('books')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
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

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)
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
      const { data, error } = await supabase
        .from('books')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()
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
      const { data, error } = await supabase
        .from('books')
        .update({ featured })
        .eq('id', id)
        .select()
        .single()
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
      const { data, error } = await supabase
        .from('books')
        .update({ stock })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })
}

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
      const { count: total, error: e1 } = await supabase
        .from('authors')
        .select('*', { count: 'exact', head: true })
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
      const { data, error } = await supabase
        .from('authors')
        .insert(author as any)
        .select()
        .single()
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
      const { data, error } = await supabase
        .from('authors')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
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
      const { error } = await supabase
        .from('authors')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] })
      queryClient.invalidateQueries({ queryKey: ['author-stats'] })
    },
  })
}

export function useOrders(
  status?: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  return useQuery({
    queryKey: ['orders', status, page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (status && status !== 'all') {
        query = query.eq('status', status as any)
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
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
      if (error) throw error
      
      return {
        total: data?.length || 0,
        paid: data?.filter((o: any) => o.status === 'paid').length || 0,
        pending: data?.filter((o: any) => o.status === 'pending' || o.status === 'processing').length || 0,
        failed: data?.filter((o: any) => o.status === 'failed' || o.status === 'cancelled').length || 0,
      }
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & OrderUpdate) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
    },
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, status')
      if (error) throw error
      
      return {
        total: data?.length || 0,
        admins: data?.filter((p: any) => p.role === 'admin').length || 0,
        authors: data?.filter((p: any) => p.role === 'author').length || 0,
        pending: data?.filter((p: any) => p.status === 'pending').length || 0,
      }
    },
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ profile, password }: { profile: ProfileInsert; password: string }) => {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: profile.email || '',
        password,
        options: {
          data: {
            name: profile.name,
            role: profile.role,
          },
        },
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')
      
      // Create profile with auth user id
      const { id: _, ...profileWithoutId } = profile as any
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          ...profileWithoutId,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

export function useAuthorClaims(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
  return useQuery({
    queryKey: ['author-claims', filter],
    queryFn: async () => {
      let query = supabase
        .from('authors')
        .select('id, name, photo_url, wp_slug, profile_id, claim_status, claimed_at, claim_reviewed_at, claim_reviewed_by, profiles!authors_profile_id_fkey(id, name, email, status, photo_url)')
        .not('claim_status', 'eq', 'unclaimed')
        .order('claimed_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('claim_status', filter)
      }

      const { data: authorsData, error } = await query
      if (error) throw error

      const claimsWithNotes = await Promise.all(
        (authorsData ?? []).map(async (author: any) => {
          if (
            author.profile_id &&
            (author.claim_status === 'pending' || author.claim_status === 'rejected')
          ) {
            const { data: claimData } = await supabase
              .from('author_claims')
              .select('id, notes, status, reviewed_at, reviewed_by')
              .eq('author_id', author.id)
              .eq('profile_id', author.profile_id)
              .eq('status', author.claim_status)
              .order('claimed_at', { ascending: false })
              .maybeSingle()

            return {
              ...author,
              claim_id: claimData?.id ?? null,
              notes: claimData?.notes ?? null,
              audit_status: claimData?.status ?? null,
              audit_reviewed_at: claimData?.reviewed_at ?? null,
              audit_reviewed_by: claimData?.reviewed_by ?? null,
            }
          }

          return {
            ...author,
            claim_id: null,
            notes: null,
            audit_status: null,
            audit_reviewed_at: null,
            audit_reviewed_by: null,
          }
        }),
      )

      return claimsWithNotes
    },
  })
}

export function useAuthorClaimStats() {
  return useQuery({
    queryKey: ['author-claim-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('claim_status')
        .not('claim_status', 'eq', 'unclaimed')
      if (error) throw error
      
      return {
        total: data?.length || 0,
        pending: data?.filter((c: any) => c.claim_status === 'pending').length || 0,
        approved: data?.filter((c: any) => c.claim_status === 'approved').length || 0,
        rejected: data?.filter((c: any) => c.claim_status === 'rejected').length || 0,
      }
    },
  })
}

export function useReviewAuthorClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      authorId,
      profileId,
      status,
      reviewerId,
    }: {
      authorId: string
      profileId: string
      status: 'approved' | 'rejected'
      reviewerId?: string | null
    }) => {
      const reviewedAt = new Date().toISOString()

      const { error: authorError } = await supabase
        .from('authors')
        .update({
          claim_status: status,
          claim_reviewed_at: reviewedAt,
          claim_reviewed_by: reviewerId ?? null,
        } as any)
        .eq('id', authorId)

      if (authorError) throw authorError

      if (status === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ status: 'approved' as any })
          .eq('id', profileId)
          .eq('status', 'pending')

        if (profileError) throw profileError
      }

      const { error: auditError } = await supabase
        .from('author_claims')
        .update({
          status,
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId ?? null,
        } as any)
        .eq('author_id', authorId)
        .eq('profile_id', profileId)
        .eq('status', 'pending')

      if (auditError) throw auditError

      return { authorId, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-claims'] })
      queryClient.invalidateQueries({ queryKey: ['author-claim-stats'] })
      queryClient.invalidateQueries({ queryKey: ['authors'] })
      queryClient.invalidateQueries({ queryKey: ['author-stats'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

export function usePublications() {
  return useQuery({
    queryKey: ['publications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Publication[]
    },
  })
}

export function usePublicationStats() {
  return useQuery({
    queryKey: ['publication-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('is_active, is_featured, page_count')
      if (error) throw error
      
      return {
        total: data?.length || 0,
        active: data?.filter((p: any) => p.is_active).length || 0,
        featured: data?.filter((p: any) => p.is_featured).length || 0,
        processed: data?.filter((p: any) => p.page_count && p.page_count > 0).length || 0,
      }
    },
  })
}

export function useCreatePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (publication: PublicationInsert) => {
      const { data, error } = await supabase
        .from('publications')
        .insert(publication as any)
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

export function useUpdatePublication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & PublicationUpdate) => {
      const { data, error } = await supabase
        .from('publications')
        .update(updates as any)
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
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['publication-stats'] })
    },
  })
}

export function useDashboardMetrics(startDate?: string, endDate?: string) {
  const today = new Date().toISOString().slice(0, 10)
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return useQuery({
    queryKey: ['dashboard-metrics', startDate, endDate],
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

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ 
      file, 
      bucket = 'post-images',
      folder = ''
    }: { 
      file: File
      bucket?: string
      folder?: string
    }) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder ? `${folder}/` : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      
      return publicUrl
    },
  })
}

export function useBooksForHero() {
  return useQuery({
    queryKey: ['books-for-hero'],
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
    queryKey: ['authors-for-hero'],
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
    queryKey: ['posts-for-hero'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, featured_image_url')
        .eq('status', 'published')
        .order('title', { ascending: true })
      if (error) throw error
      return data as { id: string; title: string; slug: string | null; featured_image_url: string | null }[]
    },
    staleTime: 60_000,
  })
}
