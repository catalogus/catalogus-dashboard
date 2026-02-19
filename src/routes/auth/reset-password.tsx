import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from '@/components/auth/reset-password-page'

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordRoutePage,
})

function ResetPasswordRoutePage() {
  return <ResetPasswordPage />
}
