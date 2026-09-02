import type { CollectionItemBase, PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'
import type { MarkdownDocument } from 'comark'
import type { BaseItem } from './item'

export interface DatabaseItem extends CollectionItemBase, BaseItem {
  [key: string]: unknown
}

export interface DatabasePageItem extends Omit<PageCollectionItemBase, 'body' | 'excerpt'>, BaseItem {
  path: string
  body: MarkdownDocument
  [key: string]: unknown
}

export interface DatabaseDataItem extends DataCollectionItemBase, BaseItem {
  [key: string]: unknown
}
