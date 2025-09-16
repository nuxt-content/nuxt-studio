import { describe, it, expect } from 'vitest'
import { computeActionItems, DEFAULT_STUDIO_ACTIONS } from '../../src/utils/context'
import type { TreeItem } from '../../src/types'

describe('computeActionItems', () => {
  it('should return all actions when no item is provided', () => {
    const result = computeActionItems(DEFAULT_STUDIO_ACTIONS)
    expect(result).toEqual(DEFAULT_STUDIO_ACTIONS)
    expect(result).toHaveLength(DEFAULT_STUDIO_ACTIONS.length)
  })

  it('should return all actions when item is undefined', () => {
    const result = computeActionItems(DEFAULT_STUDIO_ACTIONS, undefined)
    expect(result).toEqual(DEFAULT_STUDIO_ACTIONS)
  })

  it('should filter out create-folder action for file items', () => {
    const fileItem: TreeItem = {
      type: 'file',
      name: 'test.md',
      path: '/test.md',
    } as TreeItem

    const result = computeActionItems(DEFAULT_STUDIO_ACTIONS, fileItem)

    // Should not contain create-folder action
    expect(result.find(action => action.id === 'create-folder')).toBeUndefined()

    // Should contain all other actions
    const expectedActions = DEFAULT_STUDIO_ACTIONS.filter(action => action.id !== 'create-folder')
    expect(result).toEqual(expectedActions)
    expect(result).toHaveLength(DEFAULT_STUDIO_ACTIONS.length - 1)
  })

  it('should return all actions for directory items', () => {
    const directoryItem: TreeItem = {
      type: 'directory',
      name: 'folder',
      path: '/folder',
    } as TreeItem

    const result = computeActionItems(DEFAULT_STUDIO_ACTIONS, directoryItem)
    expect(result).toEqual(DEFAULT_STUDIO_ACTIONS)
    expect(result).toHaveLength(DEFAULT_STUDIO_ACTIONS.length)
  })
})
