import { test, describe, expect } from 'vitest'
import { createMark } from '../../../../src/utils/tiptap/comarkToTiptap'
import type { ComarkElement } from 'comark'

describe('marks', () => {
  test('createMark: create `italic` mark nodes', () => {
    const mark = 'italic'
    const node: ComarkElement = ['em', {}, 'this is a test in italic']

    expect(createMark(node, mark)).toEqual([{
      type: 'text',
      text: 'this is a test in italic',
      marks: [{ type: 'italic', attrs: {} }],
    }])
  })

  test('createMark: create multiple mark (italic and bold) nodes', () => {
    const mark = 'italic'
    const node: ComarkElement = ['em', {}, ['strong', {}, 'this is a test in italic and bold'] as ComarkElement]

    expect(createMark(node, mark)).toStrictEqual([{
      type: 'text',
      text: 'this is a test in italic and bold',
      marks: [
        {
          type: 'bold',
          attrs: {},
        },
        {
          type: 'italic',
          attrs: {},
        },
      ],
    }])
  })

  test('createMark: nested strong containing a link - no duplicate bold marks, link preserved', () => {
    // Reflects what comark.parse produces for **...**[here]**...** (nested strong)
    const node: ComarkElement = ['strong', {}, ['strong', {}, ['a', { href: '/bugs' }, 'here']] as ComarkElement]

    const result = createMark(node, 'bold')

    // 'here' is the only text leaf — expect exactly one text node
    expect(result).toHaveLength(1)
    const textNode = result[0] as { type: string, text: string, marks: { type: string, attrs?: object }[] }
    expect(textNode.type).toBe('text')
    expect(textNode.text).toBe('here')

    // Marks must include exactly one bold and one link — no duplicate bold
    const markTypes = textNode.marks.map(m => m.type)
    expect(markTypes).toContain('link')
    expect(markTypes).toContain('bold')
    expect(markTypes.filter(t => t === 'bold')).toHaveLength(1)
    expect(textNode.marks).toHaveLength(2)

    // The link mark must carry the href
    const linkMark = textNode.marks.find(m => m.type === 'link') as { type: string, attrs: Record<string, unknown> }
    expect(linkMark?.attrs?.href).toBe('/bugs')
  })

  test('createMark: create `code` mark nodes should not handle shiki elements', () => {
    const mark = 'code'
    // A code element containing shiki-highlighted spans
    const node: ComarkElement = [
      'code',
      {},
      [
        'span',
        { class: 'line', line: 1 },
        ['span', { style: '--shiki-default:#C678DD' }, 'const'] as ComarkElement,
        ['span', { style: '--shiki-default:#E5C07B' }, ' code'] as ComarkElement,
        ['span', { style: '--shiki-default:#56B6C2' }, ' ='] as ComarkElement,
        ['span', { style: '--shiki-default:#98C379' }, ' \'test\''] as ComarkElement,
      ] as ComarkElement,
    ]

    expect(createMark(node, mark)).toStrictEqual([{
      type: 'text',
      text: 'const code = \'test\'',
      marks: [
        {
          type: 'code',
          attrs: {},
        },
      ],
    }])
  })
})
