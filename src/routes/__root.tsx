import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/lib/auth'
import { AuthGuard } from '@/components/auth-guard'

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname.startsWith('/auth')) {
    return <Outlet />
  }

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <Outlet />
    </SidebarProvider>
  )
}

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <AuthProvider>
          <AuthGuard>
            <RootLayout />
          </AuthGuard>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  ),
})
