import { buildTree } from '../../src/utils/draft'
import { describe, it, expect } from 'vitest'
import { dbItemsList } from '../mocks/database'
import type { TreeItem } from '../../src/types/tree'

describe('buildTree', () => {
  it('should build a tree from a list of items without exisiting draft', () => {
    const tree = buildTree(dbItemsList, [])
    const result: TreeItem[] = [
      {
        id: 'landing/index.md',
        name: 'home',
        path: '/',
        type: 'file',
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
          },
          {
            id: 'docs/1.getting-started/3.installation.md',
            name: 'installation',
            path: '/getting-started/installation',
            type: 'file',
            fileType: 'page',
          },
        ],
      },
    ]
    expect(tree).toMatchObject(result)
  })
})
