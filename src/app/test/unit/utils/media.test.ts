import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchMediaFileSize, getMediaFileName, getMediaMarkdownLink } from '../../../src/utils/media'
import { createMockMedia } from '../../mocks/media'
import type { GitFile } from '../../../src/types'

describe('getMediaFileName', () => {
  it('should use the Git provider file name when the file is in the repository', () => {
    const media = createMockMedia('public-assets/files/report.pdf')
    const remoteFile = { name: 'Report.pdf' } as GitFile
    expect(getMediaFileName(media, remoteFile)).toBe('Report.pdf')
  })

  it('should build the name from the stem and extension without a remote file', () => {
    const media = createMockMedia('public-assets/files/reports/annual-report.pdf')
    expect(getMediaFileName(media, null)).toBe('annual-report.pdf')
  })

  it('should keep dots inside the name', () => {
    const media = createMockMedia('public-assets/files/archive.tar.gz')
    expect(getMediaFileName(media)).toBe('archive.tar.gz')
  })

  it('should return the stem name when there is no extension', () => {
    const media = createMockMedia('public-assets/files/LICENSE', { stem: 'public-assets/files/LICENSE', extension: '' })
    expect(getMediaFileName(media)).toBe('LICENSE')
  })
})

describe('getMediaMarkdownLink', () => {
  it('should build a Markdown link from the name and path', () => {
    expect(getMediaMarkdownLink('report.pdf', '/files/report.pdf')).toBe('[report.pdf](/files/report.pdf)')
  })

  it('should escape brackets in the name', () => {
    expect(getMediaMarkdownLink('report [draft].pdf', '/files/report.pdf')).toBe('[report \\[draft\\].pdf](/files/report.pdf)')
  })

  it('should wrap a path with spaces in angle brackets', () => {
    expect(getMediaMarkdownLink('my report.pdf', '/files/my report.pdf')).toBe('[my report.pdf](</files/my report.pdf>)')
  })

  it('should wrap a path with parentheses in angle brackets', () => {
    expect(getMediaMarkdownLink('report (1).pdf', '/files/report(1).pdf')).toBe('[report (1).pdf](</files/report(1).pdf>)')
  })

  it('should keep full URLs as they are', () => {
    expect(getMediaMarkdownLink('report.pdf', 'https://cdn.example.com/report.pdf')).toBe('[report.pdf](https://cdn.example.com/report.pdf)')
  })
})

describe('fetchMediaFileSize', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stubFetch = (response: Partial<Response> | Error) => {
    const fetchMock = response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('should return the content length of a HEAD request', async () => {
    const fetchMock = stubFetch({ ok: true, headers: new Headers({ 'content-length': '47575' }) })

    expect(await fetchMediaFileSize('/files/report.pdf')).toBe(47575)
    expect(fetchMock).toHaveBeenCalledWith('/files/report.pdf', { method: 'HEAD' })
  })

  it('should return null when the file is not found', async () => {
    stubFetch({ ok: false, headers: new Headers({ 'content-length': '120' }) })
    expect(await fetchMediaFileSize('/files/missing.pdf')).toBeNull()
  })

  it('should return null without a content length', async () => {
    stubFetch({ ok: true, headers: new Headers() })
    expect(await fetchMediaFileSize('/files/report.pdf')).toBeNull()
  })

  it('should return null when the request fails', async () => {
    stubFetch(new TypeError('Failed to fetch'))
    expect(await fetchMediaFileSize('https://cdn.example.com/report.pdf')).toBeNull()
  })
})
