import {
  Archive,
  ArrowLeftRight,
  Bell,
  FileText,
  LayoutDashboard,
  Laptop,
  DollarSign,
  MapPin,
  Package,
  Printer,
  Shield,
  Upload,
  UserCog,
  Wrench,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'LabAsset Manager',
      logo: Package,
      plan: 'SMK Edition',
    },
  ],
  navGroups: [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Assets',
          url: '/assets',
          icon: Archive,
        },
        {
          title: 'Loans',
          url: '/loans',
          icon: ArrowLeftRight,
        },
        {
          title: 'Maintenance',
          url: '/maintenance',
          icon: Wrench,
        },
      ],
    },
    {
      title: 'Reports',
      items: [
        {
          title: 'Reports',
          url: '/reports',
          icon: FileText,
          adminOnly: true,
        },
        {
          title: 'Audit Logs',
          url: '/audit-logs',
          icon: Shield,
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Print Labels',
      items: [
        {
          title: 'Label Aset',
          url: '/mass-label-print',
          icon: Printer,
        },
        {
          title: 'Label Maintenance',
          url: '/maintenance-label-print',
          icon: Printer,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          title: 'Notifications',
          url: '/notifications',
          icon: Bell,
        },
        {
          title: 'Import/Export',
          url: '/import-export',
          icon: Upload,
        },
        {
          title: 'Categories',
          url: '/master-data/categories',
          icon: Laptop,
        },
        {
          title: 'Budget Sources',
          url: '/master-data/budget-sources',
          icon: DollarSign,
        },
        {
          title: 'Locations',
          url: '/master-data/locations',
          icon: MapPin,
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          title: 'Profile',
          url: '/settings',
          icon: UserCog,
        },
        {
          title: 'Label Settings',
          url: '/settings/label',
          icon: Printer,
          adminOnly: true,
        },
      ],
    },
  ],
}