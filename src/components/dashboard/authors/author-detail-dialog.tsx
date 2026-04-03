import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Author } from "@/lib/supabase"
import { getAuthorNoun, getGenderedAuthorType } from "./author-type"

type AuthorDetailDialogProps = {
  author: Author | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (author: Author) => void
  onDelete: (author: Author) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function AuthorDetailDialog({
  author,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: AuthorDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{author?.name}</DialogTitle>
          <DialogDescription>{`Detalhes d${getAuthorNoun(author?.gender).toLowerCase() === "autora" ? "a autora" : "o autor"}`}</DialogDescription>
        </DialogHeader>

        {author && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Avatar className="size-24">
                <AvatarImage src={author.photo_url || undefined} alt={author.name} />
                <AvatarFallback className="text-2xl">{author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Biografia</p>
                  <p className="text-sm mt-1">{author.bio || "-"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Tipo</p>
                <p className="text-sm mt-1">{getGenderedAuthorType(author.author_type, author.gender) || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Telefone</p>
                <p className="text-sm mt-1">{author.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Cidade</p>
                <p className="text-sm mt-1">{author.residence_city || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Província</p>
                <p className="text-sm mt-1">{author.province || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Data de Nascimento</p>
                <p className="text-sm mt-1">{author.birth_date ? formatDate(author.birth_date) : "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Perfil Vinculado</p>
                <p className="text-sm mt-1">{author.profile_id ? "Sim" : "Não"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
                <p className="text-sm mt-1">{author.featured ? "Sim" : "Não"}</p>
              </div>
            </div>

            {author.featured_video && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Vídeo em Destaque</p>
                <a
                  href={author.featured_video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-1 block"
                >
                  {author.featured_video}
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(author)}
              >
                Editar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onDelete(author)}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
