import { useMemo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Image,
  FileText,
  Library,
  Book,
  ShoppingCart,
  Users,
  UserPen,
  UserCheck,
  UserCircle,
  Settings,
  Activity,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type NavItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  iconColor: string;
  badge?: number;
};

const adminNavItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/", iconColor: "text-primary" },
  { title: "Slides do Hero", icon: Image, href: "/hero-slides", iconColor: "text-violet-500" },
  { title: "Artigos", icon: FileText, href: "/artigos", iconColor: "text-blue-500" },
  { title: "Mapas Literários", icon: Library, href: "/mapas-literarios", iconColor: "text-emerald-500" },
  { title: "Livros", icon: Book, href: "/livros", iconColor: "text-amber-500" },
  { title: "Pedidos", icon: ShoppingCart, href: "/pedidos", iconColor: "text-orange-500" },
  { title: "Usuários", icon: Users, href: "/usuarios", iconColor: "text-cyan-500" },
  { title: "Autores", icon: UserPen, href: "/autores", iconColor: "text-rose-500" },
  { title: "Reivindicações de Autor", icon: UserCheck, href: "/reivindicacoes", iconColor: "text-sky-500" },
  { title: "Atividade", icon: Activity, href: "/atividade", iconColor: "text-emerald-500" },
  { title: "Conta", icon: Settings, href: "/conta", iconColor: "text-zinc-500" },
];

const authorNavItems: NavItem[] = [
  { title: "Meu Perfil", icon: UserCircle, href: "/perfil", iconColor: "text-primary" },
  { title: "Conta", icon: Settings, href: "/conta", iconColor: "text-zinc-500" },
  { title: "Reivindicar Perfil", icon: UserCheck, href: "/perfil/reivindicar", iconColor: "text-sky-500" },
];

const customerNavItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/", iconColor: "text-primary" },
  { title: "Pedidos", icon: ShoppingCart, href: "/pedidos", iconColor: "text-orange-500" },
];

type UserRole = "admin" | "author" | "customer";

export function DashboardSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const location = useLocation();
  const { user, profile, role, signOut } = useAuth();

  const pendingClaimsQuery = useQuery({
    queryKey: ["sidebar-pending-claims"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("authors")
        .select("id", { count: "exact", head: true })
        .eq("claim_status", "pending");

      if (error) throw error;
      return count ?? 0;
    },
    enabled: role === "admin",
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const linkedAuthorQuery = useQuery({
    queryKey: ["sidebar-linked-author", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from("authors")
        .select("claim_status")
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      return data as { claim_status: "unclaimed" | "pending" | "approved" | "rejected" } | null;
    },
    enabled: role === "author" && !!profile?.id,
    staleTime: 30_000,
  });

  const userRole = ((role || user?.user_metadata?.role || "admin") as UserRole);
  const navItems = useMemo(() => {
    if (userRole === "author") {
      const linkedClaimStatus = linkedAuthorQuery.data?.claim_status;
      const canClaimProfile =
        linkedClaimStatus === "rejected" || (!linkedClaimStatus && profile?.status === "pending");

      return authorNavItems.filter((item) => item.href !== "/perfil/reivindicar" || canClaimProfile);
    }
    if (userRole === "customer") return customerNavItems;

    return adminNavItems.map((item) => {
      if (item.href === "/reivindicacoes") {
        return { ...item, badge: pendingClaimsQuery.data || 0 };
      }
      return item;
    });
  }, [userRole, pendingClaimsQuery.data, linkedAuthorQuery.data?.claim_status, profile?.status]);
  
  const userMetadata = user?.user_metadata as { name?: string; avatar_url?: string } | undefined;
  const userName = profile?.name || userMetadata?.name || user?.email?.split('@')[0] || 'Admin';
  const userInitials = userName?.slice(0, 2).toUpperCase() || 'AD';
  const userAvatar = profile?.photo_url || userMetadata?.avatar_url;
  
  return (
    <Sidebar collapsible="offcanvas" className="!border-r-0" {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-sidebar-accent/50 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/catalogus-light.svg"
              alt="Catalogus logo"
              className="size-5 dark:hidden"
            />
            <img
              src="/catalogus-dark.svg"
              alt="Catalogus logo"
              className="size-5 hidden dark:block"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground text-sm">
              Catalogus
            </span>
            <span className="text-xs text-muted-foreground">
              CMS Admin
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  location.pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9"
                    >
                      <Link to={item.href}>
                        <item.icon className={cn("size-4 shrink-0", item.iconColor)} />
                        <span className="text-sm">{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-sidebar-accent transition-colors">
              <Avatar className="size-8">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="bg-amber-600 text-white text-xs">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/conta">
                <Settings className="size-4 mr-2" />
                Configurações da conta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
              <LogOut className="size-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
