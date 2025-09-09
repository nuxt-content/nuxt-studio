import type { CollectionItemBase, PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'

export interface DatabaseItem extends CollectionItemBase {
  [key: string]: unknown
}

export interface DatabasePageItem extends PageCollectionItemBase {
  [key: string]: unknown
}

export interface DatabaseDataItem extends DataCollectionItemBase {
  [key: string]: unknown
}
