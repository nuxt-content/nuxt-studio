import { test, describe, expect } from 'vitest'
import { contentFromDocument } from '../../../module/dist/runtime/utils/document'
import { createMockDocument } from '../mocks/document'

// @nuxtjs/mdc stores a component's YAML-block array/object prop as a colon-bound,
// JSON-stringified attr: { ":bar": "[\"baz\"]" }. Rendering that deployed body back
// to Markdown must reproduce the original YAML block, not a permanent conflict.
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

  test('object prop', async () => {
    const deployedBody = {
      nodes: [
        ['foo', { ':bar': '{"baz":"qux","quux":"corge"}' }],
      ],
      frontmatter: {},
      meta: {},
    }

    const document = createMockDocument('docs/index.md', { body: deployedBody })

    const expected = [
      '::foo',
      '---',
      'bar:',
      '  baz: qux',
      '  quux: corge',
      '---',
      '::',
      '',
    ].join('\n')

    expect(await contentFromDocument(document)).toBe(expected)
  })

  test('nested component with an array prop', async () => {
    // unbindComarkTree must recurse into children, not just top-level nodes.
    const deployedBody = {
      nodes: [
        ['outer', {}, ['inner', { ':bar': '["baz"]' }]],
      ],
      frontmatter: {},
      meta: {},
    }

    const document = createMockDocument('docs/index.md', { body: deployedBody })

    const expected = [
      '::outer',
      '  :::inner',
      '  ---',
      '  bar:',
      '    - baz',
      '  ---',
      '  :::',
      '::',
      '',
    ].join('\n')

    expect(await contentFromDocument(document)).toBe(expected)
  })

  test('scalar ":" binding stays an inline binding (not unwrapped to a block)', async () => {
    // Scalar ':' bindings are genuine comark inline bindings, not mdc artifacts —
    // stripping the colon would drop the binding.
    const deployedBody = {
      nodes: [
        ['foo', { ':width': '200', 'color': 'secondary' }],
      ],
      frontmatter: {},
      meta: {},
    }

    const document = createMockDocument('docs/index.md', { body: deployedBody })

    const expected = '::foo{:width="200" color="secondary"}\n::\n'

    expect(await contentFromDocument(document)).toBe(expected)
  })
})
