import type { ComponentData } from 'nuxt-component-meta'
import type { JSType } from 'untyped'

export type StudioInputType = 'media' | 'icon' | 'textarea' | 'date' | 'datetime' | 'string' | 'boolean' | 'number' | 'reference'

export interface StudioPropDisplay {
  label?: string
  description?: string
  tooltip?: string
  hidden?: boolean
}

export type StudioPropInput
  /** No input override: keep the heuristic type, optionally constrain to select options */
  = | { input?: undefined, options?: string[] }
    | { input: 'media' | 'textarea' | 'date' | 'datetime' | 'boolean' | 'number' }
  /** Explicit select options, overrides enum extraction */
    | { input: 'string', options?: string[] }
  /** Icon picker, optionally restricted to specific icon libraries */
    | { input: 'icon', iconLibraries?: string[] }
  /**
   * Collection item picker. Stores the item's `field` (defaults to 'path',
   * falls back to 'stem' for data collections) — an array of them with `multiple`.
   */
    | { input: 'reference', collection: string, multiple?: boolean, field?: string }

export type StudioPropMeta = StudioPropDisplay & StudioPropInput

/**
 * Flat view of StudioPropMeta the editor pipeline reads. Annotations arrive
 * as plain JSON from `/__nuxt_studio/meta`, so no variant is guaranteed.
 */
export interface ResolvedStudioPropMeta extends StudioPropDisplay {
  input?: StudioInputType
  iconLibraries?: string[]
  options?: string[]
  collection?: string
  multiple?: boolean
  field?: string
}

export interface StudioSlotMeta {
  label?: string
  description?: string
}

export interface StudioComponentMeta {
  props?: Record<string, StudioPropMeta>
  slots?: Record<string, StudioSlotMeta>
}

export interface ComponentMeta {
  name: string
  path: string
  nuxtUI?: boolean
  meta: {
    props: ComponentData['meta']['props']
    slots: ComponentData['meta']['slots']
    events: ComponentData['meta']['events']
    studio?: StudioComponentMeta
  }
}

export type FormInputsTypes = JSType | 'icon' | 'media' | 'file' | 'date' | 'datetime' | 'textarea' | 'reference'

export type FormTree = Record<string, FormItem>
export type FormItem = {
  id: string
  type: FormInputsTypes
  key?: string
  value?: unknown
  default?: unknown
  options?: string[]
  title: string
  icon?: string
  children?: FormTree
  disabled?: boolean
  hidden?: boolean
  toggleable?: boolean
  custom?: boolean
  arrayItemForm?: FormItem
  label?: string
  description?: string
  tooltip?: string
  collection?: string
  multiple?: boolean
  field?: string
}

export const COMMAND_KEYS = [
  'style',
  'insert',
  'paragraph',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'bold',
  'italic',
  'strike',
  'code',
  'image',
  'video',
  'horizontalRule',
  'table',
] as const

export type CommandKey = typeof COMMAND_KEYS[number]

export interface CommandConfig {
  exclude?: CommandKey[]
}
