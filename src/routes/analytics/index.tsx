import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsContent } from '@/components/dashboard/analytics-content'
import { DashboardHeader } from '@/components/dashboard/header'

export const Route = createFileRoute('/analytics/')({
  loader: async () => {
    try {
      const response = await fetch('/api/umami/config', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load Umami config: ${response.status}`)
      }

      const data = await response.json()
      return { initialConfig: data }
    } catch {
      return { initialConfig: { configured: false } }
    }
  },
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { initialConfig } = Route.useLoaderData()

  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
        <DashboardHeader />
        <main className="w-full flex-1 overflow-auto">
          <AnalyticsContent initialConfig={initialConfig} />
        </main>
      </div>
    </div>
  )
}
