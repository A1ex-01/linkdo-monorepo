import { Badge } from '@linkdo/ui/components/badge'
import { Button } from '@linkdo/ui/components/button'
import { Input } from '@linkdo/ui/components/input'
import { Textarea } from '@linkdo/ui/components/textarea'
import { adminService } from '@/services/admin'
import { createFileRoute } from '@tanstack/react-router'
import { Play, Square, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function asJSON(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function OperationsPage() {
  const [taskUuid, setTaskUuid] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState('No response yet.')
  const [loading, setLoading] = useState(false)

  async function run(label: string, action: () => Promise<unknown>) {
    setLoading(true)
    try {
      const res = await action()
      setResult(asJSON(res))
    } catch {
      toast.error(`${label} failed`)
    } finally {
      setLoading(false)
    }
  }

  function requireTaskUuid() {
    if (taskUuid.trim()) return taskUuid.trim()
    toast.error('Task UUID is required')
    return ''
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Operations</h2>
          <p className='text-muted-foreground'>
            Timer, sync, and image upload APIs.
          </p>
        </div>
        <Badge variant='outline'>POST/GET operational endpoints</Badge>
      </div>

      <section className='flex flex-col gap-4 rounded-md border p-4'>
        <div>
          <h3 className='font-semibold'>Timer</h3>
          <p className='text-sm text-muted-foreground'>
            Uses /timer/current and /tasks/:uuid/timer start or stop.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Input
            value={taskUuid}
            onChange={(event) => setTaskUuid(event.target.value)}
            placeholder='Task UUID'
            className='min-w-72 flex-1'
          />
          <Button
            variant='outline'
            disabled={loading}
            onClick={() =>
              run('Current timer', () => adminService.getCurrentTimer())
            }
          >
            Current
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              const uuid = requireTaskUuid()
              if (uuid) run('Start timer', () => adminService.startTimer(uuid))
            }}
          >
            <Play className='size-4' />
            Start
          </Button>
          <Button
            variant='outline'
            disabled={loading}
            onClick={() => {
              const uuid = requireTaskUuid()
              if (uuid) run('Stop timer', () => adminService.stopTimer(uuid))
            }}
          >
            <Square className='size-4' />
            Stop
          </Button>
        </div>
      </section>

      <section className='flex flex-col gap-4 rounded-md border p-4'>
        <div>
          <h3 className='font-semibold'>Sync</h3>
          <p className='text-sm text-muted-foreground'>
            Runs the existing /sync endpoint.
          </p>
        </div>
        <div>
          <Button disabled={loading} onClick={() => run('Sync', adminService.sync)}>
            Run Sync
          </Button>
        </div>
      </section>

      <section className='flex flex-col gap-4 rounded-md border p-4'>
        <div>
          <h3 className='font-semibold'>Image Upload</h3>
          <p className='text-sm text-muted-foreground'>
            Sends one image file to /files/upload.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Input
            type='file'
            accept='image/*'
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className='min-w-72 flex-1'
          />
          <Button
            disabled={loading || !file}
            onClick={() => {
              if (file) run('Upload', () => adminService.uploadFile(file))
            }}
          >
            <Upload className='size-4' />
            Upload
          </Button>
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-md border p-4'>
        <h3 className='font-semibold'>Latest API Response</h3>
        <Textarea value={result} readOnly className='min-h-72 font-mono text-xs' />
      </section>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/operations/')({
  component: OperationsPage,
})
