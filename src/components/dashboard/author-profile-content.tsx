import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Facebook, Globe, Instagram, Linkedin, MapPin, Twitter, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AuthorUpdate, ProfileUpdate } from "@/lib/supabase";

type ClaimStatus = "unclaimed" | "pending" | "approved" | "rejected";

type AuthorLinkRow = {
  id: string;
  name: string;
  wp_slug: string | null;
  claim_status: ClaimStatus;
};

type SocialLinks = {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
};

type FormState = {
  name: string;
  phone: string;
  bio: string;
  author_type: string;
  birth_date: string;
  residence_city: string;
  province: string;
  featured_video: string;
  photo_url: string;
  photo_path: string;
  social_links: SocialLinks;
};

type UrlErrorKey =
  | "featured_video"
  | "twitter"
  | "linkedin"
  | "website"
  | "facebook"
  | "instagram"
  | "youtube";

const defaultForm: FormState = {
  name: "",
  phone: "",
  bio: "",
  author_type: "",
  birth_date: "",
  residence_city: "",
  province: "",
  featured_video: "",
  photo_url: "",
  photo_path: "",
  social_links: {},
};

function normalizeSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object") return {};
  return value as SocialLinks;
}

function resolvePhotoUrl(photoUrl?: string | null, photoPath?: string | null) {
  if (photoUrl) return photoUrl;
  if (photoPath) {
    return supabase.storage.from("author-photos").getPublicUrl(photoPath).data.publicUrl;
  }
  return null;
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateUrlFields(values: FormState): Partial<Record<UrlErrorKey, string>> {
  const errors: Partial<Record<UrlErrorKey, string>> = {};
  const message = "Use um URL valido com http:// ou https://";
  const entries: Array<[UrlErrorKey, string | undefined]> = [
    ["featured_video", values.featured_video],
    ["twitter", values.social_links.twitter],
    ["linkedin", values.social_links.linkedin],
    ["website", values.social_links.website],
    ["facebook", values.social_links.facebook],
    ["instagram", values.social_links.instagram],
    ["youtube", values.social_links.youtube],
  ];

  for (const [key, raw] of entries) {
    const value = (raw ?? "").trim();
    if (!value) continue;
    if (!isValidHttpUrl(value)) errors[key] = message;
  }

  return errors;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function extractVideoUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) return iframeMatch[1];
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch?.[1]) return srcMatch[1];
  if (trimmed.startsWith("<")) return null;
  return trimmed;
}

function buildEmbedUrl(value?: string | null) {
  const rawUrl = extractVideoUrl(value);
  if (!rawUrl) return null;
  const normalized = rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.replace(/^www\./, "");
  if (hostname === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (hostname.endsWith("youtube.com") || hostname.endsWith("youtube-nocookie.com")) {
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const pathId = pathParts[0] === "embed" || pathParts[0] === "shorts" ? pathParts[1] : null;
    const id = parsed.searchParams.get("v") || pathId;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (hostname === "player.vimeo.com" || hostname.endsWith("vimeo.com")) {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

function statusBadge(status: string | null) {
  if (status === "approved") {
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">approved</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">rejected</Badge>;
  }
  return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">pending</Badge>;
}

export function AuthorProfileContent() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showApprovedLinkNotice, setShowApprovedLinkNotice] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [values, setValues] = useState<FormState>(defaultForm);
  const [urlErrors, setUrlErrors] = useState<Partial<Record<UrlErrorKey, string>>>({});

  useEffect(() => {
    if (!profile) return;
    setValues({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      author_type: profile.author_type ?? "",
      birth_date: profile.birth_date ?? "",
      residence_city: profile.residence_city ?? "",
      province: profile.province ?? "",
      featured_video: profile.featured_video ?? "",
      photo_url: profile.photo_url ?? "",
      photo_path: profile.photo_path ?? "",
      social_links: normalizeSocialLinks(profile.social_links),
    });
    setPhotoPreview(resolvePhotoUrl(profile.photo_url, profile.photo_path));
  }, [profile]);

  const linkedAuthorQuery = useQuery({
    queryKey: ["author", "by-profile", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from("authors")
        .select("id, name, wp_slug, claim_status")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as AuthorLinkRow | null;
    },
    enabled: !!profile?.id,
  });

  const uploadPhoto = async (targetFile: File, userId: string) => {
    const path = `${userId}/${Date.now()}-${targetFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("author-photos")
      .upload(path, targetFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("author-photos").getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  };

  const resetFormFromProfile = () => {
    if (!profile) return;
    setValues({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      author_type: profile.author_type ?? "",
      birth_date: profile.birth_date ?? "",
      residence_city: profile.residence_city ?? "",
      province: profile.province ?? "",
      featured_video: profile.featured_video ?? "",
      photo_url: profile.photo_url ?? "",
      photo_path: profile.photo_path ?? "",
      social_links: normalizeSocialLinks(profile.social_links),
    });
    setFile(null);
    setPhotoPreview(resolvePhotoUrl(profile.photo_url, profile.photo_path));
    setUrlErrors({});
  };

  const updateUrlError = (key: UrlErrorKey, rawValue: string) => {
    setUrlErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      const value = rawValue.trim();
      if (!value || isValidHttpUrl(value)) {
        delete next[key];
      } else {
        next[key] = "Use um URL valido com http:// ou https://";
      }
      return next;
    });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      let nextPhotoPath = values.photo_path;
      let nextPhotoUrl = values.photo_url;

      if (file) {
        if (values.photo_path) {
          await supabase.storage.from("author-photos").remove([values.photo_path]);
        }
        const uploaded = await uploadPhoto(file, user.id);
        nextPhotoPath = uploaded.path;
        nextPhotoUrl = uploaded.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: values.name,
          phone: values.phone || null,
          bio: values.bio || null,
          author_type: values.author_type || null,
          birth_date: values.birth_date || null,
          residence_city: values.residence_city || null,
          province: values.province || null,
          featured_video: values.featured_video || null,
          photo_url: nextPhotoUrl || null,
          photo_path: nextPhotoPath || null,
          social_links: values.social_links,
        } satisfies ProfileUpdate)
        .eq("id", user.id);

      if (profileError) throw profileError;

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
            name: values.name,
            phone: values.phone || null,
            bio: values.bio || null,
            author_type: values.author_type || null,
            birth_date: values.birth_date || null,
            residence_city: values.residence_city || null,
            province: values.province || null,
            featured_video: values.featured_video || null,
            photo_url: nextPhotoUrl || null,
            photo_path: nextPhotoPath || null,
            social_links: values.social_links,
          } satisfies AuthorUpdate)
          .eq("id", linkedAuthor.id);

        if (authorError) {
          console.error("Failed syncing approved author profile:", authorError);
        }
      }
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["author", "by-profile", profile?.id] });
      toast.success("Perfil actualizado com sucesso");
      setFile(null);
      setIsEditOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Falha ao actualizar perfil"));
    },
  });

  const claimStatus = linkedAuthorQuery.data?.claim_status;
  const showClaimCTA = !linkedAuthorQuery.data && profile?.status === "pending";

  useEffect(() => {
    if (!profile?.id || claimStatus !== "approved" || !linkedAuthorQuery.data?.id) {
      setShowApprovedLinkNotice(false);
      return;
    }

    const noticeKey = `author-approved-link-notice:${profile.id}:${linkedAuthorQuery.data.id}`;
    const alreadySeen = localStorage.getItem(noticeKey) === "1";

    if (alreadySeen) {
      setShowApprovedLinkNotice(false);
      return;
    }

    setShowApprovedLinkNotice(true);
    localStorage.setItem(noticeKey, "1");
  }, [profile?.id, claimStatus, linkedAuthorQuery.data?.id]);

  const publicProfileLink = useMemo(() => {
    if (!linkedAuthorQuery.data) return null;
    return `/autor/${linkedAuthorQuery.data.wp_slug || linkedAuthorQuery.data.id}`;
  }, [linkedAuthorQuery.data]);

  const previewPhoto = resolvePhotoUrl(profile?.photo_url, profile?.photo_path);
  const previewName = profile?.name || linkedAuthorQuery.data?.name || "Autor";
  const previewSocialLinks = normalizeSocialLinks(profile?.social_links);
  const socialItems = [
    { key: "website", href: previewSocialLinks.website, icon: Globe, label: "Website" },
    { key: "linkedin", href: previewSocialLinks.linkedin, icon: Linkedin, label: "LinkedIn" },
    { key: "facebook", href: previewSocialLinks.facebook, icon: Facebook, label: "Facebook" },
    { key: "instagram", href: previewSocialLinks.instagram, icon: Instagram, label: "Instagram" },
    { key: "twitter", href: previewSocialLinks.twitter, icon: Twitter, label: "Twitter" },
    { key: "youtube", href: previewSocialLinks.youtube, icon: Youtube, label: "YouTube" },
  ].filter((item) => !!item.href);

  const birthDateLabel = formatDate(profile?.birth_date);
  const embedUrl = buildEmbedUrl(profile?.featured_video);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta de Autor</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">Visualize como no site publico e edite no painel lateral.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                resetFormFromProfile();
                setIsEditOpen(true);
              }}
            >
              Editar perfil
            </Button>
            <Button variant="outline" onClick={signOut}>Sair</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Estado da conta</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.status === "approved" && "A sua conta foi aprovada."}
              {profile.status === "pending" && "A sua conta aguarda aprovação do administrador."}
              {profile.status === "rejected" && "A sua conta foi rejeitada. Contacte o administrador."}
            </p>
          </div>
          {statusBadge(profile.status)}
        </div>

        {claimStatus === "pending" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            A sua reivindicação de autor está pendente de revisão.
          </div>
        )}

        {showApprovedLinkNotice && (
          <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-emerald-900">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                Perfil vinculado: <span className="font-medium">{linkedAuthorQuery.data?.name}</span>
              </p>
              {publicProfileLink && (
                <a href={publicProfileLink} target="_blank" rel="noreferrer" className="text-xs underline sm:text-sm">
                  Ver página pública
                </a>
              )}
            </div>
          </div>
        )}

        {claimStatus === "rejected" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <p>A sua reivindicação foi rejeitada. Pode tentar novamente.</p>
            <Link to="/perfil/reivindicar" className="inline-block mt-2 text-sm underline">
              Reivindicar outro perfil
            </Link>
          </div>
        )}

        {showClaimCTA && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p>Já tem perfil público no catálogo? Reivindique para o gerir aqui no CMS.</p>
            <Link to="/perfil/reivindicar" className="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
              Reivindicar perfil
            </Link>
          </div>
        )}

        <section className="relative overflow-hidden rounded-xl bg-[#1c1b1a] text-white">
          {previewPhoto && <img src={previewPhoto} alt={previewName} className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
          <div className="relative z-10 px-6 py-16 sm:px-10">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Perfil de Autor</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold leading-tight">{previewName}</h2>
            {profile.author_type && <p className="mt-4 text-sm uppercase tracking-[0.28em] text-white/70">{profile.author_type}</p>}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-xl border bg-card p-4">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-md bg-muted">
                {previewPhoto ? (
                  <img src={previewPhoto} alt={previewName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-muted-foreground/60">
                    {previewName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {profile.residence_city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.residence_city}</span>
                  </div>
                )}
                {profile.province && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.province}</span>
                  </div>
                )}
                {birthDateLabel && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{birthDateLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {socialItems.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Redes</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.key}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-md border text-muted-foreground transition hover:text-foreground hover:border-foreground"
                        aria-label={item.label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          <div className="space-y-6">
            {profile.bio && (
              <article className="rounded-xl border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Biografia</p>
                <h3 className="mt-3 text-2xl font-semibold">Sobre o autor</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
              </article>
            )}

            {profile.featured_video && (
              <article className="rounded-xl border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Video</p>
                <h3 className="mt-3 text-2xl font-semibold">Video em destaque</h3>
                <div className="mt-4">
                  {embedUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
                      <iframe
                        src={embedUrl}
                        title={`Video de ${previewName}`}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a href={profile.featured_video} target="_blank" rel="noreferrer" className="text-sm font-medium underline">
                      Ver video
                    </a>
                  )}
                </div>
              </article>
            )}
          </div>
        </section>

        <Sheet
          open={isEditOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetFormFromProfile();
            }
            setIsEditOpen(open);
          }}
        >
          <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col min-h-0">
            <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
              <SheetTitle>Editar Perfil</SheetTitle>
              <SheetDescription>
                Actualize os dados públicos do seu perfil. O destaque continua reservado ao administrador.
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const validationErrors = validateUrlFields(values);
                if (Object.keys(validationErrors).length > 0) {
                  setUrlErrors(validationErrors);
                  toast.error("Corrija os URLs invalidos antes de guardar");
                  return;
                }
                setUrlErrors({});
                updateMutation.mutate();
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" disabled value={profile.email || user?.email || ""} className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    required
                    value={values.name}
                    onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={values.phone}
                    onChange={(e) => setValues((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <textarea
                    id="bio"
                    rows={5}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={values.bio}
                    onChange={(e) => setValues((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author_type">Tipo de Autor</Label>
                    <Select
                      value={values.author_type || "__empty"}
                      onValueChange={(value) =>
                        setValues((prev) => ({ ...prev, author_type: value === "__empty" ? "" : value }))
                      }
                    >
                      <SelectTrigger id="author_type">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty">Sem tipo</SelectItem>
                        <SelectItem value="writer">Escritor</SelectItem>
                        <SelectItem value="poet">Poeta</SelectItem>
                        <SelectItem value="researcher">Investigador</SelectItem>
                        <SelectItem value="journalist">Jornalista</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={values.birth_date}
                      onChange={(e) => setValues((prev) => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="residence_city">Cidade</Label>
                    <Input
                      id="residence_city"
                      value={values.residence_city}
                      onChange={(e) => setValues((prev) => ({ ...prev, residence_city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Província</Label>
                    <Input
                      id="province"
                      value={values.province}
                      onChange={(e) => setValues((prev) => ({ ...prev, province: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured_video">URL do Video em Destaque</Label>
                  <Input
                    id="featured_video"
                    type="url"
                    value={values.featured_video}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setValues((prev) => ({ ...prev, featured_video: nextValue }));
                      updateUrlError("featured_video", nextValue);
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {urlErrors.featured_video && <p className="text-xs text-destructive">{urlErrors.featured_video}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Foto de perfil</Label>
                  {photoPreview && (
                    <img src={photoPreview} alt="Foto de perfil" className="h-28 w-28 rounded-md object-cover border" />
                  )}
                  <Input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const nextFile = e.target.files?.[0] ?? null;
                      setFile(nextFile);
                      if (nextFile) {
                        setPhotoPreview(URL.createObjectURL(nextFile));
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      type="url"
                      value={values.social_links.twitter || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setValues((prev) => ({
                          ...prev,
                          social_links: { ...prev.social_links, twitter: nextValue || undefined },
                        }));
                        updateUrlError("twitter", nextValue);
                      }}
                    />
                    {urlErrors.twitter && <p className="text-xs text-destructive">{urlErrors.twitter}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={values.social_links.linkedin || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setValues((prev) => ({
                          ...prev,
                          social_links: { ...prev.social_links, linkedin: nextValue || undefined },
                        }));
                        updateUrlError("linkedin", nextValue);
                      }}
                    />
                    {urlErrors.linkedin && <p className="text-xs text-destructive">{urlErrors.linkedin}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={values.social_links.website || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setValues((prev) => ({
                          ...prev,
                          social_links: { ...prev.social_links, website: nextValue || undefined },
                        }));
                        updateUrlError("website", nextValue);
                      }}
                    />
                    {urlErrors.website && <p className="text-xs text-destructive">{urlErrors.website}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      type="url"
                      value={values.social_links.facebook || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setValues((prev) => ({
                          ...prev,
                          social_links: { ...prev.social_links, facebook: nextValue || undefined },
                        }));
                        updateUrlError("facebook", nextValue);
                      }}
                    />
                    {urlErrors.facebook && <p className="text-xs text-destructive">{urlErrors.facebook}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      type="url"
                      value={values.social_links.instagram || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setValues((prev) => ({
                          ...prev,
                          social_links: { ...prev.social_links, instagram: nextValue || undefined },
                        }));
                        updateUrlError("instagram", nextValue);
                      }}
                    />
                    {urlErrors.instagram && <p className="text-xs text-destructive">{urlErrors.instagram}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      type="url"
                      value={values.social_links.youtube || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setValues((prev) => ({
                          ...prev,
                          social_links: { ...prev.social_links, youtube: nextValue || undefined },
                        }));
                        updateUrlError("youtube", nextValue);
                      }}
                    />
                    {urlErrors.youtube && <p className="text-xs text-destructive">{urlErrors.youtube}</p>}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-background shrink-0">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      resetFormFromProfile();
                      setIsEditOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "A guardar..." : "Guardar alterações"}
                  </Button>
                </div>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
