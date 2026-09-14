import { Badge } from '@linkdo/ui/components/badge'
import type { Collection } from '@/services/admin'
import { type ColumnDef } from '@tanstack/react-table'
import { Clock } from 'lucide-react'

function formatTime(minutes: number): string {
  if (minutes === 0) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function getCollectionsColumns(): ColumnDef<Collection>[] {
  return [
    {
      accessorKey: 'icon',
      header: 'Icon',
      cell: ({ row }) => (
        <span className='text-lg'>{row.original.icon || '📁'}</span>
      ),
      enableSorting: false,
      size: 60,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className='max-w-[250px] truncate font-medium'>
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'pending_count',
      header: 'Pending Tasks',
      cell: ({ row }) => {
        const count = row.original.pending_count
        return (
          <Badge variant={count > 0 ? 'secondary' : 'outline'}>{count}</Badge>
        )
      },
    },
    {
      accessorKey: 'estimated_total',
      header: 'Estimated',
      cell: ({ row }) => (
        <span className='inline-flex items-center gap-1 font-mono text-xs'>
          <Clock className='size-3 text-muted-foreground' />
          {formatTime(row.original.estimated_total)}
        </span>
      ),
    },
    {
      accessorKey: 'is_archived',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_archived ? 'destructive' : 'default'}>
          {row.original.is_archived ? 'Archived' : 'Active'}
        </Badge>
      ),
    },
    {
      id: 'targets',
      header: 'Linked Targets',
      cell: ({ row }) => {
        const notionCount = row.original.notion_databases?.length ?? 0
        const clickupCount = row.original.clickup_lists?.length ?? 0
        return (
          <div className='flex flex-wrap gap-1'>
            <Badge variant='outline'>Notion {notionCount}</Badge>
            <Badge variant='outline'>ClickUp {clickupCount}</Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className='text-xs text-muted-foreground'>
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
  ]
}
