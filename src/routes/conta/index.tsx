import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const AccountSettingsContent = lazy(async () => {
  const module = await import("@/components/dashboard/account-settings-content");
  return { default: module.AccountSettingsContent };
});

export const Route = createFileRoute("/conta/")({
  component: ContaPage,
});

function ContaPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando conta...</div>}>
              <AccountSettingsContent />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
