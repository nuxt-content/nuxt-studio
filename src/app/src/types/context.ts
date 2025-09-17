export enum StudioFeature {
  Content = 'content',
  Media = 'media',
  Config = 'config',
}

export enum StudioActionId {
  CreateFolder = 'create-folder',
  CreateFile = 'create-file',
  RevertItem = 'revert-item',
  RenameItem = 'rename-item',
  DeleteItem = 'delete-item',
  DuplicateItem = 'duplicate-item',
}

export interface StudioAction {
  id: StudioActionId
  label: string
  icon: string
  tooltip: string
  handler?: () => void
}
