import { type vi, describe, it, expect, beforeEach } from 'vitest'
import { StudioBranchActionId, type StudioHost } from '../../src/types'
import { generateUniqueDocumentFsPath } from '../utils'
import { mockHost, mockGit, routeState, cleanAndSetupContext } from '../utils/context'

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
