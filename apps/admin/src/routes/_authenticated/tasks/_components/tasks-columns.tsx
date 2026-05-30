import { type ColumnDef } from '@tanstack/react-table'
import type { Task } from '@/services/admin'
import { Clock, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

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

type TasksColumnsProps = {
  onViewSessions: (task: Task) => void
}

export function getTasksColumns({
  onViewSessions,
}: TasksColumnsProps): ColumnDef<Task>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className='max-w-[300px] truncate font-medium'>
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        const variant =
          s === 'done' || s === 'completed'
            ? 'default'
            : s === 'in_progress' || s === 'doing'
              ? 'secondary'
              : 'outline'
        return <Badge variant={variant}>{s}</Badge>
      },
    },
    {
      accessorKey: 'collection_uuid',
      header: 'Collection',
      cell: ({ row }) => (
        <span className='max-w-[150px] truncate text-xs text-muted-foreground'>
          {row.original.collection_uuid.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: 'estimated_time',
      header: 'Estimated',
      cell: ({ row }) => (
        <span className='inline-flex items-center gap-1 font-mono text-xs'>
          <Clock className='size-3 text-muted-foreground' />
          {formatTime(row.original.estimated_time)}
        </span>
      ),
    },
    {
      accessorKey: 'actual_time',
      header: 'Actual',
      cell: ({ row }) => (
        <span className='inline-flex items-center gap-1 font-mono text-xs'>
          <Clock className='size-3 text-muted-foreground' />
          {formatTime(row.original.actual_time)}
        </span>
      ),
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
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 gap-1'
            onClick={() => onViewSessions(row.original)}
          >
            <Eye className='size-4' />
            Sessions
          </Button>
        </div>
      ),
    },
  ]
}
