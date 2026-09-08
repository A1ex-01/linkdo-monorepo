import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  backendApiCatalog,
  flattenBackendApiCatalog,
  type ApiEndpoint,
} from '@/lib/backend-api-catalog'
import { createFileRoute } from '@tanstack/react-router'

const methodVariant: Record<ApiEndpoint['method'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DELETE: 'destructive',
  GET: 'secondary',
  PATCH: 'outline',
  POST: 'default',
  PUT: 'outline',
}

function ApiReference() {
  const endpoints = flattenBackendApiCatalog()

  return (
    <>
      <Header fixed />
      <Main className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>API Reference</h2>
            <p className='text-muted-foreground'>
              {endpoints.length} backend endpoints scanned from service routers.
            </p>
          </div>
        </div>

        <div className='flex flex-col gap-6'>
          {backendApiCatalog.map((group) => (
            <section key={group.title} className='flex flex-col gap-3'>
              <div className='flex items-center gap-2'>
                <h3 className='text-lg font-semibold'>{group.title}</h3>
                <Badge variant='outline'>{group.endpoints.length}</Badge>
              </div>
              <div className='overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-24'>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead className='w-28'>Service</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.endpoints.map((endpoint) => (
                      <TableRow key={`${endpoint.method} ${endpoint.path}`}>
                        <TableCell>
                          <Badge variant={methodVariant[endpoint.method]}>
                            {endpoint.method}
                          </Badge>
                        </TableCell>
                        <TableCell className='font-mono text-xs'>
                          {endpoint.path}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>{endpoint.service}</Badge>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {endpoint.summary}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/api-reference/')({
  component: ApiReference,
})
