import type { AnyExtension } from '@tiptap/core'
import { Emoji } from '@tiptap/extension-emoji'
import { Binding } from './extensions/binding'
import { Callout } from './extensions/callout'
import { CodeBlock } from './extensions/code-block'
import { CustomPlaceholder } from './extensions/custom-placeholder'
import { Element } from './extensions/element'
import { Frontmatter } from './extensions/frontmatter'
import { Image } from './extensions/image'
import { ImagePicker } from './extensions/image-picker'
import { InlineElement } from './extensions/inline-element'
import { Slot } from './extensions/slot'
import { SlotDropGuard } from './extensions/slot-drop-guard'
import { SpanStyle } from './extensions/span-style'
import { Table, TableCell, TableHeader, TableRow } from './extensions/table'
import { Video } from './extensions/video'
import { VideoPicker } from './extensions/video-picker'

export const studioStarterKitOptions = {
  codeBlock: false,
  link: {
    HTMLAttributes: { target: null },
  },
} as const

interface CreateStudioExtensionsOptions {
  placeholder?: string
  hasNuxtUI?: boolean
  resolveInitialSlot?: (tag: string) => string | undefined
  additionalExtensions?: AnyExtension[]
}

export function createStudioExtensions({
  placeholder = '',
  hasNuxtUI = true,
  resolveInitialSlot,
  additionalExtensions = [],
}: CreateStudioExtensionsOptions = {}): AnyExtension[] {
  return [
    CustomPlaceholder.configure({ placeholder }),
    Frontmatter,
    Image,
    ImagePicker,
    VideoPicker,
    Video,
    ...(hasNuxtUI ? [Callout] : []),
    Element.configure({ resolveInitialSlot }),
    InlineElement,
    SpanStyle,
    Slot,
    SlotDropGuard,
    CodeBlock,
    Emoji,
    Binding,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    ...additionalExtensions,
  ]
}
