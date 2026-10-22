import type { EditorOptions } from '@nuxt/content'
import type { ComponentData } from 'nuxt-component-meta'
import type { JSType } from 'untyped'

export interface StudioPropMeta<Value = unknown> extends EditorOptions {
  fields?: StudioFieldsMeta<Value>
}

export type StudioFieldsMeta<Value = unknown> = unknown extends Value
  ? Record<string, StudioPropMeta>
  : Value extends readonly (infer Item)[]
    ? StudioFieldsMeta<Item>
    : Value extends object
      ? { [Key in keyof Value]?: StudioPropMeta<NonNullable<Value[Key]>> }
      : never

export interface StudioSlotMeta {
  label?: string
  description?: string
}

export interface StudioComponentMeta<Props = unknown> {
  props?: StudioFieldsMeta<Props>
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

export type FormInputsTypes = JSType | 'icon' | 'media' | 'file' | 'date' | 'datetime' | 'textarea'

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
  required?: boolean
  toggleable?: boolean
  custom?: boolean
  arrayItemForm?: FormItem
  label?: string
  description?: string
  tooltip?: string
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

export interface SuggestionConfig {
  /**
   * Maximum number of items shown in the TipTap slash menu without a search query.
   * @default 200
   */
  limit?: number
}
