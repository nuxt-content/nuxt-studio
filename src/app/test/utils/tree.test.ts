import { describe, it, expect } from 'vitest'
import { buildTree, findParentFromId } from '../../src/utils/tree'
import { tree } from '../mocks/tree'
import type { TreeItem } from '../../src/types/tree'
import { dbItemsList } from '../mocks/database'
import type { DraftFileItem } from '../../src/types/draft'
import { DraftStatus } from '../../src/types/draft'

describe('buildTree', () => {
  // Result based on dbItemsList mock
  const result: TreeItem[] = [
    {
      id: 'landing/index.md',
      name: 'home',
      path: '/',
      type: 'file',
      pagePath: '/',
      fileType: 'page',
    },
    {
      id: 'docs/1.getting-started',
      name: 'getting-started',
      path: '/getting-started',
      type: 'directory',
      children: [
        {
          id: 'docs/1.getting-started/2.introduction.md',
          name: 'introduction',
          path: '/getting-started/introduction',
          type: 'file',
          fileType: 'page',
          pagePath: '/getting-started/introduction',
        },
        {
          id: 'docs/1.getting-started/3.installation.md',
          name: 'installation',
          path: '/getting-started/installation',
          type: 'file',
          fileType: 'page',
          pagePath: '/getting-started/installation',
        },
      ],
    },
  ]

  it('should build a tree from a list of database items with empty draft', () => {
    const tree = buildTree(dbItemsList, null)
    expect(tree).toStrictEqual(result)
  })

  it('should build a tree from a list of database items and set file status for root file based on draft', () => {
    const draftList: DraftFileItem[] = [{
      id: dbItemsList[0].id,
      path: dbItemsList[0].path as string,
      status: DraftStatus.Created,
    }]
    const tree = buildTree(dbItemsList, draftList)

    // add status to first element of result
    const expectedTree: TreeItem[] = [{ ...result[0], status: DraftStatus.Created }, ...result.slice(1)]

    expect(tree).toStrictEqual(expectedTree)
  })

  it('should build a tree from a list of database items and set file status for nestedfile based on draft', () => {
    const draftList: DraftFileItem[] = [{
      id: dbItemsList[1].id,
      path: dbItemsList[1].path as string,
      status: DraftStatus.Created,
    }]
    const tree = buildTree(dbItemsList, draftList)

    // Must add status to first element of children
    const expectedTree: TreeItem[] = [
      result[0],
      {
        ...result[1],
        children: [
          { ...result[1].children![0], status: DraftStatus.Created },
          ...result[1].children!.slice(1),
        ],
      },
    ]

    expect(tree).toStrictEqual(expectedTree)
  })
})

describe('findParentFromId', () => {
  it('should find direct parent of a child', () => {
    const parent = findParentFromId(tree, 'docs/1.getting-started/2.introduction.md')
    expect(parent).toBeDefined()
    expect(parent?.id).toBe('docs/1.getting-started')
  })

  it('should find nested parent', () => {
    const parent = findParentFromId(tree, 'docs/1.getting-started/1.advanced/1.studio.md')
    expect(parent).toBeDefined()
    expect(parent?.id).toBe('docs/1.getting-started/1.advanced')
  })

  it('should return null for root level items', () => {
    const parent = findParentFromId(tree, 'landing/index.md')
    expect(parent).toBeNull()
  })

  it('should return null for non-existent items', () => {
    const parent = findParentFromId(tree, 'non/existent/item.md')
    expect(parent).toBeNull()
  })

  it('should return null for empty tree', () => {
    const parent = findParentFromId([], 'any/item.md')
    expect(parent).toBeNull()
  })
})
