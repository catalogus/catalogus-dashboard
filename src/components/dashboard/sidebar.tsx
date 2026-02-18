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
  ChevronDown,
  Check,
  Plus,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  
  return (
    <Sidebar collapsible="offcanvas" className="!border-r-0" {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center justify-between w-full">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none w-full justify-start">
              <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <span className="text-sm font-bold">T+</span>
              </div>
              <span className="font-semibold text-sidebar-foreground truncate">
                Taskplus
              </span>
              <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
                Workspaces
              </DropdownMenuLabel>
              <DropdownMenuItem>
                <div className="size-5 rounded bg-primary/20 mr-2 flex items-center justify-center text-xs font-bold text-primary">
                  T+
                </div>
                Taskplus
                <Check className="size-4 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="size-5 rounded bg-blue-500/20 mr-2 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  M
                </div>
                Marketing Team
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="size-5 rounded bg-emerald-500/20 mr-2 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  D
                </div>
                Design Studio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="size-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="size-4 mr-2" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Avatar className="size-8 border-2 border-sidebar shrink-0">
            <AvatarImage src="/ln.png" />
            <AvatarFallback>LN</AvatarFallback>
          </Avatar>
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
    </Sidebar>
  );
}
