# Font Loading Instructions

Since Geist fonts are not available on Google Fonts, you have two options:

## Option 1: Download Geist Fonts (Recommended for Vercel theme)

1. Download Geist fonts from https://vercel.com/font
2. Place the following files in `apps/desktop/src/fonts/`:
   - `Geist-Regular.woff2`
   - `Geist-Medium.woff2`
   - `Geist-SemiBold.woff2`
   - `Geist-Bold.woff2`
   - `GeistMono-Regular.woff2`
   - `GeistMono-Medium.woff2`
   - `GeistMono-SemiBold.woff2`
   - `GeistMono-Bold.woff2`

## Option 2: Use Fallback (Quick Start)

If you don't have Geist fonts, the theme will automatically fall back to system fonts:
- `Geist` → `system-ui, sans-serif`
- `Geist Mono` → `Menlo, monospace`

## Current Font Setup

### Default Theme
- Sans: Montserrat (Google Fonts) ✅
- Serif: Merriweather (Google Fonts) ✅
- Mono: Ubuntu Mono (Google Fonts) ✅

### Twitter Theme
- Sans: Open Sans (Google Fonts) ✅
- Serif: Georgia (system font) ✅
- Mono: Menlo (system font) ✅

### Vercel Theme
- Sans: Geist (local files required) ⚠️
- Serif: Georgia (system font) ✅
- Mono: Geist Mono (local files required) ⚠️

## Implementation Details

The fonts are loaded in `layout.tsx` with CSS variables:
- `--font-montserrat` (Default)
- `--font-merriweather` (Default)
- `--font-ubuntu-mono` (Default)
- `--font-open-sans` (Twitter)
- `--font-geist` (Vercel)
- `--font-geist-mono` (Vercel)

Each theme CSS file (`twitter.css`, `vercel.css`) references the appropriate font variable in its `--font-sans` and `--font-mono` tokens.
