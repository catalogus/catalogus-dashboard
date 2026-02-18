import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/lib/auth'
import { AuthGuard } from '@/components/auth-guard'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <AuthProvider>
          <AuthGuard>
            <Outlet />
          </AuthGuard>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  ),
})
