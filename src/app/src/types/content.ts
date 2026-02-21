import type { CollectionType } from '@nuxt/content'

export interface MarkdownParsingOptions {
  compress?: boolean
  collectionType?: CollectionType
  preserveLinkAttributes?: boolean
}

export interface SyntaxHighlightTheme {
  default: string
  dark?: string
  light?: string
}
