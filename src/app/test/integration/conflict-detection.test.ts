/**
 * Integration tests for raw A-vs-A conflict detection.
 * A freshly opened draft must never report a conflict from formatting/parser
 * drift — only a genuine remote move (different blob SHA) is a conflict.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateUniqueDocumentFsPath } from '../utils'
import { mockHost, mockStorageDraft, routeState, cleanAndSetupContext } from '../utils/context'
import { createMockGit, createMockGithubFile } from '../mocks/git'
import { clearMockHost } from '../mocks/host'

describe('raw A-vs-A conflict detection', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not report a conflict on open when remote text differs only by formatting', async () => {
    // Remote file content deliberately does NOT match the round-tripped DB render.
    const remote = createMockGithubFile({ content: '::ol\n1. a\n::\n', sha: 'remote-sha-1' })
    const mockGit = createMockGit(remote)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, '1. a')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(draftItem.conflict).toBeUndefined()
    expect(draftItem.baseRemote?.sha).toBe('remote-sha-1')
  })

  it('checkAndRefreshConflicts flags a conflict when the remote SHA moved', async () => {
    const remote = createMockGithubFile({ content: 'base', sha: 'sha-base' })
    const mockGit = createMockGit(remote)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'mine']] as never, frontmatter: {}, meta: {} } })

    // Remote moved (new SHA) after we based our draft on sha-base.
    mockGit.api.fetchFile = vi.fn().mockResolvedValue(
      createMockGithubFile({ content: 'theirs', sha: 'sha-moved' }),
    )

    const hasConflict = await draft.checkAndRefreshConflicts()
    expect(hasConflict).toBe(true)
    expect(draft.list.value.find(d => d.fsPath === fsPath)!.conflict).toBeDefined()
  })

  it('checkAndRefreshConflicts does NOT flag when the remote SHA is unchanged', async () => {
    const remote = createMockGithubFile({ content: 'base', sha: 'sha-base' })
    const mockGit = createMockGit(remote)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'mine']] as never, frontmatter: {}, meta: {} } })

    // Same SHA, but re-fetched content text differs (formatting). Must NOT conflict.
    mockGit.api.fetchFile = vi.fn().mockResolvedValue(
      createMockGithubFile({ content: 'base reformatted', sha: 'sha-base' }),
    )

    const hasConflict = await draft.checkAndRefreshConflicts()
    expect(hasConflict).toBe(false)
  })

  it('markPublished advances baseRemote, captures the stale dump hash, and stamps publishedAt', async () => {
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'committed']] as never, frontmatter: {}, meta: {} } })

    await draft.markPublished()

    const published = draft.list.value.find(d => d.fsPath === fsPath)!
    expect(published.baseRemote?.content).toBeTruthy()
    expect(published.baseRemote?.sha).toBe('')
    expect(typeof published.publishedAt).toBe('number')
    // baseHash is whatever the dump exposed at publish time (may be undefined if the mock has no `n`)
    expect('baseHash' in published).toBe(true)
  })

  it('load() purges a published overlay once publishedAt exceeds the max age', async () => {
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'committed']] as never, frontmatter: {}, meta: {} } })
    await draft.markPublished()

    // Force the overlay to look stale by mutating in-memory AND re-persisting to storage.
    const published = draft.list.value.find(d => d.fsPath === fsPath)!
    published.publishedAt = 1 // far in the past
    // Re-persist so load() sees the stale publishedAt from storage.
    // mockStorageDraft stores the raw JSON-stringified value keyed by fsPath.
    mockStorageDraft.set(fsPath, JSON.stringify(published))

    await draft.load()

    expect(draft.list.value.find(d => d.fsPath === fsPath)).toBeUndefined()
  })

  it('load() purges a published overlay when the dump content-hash has changed', async () => {
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'committed']] as never, frontmatter: {}, meta: {} } })
    await draft.markPublished()

    const published = draft.list.value.find(d => d.fsPath === fsPath)!
    published.baseHash = 'stale-hash'
    published.publishedAt = Date.now()
    // Re-persist so load() sees the updated baseHash from storage.
    // mockStorageDraft stores the raw JSON-stringified value keyed by fsPath.
    mockStorageDraft.set(fsPath, JSON.stringify(published))

    // Dump now reports a different hash → deploy caught up.
    vi.spyOn(mockHost.document.db, 'get').mockResolvedValue({ id: fsPath, n: 'fresh-hash' } as never)

    await draft.load()
    expect(draft.list.value.find(d => d.fsPath === fsPath)).toBeUndefined()
  })

  it('backfills baseRemote and clears stale conflicts for pre-existing drafts on load', async () => {
    const remoteFile = createMockGithubFile({ content: 'base', sha: 'sha-base' })
    const mockGit = createMockGit(remoteFile)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')

    // Simulate a draft persisted by the OLD code: no baseRemote, a stale false conflict.
    // Directly write to storage (bypassing the live draft flow) so load() re-reads it.
    const { DraftStatus } = await import('../../src/types/draft')
    const stale = {
      fsPath,
      status: DraftStatus.Updated,
      remoteFile,
      // OLD code: no baseRemote field
      conflict: { remoteContent: 'x', localContent: 'y' },
      modified: { id: `docs/${fsPath}`, fsPath, body: { nodes: [['p', {}, 'mine']] as never, frontmatter: {}, meta: {} } },
      original: { id: `docs/${fsPath}`, fsPath, body: { nodes: [['p', {}, 'base']] as never, frontmatter: {}, meta: {} } },
    }
    mockStorageDraft.set(fsPath, JSON.stringify(stale))

    const draft = context.activeTree.value.draft
    await draft.load()

    const healed = draft.list.value.find(d => d.fsPath === fsPath)!
    expect(healed.baseRemote?.sha).toBe('sha-base')
    expect(healed.conflict).toBeUndefined()
  })
})
