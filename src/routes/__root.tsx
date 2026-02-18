import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider
      defaultTheme="dark"
    >
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </ThemeProvider>
  ),
})
