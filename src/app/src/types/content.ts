import type { DraftStatus } from '..'

export enum ContentFileExtension {
  Markdown = 'md',
  YAML = 'yaml',
  YML = 'yml',
  JSON = 'json',
}

export interface RawFile {
  path: string
  content: string | null
  status: DraftStatus
  encoding?: 'utf-8' | 'base64'
}
