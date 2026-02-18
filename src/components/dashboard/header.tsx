import { SidebarTrigger } from "@/components/ui/sidebar";
import { Folder } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-card sticky top-0 z-10 w-full shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Folder className="size-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
