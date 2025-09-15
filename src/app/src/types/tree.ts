import type { DraftStatus } from '../types/draft'

export interface TreeItem {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  status?: DraftStatus
  fileType?: 'page' | 'data'
  routePath?: string
  children?: TreeItem[]
}
