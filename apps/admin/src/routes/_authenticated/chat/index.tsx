import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import ChatPanel from './_components/chat-panel'

export function ChatComponent() {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <ChatPanel />
      </Main>
    </>
  )
}

const chatSearchSchema = z.object({})

export const Route = createFileRoute('/_authenticated/chat/')({
  validateSearch: chatSearchSchema,
  component: ChatComponent,
})
