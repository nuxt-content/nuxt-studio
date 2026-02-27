import type { JSONContent } from '@tiptap/vue-3'
import { isEmpty } from '../../utils/object'
import type { ComarkTree, ComarkNode, ComarkElement, ComarkComment } from 'comark/ast'
import { EMOJI_REGEXP, getEmojiUnicode } from '../emoji'
import { isValidAttr } from './props'

type ComarkToTipTapMap = Record<string, (node: ComarkElement) => JSONContent | JSONContent[]>

const tagToMark: Record<string, string> = {
  strong: 'bold',
  em: 'italic',
  del: 'strike',
  code: 'code',
  a: 'link',
}

// ─── ComarkNode helpers ───────────────────────────────────────────────────────

function isElement(node: ComarkNode): node is ComarkElement {
  return Array.isArray(node) && node[0] !== null
}

function isComment(node: ComarkNode): node is ComarkComment {
  return Array.isArray(node) && node[0] === null
}

function getTag(node: ComarkElement): string {
  return node[0] as string
}

function getAttrs(node: ComarkElement): Record<string, unknown> {
  return (node[1] as Record<string, unknown>) || {}
}

function getChildren(node: ComarkElement): ComarkNode[] {
  return node.slice(2) as ComarkNode[]
}

// ─── Node map ─────────────────────────────────────────────────────────────────

const comarkToTiptapMap: ComarkToTipTapMap = {
  ...Object.fromEntries(Object.entries(tagToMark).map(([key, value]) => [key, node => createMark(node, value)])),
  img: node => createTipTapNode(node, 'image', { attrs: { props: getAttrs(node) || {} } }),
  video: node => createVideoTipTapNode(node),
  template: node => createTemplateNode(node),
  pre: node => createPreNode(node),
  p: node => createParagraphNode(node),
  span: node => createSpanStyleNode(node),
  h1: node => createTipTapNode(node, 'heading', { attrs: { level: 1 } }),
  h2: node => createTipTapNode(node, 'heading', { attrs: { level: 2 } }),
  h3: node => createTipTapNode(node, 'heading', { attrs: { level: 3 } }),
  h4: node => createTipTapNode(node, 'heading', { attrs: { level: 4 } }),
  h5: node => createTipTapNode(node, 'heading', { attrs: { level: 5 } }),
  h6: node => createTipTapNode(node, 'heading', { attrs: { level: 6 } }),
  ul: node => createTipTapNode(node, 'bulletList'),
  ol: node => createTipTapNode(node, 'orderedList', { attrs: { start: getAttrs(node)?.start } }),
  li: node => createTipTapNode(node, 'listItem', { children: [['p', {}, ...getChildren(node)] as ComarkElement] }),
  blockquote: node => createTipTapNode(node, 'blockquote'),
  binding: node => createTipTapNode(node, 'binding', { attrs: { value: getAttrs(node)?.value, defaultValue: getAttrs(node)?.defaultValue } }),
  hr: node => createTipTapNode(node, 'horizontalRule'),
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function comarkToTiptap(tree: ComarkTree): JSONContent {
  // Remove invalid top-level text nodes (same as MDC version filtering type !== 'text')
  const nodes = tree.nodes.filter(node => !isComment(node as ComarkNode) || isElement(node as ComarkNode))
    .filter(node => typeof node !== 'string')

  // Remove style elements recursively
  const cleanNodes = removeStyleElements(nodes)

  const content = cleanNodes.flatMap(node => comarkNodeToTiptap(node))

  return {
    type: 'doc',
    content: [
      {
        type: 'frontmatter',
        attrs: { frontmatter: tree.frontmatter || {} },
      },
      ...((isEmpty(content as unknown[]) ? [{ type: 'paragraph', content: [] }] : content) as JSONContent[]),
    ],
  }
}

// ─── Node converter ───────────────────────────────────────────────────────────

export function comarkNodeToTiptap(node: ComarkNode, parentTag?: string): JSONContent | JSONContent[] {
  // ComarkText is a plain string
  if (typeof node === 'string') {
    return createTextNode(node)
  }

  if (!Array.isArray(node)) {
    return { type: 'text', text: '' }
  }

  const [rawTag] = node

  // Comment node: [null, {}, text]
  if (rawTag === null) {
    return { type: 'comment', attrs: { text: (node as ComarkComment)[2] as string } }
  }

  const tagStr = rawTag as string

  // Known node types
  if (comarkToTiptapMap[tagStr]) {
    return comarkToTiptapMap[tagStr](node as ComarkElement)
  }

  // Custom vue components (Elements)
  // If parent is a paragraph, element should be inline
  if (parentTag === 'p') {
    return createTipTapNode(node as ComarkElement, 'inline-element', { attrs: { tag: tagStr } })
  }

  /**
   * In TipTap side only, inside element, text must be enclosed in a paragraph.
   * Without the wrapper paragraph, contents of an element can't be modified.
   */
  let processedNode = node as ComarkElement
  const nodeChildren = getChildren(processedNode)
  if (nodeChildren.length > 0 && typeof nodeChildren[0] === 'string') {
    const originalAttrs = getAttrs(processedNode)
    processedNode = [tagStr, { ...originalAttrs, __tiptapWrap: true }, ['p', {}, ...nodeChildren] as ComarkElement] as ComarkElement
  }

  const slotWrapped = wrapChildrenWithinSlot(getChildren(processedNode))

  return createTipTapNode(processedNode, 'element', { attrs: { tag: tagStr }, children: slotWrapped })
}

// ─── Mark creation ────────────────────────────────────────────────────────────

export function createMark(node: ComarkElement, mark: string, accumulatedMarks: { type: string, attrs?: object }[] = []): JSONContent[] {
  const attrs = { ...getAttrs(node) }

  // Link attributes
  if (mark === 'link' && attrs.href) {
    const href = String(attrs.href)
    const isExternal = href.startsWith('http://') || href.startsWith('https://')
    if (isExternal) {
      attrs.target = attrs.target || '_blank'
      attrs.rel = attrs.rel || 'noopener noreferrer nofollow'
    }
  }

  const marks = [...accumulatedMarks, { type: mark, attrs }]

  function getNodeContent(n: ComarkNode): string {
    if (typeof n === 'string') return n
    if (!Array.isArray(n)) return ''
    const [t, , ...ch] = n
    if (t === null) return '' // comment
    return (ch as ComarkNode[]).map(getNodeContent).join('')
  }

  const tag = getTag(node)

  if (tag === 'code') {
    // Only preserve `language` prop — strip Shiki-added props (className, style, etc.)
    // comark stores inline code language as `lang`, block code as `language`
    const codeAttrs: Record<string, unknown> = {}
    const nodeAttrs = getAttrs(node)
    const language = nodeAttrs.language || nodeAttrs.lang
    if (language) {
      codeAttrs.language = language
    }
    const codeMarks = [...accumulatedMarks, { type: mark, attrs: codeAttrs }]
    return [{
      type: 'text',
      text: getNodeContent(node),
      marks: codeMarks.slice().reverse(),
    }]
  }

  return getChildren(node).map((child) => {
    if (typeof child === 'string') {
      return {
        type: 'text',
        text: child,
        marks: marks.slice().reverse(),
      }
    }
    else if (isElement(child)) {
      const childTag = getTag(child)
      if (tagToMark[childTag]) {
        // Recursively process nested mark nodes, passing down all accumulated marks
        return createMark(child, tagToMark[childTag], marks)
      }
      else {
        // For non-mark elements (e.g., links), apply marks to their text children
        const tiptapNode = comarkNodeToTiptap(child, tag) as JSONContent
        if (tiptapNode.content?.length) {
          tiptapNode.content.forEach((c) => {
            if (c.type === 'text') {
              c.marks = marks.slice().reverse()
            }
          })
        }
        return tiptapNode
      }
    }

    return comarkNodeToTiptap(child, tag) as JSONContent
  }).flat() as JSONContent[]
}

// ─── Node creation helpers ────────────────────────────────────────────────────

function createTipTapNode(node: ComarkElement, type: string, extra: Record<string, unknown> = {}): JSONContent {
  const { attrs = {}, children, ...rest } = extra
  const nodeAttrs = getAttrs(node)

  const cleanProps = Object.entries({
    ...((attrs as Record<string, unknown>).props as Record<string, unknown> || {}),
    ...(nodeAttrs || {}),
  })
    .map(([key, value]) => {
      // Remove MDC internal attributes
      if (key.startsWith('__mdc_')) {
        return undefined
      }
      return ['className', 'class'].includes(key.trim())
        ? ['class', typeof value === 'string' ? value : (value as string[]).join(' ')]
        : [key.trim(), value]
    })
    .filter(Boolean) as [string, unknown][]

  const tiptapNode: Record<string, unknown> = {
    type,
    ...rest,
    attrs: { ...(attrs as object) },
  }

  if (cleanProps.length) {
    (tiptapNode.attrs as Record<string, unknown>).props = Object.fromEntries(cleanProps)
  }

  const effectiveChildren = (children !== undefined ? children : getChildren(node)) as ComarkNode[]

  if (effectiveChildren.length > 0 || children !== undefined) {
    tiptapNode.content = effectiveChildren.flatMap(child => comarkNodeToTiptap(child, getTag(node)))
  }

  return tiptapNode as JSONContent
}

function createVideoTipTapNode(node: ComarkElement): JSONContent {
  const props = getAttrs(node)
  const booleanProps = ['controls', 'autoplay', 'loop', 'muted']

  // Normalize boolean properties from string "true"/"false" to actual booleans
  const normalizedProps = Object.entries(props).reduce((acc, [key, value]) => {
    // Remove ':' prefix if present
    const cleanKey = key.startsWith(':') ? key.substring(1) : key

    if (booleanProps.includes(cleanKey)) {
      if (value === 'true' || value === true) {
        acc[cleanKey] = true
      }
      else if (value === 'false' || value === false) {
        acc[cleanKey] = false
      }
    }
    else {
      acc[cleanKey] = value
    }
    return acc
  }, {} as Record<string, unknown>)

  // Return directly — createTipTapNode would merge normalizedProps with raw nodeAttrs,
  // causing the normalized boolean values to be overridden by the raw string values from comark.
  return {
    type: 'video',
    attrs: { props: normalizedProps },
  } as JSONContent
}

function createTemplateNode(node: ComarkElement): JSONContent {
  const nodeAttrs = getAttrs(node)
  // comark uses { name: 'xxx' } format; legacy MDC used { 'v-slot:xxx': '' } format
  const name = Object.keys(nodeAttrs || {}).find(prop => prop?.startsWith('v-slot:'))?.replace('v-slot:', '')
    || (nodeAttrs as Record<string, unknown>)?.name as string
    || 'default'

  // Detect if this is a synthetic default slot (auto-created by wrapChildrenWithinSlot, not explicit in source)
  const isSynthetic = (nodeAttrs as Record<string, unknown>)?.__tiptapSynthetic !== undefined

  // Wrap text children in paragraph (TipTap requires text to be in block nodes)
  let children = getChildren(node)
  if (children.length > 0 && typeof children[0] === 'string') {
    children = [['p', {}, ...children] as ComarkElement]
  }

  // Strip __tiptapSynthetic from processedNode so it doesn't leak into element props
  const cleanAttrs = { ...nodeAttrs }
  delete (cleanAttrs as Record<string, unknown>).__tiptapSynthetic

  const processedNode: ComarkElement = [getTag(node), cleanAttrs, ...children]
  const slotNode = createTipTapNode(processedNode, 'slot', { attrs: { name } })

  // Propagate synthetic flag to TipTap slot attrs so tiptapToComark can identify it
  if (isSynthetic) {
    ;(slotNode.attrs as Record<string, unknown>).__tiptapSynthetic = true
  }

  return slotNode
}

function createPreNode(node: ComarkElement): JSONContent {
  const nodeAttrs = getAttrs(node)
  const language = nodeAttrs.language || 'text'
  const filename = nodeAttrs.filename
  const rawCode = nodeAttrs.code as string | undefined

  // When attrs.code is available, use it directly to preserve indentation and tab characters
  if (rawCode !== undefined) {
    return {
      type: 'codeBlock',
      attrs: { language, filename },
      content: rawCode ? [{ type: 'text', text: rawCode }] : [],
    } as JSONContent
  }

  // Fallback for comark trees that don't carry attrs.code
  const tiptapNode = createTipTapNode(node, 'codeBlock', {
    attrs: { language, filename },
  })

  // Remove empty text nodes (not allowed in TipTap codeBlock)
  if ((tiptapNode.content as JSONContent[]).length === 1 && ((tiptapNode.content as JSONContent[])[0]).text === '') {
    tiptapNode.content = []
  }

  // Remove marks from code texts
  ;(tiptapNode.content as JSONContent[]).forEach((child: JSONContent) => {
    delete child.marks
  })

  return tiptapNode
}

function createParagraphNode(node: ComarkElement): JSONContent {
  const children = getChildren(node).filter(child => !(typeof child === 'string' && !child))

  // Flatten children (e.g., from createMark which returns arrays)
  const content = children.flatMap(child => comarkNodeToTiptap(child, 'p'))

  const attrs = getAttrs(node)
  return {
    type: 'paragraph',
    content,
    attrs: isEmpty(attrs) ? undefined : attrs,
  }
}

function createTextNode(text: string): JSONContent | JSONContent[] {
  const nodes: { type: string, text: string }[] = []
  let lastIndex = 0

  // Split the text using the emoji regexp, keeping the match in the result array
  text.replace(EMOJI_REGEXP, (match: string, offset: number) => {
    // Add text before the emoji
    if (lastIndex < offset) {
      nodes.push({
        type: 'text',
        text: text.slice(lastIndex, offset),
      })
    }

    // Add the emoji text node
    const emojiUnicode = getEmojiUnicode(match.substring(1, match.length - 1))
    nodes.push({
      type: 'text',
      text: emojiUnicode || match,
    })

    lastIndex = offset + match.length

    return ''
  })

  // Add any remaining text after the last emoji
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      text: text.slice(lastIndex),
    })
  }

  return nodes.length === 0 ? { type: 'text', text } : nodes
}

function createSpanStyleNode(node: ComarkElement): JSONContent {
  const nodeAttrs = getAttrs(node)
  const spanStyle = nodeAttrs?.style
  const spanClass = nodeAttrs?.class || nodeAttrs?.className
  const spanAttrs = {
    style: isValidAttr(spanStyle as string) ? String(spanStyle).trim() : undefined,
    class: isValidAttr(spanClass as string) ? (typeof spanClass === 'string' ? spanClass : (spanClass as string[]).join(' ')).trim() : undefined,
  }

  const cleanedAttrs = { ...nodeAttrs }
  delete cleanedAttrs.style
  delete cleanedAttrs.class
  delete cleanedAttrs.className

  const cleanedNode: ComarkElement = [getTag(node), cleanedAttrs, ...getChildren(node)]
  return createTipTapNode(cleanedNode, 'span-style', { attrs: spanAttrs })
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Ensure all children of an element are wrapped in a slot.
 * Children not wrapped in a slot are appended to the default slot.
 */
function wrapChildrenWithinSlot(children: ComarkNode[]): ComarkNode[] {
  const isTemplateEl = (child: ComarkNode): boolean =>
    isElement(child) && getTag(child as ComarkElement) === 'template'

  const noneTemplateChildren = children.filter(child => !isTemplateEl(child))

  if (noneTemplateChildren.length) {
    let templates = children.filter(isTemplateEl)

    // Detect default slot by both comark format ({ name: 'default' }) and legacy MDC format ({ 'v-slot:default': '' })
    const defaultSlotIndex = templates.findIndex((child) => {
      const attrs = (getAttrs(child as ComarkElement) as Record<string, unknown>)
      return attrs?.['v-slot:default'] !== undefined || attrs?.name === 'default'
    })

    if (defaultSlotIndex === -1) {
      // __tiptapSynthetic marks this as auto-created by wrapChildrenWithinSlot (not explicit in source).
      // This flag lets tiptapToComark unwrap ONLY synthetic default slots, preserving explicit #default slots.
      const defaultSlot: ComarkElement = ['template', { name: 'default', __tiptapSynthetic: '' }, ...noneTemplateChildren]
      templates = [defaultSlot, ...templates]
    }
    else {
      const slot = templates[defaultSlotIndex] as ComarkElement
      const [slotTag, slotAttrs, ...existingChildren] = slot
      templates[defaultSlotIndex] = [slotTag, slotAttrs, ...existingChildren, ...noneTemplateChildren] as ComarkElement
    }

    return templates
  }

  return children
}

/**
 * Remove shiki style elements from ComarkNode array (recursive)
 */
function removeStyleElements(nodes: ComarkNode[]): ComarkNode[] {
  return nodes
    .filter(node => !(isElement(node) && getTag(node as ComarkElement) === 'style'))
    .map((node) => {
      if (!isElement(node)) return node
      const el = node as ComarkElement
      const [tag, attrs, ...children] = el
      return [tag, attrs, ...removeStyleElements(children as ComarkNode[])] as ComarkElement
    })
}
