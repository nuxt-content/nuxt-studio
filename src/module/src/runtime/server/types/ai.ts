/**
 * AI-related types for server-side operations
 */

/**
 * Content type classification for collections
 */
export enum ContentType {
  GeneralContent = 'general content',
  Blog = 'blog',
  Documentation = 'documentation',
  MarketingPages = 'marketing pages',
}

/**
 * Content sample used for AI analysis
 */
export interface ContentSample {
  title: string
  description?: string
  excerpt: string
}

/**
 * Collection architecture metadata
 */
export interface CollectionArchitecture {
  fileTree: string
  usesNestedFolders: boolean
  depth: number
  structure: string
}

/**
 * Collection metadata
 */
export interface CollectionMetadata {
  name: string
  type: string
  source: string
  totalDocuments: number
  contentType: ContentType
  architecture: CollectionArchitecture
}
