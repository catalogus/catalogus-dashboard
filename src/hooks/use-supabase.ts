import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { 
  HeroSlide, HeroSlideInsert, HeroSlideUpdate, 
  Book, BookInsert, BookUpdate, 
  Author, AuthorInsert, AuthorUpdate,
  Order, OrderUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Publication, PublicationInsert, PublicationUpdate,
  PostInsert, PostUpdate,
  AuthorClaimUpdate
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

export function usePosts(status?: string, page: number = 1, pageSize: number = 20, search?: string) {
  return useQuery({
    queryKey: ['posts', status, page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      let query = supabase
        .from('posts')
        .select('*, profiles:author_id(name, photo_url)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (status && status !== 'all') {
        query = query.eq('status', status as any)
      }
      
      if (search) {
        query = query.ilike('title', `%${search}%`)
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

export function useBooks(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: ['books', page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (search) {
        query = query.ilike('title', `%${search}%`)
      }
      
      const { data, error, count } = await query
      if (error) throw error
      return { data: data as Book[], totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    },
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
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)
      if (error) throw error
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

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (status && status !== 'all') {
        query = query.eq('status', status as any)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as Order[]
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

export function useAuthorClaims() {
  return useQuery({
    queryKey: ['author-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_claims')
        .select('*, authors(name, photo_url), profiles(name, photo_url)')
        .order('claimed_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAuthorClaimStats() {
  return useQuery({
    queryKey: ['author-claim-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_claims')
        .select('status')
      if (error) throw error
      
      return {
        total: data?.length || 0,
        pending: data?.filter((c: any) => c.status === 'pending').length || 0,
        approved: data?.filter((c: any) => c.status === 'approved').length || 0,
        rejected: data?.filter((c: any) => c.status === 'rejected').length || 0,
      }
    },
  })
}

export function useUpdateAuthorClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & AuthorClaimUpdate) => {
      const { data, error } = await supabase
        .from('author_claims')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-claims'] })
      queryClient.invalidateQueries({ queryKey: ['author-claim-stats'] })
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
  return useQuery({
    queryKey: ['dashboard-metrics', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_metrics', {
        p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
      })
      if (error) throw error
      return data
    },
  })
}
