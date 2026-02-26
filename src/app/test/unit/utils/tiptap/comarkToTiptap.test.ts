import { test, describe, expect } from 'vitest'
import { createMark } from '../../../../src/utils/tiptap/comarkToTiptap'
import type { ComarkElement } from 'comark/ast'

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
