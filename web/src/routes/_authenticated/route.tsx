import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { AuthGuard } from '@/components/auth-guard'

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <AuthGuard>
      <AuthenticatedLayout />
    </AuthGuard>
  ),
})
