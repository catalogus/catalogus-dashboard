import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { logAuditEvent } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { AuthorUpdate, ProfileUpdate } from "@/lib/supabase";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

type RuleState = {
  label: string;
  ok: boolean;
};

function validatePassword(value: string): RuleState[] {
  return [
    { label: "Pelo menos 10 caracteres", ok: value.length >= 10 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(value) },
    { label: "Uma letra minúscula", ok: /[a-z]/.test(value) },
    { label: "Um numero", ok: /\d/.test(value) },
    { label: "Um caractere especial", ok: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function AccountSettingsContent() {
  const { user, profile, role, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoPath, setPhotoPath] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
    setPhotoPath(profile.photo_path ?? "");
    setPhotoUrl(profile.photo_url ?? "");
    setAvatarFile(null);
    setAvatarPreview(profile.photo_url ?? null);
  }, [profile]);

  const passwordRules = useMemo(() => validatePassword(newPassword), [newPassword]);
  const passwordStrong = passwordRules.every((rule) => rule.ok);

  const uploadPhoto = async (targetFile: File, userId: string) => {
    const path = `${userId}/${Date.now()}-${targetFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("author-photos")
      .upload(path, targetFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("author-photos").getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  };

  const verifyCurrentPassword = async (password: string) => {
    const email = user?.email || profile?.email;
    if (!email) throw new Error("Email da conta não encontrado.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Senha actual inválida.");
  };

  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Nome é obrigatório.");

      let nextPhotoPath = photoPath;
      let nextPhotoUrl = photoUrl;

      if (avatarFile) {
        if (photoPath) {
          await supabase.storage.from("author-photos").remove([photoPath]);
        }
        const uploaded = await uploadPhoto(avatarFile, user.id);
        nextPhotoPath = uploaded.path;
        nextPhotoUrl = uploaded.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: trimmedName,
          phone: phone.trim() || null,
          photo_path: nextPhotoPath || null,
          photo_url: nextPhotoUrl || null,
        } satisfies ProfileUpdate)
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (role === "author") {
        const { data: linkedAuthor } = await supabase
          .from("authors")
          .select("id")
          .eq("profile_id", user.id)
          .eq("claim_status", "approved")
          .maybeSingle();

        if (linkedAuthor?.id) {
          const { error: authorError } = await supabase
            .from("authors")
            .update({
              name: trimmedName,
              phone: phone.trim() || null,
              photo_path: nextPhotoPath || null,
              photo_url: nextPhotoUrl || null,
            } satisfies AuthorUpdate)
            .eq("id", linkedAuthor.id);

          if (authorError) {
            console.error("Failed syncing author from account settings:", authorError);
          }
        }
      }

      setPhotoPath(nextPhotoPath);
      setPhotoUrl(nextPhotoUrl);
      setAvatarFile(null);
    },
    onSuccess: async () => {
      await logAuditEvent({
        action: 'account.profile_updated',
        entityType: 'profiles',
        entityId: user?.id,
        outcome: 'success',
        summary: 'Dados de perfil actualizados nas configurações da conta',
        changedFields: ['name', 'phone', 'photo_path', 'photo_url'],
      })
      await refreshProfile();
      toast.success("Conta actualizada com sucesso");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Falha ao actualizar conta"));
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const email = newEmail.trim().toLowerCase();
      if (!email) throw new Error("Novo email é obrigatório.");
      if (!emailCurrentPassword) throw new Error("Informe a senha actual.");

      await verifyCurrentPassword(emailCurrentPassword);

      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email } satisfies ProfileUpdate)
        .eq("id", user.id);
      if (profileError) throw profileError;
    },
    onSuccess: async () => {
      await logAuditEvent({
        action: 'account.email_change_requested',
        entityType: 'profiles',
        entityId: user?.id,
        outcome: 'success',
        summary: 'Pedido de alteração de email enviado',
        changedFields: ['email'],
      })
      await refreshProfile();
      setEmailCurrentPassword("");
      setNewEmail("");
      toast.success("Pedido de alteração de email enviado.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Falha ao actualizar email"));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!passwordCurrentPassword) throw new Error("Informe a senha actual.");
      if (!passwordStrong) throw new Error("A nova senha não cumpre os requisitos.");
      if (newPassword !== confirmPassword) throw new Error("As senhas não coincidem.");

      await verifyCurrentPassword(passwordCurrentPassword);

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      logAuditEvent({
        action: 'account.password_changed',
        entityType: 'profiles',
        entityId: user?.id,
        outcome: 'success',
        summary: 'Senha da conta foi actualizada',
      })
      setPasswordCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha actualizada com sucesso");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Falha ao actualizar senha"));
    },
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando conta...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta</p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Configurações da Conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie dados pessoais, email e segurança de acesso.</p>
        </div>

        <section className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Perfil</h2>
            <p className="text-sm text-muted-foreground">Actualize nome, telefone e foto.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-name">Nome</Label>
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-phone">Telefone</Label>
            <Input id="acc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-photo">Foto da conta</Label>
            {avatarPreview && (
              <img src={avatarPreview} alt="Foto de perfil" className="h-24 w-24 rounded-md object-cover border" />
            )}
            <Input
              id="acc-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const nextFile = e.target.files?.[0] ?? null;
                setAvatarFile(nextFile);
                if (nextFile) {
                  setAvatarPreview(URL.createObjectURL(nextFile));
                }
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={profileMutation.isPending}
              onClick={() => profileMutation.mutate()}
            >
              {profileMutation.isPending ? "A guardar..." : "Guardar perfil"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Email</h2>
            <p className="text-sm text-muted-foreground">Alterar email exige senha actual.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-current-email">Email actual</Label>
            <Input id="acc-current-email" type="email" disabled value={user?.email || profile.email || ""} className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-new-email">Novo email</Label>
            <Input
              id="acc-new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="novo-email@dominio.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-email-password">Senha actual</Label>
            <PasswordInput
              id="acc-email-password"
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              showLabel="Mostrar senha actual"
              hideLabel="Ocultar senha actual"
            />
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={emailMutation.isPending}
              onClick={() => emailMutation.mutate()}
            >
              {emailMutation.isPending ? "A guardar..." : "Actualizar email"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Senha</h2>
            <p className="text-sm text-muted-foreground">Informe a senha actual e defina uma nova senha forte.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-password-current">Senha actual</Label>
            <PasswordInput
              id="acc-password-current"
              value={passwordCurrentPassword}
              onChange={(e) => setPasswordCurrentPassword(e.target.value)}
              showLabel="Mostrar senha actual"
              hideLabel="Ocultar senha actual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-password-new">Nova senha</Label>
            <PasswordInput
              id="acc-password-new"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showLabel="Mostrar nova senha"
              hideLabel="Ocultar nova senha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-password-confirm">Confirmar nova senha</Label>
            <PasswordInput
              id="acc-password-confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showLabel="Mostrar confirmação da nova senha"
              hideLabel="Ocultar confirmação da nova senha"
            />
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium mb-2">Requisitos de segurança</p>
            <ul className="space-y-1">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={`text-xs ${rule.ok ? "text-emerald-700" : "text-muted-foreground"}`}>
                  {rule.ok ? "OK" : "..."} {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={passwordMutation.isPending}
              onClick={() => passwordMutation.mutate()}
            >
              {passwordMutation.isPending ? "A guardar..." : "Actualizar senha"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
