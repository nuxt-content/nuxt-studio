import { describe, it, expect } from 'vitest'
import { findDescendantsFromFsPath, checkConflict } from '../../../src/utils/draft'
import { draftItemsList } from '../../../test/mocks/draft'
import { DraftStatus } from '../../../src/types'

describe('findDescendantsFromFsPath', () => {
  it('returns exact match for a root level file', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, 'index.md')
    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('index.md')
  })

  it('returns empty array for non-existent fsPath', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, 'non-existent/file.md')
    expect(descendants).toHaveLength(0)
  })

  it('returns all descendants files for a directory path', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '1.getting-started')

    expect(descendants).toHaveLength(5)

    expect(descendants.some(item => item.fsPath === '1.getting-started/2.introduction.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/3.installation.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/4.configuration.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/1.studio.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/2.deployment.md')).toBe(true)
  })

  it('returns all descendants for a nested directory path', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '1.getting-started/1.advanced')

    expect(descendants).toHaveLength(2)

    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/1.studio.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/2.deployment.md')).toBe(true)
  })

  it('returns all descendants for root item', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '/')

    expect(descendants).toHaveLength(draftItemsList.length)
  })

  it('returns only the file itself when searching for a specific file', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '1.getting-started/1.advanced/1.studio.md')

    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('1.getting-started/1.advanced/1.studio.md')
  })
})

const host = {
  document: { generate: { contentFromDocument: async () => 'RENDERED' } },
} as unknown as Parameters<typeof checkConflict>[0]

function draft(overrides: Record<string, unknown> = {}) {
  return {
    fsPath: 'content/a.md',
    status: DraftStatus.Updated,
    modified: { id: 'a', body: {} },
    original: { id: 'a', body: {} },
    remoteFile: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    baseRemote: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    ...overrides,
  } as unknown as Parameters<typeof checkConflict>[1]
}

describe('checkConflict (raw A-vs-A)', () => {
  it('returns undefined when baseline and remote SHAs match, even if content text differs', async () => {
    const result = await checkConflict(host, draft({
      remoteFile: { content: 'WILDLY different rendering', sha: 's1', encoding: 'utf-8' },
      baseRemote: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    }))
    expect(result).toBeUndefined()
  })

  it('returns a conflict when the remote SHA moved from the baseline', async () => {
    const result = await checkConflict(host, draft({
      remoteFile: { content: 'edited on remote', sha: 's2', encoding: 'utf-8' },
      baseRemote: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    }))
    expect(result).toEqual({ remoteContent: 'edited on remote', localContent: 'RENDERED' })
  })

  it('returns undefined when there is no baseline (legacy draft, backfilled later)', async () => {
    const result = await checkConflict(host, draft({ baseRemote: undefined }))
    expect(result).toBeUndefined()
  })

  it('falls back to trimmed content compare when a SHA is empty (post-publish baseline)', async () => {
    const same = await checkConflict(host, draft({
      baseRemote: { content: 'hello\n', sha: '', encoding: 'utf-8' },
      remoteFile: { content: 'hello', sha: '', encoding: 'utf-8' },
    }))
    expect(same).toBeUndefined()

    const moved = await checkConflict(host, draft({
      baseRemote: { content: 'hello', sha: '', encoding: 'utf-8' },
      remoteFile: { content: 'goodbye', sha: '', encoding: 'utf-8' },
    }))
    expect(moved).toEqual({ remoteContent: 'goodbye', localContent: 'RENDERED' })
  })

  it('treats a locally-created file that now exists on remote as a conflict', async () => {
    const result = await checkConflict(host, draft({
      status: DraftStatus.Created,
      baseRemote: undefined,
    }))
    expect(result).toEqual({ remoteContent: 'remote text', localContent: 'RENDERED' })
  })

  it('returns undefined for a Deleted draft', async () => {
    const result = await checkConflict(host, draft({ status: DraftStatus.Deleted }))
    expect(result).toBeUndefined()
  })
})
