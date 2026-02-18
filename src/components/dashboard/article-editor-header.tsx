import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send, Circle } from "lucide-react";

interface ArticleEditorHeaderProps {
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export function ArticleEditorHeader({ 
  isSaving, 
  hasChanges,
  onSave, 
  onPublish 
}: ArticleEditorHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 border-b bg-background sticky top-0 z-10 w-full shrink-0">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        {hasChanges && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Circle className="size-2 fill-current" />
            Não salvo
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="gap-1.5"
        >
          <Save className="size-4" />
          {isSaving ? 'Salvando...' : 'Guardar'}
        </Button>
        <Button 
          size="sm"
          onClick={onPublish}
          disabled={isSaving}
          className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
        >
          <Send className="size-4" />
          Publicar
        </Button>
      </div>
    </header>
  );
}
