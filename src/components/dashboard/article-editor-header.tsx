import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send } from "lucide-react";

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
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-card sticky top-0 z-10 w-full shrink-0">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        {hasChanges && (
          <span className="text-xs text-muted-foreground">
            Alterações não salvas
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
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
          className="gap-1.5 bg-amber-600 hover:bg-amber-700"
        >
          <Send className="size-4" />
          Publicar
        </Button>
      </div>
    </header>
  );
}
