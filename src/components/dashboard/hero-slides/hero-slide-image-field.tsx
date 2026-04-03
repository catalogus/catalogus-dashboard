import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type OptimizationStats = {
  originalSizeMB: string
  optimizedSizeMB: string
}

type HeroSlideImageFieldProps = {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isOptimizingImage: boolean
  imageFile: File | null
  imagePreview: string | null
  optimizationStats: OptimizationStats | null
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function HeroSlideImageField({
  fileInputRef,
  isOptimizingImage,
  imageFile,
  imagePreview,
  optimizationStats,
  onImageSelect,
}: HeroSlideImageFieldProps) {
  return (
    <div className="space-y-3">
      <Label>Imagem de Fundo</Label>
      <div className="border-2 border-dashed rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-4">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageSelect} className="hidden" disabled={isOptimizingImage} />
          <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isOptimizingImage}>
            {isOptimizingImage ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Escolher arquivo
          </Button>
          <div className="flex flex-col text-sm text-muted-foreground">
            <span className="font-medium">
              {isOptimizingImage ? "Otimizando imagem..." : imageFile?.name ?? (imagePreview ? "Imagem carregada" : "Nenhum arquivo")}
            </span>
            {optimizationStats ? (
              <span className="text-xs text-emerald-600">Otimizada: {optimizationStats.originalSizeMB}MB {"->"} {optimizationStats.optimizedSizeMB}MB</span>
            ) : (
              <span className="text-xs">JPG/PNG/WebP, até 50MB</span>
            )}
          </div>
          {imagePreview && <img src={imagePreview} alt="Preview" className="h-12 w-20 rounded border object-cover ml-auto" />}
        </div>
      </div>
    </div>
  )
}
