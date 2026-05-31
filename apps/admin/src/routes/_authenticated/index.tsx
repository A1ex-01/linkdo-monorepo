import { cn } from '@/lib/utils'
import { adminService, type AdminStats } from '@/services/admin'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle, LayoutList, ListChecks, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminService.getStats()
        if (res.success && res.data) {
          setStats(res.data)
        } else {
          toast.error(res.error || 'Failed to load stats')
        }
      } catch {
        toast.error('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Total Users',
      value: stats?.total_users ?? '—',
      icon: Users,
      description: 'All registered users',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Total Tasks',
      value: stats?.total_tasks ?? '—',
      icon: ListChecks,
      description: 'Across all collections',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Total Collections',
      value: stats?.total_todos ?? '—',
      icon: LayoutList,
      description: 'Active collections',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Done Today',
      value: stats?.today_done ?? '—',
      icon: CheckCircle,
      description: 'Tasks completed today',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ]

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Dashboard</h2>
        <p className='text-muted-foreground'>
          Overview of your Link-Do platform.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {cards.map((card) => (
          <div
            key={card.title}
            className='rounded-xl border bg-card p-6 text-card-foreground shadow-sm'
          >
            <div className='flex items-center justify-between'>
              <p className='text-sm font-medium text-muted-foreground'>
                {card.title}
              </p>
              <div className={cn('rounded-lg p-2', card.bg)}>
                <card.icon className={cn('size-5', card.color)} />
              </div>
            </div>
            <div className='mt-3'>
              {loading ? (
                <div className='h-8 w-20 animate-pulse rounded bg-muted' />
              ) : (
                <p className='text-3xl font-bold'>{card.value}</p>
              )}
              <p className='mt-1 text-xs text-muted-foreground'>
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})
