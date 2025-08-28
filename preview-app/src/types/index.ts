import type { CollectionItemBase, PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'

// export interface DBFile extends CollectionItemBase {
//   [key: string]: any
// }

// export interface ContentDraft {
//   id: string
//   parsed: MDCRoot
//   markdown?: string
//   gitFile?: GithubFile
//   dbFile?: DBFile | null
//   deleted?: boolean
// }

// export interface ReviewFile extends ContentDraft {
//   path: string
//   markdown: string
//   original: string
// }

export interface DatabaseItem extends CollectionItemBase {
  [key: string]: unknown
}

export interface DatabasePageItem extends PageCollectionItemBase {
  [key: string]: unknown
}

export interface DatabaseDataItem extends DataCollectionItemBase {
  [key: string]: unknown
}

export interface GithubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content?: string
  encoding?: string
  _links: {
    self: string
    git: string
    html: string
  }
}

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

// export interface ConfigItem { ... }
