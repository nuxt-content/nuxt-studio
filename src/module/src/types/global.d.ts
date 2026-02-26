declare module '#content/preview' {
  import type { CollectionInfo } from './collection'

  export const collections: Record<string, CollectionInfo>
  export const gitInfo: GitInfo
  export const appConfigSchema: Record<string, unknown>
}

declare module 'hub:blob' {
  interface BlobListResult {
    blobs: Array<{ pathname: string, [key: string]: unknown }>
  }

  interface BlobMetadata {
    url?: string
    [key: string]: unknown
  }

  export const blob: {
    list: (options: { prefix?: string }) => Promise<BlobListResult>
    head: (pathname: string) => Promise<BlobMetadata | null>
    put: (pathname: string, data: string | Uint8Array, options?: { contentType?: string }) => Promise<unknown>
    del: (pathname: string) => Promise<unknown>
  }
}

declare module '#build/studio-assets' {
  import type { Storage } from 'unstorage'

  export const publicAssetsStorage: Storage | null
  export const externalAssetsStorage: Storage | null
}

declare module 'nitropack' {
  import type { StudioUser } from 'nuxt-studio/app'
  import type { H3Event } from 'h3'

  interface NitroRuntimeHooks {
    'studio:auth:login': (payload: { user: StudioUser, event: H3Event }) => void
    'studio:auth:logout': (payload: { user: StudioUser, event: H3Event }) => void
  }
}
