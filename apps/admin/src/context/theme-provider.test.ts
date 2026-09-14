import { describe, expect, it } from 'vitest'
import * as themeProvider from './theme-provider'

type StyleThemeModule = {
  applyStyleTheme?: (theme: string) => void
  normalizeStyleTheme?: (theme: string | null) => string
}

const styleThemeModule = themeProvider as StyleThemeModule

describe('style theme preference', () => {
  it('validates and applies a persisted style theme to the document root', () => {
    expect(styleThemeModule.normalizeStyleTheme).toEqual(expect.any(Function))
    expect(styleThemeModule.normalizeStyleTheme?.('twitter')).toBe('twitter')
    expect(styleThemeModule.normalizeStyleTheme?.('unknown')).toBe('default')

    expect(styleThemeModule.applyStyleTheme).toEqual(expect.any(Function))
    styleThemeModule.applyStyleTheme?.('vercel')

    expect(document.documentElement.dataset.theme).toBe('vercel')
  })
})
