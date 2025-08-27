import { ref, onBeforeMount } from 'vue'
import { ensure } from '../utils/ensure'
import type { DatabaseItem } from '../types'
import type { ContentDatabaseAdapter, ContentProvide } from '../types/content'

import type { NuxtApp } from 'nuxt/app'
import { getCollectionInfo } from '../utils/collections'
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
    await host.content?.queryCollection('content').first().catch((e) => {
      console.error(e)
    })
    ensure(() => host.databaseAdapter !== undefined).then(() => {
      isMounted.value = true
    })
  })

  function detectRenderedContents(): { id: string, title: string }[] {
    const wrappers = document.querySelectorAll('[data-content-id]')
    return Array.from(wrappers).map((wrapper) => {
      const id = wrapper.getAttribute('data-content-id')!
      return {
        id,
        title: id.split(/[/:]/).pop()!, // TODO: get title from content if possible
      }
    })
  }

  const host = {
    get content() {
      const $content = window.useNuxtApp!().$content as ContentProvide
      return {
        ...$content,
        getDocumentById(id: string): Promise<DatabaseItem> {
          id = id.replace(/:/g, '/')
          return $content.queryCollection(id.split('/')[0]).where('id', '=', id).first() as unknown as Promise<DatabaseItem>
        },
        getDocumentPathById(id: string) {
          return getCollectionInfo(id, $content.collections).path
        },
      }
    },
    get databaseAdapter() {
      return window.useNuxtApp!().$contentLocalDatabase as ContentDatabaseAdapter
    },
    get nuxtApp(): NuxtApp {
      return window.useNuxtApp!()
    },
    onBeforeUnload: (fn: (event: BeforeUnloadEvent) => void) => {
      ensure(() => isMounted.value).then(() => {
        window.addEventListener('beforeunload', fn)
      })
    },
    onMounted: (fn: () => void) => ensure(() => isMounted.value).then(fn),
    detectRenderedContents,
    ui: {
      pushBodyToLeft: () => {
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
  }

  return host
}
