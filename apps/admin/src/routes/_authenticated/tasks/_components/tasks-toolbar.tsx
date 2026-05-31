import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRouteApi } from '@tanstack/react-router'
import { Search } from 'lucide-react'

const route = getRouteApi('/_authenticated/tasks/')

export function TasksToolbar() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  function updateParam(key: string, value: string) {
    navigate({
      search: {
        ...search,
        [key]: value,
      },
    })
  }

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          type='search'
          placeholder='Search tasks...'
          className='pl-8'
          defaultValue={search.keyword ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('keyword', (e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {/* <Select
        value={status}
        onValueChange={(val) => updateParam('status', val)}
      >
        <SelectTrigger className='w-[160px]'>
          <SelectValue placeholder='Filter by status' />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}

      <Button
        variant='outline'
        size='sm'
        onClick={() => navigate({ search: {} })}
      >
        Reset
      </Button>
    </div>
  )
}
