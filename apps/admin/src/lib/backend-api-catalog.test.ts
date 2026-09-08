import { describe, expect, it } from 'vitest'
import { flattenBackendApiCatalog } from './backend-api-catalog'

describe('backendApiCatalog', () => {
  it('lists the existing ClickUp backend endpoints for admin visibility', () => {
    const paths = flattenBackendApiCatalog().map(
      (endpoint) => `${endpoint.method} ${endpoint.path}`
    )

    expect(paths).toContain('GET /api/clickup-lists')
    expect(paths).toContain('POST /api/clickup-lists')
    expect(paths).toContain('GET /api/link/clickup/resources')
    expect(paths).toContain('POST /api/collections/{uuid}/tasks')
  })

  it('lists the Prometheus metrics endpoint for operations visibility', () => {
    const paths = flattenBackendApiCatalog().map(
      (endpoint) => `${endpoint.method} ${endpoint.path}`
    )

    expect(paths).toContain('GET /metrics')
  })
})
