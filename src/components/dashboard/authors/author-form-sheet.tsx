import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Author } from "@/lib/supabase"
import { toast } from "sonner"
import {
  AUTHOR_GENDER_OPTIONS,
  AUTHOR_TYPE_OPTIONS,
  CUSTOM_AUTHOR_TYPE_VALUE,
  getAuthorNoun,
  getFeaturedAuthorLabel,
  getGenderedAuthorType,
  isPresetAuthorType,
  normalizeAuthorGender,
  normalizeAuthorType,
  type AuthorGender,
} from "./author-type"

export type AuthorFormValues = {
  name: string
  phone: string | null
  bio: string | null
  birth_date: string | null
  residence_city: string | null
  province: string | null
  featured_video: string | null
  featured: boolean
  gender: AuthorGender | null
  author_type: string | null
}

type AuthorFormSheetProps = {
  author: Author | null
  open: boolean
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AuthorFormValues, photoFile: File | null) => Promise<void>
  resolvePhotoUrl: (photoUrl: string | null, photoPath: string | null) => string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function AuthorFormSheet({
  author,
  open,
  submitting,
  onOpenChange,
  onSubmit,
  resolvePhotoUrl,
}: AuthorFormSheetProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [featured, setFeatured] = useState(false)
  const [gender, setGender] = useState<AuthorGender | "">("")
  const [selectedAuthorType, setSelectedAuthorType] = useState("")
  const [customAuthorType, setCustomAuthorType] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const normalizedType = normalizeAuthorType(author?.author_type)
    setName(author?.name || "")
    setPhone(author?.phone || "")
    setBio(author?.bio || "")
    setBirthDate(author?.birth_date || "")
    setCity(author?.residence_city || "")
    setProvince(author?.province || "")
    setVideoUrl(author?.featured_video || "")
    setFeatured(author?.featured || false)
    setGender(normalizeAuthorGender(author?.gender) || "")
    setPhotoFile(null)
    setPhotoPreview(resolvePhotoUrl(author?.photo_url || null, author?.photo_path || null))

    if (!normalizedType) {
      setSelectedAuthorType("")
      setCustomAuthorType("")
      return
    }

    if (isPresetAuthorType(normalizedType)) {
      setSelectedAuthorType(normalizedType)
      setCustomAuthorType("")
      return
    }

    setSelectedAuthorType(CUSTOM_AUTHOR_TYPE_VALUE)
    setCustomAuthorType(normalizedType)
  }, [author, open, resolvePhotoUrl])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextAuthorType = selectedAuthorType === CUSTOM_AUTHOR_TYPE_VALUE ? customAuthorType.trim() : selectedAuthorType

    if (!normalizeAuthorGender(gender)) {
      toast.error("Seleccione o género do autor")
      return
    }

    if (selectedAuthorType === CUSTOM_AUTHOR_TYPE_VALUE && !nextAuthorType) {
      toast.error("Digite um tipo de autor personalizado")
      return
    }

    await onSubmit(
      {
        name: name.trim(),
        phone: emptyToNull(phone),
        bio: emptyToNull(bio),
        birth_date: emptyToNull(birthDate),
        residence_city: emptyToNull(city),
        province: emptyToNull(province),
        featured_video: emptyToNull(videoUrl),
        featured,
        gender: normalizeAuthorGender(gender),
        author_type: emptyToNull(normalizeAuthorType(nextAuthorType)),
      },
      photoFile,
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex h-full sm:h-screen flex-col overflow-hidden">
        <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
          <SheetTitle>{author ? `Editar ${getAuthorNoun(gender)}` : `Adicionar ${getAuthorNoun(gender)}`}</SheetTitle>
          <SheetDescription>{`Crie um perfil de ${getAuthorNoun(gender).toLowerCase()} com informações detalhadas.`}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder={`Nome ${getAuthorNoun(gender).toLowerCase() === "autora" ? "da autora" : "do autor"}`} required value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="photoFile">Foto {getAuthorNoun(gender).toLowerCase() === "autora" ? "da autora" : "do autor"}</Label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt={`Pré-visualização da foto ${getAuthorNoun(gender).toLowerCase() === "autora" ? "da autora" : "do autor"}`}
                  className="h-24 w-24 rounded-md object-cover border"
                />
              )}
              <Input
                id="photoFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setPhotoFile(nextFile)
                  if (!nextFile) {
                    setPhotoPreview(resolvePhotoUrl(author?.photo_url || null, author?.photo_path || null))
                    return
                  }
                  setPhotoPreview(URL.createObjectURL(nextFile))
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="gender">Género</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as AuthorGender)}>
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTHOR_GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option === "female" ? "Feminino" : "Masculino"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="authorType">{`Tipo de ${getAuthorNoun(gender)}`}</Label>
                <Select value={selectedAuthorType} onValueChange={setSelectedAuthorType}>
                  <SelectTrigger id="authorType" className="w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                    <SelectContent>
                      {AUTHOR_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{getGenderedAuthorType(option, gender)}</SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_AUTHOR_TYPE_VALUE}>Outro (personalizado)</SelectItem>
                    </SelectContent>
                </Select>
                {selectedAuthorType === CUSTOM_AUTHOR_TYPE_VALUE && (
                  <Input
                    value={customAuthorType}
                    onChange={(event) => setCustomAuthorType(event.target.value)}
                    placeholder="Digite o tipo de autor"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="+258 84 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="bio">Biografia</Label>
              <Input id="bio" placeholder={`Biografia ${getAuthorNoun(gender).toLowerCase() === "autora" ? "da autora" : "do autor"}`} value={bio} onChange={(event) => setBio(event.target.value)} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="city">Cidade de Residência</Label>
                <Input id="city" placeholder="Nome da cidade" value={city} onChange={(event) => setCity(event.target.value)} />
              </div>
              <div className="space-y-3">
                <Label htmlFor="province">Província</Label>
                <Input id="province" placeholder="Nome da província" value={province} onChange={(event) => setProvince(event.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="videoUrl">URL do Vídeo em Destaque</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                {getFeaturedAuthorLabel(gender)}
              </Label>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-background shrink-0">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                {author ? "Guardar" : "Criar Autor"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
