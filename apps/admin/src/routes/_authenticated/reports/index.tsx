import { Badge } from '@linkdo/ui/components/badge'
import { Button } from '@linkdo/ui/components/button'
import { Input } from '@linkdo/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@linkdo/ui/components/table'
import {
  adminService,
  type CollectionBreakdown,
  type ReportSession,
  type ReportSummary,
  type TimelinePoint,
} from '@/services/admin'
import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function formatMinutes(minutes: number) {
  if (!minutes) return '0m'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [collectionUuids, setCollectionUuids] = useState('')
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [breakdown, setBreakdown] = useState<CollectionBreakdown[]>([])
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [sessions, setSessions] = useState<ReportSession[]>([])
  const [loading, setLoading] = useState(false)

  function params() {
    return {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      collection_uuids: collectionUuids
        ? collectionUuids.split(',').map((value) => value.trim())
        : undefined,
    }
  }

  function loadReports() {
    setLoading(true)
    const query = params()
    Promise.all([
      adminService.getReportSummary(query),
      adminService.getReportBreakdown(query),
      adminService.getReportTimeline(query),
      adminService.getReportSessions(query),
    ])
      .then(([summaryRes, breakdownRes, timelineRes, sessionsRes]) => {
        if (summaryRes.success) setSummary(summaryRes.data ?? null)
        if (breakdownRes.success) setBreakdown(breakdownRes.data ?? [])
        if (timelineRes.success) setTimeline(timelineRes.data ?? [])
        if (sessionsRes.success) setSessions(sessionsRes.data ?? [])
        const failed = [summaryRes, breakdownRes, timelineRes, sessionsRes].find(
          (res) => !res.success
        )
        if (failed) toast.error(failed.error || 'Failed to load reports')
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Reports</h2>
          <p className='text-muted-foreground'>
            Summary, breakdown, timeline, and focus session report APIs.
          </p>
        </div>
        <Badge variant='outline'>GET /reports/*</Badge>
      </div>

      <div className='flex flex-wrap items-end gap-2 rounded-md border p-4'>
        <Input
          type='date'
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className='w-44'
        />
        <Input
          type='date'
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className='w-44'
        />
        <Input
          value={collectionUuids}
          onChange={(event) => setCollectionUuids(event.target.value)}
          placeholder='collection uuid, collection uuid'
          className='min-w-72 flex-1'
        />
        <Button onClick={loadReports} disabled={loading}>
          <RefreshCw className='size-4' />
          {loading ? 'Loading' : 'Refresh'}
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <Metric label='Work Days' value={summary?.total_work_days ?? 0} />
        <Metric label='Completed' value={summary?.completed_tasks ?? 0} />
        <Metric label='Total Tasks' value={summary?.total_tasks ?? 0} />
        <Metric
          label='Estimated'
          value={formatMinutes(summary?.estimated_time_minutes ?? 0)}
        />
        <Metric
          label='Actual'
          value={formatMinutes(summary?.actual_time_minutes ?? 0)}
        />
      </div>

      <section className='flex flex-col gap-3 rounded-md border p-4'>
        <h3 className='font-semibold'>Collection Breakdown</h3>
        <DataTable
          empty='No breakdown rows.'
          headers={[
            'Collection',
            'Total',
            'Completed',
            'In Progress',
            'Backlog',
            'Estimated',
            'Actual',
          ]}
          rows={breakdown.map((row) => [
            `${row.collection_icon ?? ''} ${row.collection_name}`,
            row.total,
            row.completed,
            row.in_progress,
            row.backlog,
            formatMinutes(row.estimated_minutes),
            formatMinutes(row.actual_minutes),
          ])}
        />
      </section>

      <section className='flex flex-col gap-3 rounded-md border p-4'>
        <h3 className='font-semibold'>Timeline</h3>
        <DataTable
          empty='No timeline points.'
          headers={['Date', 'Started', 'Completed', 'Focus']}
          rows={timeline.map((row) => [
            row.date,
            row.started_count,
            row.completed_count,
            formatMinutes(row.focus_minutes),
          ])}
        />
      </section>

      <section className='flex flex-col gap-3 rounded-md border p-4'>
        <h3 className='font-semibold'>Sessions</h3>
        <DataTable
          empty='No focus sessions.'
          headers={['Task', 'Collection', 'Started', 'Ended', 'Duration']}
          rows={sessions.map((row) => [
            row.task_title,
            row.collection_name,
            row.started_at,
            row.ended_at ?? 'Active',
            formatMinutes(Math.round(row.duration / 60)),
          ])}
        />
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='rounded-md border p-4'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='mt-2 text-2xl font-semibold'>{value}</p>
    </div>
  )
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[]
  rows: Array<Array<string | number>>
  empty: string
}) {
  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow key={index}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className='h-20 text-center text-muted-foreground'
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/reports/')({
  component: ReportsPage,
})
