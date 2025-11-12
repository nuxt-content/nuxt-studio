import { describe, it, expect } from 'vitest'
import { findDescendantsFromFsPath, getDraftStatus } from '../../../src/utils/draft'
import { draftItemsList } from '../../../test/mocks/draft'
import { dbItemsList } from '../../../test/mocks/database'
import type { DatabaseItem } from '../../../src/types'
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

describe('getDraftStatus', () => {
  const areDocumentsEqual = (document1: DatabaseItem, document2: DatabaseItem) => JSON.stringify(document1) === JSON.stringify(document2)

  it('returns Deleted status when modified item is undefined', () => {
    const original = dbItemsList[0] // landing/index.md

    expect(getDraftStatus(undefined as never, original, areDocumentsEqual)).toBe(DraftStatus.Deleted)
  })

  it('returns Created status when original is undefined', () => {
    const modified = dbItemsList[1] // docs/1.getting-started/2.introduction.md

    expect(getDraftStatus(modified, undefined as never, areDocumentsEqual)).toBe(DraftStatus.Created)
  })

  it('returns Created status when original has different id', () => {
    const original = dbItemsList[0] // landing/index.md
    const modified = dbItemsList[1] // docs/1.getting-started/2.introduction.md

    expect(getDraftStatus(modified, original, areDocumentsEqual)).toBe(DraftStatus.Created)
  })

  it('returns Updated status when markdown content is different', () => {
    const original = dbItemsList[1] // docs/1.getting-started/2.introduction.md
    const modified = {
      ...original,
      body: {
        type: 'minimark',
        value: ['text', 'Modified'],
      },
    }

    expect(getDraftStatus(modified, original, () => false)).toBe(DraftStatus.Updated)
  })

  it('returns Pristine status when markdown content is identical', () => {
    const original = dbItemsList[1] // docs/1.getting-started/2.introduction.md

    expect(getDraftStatus(original, original, areDocumentsEqual)).toBe(DraftStatus.Pristine)
  })
})
