import type { JSONContent } from '@tiptap/vue-3'
import { isEmpty } from '../../utils/object'
import type { MDCNode, MDCElement, MDCText, MDCComment, MDCRoot } from '@nuxtjs/mdc'
import { EMOJI_REGEXP, getEmojiUnicode } from '../emoji'
import { isValidAttr } from './props'

type MDCToTipTapMap = Record<string, (node: MDCRoot | MDCNode) => JSONContent>

const tagToMark: Record<string, string> = {
  strong: 'bold',
  em: 'italic',
  del: 'strike',
  code: 'code',
  a: 'link',
}

const mdcToTiptapMap: MDCToTipTapMap = {
  ...Object.fromEntries(Object.entries(tagToMark).map(([key, value]) => [key, node => createMark(node as MDCNode, value)])),
  root: node => ({ type: 'doc', content: ((node as MDCElement).children || []).flatMap(child => mdcNodeToTiptap(child, node as MDCNode)) }),
  text: node => createTextNode(node as MDCText),
  comment: node => createTipTapNode(node as MDCElement, 'comment', { attrs: { text: (node as MDCComment).value } }),
  img: node => createTipTapNode(node as MDCElement, 'image', { attrs: { props: (node as MDCElement).props || {} } }),
  // 'nuxt-img': node => createTipTapNode(node as MDCElement, 'image', { attrs: { tag: (node as MDCElement).tag, props: (node as MDCElement).props || {}, src: (node as MDCElement).props?.src, alt: (node as MDCElement).props?.alt } }),
  // 'nuxt-picture': node => createTipTapNode(node as MDCElement, 'image', { attrs: { tag: (node as MDCElement).tag, props: (node as MDCElement).props || {}, src: (node as MDCElement).props?.src, alt: (node as MDCElement).props?.alt } }),
  video: node => createVideoTipTapNode(node as MDCElement),
  template: node => createTemplateNode(node as MDCElement),
  pre: node => createPreNode(node as MDCElement),
  p: node => createParagraphNode(node as MDCElement),
  span: node => createSpanStyleNode(node as MDCElement),
  h1: node => createTipTapNode(node as MDCElement, 'heading', { attrs: { level: 1 } }),
  h2: node => createTipTapNode(node as MDCElement, 'heading', { attrs: { level: 2 } }),
  h3: node => createTipTapNode(node as MDCElement, 'heading', { attrs: { level: 3 } }),
  h4: node => createTipTapNode(node as MDCElement, 'heading', { attrs: { level: 4 } }),
  h5: node => createTipTapNode(node as MDCElement, 'heading', { attrs: { level: 5 } }),
  h6: node => createTipTapNode(node as MDCElement, 'heading', { attrs: { level: 6 } }),
  ul: node => createTipTapNode(node as MDCElement, 'bulletList'),
  ol: node => createTipTapNode(node as MDCElement, 'orderedList', { attrs: { start: (node as MDCElement).props?.start } }),
  li: node => createTipTapNode(node as MDCElement, 'listItem', { children: [{ type: 'element', tag: 'p', children: (node as MDCElement).children }] }),
  blockquote: node => createTipTapNode(node as MDCElement, 'blockquote'),
  binding: node => createTipTapNode(node as MDCElement, 'binding', { attrs: { value: (node as MDCElement).props?.value, defaultValue: (node as MDCElement).props?.defaultValue } }),
  hr: node => createTipTapNode(node as MDCElement, 'horizontalRule'),
  note: node => createCalloutNode(node as MDCElement, 'note'),
  tip: node => createCalloutNode(node as MDCElement, 'tip'),
  warning: node => createCalloutNode(node as MDCElement, 'warning'),
  caution: node => createCalloutNode(node as MDCElement, 'caution'),
}

export function mdcToTiptap(body: MDCRoot, frontmatter: Record<string, unknown>) {
  // Remove invalid text node which added by table syntax
  body.children = (body.children || []).filter(child => child.type !== 'text')

  // This prevents style elements from being loaded into the editor
  removeStyleElementsFromMDC(body)

  const tree = mdcNodeToTiptap(body)

  tree.content = [
    {
      type: 'frontmatter',
      attrs: { frontmatter },
    },
    ...((isEmpty(tree.content) ? [{ type: 'paragraph', content: [] }] : tree.content) as JSONContent[]),
  ]

  return tree
}

export function mdcNodeToTiptap(node: MDCRoot | MDCNode, parent?: MDCNode): JSONContent {
  const type = node.type === 'element' ? node.tag! : node.type

  // Remove duplicate boolean props
  // Object.entries((node as MDCElement).props || {}).forEach(([key, value]) => {
  //   if (key.startsWith(':') && value === 'true') {
  //     const propKey = key.replace(/^:/, '')
  //     Reflect.deleteProperty((node as MDCElement).props!, propKey)
  //   }
  // })

  /**
   * Known ndoe types
   */
  if (mdcToTiptapMap[type]) {
    return mdcToTiptapMap[type](node)
  }

  /**
   * Custom vue components (Elements)
   */

  // If parent is a paragraph, then element should be inline
  if ((parent as MDCElement)?.tag === 'p') {
    return createTipTapNode(node as MDCElement, 'inline-element', { attrs: { tag: type } })
  }

  /**
   * In tiptap side only, inside element, text must be enclosed in a paragraph
   *
   * Note: without having the wrapper paragraph, contents of an element can't be
   * modified, TipTap depend on the paragraph to allow text editing.
   */
  if (node.type === 'element' && node.children?.[0]?.type === 'text') {
    node = {
      ...node,
      props: {
        ...node.props,
        __tiptapWrap: true,
      },
      children: [{
        type: 'element',
        tag: 'p',
        children: node.children,
        props: {},
      }],
    }
  }

  const children = wrapChildrenWithinSlot(((node as MDCElement).children || []) as MDCElement[])

  return createTipTapNode(node as MDCElement, 'element', { attrs: { tag: type }, children })
}

/**
 * Create nodes methods
 */
export function createMark(node: MDCNode, mark: string, accumulatedMarks: { type: string, attrs?: object }[] = []): JSONContent[] {
  const attrs = { ...(node as MDCElement).props }

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

  function getNodeContent(node: MDCNode) {
    if (node.type === 'text') {
      return node.value
    }

    let content = '';

    (node as MDCElement).children?.forEach((childNode) => {
      content += getNodeContent(childNode)
    })

    return content
  }

  if (node.type === 'element' && node.tag === 'code') {
    // Only preserve `language` prop — strip Shiki-added props (className, style, etc.)
    const codeAttrs: Record<string, unknown> = {}
    if (attrs.language) {
      codeAttrs.language = attrs.language
    }
    const codeMarks = [...accumulatedMarks, { type: mark, attrs: codeAttrs }]
    return [{
      type: 'text',
      text: getNodeContent(node),
      marks: codeMarks.slice().reverse(),
    }]
  }

  return ((node as MDCElement).children || []).map((child) => {
    if (child.type === 'text') {
      return {
        type: 'text',
        text: getNodeContent(child),
        marks: marks.slice().reverse(),
      }
    }
    else if (child.type === 'element' && tagToMark[child.tag]) {
      // Recursively process nested mark nodes, passing down all accumulated marks
      return createMark(child, tagToMark[child.tag], marks)
    }
    else if (child.type === 'element') {
      // For non-mark elements (e.g., links), apply marks to their text children
      const tiptapNode = mdcNodeToTiptap(child, node)
      if (tiptapNode.content?.length) {
        tiptapNode.content.forEach((c) => {
          if (c.type === 'text') {
            c.marks = marks.slice().reverse()
          }
        })
      }
      return tiptapNode
    }

    return mdcNodeToTiptap(child, node)
  }).flat()
}

function createTipTapNode(node: MDCElement, type: string, extra: Record<string, unknown> = {}) {
  const { attrs = {}, children, ...rest } = extra
  const cleanProps = Object.entries({ ...((attrs as Record<string, unknown>).props as Record<string, unknown> || {}), ...(node.props || {}) })
    .map(([key, value]) => {
      // Remove MDC attributes
      if (key.startsWith('__mdc_')) {
        return undefined
      }
      return ['className', 'class'].includes(key.trim())
        ? ['class', typeof value === 'string' ? value : (value as Array<string>).join(' ')]
        : [key.trim(), value]
    })
    .filter(Boolean)

  const tiptapNode: Record<string, unknown> = {
    type,
    ...rest,
    attrs,
  }

  if (cleanProps.length) {
    (tiptapNode.attrs as Record<string, unknown>).props = Object.fromEntries(cleanProps as Iterable<readonly [PropertyKey, unknown]>)
  }

  if (children || (node as MDCElement).children) {
    tiptapNode.content = (children as Array<MDCElement> || (node as MDCElement).children || []).flatMap(child => mdcNodeToTiptap(child, node))
  }

  return tiptapNode
}

function createVideoTipTapNode(node: MDCElement) {
  const props = node.props || {}
  const booleanProps = ['controls', 'autoplay', 'loop', 'muted']

  // Normalize boolean properties from string "true"/"false" to actual booleans
  // Also handle props with ':' prefix (e.g., ':controls' from shorthand syntax)
  const normalizedProps = Object.entries(props).reduce((acc, [key, value]) => {
    // Remove ':' prefix if present
    const cleanKey = key.startsWith(':') ? key.substring(1) : key

    if (booleanProps.includes(cleanKey)) {
      // Convert string "true"/"false" to boolean, or keep existing boolean
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

  return createTipTapNode(node, 'video', { attrs: { props: normalizedProps } })
}

function createTemplateNode(node: MDCElement) {
  const name = Object.keys(node.props || {}).find(prop => prop?.startsWith('v-slot:'))?.replace('v-slot:', '') || 'default'

  // Wrap text children in paragraph (TipTap requires text to be in block nodes)
  if (node.children?.[0]?.type === 'text') {
    node.children = [{
      type: 'element',
      tag: 'p',
      children: node.children,
      props: {},
    }]
  }

  return createTipTapNode(node, 'slot', { attrs: { name } })
}

function createPreNode(node: MDCElement) {
  const language = node.props?.language || 'text'
  const filename = node.props?.filename
  const rawCode = node.props?.code as string | undefined

  // When props.code is available use it directly so that indentation and tab characters are preserved exactly as in the source.
  if (rawCode !== undefined) {
    return {
      type: 'codeBlock',
      attrs: { language, filename },
      content: rawCode ? [{ type: 'text', text: rawCode }] : [],
    } as JSONContent
  }

  // Fallback for MDC trees that don't carry props.code
  const tiptapNode = createTipTapNode(node, 'codeBlock', {
    attrs: { language, filename },
  })

  // Remove empty text nodes (not allowed in TipTap codeBlock)
  if ((tiptapNode.content as Array<JSONContent>).length === 1 && ((tiptapNode.content as Array<JSONContent>)[0]).text === '') {
    tiptapNode.content = []
  }

  // Remove marks from code texts
  (tiptapNode.content as Array<JSONContent>).forEach((child: JSONContent) => {
    delete child.marks
  })

  return tiptapNode
}

function createParagraphNode(node: MDCElement) {
  node.children = node.children?.filter(child => !(child.type === 'text' && !child.value)) || []

  // Flatten children if any are arrays (e.g., from createMark)
  const content = node.children
    .map(child => mdcNodeToTiptap(child, node))
    .flat()

  return {
    type: 'paragraph',
    content,
    attrs: isEmpty(node.props) ? undefined : node.props,
  }
}

function createTextNode(node: MDCText) {
  const text = (node as MDCText).value
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

function createSpanStyleNode(node: MDCElement) {
  const spanStyle = (node as MDCElement).props?.style
  const spanClass = (node as MDCElement).props?.class || (node as MDCElement).props?.className
  const spanAttrs = {
    style: isValidAttr(spanStyle) ? String(spanStyle).trim() : undefined,
    class: isValidAttr(spanClass) ? (typeof spanClass === 'string' ? spanClass : (spanClass as Array<string>).join(' ')).trim() : undefined,
  }
  const cleanedNode = { ...(node as MDCElement), props: { ...(node as MDCElement).props } }

  delete (cleanedNode.props as Record<string, unknown>).style
  delete (cleanedNode.props as Record<string, unknown>).class
  delete (cleanedNode.props as Record<string, unknown>).className

  return createTipTapNode(cleanedNode as MDCElement, 'span-style', { attrs: spanAttrs })
}

/**
 * This function makes sure that all children of an element are
 * wrapped in a slot.
 * The children that are not wrapped in a slot are appended to the default slot.
 */
function wrapChildrenWithinSlot(children: MDCElement[]) {
  const noneSlotChildren = children.filter(child => (child as MDCElement).tag !== 'template')
  if (noneSlotChildren.length) {
    children = children.filter(child => (child as MDCElement).tag === 'template')

    let defaultSlot = children.find(child => (child as MDCElement).props?.['v-slot:default']) as MDCElement
    if (!defaultSlot) {
      defaultSlot = {
        type: 'element',
        tag: 'template',
        props: {
          'v-slot:default': '',
        },
        children: [],
      }
      children.unshift(defaultSlot)
    }

    defaultSlot.children = [
      ...(defaultSlot.children || []),
      ...noneSlotChildren,
    ]
  }

  return children
}

function createCalloutNode(node: MDCElement, type: string) {
  const props = { ...(node.props || {}) }
  const content = (node.children || []).flatMap(child => mdcNodeToTiptap(child, node)).filter(n => n.type !== undefined)
  return {
    type: 'u-callout',
    attrs: { type, props },
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
  }
}

/**
 * Remove shiki style elements from MDC tree
 */
function removeStyleElementsFromMDC(node: MDCRoot | MDCNode): void {
  if ('children' in node && Array.isArray(node.children)) {
    // Remove style elements from this level
    node.children = node.children.filter((child: MDCNode) => {
      if (child.type === 'element' && (child as MDCElement).tag === 'style') {
        return false
      }
      return true
    })
    // Recursively clean children
    node.children.forEach((child: MDCNode) => {
      removeStyleElementsFromMDC(child)
    })
  }
}
