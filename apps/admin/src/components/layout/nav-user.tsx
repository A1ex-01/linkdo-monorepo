import { SignOutDialog } from '@/components/sign-out-dialog'
import { SystemSettingsDialog } from '@/components/system-settings-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@linkdo/ui/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@linkdo/ui/components/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@linkdo/ui/components/sidebar'
import useDialogState from '@/hooks/use-dialog-state'
import { useAuthStore } from '@/stores/auth-store'
import { ChevronsUpDown, LogOut, Palette } from 'lucide-react'
import { useState } from 'react'

export function NavUser() {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { auth } = useAuthStore()
  const user = auth.user

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className='rounded-lg'>
                    {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {user?.name ?? 'Admin'}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {user?.email ?? ''}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className='rounded-lg'>
                      {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {user?.name ?? 'Admin'}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {user?.email ?? ''}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                <Palette />
                Appearance
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(true)}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
      <SystemSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
