import { AdminTable } from '@/components/data-table/admin-table'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import type { ITask } from '@linkdo/shared'
import type { ColumnDef } from '@tanstack/react-table'

type TasksTableProps = {
  data: ITask[]
  columns: ColumnDef<ITask>[]
  loading: boolean
  search: Record<string, unknown>
  navigate: NavigateFn
  total: number
}

export function TasksTable({
  data,
  columns,
  loading,
  search,
  navigate,
  total,
}: TasksTableProps) {
  return (
    <AdminTable
      data={data}
      columns={columns}
      loading={loading}
      search={search}
      navigate={navigate}
      total={total}
      paginationKey='page'
      pageSizeKey='pageSize'
      defaultPage={1}
      defaultPageSize={10}
    />
  )
}
