import type { Nuxt } from '@nuxt/schema'
import type { ModuleHooks } from 'nuxt-component-meta'
import type { StudioComponentMeta } from '../../app/src/types/editor'

// nuxt-component-meta declares its hooks in a types file that its `exports` map never resolves to
declare module '@nuxt/schema' {
  interface NuxtHooks {
    'component-meta:extend': ModuleHooks['component-meta:extend']
  }
}

/**
 * Runs before a changed component is parsed again: nuxt-component-meta merges the new
 * `defineStudioMeta()` output under the previous one, so an edited label would otherwise keep its
 * old text (even across restarts, as the meta is cached) and a removed one would stay.
 */
export function dropPreviousStudioMeta(component: { meta?: { studio?: StudioComponentMeta } }, code: string) {
  delete component.meta?.studio

  return { component, code }
}

export function refreshStudioMetaOnChange(nuxt: Pick<Nuxt, 'hook'>) {
  nuxt.hook('component-meta:extend', (parserOptions) => {
    // The hook runs again whenever components change
    const otherTransformers = (parserOptions.transformers ?? []).filter(transformer => transformer !== dropPreviousStudioMeta)

    parserOptions.transformers = [...otherTransformers, dropPreviousStudioMeta]
  })
}
