declare module '#content/preview' {
  import type { CollectionInfo } from './collection'

  export const collections: Record<string, CollectionInfo>
  export const gitInfo: GitInfo
  export const appConfigSchema: Record<string, unknown>
}

declare module '#build/studio-public-assets' {
  import type { Storage } from 'unstorage'

  export const publicAssetsStorage: Storage
}

declare module 'nitropack' {
  import type { StudioUser } from 'nuxt-studio/app'
  import type { H3Event } from 'h3'

  interface NitroRuntimeHooks {
    'studio:auth:login': (payload: { user: StudioUser, event: H3Event }) => void
    'studio:auth:logout': (payload: { user: StudioUser, event: H3Event }) => void
  }
}
