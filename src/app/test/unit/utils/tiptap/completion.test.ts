import { describe, test, expect } from 'vitest'
import { detectExtraSpace, detectComponentContext, generateHintOptions } from '../../../../src/utils/ai/completion'
import {
  mockStateTextWithNoSpaceBefore,
  mockStateTextWithNoSpaceAfter,
  mockStateTextWithSpaceBefore,
  mockStateTextWithSpaceAfter,
  mockStateHeadingNew,
  mockStateHeadingContinue,
  mockStateHeadingMiddle,
  mockStateParagraphNew,
  mockStateParagraphAfterHeading,
  mockStateSentenceWithPeriod,
  mockStateParagraphMiddle,
  mockStateParagraphContinue,
  mockStateSentenceMiddle,
  mockStateBlockquote,
  mockStateComponentCard,
  mockStateComponentWithSlot,
  mockStatePlainText,
} from '../../../mocks/editor-state'

describe('detectExtraSpace', () => {
  test('returns "before" when no space before cursor', () => {
    const result = detectExtraSpace(mockStateTextWithNoSpaceBefore, 11)
    expect(result).toBe('before')
  })

  test('returns "after" when no space after cursor', () => {
    const result = detectExtraSpace(mockStateTextWithNoSpaceAfter, 5)
    expect(result).toBe('after')
  })

  test('returns null when space already exists before cursor', () => {
    const result = detectExtraSpace(mockStateTextWithSpaceBefore, 12)
    expect(result).toBe(null)
  })

  test('returns null when space already exists after cursor', () => {
    const result = detectExtraSpace(mockStateTextWithSpaceAfter, 5)
    expect(result).toBe(null)
  })
})

describe('generateHintOptions', () => {
  // IMPORTANT: These hint options are used to guide AI text completion behavior on server side.
  describe('heading contexts', () => {
    test('returns "heading-new" when cursor is at start of heading', () => {
      const result = generateHintOptions(mockStateHeadingNew, 0)
      expect(result.cursor).toBe('heading-new')
    })

    test('returns "heading-middle" when cursor is in middle of heading', () => {
      const result = generateHintOptions(mockStateHeadingMiddle, 5)
      expect(result.cursor).toBe('heading-middle')
    })

    test('returns "heading-continue" when cursor is at end of heading', () => {
      const result = generateHintOptions(mockStateHeadingContinue, 10)
      expect(result.cursor).toBe('heading-continue')
    })
  })

  describe('paragraph contexts', () => {
    test('returns "paragraph-new" when starting a new paragraph', () => {
      const result = generateHintOptions(mockStateParagraphNew, 0)
      expect(result.cursor).toBe('paragraph-new')
    })

    test('returns "sentence-new" after sentence-ending punctuation', () => {
      const result = generateHintOptions(mockStateSentenceWithPeriod, 16)
      expect(result.cursor).toBe('sentence-new')
    })

    test('returns "paragraph-middle" when cursor is in middle of paragraph', () => {
      const result = generateHintOptions(mockStateParagraphMiddle, 10)
      expect(result.cursor).toBe('paragraph-middle')
    })

    test('returns "paragraph-continue" when cursor is at end of paragraph', () => {
      const result = generateHintOptions(mockStateParagraphContinue, 14)
      expect(result.cursor).toBe('paragraph-continue')
    })

    test('sentence-new takes precedence over paragraph-middle', () => {
      const result = generateHintOptions(mockStateSentenceMiddle, 16)
      expect(result.cursor).toBe('sentence-new')
    })
  })

  describe('previous node detection', () => {
    test('captures heading text when previous node is a heading', () => {
      const result = generateHintOptions(mockStateParagraphAfterHeading, 0)
      expect(result.previousNodeType).toBe('heading')
      expect(result.headingText).toBe('Introduction')
    })

    test('returns undefined when there is no previous node', () => {
      const result = generateHintOptions(mockStateParagraphNew, 0)
      expect(result.previousNodeType).toBeUndefined()
      expect(result.headingText).toBeUndefined()
    })
  })

  describe('other node types', () => {
    test('defaults to "paragraph-continue" for unknown node types', () => {
      const result = generateHintOptions(mockStateBlockquote, 7)
      expect(result.cursor).toBe('paragraph-continue')
    })
  })

  describe('component and slot context', () => {
    test('detects component name', () => {
      const result = detectComponentContext(mockStateComponentCard, 5)
      expect(result.currentComponent).toBe('Card')
      expect(result.currentSlot).toBeUndefined()
    })

    test('detects component and slot', () => {
      const result = detectComponentContext(mockStateComponentWithSlot, 5)
      expect(result.currentComponent).toBe('Card')
      expect(result.currentSlot).toBe('title')
    })

    test('returns undefined when not inside a component', () => {
      const result = detectComponentContext(mockStatePlainText, 5)
      expect(result.currentComponent).toBeUndefined()
      expect(result.currentSlot).toBeUndefined()
    })

    test('generateHintOptions includes component and slot context', () => {
      const result = generateHintOptions(mockStateComponentWithSlot, 0)
      expect(result.currentComponent).toBe('Card')
      expect(result.currentSlot).toBe('title')
      expect(result.cursor).toBe('paragraph-new')
    })
  })
})
