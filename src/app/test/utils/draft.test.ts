import { describe, it, expect } from 'vitest'
import type { DatabaseItem } from '../../src/types/database'
import { getDraftStatus, findDescendantsFromId } from '../../src/utils/draft'
import { DraftStatus } from '../../src/types/draft'
import { dbItemsList } from '../mocks/database'
import { draftItemsList } from '../mocks/draft'
import { ROOT_ITEM } from '../../src/utils/tree'

describe('getDraftStatus', () => {
  it('draft is CREATED if originalDatabaseItem is not defined', () => {
    const originalDatabaseItem: DatabaseItem = undefined as never
    const draft: DatabaseItem = {
      id: 'landing/index.md',
      title: 'Home',
      body: {
        type: 'minimark',
        value: [],
      },
      description: 'Home page',
      extension: 'md',
      stem: 'index',
      meta: {},
    }

    const status = getDraftStatus(draft, originalDatabaseItem)
    expect(status).toBe(DraftStatus.Created)
  })

  it('draft is OPENED if originalDatabaseItem is defined and is the same as draftedDocument', () => {
    const originalDatabaseItem: DatabaseItem = dbItemsList[0]
    const draft: DatabaseItem = originalDatabaseItem

    const status = getDraftStatus(draft, originalDatabaseItem)
    expect(status).toBe(DraftStatus.Opened)
  })

  it('draft is UPDATED if originalDatabaseItem is defined and is different from draftedDocument', () => {
    const originalDatabaseItem: DatabaseItem = dbItemsList[0]
    const draft: DatabaseItem = {
      ...originalDatabaseItem,
      title: 'New title',
    }

    const status = getDraftStatus(draft, originalDatabaseItem)
    expect(status).toBe(DraftStatus.Updated)
  })
})

describe('findDescendantsFromId', () => {
  it('returns exact match for a root level file', () => {
    const descendants = findDescendantsFromId(draftItemsList, 'landing/index.md')
    expect(descendants).toHaveLength(1)
    expect(descendants[0].id).toBe('landing/index.md')
    expect(descendants[0].fsPath).toBe('/index.md')
  })

  it('returns empty array for non-existent id', () => {
    const descendants = findDescendantsFromId(draftItemsList, 'non-existent/file.md')
    expect(descendants).toHaveLength(0)
  })

  it('returns all descendants files for a directory path', () => {
    const descendants = findDescendantsFromId(draftItemsList, 'docs/1.getting-started')

    expect(descendants).toHaveLength(5)

    expect(descendants.some(item => item.id === 'docs/1.getting-started/2.introduction.md')).toBe(true)
    expect(descendants.some(item => item.id === 'docs/1.getting-started/3.installation.md')).toBe(true)
    expect(descendants.some(item => item.id === 'docs/1.getting-started/4.configuration.md')).toBe(true)
    expect(descendants.some(item => item.id === 'docs/1.getting-started/1.advanced/1.studio.md')).toBe(true)
    expect(descendants.some(item => item.id === 'docs/1.getting-started/1.advanced/2.deployment.md')).toBe(true)
  })

  it('returns all descendants for a nested directory path', () => {
    const descendants = findDescendantsFromId(draftItemsList, 'docs/1.getting-started/1.advanced')

    expect(descendants).toHaveLength(2)

    expect(descendants.some(item => item.id === 'docs/1.getting-started/1.advanced/1.studio.md')).toBe(true)
    expect(descendants.some(item => item.id === 'docs/1.getting-started/1.advanced/2.deployment.md')).toBe(true)
  })

  it('returns all descendants for root item', () => {
    const descendants = findDescendantsFromId(draftItemsList, ROOT_ITEM.id)

    expect(descendants).toHaveLength(draftItemsList.length)
  })

  it('returns only the file itself when searching for a specific file', () => {
    const descendants = findDescendantsFromId(draftItemsList, 'docs/1.getting-started/1.advanced/1.studio.md')

    expect(descendants).toHaveLength(1)
    expect(descendants[0].id).toBe('docs/1.getting-started/1.advanced/1.studio.md')
  })
})
