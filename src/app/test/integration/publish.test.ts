import { type vi, describe, it, expect, beforeEach } from 'vitest'
import { StudioBranchActionId, type StudioHost } from '../../src/types'
import { generateUniqueDocumentFsPath } from '../utils'
import { mockHost, mockGit, routeState, cleanAndSetupContext } from '../utils/context'
import { createMockGit } from '../mocks/git'

describe('PublishBranch - Commit Message Prefix', () => {
  let context: Awaited<ReturnType<typeof cleanAndSetupContext>>
  let documentFsPath: string

  beforeEach(async () => {
    routeState.name = 'content'
    documentFsPath = generateUniqueDocumentFsPath('document')
    context = await cleanAndSetupContext(mockHost, mockGit)
  })

  it('passes user message as-is when no prefix is configured', async () => {
    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const userMessage = 'Add 2 links on landing page'
    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: userMessage })

    expect(mockGit.api.commitFiles).toHaveBeenCalledTimes(1)
    const [, commitMessage] = (mockGit.api.commitFiles as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(commitMessage).toBe('Add 2 links on landing page')
  })

  it('prepends configured prefix to user message', async () => {
    const hostWithPrefix: StudioHost = {
      ...mockHost,
      meta: {
        ...mockHost.meta,
        git: { commit: { messagePrefix: 'content:' } },
      },
    }
    context = await cleanAndSetupContext(hostWithPrefix, mockGit)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const userMessage = 'Add 2 links on landing page'
    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: userMessage })

    expect(mockGit.api.commitFiles).toHaveBeenCalledTimes(1)
    const [, commitMessage] = (mockGit.api.commitFiles as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(commitMessage).toBe('content: Add 2 links on landing page')
  })

  it('trims user message before applying prefix', async () => {
    const hostWithPrefix: StudioHost = {
      ...mockHost,
      meta: {
        ...mockHost.meta,
        git: { commit: { messagePrefix: 'docs:' } },
      },
    }
    context = await cleanAndSetupContext(hostWithPrefix, mockGit)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: '  Update readme  ' })

    expect(mockGit.api.commitFiles).toHaveBeenCalledTimes(1)
    const [, commitMessage] = (mockGit.api.commitFiles as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(commitMessage).toBe('docs: Update readme')
  })
})

describe('PublishBranch - Review requests', () => {
  let context: Awaited<ReturnType<typeof cleanAndSetupContext>>
  let documentFsPath: string

  beforeEach(async () => {
    routeState.name = 'content'
    documentFsPath = generateUniqueDocumentFsPath('document')
    context = await cleanAndSetupContext(mockHost, mockGit)
  })

  it('does not create a review request when pullRequest.base is not configured', async () => {
    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const result = await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(mockGit.api.ensureReviewRequest).not.toHaveBeenCalled()
    expect(result.reviewRequest).toBeNull()
    expect(result.reviewRequestError).toBeUndefined()
  })

  it('creates a review request after a successful commit when pullRequest.base is configured', async () => {
    const hostWithPullRequest: StudioHost = {
      ...mockHost,
      repository: {
        ...mockHost.repository,
        branch: 'staging',
        pullRequest: { base: 'main' },
      },
    }
    const git = createMockGit()
    ;(git.api.ensureReviewRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      kind: 'pull-request',
      state: 'created',
      url: 'https://github.com/owner/repo/pull/1',
      head: 'staging',
      base: 'main',
      number: 1,
    })
    context = await cleanAndSetupContext(hostWithPullRequest, git)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const result = await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(git.api.ensureReviewRequest).toHaveBeenCalledWith({
      title: 'Update content',
      head: 'staging',
      base: 'main',
      commitUrl: 'https://example.com/commit/abc123',
    })
    expect(result.reviewRequest).toMatchObject({
      kind: 'pull-request',
      state: 'created',
      url: 'https://github.com/owner/repo/pull/1',
    })
  })

  it('returns a partial success when review request creation fails after commit', async () => {
    const hostWithPullRequest: StudioHost = {
      ...mockHost,
      repository: {
        ...mockHost.repository,
        branch: 'staging',
        pullRequest: { base: 'main' },
      },
    }
    const git = createMockGit()
    ;(git.api.ensureReviewRequest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API rate limit exceeded'))
    context = await cleanAndSetupContext(hostWithPullRequest, git)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const result = await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(git.api.commitFiles).toHaveBeenCalledTimes(1)
    expect(result.commit.success).toBe(true)
    expect(result.reviewRequest).toBeNull()
    expect(result.reviewRequestError).toBe('API rate limit exceeded')
    expect(context.draftCount.value).toBe(0)
  })

  it('returns a partial success when ensureReviewRequest resolves null', async () => {
    const hostWithPullRequest: StudioHost = {
      ...mockHost,
      repository: {
        ...mockHost.repository,
        branch: 'staging',
        pullRequest: { base: 'main' },
      },
    }
    const git = createMockGit()
    ;(git.api.ensureReviewRequest as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    context = await cleanAndSetupContext(hostWithPullRequest, git)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const result = await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(result.commit.success).toBe(true)
    expect(result.reviewRequest).toBeNull()
    expect(result.reviewRequestError).toBe('Failed to create review request')
  })

  it('skips review request creation when pullRequest.base matches repository.branch', async () => {
    const hostWithSameBranch: StudioHost = {
      ...mockHost,
      repository: {
        ...mockHost.repository,
        branch: 'main',
        pullRequest: { base: 'main' },
      },
    }
    const git = createMockGit()
    context = await cleanAndSetupContext(hostWithSameBranch, git)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const result = await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(git.api.ensureReviewRequest).not.toHaveBeenCalled()
    expect(result.reviewRequest).toBeNull()
    expect(result.reviewRequestError).toBeUndefined()
  })

  it('uses a custom review request title when pullRequest.name is configured', async () => {
    const hostWithPullRequest: StudioHost = {
      ...mockHost,
      repository: {
        ...mockHost.repository,
        branch: 'staging',
        pullRequest: { base: 'main', name: 'Content updates from Studio' },
      },
    }
    const git = createMockGit()
    ;(git.api.ensureReviewRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      kind: 'pull-request',
      state: 'created',
      url: 'https://github.com/owner/repo/pull/1',
      head: 'staging',
      base: 'main',
      number: 1,
    })
    context = await cleanAndSetupContext(hostWithPullRequest, git)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(git.api.ensureReviewRequest).toHaveBeenCalledWith({
      title: 'Content updates from Studio',
      head: 'staging',
      base: 'main',
      commitUrl: 'https://example.com/commit/abc123',
    })
  })

  it('reuses an existing review request when the provider returns one', async () => {
    const hostWithPullRequest: StudioHost = {
      ...mockHost,
      repository: {
        ...mockHost.repository,
        branch: 'staging',
        pullRequest: { base: 'main' },
      },
    }
    const git = createMockGit()
    ;(git.api.ensureReviewRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      kind: 'pull-request',
      state: 'existing',
      url: 'https://github.com/owner/repo/pull/42',
      head: 'staging',
      base: 'main',
      number: 42,
    })
    context = await cleanAndSetupContext(hostWithPullRequest, git)

    await mockHost.document.db.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const result = await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update content' })

    expect(result.reviewRequest).toMatchObject({
      kind: 'pull-request',
      state: 'existing',
      url: 'https://github.com/owner/repo/pull/42',
    })
    expect(result.reviewRequestError).toBeUndefined()
  })
})
