import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Author } from "@/lib/supabase"
import { getAuthorNoun } from "./author-type"

type AuthorDeleteDialogProps = {
  author: Author | null
  open: boolean
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (author: Author) => void
}

export function AuthorDeleteDialog({
  author,
  open,
  deleting,
  onOpenChange,
  onConfirm,
}: AuthorDeleteDialogProps) {
  const authorNoun = getAuthorNoun(author?.gender)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{`Excluir ${authorNoun.toLowerCase()}`}</DialogTitle>
          <DialogDescription>
            {author
              ? `Tem certeza que deseja excluir ${authorNoun.toLowerCase() === "autora" ? "a autora" : "o autor"} "${author.name}"? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir este ${authorNoun.toLowerCase()}?`}
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
            disabled={deleting || !author}
            onClick={() => {
              if (!author) return
              onConfirm(author)
            }}
          >
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
