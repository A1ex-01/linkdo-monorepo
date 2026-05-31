import { AdminTable } from '@/components/data-table/admin-table'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import type { Collection } from '@/services/admin'
import type { ColumnDef } from '@tanstack/react-table'

type CollectionsTableProps = {
  data: Collection[]
  columns: ColumnDef<Collection>[]
  loading: boolean
  search: Record<string, unknown>
  navigate: NavigateFn
  total: number
}

export function CollectionsTable({
  data,
  columns,
  loading,
  search,
  navigate,
  total,
}: CollectionsTableProps) {
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
