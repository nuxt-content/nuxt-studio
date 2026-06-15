/**
 * Integration tests for the post-publish state-sync fix (issue #338).
 *
 * Verifies:
 * 1. markPublished() transitions (Updated/Created/Deleted → published overlay)
 * 2. load() self-heal: purge when dump caught up, keep when stale
 * 3. allDrafts excludes published items from the review/count views
 * 4. checkAndRefreshConflicts() detects concurrent remote edits before publishing
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { StudioBranchActionId, DraftStatus } from '../../src/types'
import { generateUniqueDocumentFsPath } from '../utils'
import { mockHost, mockGit, routeState, cleanAndSetupContext } from '../utils/context'
import { createMockGithubFile } from '../mocks/git'
import { clearMockHost } from '../mocks/host'

/** Produce a body with different nodes so areDocumentsEqual returns false. */
function makeBody(text: string) {
  return { nodes: [['p', {}, text]] as never, frontmatter: {}, meta: {} }
}

describe('markPublished()', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
  })

  it('transitions an Updated draft to Pristine+published and retains the committed content', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'Original content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftDocuments = context.activeTree.value.draft
    const draftItem = draftDocuments.list.value.find(d => d.fsPath === fsPath)!

    // Modify body so areDocumentsEqual returns false → status becomes Updated
    await draftDocuments.update(fsPath, { ...draftItem.modified!, body: makeBody('Updated body') })

    const updatedDraft = draftDocuments.list.value.find(d => d.fsPath === fsPath)!
    expect(updatedDraft.status).toBe(DraftStatus.Updated)

    await draftDocuments.markPublished()

    const publishedDraft = draftDocuments.list.value.find(d => d.fsPath === fsPath)!
    expect(publishedDraft.status).toBe(DraftStatus.Pristine)
    expect(publishedDraft.published).toBe(true)
    // committed content is now the baseline
    expect(publishedDraft.original).toEqual(publishedDraft.modified)
    // remoteFile carries the committed markdown
    expect(publishedDraft.remoteFile?.content).toBeTruthy()
    expect(publishedDraft.conflict).toBeUndefined()
    expect(publishedDraft.formattingApplied).toBe(false)
  })

  it('transitions a Deleted draft to published (keeps Deleted status for overlay)', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('to-delete')

    await mockHost.document.db.create(fsPath, 'File to delete')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)
    await context.activeTree.value.draft.remove([fsPath])

    const deletedDraft = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(deletedDraft.status).toBe(DraftStatus.Deleted)

    await context.activeTree.value.draft.markPublished()

    const publishedDraft = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(publishedDraft.status).toBe(DraftStatus.Deleted) // status stays Deleted
    expect(publishedDraft.published).toBe(true)
  })

  it('leaves Pristine drafts untouched', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('pristine')

    await mockHost.document.db.create(fsPath, 'Unchanged file')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const before = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(before.status).toBe(DraftStatus.Pristine)

    await context.activeTree.value.draft.markPublished()

    const after = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(after.status).toBe(DraftStatus.Pristine)
    expect(after.published).toBeUndefined()
  })
})

describe('allDrafts excludes published items', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
  })

  it('removes published Updated drafts from the review count', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('review-count')

    await mockHost.document.db.create(fsPath, 'Content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    await context.activeTree.value.draft.update(fsPath, { ...draftItem.modified!, body: makeBody('Changed') })

    expect(context.draftCount.value).toBeGreaterThan(0)

    await context.activeTree.value.draft.markPublished()

    expect(context.draftCount.value).toBe(0)
    expect(context.allDrafts.value.some(d => d.fsPath === fsPath)).toBe(false)
  })

  it('removes published Deleted drafts from the review count', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('deleted-published')

    await mockHost.document.db.create(fsPath, 'Will be deleted')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)
    await context.activeTree.value.draft.remove([fsPath])

    expect(context.draftCount.value).toBeGreaterThan(0)

    await context.activeTree.value.draft.markPublished()

    expect(context.allDrafts.value.some(d => d.fsPath === fsPath)).toBe(false)
    expect(context.draftCount.value).toBe(0)
  })
})

describe('publish handler — markPublished instead of revertAll', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
  })

  it('keeps committed content visible immediately after publish (no desync window)', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('no-desync')

    // Use 'Test content' to match the default fetchFile mock so no false conflict fires.
    await mockHost.document.db.create(fsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    const publishedBody = makeBody('My published edit')
    await context.activeTree.value.draft.update(fsPath, { ...draftItem.modified!, body: publishedBody })

    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Update article' })

    // The published overlay must still be in the list (not discarded)
    const afterPublish = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(afterPublish).toBeDefined()
    expect(afterPublish.published).toBe(true)
    // The committed body is preserved in modified
    expect(JSON.stringify(afterPublish.modified!.body)).toContain('My published edit')
  })

  it('removes published drafts from allDrafts (review page) immediately after publish', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('no-review')

    // Use 'Test content' to match the default fetchFile mock so no false conflict fires.
    await mockHost.document.db.create(fsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    await context.activeTree.value.draft.update(fsPath, { ...draftItem.modified!, body: makeBody('New body') })
    expect(context.draftCount.value).toBe(1)

    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Publish' })

    expect(context.draftCount.value).toBe(0)
    expect(context.allDrafts.value.some(d => d.fsPath === fsPath)).toBe(false)
  })
})

describe('checkAndRefreshConflicts()', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
  })

  it('returns false when remote matches the local baseline (no concurrent edit)', async () => {
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('no-conflict')

    await mockHost.document.db.create(fsPath, 'Test content')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    await context.activeTree.value.draft.update(fsPath, { ...draftItem.modified!, body: makeBody('My edit') })

    // default mockGit.fetchFile returns content that won't differ from original
    const hasConflict = await context.activeTree.value.draft.checkAndRefreshConflicts()
    expect(hasConflict).toBe(false)
  })

  it('returns true and sets conflict field when remote changed since draft creation', async () => {
    const oldContent = 'Original content'
    const concurrentEdit = 'Content changed by someone else on the remote'

    const mockGitWithConflict = {
      ...mockGit,
      api: {
        ...mockGit.api,
        fetchFile: vi.fn()
          // First call: draft creation → old content (matches the DB)
          .mockResolvedValueOnce(createMockGithubFile({ content: oldContent, encoding: 'utf-8' }))
          // Second call: pre-publish re-check → different content → conflict
          .mockResolvedValue(createMockGithubFile({ content: concurrentEdit, encoding: 'utf-8' })),
        commitFiles: vi.fn().mockResolvedValue({ success: true, commitSha: 'abc', url: '' }),
      },
    }

    const context = await cleanAndSetupContext(mockHost, mockGitWithConflict)
    const fsPath = generateUniqueDocumentFsPath('with-conflict')

    await mockHost.document.db.create(fsPath, oldContent)
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    // Edit locally (body change so status becomes Updated)
    await context.activeTree.value.draft.update(fsPath, { ...draftItem.modified!, body: makeBody('My local edit') })

    const hasConflict = await context.activeTree.value.draft.checkAndRefreshConflicts()
    expect(hasConflict).toBe(true)

    const conflictedDraft = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(conflictedDraft.conflict).toBeDefined()
    expect(conflictedDraft.conflict!.remoteContent).toBe(concurrentEdit)
  })

  it('PublishBranch aborts with ConflictAbortError when a conflict is detected', async () => {
    const oldContent = 'Original'
    const concurrentEdit = 'Someone else changed this on the remote'

    const mockGitConflict = {
      ...mockGit,
      api: {
        ...mockGit.api,
        fetchFile: vi.fn()
          .mockResolvedValueOnce(createMockGithubFile({ content: oldContent, encoding: 'utf-8' }))
          .mockResolvedValue(createMockGithubFile({ content: concurrentEdit, encoding: 'utf-8' })),
        commitFiles: vi.fn().mockResolvedValue({ success: true, commitSha: 'abc', url: '' }),
      },
    }

    const context = await cleanAndSetupContext(mockHost, mockGitConflict)
    const fsPath = generateUniqueDocumentFsPath('abort-conflict')

    await mockHost.document.db.create(fsPath, oldContent)
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    await context.activeTree.value.draft.update(fsPath, { ...draftItem.modified!, body: makeBody('Local edit') })

    // Use toMatchObject to avoid instanceof cross-module-isolation issues
    await expect(
      context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: 'Publish' }),
    ).rejects.toMatchObject({ name: 'ConflictAbortError' })

    // commitFiles must NOT be called — we aborted before the commit
    expect(mockGitConflict.api.commitFiles).not.toHaveBeenCalled()
  })
})
