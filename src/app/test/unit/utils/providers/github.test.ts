import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftStatus } from '../../../../src/types/draft'
import { createGitHubProvider } from '../../../../src/utils/providers/github'

const existingPull = {
  number: 42,
  html_url: 'https://github.com/acme/docs/pull/42',
  head: { ref: 'staging' },
  base: { ref: 'main' },
}

const createdPull = {
  number: 43,
  html_url: 'https://github.com/acme/docs/pull/43',
  head: { ref: 'staging' },
  base: { ref: 'main' },
}

function createApiHandler(options?: { existingPull?: typeof existingPull | null }) {
  return (
    request: string,
    requestOptions?: { method?: string, query?: Record<string, string>, body?: string },
  ) => {
    if (request === '/pulls' && !requestOptions?.method) {
      return Promise.resolve(options?.existingPull ? [options.existingPull] : [])
    }

    if (request === '/pulls' && requestOptions?.method === 'POST') {
      return Promise.resolve(createdPull)
    }

    if (request === '/git/refs/heads/dev') {
      return Promise.resolve({ object: { sha: 'base-sha' } })
    }

    if (request === '/git/commits/base-sha') {
      return Promise.resolve({ tree: { sha: 'tree-sha' } })
    }

    if (request === '/git/blobs' && requestOptions?.method === 'POST') {
      return Promise.resolve({ sha: 'blob-sha' })
    }

    if (request === '/git/trees' && requestOptions?.method === 'POST') {
      return Promise.resolve({ sha: 'new-tree-sha' })
    }

    if (request === '/git/commits' && requestOptions?.method === 'POST') {
      return Promise.resolve({ sha: 'commit-sha' })
    }

    if (request === '/git/refs/heads/dev' && requestOptions?.method === 'PATCH') {
      return Promise.resolve({})
    }

    return Promise.reject(new Error(`Unexpected request: ${request} ${requestOptions?.method ?? ''}`))
  }
}

const mock$repositoryApi = vi.fn(createApiHandler())
const mock$userApi = vi.fn(() => Promise.resolve({ login: 'author', email: 'author@example.com', name: 'Author' }))

vi.mock('ofetch', () => ({
  ofetch: {
    create: vi.fn((config: { baseURL?: string }) => {
      if (config.baseURL?.endsWith('/repos/acme/docs')) {
        return mock$repositoryApi
      }

      return mock$userApi
    }),
  },
}))

const baseGitOptions = {
  provider: 'github' as const,
  owner: 'acme',
  repo: 'docs',
  branch: 'dev',
  rootDir: '',
  authorName: 'Test Author',
  authorEmail: 'author@example.com',
  token: 'ghp_test-token',
  instanceUrl: 'https://github.com',
} as const

describe('createGitHubProvider / ensureReviewRequest', () => {
  beforeEach(() => {
    mock$repositoryApi.mockImplementation(createApiHandler())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns an existing open pull request when one already exists', async () => {
    mock$repositoryApi.mockImplementation(createApiHandler({ existingPull }))

    const provider = createGitHubProvider({ ...baseGitOptions })
    const result = await provider.ensureReviewRequest({
      title: 'content: update homepage',
      head: 'staging',
      base: 'main',
      commitUrl: 'https://github.com/acme/docs/commit/abc123',
    })

    expect(result).toEqual({
      kind: 'pull-request',
      state: 'existing',
      url: existingPull.html_url,
      head: 'staging',
      base: 'main',
      number: 42,
    })

    expect(mock$repositoryApi).toHaveBeenCalledWith('/pulls', {
      query: {
        state: 'open',
        head: 'acme:staging',
        base: 'main',
      },
    })
  })

  it('creates a pull request when none exists', async () => {
    const provider = createGitHubProvider({ ...baseGitOptions })
    const result = await provider.ensureReviewRequest({
      title: 'content: update homepage',
      head: 'staging',
      base: 'main',
      commitUrl: 'https://github.com/acme/docs/commit/abc123',
    })

    expect(result).toEqual({
      kind: 'pull-request',
      state: 'created',
      url: createdPull.html_url,
      head: 'staging',
      base: 'main',
      number: 43,
    })

    const [, requestInit] = mock$repositoryApi.mock.calls.find(
      ([request, options]) => request === '/pulls' && options?.method === 'POST',
    ) as [string, { method: string, body: string }]

    expect(JSON.parse(requestInit.body)).toMatchObject({
      title: 'content: update homepage',
      head: 'staging',
      base: 'main',
    })
  })

  it('does not call the API when token is missing', async () => {
    const provider = createGitHubProvider({
      ...baseGitOptions,
      token: '',
    })

    const result = await provider.ensureReviewRequest({
      title: 'content: update homepage',
      head: 'staging',
      base: 'main',
    })

    expect(result).toBeNull()
    expect(mock$repositoryApi).not.toHaveBeenCalled()
  })

  it('returns an existing pull request when creation races with a duplicate 422', async () => {
    let pullListCalls = 0

    mock$repositoryApi.mockImplementation((
      request: string,
      requestOptions?: { method?: string, query?: Record<string, string> },
    ) => {
      if (request === '/pulls' && !requestOptions?.method) {
        pullListCalls += 1
        return Promise.resolve(pullListCalls === 1 ? [] : [existingPull])
      }

      if (request === '/pulls' && requestOptions?.method === 'POST') {
        const error = new Error('Validation Failed') as Error & { status: number }
        error.status = 422
        return Promise.reject(error)
      }

      return Promise.reject(new Error(`Unexpected request: ${request} ${requestOptions?.method ?? ''}`))
    })

    const provider = createGitHubProvider({ ...baseGitOptions })
    const result = await provider.ensureReviewRequest({
      title: 'content: update homepage',
      head: 'staging',
      base: 'main',
    })

    expect(result).toEqual({
      kind: 'pull-request',
      state: 'existing',
      url: existingPull.html_url,
      head: 'staging',
      base: 'main',
      number: 42,
    })

    expect(pullListCalls).toBe(2)
  })
})

describe('createGitHubProvider / commitFiles', () => {
  beforeEach(() => {
    mock$repositoryApi.mockImplementation(createApiHandler())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('commits files to the configured branch', async () => {
    const provider = createGitHubProvider({ ...baseGitOptions })

    const result = await provider.commitFiles(
      [{
        path: 'content/index.md',
        status: DraftStatus.Created,
        content: '# Hello',
        encoding: 'utf-8',
      }],
      'docs: welcome',
    )

    expect(result).toEqual({
      success: true,
      commitSha: 'commit-sha',
      url: 'https://github.com/acme/docs/commit/commit-sha',
    })
  })
})
