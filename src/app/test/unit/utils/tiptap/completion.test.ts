import { describe, test, expect, vi } from 'vitest'
import { detectExtraSpace, generateHintOptions } from '../../../../src/utils/tiptap/completion'
import type { EditorState } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * Helper function to create a mock EditorState for testing
 */
function createMockEditorState(textContent: string, _cursorPos: number): EditorState {
  const mockDoc = {
    textBetween: vi.fn((from: number, to: number, _blockSeparator?: string, _leafText?: string) => {
      return textContent.slice(from, to)
    }),
    content: {
      size: textContent.length,
    },
    resolve: vi.fn((_pos: number) => {
      // Mock $pos object
      return {
        parentOffset: _pos,
        parent: {
          type: { name: 'paragraph' },
          textContent,
        },
        end: vi.fn(() => textContent.length),
        index: vi.fn(() => 0),
        depth: 1,
      }
    }),
  } as unknown as ProseMirrorNode

  return {
    doc: mockDoc,
  } as unknown as EditorState
}

/**
 * Helper function to create a mock EditorState with specific node structure
 */
function createMockEditorStateWithNode(
  textContent: string,
  _cursorPos: number,
  nodeType: string,
  parentOffset: number,
  nodeEndPos: number,
  nodeIndex = 0,
  previousNode?: { type: string, textContent?: string },
): EditorState {
  const mockDoc = {
    textBetween: vi.fn((from: number, to: number) => {
      return textContent.slice(from, to)
    }),
    content: {
      size: textContent.length,
    },
    resolve: vi.fn((_pos: number) => {
      const mockParent = {
        type: { name: nodeType },
        textContent,
        child: vi.fn((index: number) => {
          if (previousNode && index === nodeIndex - 1) {
            return {
              type: { name: previousNode.type },
              textContent: previousNode.textContent || '',
            }
          }
          return null
        }),
      }

      return {
        parentOffset,
        parent: mockParent,
        end: vi.fn(() => nodeEndPos),
        index: vi.fn(() => nodeIndex),
        depth: 1,
      }
    }),
  } as unknown as ProseMirrorNode

  return {
    doc: mockDoc,
  } as unknown as EditorState
}

describe('detectExtraSpace', () => {
  test('returns "before" when no space before cursor - need to add space before AI output', () => {
    // 'Hello world' - cursor at position 11 (after 'd', no space)
    const state = createMockEditorState('Hello world', 11)
    const result = detectExtraSpace(state, 11)
    expect(result).toBe('before')
  })

  test('returns "after" when no space after cursor - need to add space after AI output', () => {
    // 'Helloworld' - cursor at position 5 (after 'o', before 'w')
    const state = createMockEditorState('Helloworld', 5)
    const result = detectExtraSpace(state, 5)
    expect(result).toBe('after')
  })

  test('returns null when space exists before cursor - no space needed', () => {
    // 'Hello world ' - cursor at position 12 (after space)
    const state = createMockEditorState('Hello world ', 12)
    const result = detectExtraSpace(state, 12)
    expect(result).toBe(null)
  })

  test('returns null when space exists after cursor - no space needed', () => {
    // 'Hello  world' - cursor at position 5 (before space)
    const state = createMockEditorState('Hello  world', 5)
    const result = detectExtraSpace(state, 5)
    expect(result).toBe(null)
  })

  test('returns "after" at start of document with text following', () => {
    // At start with text after, need space after AI output
    const state = createMockEditorState('Hello world', 0)
    const result = detectExtraSpace(state, 0)
    expect(result).toBe('after')
  })

  test('returns "before" at end of document with text before', () => {
    // At end with text before, need space before AI output
    const text = 'Hello world'
    const state = createMockEditorState(text, text.length)
    const result = detectExtraSpace(state, text.length)
    expect(result).toBe('before')
  })

  test('returns "before" when text ends without space', () => {
    // 'test' - cursor at end (position 4), no space before
    const state = createMockEditorState('test', 4)
    const result = detectExtraSpace(state, 4)
    expect(result).toBe('before')
  })

  test('returns "after" when text starts without space', () => {
    // 'test' - cursor at start (position 0), text after
    const state = createMockEditorState('test', 0)
    const result = detectExtraSpace(state, 0)
    expect(result).toBe('after')
  })
})

describe('generateHintOptions', () => {
  // IMPORTANT: These hint options are used to guide AI text completion behavior on server side.
  describe('heading contexts', () => {
    test('returns "heading-new" when cursor is at start of heading', () => {
      // AI should complete heading TEXT only, not create new heading syntax
      const state = createMockEditorStateWithNode('', 0, 'heading', 0, 0)
      const result = generateHintOptions(state, 0)
      expect(result.cursor).toBe('heading-new')
    })

    test('returns "heading-new" when cursor is at start of heading with parentOffset 0', () => {
      const state = createMockEditorStateWithNode('My Heading', 0, 'heading', 0, 10)
      const result = generateHintOptions(state, 0)
      expect(result.cursor).toBe('heading-new')
    })

    test('returns "heading-middle" when cursor is in middle of heading with text after', () => {
      const state = createMockEditorStateWithNode('My Heading', 5, 'heading', 5, 10)
      const result = generateHintOptions(state, 5)
      expect(result.cursor).toBe('heading-middle')
    })

    test('returns "heading-continue" when cursor is at end of heading', () => {
      const state = createMockEditorStateWithNode('My Heading', 10, 'heading', 10, 10)
      const result = generateHintOptions(state, 10)
      expect(result.cursor).toBe('heading-continue')
    })
  })

  describe('paragraph contexts', () => {
    test('returns "paragraph-new" when cursor is at position 0', () => {
      const state = createMockEditorStateWithNode('', 0, 'paragraph', 0, 0)
      const result = generateHintOptions(state, 0)
      expect(result.cursor).toBe('paragraph-new')
    })

    test('returns "paragraph-new" when preceded by double newline', () => {
      const text = 'First paragraph\n\n'
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', 0, text.length)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('paragraph-new')
    })

    test('returns "paragraph-new" when at start of node after newline', () => {
      const text = 'Previous text\n'
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', 0, 0)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('paragraph-new')
    })

    test('returns "sentence-new" after period with space', () => {
      const text = 'First sentence. '
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', text.length, text.length)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('sentence-new')
    })

    test('returns "sentence-new" after period without space', () => {
      const text = 'First sentence.'
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', text.length, text.length)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('sentence-new')
    })

    test('returns "sentence-new" after exclamation mark', () => {
      const text = 'Exciting sentence! '
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', text.length, text.length)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('sentence-new')
    })

    test('returns "sentence-new" after question mark', () => {
      const text = 'A question? '
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', text.length, text.length)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('sentence-new')
    })

    test('returns "paragraph-middle" when cursor is in middle with text after', () => {
      const text = 'This is a test paragraph'
      const state = createMockEditorStateWithNode(text, 10, 'paragraph', 10, text.length)
      const result = generateHintOptions(state, 10)
      expect(result.cursor).toBe('paragraph-middle')
    })

    test('returns "paragraph-continue" when cursor is at end without punctuation', () => {
      const text = 'This is a test'
      const state = createMockEditorStateWithNode(text, text.length, 'paragraph', text.length, text.length)
      const result = generateHintOptions(state, text.length)
      expect(result.cursor).toBe('paragraph-continue')
    })

    test('sentence-new takes precedence over paragraph-middle', () => {
      const text = 'First sentence. More text after'
      const state = createMockEditorStateWithNode(text, 16, 'paragraph', 16, text.length)
      const result = generateHintOptions(state, 16)
      expect(result.cursor).toBe('sentence-new')
    })
  })

  describe('previous node detection', () => {
    test('captures heading text when previous node is a heading', () => {
      const state = createMockEditorStateWithNode(
        '',
        0,
        'paragraph',
        0,
        0,
        1,
        { type: 'heading', textContent: 'Introduction' },
      )
      const result = generateHintOptions(state, 0)
      expect(result.previousNodeType).toBe('heading')
      expect(result.headingText).toBe('Introduction')
    })

    test('does not set headingText when previous node is not a heading', () => {
      const state = createMockEditorStateWithNode(
        '',
        0,
        'paragraph',
        0,
        0,
        1,
        { type: 'paragraph', textContent: 'Previous paragraph' },
      )
      const result = generateHintOptions(state, 0)
      expect(result.previousNodeType).toBe('paragraph')
      expect(result.headingText).toBeUndefined()
    })

    test('returns undefined for previousNodeType when at first node', () => {
      const state = createMockEditorStateWithNode('', 0, 'paragraph', 0, 0, 0)
      const result = generateHintOptions(state, 0)
      expect(result.previousNodeType).toBeUndefined()
      expect(result.headingText).toBeUndefined()
    })
  })

  describe('other node types', () => {
    test('defaults to "paragraph-continue" for unknown node types', () => {
      const state = createMockEditorStateWithNode('Content', 7, 'blockquote', 7, 7)
      const result = generateHintOptions(state, 7)
      expect(result.cursor).toBe('paragraph-continue')
    })

    test('defaults to "paragraph-continue" for list items', () => {
      const state = createMockEditorStateWithNode('List item', 9, 'listItem', 9, 9)
      const result = generateHintOptions(state, 9)
      expect(result.cursor).toBe('paragraph-continue')
    })
  })
})
