import { MoreHorizontal, FileEdit, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Author } from "@/lib/supabase"
import { getAuthorNoun, getGenderedAuthorType } from "./author-type"

type AuthorListTableProps = {
  authors: Author[]
  isLoading: boolean
  onView: (author: Author) => void
  onEdit: (author: Author) => void
  onDelete: (author: Author) => void
}

export function AuthorListTable({
  authors,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: AuthorListTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{getAuthorNoun(null)}</TableHead>
            <TableHead className="w-[150px]">Telefone</TableHead>
            <TableHead className="w-[150px]">Tipo de {getAuthorNoun(null)}</TableHead>
            <TableHead className="w-[150px]">Perfil Vinculado</TableHead>
            <TableHead className="w-[100px]">Destaque</TableHead>
            <TableHead className="w-[80px]">Acções</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Carregando...
              </TableCell>
            </TableRow>
          ) : authors.map((author) => (
            <TableRow key={author.id} className="cursor-pointer" onClick={() => onView(author)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={author.photo_url || undefined} alt={author.name} />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{author.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{author.phone || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{getGenderedAuthorType(author.author_type, author.gender) || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {author.profile_id ? (
                  <span className="text-emerald-600">Sim</span>
                ) : (
                  <span className="text-muted-foreground">Não</span>
                )}
              </TableCell>
              <TableCell>
                {author.featured ? (
                  <span className="text-emerald-600 font-medium">Sim</span>
                ) : (
                  <span className="text-muted-foreground">Não</span>
                )}
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(author)}>
                      <FileEdit className="size-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(author)}>
                      <Trash2 className="size-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && authors.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum autor encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
