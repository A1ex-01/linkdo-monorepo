export type ApiEndpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  service: 'base' | 'link' | 'file' | 'gateway'
  summary: string
}

export type ApiEndpointGroup = {
  title: string
  endpoints: ApiEndpoint[]
}

export const backendApiCatalog: ApiEndpointGroup[] = [
  {
    title: 'Auth',
    endpoints: [
      { method: 'GET', path: '/api/auth/me', service: 'base', summary: 'Current user profile' },
      { method: 'PATCH', path: '/api/auth/me', service: 'base', summary: 'Update current user profile' },
      { method: 'POST', path: '/api/auth/logout', service: 'base', summary: 'Logout current session' },
      { method: 'POST', path: '/api/auth/email/send-code', service: 'base', summary: 'Send email verification code' },
      { method: 'POST', path: '/api/auth/email/verify', service: 'base', summary: 'Verify email code and issue token' },
    ],
  },
  {
    title: 'Collections',
    endpoints: [
      { method: 'GET', path: '/api/collections', service: 'base', summary: 'List collections' },
      { method: 'POST', path: '/api/collections', service: 'base', summary: 'Create collection' },
      { method: 'GET', path: '/api/collections/{uuid}', service: 'base', summary: 'Get collection' },
      { method: 'PATCH', path: '/api/collections/{uuid}', service: 'base', summary: 'Update collection' },
      { method: 'DELETE', path: '/api/collections/{uuid}', service: 'base', summary: 'Delete collection' },
    ],
  },
  {
    title: 'Tasks & Timer',
    endpoints: [
      { method: 'GET', path: '/api/collections/{uuid}/tasks', service: 'base', summary: 'List tasks in collection' },
      { method: 'POST', path: '/api/collections/{uuid}/tasks', service: 'base', summary: 'Create task, optionally linked to Notion or ClickUp' },
      { method: 'PATCH', path: '/api/tasks/{uuid}', service: 'base', summary: 'Update task fields' },
      { method: 'PATCH', path: '/api/tasks/{uuid}/status', service: 'base', summary: 'Update task status' },
      { method: 'PATCH', path: '/api/tasks/{uuid}/move', service: 'base', summary: 'Move task with sort rank' },
      { method: 'DELETE', path: '/api/tasks/{uuid}', service: 'base', summary: 'Delete task' },
      { method: 'POST', path: '/api/tasks/{uuid}/timer/start', service: 'base', summary: 'Start task timer' },
      { method: 'POST', path: '/api/tasks/{uuid}/timer/stop', service: 'base', summary: 'Stop task timer' },
      { method: 'GET', path: '/api/timer/current', service: 'base', summary: 'Get active timer' },
    ],
  },
  {
    title: 'Notion',
    endpoints: [
      { method: 'GET', path: '/api/notion-databases', service: 'base', summary: 'List linked Notion databases' },
      { method: 'GET', path: '/api/notion-databases/{uuid}', service: 'base', summary: 'Get linked Notion database' },
      { method: 'POST', path: '/api/notion-databases', service: 'base', summary: 'Create linked Notion database' },
      { method: 'PATCH', path: '/api/notion-databases/{uuid}', service: 'base', summary: 'Update linked Notion database' },
      { method: 'DELETE', path: '/api/notion-databases/{uuid}', service: 'base', summary: 'Delete linked Notion database' },
      { method: 'GET', path: '/api/collections/{uuid}/notion-databases', service: 'base', summary: 'List collection Notion databases' },
      { method: 'GET', path: '/api/notion-databases/{uuid}/status-mapping', service: 'base', summary: 'Get Notion status mapping' },
      { method: 'PUT', path: '/api/notion-databases/{uuid}/status-mapping', service: 'base', summary: 'Update Notion status mapping' },
      { method: 'POST', path: '/api/notion-databases/{uuid}/status-mapping/fetch', service: 'base', summary: 'Fetch Notion status options' },
      { method: 'GET', path: '/api/link/notion/url', service: 'link', summary: 'Start Notion OAuth' },
      { method: 'GET', path: '/api/link/notion/callback', service: 'link', summary: 'Finish Notion OAuth' },
      { method: 'GET', path: '/api/link/notion/databases', service: 'link', summary: 'Search accessible Notion databases' },
    ],
  },
  {
    title: 'ClickUp',
    endpoints: [
      { method: 'GET', path: '/api/clickup-lists', service: 'base', summary: 'List linked ClickUp lists' },
      { method: 'GET', path: '/api/clickup-lists/{uuid}', service: 'base', summary: 'Get linked ClickUp list' },
      { method: 'POST', path: '/api/clickup-lists', service: 'base', summary: 'Create linked ClickUp list' },
      { method: 'PATCH', path: '/api/clickup-lists/{uuid}', service: 'base', summary: 'Update linked ClickUp list' },
      { method: 'DELETE', path: '/api/clickup-lists/{uuid}', service: 'base', summary: 'Delete linked ClickUp list' },
      { method: 'GET', path: '/api/collections/{uuid}/clickup-lists', service: 'base', summary: 'List collection ClickUp lists' },
      { method: 'GET', path: '/api/clickup-lists/{uuid}/status-mapping', service: 'base', summary: 'Get ClickUp status mapping' },
      { method: 'PUT', path: '/api/clickup-lists/{uuid}/status-mapping', service: 'base', summary: 'Update ClickUp status mapping' },
      { method: 'POST', path: '/api/clickup-lists/{uuid}/status-mapping/fetch', service: 'base', summary: 'Fetch ClickUp status options' },
      { method: 'GET', path: '/api/link/clickup/url', service: 'link', summary: 'Start ClickUp OAuth' },
      { method: 'GET', path: '/api/link/clickup/callback', service: 'link', summary: 'Finish ClickUp OAuth' },
      { method: 'GET', path: '/api/link/clickup/resources', service: 'link', summary: 'Browse ClickUp resources' },
    ],
  },
  {
    title: 'Reports, Sync & Files',
    endpoints: [
      { method: 'GET', path: '/api/reports/summary', service: 'base', summary: 'Report summary' },
      { method: 'GET', path: '/api/reports/breakdown', service: 'base', summary: 'Report collection breakdown' },
      { method: 'GET', path: '/api/reports/timeline', service: 'base', summary: 'Report timeline' },
      { method: 'GET', path: '/api/reports/sessions', service: 'base', summary: 'Report focus sessions' },
      { method: 'POST', path: '/api/sync', service: 'base', summary: 'Run full sync' },
      { method: 'POST', path: '/api/files/upload', service: 'file', summary: 'Upload image file' },
      { method: 'GET', path: '/health', service: 'gateway', summary: 'Gateway health check' },
      { method: 'GET', path: '/metrics', service: 'base', summary: 'Prometheus metrics' },
    ],
  },
]

export function flattenBackendApiCatalog(): ApiEndpoint[] {
  return backendApiCatalog.flatMap((group) => group.endpoints)
}
