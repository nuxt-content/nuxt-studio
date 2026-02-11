import type { EditorState } from '@tiptap/pm/state'

/**
 * Mock node structure
 */
interface MockNode {
  type: { name: string }
  attrs?: Record<string, unknown>
  textContent: string
  child?: (index: number) => MockNode | null
}

/**
 * Mock resolved position
 */
interface MockResolvedPos {
  depth: number
  parentOffset: number
  parent: MockNode
  end: () => number
  index: (depth?: number) => number
  node: (depth: number) => MockNode
}

/**
 * Simple text mock for detectExtraSpace tests
 */
export const mockStateTextWithNoSpaceBefore: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'Hello world'.slice(from, to),
    content: { size: 11 },
  },
} as unknown as EditorState

export const mockStateTextWithNoSpaceAfter: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'Helloworld'.slice(from, to),
    content: { size: 10 },
  },
} as unknown as EditorState

export const mockStateTextWithSpaceBefore: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'Hello world '.slice(from, to),
    content: { size: 12 },
  },
} as unknown as EditorState

export const mockStateTextWithSpaceAfter: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'Hello  world'.slice(from, to),
    content: { size: 12 },
  },
} as unknown as EditorState

/**
 * Heading context mocks
 */
const headingNewNode: MockNode = {
  type: { name: 'heading' },
  textContent: '',
}

const headingNewDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: '',
  child: (index: number) => (index === 0 ? headingNewNode : null),
}

const headingNewResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 0,
  parent: headingNewNode,
  end: () => 0,
  index: (depth?: number) => (depth === 0 ? 0 : 0),
  node: (depth: number) => (depth === 0 ? headingNewDocNode : headingNewNode),
}

export const mockStateHeadingNew: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => ''.slice(from, to),
    content: { size: 0 },
    resolve: () => headingNewResolvedPos,
  },
} as unknown as EditorState

const headingContinueNode: MockNode = {
  type: { name: 'heading' },
  textContent: 'My Heading',
}

const headingContinueDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: 'My Heading',
  child: (index: number) => (index === 0 ? headingContinueNode : null),
}

const headingContinueResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 10,
  parent: headingContinueNode,
  end: () => 10,
  index: (depth?: number) => (depth === 0 ? 0 : 0),
  node: (depth: number) => (depth === 0 ? headingContinueDocNode : headingContinueNode),
}

export const mockStateHeadingContinue: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'My Heading'.slice(from, to),
    content: { size: 10 },
    resolve: () => headingContinueResolvedPos,
  },
} as unknown as EditorState

const headingMiddleNode: MockNode = {
  type: { name: 'heading' },
  textContent: 'My Heading',
}

const headingMiddleDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: 'My Heading',
  child: (index: number) => (index === 0 ? headingMiddleNode : null),
}

const headingMiddleResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 5,
  parent: headingMiddleNode,
  end: () => 10,
  index: (depth?: number) => (depth === 0 ? 0 : 0),
  node: (depth: number) => (depth === 0 ? headingMiddleDocNode : headingMiddleNode),
}

export const mockStateHeadingMiddle: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'My Heading'.slice(from, to),
    content: { size: 10 },
    resolve: () => headingMiddleResolvedPos,
  },
} as unknown as EditorState

/**
 * Paragraph context mocks
 */
const paragraphNewNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: '',
}

const paragraphNewDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: '',
  child: (index: number) => (index === 0 ? paragraphNewNode : null),
}

const paragraphNewResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 0,
  parent: paragraphNewNode,
  end: () => 0,
  index: (depth?: number) => (depth === 0 ? 0 : 0),
  node: (depth: number) => (depth === 0 ? paragraphNewDocNode : paragraphNewNode),
}

export const mockStateParagraphNew: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => ''.slice(from, to),
    content: { size: 0 },
    resolve: () => paragraphNewResolvedPos,
  },
} as unknown as EditorState

/**
 * Paragraph with heading before
 */
const headingBeforeParagraphHeadingNode: MockNode = {
  type: { name: 'heading' },
  textContent: 'Introduction',
}

const headingBeforeParagraphParagraphNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: '',
}

const headingBeforeParagraphDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: '',
  child: (index: number) => {
    if (index === 0) return headingBeforeParagraphHeadingNode
    if (index === 1) return headingBeforeParagraphParagraphNode
    return null
  },
}

const headingBeforeParagraphResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 0,
  parent: headingBeforeParagraphParagraphNode,
  end: () => 0,
  index: (depth?: number) => (depth === 0 ? 1 : 1),
  node: (depth: number) => {
    if (depth === 0) return headingBeforeParagraphDocNode
    return headingBeforeParagraphParagraphNode
  },
}

export const mockStateParagraphAfterHeading: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => ''.slice(from, to),
    content: { size: 0 },
    resolve: () => headingBeforeParagraphResolvedPos,
  },
} as unknown as EditorState

/**
 * Component and slot context mocks
 */
const componentCardNode: MockNode = {
  type: { name: 'element' },
  attrs: { tag: 'Card' },
  textContent: 'content',
}

const componentCardParagraphNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: 'content',
}

const componentCardDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: 'content',
}

const componentCardResolvedPos: MockResolvedPos = {
  depth: 2,
  parentOffset: 5,
  parent: componentCardParagraphNode,
  end: () => 7,
  index: () => 0,
  node: (depth: number) => {
    if (depth === 0) return componentCardDocNode
    if (depth === 1) return componentCardNode
    return componentCardParagraphNode
  },
}

export const mockStateComponentCard: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'content'.slice(from, to),
    content: { size: 7 },
    resolve: () => componentCardResolvedPos,
  },
} as unknown as EditorState

/**
 * Component with slot
 */
const componentWithSlotElementNode: MockNode = {
  type: { name: 'element' },
  attrs: { tag: 'Card' },
  textContent: 'title text',
}

const componentWithSlotSlotNode: MockNode = {
  type: { name: 'slot' },
  attrs: { name: 'title' },
  textContent: 'title text',
}

const componentWithSlotParagraphNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: 'title text',
}

const componentWithSlotDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: 'title text',
}

const componentWithSlotResolvedPos: MockResolvedPos = {
  depth: 3,
  parentOffset: 5,
  parent: componentWithSlotParagraphNode,
  end: () => 10,
  index: () => 0,
  node: (depth: number) => {
    if (depth === 0) return componentWithSlotDocNode
    if (depth === 1) return componentWithSlotElementNode
    if (depth === 2) return componentWithSlotSlotNode
    return componentWithSlotParagraphNode
  },
}

export const mockStateComponentWithSlot: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'title text'.slice(from, to),
    content: { size: 10 },
    resolve: () => componentWithSlotResolvedPos,
  },
} as unknown as EditorState

/**
 * Plain text without component
 */
const plainParagraphNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: 'plain text',
}

const plainDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: 'plain text',
}

const plainResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 5,
  parent: plainParagraphNode,
  end: () => 10,
  index: () => 0,
  node: (depth: number) => (depth === 0 ? plainDocNode : plainParagraphNode),
}

export const mockStatePlainText: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => 'plain text'.slice(from, to),
    content: { size: 10 },
    resolve: () => plainResolvedPos,
  },
} as unknown as EditorState

/**
 * Sentence ending mocks
 */
const sentenceWithPeriodText = 'First sentence. '
const sentenceWithPeriodNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: sentenceWithPeriodText,
}

const sentenceWithPeriodDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: sentenceWithPeriodText,
  child: () => sentenceWithPeriodNode,
}

const sentenceWithPeriodResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: sentenceWithPeriodText.length,
  parent: sentenceWithPeriodNode,
  end: () => sentenceWithPeriodText.length,
  index: () => 0,
  node: (depth: number) => (depth === 0 ? sentenceWithPeriodDocNode : sentenceWithPeriodNode),
}

export const mockStateSentenceWithPeriod: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => sentenceWithPeriodText.slice(from, to),
    content: { size: sentenceWithPeriodText.length },
    resolve: () => sentenceWithPeriodResolvedPos,
  },
} as unknown as EditorState

/**
 * Paragraph middle and continue
 */
const paragraphMiddleText = 'This is a test paragraph'
const paragraphMiddleNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: paragraphMiddleText,
}

const paragraphMiddleDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: paragraphMiddleText,
  child: () => paragraphMiddleNode,
}

const paragraphMiddleResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 10,
  parent: paragraphMiddleNode,
  end: () => paragraphMiddleText.length,
  index: () => 0,
  node: (depth: number) => (depth === 0 ? paragraphMiddleDocNode : paragraphMiddleNode),
}

export const mockStateParagraphMiddle: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => paragraphMiddleText.slice(from, to),
    content: { size: paragraphMiddleText.length },
    resolve: () => paragraphMiddleResolvedPos,
  },
} as unknown as EditorState

const paragraphContinueText = 'This is a test'
const paragraphContinueNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: paragraphContinueText,
}

const paragraphContinueDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: paragraphContinueText,
  child: () => paragraphContinueNode,
}

const paragraphContinueResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: paragraphContinueText.length,
  parent: paragraphContinueNode,
  end: () => paragraphContinueText.length,
  index: () => 0,
  node: (depth: number) => (depth === 0 ? paragraphContinueDocNode : paragraphContinueNode),
}

export const mockStateParagraphContinue: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => paragraphContinueText.slice(from, to),
    content: { size: paragraphContinueText.length },
    resolve: () => paragraphContinueResolvedPos,
  },
} as unknown as EditorState

const sentenceMiddleText = 'First sentence. More text after'
const sentenceMiddleNode: MockNode = {
  type: { name: 'paragraph' },
  textContent: sentenceMiddleText,
}

const sentenceMiddleDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: sentenceMiddleText,
  child: () => sentenceMiddleNode,
}

const sentenceMiddleResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 16,
  parent: sentenceMiddleNode,
  end: () => sentenceMiddleText.length,
  index: () => 0,
  node: (depth: number) => (depth === 0 ? sentenceMiddleDocNode : sentenceMiddleNode),
}

export const mockStateSentenceMiddle: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => sentenceMiddleText.slice(from, to),
    content: { size: sentenceMiddleText.length },
    resolve: () => sentenceMiddleResolvedPos,
  },
} as unknown as EditorState

// Other node types
const blockquoteText = 'Content'
const blockquoteNode: MockNode = {
  type: { name: 'blockquote' },
  textContent: blockquoteText,
}

const blockquoteDocNode: MockNode = {
  type: { name: 'doc' },
  attrs: {},
  textContent: blockquoteText,
  child: () => blockquoteNode,
}

const blockquoteResolvedPos: MockResolvedPos = {
  depth: 1,
  parentOffset: 7,
  parent: blockquoteNode,
  end: () => 7,
  index: () => 0,
  node: (depth: number) => (depth === 0 ? blockquoteDocNode : blockquoteNode),
}

export const mockStateBlockquote: EditorState = {
  doc: {
    textBetween: (from: number, to: number) => blockquoteText.slice(from, to),
    content: { size: blockquoteText.length },
    resolve: () => blockquoteResolvedPos,
  },
} as unknown as EditorState
