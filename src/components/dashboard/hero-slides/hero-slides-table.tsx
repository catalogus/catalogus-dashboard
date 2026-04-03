import { ArrowUpDown, Eye, EyeOff, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import type { HeroSlide } from "@/lib/supabase"
import { getContentTypeLabel } from "./hero-slide-types"

type HeroSlidesTableProps = {
  slides: HeroSlide[]
  getLinkedContentName: (slide: HeroSlide) => string
  onView: (slide: HeroSlide) => void
  onEdit: (slide: HeroSlide) => void
  onDelete: (slide: HeroSlide) => void
  onToggleActive: (slide: HeroSlide) => void
}

export function HeroSlidesTable({ slides, getLinkedContentName, onView, onEdit, onDelete, onToggleActive }: HeroSlidesTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Thumbnail</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Conteúdo Ligado</TableHead>
            <TableHead className="w-[80px]">
              <div className="flex items-center gap-1">
                Ordem
                <ArrowUpDown className="size-3" />
              </div>
            </TableHead>
            <TableHead className="w-[80px]">Ativo</TableHead>
            <TableHead className="w-[60px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slides.map((slide) => (
            <TableRow key={slide.id} className="cursor-pointer" onClick={() => onView(slide)}>
              <TableCell>
                {slide.background_image_url ? (
                  <img src={slide.background_image_url} alt={slide.title} className="w-16 h-10 object-cover rounded" />
                ) : (
                  <div className="w-16 h-10 bg-muted rounded" />
                )}
              </TableCell>
              <TableCell className="font-medium">{slide.title}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {getContentTypeLabel(slide.content_type || "custom")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{getLinkedContentName(slide)}</TableCell>
              <TableCell className="text-center">{slide.order_weight ?? 0}</TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <button onClick={() => onToggleActive(slide)} className="flex justify-center w-full cursor-pointer">
                  {slide.is_active ? <Eye className="size-4 text-emerald-500" /> : <EyeOff className="size-4 text-muted-foreground" />}
                </button>
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(slide)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(slide)}>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {slides.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum slide encontrado. Clique em "Novo Slide" para adicionar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
