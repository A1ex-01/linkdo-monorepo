import { useEffect, useState } from 'react'
import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { adminService, type Collection } from '@/services/admin'
import { toast } from 'sonner'
import { AppTitle } from '@/components/layout/app-title'
import { getCollectionsColumns } from './_components/collections-columns'
import { CollectionsTable } from './_components/collections-table'

// const route = getRouteApi('/_authenticated/collections/')

function Collections() {
  // const search = route.useSearch()
  const [data, setData] = useState<Collection[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  // const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    queueMicrotask(() => setLoading(true))

    // const page = searchParams.get('page')
    // const pageSize = searchParams.get('pageSize')

    const params = {
      // ...(page ? { current: Number(page) } : {}),
      // ...(pageSize ? { pageSize: Number(pageSize) } : {}),
    }

    adminService
      .listCollections(params)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data.list)
          setTotal(res.data.total)
        } else {
          toast.error(res.error || 'Failed to load collections')
        }
      })
      .catch(() => toast.error('Failed to load collections'))
      .finally(() => setLoading(false))
  }, [])

  const columns = getCollectionsColumns()

  return (
    <div className='flex flex-col gap-6'>
      <AppTitle
        title='Collections'
        description='View and manage all collections.'
      />

      <CollectionsTable
        data={data}
        columns={columns}
        loading={loading}
        search={{}}
        navigate={() => {}}
        total={total}
      />
    </div>
  )
}
const collectionsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/collections/')({
  validateSearch: collectionsSearchSchema,
  component: Collections,
})
