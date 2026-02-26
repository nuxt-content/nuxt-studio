import { describe, it, expect } from 'vitest'
import { buildTree, findParentFromFsPath, findItemFromRoute, findItemFromFsPath, findDescendantsFileItemsFromFsPath, getTreeStatus } from '../../../src/utils/tree'
import { tree } from '../../../test/mocks/tree'
import type { TreeItem } from '../../../src/types/tree'
import { dbItemsList, languagePrefixedDbItemsList, nestedDbItemsList } from '../../../test/mocks/database'
import type { DraftItem } from '../../../src/types/draft'
import type { MediaItem } from '../../../src/types'
import { DraftStatus, TreeStatus } from '../../../src/types'
import type { RouteLocationNormalized } from 'vue-router'
import type { DatabaseItem } from '../../../src/types/database'
import { joinURL, withLeadingSlash } from 'ufo'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../../src/utils/media'

describe('buildTree of documents with one level of depth', () => {
  // Result based on dbItemsList mock
  const result: TreeItem[] = [
    {
      name: 'getting-started',
      fsPath: '1.getting-started',
      type: 'directory',
      prefix: '1',
      children: [
        {
          name: 'introduction',
          fsPath: '1.getting-started/2.introduction.md',
          type: 'file',
          routePath: '/getting-started/introduction',
          prefix: '2',
        },
        {
          name: 'installation',
          fsPath: '1.getting-started/3.installation.md',
          type: 'file',
          routePath: '/getting-started/installation',
          prefix: '3',
        },
      ],
    },
    {
      name: 'home',
      fsPath: 'index.md',
      type: 'file',
      routePath: '/',
      prefix: null,
    },
  ]

  it('Without draft', () => {
    const tree = buildTree(dbItemsList, null)
    expect(tree).toStrictEqual(result as TreeItem[])
  })

  it('With draft', () => {
    const createdDbItem: DatabaseItem = dbItemsList[0]

    const draftList: DraftItem[] = [{
      fsPath: createdDbItem.fsPath!,
      status: DraftStatus.Created,
      original: undefined,
      modified: createdDbItem,
    }]

    const tree = buildTree(dbItemsList, draftList)

    expect(tree).toStrictEqual([
      result[0],
      {
        ...result[1],
        status: TreeStatus.Created,
      }] as TreeItem[])
  })

  it('With DELETED draft file in existing directory', () => {
    const deletedDbItem: DatabaseItem = dbItemsList[1] // 2.introduction.md

    const draftList: DraftItem[] = [{
      fsPath: deletedDbItem.fsPath!,
      status: DraftStatus.Deleted,
      modified: undefined,
      original: deletedDbItem,
    }]

    const dbItemsListWithoutDeletedDbItem = dbItemsList.filter(item => item.id !== deletedDbItem.id)

    const tree = buildTree(dbItemsListWithoutDeletedDbItem, draftList)

    expect(tree).toStrictEqual([
      {
        ...result[0],
        status: TreeStatus.Updated,
        children: [
          {
            name: 'introduction',
            fsPath: deletedDbItem.fsPath!,
            type: 'file',
            routePath: deletedDbItem.path,
            status: TreeStatus.Deleted,
            prefix: '2',
          },
          result[0].children![1],
        ],
      },
      { ...result[1] },
    ] as TreeItem[])
  })

  it('With DELETED draft file in non existing directory', () => {
    const deletedDbItem: DatabaseItem = dbItemsList[2] // 3.installation.md

    const draftList: DraftItem[] = [{
      fsPath: deletedDbItem.fsPath!,
      status: DraftStatus.Deleted,
      modified: undefined,
      original: deletedDbItem,
    }]

    const dbItemsListWithoutDeletedDbItem = dbItemsList.filter(item => item.id !== deletedDbItem.id)

    const tree = buildTree(dbItemsListWithoutDeletedDbItem, draftList)

    expect(tree).toStrictEqual([
      {
        ...result[0],
        status: TreeStatus.Updated,
        children: [
          result[0].children![0],
          {
            name: 'installation',
            fsPath: deletedDbItem.fsPath!,
            type: 'file',
            routePath: deletedDbItem.path,
            status: TreeStatus.Deleted,
            prefix: '3',
          },
        ],
      },
      result[1],
    ] as TreeItem[])
  })

  it('With UPDATED draft file in existing directory (directory status is set)', () => {
    const updatedDbItem: DatabaseItem = dbItemsList[1] // 2.introduction.md

    const draftList: DraftItem[] = [{
      fsPath: updatedDbItem.fsPath!,
      status: DraftStatus.Updated,
      original: updatedDbItem,
      modified: {
        ...updatedDbItem,
        body: {
          type: 'minimark',
          value: ['Modified'],
        },
      },
    }]

    const tree = buildTree(dbItemsList, draftList)

    const expectedTree = [
      {
        ...result[0],
        status: TreeStatus.Updated,
        children: [
          {
            ...result[0].children![0],
            status: TreeStatus.Updated,
          },
          ...result[0].children!.slice(1),
        ],
      },
      result[1],
    ]

    expect(tree).toStrictEqual(expectedTree as TreeItem[])
  })

  it('With CREATED and OPENED draft files in exsiting directory (directory status is set)', () => {
    const createdDbItem: DatabaseItem = dbItemsList[1] // 2.introduction.md
    const openedDbItem: DatabaseItem = dbItemsList[2] // 3.installation.md

    const draftList: DraftItem[] = [{
      fsPath: createdDbItem.fsPath!,
      status: DraftStatus.Created,
      original: undefined,
      modified: createdDbItem,
    }, {
      fsPath: openedDbItem.fsPath!,
      status: DraftStatus.Pristine,
      original: openedDbItem,
      modified: openedDbItem,
    }]

    const tree = buildTree(dbItemsList, draftList)

    const expectedTree = [
      {
        ...result[0],
        status: TreeStatus.Updated,
        children: [
          { ...result[0].children![0], status: TreeStatus.Created },
          { ...result[0].children![1], status: TreeStatus.Opened },
        ],
      },
      result[1],
    ]

    expect(tree).toStrictEqual(expectedTree as TreeItem[])
  })

  it('With OPENED draft files in existing directory (directory status is not set)', () => {
    const openedDbItem1: DatabaseItem = dbItemsList[1] // 2.introduction.md
    const openedDbItem2: DatabaseItem = dbItemsList[2] // 3.installation.md

    const draftList: DraftItem[] = [{
      fsPath: openedDbItem1.fsPath!,
      status: DraftStatus.Pristine,
      original: openedDbItem1,
      modified: openedDbItem1,
    }, {
      fsPath: openedDbItem2.fsPath!,
      status: DraftStatus.Pristine,
      original: openedDbItem2,
      modified: openedDbItem2,
    }]

    const tree = buildTree(dbItemsList, draftList)

    const expectedTree = [
      {
        ...result[0],
        children: [
          {
            ...result[0].children![0], status: TreeStatus.Opened },
          { ...result[0].children![1], status: TreeStatus.Opened },
          ...result[0].children!.slice(2),
        ],
      },
      result[1],
    ]

    expect(tree).toStrictEqual(expectedTree as TreeItem[])
  })

  it('With same id DELETED and CREATED draft file resulting in RENAMED', () => {
    const deletedDbItem: DatabaseItem = dbItemsList[1] // 2.introduction.md
    const createdDbItem: DatabaseItem = { // 2.renamed.md
      ...dbItemsList[1],
      id: 'docs/1.getting-started/2.renamed.md',
      path: '/getting-started/renamed',
      stem: '1.getting-started/2.renamed',
      fsPath: '1.getting-started/2.renamed.md',
    }

    const draftList: DraftItem[] = [{
      fsPath: deletedDbItem.fsPath!,
      status: DraftStatus.Deleted,
      modified: undefined,
      original: deletedDbItem,
    }, {
      fsPath: createdDbItem.fsPath!,
      status: DraftStatus.Created,
      modified: createdDbItem,
      original: deletedDbItem,
    }]

    // Remove deleted item and replace with created item
    const dbItemsWithoutDeletedWithCreated = dbItemsList.filter(item => item.id !== deletedDbItem.id)
    dbItemsWithoutDeletedWithCreated.push(createdDbItem)

    const tree = buildTree(dbItemsWithoutDeletedWithCreated, draftList)

    expect(tree).toStrictEqual([
      {
        ...result[0],
        status: TreeStatus.Updated,
        children: [
          {
            fsPath: createdDbItem.fsPath!,
            routePath: createdDbItem.path,
            name: createdDbItem.path!.split('/').pop()!,
            type: 'file',
            status: TreeStatus.Renamed,
            prefix: '2',
          },
          ...result[0].children!.slice(1),
        ],
      },
      result[1],
    ] as TreeItem[])
  })
})

describe('buildTree of documents with two levels of depth', () => {
  // Note: Items are sorted by numeric prefix
  const result: TreeItem[] = [
    {
      name: 'essentials',
      fsPath: '1.essentials',
      type: 'directory',
      prefix: '1',
      children: [
        {
          name: 'nested',
          fsPath: '1.essentials/1.nested',
          type: 'directory',
          prefix: '1',
          children: [
            {
              name: 'advanced',
              fsPath: '1.essentials/1.nested/2.advanced.md',
              type: 'file',
              routePath: '/essentials/nested/advanced',
              prefix: '2',
            },
          ],
        },
        {
          name: 'configuration',
          fsPath: '1.essentials/2.configuration.md',
          type: 'file',
          routePath: '/essentials/configuration',
          prefix: '2',
        },
      ],
    },
  ]

  it('Without draft', () => {
    const tree = buildTree(nestedDbItemsList, null)
    expect(tree).toStrictEqual(result)
  })

  it('With one level of depth draft files', () => {
    const updatedDbItem: DatabaseItem = nestedDbItemsList[0] // 1.essentials/2.configuration.md

    const draftList: DraftItem[] = [{
      fsPath: updatedDbItem.fsPath!,
      status: DraftStatus.Updated,
      original: updatedDbItem,
      modified: {
        ...updatedDbItem,
        body: {
          type: 'minimark',
          value: ['Modified'],
        },
      },
    }]

    const tree = buildTree(nestedDbItemsList, draftList)

    expect(tree).toStrictEqual([{
      ...result[0],
      status: TreeStatus.Updated,
      children: [
        result[0].children![0],
        { ...result[0].children![1], status: TreeStatus.Updated },
      ],
    }] as TreeItem[])
  })

  it('With nested levels of depth draft files', () => {
    const updatedDbItem: DatabaseItem = nestedDbItemsList[1] // 1.essentials/1.nested/2.advanced.md

    const draftList: DraftItem[] = [{
      fsPath: updatedDbItem.fsPath!,
      status: DraftStatus.Updated,
      original: updatedDbItem,
      modified: {
        ...updatedDbItem,
        body: {
          type: 'minimark',
          value: ['Modified'],
        },
      },
    }]

    const tree = buildTree(nestedDbItemsList, draftList)

    expect(tree).toStrictEqual([{
      ...result[0],
      status: TreeStatus.Updated,
      children: [
        {
          ...result[0].children![0],
          status: TreeStatus.Updated,
          children: [
            {
              ...result[0].children![0].children![0],
              status: TreeStatus.Updated,
            },
          ],
        },
        result[0].children![1],
      ],
    }] as TreeItem[])
  })

  it ('With DELETED draft file in nested non existing directory (directory status is set)', () => {
    const deletedDbItem: DatabaseItem = nestedDbItemsList[1] // 1.essentials/1.nested/2.advanced.md

    const draftList: DraftItem[] = [{
      fsPath: deletedDbItem.fsPath!,
      status: DraftStatus.Deleted,
      modified: undefined,
      original: deletedDbItem,
    }]

    // Remove the deleted item from the nestedDbItemsList
    const nestedDbItemsListWithoutDeletedDbItem = nestedDbItemsList.filter(item => item.id !== deletedDbItem.id)

    const tree = buildTree(nestedDbItemsListWithoutDeletedDbItem, draftList)

    expect(tree).toStrictEqual([{
      ...result[0],
      status: TreeStatus.Updated,
      children: [
        {
          ...result[0].children![0],
          status: TreeStatus.Deleted,
          children: [
            {
              name: 'advanced',
              fsPath: deletedDbItem.fsPath!,
              routePath: deletedDbItem.path,
              type: 'file',
              status: TreeStatus.Deleted,
              prefix: '2',
            },
          ],
        },
        result[0].children![1],
      ],
    }] as TreeItem[])
  })
})

describe('buildTree of documents with language prefixed', () => {
  // Note: Items with prefix come before items without prefix
  const result: TreeItem[] = [
    {
      name: 'en',
      fsPath: 'en',
      type: 'directory',
      prefix: null,
      children: [
        {
          name: 'getting-started',
          fsPath: 'en/1.getting-started',
          type: 'directory',
          prefix: '1',
          children: [
            {
              name: 'introduction',
              fsPath: 'en/1.getting-started/2.introduction.md',
              type: 'file',
              routePath: '/en/getting-started/introduction',
              prefix: '2',
            },
            {
              name: 'installation',
              fsPath: 'en/1.getting-started/3.installation.md',
              type: 'file',
              routePath: '/en/getting-started/installation',
              prefix: '3',
            },
          ],
        },
        {
          name: 'index',
          fsPath: 'en/index.md',
          prefix: null,
          type: 'file',
          routePath: '/en',
        },
      ],
    },
  ]

  it('Without draft', () => {
    const tree = buildTree(languagePrefixedDbItemsList, null)
    expect(tree).toStrictEqual(result)
  })
})

describe('buildTree with numeric prefix sorting', () => {
  it('should sort items numerically by prefix (2, 6, 12, 17, 22)', () => {
    const dbItemsWithNumericPrefixes: DatabaseItem[] = [
      {
        id: 'docs/1.getting-started/12.project-structure.md',
        title: 'Project Structure',
        body: { type: 'minimark', value: [] },
        description: 'Learn about project structure.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/project-structure',
        fsPath: '1.getting-started/12.project-structure.md',
        stem: '1.getting-started/12.project-structure',
        __hash__: 'HASH_12',
      },
      {
        id: 'docs/1.getting-started/17.installation.md',
        title: 'Installation',
        body: { type: 'minimark', value: [] },
        description: 'Learn how to install.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/installation',
        fsPath: '1.getting-started/17.installation.md',
        stem: '1.getting-started/17.installation',
        __hash__: 'HASH_17',
      },
      {
        id: 'docs/1.getting-started/2.introduction.md',
        title: 'Introduction',
        body: { type: 'minimark', value: [] },
        description: 'Introduction to the docs.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/introduction',
        fsPath: '1.getting-started/2.introduction.md',
        stem: '1.getting-started/2.introduction',
        __hash__: 'HASH_2',
      },
      {
        id: 'docs/1.getting-started/22.studio.md',
        title: 'Studio',
        body: { type: 'minimark', value: [] },
        description: 'Learn about Studio.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/studio',
        fsPath: '1.getting-started/22.studio.md',
        stem: '1.getting-started/22.studio',
        __hash__: 'HASH_22',
      },
      {
        id: 'docs/1.getting-started/6.migration.md',
        title: 'Migration',
        body: { type: 'minimark', value: [] },
        description: 'Learn how to migrate.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/migration',
        fsPath: '1.getting-started/6.migration.md',
        stem: '1.getting-started/6.migration',
        __hash__: 'HASH_6',
      },
    ]

    const tree = buildTree(dbItemsWithNumericPrefixes, null)

    expect(tree).toHaveLength(1)
    expect(tree[0].name).toBe('getting-started')
    expect(tree[0].prefix).toBe('1')
    expect(tree[0].children).toHaveLength(5)

    // Check that children are sorted numerically: 2, 6, 12, 17, 22
    const children = tree[0].children!
    expect(children[0].prefix).toBe('2')
    expect(children[0].name).toBe('introduction')
    expect(children[1].prefix).toBe('6')
    expect(children[1].name).toBe('migration')
    expect(children[2].prefix).toBe('12')
    expect(children[2].name).toBe('project-structure')
    expect(children[3].prefix).toBe('17')
    expect(children[3].name).toBe('installation')
    expect(children[4].prefix).toBe('22')
    expect(children[4].name).toBe('studio')
  })

  it('should sort items with same prefix alphabetically by name', () => {
    const dbItemsWithSamePrefix: DatabaseItem[] = [
      {
        id: 'docs/1.getting-started/5.zulu.md',
        title: 'Zulu',
        body: { type: 'minimark', value: [] },
        description: 'Zulu.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/zulu',
        fsPath: '1.getting-started/5.zulu.md',
        stem: '1.getting-started/5.zulu',
        __hash__: 'HASH_ZULU',
      },
      {
        id: 'docs/1.getting-started/5.alpha.md',
        title: 'Alpha',
        body: { type: 'minimark', value: [] },
        description: 'Alpha.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/alpha',
        fsPath: '1.getting-started/5.alpha.md',
        stem: '1.getting-started/5.alpha',
        __hash__: 'HASH_ALPHA',
      },
      {
        id: 'docs/1.getting-started/5.middle.md',
        title: 'Middle',
        body: { type: 'minimark', value: [] },
        description: 'Middle.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/middle',
        fsPath: '1.getting-started/5.middle.md',
        stem: '1.getting-started/5.middle',
        __hash__: 'HASH_MIDDLE',
      },
    ]

    const tree = buildTree(dbItemsWithSamePrefix, null)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(3)

    // Check that children with same prefix (5) are sorted alphabetically
    const children = tree[0].children!
    expect(children[0].prefix).toBe('5')
    expect(children[0].name).toBe('alpha')
    expect(children[1].prefix).toBe('5')
    expect(children[1].name).toBe('middle')
    expect(children[2].prefix).toBe('5')
    expect(children[2].name).toBe('zulu')
  })

  it('should place items without prefix after items with prefix', () => {
    const dbItemsMixed: DatabaseItem[] = [
      {
        id: 'docs/1.getting-started/no-prefix.md',
        title: 'No Prefix',
        body: { type: 'minimark', value: [] },
        description: 'No prefix.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/no-prefix',
        fsPath: '1.getting-started/no-prefix.md',
        stem: '1.getting-started/no-prefix',
        __hash__: 'HASH_NO_PREFIX',
      },
      {
        id: 'docs/1.getting-started/2.introduction.md',
        title: 'Introduction',
        body: { type: 'minimark', value: [] },
        description: 'Introduction.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/introduction',
        fsPath: '1.getting-started/2.introduction.md',
        stem: '1.getting-started/2.introduction',
        __hash__: 'HASH_2',
      },
      {
        id: 'docs/1.getting-started/another-no-prefix.md',
        title: 'Another No Prefix',
        body: { type: 'minimark', value: [] },
        description: 'Another no prefix.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/another-no-prefix',
        fsPath: '1.getting-started/another-no-prefix.md',
        stem: '1.getting-started/another-no-prefix',
        __hash__: 'HASH_ANOTHER_NO_PREFIX',
      },
      {
        id: 'docs/1.getting-started/12.project-structure.md',
        title: 'Project Structure',
        body: { type: 'minimark', value: [] },
        description: 'Project structure.',
        extension: 'md',
        meta: {},
        navigation: {},
        path: '/getting-started/project-structure',
        fsPath: '1.getting-started/12.project-structure.md',
        stem: '1.getting-started/12.project-structure',
        __hash__: 'HASH_12',
      },
    ]

    const tree = buildTree(dbItemsMixed, null)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(4)

    const children = tree[0].children!
    // Items with prefix come first (sorted numerically)
    expect(children[0].prefix).toBe('2')
    expect(children[0].name).toBe('introduction')
    expect(children[1].prefix).toBe('12')
    expect(children[1].name).toBe('project-structure')
    // Items without prefix come last (sorted alphabetically)
    expect(children[2].prefix).toBeNull()
    expect(children[2].name).toBe('another-no-prefix')
    expect(children[3].prefix).toBeNull()
    expect(children[3].name).toBe('no-prefix')
  })
})

describe('buildTree of medias', () => {
  it('With .gitkeep file in directory (file is marked as hidden)', () => {
    const mediaFolderName = 'media-folder'
    const gitKeepFsPath = joinURL(mediaFolderName, '.gitkeep')
    const mediaFsPath = joinURL(mediaFolderName, 'image.jpg')
    const mediaId = joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, mediaFsPath)
    const gitKeepId = joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, gitKeepFsPath)

    const gitkeepDbItem: MediaItem = {
      id: gitKeepId,
      fsPath: gitKeepFsPath,
      stem: '.gitkeep',
      extension: 'gitkeep',
      path: withLeadingSlash(gitKeepFsPath),
    }

    const mediaDbItem: MediaItem = {
      id: mediaId,
      fsPath: mediaFsPath,
      stem: 'image',
      extension: 'jpg',
      path: withLeadingSlash(mediaFsPath),
    }

    const draftList: DraftItem[] = [{
      fsPath: gitkeepDbItem.fsPath!,
      status: DraftStatus.Created,
      original: undefined,
      modified: gitkeepDbItem,
    }]

    const tree = buildTree([gitkeepDbItem, mediaDbItem], draftList)

    expect(tree).toHaveLength(1)
    expect(tree[0]).toHaveProperty('fsPath', mediaFolderName)
    expect(tree[0].children).toHaveLength(2)

    const gitkeepFile = tree[0].children!.find(item => item.fsPath === gitKeepFsPath)
    const imageFile = tree[0].children!.find(item => item.fsPath === mediaFsPath)

    expect(gitkeepFile).toHaveProperty('hide', true)
    expect(imageFile).toBeDefined()
    expect(imageFile!.hide).toBeUndefined()
  })
})

describe('getTreeStatus', () => {
  it('should return OPENED when draft status is Pristine', () => {
    const draftItem: DraftItem = {
      fsPath: 'index.md',
      status: DraftStatus.Pristine,
      original: dbItemsList[0],
      modified: dbItemsList[0],
    }

    const status = getTreeStatus(draftItem)
    expect(status).toBe(TreeStatus.Opened)
  })

  it('should return DELETED when draft status is Deleted', () => {
    const draftItem: DraftItem = {
      fsPath: 'index.md',
      status: DraftStatus.Deleted,
      original: dbItemsList[0],
      modified: undefined,
    }

    const status = getTreeStatus(draftItem)
    expect(status).toBe(TreeStatus.Deleted)
  })

  it('should return UPDATED when draft status is Updated', () => {
    const original: DatabaseItem = dbItemsList[0]
    const modified: DatabaseItem = {
      ...original,
      title: 'New title',
    }

    const draftItem: DraftItem = {
      fsPath: 'index.md',
      status: DraftStatus.Updated,
      original,
      modified,
    }

    const status = getTreeStatus(draftItem)
    expect(status).toBe(TreeStatus.Updated)
  })

  it('should return RENAMED when draft status is Created and original.id differs from modified.id', () => {
    const original: DatabaseItem = dbItemsList[0] // index.md
    const modified: DatabaseItem = {
      ...original,
      id: 'renamed.md',
    }

    const draftItem: DraftItem = {
      fsPath: 'renamed.md',
      status: DraftStatus.Created,
      original,
      modified,
    }

    const status = getTreeStatus(draftItem)
    expect(status).toBe(TreeStatus.Renamed)
  })

  it('should return CREATED when draft status is Created without original', () => {
    const draftItem: DraftItem = {
      fsPath: 'index.md',
      status: DraftStatus.Created,
      original: undefined,
      modified: dbItemsList[0],
    }

    const status = getTreeStatus(draftItem)
    expect(status).toBe(TreeStatus.Created)
  })

  it('should return CREATED when draft status is Created with original that has same id', () => {
    const original: DatabaseItem = dbItemsList[0]
    const modified: DatabaseItem = dbItemsList[0]

    const draftItem: DraftItem = {
      fsPath: 'index.md',
      status: DraftStatus.Created,
      original,
      modified,
    }

    const status = getTreeStatus(draftItem)
    expect(status).toBe(TreeStatus.Created)
  })
})

describe('findParentFromFsPath', () => {
  it('should find direct parent of a child', () => {
    const parent = findParentFromFsPath(tree, '1.getting-started/2.introduction.md')
    expect(parent).toBeDefined()
    expect(parent?.fsPath).toBe('1.getting-started')
  })

  it('should find nested parent', () => {
    const parent = findParentFromFsPath(tree, '1.getting-started/1.advanced/1.studio.md')
    expect(parent).toBeDefined()
    expect(parent?.fsPath).toBe('1.getting-started/1.advanced')
  })

  it('should return null for root level items', () => {
    const parent = findParentFromFsPath(tree, 'index.md')
    expect(parent).toBeNull()
  })

  it('should return null for non-existent items', () => {
    const parent = findParentFromFsPath(tree, 'non/existent/item.md')
    expect(parent).toBeNull()
  })

  it('should return null for empty tree', () => {
    const parent = findParentFromFsPath([], 'any/item.md')
    expect(parent).toBeNull()
  })
})

describe('findItemFromRoute', () => {
  const mockRoute = (path: string) => ({ path }) as RouteLocationNormalized

  it('should find root level file by path', () => {
    const route = mockRoute('/')
    const item = findItemFromRoute(tree, route)
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('index.md')
    expect(item?.name).toBe('home')
  })

  it('should find nested file by path', () => {
    const route = mockRoute('/getting-started/introduction')
    const item = findItemFromRoute(tree, route)
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('1.getting-started/2.introduction.md')
    expect(item?.name).toBe('introduction')
  })

  it('should find deeply nested file by path', () => {
    const route = mockRoute('/getting-started/installation/advanced/studio')
    const item = findItemFromRoute(tree, route)
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('1.getting-started/1.advanced/1.studio.md')
    expect(item?.name).toBe('studio')
  })

  it('should return null for non-existent route', () => {
    const route = mockRoute('/non/existent/path')
    const item = findItemFromRoute(tree, route)
    expect(item).toBeNull()
  })

  it('should return null for empty tree', () => {
    const route = mockRoute('/')
    const item = findItemFromRoute([], route)
    expect(item).toBeNull()
  })
})

describe('findItemFromFsPath', () => {
  it('should find root level item by fsPath', () => {
    const item = findItemFromFsPath(tree, 'index.md')
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('index.md')
    expect(item?.name).toBe('home')
    expect(item?.type).toBe('file')
  })

  it('should find nested file by fsPath', () => {
    const item = findItemFromFsPath(tree, '1.getting-started/2.introduction.md')
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('1.getting-started/2.introduction.md')
    expect(item?.name).toBe('introduction')
    expect(item?.type).toBe('file')
  })

  it('should find directory by fsPath', () => {
    const item = findItemFromFsPath(tree, '1.getting-started')
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('1.getting-started')
    expect(item?.name).toBe('getting-started')
    expect(item?.type).toBe('directory')
    expect(item?.children).toBeDefined()
  })

  it('should find deeply nested item by fsPath', () => {
    const item = findItemFromFsPath(tree, '1.getting-started/1.advanced/1.studio.md')
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('1.getting-started/1.advanced/1.studio.md')
    expect(item?.name).toBe('studio')
    expect(item?.type).toBe('file')
  })

  it('should find nested directory by fsPath', () => {
    const item = findItemFromFsPath(tree, '1.getting-started/1.advanced')
    expect(item).toBeDefined()
    expect(item?.fsPath).toBe('1.getting-started/1.advanced')
    expect(item?.name).toBe('advanced')
    expect(item?.type).toBe('directory')
  })

  it('should return null for non-existent fsPath', () => {
    const item = findItemFromFsPath(tree, 'non/existent/item.md')
    expect(item).toBeNull()
  })

  it('should return null for partial fsPath match', () => {
    const item = findItemFromFsPath(tree, '1.getting-started/2.introduction')
    expect(item).toBeNull()
  })

  it('should return null for empty tree', () => {
    const item = findItemFromFsPath([], 'any/item.md')
    expect(item).toBeNull()
  })

  it('should return null for empty fsPath', () => {
    const item = findItemFromFsPath(tree, '')
    expect(item).toBeNull()
  })
})

describe('findDescendantsFileItemsFromFsPath', () => {
  it('returns exact match for a root level file', () => {
    const descendants = findDescendantsFileItemsFromFsPath(tree, 'index.md')
    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('index.md')
  })

  it('returns empty array for non-existent id', () => {
    const descendants = findDescendantsFileItemsFromFsPath(tree, 'non-existent/file.md')
    expect(descendants).toHaveLength(0)
  })

  it('returns all descendants files for directory id', () => {
    const descendants = findDescendantsFileItemsFromFsPath(tree, '1.getting-started')

    expect(descendants).toHaveLength(3)

    expect(descendants.some(item => item.fsPath === '1.getting-started/2.introduction.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/3.installation.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/1.studio.md')).toBe(true)
  })

  it('returns all descendants files for nested directory id', () => {
    const descendants = findDescendantsFileItemsFromFsPath(tree, '1.getting-started/1.advanced')

    expect(descendants).toHaveLength(1)

    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/1.studio.md')).toBe(true)
  })

  it('returns only the file itself when searching for a specific file', () => {
    const descendants = findDescendantsFileItemsFromFsPath(tree, '1.getting-started/2.introduction.md')

    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('1.getting-started/2.introduction.md')
  })

  it('returns deeply nested file when searching by specific file id', () => {
    const descendants = findDescendantsFileItemsFromFsPath(tree, '1.getting-started/1.advanced/1.studio.md')

    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('1.getting-started/1.advanced/1.studio.md')
  })
})
