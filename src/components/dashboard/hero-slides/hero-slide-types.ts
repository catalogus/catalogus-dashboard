import type { HeroSlide } from "@/lib/supabase"

export type ContentType = "book" | "author" | "post" | "custom"

export type HeroSlideFormValues = {
  title: string
  subtitle: string
  description: string
  cta_text: string
  cta_url: string
  background_image_url: string
  background_image_path: string
  accent_color: string
  content_type: ContentType
  content_id: string
  order_weight: number
  is_active: boolean
}

export type HeroBookOption = { id: string; title: string; cover_url: string | null }
export type HeroAuthorOption = { id: string; name: string; photo_url: string | null }
export type HeroPostOption = { id: string; title: string; slug: string | null; featured_image_url: string | null }
export type HeroContentOption = HeroBookOption | HeroAuthorOption | HeroPostOption

export const defaultHeroSlideFormValues: HeroSlideFormValues = {
  title: "",
  subtitle: "",
  description: "",
  cta_text: "",
  cta_url: "",
  background_image_url: "",
  background_image_path: "",
  accent_color: "",
  content_type: "custom",
  content_id: "",
  order_weight: 0,
  is_active: true,
}

export function createHeroSlideFormValues(slide?: HeroSlide | null): HeroSlideFormValues {
  if (!slide) return defaultHeroSlideFormValues

  return {
    title: slide.title,
    subtitle: slide.subtitle || "",
    description: slide.description || "",
    cta_text: slide.cta_text || "",
    cta_url: slide.cta_url || "",
    background_image_url: slide.background_image_url || "",
    background_image_path: slide.background_image_path || "",
    accent_color: slide.accent_color || "",
    content_type: (slide.content_type as ContentType) || "custom",
    content_id: slide.content_id || "",
    order_weight: slide.order_weight ?? 0,
    is_active: slide.is_active ?? true,
  }
}

export function getContentTypeLabel(type: string) {
  switch (type) {
    case "book":
      return "Livro"
    case "author":
      return "Autor"
    case "post":
      return "Artigo"
    default:
      return "Personalizado"
  }
}

export function formatHeroSlideDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getLinkedContentName(
  slide: HeroSlide,
  books?: HeroBookOption[],
  authors?: HeroAuthorOption[],
  posts?: HeroPostOption[],
) {
  if (slide.content_type === "custom" || !slide.content_id) return "-"

  if (slide.content_type === "book") {
    const book = books?.find((item) => item.id === slide.content_id)
    return book?.title ?? "Desconhecido"
  }

  if (slide.content_type === "author") {
    const author = authors?.find((item) => item.id === slide.content_id)
    return author?.name ?? "Desconhecido"
  }

  if (slide.content_type === "post") {
    const post = posts?.find((item) => item.id === slide.content_id)
    return post?.title ?? "Desconhecido"
  }

  return "-"
}
