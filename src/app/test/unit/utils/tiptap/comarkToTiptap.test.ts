import { test, describe, expect } from 'vitest'
import { createMark } from '../../../../src/utils/tiptap/comarkToTiptap'
import type { ElementNode } from 'comark'

describe('marks', () => {
  test('createMark: create `italic` mark nodes', () => {
    const mark = 'italic'
    const node: ElementNode = ['em', {}, 'this is a test in italic']

    expect(createMark(node, mark)).toEqual([{
      type: 'text',
      text: 'this is a test in italic',
      marks: [{ type: 'italic', attrs: {} }],
    }])
  })

  test('createMark: create multiple mark (italic and bold) nodes', () => {
    const mark = 'italic'
    const node: ElementNode = ['em', {}, ['strong', {}, 'this is a test in italic and bold'] as ElementNode]

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
    // comark.parse produces strong > strong > a for **...**[here]**...**
    const node: ElementNode = ['strong', {}, ['strong', {}, ['a', { href: '/bugs' }, 'here']] as ElementNode]

    expect(createMark(node, 'bold')).toStrictEqual([{
      type: 'text',
      text: 'here',
      marks: [
        { type: 'link', attrs: { href: '/bugs' } },
        { type: 'bold', attrs: {} },
      ],
    }])
  })

  test('createMark: create `code` mark nodes should not handle shiki elements', () => {
    const mark = 'code'
    // A code element containing shiki-highlighted spans
    const node: ElementNode = [
      'code',
      {},
      [
        'span',
        { class: 'line', line: 1 },
        ['span', { style: '--shiki-default:#C678DD' }, 'const'] as ElementNode,
        ['span', { style: '--shiki-default:#E5C07B' }, ' code'] as ElementNode,
        ['span', { style: '--shiki-default:#56B6C2' }, ' ='] as ElementNode,
        ['span', { style: '--shiki-default:#98C379' }, ' \'test\''] as ElementNode,
      ] as ElementNode,
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
