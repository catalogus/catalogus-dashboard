import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Folder } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function getSectionLabel(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/hero-slides")) return "Slides do Hero";
  if (pathname.startsWith("/artigos/novo")) return "Novo Artigo";
  if (/^\/artigos\/[^/]+\/editar/.test(pathname)) return "Editar Artigo";
  if (pathname.startsWith("/artigos")) return "Artigos";
  if (pathname.startsWith("/mapas-literarios")) return "Mapas Literarios";
  if (pathname.startsWith("/livros")) return "Livros";
  if (pathname.startsWith("/pedidos")) return "Pedidos";
  if (pathname.startsWith("/usuarios")) return "Usuarios";
  if (pathname.startsWith("/autores")) return "Autores";
  if (pathname.startsWith("/reivindicacoes")) return "Reivindicacoes de Autor";
  if (pathname.startsWith("/conta")) return "Configuracoes da Conta";
  if (pathname.startsWith("/perfil/reivindicar")) return "Reivindicar Perfil";
  if (pathname.startsWith("/perfil")) return "Meu Perfil";
  return "Dashboard";
}

export function DashboardHeader() {
  const { pathname } = useLocation();
  const sectionLabel = getSectionLabel(pathname);
  const isDashboard = sectionLabel === "Dashboard";

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-card sticky top-0 z-10 w-full shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Folder className="size-4" />
          <Link
            to="/"
            className="text-sm font-medium hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          {!isDashboard && (
            <>
              <ChevronRight className="size-4 opacity-60" />
              <span className="text-sm font-medium text-foreground truncate">{sectionLabel}</span>
            </>
          )}
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
