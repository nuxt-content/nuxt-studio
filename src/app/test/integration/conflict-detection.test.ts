/**
 * Integration tests for raw A-vs-A conflict detection.
 * A freshly opened draft must never report a conflict from formatting/parser
 * drift — only a genuine remote move (different blob SHA) is a conflict.
 */
import { describe, it, expect, beforeEach } from 'vitest'
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
})
