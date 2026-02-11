import type { JSONContent } from '@tiptap/vue-3'
import Slugger from 'github-slugger'
import type { Highlighter, Element, MDCElement, MDCNode, MDCRoot, MDCText, MDCComment, RehypeHighlightOption } from '@nuxtjs/mdc'
import { visit } from 'unist-util-visit'
import type { Root } from 'hast'
import type { SyntaxHighlightTheme } from '../../types/content'
import { getEmojiUnicode } from '../emoji'
import { cleanSpanProps, normalizeProps } from './props'
import type { EditorState } from '@tiptap/pm/state'

type TiptapToMDCMap = Record<string, (node: JSONContent) => MDCRoot | MDCNode | MDCNode[]>

interface TiptapToMDCOptions {
  highlightTheme?: SyntaxHighlightTheme
}

const markToTag: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  strike: 'del',
  code: 'code',
}

const tiptapToMDCMap: TiptapToMDCMap = {
  'doc': (node: JSONContent) => ({ type: 'root', children: (node.content || []).flatMap(tiptapNodeToMDC) } as MDCRoot),
  'element': createElement,
  'inline-element': createElement,
  'span-style': (node: JSONContent) => createElement(node, 'span', { props: cleanSpanProps(node.attrs as Record<string, unknown>) }),
  'link': createLinkElement,
  // 'link-element': createElement,
  // 'link-block-element': createElement,
  'text': createTextElement,
  'comment': (node: JSONContent) => ({ type: 'comment', value: node.attrs!.text }),
  'listItem': createListItemElement,
  'slot': (node: JSONContent) => createElement(node, 'template', { props: { [`v-slot:${node.attrs?.name}`]: '' } }),
  'paragraph': (node: JSONContent) => createElement(node, 'p'),
  'bulletList': (node: JSONContent) => createElement(node, 'ul'),
  'orderedList': (node: JSONContent) => createElement(node, 'ol', { props: { start: node.attrs?.start } }),
  'heading': (node: JSONContent) => createHeadingElement(node),
  'blockquote': (node: JSONContent) => createElement(node, 'blockquote'),
  'horizontalRule': (node: JSONContent) => createElement(node, 'hr'),
  'bold': (node: JSONContent) => createElement(node, 'strong'),
  'italic': (node: JSONContent) => createElement(node, 'em'),
  'strike': (node: JSONContent) => createElement(node, 'del'),
  'code': (node: JSONContent) => createElement(node, 'code', { props: node.attrs }),
  'codeBlock': (node: JSONContent) => createCodeBlockElement(node),
  'image': (node: JSONContent) => createImageElement(node),
  'video': (node: JSONContent) => createVideoElement(node),
  'binding': (node: JSONContent) => {
    const defaultValue = (node.attrs as Record<string, unknown> | undefined)?.defaultValue as string
    const value = (node.attrs as Record<string, unknown> | undefined)?.value as string
    return { type: 'element', tag: 'binding', props: { defaultValue, value }, children: [] }
  },
  'br': (node: JSONContent) => createElement(node, 'br'),
}

let slugs = new Slugger()
let shikiHighlighter: Highlighter | undefined
let rehypeShiki: ((opts: RehypeHighlightOption) => (tree: Root) => Promise<void>) | undefined

/*
 ***************************************************************
 ******************** Parsing methods **************************
 ***************************************************************
 */

export async function tiptapToMDC(node: JSONContent, options?: TiptapToMDCOptions): Promise<{ body: MDCRoot, data: Record<string, unknown> }> {
  // re-create slugs
  slugs = new Slugger()

  const mdc: { body: MDCRoot, data: Record<string, unknown> } = {
    body: {} as MDCRoot,
    data: {},
  }

  const nodeCopy = JSON.parse(JSON.stringify(node))
  const fmIndex = nodeCopy.content?.findIndex((child: { type: string }) => child.type === 'frontmatter')
  if (fmIndex > -1) {
    const fm = nodeCopy.content?.[fmIndex]
    nodeCopy.content?.splice(fmIndex, 1)
    try {
      if (fm.attrs?.frontmatter && typeof fm.attrs.frontmatter === 'object') {
        mdc.data = fm.attrs.frontmatter
      }
      else {
        mdc.data = {}
      }
    }
    catch (error) {
      mdc.data = {
        __error__: error,
      }
    }
  }

  mdc.body = tiptapNodeToMDC(nodeCopy) as MDCRoot

  await applyShikiSyntaxHighlighting(mdc.body, options?.highlightTheme)

  return mdc
}

export function tiptapNodeToMDC(node: JSONContent): MDCRoot | MDCNode | MDCNode[] {
  // New list items create an undefined node, so we need to handle it
  if (!node) {
    return {
      type: 'element',
      tag: 'p',
      children: [],
      props: {},
    }
  }

  if (tiptapToMDCMap[node.type!]) {
    return tiptapToMDCMap[node.type!](node)
  }

  if (node.type === 'emoji') {
    return { type: 'text', value: getEmojiUnicode(node.attrs?.name || '') }
  }
  // All unknown nodes should be handled
  return {
    type: 'element',
    tag: 'p',
    children: [
      {
        type: 'text',
        value: `--- Unknown node: ${node.type} ---`,
      },
    ],
    props: {},
  }
}

/**
 * Serialize a portion of the TipTap document to mdc
 */
export async function tiptapSliceToMDC(
  state: EditorState,
  from: number,
  to: number,
): Promise<{ body: MDCRoot, data: Record<string, unknown> }> {
  // Get the document slice
  const slice = state.doc.slice(from, to)

  // Create a temporary document containing just this slice
  const sliceDoc = state.schema.nodeFromJSON({
    type: 'doc',
    content: slice.content.toJSON(),
  })

  // Convert to TipTap JSON
  const tiptapJSON = sliceDoc.toJSON()

  // Skip frontmatter node from the slice (not needed for AI context)
  const content = tiptapJSON.content || []
  const filteredContent = content.filter((node: JSONContent) => node.type !== 'frontmatter')
  const cleanedJSON = {
    ...tiptapJSON,
    content: filteredContent,
  }

  // Convert TipTap JSON to MDC AST
  return await tiptapToMDC(cleanedJSON, {})
}

/***************************************************************
 *********************** Create element methods ****************
 ***************************************************************/

function createElement(node: JSONContent, tag?: string, extra: unknown = {}): MDCElement {
  const { props = {}, ...rest } = extra as { props: object }
  let children = node.content || []

  // Unwrap TipTap wrapper
  // If text was enclosed in a paragraph manually in 'mdcToTiptap' for Tiptap purpose, remove it in MDC
  if (node.attrs?.props?.__tiptapWrap) {
    if (children.length === 1 && children[0]?.type === 'slot') {
      const slot = children[0]

      slot.content = unwrapParagraph(slot.content || [])
    }
    delete node.attrs.props.__tiptapWrap
  }

  // Process element props
  const propsArray = normalizeProps(node.attrs?.props || {}, props)

  if (node.type === 'paragraph') {
    // Empty paragraph
    if (!children || children.length === 0) {
      return { type: 'element', tag: 'p', children: [], props: {} }
    }
    // Create paragraph element
    return createParagraphElement(node, propsArray, rest)
  }

  // Unwrap default slot (reverts `wrapChildrenWithinSlot` from `mdcToTiptap`)
  children = unwrapDefaultSlot(children)

  // Unwrap single paragraph child (MDC auto-unwrap feature)
  children = unwrapParagraph(children)

  return {
    type: 'element',
    tag: tag || node.attrs?.tag,
    children: node.children || children.flatMap(tiptapNodeToMDC),
    ...rest,
    props: Object.fromEntries(propsArray),
  }
}

function createParagraphElement(node: JSONContent, propsArray: Array<[string, string | string[]]>, rest: object = {}): MDCElement {
  const blocks: Array<{ mark: { type: string, attrs?: Record<string, unknown> } | null, content: JSONContent[] }> = []
  let currentBlockContent: JSONContent[] = []
  let currentBlockMark: { type: string, attrs?: Record<string, unknown> } | null = null

  const getMarkInfo = (child: JSONContent): { type: string, attrs?: Record<string, unknown> } | null => {
    if (child.type === 'text' && child.marks?.length === 1 && child.marks?.[0]?.type) {
      return child.marks[0] as { type: string, attrs?: Record<string, unknown> }
    }

    if (
      child.type === 'link-element'
      && child.content
      && child.content.length === 1
      && child.content[0].type === 'text'
      && child.content[0].marks?.length === 1
      && child.content[0].marks?.[0]?.type
    ) {
      return child.content[0].marks?.[0] as { type: string, attrs?: Record<string, unknown> }
    }

    return null
  }

  const sameMark = (markA: { type: string, attrs?: Record<string, unknown> } | null, markB: { type: string, attrs?: Record<string, unknown> } | null) => {
    if (!markA && !markB) return true
    if (!markA || !markB) return false
    return markA.type === markB.type && JSON.stringify(markA.attrs || {}) === JSON.stringify(markB.attrs || {})
  }

  // Separate children into blocks based on number of marks (1 or not one)
  node.content!.forEach((child) => {
    const mark = getMarkInfo(child)

    // If the current mark count is different from the previous block, start a new block
    if (!sameMark(mark, currentBlockMark)) {
      if (currentBlockContent.length > 0) {
        blocks.push({ mark: currentBlockMark, content: currentBlockContent })
      }
      currentBlockContent = []
      currentBlockMark = mark
    }

    // Add the child to the current block
    currentBlockContent.push(child)
  })

  // Push the last block to blocks
  if (currentBlockContent.length > 0) {
    blocks.push({ mark: currentBlockMark, content: currentBlockContent })
  }

  const children = blocks.map((block) => {
    // If the block has more than one child and a mark
    if (block.content.length > 1 && block.mark && markToTag[block.mark.type]) {
      // Remove all marks from children
      block.content.forEach((child: JSONContent) => {
        if (child.type === 'text') {
          delete child.marks
        }
        else if (child.type === 'link-element') {
          delete child.content![0].marks
        }
      })

      const props = block.mark.attrs && Object.keys(block.mark.attrs).length > 0 ? { props: block.mark.attrs } : {}
      // Encapsulate children in a new element with the mark
      return {
        type: 'element',
        tag: markToTag[block.mark.type],
        children: block.content.flatMap(tiptapNodeToMDC),
        ...props,
      }
    }

    return block.content.flatMap(tiptapNodeToMDC)
  }) as MDCElement[]

  const mergedChildren = mergeSiblingsWithSameTag(children.flat(), Object.values(markToTag))

  return {
    type: 'element',
    tag: 'p',
    ...rest,
    props: Object.fromEntries(propsArray),
    children: mergedChildren,
  }
}

function createHeadingElement(node: JSONContent): MDCElement {
  const mdcNode = createElement(node, `h${node.attrs?.level}`)

  mdcNode.props!.id = slugs
    .slug(getNodeContent(node)!)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^(\d)/, '_$1')

  return mdcNode
}

function createCodeBlockElement(node: JSONContent): MDCElement {
  const mdcNode = createElement(node, 'pre')
  mdcNode.props!.code = node.attrs?.code || getNodeContent(node)
  mdcNode.props!.language = node.attrs!.language
  mdcNode.props!.filename = node.attrs!.filename
  mdcNode.children = [{
    type: 'element',
    tag: 'code',
    props: { __ignoreMap: '' },
    children: [{ type: 'text', value: mdcNode.props!.code }],
  }]
  return mdcNode
}

function createImageElement(node: JSONContent): MDCElement {
  // Get props from node.attrs.props (new structure) or fallback to direct attrs (old structure)
  const props = node.attrs?.props || {}
  const imageProps: Record<string, string | number> = {}

  // Only add properties if they have non-empty values
  const src = props.src || node.attrs?.src
  if (src) imageProps.src = src

  const alt = props.alt || node.attrs?.alt
  if (alt) imageProps.alt = alt

  if (props.title) imageProps.title = props.title
  if (props.width) imageProps.width = props.width
  if (props.height) imageProps.height = props.height
  if (props.class) imageProps.class = props.class

  // handle nuxt image components
  if (['nuxt-img', 'nuxt-picture'].includes(node.attrs?.tag)) {
    return createElement(node, node.attrs?.tag, { props: imageProps })
  }
  else {
    return createElement(node, 'img', { props: imageProps })
  }
}

function createVideoElement(node: JSONContent): MDCElement {
  const props = node.attrs?.props || {}
  const videoProps: Record<string, string | boolean | number> = {}

  // Source is required
  if (props.src || node.attrs?.src) {
    videoProps.src = props.src || node.attrs?.src
  }

  // Optional string attributes
  if (props.poster) videoProps.poster = props.poster
  if (props.width) videoProps.width = props.width
  if (props.height) videoProps.height = props.height
  if (props.class) videoProps.class = props.class

  // Optional boolean attributes
  if (props[':controls']) videoProps[':controls'] = 'true'
  if (props[':autoplay']) videoProps[':autoplay'] = 'true'
  if (props[':loop']) videoProps[':loop'] = 'true'
  if (props[':muted']) videoProps[':muted'] = 'true'

  return {
    type: 'element',
    tag: 'video',
    props: videoProps,
    children: (node.content?.flatMap(tiptapNodeToMDC) || []).filter((child): child is MDCElement | MDCText | MDCComment =>
      child.type !== 'root',
    ),
  }
}

function createLinkElement(node: JSONContent): MDCElement {
  const { href, target, rel, class: className, ...otherAttrs } = node.attrs || {}
  const linkProps: Record<string, string> = {}
  if (href) linkProps.href = href
  if (target) linkProps.target = target
  if (rel) linkProps.rel = rel
  if (className) linkProps.class = className
  Object.assign(linkProps, otherAttrs)
  return { type: 'element', tag: 'a', props: linkProps, children: node.children || [] }
}

function createTextElement(node: JSONContent): MDCText | MDCText[] {
  const prefix = node.text?.match(/^\s+/)?.[0] || ''
  const suffix = node.text?.match(/\s+$/)?.[0] || ''
  const text = node.text?.trim() || ''
  if (!node.marks?.length) {
    return { type: 'text', value: node.text! }
  }

  const res = node.marks!.reduce((acc: MDCText, mark: Record<string, unknown>) => {
    if (tiptapToMDCMap[mark.type as string]) {
      return tiptapToMDCMap[mark.type as string]({ ...mark, children: [acc] }) as MDCText
    }
    return acc
  }, { type: 'text', value: text })

  return [
    prefix ? { type: 'text', value: prefix } : null,
    res,
    suffix ? { type: 'text', value: suffix } : null,
  ].filter(Boolean) as MDCText[]
}

function createListItemElement(node: JSONContent) {
  // Remove paragraph children
  node.content = (node.content || []).flatMap((child: JSONContent) => {
    if (child.type === 'paragraph') {
      return child.content
    }

    return child
  })
  return createElement(node, 'li')
}

/***************************************************************
 ******************** Utility methods **************************
 ***************************************************************/

async function applyShikiSyntaxHighlighting(mdc: MDCRoot, theme: SyntaxHighlightTheme = { default: 'github-light', dark: 'github-dark' }) {
  // Clean all style elements from MDC tree before applying syntax highlighting
  if ('children' in mdc && Array.isArray(mdc.children)) {
    mdc.children = mdc.children.filter((child: MDCNode) => {
      if (child.type === 'element' && (child as MDCElement).tag === 'style') {
        return false
      }
      return true
    })
  }

  // @ts-expect-error MDCNode is not compatible with the type of the visitor
  // Convert tag to tagName and props to properties to be compatible with rehype
  visit(mdc, (n: MDCNode) => n.tag !== undefined, (n: MDCNode) => Object.assign(n, { tagName: n.tag, properties: n.props }))

  // Lazy load Shiki
  if (!shikiHighlighter || !rehypeShiki) {
    const [
      { bundledThemes, bundledLanguages: bundledLangs, createJavaScriptRegexEngine },
      { createShikiHighlighter },
      rehypeShikiModule,
    ] = await Promise.all([
      import('shiki'),
      import('@nuxtjs/mdc/runtime/highlighter/shiki'),
      import('@nuxtjs/mdc/dist/runtime/highlighter/rehype'),
    ])

    if (!shikiHighlighter) {
      shikiHighlighter = createShikiHighlighter({ bundledThemes, bundledLangs, engine: createJavaScriptRegexEngine({ forgiving: true }) })
    }

    if (!rehypeShiki) {
      rehypeShiki = rehypeShikiModule.default
    }
  }

  // Apply syntax highlighting
  if (!rehypeShiki) {
    throw new Error('rehypeShiki not initialized')
  }
  const shikit = rehypeShiki({ theme: theme as unknown as Record<string, string>, highlighter: shikiHighlighter })
  // MDCRoot has been transformed to hast Root structure by the visit above (tag→tagName, props→properties)
  await shikit(mdc as unknown as Root)

  // Convert back tagName to tag and properties to props to be compatible with MDC
  visit(
    mdc,
    (n: unknown) => (n as Element).tagName !== undefined,
    (n: unknown) => { Object.assign(n as MDCNode, { tag: (n as Element).tagName, props: (n as Element).properties, tagName: undefined, properties: undefined }) },
  )

  // Remove empty newline text nodes and style elements from code blocks
  visit(
    mdc,
    (n: unknown) => (n as MDCElement).tag === 'pre',
    (n: unknown) => {
      const preNode = n as MDCElement
      const codeNode = preNode.children[0] as MDCElement
      codeNode.children = codeNode.children.filter((child: MDCNode) => {
        // Remove style elements added by Shiki
        if (child.type === 'element' && (child as MDCElement).tag === 'style') {
          return false
        }

        // Remove empty text nodes
        if (child.type === 'text' && !child.value.trim()) {
          return false
        }

        // Keep everything else
        return true
      })
    },
  )
}

/**
 * Unwrap a single child if it matches the specified type
 */
function unwrapParagraph(content: JSONContent[]): JSONContent[] {
  if (content.length === 1 && content[0]?.type === 'paragraph') {
    return content[0].content || []
  }
  return content
}

/**
 * Unwrap a default slot's content directly to parent level
 */
function unwrapDefaultSlot(content: JSONContent[]): JSONContent[] {
  if (content.length === 1 && content[0]?.type === 'slot' && content[0].attrs?.name === 'default') {
    return content[0].content || []
  }
  return content
}

/**
 * Merge adjacent children with the same tag if separated by a single space text node
 */
function mergeSiblingsWithSameTag(children: MDCNode[], allowedTags: string[]): MDCNode[] {
  if (!Array.isArray(children)) return children
  const merged: MDCNode[] = []
  let i = 0
  while (i < children.length) {
    const current = children[i]
    const next = children[i + 1]
    const afterNext = children[i + 2]
    // Check if current and afterNext are elements with the same tag, tag is in allowedTags, and next is a single space text node
    if (
      current && afterNext
      && current.type === 'element' && afterNext.type === 'element'
      && current.tag === afterNext.tag
      && allowedTags.includes(current.tag)
      && JSON.stringify(current.props || {}) === JSON.stringify(afterNext.props || {})
      && next && next.type === 'text' && next.value === ' '
    ) {
      // Merge their children with a space in between
      merged.push({
        ...current,
        children: [
          ...(current.children || []),
          { type: 'text', value: ' ' },
          ...(afterNext.children || []),
        ],
      })
      i += 3 // Skip next and afterNext
    }
    else {
      merged.push(current)
      i++
    }
  }
  return merged
}

function getNodeContent(node: JSONContent) {
  if (node.type === 'text') {
    return node.text
  }

  let content = ''
  node.content?.forEach((childNode) => {
    content += getNodeContent(childNode)
  })

  return content
}
