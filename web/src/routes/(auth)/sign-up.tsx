import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/react'
import { AuthLayout } from '@/features/auth/auth-layout'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp fallback={<Skeleton className='h-120 w-100' />} />
    </AuthLayout>
  )
}
