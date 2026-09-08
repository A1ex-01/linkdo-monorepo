import {
  FolderOpen,
  Info,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  Plug,
  ScrollText,
  Server,
  SlidersHorizontal,
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
          title: 'API Reference',
          url: '/api-reference',
          icon: Server,
        },
        {
          title: 'Integrations',
          url: '/integrations',
          icon: Plug,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: ScrollText,
        },
        {
          title: 'Operations',
          url: '/operations',
          icon: SlidersHorizontal,
        },
        {
          title: 'Current User',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Product Intro',
          url: '/product-intro',
          icon: Info,
        },
        {
          title: 'Chat',
          url: '/chat',
          icon: MessageCircle,
        },
      ],
    },
  ],
}
