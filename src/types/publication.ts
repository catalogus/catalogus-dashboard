export type DisplayMode = 'single' | 'double'

export type TableOfContentsItem = {
  title: string
  pageNumber: number
  level?: number
}

export type ProcessingStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'rendering'
  | 'completed'
  | 'error'

export type ProcessingProgress = {
  status: ProcessingStatus
  currentPage?: number
  totalPages?: number
  message?: string
  error?: string
}

export type PublicationFormValues = {
  title: string
  slug: string
  description: string
  display_mode: DisplayMode
  page_width: number
  page_height: number
  is_active: boolean
  is_featured: boolean
  publish_date: string
  seo_title: string
  seo_description: string
  table_of_contents: TableOfContentsItem[]
}
