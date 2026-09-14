import { Badge } from '@linkdo/ui/components/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@linkdo/ui/components/dialog'
import { Label } from '@linkdo/ui/components/label'
import {
  type StyleTheme,
  type Theme,
  useStyleTheme,
  useTheme,
} from '@/context/theme-provider'
import { cn } from '@/lib/utils'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@linkdo/ui/components/toggle-group'
import { Monitor, Moon, Palette, Sun } from 'lucide-react'

const styleOptions: Array<{
  value: StyleTheme
  label: string
  description: string
}> = [
  { value: 'default', label: 'Default', description: 'Balanced' },
  { value: 'twitter', label: 'Twitter', description: 'Bright blue' },
  { value: 'vercel', label: 'Vercel', description: 'Monochrome' },
]

export function SystemSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const { theme, setTheme } = useTheme()
  const { styleTheme, setStyleTheme } = useStyleTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg p-7'>
        <DialogHeader>
          <DialogTitle className='text-2xl'>System settings</DialogTitle>
        </DialogHeader>
        <div className='mt-4 flex flex-col gap-7'>
          <div className='flex flex-col gap-3'>
            <Label htmlFor='theme-select' className='text-sm font-medium'>
              Appearance
            </Label>
            <ToggleGroup
              id='theme-select'
              type='single'
              value={theme}
              onValueChange={(value) => value && setTheme(value as Theme)}
              variant='outline'
              spacing={0}
              className='bg-muted w-full rounded-lg p-1'
              aria-label='Appearance'
            >
              <ToggleGroupItem value='light' className='flex-1 gap-2'>
                <Sun data-icon='inline-start' />
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value='dark' className='flex-1 gap-2'>
                <Moon data-icon='inline-start' />
                Dark
              </ToggleGroupItem>
              <ToggleGroupItem value='system' className='flex-1 gap-2'>
                <Monitor data-icon='inline-start' />
                System
              </ToggleGroupItem>
            </ToggleGroup>
            <p className='text-muted-foreground text-xs'>
              Choose how Linkdo looks. System uses your device&apos;s theme.
            </p>
          </div>

          <div className='flex flex-col gap-3'>
            <Label
              htmlFor='style-theme-select'
              className='text-sm font-medium'
            >
              Interface Style
            </Label>
            <div
              id='style-theme-select'
              className='flex flex-wrap gap-2'
              role='radiogroup'
              aria-label='Interface style'
            >
              {styleOptions.map((option) => {
                const selected = styleTheme === option.value

                return (
                  <Badge
                    key={option.value}
                    asChild
                    variant={selected ? 'default' : 'secondary'}
                    className={cn(
                      'h-auto cursor-pointer rounded-lg px-3 py-2 transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    <button
                      type='button'
                      role='radio'
                      aria-checked={selected}
                      onClick={() => setStyleTheme(option.value)}
                    >
                      <Palette data-icon='inline-start' />
                      <span className='flex flex-col items-start gap-0.5'>
                        <span>{option.label}</span>
                        <span className='text-[10px] font-normal opacity-70'>
                          {option.description}
                        </span>
                      </span>
                    </button>
                  </Badge>
                )
              })}
            </div>
            <p className='text-muted-foreground text-xs'>
              Choose the visual style independently from the light/dark theme.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
