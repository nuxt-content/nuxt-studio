import type { DraftStatus } from '../utils/draft'

export interface TreeItem {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  status?: DraftStatus
  fileType?: 'page' | 'data'
  pagePath?: string
  children?: TreeItem[]

  // Corresponding file route in url
  // pathRoute?: string
}
