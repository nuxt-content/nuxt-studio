/**
 * Integration tests for raw A-vs-A conflict detection.
 * A freshly opened draft must never report a conflict from formatting/parser
 * drift — only a genuine remote move (different blob SHA) is a conflict.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { generateUniqueDocumentFsPath } from '../utils'
import { mockHost, routeState, cleanAndSetupContext } from '../utils/context'
import { createMockGit, createMockGithubFile } from '../mocks/git'
import { clearMockHost } from '../mocks/host'

describe('raw A-vs-A conflict detection', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
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
})
