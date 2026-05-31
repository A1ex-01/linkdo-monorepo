import {
  FolderOpen,
  Info,
  LayoutDashboard,
  ListTodo,
  Shield,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },

  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Collections',
          url: '/collections',
          icon: FolderOpen,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Roles',
          url: '/roles',
          icon: Shield,
        },
        {
          title: 'Product Intro',
          url: '/product-intro',
          icon: Info,
        },
      ],
    },
  ],
}
