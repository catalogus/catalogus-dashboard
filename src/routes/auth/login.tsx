import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/components/login-page'

export const Route = createFileRoute('/auth/login')({
  component: LoginRoutePage,
})

function LoginRoutePage() {
  return <LoginPage />
}
