import { useAuth, useUser, UserButton } from '@clerk/react'
import { Link } from '@tanstack/react-router'
import { Shield, User } from 'lucide-react'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/stores/user-store'

export function NavUser() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()
  const { user: storeUser } = useUserStore()

  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='h-10 w-full animate-pulse' />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!isSignedIn) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' asChild>
            <Link to='/sign-in' className='flex items-center gap-2'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold'>
                ?
              </div>
              <span>Sign In</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const displayName = clerkUser?.fullName || clerkUser?.firstName || clerkUser?.emailAddresses?.[0]?.emailAddress || storeUser?.email || 'User'
  const displayRole = storeUser?.role || 'user'
  const isAdmin = displayRole === 'admin'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent'
          asChild
        >
          <div className='flex items-center gap-2'>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'size-8 rounded-lg',
                },
              }}
            />
            <div className='flex flex-col items-start gap-0.5'>
              <span className='text-sm font-medium truncate max-w-[120px]'>
                {displayName}
              </span>
              <div className='flex items-center gap-1'>
                <Badge
                  variant={isAdmin ? 'default' : 'secondary'}
                  className='text-xs px-1.5 py-0.5'
                >
                  {isAdmin ? (
                    <>
                      <Shield className='h-3 w-3 mr-1' />
                      Admin
                    </>
                  ) : (
                    <>
                      <User className='h-3 w-3 mr-1' />
                      User
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
