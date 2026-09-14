import { describe, expect, it } from 'vitest'
import sidebarSource from '@linkdo/ui/components/sidebar?raw'

describe('shared sidebar menu state', () => {
  it('styles only a menu item whose active state is true', () => {
    expect(sidebarSource).toContain(
      'data-[active=true]:bg-sidebar-accent'
    )
    expect(sidebarSource).not.toContain('data-active:bg-sidebar-accent')
  })
})
