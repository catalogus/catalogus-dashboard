export const queryKeys = {
  heroSlides: {
    all: () => ['hero-slides'] as const,
    booksForHero: () => ['books-for-hero'] as const,
    authorsForHero: () => ['authors-for-hero'] as const,
    postsForHero: () => ['posts-for-hero'] as const,
  },
  posts: {
    all: (params: {
      status?: string
      page: number
      pageSize: number
      search?: string
      categoryId?: string
      language: 'all' | 'pt' | 'en'
      sortBy: 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'featured'
    }) => ['posts', params.status, params.page, params.pageSize, params.search, params.categoryId, params.language, params.sortBy] as const,
    root: () => ['posts'] as const,
    stats: () => ['post-stats'] as const,
    statusCountsFiltered: (search?: string, categoryId?: string, language: 'all' | 'pt' | 'en' = 'all') =>
      ['post-status-counts-filtered', search, categoryId, language] as const,
    categories: () => ['post-categories'] as const,
    detail: (id?: string) => ['post', id] as const,
    categoriesMap: (postId?: string) => ['post-categories-map', postId] as const,
    authorsList: () => ['authors-list'] as const,
  },
  books: {
    all: (page: number, pageSize: number, search?: string) => ['books', page, pageSize, search] as const,
    root: () => ['books'] as const,
    stats: () => ['book-stats'] as const,
    authorsList: () => ['book-authors-list'] as const,
  },
  authors: {
    all: (page: number, pageSize: number, search?: string) => ['authors', page, pageSize, search] as const,
    root: () => ['authors'] as const,
    stats: () => ['author-stats'] as const,
    unclaimed: (searchTerm?: string) => ['authors', 'unclaimed', searchTerm] as const,
    byProfile: (profileId?: string) => ['author', 'by-profile', profileId] as const,
  },
  claims: {
    all: (filter: 'all' | 'pending' | 'approved' | 'rejected') => ['author-claims', filter] as const,
    root: () => ['author-claims'] as const,
    stats: () => ['author-claim-stats'] as const,
  },
  orders: {
    all: (status?: string, page: number = 1, pageSize: number = 10, search?: string) =>
      ['orders', status, page, pageSize, search] as const,
    root: () => ['orders'] as const,
    stats: () => ['order-stats'] as const,
    mpesaStatus: (orderId?: string) => ['mpesa-status', orderId] as const,
  },
  profiles: {
    all: () => ['profiles'] as const,
    stats: () => ['profile-stats'] as const,
  },
  publications: {
    all: () => ['publications'] as const,
    stats: () => ['publication-stats'] as const,
  },
  dashboard: {
    metrics: (startDate?: string, endDate?: string) => ['dashboard-metrics', startDate, endDate] as const,
  },
  audit: {
    events: (params: {
      page: number
      pageSize: number
      action?: string
      entityType?: string
      outcome?: string
      actorId?: string
      search?: string
    }) => ['audit-events', params.page, params.pageSize, params.action, params.entityType, params.outcome, params.actorId, params.search] as const,
    root: () => ['audit-events'] as const,
  },
  auth: {
    profile: (userId?: string) => ['auth-profile', userId] as const,
    profileRoot: () => ['auth-profile'] as const,
  },
}
