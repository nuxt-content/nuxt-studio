import { test, describe, expect } from 'vitest'
import { contentFromDocument, documentFromContent } from '../../../module/dist/runtime/utils/document'
import type { JSONContent } from '@tiptap/core'
import type { DatabasePageItem } from '../../src/types'
import { createMockDocument } from '../mocks/document'
import { comarkToTiptap } from '../../src/utils/tiptap/comarkToTiptap'
import { tiptapToComark } from '../../src/utils/tiptap/tiptapToComark'

describe('paragraph', () => {
  test('simple paragraph', async () => {
    const inputContent = 'This is a simple paragraph'

    const expectedComarkNodes = [
      ['p', {}, 'This is a simple paragraph'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a simple paragraph' },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('horizontal rule', async () => {
    const inputContent = '---'

    const expectedComarkNodes = [
      ['hr', {}],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'horizontalRule',
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('external link', async () => {
    const inputContent = '[Link](https://example.com)'

    const expectedComarkNodes = [
      ['p', {}, ['a', { href: 'https://example.com' }, 'Link']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          attrs: {},
          content: [
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://example.com',
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                  },
                },
              ],
              text: 'Link',
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('relative link', async () => {
    const inputContent = '[Link](/test)'

    const expectedComarkNodes = [
      ['p', {}, ['a', { href: '/test' }, 'Link']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          attrs: {},
          content: [
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: '/test',
                  },
                },
              ],
              text: 'Link',
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('external link with target="_blank" removes target', async () => {
    const inputContent = '[link](https://external.com){target="_blank"}'

    const expectedComarkNodes = [
      ['p', {}, ['a', { href: 'https://external.com', target: '_blank' }, 'link']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          attrs: {},
          content: [
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://external.com',
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                  },
                },
              ],
              text: 'link',
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Expected output should NOT have target="_blank" for external links
    expect(outputContent).toBe('[link](https://external.com)\n')
  })

  test('relative link with target="_blank" keeps target', async () => {
    const inputContent = '[link](/relative){target="_blank"}'

    const expectedComarkNodes = [
      ['p', {}, ['a', { href: '/relative', target: '_blank' }, 'link']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          attrs: {},
          content: [
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: '/relative',
                    target: '_blank',
                  },
                },
              ],
              text: 'link',
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Expected output SHOULD keep target="_blank" for relative links
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('inline component', async () => {
    const inputContent = 'This is a :badge component'

    const expectedComarkNodes = [
      ['p', {}, 'This is a ', ['badge', {}], ' component'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'This is a ',
            },
            {
              type: 'inline-element',
              attrs: {
                tag: 'badge',
              },
            },
            {
              type: 'text',
              text: ' component',
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('inline component with slot content', async () => {
    const inputContent = 'This a :badge[New] component with slots'

    const expectedComarkNodes = [
      ['p', {}, 'This a ', ['badge', {}, 'New'], ' component with slots'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'This a ',
            },
            {
              type: 'inline-element',
              attrs: {
                tag: 'badge',
              },
              content: [
                {
                  type: 'text',
                  text: 'New',
                },
              ],
            },
            {
              type: 'text',
              text: ' component with slots',
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })
})

describe('frontmatter', () => {
  test('simple frontmatter with title and description', async () => {
    const inputContent = `---
title: Test Page
description: This is a test
---

This is content`

    const expectedFrontmatterJson = {
      title: 'Test Page',
      description: 'This is a test',
    }

    const expectedComarkNodes = [
      ['p', {}, 'This is content'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: expectedFrontmatterJson,
          },
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is content' },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    expect(document.title).toBe('Test Page')
    expect(document.description).toBe('This is a test')

    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)
    expect(rtComarkTree.frontmatter).toMatchObject(expectedFrontmatterJson)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })
})

describe('elements', () => {
  test('block element with named default slot', async () => {
    const inputContent = `::block-element
#default
Hello
::`

    const expectedComarkNodes = [
      ['block-element', {}, 'Hello'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'element',
          attrs: {
            tag: 'block-element',
            props: {
              __tiptapWrap: true, // This is added by mdcToTiptap to wrap the content in a paragraph
            },
          },
          content: [
            {
              type: 'slot',
              attrs: {
                name: 'default',
                props: {
                  'v-slot:default': '',
                },
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {},
                  content: [
                    {
                      type: 'text',
                      text: 'Hello',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Remove #default slot and move children at root
    const expectedOutputContent = `::block-element
Hello
::`

    expect(outputContent).toBe(`${expectedOutputContent}\n`)
  })

  test('block element with unnamed default slot', async () => {
    const inputContent = `::block-element
Hello
::`

    const expectedComarkNodes = [
      ['block-element', {}, 'Hello'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'element',
          attrs: {
            tag: 'block-element',
            props: {
              __tiptapWrap: true, // This is added by mdcToTiptap to wrap the content in a paragraph
            },
          },
          content: [
            {
              type: 'slot',
              attrs: {
                name: 'default',
                props: {
                  'v-slot:default': '',
                },
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {},
                  content: [
                    {
                      type: 'text',
                      text: 'Hello',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('block element with named custom slot', async () => {
    const inputContent = `::block-element
#custom
Hello
::`

    const expectedComarkNodes = [
      ['block-element', {}, ['template', { 'v-slot:custom': '' }, 'Hello']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'element',
          attrs: {
            tag: 'block-element',
          },
          content: [
            {
              type: 'slot',
              attrs: {
                name: 'custom',
                props: {
                  'v-slot:custom': '',
                },
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Hello',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('block element nested in other block element', async () => {
    const inputContent = `::first-level-element
  :::second-level-element
  Hello
  :::
::`

    const expectedComarkNodes = [
      ['first-level-element', {}, ['second-level-element', {}, 'Hello']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'element',
          attrs: {
            tag: 'first-level-element',
          },
          content: [
            {
              type: 'slot',
              attrs: {
                name: 'default',
                props: {
                  'v-slot:default': '',
                },
              },
              content: [
                {
                  type: 'element',
                  attrs: {
                    tag: 'second-level-element',
                  },
                  content: [
                    {
                      type: 'slot',
                      attrs: {
                        name: 'default',
                        props: {
                          'v-slot:default': '',
                        },
                      },
                      content: [
                        {
                          type: 'paragraph',
                          content: [
                            { type: 'text', text: 'Hello' },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('block element with boolean props', async () => {
    const inputContent = `::u-button{block :square='false'}
My button
::`

    const expectedComarkNodes = [
      ['u-button', { ':block': 'true', ':square': 'false' }, 'My button'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'element',
          attrs: {
            tag: 'u-button',
            props: {
              ':block': 'true',
              ':square': 'false',
              '__tiptapWrap': true,
            },
          },
          content: [
            {
              type: 'slot',
              attrs: {
                name: 'default',
                props: {
                  'v-slot:default': '',
                },
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {},
                  content: [
                    {
                      type: 'text',
                      text: 'My button',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('block element with number and string props', async () => {
    const inputContent = `::u-button{:width='200' color="secondary"}
My button
::`

    const expectedComarkNodes = [
      ['u-button', { ':width': '200', 'color': 'secondary' }, 'My button'],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'element',
          attrs: {
            tag: 'u-button',
            props: {
              ':width': '200',
              'color': 'secondary',
              '__tiptapWrap': true,
            },
          },
          content: [
            {
              type: 'slot',
              attrs: {
                name: 'default',
                props: {
                  'v-slot:default': '',
                },
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {},
                  content: [
                    {
                      type: 'text',
                      text: 'My button',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })
})

describe('code block', () => {
  test('code block preserves space indentation when loaded from Shiki-highlighted MDC', async () => {
    // Reproduce bug: when a file is opened, its MDC body has Shiki-highlighted spans.
    // span.line elements have no '\n' text nodes between them, so getNodeContent()
    // concatenates all lines without newlines, losing indentation visibility.
    const inputContent = 'function hello() {\n  console.log(\'world\')\n}'

    const expectedComarkNodes = [
      ['pre', { language: 'ts', code: inputContent }],
    ]

    const comarkTreeInput = {
      nodes: expectedComarkNodes,
      frontmatter: {},
    }

    const tiptapJSON = comarkToTiptap(comarkTreeInput as any)

    // The codeBlock node must contain the full original code, with newlines and indentation
    expect(tiptapJSON.content?.[1]).toMatchObject({
      type: 'codeBlock',
      attrs: { language: 'ts' },
      content: [{ type: 'text', text: 'function hello() {\n  console.log(\'world\')\n}' }],
    })
  })

  test('code block preserves tab indentation when loaded from Shiki-highlighted MDC', async () => {
    // Same bug: Shiki expands \t to spaces in its token spans, so reading back from
    // Shiki spans loses the original tab characters. props.code stores the raw code.
    const inputContent = 'function hello() {\n\tconsole.log(\'world\')\n}'

    const expectedComarkNodes = [
      ['pre', { language: 'ts', code: inputContent }],
    ]

    const comarkTreeInput = {
      nodes: expectedComarkNodes,
      frontmatter: {},
    }

    const tiptapJSON = comarkToTiptap(comarkTreeInput as any)

    // The codeBlock node must contain the original tab character from props.code,
    // not the 4 spaces that Shiki used in its token spans
    expect(tiptapJSON.content?.[1]).toMatchObject({
      type: 'codeBlock',
      attrs: { language: 'ts' },
      content: [{ type: 'text', text: 'function hello() {\n\tconsole.log(\'world\')\n}' }],
    })
  })

  test('simple code block highlighting', async () => {
    const inputContent = 'console.log("Hello, world!");'

    const comarkTreeInput = {
      nodes: [['pre', { language: 'javascript' }, ['code', {}, inputContent]]],
      frontmatter: {},
    }

    const tiptapJSON = comarkToTiptap(comarkTreeInput as any)

    const rtComarkTree = await tiptapToComark(tiptapJSON, { highlightTheme: { default: 'github-light', dark: 'github-dark' } })
    const preNode = rtComarkTree.nodes[0] as any

    // Tags: pre -> code -> line -> span -> text
    expect(preNode[0]).toBe('pre')
    expect(preNode[1].language).toBe('javascript')
    expect(preNode[1].code).toBe('console.log("Hello, world!");')
    expect(preNode[1].className).toBe('shiki shiki-themes github-light github-dark')

    // Note we don't check the styles and colors because they are generated by Shiki and we don't want to test Shiki here
  })
})

describe('inline code', () => {
  test('inline code with language attribute - `code`{lang="ts"}', async () => {
    const inputContent = '`const foo = "bar"`{lang="ts"}'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'const foo = "bar"',
              marks: [{ type: 'code', attrs: { language: 'ts' } }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('inline code language is preserved when Shiki runs with a real theme', async () => {
    const inputContent = '`const foo = "bar"`{lang="ts"}'

    const { parse } = await import('comark')
    const tree = await parse(inputContent, {
      plugins: [{ post: async (state) => { const { highlightCodeBlocks } = await import('comark/plugins/highlight'); state.tree = await highlightCodeBlocks(state.tree, { themes: { default: 'github-light', dark: 'github-dark' } }) } }],
    })

    // After Shiki, the `language` prop must still be present so comarkToTiptap can preserve it.
    // Full roundtrip: load the Shiki-processed tree into TipTap then back to markdown
    const tiptapJSON = comarkToTiptap(tree)
    expect(tiptapJSON.content![1].content![0].marks![0]).toEqual({ type: 'code', attrs: { language: 'ts' } })

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })
    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('inline code with already-corrupted Shiki classes is cleaned up on roundtrip', async () => {
    const inputContent = '`docus`{.shiki,shiki-themes,material-theme-lighter,material-theme,material-theme-palenight lang="ts"}'

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)

    // Despite the corrupted input, TipTap should only carry `language` in the code mark attrs
    expect(tiptapJSON).toMatchObject({
      type: 'doc',
      content: [
        { type: 'frontmatter', attrs: { frontmatter: {} } },
        {
          type: 'paragraph',
          content: [{
            type: 'text',
            text: 'docus',
            marks: [{ type: 'code', attrs: { language: 'ts' } }],
          }],
        },
      ],
    })

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    // The output should be clean — no Shiki classes in the markdown
    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe('`docus`{lang="ts"}\n')
  })

  test('inline code with already-corrupted Shiki classes and real Shiki theme', async () => {
    const inputContent = '`docus`{.shiki,shiki-themes,material-theme-lighter,material-theme,material-theme-palenight lang="ts"}'

    const { parse } = await import('comark')
    const tree = await parse(inputContent, {
      plugins: [{ post: async (state) => { const { highlightCodeBlocks } = await import('comark/plugins/highlight'); state.tree = await highlightCodeBlocks(state.tree, { themes: { default: 'github-light', dark: 'github-dark' } }) } }],
    })

    const tiptapJSON = comarkToTiptap(tree)
    expect(tiptapJSON.content![1].content![0].marks![0]).toEqual({ type: 'code', attrs: { language: 'ts' } })

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })
    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe('`docus`{lang="ts"}\n')
  })
})

describe('images', () => {
  test('simple image', async () => {
    const inputContent = '![Alt text](https://example.com/image.jpg)'

    const expectedComarkNodes = [
      ['p', {}, ['img', { src: 'https://example.com/image.jpg', alt: 'Alt text' }]],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: {
                props: {
                  src: 'https://example.com/image.jpg',
                  alt: 'Alt text',
                },
              },
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('image with title', async () => {
    const inputContent = '![Alt text](https://example.com/image.jpg "Image title")'

    const expectedComarkNodes = [
      ['p', {}, ['img', { src: 'https://example.com/image.jpg', alt: 'Alt text', title: 'Image title' }]],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: {
                props: {
                  src: 'https://example.com/image.jpg',
                  alt: 'Alt text',
                  title: 'Image title',
                },
              },
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('image with width and height', async () => {
    const inputContent = '![Alt text](https://example.com/image.jpg){width="800" height="600"}'

    const expectedComarkNodes = [
      ['p', {}, ['img', { src: 'https://example.com/image.jpg', alt: 'Alt text', width: 800, height: 600 }]],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: {
                props: {
                  src: 'https://example.com/image.jpg',
                  alt: 'Alt text',
                  width: 800,
                  height: 600,
                },
              },
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    // Note: Width and height are converted to strings during round-trip conversion
    const expectedRtComarkNodes = [
      ['p', {}, ['img', { src: 'https://example.com/image.jpg', alt: 'Alt text', width: '800', height: '600' }]],
    ]
    expect(rtComarkTree.nodes).toMatchObject(expectedRtComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Check that the output contains the image with both width and height attributes
    // (attribute order may vary)
    expect(outputContent).toContain('![Alt text](https://example.com/image.jpg)')
    expect(outputContent).toContain('width="800"')
    expect(outputContent).toContain('height="600"')
  })
})

describe('videos', () => {
  test('simple video with controls', async () => {
    const inputContent = ':video{controls src="https://example.com/video.mp4"}'

    const expectedComarkNodes = [
      ['video', { ':controls': 'true', 'src': 'https://example.com/video.mp4' }],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'video',
          attrs: {
            props: {
              controls: true,
              src: 'https://example.com/video.mp4',
            },
          },
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Video is serialized as MDC component syntax
    expect(outputContent).toContain(':video')
    expect(outputContent).toContain('src="https://example.com/video.mp4"')
    expect(outputContent).toContain('controls')
  })

  test('video with poster', async () => {
    const inputContent = ':video{controls poster="https://example.com/poster.jpg" src="https://example.com/video.mp4"}'

    const expectedComarkNodes = [
      ['video', { ':controls': 'true', 'poster': 'https://example.com/poster.jpg', 'src': 'https://example.com/video.mp4' }],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'video',
          attrs: {
            props: {
              controls: true,
              poster: 'https://example.com/poster.jpg',
              src: 'https://example.com/video.mp4',
            },
          },
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Video is serialized as MDC component syntax
    expect(outputContent).toContain(':video')
    expect(outputContent).toContain('src="https://example.com/video.mp4"')
    expect(outputContent).toContain('poster="https://example.com/poster.jpg"')
    expect(outputContent).toContain('controls')
  })

  test('video with loop and muted', async () => {
    const inputContent = ':video{controls loop muted poster="https://example.com/poster.jpg" src="https://example.com/video.mp4"}'

    const expectedComarkNodes = [
      ['video', { ':controls': 'true', ':loop': 'true', ':muted': 'true', 'poster': 'https://example.com/poster.jpg', 'src': 'https://example.com/video.mp4' }],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: {
            frontmatter: {},
          },
        },
        {
          type: 'video',
          attrs: {
            props: {
              controls: true,
              loop: true,
              muted: true,
              poster: 'https://example.com/poster.jpg',
              src: 'https://example.com/video.mp4',
            },
          },
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)

    // Video is serialized as MDC component syntax
    expect(outputContent).toContain(':video')
    expect(outputContent).toContain('src="https://example.com/video.mp4"')
    expect(outputContent).toContain('poster="https://example.com/poster.jpg"')
    expect(outputContent).toContain('controls')
    expect(outputContent).toContain('loop')
    expect(outputContent).toContain('muted')
  })
})

describe('marks', () => {
  test('bold text - **x**', async () => {
    const inputContent = '**x**'

    const expectedComarkNodes = [
      ['p', {}, ['strong', {}, 'x']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('italic text - *x*', async () => {
    const inputContent = '*x*'

    const expectedComarkNodes = [
      ['p', {}, ['em', {}, 'x']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'italic' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('bold and italic text - ***x***', async () => {
    const inputContent = '***x***'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'bold' }, { type: 'italic' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('nested bold in italic - *y **x***', async () => {
    const inputContent = '*y **x***'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'y ',
              marks: [{ type: 'italic' }],
            },
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'bold' }, { type: 'italic' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('nested italic in bold - ***x** y*', async () => {
    const inputContent = '***x** y*'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'bold' }, { type: 'italic' }],
            },
            {
              type: 'text',
              text: ' y',
              marks: [{ type: 'italic' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('inline code in bold - **`x`**', async () => {
    const inputContent = '**`x`**'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'code' }, { type: 'bold' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('strikethrough text - ~~x~~', async () => {
    const inputContent = '~~x~~'

    const expectedComarkNodes = [
      ['p', {}, ['del', {}, 'x']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'strike' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('bold in strikethrough - ~~**x**~~', async () => {
    const inputContent = '~~**x**~~'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'bold' }, { type: 'strike' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('inline code in bold and strikethrough - ~~**`x`**~~', async () => {
    const inputContent = '~~**`x`**~~'

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'code' }, { type: 'bold' }, { type: 'strike' }],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })
})

describe('text styles', () => {
  test('inline text with multiple classes', async () => {
    const inputContent = 'Welcome to [site]{.bg-gradient-to-r.from-primary-600.to-purple-600.bg-clip-text.text-transparent}'

    const expectedComarkNodes = [
      ['p', {}, 'Welcome to ', ['span', { className: ['bg-gradient-to-r', 'from-primary-600', 'to-purple-600', 'bg-clip-text', 'text-transparent'] }, 'site']],
    ]

    const expectedTiptapJSON: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'frontmatter',
          attrs: { frontmatter: {} },
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Welcome to ' },
            {
              type: 'span-style',
              attrs: {
                class: 'bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent',
              },
              content: [
                { type: 'text', text: 'site' },
              ],
            },
          ],
        },
      ],
    }

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const comarkTree = document.body
    expect(comarkTree.nodes).toMatchObject(expectedComarkNodes)

    const tiptapJSON: JSONContent = comarkToTiptap(comarkTree)
    expect(tiptapJSON).toMatchObject(expectedTiptapJSON)

    const rtComarkTree = await tiptapToComark(tiptapJSON)
    expect(rtComarkTree.nodes).toMatchObject(expectedComarkNodes)

    const generatedDocument = createMockDocument('docs/test.md', {
      body: rtComarkTree,
      ...rtComarkTree.frontmatter,
    })

    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })
})
