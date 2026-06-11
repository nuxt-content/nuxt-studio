import { describe, expect, test } from 'vitest'
import { tiptapToComark } from '../../../../src/utils/tiptap/tiptapToComark'
import { comarkToTiptap } from '../../../../src/utils/tiptap/comarkToTiptap'
import type { ComarkTree, ComarkElement } from 'comark'

describe('tiptapToComark', () => {
  describe('bold + link round-trip', () => {
    // Regression: **text **[link](url)**.** used to produce extra ** markers on
    // each save cycle because the bold mark accumulated on the link text node,
    // causing three separate <strong> siblings instead of one.
    const input: ComarkTree = {
      frontmatter: {},
      meta: {},
      nodes: [
        ['p', {}, ['strong', {}, 'that contain it ', ['strong', {}, ['a', { href: '/url' }, 'here']], '.']],
      ],
    }

    test('bold paragraph containing a link round-trips without star accumulation', async () => {
      const tiptap = comarkToTiptap(input)
      const output = await tiptapToComark(tiptap)

      // All content merges into a single strong — NOT three separate strong siblings
      // (which would render as ****).
      const paragraph = output.nodes[0] as ComarkElement
      expect(paragraph[0]).toBe('p')

      const strong = paragraph[2] as ComarkElement
      expect(strong[0]).toBe('strong')

      // Single strong: 'that contain it', ' ', a link, '.'
      const strongChildren = strong.slice(2)
      expect(strongChildren).toHaveLength(4)
      expect(strongChildren[0]).toBe('that contain it')
      expect(strongChildren[1]).toBe(' ')
      expect(Array.isArray(strongChildren[2])).toBe(true)
      expect((strongChildren[2] as ComarkElement)[0]).toBe('a')
      expect(strongChildren[3]).toBe('.')
    })

    test('bold text with link renders to markdown without extra stars', async () => {
      const { renderMarkdown } = await import('comark/render')

      const tiptap = comarkToTiptap(input)
      const output = await tiptapToComark(tiptap)
      const md = (await renderMarkdown(output, { blockAttributesStyle: 'frontmatter' })).trim()

      expect(md).toBe('**that contain it [here](/url).**')
    })
  })
})
