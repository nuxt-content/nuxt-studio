import type { StudioAction, TreeItem } from '../types'

/**
 * Studio action definitions (metadata only)
 * Click handlers are implemented in the useContext composable
 */
export const STUDIO_ACTION_DEFINITIONS: StudioAction[] = [
  {
    id: 'create-folder',
    label: 'Create folder',
    icon: 'i-lucide-folder-plus',
  },
  {
    id: 'create-file',
    label: 'Create file',
    icon: 'i-lucide-file-plus',
  },
  {
    id: 'revert-file',
    label: 'Revert changes',
    icon: 'i-lucide-rotate-ccw',
  },
  {
    id: 'rename-file',
    label: 'Rename',
    icon: 'i-lucide-pencil',
  },
  {
    id: 'delete-file',
    label: 'Delete',
    icon: 'i-lucide-trash',
  },
  {
    id: 'duplicate-file',
    label: 'Duplicate',
    icon: 'i-lucide-copy',
  },
] as const

export function computeActionItems(item?: TreeItem): StudioAction[] {
  const studioActions = STUDIO_ACTION_DEFINITIONS

  if (item?.type === 'file') {
    return studioActions.filter(action => action.id !== 'create-folder')
  }

  return studioActions
}
