import { eventHandler, useSession } from 'h3'
import { useRuntimeConfig, createError } from '#imports'
// @ts-expect-error import does exist
import components from '#nuxt-component-meta/nitro'
import type { ComponentMeta as VueComponentMeta } from 'vue-component-meta'
// @ts-expect-error import does exist
import { highlight } from '#mdc-imports'
import type { ComponentMeta } from 'nuxt-studio/app'
import { filterComponents } from '../utils/meta'

export interface NuxtComponentMeta {
  pascalName: string
  filePath: string
  meta: VueComponentMeta
  global: boolean
}

export default eventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!import.meta.dev) {
    const session = await useSession(event, {
      name: 'studio-session',
      password: config.studio?.auth?.sessionSecret,
    })

    if (!session?.data?.user) {
      throw createError({
        statusCode: 404,
        message: 'Not found',
      })
    }
  }

  const mappedComponents: ComponentMeta[] = (Object.values(components) as NuxtComponentMeta[])
    .map(({ pascalName, filePath, meta }) => {
      return {
        name: pascalName,
        path: filePath,
        meta: {
          props: meta.props,
          slots: meta.slots,
          events: meta.events,
        },
      }
    })

  const filteredComponents = filterComponents(
    mappedComponents,
    config.studio?.meta?.components,
  )

  return {
    markdownConfig: config.studio.markdown || {},
    highlightTheme: highlight?.theme || { default: 'github-light', dark: 'github-dark', light: 'github-light' },
    components: filteredComponents,
  }
})
