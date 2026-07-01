import { expect, test, describe } from 'vitest'
import { getSlotDisplay } from '../../../../src/utils/tiptap/slots'
import type { ComponentMeta } from '../../../../src/types/editor'

describe('getSlotDisplay', () => {
  const componentMeta: ComponentMeta = {
    name: 'AuthorCard',
    path: '/path/to/AuthorCard.vue',
    meta: {
      props: [],
      slots: [],
      events: [],
      studio: {
        slots: {
          title: { label: 'Heading' },
          description: { label: 'Short description', description: 'Displayed under the title' },
        },
      },
    },
  }

  test('returns the studio label and description when annotated', () => {
    expect(getSlotDisplay(componentMeta, 'title')).toEqual({ label: 'Heading' })
    expect(getSlotDisplay(componentMeta, 'description')).toEqual({
      label: 'Short description',
      description: 'Displayed under the title',
    })
  })

  test('falls back to the slot name when not annotated', () => {
    expect(getSlotDisplay(componentMeta, 'footer')).toEqual({ label: 'footer' })
    expect(getSlotDisplay(undefined, 'default')).toEqual({ label: 'default' })
  })
})
