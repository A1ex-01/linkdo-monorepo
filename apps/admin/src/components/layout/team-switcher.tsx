import { Command } from 'lucide-react'

export function TeamSwitcher() {
  const activeTeam = {
    name: 'Shadcn Admin',
    logo: Command,
    plan: 'Vite + ShadcnUI',
  }
  return (
    <div className='flex gap-2'>
      <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
        <activeTeam.logo className='size-4' />
      </div>
      <div className='grid flex-1 text-start text-sm leading-tight'>
        <span className='truncate font-semibold'>{activeTeam.name}</span>
        <span className='truncate text-xs'>{activeTeam.plan}</span>
      </div>
    </div>
  )
}
