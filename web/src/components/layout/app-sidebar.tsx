import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useUserStore } from '@/stores/user-store'
import { useEffect } from 'react'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user, fetchUser } = useUserStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const filteredNavGroups = sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if ('adminOnly' in item && item.adminOnly) {
        return user?.role === 'admin'
      }
      return true
    }).map((item) => {
      if ('items' in item && item.items) {
        return {
          ...item,
          items: item.items.filter((subItem) => {
            if ('adminOnly' in subItem && subItem.adminOnly) {
              return user?.role === 'admin'
            }
            return true
          }),
        }
      }
      return item
    }),
  })).filter((group) => group.items.length > 0)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
