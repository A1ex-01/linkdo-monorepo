import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminService } from './admin'
import { request } from './client-request'

vi.mock('./client-request', () => ({
  request: vi.fn(async () => ({ success: true, data: [] })),
}))

const mockedRequest = vi.mocked(request)

describe('adminService backend API coverage', () => {
  beforeEach(() => {
    mockedRequest.mockClear()
  })

  it('uses real /api business endpoints instead of unavailable /admin endpoints', () => {
    adminService.listCollections()
    adminService.listNotionDatabases()
    adminService.listClickUpLists()
    adminService.getReportSummary()
    adminService.getCurrentTimer()
    adminService.sync()

    expect(mockedRequest).toHaveBeenNthCalledWith(1, {
      url: '/collections',
      method: 'get',
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(2, {
      url: '/notion-databases',
      method: 'get',
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(3, {
      url: '/clickup-lists',
      method: 'get',
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(4, {
      url: '/reports/summary',
      method: 'get',
      params: undefined,
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(5, {
      url: '/timer/current',
      method: 'get',
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(6, {
      url: '/sync',
      method: 'post',
    })
  })

  it('exposes ClickUp and Notion link resource endpoints for admin visibility', () => {
    adminService.getLinkOAuthURL('notion')
    adminService.getLinkOAuthURL('clickup')
    adminService.listLinkNotionDatabases({ query: 'roadmap' })
    adminService.listClickUpResources({ path: 'team/123/space' })

    expect(mockedRequest).toHaveBeenNthCalledWith(1, {
      url: '/link/notion/url',
      method: 'get',
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(2, {
      url: '/link/clickup/url',
      method: 'get',
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(3, {
      url: '/link/notion/databases',
      method: 'get',
      params: { query: 'roadmap' },
    })
    expect(mockedRequest).toHaveBeenNthCalledWith(4, {
      url: '/link/clickup/resources',
      method: 'get',
      params: { path: 'team/123/space' },
    })
  })
})
