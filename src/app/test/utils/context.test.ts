import { describe, it, expect } from 'vitest'
import { computeActionItems, STUDIO_ITEM_ACTION_DEFINITIONS } from '../../src/utils/context'
import { StudioActionId, type TreeItem } from '../../src/types'
import { DraftStatus } from '../../src/types/draft'

describe('computeActionItems', () => {
  it('should return all actions when item is undefined', () => {
    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, undefined)
    expect(result).toEqual(STUDIO_ITEM_ACTION_DEFINITIONS)
  })

  /**************************************************
   ******************* Root items *******************
   **************************************************/
  it('should filter out actions for root items', () => {
    const rootItem: TreeItem = {
      type: 'root',
      name: 'content',
      path: '/',
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, rootItem)

    expect(result.find(action => action.id === StudioActionId.RenameItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.DeleteItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.RenameItem
      && action.id !== StudioActionId.DeleteItem
      && action.id !== StudioActionId.DuplicateItem,
    )
    expect(result).toEqual(expectedActions)
  })

  /**************************************************
   ******************* File items *******************
   **************************************************/
  it('should filter out actions for file items without draft status', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, fileItem)

    expect(result.find(action => action.id === StudioActionId.CreateFolder)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.CreateFile)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RevertItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.CreateFolder
      && action.id !== StudioActionId.CreateFile
      && action.id !== StudioActionId.RevertItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for file items with draft OPENED status', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
      status: DraftStatus.Opened,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, fileItem)

    expect(result.find(action => action.id === StudioActionId.CreateFolder)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.CreateFile)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RevertItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.CreateFolder
      && action.id !== StudioActionId.CreateFile
      && action.id !== StudioActionId.RevertItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for file items with draft UPDATED status', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
      status: DraftStatus.Updated,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, fileItem)

    expect(result.find(action => action.id === StudioActionId.CreateFolder)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.CreateFile)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.CreateFolder
      && action.id !== StudioActionId.CreateFile,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for file items with draft CREATED status', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
      status: DraftStatus.Created,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, fileItem)

    expect(result.find(action => action.id === StudioActionId.CreateFolder)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.CreateFile)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.CreateFolder
      && action.id !== StudioActionId.CreateFile,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for file items with draft DELETED status', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
      status: DraftStatus.Deleted,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, fileItem)

    expect(result.find(action => action.id === StudioActionId.CreateFolder)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.CreateFile)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RenameItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.DeleteItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.CreateFolder
      && action.id !== StudioActionId.CreateFile
      && action.id !== StudioActionId.DuplicateItem
      && action.id !== StudioActionId.RenameItem
      && action.id !== StudioActionId.DeleteItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for file items with draft RENAMED status', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
      status: DraftStatus.Renamed,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, fileItem)

    expect(result.find(action => action.id === StudioActionId.CreateFolder)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.CreateFile)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RenameItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.CreateFolder
      && action.id !== StudioActionId.CreateFile
      && action.id !== StudioActionId.RenameItem,
    )
    expect(result).toEqual(expectedActions)
  })

  /**************************************************
   ****************** Directory items ***************
   **************************************************/

  it('should filter out actions for directory items without draft status', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, directoryItem)

    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RevertItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.DuplicateItem
      && action.id !== StudioActionId.RevertItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for directory items with draft OPENED status', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
      status: DraftStatus.Opened,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, directoryItem)

    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RevertItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.DuplicateItem
      && action.id !== StudioActionId.RevertItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for directory items with draft UPDATED status', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
      status: DraftStatus.Updated,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, directoryItem)

    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.DuplicateItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for directory items with draft CREATED status', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
      status: DraftStatus.Created,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, directoryItem)

    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.DuplicateItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for directory items with draft DELETED status', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
      status: DraftStatus.Deleted,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, directoryItem)

    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RenameItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.DeleteItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.DuplicateItem
      && action.id !== StudioActionId.RenameItem
      && action.id !== StudioActionId.DeleteItem,
    )
    expect(result).toEqual(expectedActions)
  })

  it('should filter out actions for directory items with draft RENAMED status', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
      status: DraftStatus.Renamed,
    } as TreeItem

    const result = computeActionItems(STUDIO_ITEM_ACTION_DEFINITIONS, directoryItem)

    expect(result.find(action => action.id === StudioActionId.DuplicateItem)).toBeUndefined()
    expect(result.find(action => action.id === StudioActionId.RenameItem)).toBeUndefined()

    const expectedActions = STUDIO_ITEM_ACTION_DEFINITIONS.filter(action =>
      action.id !== StudioActionId.DuplicateItem
      && action.id !== StudioActionId.RenameItem,
    )
    expect(result).toEqual(expectedActions)
  })
})
