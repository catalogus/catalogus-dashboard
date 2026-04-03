import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { HeroSlide } from "@/lib/supabase"

type HeroSlideDeleteDialogProps = {
  slide: HeroSlide | null
  open: boolean
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (slide: HeroSlide) => void
}

export function HeroSlideDeleteDialog({ slide, open, deleting, onOpenChange, onConfirm }: HeroSlideDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir slide</DialogTitle>
          <DialogDescription>
            {slide
              ? `Tem certeza que deseja excluir o slide "${slide.title}"? Esta ação não pode ser desfeita.`
              : "Tem certeza que deseja excluir este slide?"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={deleting || !slide}
            onClick={() => {
              if (!slide) return
              onConfirm(slide)
            }}
          >
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
