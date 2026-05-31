import { createFileRoute } from '@tanstack/react-router'
import {
  Users,
  ListChecks,
  FolderOpen,
  BarChart3,
  Bell,
  Shield,
  RefreshCw,
  Settings,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react'

export function ProductIntro() {
  const features = [
    {
      title: 'Dashboard Overview',
      description:
        'Get a real-time overview of your Link-Do platform. See total users, tasks, collections, and daily completion stats at a glance.',
      icon: LayoutDashboard,
      highlight: 'Real-time Stats',
    },
    {
      title: 'User Management',
      description:
        'Browse, search, and manage all registered users. View user details, track activity, and manage user roles and permissions.',
      icon: Users,
      highlight: 'User Control',
    },
    {
      title: 'Collection Management',
      description:
        'View all collections across the platform. Monitor collection health, track task counts, and manage shared workspaces.',
      icon: FolderOpen,
      highlight: 'Workspace Control',
    },
    {
      title: 'Task Management',
      description:
        'Access every task in the system. Filter by status, assignee, collection, or date range. View detailed task sessions and focus time.',
      icon: ListChecks,
      highlight: 'Full Task Visibility',
    },
    {
      title: 'Analytics & Reporting',
      description:
        'Track platform usage trends, task completion rates, and user engagement. Identify bottlenecks and optimize team productivity.',
      icon: BarChart3,
      highlight: 'Data-Driven Insights',
    },
    {
      title: 'Session Tracking',
      description:
        'Monitor focus sessions and Pomodoro timers. Review session duration, completion rates, and user focus patterns.',
      icon: Sparkles,
      highlight: 'Focus Analytics',
    },
    {
      title: 'Notification Management',
      description:
        'View and manage system-wide notifications and alerts. Monitor delivery status and troubleshoot notification delivery issues.',
      icon: Bell,
      highlight: 'Alert Control',
    },
    {
      title: 'Role & Permission Control',
      description:
        'Define roles and manage granular permissions for users. Control who can access what data and which actions they can perform.',
      icon: Shield,
      highlight: 'Access Control',
    },
    {
      title: 'System Sync & Sync Logs',
      description:
        'Monitor Notion sync status across all users and collections. View detailed sync logs, troubleshoot failures, and trigger manual resyncs.',
      icon: RefreshCw,
      highlight: 'Sync Oversight',
    },
    {
      title: 'Platform Settings',
      description:
        'Configure global platform settings including sync intervals, notification preferences, data retention policies, and branding options.',
      icon: Settings,
      highlight: 'Configuration',
    },
  ]

  return (
    <div className='space-y-8 p-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Product Introduction</h2>
        <p className='text-muted-foreground mt-1'>
          An overview of all features and capabilities available in the Link-Do Admin panel.
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {features.map((feature) => (
          <div
            key={feature.title}
            className='group relative rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/30'
          >
            <div className='mb-3 flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
                <feature.icon className='size-4 text-primary' />
              </div>
              <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                {feature.highlight}
              </span>
            </div>
            <h3 className='mb-1.5 text-base font-semibold'>{feature.title}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/product-intro/')({
  component: ProductIntro,
})
