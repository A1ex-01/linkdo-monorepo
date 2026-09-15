import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@linkdo/ui/components/badge'
import { Skeleton } from '@linkdo/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@linkdo/ui/components/table'
import { adminService, type IAdminUser } from '@/services/admin'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function Users() {
  const [user, setUser] = useState<IAdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService
      .getMe()
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data)
        } else {
          toast.error(res.error || 'Failed to load current user')
        }
      })
      .catch(() => toast.error('Failed to load current user'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Current User</h2>
            <p className='text-muted-foreground'>
              Backed by the existing /auth/me endpoint.
            </p>
          </div>
          <Badge variant='outline'>GET /auth/me</Badge>
        </div>

        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              ) : user ? (
                <TableRow>
                  <TableCell className='font-medium'>
                    {user.name || '—'}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {user.avatar_url || '—'}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {user.email || 'Not returned'}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {user.role_name || 'Not returned'}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='h-24 text-center text-muted-foreground'
                  >
                    No current user data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/users/')({
  component: Users,
})
