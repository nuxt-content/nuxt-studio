import { test, describe, expect } from 'vitest'
import { contentFromDocument } from '../../../module/dist/runtime/utils/document'
import { createMockDocument } from '../mocks/document'

// When @nuxt/content (@nuxtjs/mdc) parses a component with array props declared as
// YAML frontmatter, e.g.
//
//   ::foo
//   ---
//   bar:
//     - baz
//   ---
//   ::
//
// it stores the array as a colon-bound, JSON-stringified prop: { ":bar": "[\"baz\"]" }.
// Studio renders that deployed body back to Markdown for the "Website" side of its
// conflict diff (contentFromDocument). It must reproduce the original source, but it
// does not round-trip the array prop, producing a permanent conflict against the repo.
describe('component array props are not round-tripped from the deployed body shape', () => {
  test('array of primitives', async () => {
    const deployedBody = {
      nodes: [
        ['foo', { ':bar': '["baz"]' }],
      ],
      frontmatter: {},
      meta: {},
    }

    const document = createMockDocument('docs/index.md', { body: deployedBody })

    const expected = [
      '::foo',
      '---',
      'bar:',
      '  - baz',
      '---',
      '::',
      '',
    ].join('\n')

    expect(await contentFromDocument(document)).toBe(expected)
  })

  test('array of objects (complex)', async () => {
    const deployedBody = {
      nodes: [
        ['foo', { ':bar': '[{"baz":"qux","quux":"corge"},{"baz":"grault"}]' }],
      ],
      frontmatter: {},
      meta: {},
    }

    const document = createMockDocument('docs/index.md', { body: deployedBody })

    const expected = [
      '::foo',
      '---',
      'bar:',
      '  - baz: qux',
      '    quux: corge',
      '  - baz: grault',
      '---',
      '::',
      '',
    ].join('\n')

    expect(await contentFromDocument(document)).toBe(expected)
  })
})
