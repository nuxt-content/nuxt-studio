import type { JSONContent } from '@tiptap/vue-3'
import Slugger from 'github-slugger'
import type { ComarkTree, ComarkNode, ComarkElement, ComarkComment } from 'comark/ast'
import type { SyntaxHighlightTheme } from '../../types/content'
import { getEmojiUnicode } from '../emoji'
import { cleanSpanProps, normalizeProps } from './props'
import type { EditorState } from '@tiptap/pm/state'
import { highlightCodeBlocks } from 'comark/plugins/highlight'

type TiptapToComarkMap = Record<string, (node: JSONContent) => ComarkNode | ComarkNode[]>

interface TiptapToComarkOptions {
  highlightTheme?: SyntaxHighlightTheme
}

const markToTag: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  strike: 'del',
  code: 'code',
}

// ─── Node map ─────────────────────────────────────────────────────────────────

const tiptapToComarkMap: TiptapToComarkMap = {
  'element': createElement,
  'inline-element': createElement,
  'span-style': (node: JSONContent) => createElement(node, 'span', { props: cleanSpanProps(node.attrs as Record<string, unknown>) }),
  'link': createLinkElement,
  'text': createTextElement,
  'comment': (node: JSONContent) => [null, {}, node.attrs!.text] as unknown as ComarkComment,
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
    return ['binding', { defaultValue, value }] as ComarkElement
  },
  'br': (node: JSONContent) => createElement(node, 'br'),
}

let slugs = new Slugger()

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function tiptapToComark(node: JSONContent, options?: TiptapToComarkOptions): Promise<ComarkTree> {
  // Re-create slugs for fresh ID generation
  slugs = new Slugger()

  const frontmatter: Record<string, unknown> = {}

  const nodeCopy = JSON.parse(JSON.stringify(node))
  const fmIndex = nodeCopy.content?.findIndex((child: { type: string }) => child.type === 'frontmatter')
  if (fmIndex > -1) {
    const fm = nodeCopy.content?.[fmIndex]
    nodeCopy.content?.splice(fmIndex, 1)
    try {
      if (fm.attrs?.frontmatter && typeof fm.attrs.frontmatter === 'object') {
        Object.assign(frontmatter, fm.attrs.frontmatter)
      }
    }
    catch (error) {
      Object.assign(frontmatter, { __error__: error })
    }
  }

  const nodes = (nodeCopy.content || []).flatMap(tiptapNodeToComark).filter(Boolean) as ComarkNode[]

  const tree: ComarkTree = {
    nodes,
    frontmatter,
    meta: {},
  }

  await applyShikiSyntaxHighlighting(tree, options?.highlightTheme)

  return tree
}

export function tiptapNodeToComark(node: JSONContent): ComarkNode | ComarkNode[] {
  // New list items create an undefined node, so we need to handle it
  if (!node) {
    return ['p', {}] as ComarkElement
  }

  if (tiptapToComarkMap[node.type!]) {
    return tiptapToComarkMap[node.type!](node)
  }

  if (node.type === 'emoji') {
    return getEmojiUnicode(node.attrs?.name || '') as ComarkNode
  }

  // All unknown nodes become a paragraph with an error message
  return ['p', {}, `--- Unknown node: ${node.type} ---`] as ComarkElement
}

/**
 * Serialize a portion of the TipTap document to a ComarkTree
 */
export async function tiptapSliceToComark(
  state: EditorState,
  from: number,
  to: number,
): Promise<ComarkTree> {
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
  const filteredContent = content.filter((n: JSONContent) => n.type !== 'frontmatter')
  const cleanedJSON = {
    ...tiptapJSON,
    content: filteredContent,
  }

  return await tiptapToComark(cleanedJSON, {})
}

// ─── Element creation helpers ─────────────────────────────────────────────────

function createElement(node: JSONContent, tag?: string, extra: unknown = {}): ComarkElement {
  const { props = {}, ...rest } = extra as { props: object }
  let children = node.content || []

  // Unwrap TipTap wrapper
  // If text was enclosed in a paragraph manually in 'comarkToTiptap' for TipTap purpose, remove it in comark
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
      return ['p', {}] as ComarkElement
    }
    // Create paragraph element
    return createParagraphElement(node, propsArray, rest)
  }

  // Unwrap default slot (reverts `wrapChildrenWithinSlot` from `comarkToTiptap`)
  children = unwrapDefaultSlot(children)

  // Unwrap single paragraph child (MDC auto-unwrap feature)
  children = unwrapParagraph(children)

  const elementProps = Object.fromEntries(propsArray)
  const elementChildren = (node.children || children.flatMap(tiptapNodeToComark)) as ComarkNode[]

  return [tag || node.attrs?.tag, elementProps, ...elementChildren] as ComarkElement
}

function createParagraphElement(node: JSONContent, propsArray: Array<[string, string | string[]]>, _rest: object = {}): ComarkElement {
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

  // Separate children into blocks based on number of marks
  node.content!.forEach((child) => {
    const mark = getMarkInfo(child)

    if (!sameMark(mark, currentBlockMark)) {
      if (currentBlockContent.length > 0) {
        blocks.push({ mark: currentBlockMark, content: currentBlockContent })
      }
      currentBlockContent = []
      currentBlockMark = mark
    }

    currentBlockContent.push(child)
  })

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

      const markAttrs = (block.mark.attrs && Object.keys(block.mark.attrs).length > 0) ? (block.mark.attrs as Record<string, unknown>) : {}
      return [markToTag[block.mark.type], markAttrs, ...block.content.flatMap(tiptapNodeToComark)] as ComarkElement
    }

    return block.content.flatMap(tiptapNodeToComark)
  }) as ComarkNode[][]

  const flatChildren = (children as Array<ComarkElement | ComarkNode[]>).flat() as ComarkNode[]
  const mergedChildren = mergeSiblingsWithSameTag(flatChildren, Object.values(markToTag))

  return ['p', Object.fromEntries(propsArray), ...mergedChildren] as ComarkElement
}

function createHeadingElement(node: JSONContent): ComarkElement {
  const headingEl = createElement(node, `h${node.attrs?.level}`) as ComarkElement
  const [tag, attrs, ...children] = headingEl

  const id = slugs
    .slug(getNodeContent(node)!)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^(\d)/, '_$1')

  return [tag, { ...attrs as object, id }, ...children] as ComarkElement
}

function createCodeBlockElement(node: JSONContent): ComarkElement {
  const headingEl = createElement(node, 'pre') as ComarkElement
  const [tag, attrs, ...children] = headingEl

  const code = node.attrs?.code || getNodeContent(node)
  const language = node.attrs!.language
  const filename = node.attrs!.filename

  const codeChild: ComarkElement = ['code', { __ignoreMap: '' }, code as ComarkNode]

  return [tag, { ...attrs as object, code, language, filename }, codeChild] as ComarkElement
}

function createImageElement(node: JSONContent): ComarkElement {
  const props = node.attrs?.props || {}
  const imageProps: Record<string, string | number> = {}

  const src = props.src || node.attrs?.src
  if (src) imageProps.src = src

  const alt = props.alt || node.attrs?.alt
  if (alt) imageProps.alt = alt

  if (props.title) imageProps.title = props.title
  if (props.width) imageProps.width = props.width
  if (props.height) imageProps.height = props.height
  if (props.class) imageProps.class = props.class

  // Handle nuxt image components
  if (['nuxt-img', 'nuxt-picture'].includes(node.attrs?.tag)) {
    return createElement(node, node.attrs?.tag, { props: imageProps }) as ComarkElement
  }
  else {
    return createElement(node, 'img', { props: imageProps }) as ComarkElement
  }
}

function createVideoElement(node: JSONContent): ComarkElement {
  const props = node.attrs?.props || {}
  const videoProps: Record<string, string | boolean | number> = {}

  if (props.src || node.attrs?.src) {
    videoProps.src = props.src || node.attrs?.src
  }

  if (props.poster) videoProps.poster = props.poster
  if (props.width) videoProps.width = props.width
  if (props.height) videoProps.height = props.height
  if (props.class) videoProps.class = props.class

  if (props[':controls']) videoProps[':controls'] = 'true'
  if (props[':autoplay']) videoProps[':autoplay'] = 'true'
  if (props[':loop']) videoProps[':loop'] = 'true'
  if (props[':muted']) videoProps[':muted'] = 'true'

  const children = (node.content?.flatMap(tiptapNodeToComark) || []) as ComarkNode[]
  return ['video', videoProps, ...children] as ComarkElement
}

function createLinkElement(node: JSONContent): ComarkElement {
  const { href, target, rel, class: className, ...otherAttrs } = node.attrs || {}
  const linkProps: Record<string, string> = {}
  if (href) linkProps.href = href
  if (target) linkProps.target = target
  if (rel) linkProps.rel = rel
  if (className) linkProps.class = className
  Object.assign(linkProps, otherAttrs)
  const children = (node.children || []) as ComarkNode[]
  return ['a', linkProps, ...children] as ComarkElement
}

function createTextElement(node: JSONContent): ComarkNode | ComarkNode[] {
  const prefix = node.text?.match(/^\s+/)?.[0] || ''
  const suffix = node.text?.match(/\s+$/)?.[0] || ''
  const text = node.text?.trim() || ''

  if (!node.marks?.length) {
    return node.text! as ComarkNode
  }

  const res = node.marks!.reduce((acc: ComarkNode, mark: Record<string, unknown>) => {
    const markAttrs = (mark.attrs as Record<string, unknown>) || {}
    if (mark.type === 'link') {
      const linkAttrs: Record<string, string> = {}
      if (markAttrs.href) linkAttrs.href = String(markAttrs.href)
      if (markAttrs.target) linkAttrs.target = String(markAttrs.target)
      if (markAttrs.rel) linkAttrs.rel = String(markAttrs.rel)
      if (markAttrs.class) linkAttrs.class = String(markAttrs.class)
      return ['a', linkAttrs, acc] as ComarkElement
    }
    const markTag = markToTag[mark.type as string]
    if (markTag) {
      const elementAttrs = Object.keys(markAttrs).length > 0 ? markAttrs : {}
      return [markTag, elementAttrs, acc] as ComarkElement
    }
    return acc
  }, text as ComarkNode)

  return [
    prefix ? prefix as ComarkNode : null,
    res,
    suffix ? suffix as ComarkNode : null,
  ].filter(Boolean) as ComarkNode[]
}

function createListItemElement(node: JSONContent): ComarkElement {
  // Remove paragraph children
  node.content = (node.content || []).flatMap((child: JSONContent) => {
    if (child.type === 'paragraph') {
      return child.content || []
    }

    return child
  })
  return createElement(node, 'li') as ComarkElement
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function applyShikiSyntaxHighlighting(tree: ComarkTree, theme: SyntaxHighlightTheme = { default: 'github-light', dark: 'github-dark' }) {
  // Clean all style element nodes before applying syntax highlighting
  tree.nodes = tree.nodes.filter((node) => {
    if (!Array.isArray(node) || node[0] === null) return true
    return (node as ComarkElement)[0] !== 'style'
  })

  const themes: Record<string, string> = {
    default: theme.default || 'github-light',
    dark: theme.dark || 'github-dark',
    ...(theme.light ? { light: theme.light } : {}),
  }

  const highlighted = await highlightCodeBlocks(tree, { themes })
  tree.nodes = highlighted.nodes
}

function unwrapParagraph(content: JSONContent[]): JSONContent[] {
  if (content.length === 1 && content[0]?.type === 'paragraph') {
    return content[0].content || []
  }
  return content
}

function unwrapDefaultSlot(content: JSONContent[]): JSONContent[] {
  if (content.length === 1 && content[0]?.type === 'slot' && content[0].attrs?.name === 'default') {
    return content[0].content || []
  }
  return content
}

/**
 * Merge adjacent children with the same tag if separated by a single space text node
 */
function mergeSiblingsWithSameTag(children: ComarkNode[], allowedTags: string[]): ComarkNode[] {
  if (!Array.isArray(children)) return children
  const merged: ComarkNode[] = []
  let i = 0
  while (i < children.length) {
    const current = children[i]
    const next = children[i + 1]
    const afterNext = children[i + 2]

    const isEl = (n: ComarkNode) => Array.isArray(n) && n[0] !== null
    const elTag = (n: ComarkNode) => (n as ComarkElement)[0] as string
    const elAttrs = (n: ComarkNode) => (n as ComarkElement)[1] as Record<string, unknown>
    const elChildren = (n: ComarkNode) => (n as ComarkElement).slice(2) as ComarkNode[]

    if (
      current && afterNext
      && isEl(current) && isEl(afterNext)
      && elTag(current) === elTag(afterNext)
      && allowedTags.includes(elTag(current))
      && JSON.stringify(elAttrs(current) || {}) === JSON.stringify(elAttrs(afterNext) || {})
      && next && typeof next === 'string' && next === ' '
    ) {
      merged.push([
        elTag(current),
        elAttrs(current),
        ...elChildren(current),
        ' ' as ComarkNode,
        ...elChildren(afterNext),
      ] as ComarkElement)
      i += 3
    }
    else {
      merged.push(current)
      i++
    }
  }
  return merged
}

function getNodeContent(node: JSONContent): string | undefined {
  if (node.type === 'text') {
    return node.text
  }

  let content = ''
  node.content?.forEach((childNode) => {
    content += getNodeContent(childNode)
  })

  return content
}
