import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
import { reivindicacoes, reivindicacoesStats } from "@/mock-data/reivindicacoes";
import { cn } from "@/lib/utils";

type TabStatus = "all" | "pending" | "approved" | "rejected";

export function ReivindicacoesContent() {
  const [activeTab, setActiveTab] = useState<TabStatus>("all");

  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/20">rejected</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">pending</Badge>;
      default:
        return null;
    }
  };

  const getProfileStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground">—</span>;
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">pending</Badge>;
      default:
        return null;
    }
  };

  const filteredReivindicacoes = reivindicacoes.filter((item) => {
    if (activeTab === "all") return true;
    return item.claimStatus === activeTab;
  });

  const tabs = [
    { id: "pending" as TabStatus, label: "Pendente", count: reivindicacoesStats.pending },
    { id: "approved" as TabStatus, label: "Aprovado", count: reivindicacoesStats.approved },
    { id: "rejected" as TabStatus, label: "Rejeitado", count: reivindicacoesStats.rejected },
    { id: "all" as TabStatus, label: "Tudo", count: reivindicacoesStats.total },
  ];

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Reivindicações de Autor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reveja e gerencie reivindicações de perfil de autor
          </p>
        </div>

        {/* Tabs */}
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

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome do Autor</TableHead>
                <TableHead className="w-[150px]">Reivindicado Por</TableHead>
                <TableHead className="w-[200px]">Email</TableHead>
                <TableHead className="w-[150px]">Info de Verificação</TableHead>
                <TableHead className="w-[120px]">Estado do Perfil</TableHead>
                <TableHead className="w-[120px]">Data de Reivindicação</TableHead>
                <TableHead className="w-[100px]">Estado da Reivindicação</TableHead>
                <TableHead className="w-[100px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReivindicacoes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={item.authorPhoto} alt={item.authorName} />
                        <AvatarFallback>{item.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.authorName}</span>
                        <a 
                          href={`/autores/${item.authorSlug}`} 
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver página pública
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.claimedBy || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.email || "—"}
                  </TableCell>
                  <TableCell>
                    {item.verificationInfo ? (
                      <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <ChevronDown className="size-3" />
                        {item.verificationInfo}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getProfileStatusBadge(item.profileStatus)}</TableCell>
                  <TableCell className="text-muted-foreground">{item.claimedDate}</TableCell>
                  <TableCell>{getClaimStatusBadge(item.claimStatus)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">Sem acções</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
