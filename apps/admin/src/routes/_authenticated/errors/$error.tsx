import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { createFileRoute } from '@tanstack/react-router'

// import { ForbiddenError } from '../(errors)/_components/forbidden'
// import { GeneralError } from '../(errors)/_components/general-error'
// import { MaintenanceError } from '../(errors)/_components/maintenance-error'
// import { NotFoundError } from '../(errors)/_components/not-found-error'
// import { UnauthorisedError } from '../(errors)/_components/unauthorized-error'

export const Route = createFileRoute('/_authenticated/errors/$error')({
  component: RouteComponent,
})

function RouteComponent() {
  // const { error } = Route.useParams()

  // const errorMap: Record<string, React.ComponentType> = {
  //   unauthorized: UnauthorisedError,
  //   forbidden: ForbiddenError,
  //   'not-found': NotFoundError,
  //   'internal-server-error': GeneralError,
  //   'maintenance-error': MaintenanceError,
  // }
  // const ErrorComponent = errorMap[error] || NotFoundError

  return (
    <>
      <Header fixed className='border-b'>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <div className='flex-1 [&>div]:h-full'>{/* <ErrorComponent /> */}</div>
    </>
  )
}
