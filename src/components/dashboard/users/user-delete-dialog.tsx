import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Profile } from "@/lib/supabase"

type UserDeleteDialogProps = {
  profile: Profile | null
  open: boolean
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (profile: Profile) => void
}

export function UserDeleteDialog({ profile, open, deleting, onOpenChange, onConfirm }: UserDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir usuário</DialogTitle>
          <DialogDescription>
            {profile
              ? `Tem certeza que deseja excluir o usuário "${profile.name}"? Esta ação não pode ser desfeita.`
              : "Tem certeza que deseja excluir este usuário?"}
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
            disabled={deleting || !profile}
            onClick={() => {
              if (!profile) return
              onConfirm(profile)
            }}
          >
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
