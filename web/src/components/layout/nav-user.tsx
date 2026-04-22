import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const hasClerkKey = PUBLISHABLE_KEY && PUBLISHABLE_KEY.length > 0

export function NavUser() {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState({ name: 'User', email: 'user@example.com', avatar: '' })
  const [isLoaded, setIsLoaded] = useState(!hasClerkKey)

  useEffect(() => {
    if (hasClerkKey) {
      import('@clerk/react').then(({ useUser }) => {
        const { user, isLoaded: loaded } = useUser()
        if (loaded && user) {
          setUserData({
            name: user.fullName || user.username || 'User',
            email: user.primaryEmailAddress?.emailAddress || '',
            avatar: user.imageUrl || '',
          })
        }
        setIsLoaded(true)
      })
    }
  }, [])

  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='h-10 w-full animate-pulse' />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  {userData.avatar && <AvatarFallback><img src={userData.avatar} alt={userData.name} /></AvatarFallback>}
                  <AvatarFallback className='rounded-lg'>{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{userData.name}</span>
                  <span className='truncate text-xs'>{userData.email}</span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    {userData.avatar && <AvatarFallback><img src={userData.avatar} alt={userData.name} /></AvatarFallback>}
                    <AvatarFallback className='rounded-lg'>{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold'>{userData.name}</span>
                    <span className='truncate text-xs'>{userData.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to='/settings/account'>
                    <BadgeCheck />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/settings'>
                    <CreditCard />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/settings/notifications'>
                    <Bell />
                    Notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(false)}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={false} onOpenChange={() => {}} />
    </>
  )
}
