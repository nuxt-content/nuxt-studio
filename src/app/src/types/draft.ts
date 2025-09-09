import type { GithubFile } from './github'
import type { DatabaseItem } from './database'

export interface DraftFileItem {
  id: string // nuxt/content id
  path: string // file path in content directory
  originalDatabaseItem?: DatabaseItem // original collection document saved in db
  originalGithubFile?: GithubFile // file fetched on gh
  content?: string // Drafted raw markdown content
  document?: DatabaseItem // Drafted parsed AST (body, frontmatter...)
  status: 'deleted' | 'created' | 'updated' // Draft status
}

export interface DraftFileItem {
  id: string // nuxt/content id
  path: string // file path in public directory
  oldPath?: string // Old path in public directory (used for revert a renamed file)
  content?: string // Base64 value
  url?: string // Public gh url

  // Image metas
  width?: number
  height?: number
  size?: number
  mimeType?: string

  status: 'deleted' | 'created' | 'updated' // Draft status
}
