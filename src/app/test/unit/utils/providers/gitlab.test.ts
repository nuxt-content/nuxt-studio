import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftStatus } from '../../../../src/types/draft'
import { createGitLabProvider } from '../../../../src/utils/providers/gitlab'

function createCommitsApiHandler() {
  return (
    request: string,
    options?: { method?: string, body?: Record<string, unknown> },
  ) => {
    if (request === '/repository/commits' && options?.method === 'POST') {
      return Promise.resolve({ id: 'a1b2c3d4e5f6' })
    }
    return Promise.reject(new Error(`Unexpected request: ${request} ${options?.method ?? ''}`))
  }
}

const mock$api = vi.fn(createCommitsApiHandler())

vi.mock('ofetch', () => ({
  ofetch: {
    create: vi.fn(() => mock$api),
  },
}))

const baseGitOptions = {
  provider: 'gitlab' as const,
  owner: 'team-communication',
  repo: 'numberly-2026',
  branch: 'dev',
  rootDir: '',
  authorName: 'Test Author',
  authorEmail: 'author@example.com',
  token: 'glpat-test-token-xxxxxxxx',
  instanceUrl: 'https://gitlab.example.com',
} as const

/** Minimal valid base64 for `<svg></svg>` */
const rawSvgBase64 = 'PHN2Zz48L3N2Zz4='
const dataUrlSvg = `data:image/svg+xml;base64,${rawSvgBase64}`

describe('createGitLabProvider / commitFiles', () => {
  beforeEach(() => {
    mock$api.mockImplementation(createCommitsApiHandler())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('POST /repository/commits sends raw base64 when content is a data URL (create)', async () => {
    const provider = createGitLabProvider({ ...baseGitOptions })

    const result = await provider.commitFiles(
      [
        {
          path: 'public/google-test.svg',
          status: DraftStatus.Created,
          content: dataUrlSvg,
          encoding: 'base64',
        },
      ],
      'chore(studio): add google svg',
    )

    expect(result).toEqual({
      success: true,
      commitSha: 'a1b2c3d4e5f6',
      url: 'https://gitlab.example.com/team-communication/numberly-2026/-/commit/a1b2c3d4e5f6',
    })

    expect(mock$api).toHaveBeenCalledTimes(1)
    const [, requestInit] = mock$api.mock.calls[0] as [string, { method: string, body: Record<string, unknown> }]

    expect(requestInit.method).toBe('POST')
    expect(requestInit.body).toMatchObject({
      branch: 'dev',
      commit_message: 'chore(studio): add google svg',
      author_name: 'Test Author',
      author_email: 'author@example.com',
    })

    const actions = requestInit.body.actions as Array<{
      action: string
      file_path: string
      content: string
      encoding: string
    }>
    expect(actions).toHaveLength(1)
    expect(actions[0]).toEqual({
      action: 'create',
      file_path: 'public/google-test.svg',
      content: rawSvgBase64,
      encoding: 'base64',
    })
  })

  it('POST /repository/commits leaves already-raw base64 unchanged', async () => {
    const provider = createGitLabProvider({ ...baseGitOptions })

    await provider.commitFiles(
      [
        {
          path: 'public/icon.png',
          status: DraftStatus.Created,
          content: rawSvgBase64,
          encoding: 'base64',
        },
      ],
      'add icon',
    )

    const [, requestInit] = mock$api.mock.calls[0] as [string, { body: { actions: Array<{ content: string }> } }]
    expect(requestInit.body.actions[0].content).toBe(rawSvgBase64)
  })

  it('POST /repository/commits uses text encoding for non-base64 content', async () => {
    const provider = createGitLabProvider({ ...baseGitOptions })
    const markdown = '# Hello\n'

    await provider.commitFiles(
      [
        {
          path: 'content/index.md',
          status: DraftStatus.Created,
          content: markdown,
          encoding: 'utf-8',
        },
      ],
      'docs: welcome',
    )

    const [, requestInit] = mock$api.mock.calls[0] as [string, { body: { actions: Array<Record<string, string>> } }]
    expect(requestInit.body.actions[0]).toEqual({
      action: 'create',
      file_path: 'content/index.md',
      content: markdown,
      encoding: 'text',
    })
  })

  it('POST /repository/commits strips data URL on update and supports delete in the same request', async () => {
    const provider = createGitLabProvider({ ...baseGitOptions })

    await provider.commitFiles(
      [
        {
          path: 'public/old.png',
          status: DraftStatus.Deleted,
          content: null,
        },
        {
          path: 'public/new.svg',
          status: DraftStatus.Updated,
          content: dataUrlSvg,
          encoding: 'base64',
        },
      ],
      'replace asset',
    )

    const [, requestInit] = mock$api.mock.calls[0] as [string, { body: { actions: Array<Record<string, unknown>> } }]
    const actions = requestInit.body.actions

    expect(actions).toEqual([
      { action: 'delete', file_path: 'public/old.png' },
      {
        action: 'update',
        file_path: 'public/new.svg',
        content: rawSvgBase64,
        encoding: 'base64',
      },
    ])
  })

  it('does not call the API when token is missing', async () => {
    const provider = createGitLabProvider({
      ...baseGitOptions,
      token: '',
    })

    const result = await provider.commitFiles(
      [{ path: 'x.md', status: DraftStatus.Created, content: 'x', encoding: 'utf-8' }],
      'msg',
    )

    expect(result).toBeNull()
    expect(mock$api).not.toHaveBeenCalled()
  })
})
