# Multi-Theme System Implementation

## Overview

This project now supports a dual-axis theme system:

1. **Style Theme** (Interface Style): `default` | `twitter` | `vercel`
2. **Color Scheme** (Light/Dark): `light` | `dark` | `system`

These two dimensions are completely independent and can be combined freely.

## Architecture

```
                    Components
                        ↓
                 Semantic Tokens
                        ↓
               ┌────────┴────────┐
               ↓                 ↓
         Style Theme        Color Scheme
               ↓                 ↓
 default / twitter / vercel   light / dark
               └────────┬────────┘
                        ↓
                  CSS Variables
```

## Files Modified

### Core Theme System

1. **`src/providers/style-theme-provider.tsx`** (NEW)
   - StyleThemeProvider context and hook
   - Manages `default`, `twitter`, `vercel` state
   - Persists to localStorage with key `linkdo-style-theme`
   - Default: `default`

2. **`src/providers/base.tsx`** (MODIFIED)
   - Wrapped children with `<StyleThemeProvider>`
   - Keeps existing `<ThemeProvider>` from `next-themes` for light/dark

3. **`src/app/layout.tsx`** (MODIFIED)
   - Added SSR script to prevent theme flash
   - Reads `linkdo-style-theme` from localStorage
   - Sets `data-theme` attribute before React hydration

### Theme CSS

4. **`src/styles/themes/twitter.css`** (NEW)
   - Twitter light: `[data-theme="twitter"]`
   - Twitter dark: `[data-theme="twitter"].dark`
   - Based on https://tweakcn.com/r/themes/twitter.json
   - Features: Blue primary, larger radius (1.3rem), social-first design

5. **`src/styles/themes/vercel.css`** (NEW)
   - Vercel light: `[data-theme="vercel"]`
   - Vercel dark: `[data-theme="vercel"].dark`
   - Based on https://tweakcn.com/r/themes/vercel.json
   - Features: Pure black/white, sharp radius (0.5rem), minimal shadows

6. **`src/styles/globals.css`** (MODIFIED)
   - Added imports for twitter.css and vercel.css
   - Default theme remains in `:root` and `.dark`

### UI Components

7. **`src/components/system-settings-dialog.tsx`** (MODIFIED)
   - Added "Interface Style" selector
   - Shows: Default, Twitter, Vercel
   - Works independently from Appearance (light/dark/system)

8. **`src/components/icons/base.tsx`** (MODIFIED)
   - Changed `bg-white` → `bg-card`
   - Changed `text-black` → `text-foreground`
   - Icons now adapt to all themes

9. **`src/components/window-title-bar.tsx`** (MODIFIED)
   - Changed `text-[#6b7280]` → `text-muted-foreground`
   - Changed `bg-gray-400` → `bg-muted`

10. **`src/components/ui/dialog.tsx`** (MODIFIED)
    - Changed `bg-black/10` → `bg-background/10`
    - Dialog overlay now theme-aware

## Default Theme Strategy

The `default` theme reuses the existing shadcn base theme defined in:
- `:root` (light mode)
- `.dark` (dark mode)

This means:
- No duplication of CSS variables
- `default` serves as the fallback for all themes
- `twitter` and `vercel` only override the tokens they need to change

## How It Works

### DOM Structure

```html
<!-- Default Light -->
<html data-theme="default">

<!-- Default Dark -->
<html data-theme="default" class="dark">

<!-- Twitter Light -->
<html data-theme="twitter">

<!-- Twitter Dark -->
<html data-theme="twitter" class="dark">

<!-- Vercel Light -->
<html data-theme="vercel">

<!-- Vercel Dark -->
<html data-theme="vercel" class="dark">
```

### CSS Cascade

1. **Default Theme**: `:root` and `.dark` define base tokens
2. **Twitter Theme**: `[data-theme="twitter"]` overrides tokens for light, `[data-theme="twitter"].dark` overrides for dark
3. **Vercel Theme**: `[data-theme="vercel"]` overrides tokens for light, `[data-theme="vercel"].dark` overrides for dark

### Token Overrides

Twitter and Vercel only override what they need. Example:

```css
/* Default defines all tokens */
:root {
  --background: oklch(...);
  --foreground: oklch(...);
  --primary: oklch(...);
  /* ... all tokens ... */
}

/* Twitter only overrides what's different */
[data-theme="twitter"] {
  --primary: oklch(0.6723 0.1606 244.9955); /* Twitter blue */
  --radius: 1.3rem; /* Larger radius */
  /* Inherits other tokens from :root */
}
```

## Usage

### In Code

```tsx
import { useStyleTheme } from '@/providers/style-theme-provider';

function MyComponent() {
  const { styleTheme, setStyleTheme } = useStyleTheme();
  
  return (
    <div>
      <p>Current theme: {styleTheme}</p>
      <button onClick={() => setStyleTheme('twitter')}>
        Switch to Twitter
      </button>
    </div>
  );
}
```

### In UI

Open System Settings (Settings icon or equivalent):
1. **Appearance**: Choose `Light`, `Dark`, or `System`
2. **Interface Style**: Choose `Default`, `Twitter`, or `Vercel`

Changes apply immediately and persist across sessions.

## Combinations

All 6 combinations are supported:

| Style Theme | Color Scheme | Result |
|-------------|--------------|--------|
| Default | Light | Default light theme |
| Default | Dark | Default dark theme |
| Twitter | Light | Twitter-style light theme |
| Twitter | Dark | Twitter-style dark theme |
| Vercel | Light | Vercel-style light theme |
| Vercel | Dark | Vercel-style dark theme |

## Component Guidelines

✅ **DO:**
```tsx
<div className="bg-background text-foreground">
<Button variant="primary">Save</Button>
<p className="text-muted-foreground">Subtitle</p>
```

❌ **DON'T:**
```tsx
{styleTheme === 'twitter' ? (
  <TwitterButton />
) : (
  <DefaultButton />
)}
```

Components should only use semantic tokens. The theme system handles the visual differences through CSS variables.

## Adding a New Theme

To add a new theme (e.g., `github`):

1. Create `src/styles/themes/github.css`:
   ```css
   [data-theme="github"] {
     /* GitHub Light tokens */
     --primary: oklch(...);
     --radius: ...;
   }
   
   [data-theme="github"].dark {
     /* GitHub Dark tokens */
   }
   ```

2. Import in `globals.css`:
   ```css
   @import "./themes/github.css";
   ```

3. Update `StyleTheme` type:
   ```ts
   export type StyleTheme = "default" | "twitter" | "vercel" | "github";
   ```

4. Update localStorage validator in `style-theme-provider.tsx`:
   ```ts
   if (stored && ["default", "twitter", "vercel", "github"].includes(stored))
   ```

5. Add to settings UI:
   ```tsx
   <SelectItem value="github">GitHub</SelectItem>
   ```

## SSR & Hydration

The implementation prevents theme flash on initial load:

1. **Server-side script** in `layout.tsx` runs before React hydration
2. Reads `linkdo-style-theme` from localStorage
3. Sets `data-theme` attribute immediately
4. React hydrates with correct theme already applied
5. `suppressHydrationWarning` on `<html>` prevents mismatch warnings

## Semantic Token Reference

Components use these semantic tokens which adapt to all themes:

### Colors
- `background` / `foreground` - Base canvas
- `card` / `card-foreground` - Card surfaces
- `popover` / `popover-foreground` - Floating surfaces
- `primary` / `primary-foreground` - Primary actions
- `secondary` / `secondary-foreground` - Secondary surfaces
- `muted` / `muted-foreground` - Subdued UI
- `accent` / `accent-foreground` - Interactive highlights
- `destructive` / `destructive-foreground` - Dangerous actions

### Borders & Input
- `border` - Default borders
- `input` - Input field borders
- `ring` - Focus rings

### Layout
- `radius` - Border radius scale
- `sidebar-*` - Sidebar-specific tokens
- `chart-*` - Chart color tokens

## Known Issues & Notes

- ✅ All existing shadcn components work with all themes
- ✅ No component duplication required
- ✅ Theme flash prevented with SSR script
- ⚠️ Some third-party icons (ClickUp logo) have white backgrounds - wrapped in `bg-card` for theme adaptation
- ⚠️ Traffic light buttons in window-title-bar have fixed colors (macOS design convention)

## Testing Checklist

Test all 6 combinations:
- [ ] Default + Light
- [ ] Default + Dark
- [ ] Twitter + Light
- [ ] Twitter + Dark
- [ ] Vercel + Light
- [ ] Vercel + Dark

For each combination, verify:
- [ ] Button states (hover, active, disabled)
- [ ] Form inputs (text, select, checkbox)
- [ ] Dialogs and popovers
- [ ] Cards and containers
- [ ] Borders and shadows
- [ ] Text hierarchy (foreground, muted-foreground)
- [ ] Icons and images
- [ ] Page refresh preserves both settings
