import type { BaseItem } from './item'

export interface MediaItem extends BaseItem {
  [key: string]: unknown
}

export const VirtualMediaCollectionName = 'public-assets' as const
