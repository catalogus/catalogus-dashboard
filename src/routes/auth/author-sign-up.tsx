import { createFileRoute } from '@tanstack/react-router'
import { AuthorSignUpPage } from '@/components/auth/author-sign-up-page'

export const Route = createFileRoute('/auth/author-sign-up')({
  component: AuthorSignUpRoutePage,
})

function AuthorSignUpRoutePage() {
  return <AuthorSignUpPage />
}
