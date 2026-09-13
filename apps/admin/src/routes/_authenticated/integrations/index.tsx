import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  adminService,
  type ClickUpList,
  type NotionDatabase,
} from '@/services/admin'
import { createFileRoute } from '@tanstack/react-router'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function asJSON(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function IntegrationsPage() {
  const [notionDatabases, setNotionDatabases] = useState<NotionDatabase[]>([])
  const [clickupLists, setClickupLists] = useState<ClickUpList[]>([])
  const [notionQuery, setNotionQuery] = useState('')
  const [clickupPath, setClickupPath] = useState('team')
  const [result, setResult] = useState('No response yet.')
  const [loading, setLoading] = useState(false)

  function loadLinkedTargets() {
    setLoading(true)
    Promise.all([
      adminService.listNotionDatabases(),
      adminService.listClickUpLists(),
    ])
      .then(([notionRes, clickupRes]) => {
        if (notionRes.success) setNotionDatabases(notionRes.data ?? [])
        if (clickupRes.success) setClickupLists(clickupRes.data ?? [])
        if (!notionRes.success) toast.error(notionRes.error)
        if (!clickupRes.success) toast.error(clickupRes.error)
      })
      .catch(() => toast.error('Failed to load integrations'))
      .finally(() => setLoading(false))
  }

  async function openOAuth(platform: 'notion' | 'clickup') {
    const res = await adminService.getLinkOAuthURL(platform)
    if (res.success && res.data?.url) {
      setResult(asJSON(res.data))
      window.open(res.data.url, '_blank', 'noopener,noreferrer')
    } else {
      toast.error(res.error || `Failed to get ${platform} OAuth URL`)
    }
  }

  async function discoverNotion() {
    const res = await adminService.listLinkNotionDatabases({
      query: notionQuery || undefined,
    })
    if (res.success) setResult(asJSON(res.data ?? []))
    else toast.error(res.error || 'Failed to query Notion databases')
  }

  async function discoverClickUp() {
    const res = await adminService.listClickUpResources({ path: clickupPath })
    if (res.success) setResult(asJSON(res.data ?? {}))
    else toast.error(res.error || 'Failed to query ClickUp resources')
  }

  async function fetchMapping(kind: 'notion' | 'clickup', uuid: string) {
    const res =
      kind === 'notion'
        ? await adminService.getNotionStatusMapping(uuid)
        : await adminService.getClickUpStatusMapping(uuid)
    if (res.success) setResult(asJSON(res.data ?? {}))
    else toast.error(res.error || 'Failed to load status mapping')
  }

  async function fetchOptions(kind: 'notion' | 'clickup', uuid: string) {
    const res =
      kind === 'notion'
        ? await adminService.fetchNotionStatusOptions(uuid)
        : await adminService.fetchClickUpStatusOptions(uuid)
    if (res.success) setResult(asJSON(res.data ?? []))
    else toast.error(res.error || 'Failed to fetch status options')
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Integrations</h2>
          <p className='text-muted-foreground'>
            Notion and ClickUp link, resource, target, and mapping APIs.
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={loadLinkedTargets}>
          <RefreshCw className='size-4' />
          Refresh
        </Button>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <section className='flex flex-col gap-4 rounded-md border p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='font-semibold'>Notion</h3>
            <Button size='sm' onClick={() => openOAuth('notion')}>
              <ExternalLink className='size-4' />
              OAuth URL
            </Button>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Input
              value={notionQuery}
              onChange={(event) => setNotionQuery(event.target.value)}
              placeholder='Search databases'
              className='min-w-56 flex-1'
            />
            <Button variant='outline' onClick={discoverNotion}>
              Search
            </Button>
          </div>
          <IntegrationTable
            kind='notion'
            loading={loading}
            rows={notionDatabases}
            onMapping={fetchMapping}
            onOptions={fetchOptions}
          />
        </section>

        <section className='flex flex-col gap-4 rounded-md border p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='font-semibold'>ClickUp</h3>
            <Button size='sm' onClick={() => openOAuth('clickup')}>
              <ExternalLink className='size-4' />
              OAuth URL
            </Button>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Input
              value={clickupPath}
              onChange={(event) => setClickupPath(event.target.value)}
              placeholder='team, team/{id}/space, space/{id}/list'
              className='min-w-56 flex-1'
            />
            <Button variant='outline' onClick={discoverClickUp}>
              Fetch
            </Button>
          </div>
          <IntegrationTable
            kind='clickup'
            loading={loading}
            rows={clickupLists}
            onMapping={fetchMapping}
            onOptions={fetchOptions}
          />
        </section>
      </div>

      <section className='flex flex-col gap-3 rounded-md border p-4'>
        <div className='flex items-center justify-between gap-2'>
          <h3 className='font-semibold'>Latest API Response</h3>
          <Badge variant='outline'>Read-only viewer</Badge>
        </div>
        <Textarea value={result} readOnly className='min-h-72 font-mono text-xs' />
      </section>
    </div>
  )
}

type IntegrationTableProps = {
  kind: 'notion' | 'clickup'
  loading: boolean
  rows: Array<NotionDatabase | ClickUpList>
  onMapping: (kind: 'notion' | 'clickup', uuid: string) => void
  onOptions: (kind: 'notion' | 'clickup', uuid: string) => void
}

function IntegrationTable({
  kind,
  loading,
  rows,
  onMapping,
  onOptions,
}: IntegrationTableProps) {
  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Remote ID</TableHead>
            <TableHead className='w-[190px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className='h-20 text-center'>
                Loading...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className='h-20 text-center text-muted-foreground'
              >
                No linked targets.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className='font-medium'>{row.name || '—'}</TableCell>
                <TableCell className='font-mono text-xs text-muted-foreground'>
                  {row.collection_uuid}
                </TableCell>
                <TableCell className='font-mono text-xs text-muted-foreground'>
                  {'notion_database_id' in row
                    ? row.notion_database_id
                    : row.clickup_list_id}
                </TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onMapping(kind, row.uuid)}
                    >
                      Mapping
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onOptions(kind, row.uuid)}
                    >
                      Options
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/integrations/')({
  component: IntegrationsPage,
})
