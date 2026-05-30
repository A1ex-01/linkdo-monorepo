import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Clock, PlayCircle } from 'lucide-react'
import { adminService, type TimeSession } from '@/services/admin'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TaskSessionsModalProps = {
  taskUuid: string
  taskTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

export function TaskSessionsModal({
  taskUuid,
  taskTitle,
  open,
  onOpenChange,
}: TaskSessionsModalProps) {
  const [sessions, setSessions] = useState<TimeSession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !taskUuid) return
    queueMicrotask(() => setLoading(true))
    adminService
      .getTaskSessions(taskUuid)
      .then((res) => {
        if (res.success && res.data) {
          setSessions(res.data)
        } else {
          toast.error(res.error || 'Failed to load sessions')
        }
      })
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [open, taskUuid])

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Clock className='size-5 text-muted-foreground' />
            <span className='truncate'>{taskTitle}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <span className='animate-pulse text-muted-foreground'>
              Loading sessions...
            </span>
          </div>
        ) : sessions.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-8 text-muted-foreground'>
            <PlayCircle className='size-8 opacity-30' />
            <p>No sessions recorded.</p>
          </div>
        ) : (
          <div className='space-y-2'>
            <div className='text-sm text-muted-foreground'>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} &middot; Total:{' '}
              <span className='font-medium text-foreground'>
                {formatDuration(totalDuration)}
              </span>
            </div>
            <div className='max-h-80 overflow-y-auto space-y-1.5'>
              {sessions.map((session) => (
                <div
                  key={session.uuid}
                  className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                >
                  <div className='flex flex-col'>
                    <span className='text-xs text-muted-foreground'>
                      {formatDateTime(session.started_at)}
                      {session.ended_at && ` — ${formatDateTime(session.ended_at)}`}
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5 font-mono text-sm'>
                    <Clock className='size-3.5 text-muted-foreground' />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
