import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { HeroSlide } from "@/lib/supabase"
import { formatHeroSlideDate, getContentTypeLabel } from "./hero-slide-types"

type HeroSlideDetailDialogProps = {
  slide: HeroSlide | null
  open: boolean
  getLinkedContentName: (slide: HeroSlide) => string
  onOpenChange: (open: boolean) => void
  onEdit: (slide: HeroSlide) => void
  onDelete: (slide: HeroSlide) => void
}

export function HeroSlideDetailDialog({ slide, open, getLinkedContentName, onOpenChange, onEdit, onDelete }: HeroSlideDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{slide?.title}</DialogTitle>
          <DialogDescription>Detalhes do slide</DialogDescription>
        </DialogHeader>

        {slide && (
          <div className="space-y-4">
            {slide.background_image_url && (
              <div className="rounded-lg overflow-hidden">
                <img src={slide.background_image_url} alt={slide.title} className="w-full h-48 object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Subtítulo</p>
                <p className="text-sm mt-1">{slide.subtitle || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Tipo de Conteúdo</p>
                <p className="text-sm mt-1">{getContentTypeLabel(slide.content_type || "custom")}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Conteúdo Ligado</p>
              <p className="text-sm mt-1">{getLinkedContentName(slide)}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Descrição</p>
              <p className="text-sm mt-1">{slide.description || "-"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Texto do Botão</p>
                <p className="text-sm mt-1">{slide.cta_text || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">URL do Botão</p>
                {slide.cta_url ? (
                  <a href={slide.cta_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                    {slide.cta_url}
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <p className="text-sm mt-1">-</p>
                )}
              </div>
            </div>

            {slide.accent_color && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Cor de Destaque</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: slide.accent_color }} />
                    <p className="text-sm">{slide.accent_color}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Ordem</p>
                <p className="text-sm mt-1">{slide.order_weight ?? 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                <Badge variant={slide.is_active ? "default" : "secondary"} className="mt-1">
                  {slide.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Criado em</p>
                <p className="text-sm mt-1">{formatHeroSlideDate(slide.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => onEdit(slide)}>Editar</Button>
              <Button variant="destructive" className="flex-1" onClick={() => onDelete(slide)}>Excluir</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
