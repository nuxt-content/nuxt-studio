import { expect, test, describe } from 'vitest'
import { ui, media, icon, textarea, date, datetime, select, collectionItem, hidden, defineStudioMeta } from '../../src/component-meta'

describe('component-meta helpers', () => {
  test('media returns a media input', () => {
    expect(media()).toEqual({ input: 'media' })
  })

  test('icon returns an icon input, with optional libraries', () => {
    expect(icon()).toEqual({ input: 'icon' })
    expect(icon({ libraries: ['lucide', 'simple-icons'] })).toEqual({ input: 'icon', iconLibraries: ['lucide', 'simple-icons'] })
  })

  test('textarea, date and datetime return their input type', () => {
    expect(textarea()).toEqual({ input: 'textarea' })
    expect(date()).toEqual({ input: 'date' })
    expect(datetime()).toEqual({ input: 'datetime' })
  })

  test('select returns explicit options', () => {
    expect(select({ options: ['primary', 'secondary'] })).toEqual({ options: ['primary', 'secondary'] })
  })

  test('collectionItem returns a reference input', () => {
    expect(collectionItem({ collection: 'authors' })).toEqual({ input: 'reference', collection: 'authors' })
    expect(collectionItem({ collection: 'articles', multiple: true, field: 'path' }))
      .toEqual({ input: 'reference', collection: 'articles', multiple: true, field: 'path' })
  })

  test('hidden returns a hidden prop', () => {
    expect(hidden()).toEqual({ hidden: true })
  })

  test('ui merges display metadata with a type helper', () => {
    expect(ui({ label: 'Image source', description: 'Pick a cool image', type: media() }))
      .toEqual({ label: 'Image source', description: 'Pick a cool image', input: 'media' })
  })

  test('ui works without a type and keeps tooltip/hidden', () => {
    expect(ui({ label: 'Internal', tooltip: 'Not shown', hidden: true }))
      .toEqual({ label: 'Internal', tooltip: 'Not shown', hidden: true })
  })

  test('ui does not emit undefined display keys', () => {
    expect(ui({ type: collectionItem({ collection: 'authors' }) }))
      .toEqual({ input: 'reference', collection: 'authors' })
  })

  test('defineStudioMeta is a no-op', () => {
    expect(defineStudioMeta({ props: { icon: icon() } })).toBeUndefined()
  })
})
