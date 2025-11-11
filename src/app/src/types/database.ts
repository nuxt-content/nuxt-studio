import type { CollectionItemBase, PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'
import type { BaseItem } from './item'

export interface DatabaseItem extends CollectionItemBase, BaseItem {
  [key: string]: unknown
  fsPath: string
}

export interface DatabasePageItem extends PageCollectionItemBase, BaseItem {
  path: string
  fsPath: string
  [key: string]: unknown
}

export interface DatabaseDataItem extends DataCollectionItemBase, BaseItem {
  fsPath: string
  [key: string]: unknown
}
