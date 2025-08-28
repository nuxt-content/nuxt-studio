import { ref, onBeforeMount } from 'vue'
import { ensure } from '../utils/ensure'
import type { DatabaseItem } from '../types'
import type { ContentDatabaseAdapter, ContentProvide } from '../types/content'
import type { DatabaseAdapter } from '@nuxt/content'
import { createCollectionDocument, generateRecordDeletion, generateRecordInsert, generateRecordUpsert, getCollectionInfo } from '../utils/collections'
import { kebabCase } from 'lodash'

const hostStyles = {
  'body[mdc-editor-mr440]': {
    animation: 'mr440 0.3s ease',
    animationFillMode: 'forwards',
  },
  'body[mdc-editor-mr0]': {
    animation: 'mr0 0.3s ease',
    animationFillMode: 'forwards',
  },
  'css': `
    @keyframes mr440 {
    0% {
        margin-right: 0;
    }
    100% {
        margin-right: 440px;
    }
    }
    @keyframes mr0 {
    0% {
        margin-right: 440px;
    }
    100% {
        margin-right: 0;
    }
    }
  `,
}

export function useHost() {
  const isMounted = ref(false)
  onBeforeMount(async () => {
    host.ui.updateStyles()
    // Trigger dummy query to make sure content database is loaded on the client
    await useContentCollectionQuery('content').first().catch((e) => {
      console.error(e)
    })
    ensure(() => useNuxtApp().$contentLocalDatabase !== undefined).then(() => {
      isMounted.value = true
    })
  })

  function useNuxtApp() {
    return window.useNuxtApp!()
  }

  function useContentDatabaseAdapter(collection: string): DatabaseAdapter {
    return (useNuxtApp().$contentLocalDatabase as ContentDatabaseAdapter)(collection)
  }

  function useContent() {
    return window.useNuxtApp!().$content as ContentProvide
  }

  function useContentCollections() {
    return useContent().collections
  }

  function useContentCollectionQuery(collection: string) {
    return useContent().queryCollection(collection)
  }

  const host = {
    on: {
      routeChange: (fn: () => void) => {
        const router = useNuxtApp().$router;
        (router as any)?.afterEach?.(() => {
          fn()
        })
      },
      mounted: (fn: () => void) => ensure(() => isMounted.value).then(fn),
      beforeUnload: (fn: (event: BeforeUnloadEvent) => void) => {
        ensure(() => isMounted.value).then(() => {
          window.addEventListener('beforeunload', fn)
        })
      },
    },
    ui: {
      pushBodyToLeft: () => {
        // rename to data-...
        document.body.removeAttribute('mdc-editor-mr0')
        document.body.setAttribute('mdc-editor-mr440', 'true')
        host.ui.updateStyles()
      },
      pullBodyToRight: () => {
        document.body.setAttribute('mdc-editor-mr0', 'true')
        document.body.removeAttribute('mdc-editor-mr440')
        host.ui.updateStyles()
      },
      updateStyles: () => {
        const styles: string = Object.keys(hostStyles).map((selector) => {
          if (selector === 'css') return hostStyles.css
          const styleText = Object.entries(hostStyles[selector as keyof typeof hostStyles]).map(([key, value]) => `${kebabCase(key)}: ${value}`).join(';')
          return `${selector} { ${styleText} }`
        }).join('')
        let styleElement = document.querySelector('[mdc-editor-styles]')
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.setAttribute('mdc-editor-styles', '')
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = styles
      },
    },
    // New API
    user: {
      get: () => {},
    },

    document: {
      get: async (id: string): Promise<DatabaseItem> => {
        return useContentCollectionQuery(id.split('/')[0]).where('id', '=', id).first() as unknown as Promise<DatabaseItem>
      },
      getFileSystemPath: (id: string) => {
        return getCollectionInfo(id, useContentCollections()).path
      },
      list: async (): Promise<DatabaseItem[]> => {
        const collections = Object.keys(useContentCollections()).filter(c => c !== 'info')
        const contents = await Promise.all(collections.map(async (collection) => {
          return await useContentCollectionQuery(collection).all() as DatabaseItem[]
        }))
        return contents.flat()
      },
      upsert: async (id: string, upsertedDocument: DatabaseItem) => {
        id = id.replace(/:/g, '/')

        const collection = getCollectionInfo(id, useContentCollections()).collection
        const doc = createCollectionDocument(collection, id, upsertedDocument)

        await useContentDatabaseAdapter(collection.name).exec(generateRecordDeletion(collection, id))
        await useContentDatabaseAdapter(collection.name).exec(generateRecordInsert(collection, doc))
      },
      delete: async (id: string) => {
        id = id.replace(/:/g, '/')

        const collection = getCollectionInfo(id, useContentCollections()).collection
        await useContentDatabaseAdapter(collection.name).exec(generateRecordDeletion(collection, id))
      },
      detectActives: () => {
        // TODO: introduce a new convention to detect data contents [data-content-id!]
        const wrappers = document.querySelectorAll('[data-content-id]')
        return Array.from(wrappers).map((wrapper) => {
          const id = wrapper.getAttribute('data-content-id')!
          return {
            id,
            title: id.split(/[/:]/).pop()!, // TODO: get title from content if possible
          }
        })
      },
    },

    requestRerender: () => {
      useNuxtApp().hooks.callHookParallel('app:data:refresh')
    },
  }

  return host
}
