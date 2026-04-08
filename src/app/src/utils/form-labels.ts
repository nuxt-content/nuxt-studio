import type { FormItem } from '../types'
import { titleCase } from 'scule'

/**
 * Resolves the visible label for a form field: optional `fieldName` from the schema, otherwise a title-cased field title.
 *
 * Kept in a module separate from `form.ts` so form input components can import it without creating a circular dependency with `typeComponentMap`.
 *
 * @param formItem - Form field metadata from the generated form tree
 * @returns Human-readable label for inputs and section headers
 */
export function formItemInputLabel(formItem: FormItem): string {
  const custom = formItem.fieldName?.trim()
  if (custom) {
    return custom
  }

  return titleCase(formItem.title)
}
