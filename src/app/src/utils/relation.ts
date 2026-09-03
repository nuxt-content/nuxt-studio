import type { DatabaseItem, RelationOptions } from '../types'

export interface RelationOption {
  /** Value written to the file. */
  value: string
  /** Human readable label displayed in the picker. */
  label: string
}

// Fields used as a label when the relation does not name one
const DEFAULT_LABEL_FIELDS = ['name', 'title']

/**
 * File name of a document, without its extension.
 *
 * Nuxt Content sources identify a document inside its collection by its file
 * name, which is the slug cross-collection references are written with.
 */
export function relationSlug(item: DatabaseItem): string {
  return String(item.stem || '').split('/').pop() || ''
}

/**
 * Value of the field a relation references on a document.
 *
 * `slug` is not a Nuxt Content field, so it falls back to the document file
 * name when the document does not define one itself.
 */
export function relationValue(item: DatabaseItem, valueField: string = 'slug'): string {
  const value = item[valueField]

  if (typeof value === 'string' && value) {
    return value
  }
  if (typeof value === 'number') {
    return String(value)
  }

  return valueField === 'slug' ? relationSlug(item) : ''
}

/**
 * Label of a document in the picker: the field the relation names, then the
 * usual title fields, then the value itself so a row is never blank.
 */
export function relationLabel(item: DatabaseItem, value: string, labelField?: string): string {
  const fields = labelField ? [labelField, ...DEFAULT_LABEL_FIELDS] : DEFAULT_LABEL_FIELDS

  for (const field of fields) {
    const label = item[field]
    if (typeof label === 'string' && label.trim()) {
      return label
    }
  }

  return value
}

/**
 * Turns the documents of a referenced collection into picker options, dropping
 * the ones with no referenceable value and sorting them by label.
 */
export function buildRelationOptions(items: DatabaseItem[], relation: RelationOptions): RelationOption[] {
  const options: RelationOption[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const value = relationValue(item, relation.valueField)
    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    options.push({ value, label: relationLabel(item, value, relation.labelField) })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Filters picker options on both the label and the stored value, so editors can
 * search by display name or by the slug they already know.
 */
export function filterRelationOptions(options: RelationOption[], search: string): RelationOption[] {
  const query = search.trim().toLowerCase()
  if (!query) {
    return options
  }

  return options.filter(option =>
    option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
  )
}
