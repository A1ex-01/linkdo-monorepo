import { Badge } from '@/components/ui/badge'
import { createFileRoute } from '@tanstack/react-router'

function RolesPage() {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Roles</h2>
          <p className='text-muted-foreground'>
            The backend router does not currently register role or permission
            APIs.
          </p>
        </div>
        <Badge variant='outline'>No registered endpoint</Badge>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/roles/')({
  component: RolesPage,
})
