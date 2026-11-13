import type { DatabaseItem } from '../../../src/types'
import { expect, test, describe } from 'vitest'
import { relationSlug, relationValue, relationLabel, buildRelationOptions, filterRelationOptions } from '../../../src/utils/relation'

function document(item: Partial<DatabaseItem>): DatabaseItem {
  return { id: '', stem: '', extension: 'md', ...item } as DatabaseItem
}

describe('relationSlug', () => {
  test('uses the document file name', () => {
    expect(relationSlug(document({ stem: 'people/zsofi-borsi' }))).toBe('zsofi-borsi')
  })

  test('handles a document at the source root', () => {
    expect(relationSlug(document({ stem: 'paris-france' }))).toBe('paris-france')
  })

  test('returns an empty string when the document has no stem', () => {
    expect(relationSlug(document({}))).toBe('')
  })
})

describe('relationValue', () => {
  test('falls back to the file name when the document has no slug field', () => {
    expect(relationValue(document({ stem: 'people/zsofi-borsi' }))).toBe('zsofi-borsi')
  })

  test('prefers a slug defined by the document itself', () => {
    expect(relationValue(document({ stem: 'meetup-locations/paris', slug: 'paris-france' }))).toBe('paris-france')
  })

  test('reads the requested field', () => {
    const item = document({ stem: 'people/zsofi-borsi', path: '/people/zsofi-borsi' })

    expect(relationValue(item, 'path')).toBe('/people/zsofi-borsi')
    expect(relationValue(item, 'stem')).toBe('people/zsofi-borsi')
  })

  test('stringifies numbers', () => {
    expect(relationValue(document({ order: 3 }), 'order')).toBe('3')
  })

  test('returns an empty string for a missing non-slug field', () => {
    expect(relationValue(document({ stem: 'people/zsofi-borsi' }), 'path')).toBe('')
  })
})

describe('relationLabel', () => {
  test('uses the requested field', () => {
    expect(relationLabel(document({ name: 'Zsófi Borsi' }), 'zsofi-borsi', 'name')).toBe('Zsófi Borsi')
  })

  test('falls back to the usual title fields', () => {
    expect(relationLabel(document({ title: 'Paris, France' }), 'paris-france', 'name')).toBe('Paris, France')
    expect(relationLabel(document({ name: 'Paris, France' }), 'paris-france')).toBe('Paris, France')
  })

  test('falls back to the value so a row is never blank', () => {
    expect(relationLabel(document({ name: '  ' }), 'zsofi-borsi', 'name')).toBe('zsofi-borsi')
  })
})

describe('buildRelationOptions', () => {
  test('maps documents to sorted options', () => {
    const items = [
      document({ stem: 'people/zsofi-borsi', name: 'Zsófi Borsi' }),
      document({ stem: 'people/alice-doe', name: 'Alice Doe' }),
    ]

    expect(buildRelationOptions(items, { collection: 'people', labelField: 'name' })).toStrictEqual([
      { value: 'alice-doe', label: 'Alice Doe' },
      { value: 'zsofi-borsi', label: 'Zsófi Borsi' },
    ])
  })

  test('drops documents with no referenceable value', () => {
    const items = [
      document({ stem: 'people/alice-doe', name: 'Alice Doe' }),
      document({ stem: '', name: 'Nameless' }),
    ]

    expect(buildRelationOptions(items, { collection: 'people', labelField: 'name' })).toStrictEqual([
      { value: 'alice-doe', label: 'Alice Doe' },
    ])
  })

  test('deduplicates values', () => {
    const items = [
      document({ stem: 'people/alice-doe', name: 'Alice Doe' }),
      document({ stem: 'team/alice-doe', name: 'Alice Doe (team)' }),
    ]

    expect(buildRelationOptions(items, { collection: 'people', labelField: 'name' })).toStrictEqual([
      { value: 'alice-doe', label: 'Alice Doe' },
    ])
  })
})

describe('filterRelationOptions', () => {
  const options = [
    { value: 'alice-doe', label: 'Alice Doe' },
    { value: 'zsofi-borsi', label: 'Zsófi Borsi' },
  ]

  test('returns every option when the search is empty', () => {
    expect(filterRelationOptions(options, '  ')).toStrictEqual(options)
  })

  test('matches on the label', () => {
    expect(filterRelationOptions(options, 'alice')).toStrictEqual([options[0]])
  })

  test('matches on the stored value', () => {
    expect(filterRelationOptions(options, 'borsi')).toStrictEqual([options[1]])
  })

  test('returns nothing when no option matches', () => {
    expect(filterRelationOptions(options, 'nobody')).toStrictEqual([])
  })
})
