import type { CollectionItemBase, PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'
import type { ComarkTree } from 'comark/ast'
import type { BaseItem } from './item'

export interface DatabaseItem extends CollectionItemBase, BaseItem {
  [key: string]: unknown
}

export interface DatabasePageItem extends Omit<PageCollectionItemBase, 'body' | 'excerpt'>, BaseItem {
  path: string
  body: ComarkTree
  [key: string]: unknown
}

export interface DatabaseDataItem extends DataCollectionItemBase, BaseItem {
  [key: string]: unknown
}
