import type { ComponentData } from 'nuxt-component-meta'
import type { JSType } from 'untyped'

export interface ComponentMeta {
  name: string
  path: string
  nuxtUI?: boolean
  meta: {
    props: ComponentData['meta']['props']
    slots: ComponentData['meta']['slots']
    events: ComponentData['meta']['events']
  }
}

export type FormInputsTypes = JSType | 'icon' | 'media' | 'file' | 'date' | 'datetime' | 'textarea' | 'relation'

/**
 * Describes a reference from a string field to a document of another collection.
 * The field keeps storing a plain string, so files stay valid for any consumer.
 */
export interface RelationOptions {
  /**
   * Name of the referenced collection, as declared in `content.config.ts`.
   */
  collection: string
  /**
   * Field of the referenced document written to the file.
   * `slug` (default) uses the document file name, `path` its route and `stem`
   * its source relative path. Any other value is read from the document itself.
   * @default 'slug'
   */
  valueField?: 'slug' | 'path' | 'stem' | (string & {})
  /**
   * Field of the referenced document displayed in the picker.
   * Defaults to `name`, then `title`, then the stored value.
   */
  labelField?: string
}

export type FormTree = Record<string, FormItem>
export type FormItem = {
  id: string
  type: FormInputsTypes
  key?: string
  value?: unknown
  default?: unknown
  options?: string[]
  relation?: RelationOptions
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
