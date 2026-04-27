import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/react'
import { AuthLayout } from '@/features/auth/auth-layout'
import { Skeleton } from '@/components/ui/skeleton'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
  validateSearch: searchSchema,
})

function SignInPage() {
  return (
    <AuthLayout>
      <SignIn
        fallback={<Skeleton className='h-120 w-100' />}
        appearance={{
          elements: {
            footer: {
              display: 'none',
            },
          },
        }}
      />
    </AuthLayout>
  )
}
