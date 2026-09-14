import { describe, expect, it } from 'vitest'
import mainSource from './main.tsx?raw'

describe('admin application shell', () => {
  it('provides tooltip context for every route', () => {
    expect(mainSource).toContain('<TooltipProvider>')
  })

  it('provides style-theme context for every route', () => {
    expect(mainSource).toContain('<StyleThemeProvider>')
  })
})
