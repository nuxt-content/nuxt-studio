import type { ResolvedStudioPropMeta, StudioComponentMeta, StudioPropDisplay, StudioPropMeta } from './types/editor'

export type { StudioComponentMeta, StudioPropMeta, StudioPropDisplay, StudioPropInput, StudioSlotMeta, StudioInputType } from './types/editor'

export interface UiOptions extends StudioPropDisplay {
  type?: StudioPropMeta
}

/**
 * Combine display metadata with a type helper:
 * `ui({ label: 'Image source', type: media() })`
 */
export function ui(options: UiOptions): StudioPropMeta {
  const { type, ...display } = options
  const meta = { ...type } as ResolvedStudioPropMeta
  for (const key of ['label', 'description', 'tooltip', 'hidden'] as const) {
    if (display[key] !== undefined) {
      meta[key] = display[key] as never
    }
  }
  return meta as StudioPropMeta
}

export function media(): StudioPropMeta {
  return { input: 'media' }
}

export function icon(options?: { libraries?: string[] }): StudioPropMeta {
  return options?.libraries ? { input: 'icon', iconLibraries: options.libraries } : { input: 'icon' }
}

export function textarea(): StudioPropMeta {
  return { input: 'textarea' }
}

export function date(): StudioPropMeta {
  return { input: 'date' }
}

export function datetime(): StudioPropMeta {
  return { input: 'datetime' }
}

export function select(options: { options: string[] }): StudioPropMeta {
  return { options: options.options }
}

export function collectionItem(options: { collection: string, multiple?: boolean, field?: string }): StudioPropMeta {
  const meta: StudioPropMeta = { input: 'reference', collection: options.collection }
  if (options.multiple !== undefined) {
    meta.multiple = options.multiple
  }
  if (options.field !== undefined) {
    meta.field = options.field
  }
  return meta
}

export function hidden(): StudioPropMeta {
  return { hidden: true }
}

/**
 * Typed variant of the global `defineStudioMeta` compiler macro, for
 * explicit-import style. The call is extracted at build time by
 * nuxt-component-meta and stripped from browser bundles.
 */
export function defineStudioMeta(_meta: StudioComponentMeta): void {}
