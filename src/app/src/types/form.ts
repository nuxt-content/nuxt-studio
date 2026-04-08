import type { JSType } from 'untyped'

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
  // If type is combined with boolean
  toggleable?: boolean
  // Not in schema, created manually by user
  custom?: boolean
  // Items for array type
  arrayItemForm?: FormItem
  /** Overrides the default label (derived from the field key) when set in the collection schema `.editor({ fieldName })`. */
  fieldName?: string
  /** Shown as helper text for the field when set in `.editor({ fieldDescription })`. */
  fieldDescription?: string
  /** Shown as an info tooltip next to the label when set in `.editor({ tooltip })`. */
  tooltip?: string
}
