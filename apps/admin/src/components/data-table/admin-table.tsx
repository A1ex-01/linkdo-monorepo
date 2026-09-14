import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@linkdo/ui/components/table'
import { cn } from '@/lib/utils'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { DataTablePagination } from './pagination'

type AdminTableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  loading: boolean
  search: Record<string, unknown>
  navigate: (opts: {
    search:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>)
  }) => void
  total: number
  paginationKey?: string
  pageSizeKey?: string
  defaultPage?: number
  defaultPageSize?: number
  className?: string
}

export function AdminTable<T>({
  data,
  columns,
  loading,
  search,
  navigate,
  total,
  paginationKey = 'page',
  pageSizeKey = 'pageSize',
  defaultPage = 1,
  defaultPageSize = 10,
  className,
}: AdminTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  function getPageNum(key: string, fallback: number): number {
    const val = search[key]
    return typeof val === 'number' ? val : fallback
  }

  const currentPage = getPageNum(paginationKey, defaultPage)
  const pageSize = getPageNum(pageSizeKey, defaultPageSize)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const pagination: { pageIndex: number; pageSize: number } = {
    pageIndex: Math.max(0, currentPage - 1),
    pageSize,
  }

  function onPaginationChange(
    updater:
      | { pageIndex: number; pageSize: number }
      | ((old: { pageIndex: number; pageSize: number }) => {
          pageIndex: number
          pageSize: number
        })
  ) {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        [paginationKey]: next.pageIndex === 0 ? undefined : next.pageIndex + 1,
        [pageSizeKey]:
          next.pageSize === defaultPageSize ? undefined : next.pageSize,
      }),
    })
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    pageCount,
    manualPagination: true,
    enableRowSelection: false,
    onPaginationChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className={cn('flex flex-1 flex-col gap-4', className)}>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'bg-background group-hover/row:bg-muted',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <span className='animate-pulse text-muted-foreground'>
                    Loading...
                  </span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='group/row'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
