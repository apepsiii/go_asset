import { Navigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@clerk/react'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to='/sign-in'
        search={{ redirect: location.href }}
        replace
      />
    )
  }

  return <>{children}</>
}
