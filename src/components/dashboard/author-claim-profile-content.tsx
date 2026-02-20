import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/hooks/supabase/query-keys";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AuthorClaimInsert, AuthorUpdate } from "@/lib/supabase";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

type ClaimStatus = "unclaimed" | "pending" | "approved" | "rejected";

type AuthorRow = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  residence_city: string | null;
  province: string | null;
  claim_status: ClaimStatus;
};

export function AuthorClaimProfileContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorRow | null>(null);

  const unclaimedAuthorsQuery = useQuery({
    queryKey: queryKeys.authors.unclaimed(searchTerm),
    queryFn: async () => {
      let query = supabase
        .from("authors")
        .select("id, name, bio, photo_url, residence_city, province, claim_status")
        .in("claim_status", ["unclaimed", "rejected"])
        .order("name", { ascending: true })
        .limit(24);

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AuthorRow[];
    },
  });

  const submitClaim = useMutation({
    mutationFn: async (authorId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const now = new Date().toISOString();

      const { error: authorError } = await supabase
        .from("authors")
        .update({
          profile_id: user.id,
          claim_status: "pending",
          claimed_at: now,
        } satisfies AuthorUpdate)
        .eq("id", authorId)
        .in("claim_status", ["unclaimed", "rejected"]);

      if (authorError) throw authorError;

      const { error: auditError } = await supabase.from("author_claims").insert({
        author_id: authorId,
        profile_id: user.id,
        status: "pending",
        claimed_at: now,
      } satisfies AuthorClaimInsert);

      if (auditError) throw auditError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authors.unclaimed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.authors.byProfile(user?.id) });
      toast.success("Reivindicação enviada. Aguarde revisão do administrador.");
      setSelectedAuthor(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Falha ao enviar reivindicação"));
    },
  });

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta de Autor</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Reivindicar Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">Procure o seu perfil público e solicite vinculação à sua conta.</p>
          </div>
          <Link to="/perfil" className="text-sm underline">Voltar ao perfil</Link>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-2">
          <Label htmlFor="author-search">Pesquisar autor</Label>
          <Input
            id="author-search"
            placeholder="Buscar por nome ou biografia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {unclaimedAuthorsQuery.isLoading && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Carregando autores...</div>
        )}

        {unclaimedAuthorsQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
            Falha ao carregar autores para reivindicação.
          </div>
        )}

        {!unclaimedAuthorsQuery.isLoading && !unclaimedAuthorsQuery.isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(unclaimedAuthorsQuery.data || []).map((author) => (
              <article key={author.id} className="rounded-lg border bg-card overflow-hidden">
                <div className="aspect-square bg-muted">
                  {author.photo_url ? (
                    <img src={author.photo_url} alt={author.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="font-semibold leading-tight">{author.name}</h2>
                    {(author.residence_city || author.province) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[author.residence_city, author.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>

                  {author.bio && <p className="text-sm text-muted-foreground line-clamp-3">{author.bio}</p>}

                  {author.claim_status === "rejected" && (
                    <p className="text-xs rounded bg-red-50 text-red-700 border border-red-200 px-2 py-1">
                      Rejeitado anteriormente - pode reivindicar novamente.
                    </p>
                  )}

                  <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => setSelectedAuthor(author)}>
                    Reivindicar este perfil
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!unclaimedAuthorsQuery.isLoading && !unclaimedAuthorsQuery.isError && (unclaimedAuthorsQuery.data || []).length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            {searchTerm ? "Nenhum autor encontrado para o termo pesquisado." : "Sem perfis disponíveis para reivindicação."}
          </div>
        )}
      </div>

      {selectedAuthor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-lg border bg-background p-5 space-y-4">
            <h3 className="text-lg font-semibold">Confirmar reivindicação</h3>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja reivindicar o perfil de <span className="font-medium text-foreground">{selectedAuthor.name}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              A solicitação será analisada por um administrador antes de aprovação.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedAuthor(null)} disabled={submitClaim.isPending}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={() => submitClaim.mutate(selectedAuthor.id)}
                disabled={submitClaim.isPending}
              >
                {submitClaim.isPending ? "A enviar..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
