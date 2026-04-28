import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { DraftStatus, StudioBranchActionId, type DatabaseItem } from '../../src/types'
import { cleanAndSetupContext, mockHost, routeState } from '../utils/context'
import { createMockGit, createMockGithubFile } from '../mocks/git'
import { generateUniqueDocumentFsPath } from '../utils'

describe('Markdown formatting review metadata', () => {
  let documentFsPath: string

  beforeEach(() => {
    routeState.name = 'content'
    documentFsPath = generateUniqueDocumentFsPath('formatting-review')
  })

  it('stores formatting metadata on select, keeps it after edits, and publishes canonical content', async () => {
    const git = createMockGit(createMockGithubFile({
      path: `content/${documentFsPath}`,
      content: '* one\n* two\n',
    }))

    const context = await cleanAndSetupContext(mockHost, git)

    await mockHost.document.db.create(documentFsPath, '- one\n- two')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const selectedDraft = context.activeTree.value.draft.list.value[0]
    expect(selectedDraft.status).toBe(DraftStatus.Pristine)
    expect(selectedDraft.formatting).toEqual({
      originalContent: '* one\n* two\n',
      formattedContent: '- one\n- two',
    })
    expect(context.draftCount.value).toBe(0)

    const updatedDocument = {
      ...selectedDraft.modified!,
      body: {
        type: 'minimark',
        value: ['- one', '- two', '- three'],
      },
    } as DatabaseItem

    await context.activeTree.value.draft.update(documentFsPath, updatedDocument)

    const updatedDraft = context.activeTree.value.draft.list.value[0]
    expect(updatedDraft.status).toBe(DraftStatus.Updated)
    expect(updatedDraft.formatting).toEqual({
      originalContent: '* one\n* two\n',
      formattedContent: '- one\n- two',
    })
    expect(context.draftCount.value).toBe(1)

    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({
      commitMessage: 'Show formatting rewrite in review',
    })

    expect(git.api.commitFiles).toHaveBeenCalledTimes(1)
    const [files, commitMessage] = (git.api.commitFiles as Mock).mock.calls[0]
    expect(commitMessage).toBe('Show formatting rewrite in review')
    expect(files).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: `content/${documentFsPath}`,
        status: DraftStatus.Updated,
        content: '- one\n- two\n- three',
      }),
    ]))
  })

  it('skips pristine no-op updates even when the remote markdown source is non-canonical', async () => {
    const git = createMockGit(createMockGithubFile({
      path: `content/${documentFsPath}`,
      content: '* one\n* two\n',
    }))

    const context = await cleanAndSetupContext(mockHost, git)

    await mockHost.document.db.create(documentFsPath, '- one\n- two')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    const selectedDraft = context.activeTree.value.draft.list.value[0]
    const equivalentDocument = {
      ...selectedDraft.modified!,
      body: {
        ...(selectedDraft.modified!.body as DatabaseItem['body']),
      },
    } as DatabaseItem

    vi.clearAllMocks()

    await context.activeTree.value.draft.update(documentFsPath, equivalentDocument)

    expect(context.activeTree.value.draft.list.value[0].status).toBe(DraftStatus.Pristine)
    expect(context.activeTree.value.draft.list.value[0].formatting).toEqual({
      originalContent: '* one\n* two\n',
      formattedContent: '- one\n- two',
    })
    expect(context.draftCount.value).toBe(0)
    expect(mockHost.document.db.upsert).not.toHaveBeenCalled()
    expect(mockHost.app.requestRerender).not.toHaveBeenCalled()
  })
})
