import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { adminService, type User } from '@/services/admin'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import { UsersProvider } from './_components/users-provider'
import { UsersTable } from './_components/users-table'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const page = typeof search.page === 'number' ? search.page : 1
    const pageSize = typeof search.pageSize === 'number' ? search.pageSize : 10
    const keyword = search.username || ''
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
    })
    adminService
      .listUsers({ current: page, pageSize, keyword: keyword || undefined })
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) {
          setData(res.data.list)
          setTotal(res.data.total)
        } else {
          toast.error(res.error || 'Failed to fetch users')
        }
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Failed to fetch users')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search.page, search.pageSize, search.username])

  return (
    <UsersProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              {loading ? 'Loading...' : `${total} users total`}
            </p>
          </div>
        </div>
        <UsersTable
          data={data}
          loading={loading}
          search={search}
          navigate={navigate}
          total={total}
        />
      </Main>
    </UsersProvider>
  )
}

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  username: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
