import type { BaseItem } from './item'

export interface MediaConfig {
  external: boolean
  publicUrl?: string
}

export interface MediaItem extends BaseItem {
  [key: string]: unknown
}
