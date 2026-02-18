import { Link, useLocation } from "@tanstack/react-router";
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
import { useAuth } from "@/lib/auth";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/", iconColor: "text-primary" },
  { title: "Slides do Hero", icon: Image, href: "/hero-slides", iconColor: "text-violet-500" },
  { title: "Artigos", icon: FileText, href: "/artigos", iconColor: "text-blue-500" },
  { title: "Mapas Literários", icon: Library, href: "/mapas-literarios", iconColor: "text-emerald-500" },
  { title: "Livros", icon: Book, href: "/livros", iconColor: "text-amber-500" },
  { title: "Pedidos", icon: ShoppingCart, href: "/pedidos", iconColor: "text-orange-500" },
  { title: "Usuários", icon: Users, href: "/usuarios", iconColor: "text-cyan-500" },
  { title: "Autores", icon: UserPen, href: "/autores", iconColor: "text-rose-500" },
  { title: "Reivindicações de Autor", icon: UserCheck, href: "/reivindicacoes", iconColor: "text-sky-500" },
];

export function DashboardSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const userMetadata = user?.user_metadata as { name?: string; avatar_url?: string } | undefined;
  const userName = userMetadata?.name || user?.email?.split('@')[0] || 'Admin';
  const userInitials = userName?.slice(0, 2).toUpperCase() || 'AD';
  
  return (
    <Sidebar collapsible="offcanvas" className="!border-r-0" {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-amber-600 flex items-center justify-center text-white shrink-0">
            <span className="text-sm font-bold">C</span>
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
                const isActive = location.pathname === item.href;
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
                <AvatarImage src={userMetadata?.avatar_url} />
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
