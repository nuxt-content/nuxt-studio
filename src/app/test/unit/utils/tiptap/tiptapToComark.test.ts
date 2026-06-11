import { describe, expect, test } from 'vitest'
import { tiptapToComark } from '../../../../src/utils/tiptap/tiptapToComark'
import { comarkToTiptap } from '../../../../src/utils/tiptap/comarkToTiptap'
import type { ComarkTree } from 'comark'

describe('tiptapToComark', () => {
  describe('bold + link round-trip', () => {
    // Regression: **text **[link](url)**.** used to produce extra ** markers on
    // each save cycle because the bold mark accumulated on the link text node,
    // causing three separate <strong> siblings instead of one.
    test('bold paragraph containing a link round-trips without star accumulation', async () => {
      const input: ComarkTree = {
        frontmatter: {},
        meta: {},
        nodes: [
          ['p', {}, ['strong', {}, 'that contain it ', ['strong', {}, ['a', { href: '/url' }, 'here']], '.']],
        ],
      }

      const tiptap = comarkToTiptap(input)
      const output = await tiptapToComark(tiptap)

      // The paragraph should contain a single strong element wrapping the text
      // and the link — NOT three separate strong siblings.
      const paragraph = output.nodes[0] as any[]
      expect(paragraph[0]).toBe('p')

      const strong = paragraph[2] as any[]
      expect(strong[0]).toBe('strong')

      // All content is inside one strong: 'that contain it ', a link, '.'
      const strongChildren = strong.slice(2)
      expect(strongChildren).toHaveLength(3)
      expect(strongChildren[0]).toBe('that contain it ')
      expect(Array.isArray(strongChildren[1])).toBe(true)
      expect((strongChildren[1] as any[])[0]).toBe('a')
      expect(strongChildren[2]).toBe('.')
    })

    test('bold text with link renders to markdown without extra stars', async () => {
      const { renderMarkdown } = await import('comark/render')

      const input: ComarkTree = {
        frontmatter: {},
        meta: {},
        nodes: [
          ['p', {}, ['strong', {}, 'that contain it ', ['strong', {}, ['a', { href: '/url' }, 'here']], '.']],
        ],
      }

      const tiptap = comarkToTiptap(input)
      const output = await tiptapToComark(tiptap)
      const md = (await renderMarkdown(output, { blockAttributesStyle: 'frontmatter' })).trim()

      // Should not contain **** (four stars) — a sign of adjacent bold elements
      expect(md).not.toContain('****')
      expect(md).toContain('[here](/url)')
    })
  })
})
