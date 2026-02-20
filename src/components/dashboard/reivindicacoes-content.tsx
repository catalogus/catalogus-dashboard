import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthorClaims, useAuthorClaimStats, useReviewAuthorClaim } from "@/hooks/supabase/claims";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type TabStatus = "all" | "pending" | "approved" | "rejected";

type ProfileClaimInfo = Pick<Database["public"]["Tables"]["profiles"]["Row"], "name" | "email" | "status">;
type ClaimRow = {
  id: string;
  name: string;
  photo_url: string | null;
  wp_slug: string | null;
  profile_id: string | null;
  claim_status: string;
  claimed_at: string;
  notes?: string | null;
  profiles?: ProfileClaimInfo | null;
};

export function ReivindicacoesContent() {
  const [activeTab, setActiveTab] = useState<TabStatus>("all");
  const { user } = useAuth();
  const { data: claims, isLoading } = useAuthorClaims(activeTab);
  const { data: stats } = useAuthorClaimStats();
  const reviewMutation = useReviewAuthorClaim();

  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/20">rejected</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStatusChange = async (claim: ClaimRow, newStatus: 'approved' | 'rejected') => {
    if (!claim.profile_id) {
      toast.error('Esta reivindicação não possui perfil associado.');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        authorId: claim.id,
        profileId: claim.profile_id,
        status: newStatus,
        reviewerId: user?.id || null,
      });
      toast.success(newStatus === 'approved' ? 'Reivindicação aprovada' : 'Reivindicação rejeitada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao rever reivindicação';
      toast.error(message);
    }
  };

  const tabs = [
    { id: "pending" as TabStatus, label: "Pendente", count: stats?.pending || 0 },
    { id: "approved" as TabStatus, label: "Aprovado", count: stats?.approved || 0 },
    { id: "rejected" as TabStatus, label: "Rejeitado", count: stats?.rejected || 0 },
    { id: "all" as TabStatus, label: "Tudo", count: stats?.total || 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando reivindicações...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Reivindicações de Autor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reveja e gerencie reivindicações de perfil de autor
          </p>
        </div>

        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab.id
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome do Autor</TableHead>
                <TableHead className="w-[150px]">Reivindicado Por</TableHead>
                <TableHead className="w-[180px]">Email</TableHead>
                <TableHead className="w-[150px]">Info de Verificação</TableHead>
                <TableHead className="w-[120px]">Estado do Perfil</TableHead>
                <TableHead className="w-[120px]">Data de Reivindicação</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[220px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(claims as ClaimRow[] | undefined)?.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={claim.photo_url || undefined} alt={claim.name} />
                        <AvatarFallback>{claim.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{claim.name || 'Autor desconhecido'}</span>
                        {(claim.wp_slug || claim.id) && (
                          <a
                            href={`/autor/${claim.wp_slug || claim.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            Ver página pública
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {claim.profiles?.name || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {claim.profiles?.email || '—'}
                  </TableCell>
                  <TableCell>
                    {claim.notes ? (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:underline inline-flex items-center gap-1">
                          <ChevronDown className="size-3" />
                          Ver notas
                        </summary>
                        <div className="mt-2 rounded-md border bg-muted/40 p-2 text-xs whitespace-pre-wrap">
                          {claim.notes}
                        </div>
                      </details>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {claim.profiles?.status ? (
                      <Badge
                        className={cn(
                          claim.profiles.status === 'approved' && 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20',
                          claim.profiles.status === 'pending' && 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/20',
                          claim.profiles.status === 'rejected' && 'bg-red-500/15 text-red-600 hover:bg-red-500/20',
                        )}
                      >
                        {claim.profiles.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(claim.claimed_at)}</TableCell>
                  <TableCell>{getClaimStatusBadge(claim.claim_status)}</TableCell>
                  <TableCell>
                    {claim.claim_status === 'pending' && claim.profile_id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(claim, 'rejected')}
                          disabled={reviewMutation.isPending}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="size-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(claim, 'approved')}
                          disabled={reviewMutation.isPending}
                          className="h-8 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="size-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                    {(claim.claim_status !== 'pending' || !claim.profile_id) && (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {claims?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma reivindicação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
