import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import type { User } from '@/services/admin'

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const usersColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'notion_user_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Notion User ID' />
    ),
    cell: ({ row }) => {
      const id = row.original.notion_user_id
      return (
        <div className='max-w-32 truncate font-mono text-xs text-muted-foreground'>
          {id || '—'}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Joined' />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground'>
        {formatDate(row.original.created_at)}
      </div>
    ),
    enableSorting: true,
  },
]
