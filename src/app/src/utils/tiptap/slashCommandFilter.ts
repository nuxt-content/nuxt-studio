import type { EditorSuggestionMenuItem } from '@nuxt/ui/runtime/components/EditorSuggestionMenu.vue.js'

import type { SlashCommandExcludeKey } from '../../types/slashCommand'

/**
 * Maps a slash suggestion row (non-label) to its `studio.meta.slashCommand.exclude` key.
 *
 * @param item - Row from the built-in Style or Insert section (not a section label row).
 * @returns The exclude key, or `null` if the shape is not a known built-in command.
 */
export function suggestionItemToExcludeKey(
  item: EditorSuggestionMenuItem,
): SlashCommandExcludeKey | null {
  if ('type' in item && item.type === 'label') {
    return null
  }

  const row = item as {
    kind?: string
    level?: number
    mark?: string
  }

  if (row.kind === 'heading' && typeof row.level === 'number') {
    const byLevel: Record<number, SlashCommandExcludeKey> = {
      1: 'heading1',
      2: 'heading2',
      3: 'heading3',
      4: 'heading4',
    }
    return byLevel[row.level] ?? null
  }

  if (row.kind === 'mark' && row.mark) {
    if (row.mark === 'bold' || row.mark === 'italic' || row.mark === 'strike' || row.mark === 'code') {
      return row.mark
    }
    return null
  }

  switch (row.kind) {
    case 'paragraph':
    case 'bulletList':
    case 'orderedList':
    case 'blockquote':
    case 'codeBlock':
    case 'image':
    case 'video':
    case 'horizontalRule':
      return row.kind
    default:
      return null
  }
}

type BuiltinSectionId = 'style' | 'insert'

/**
 * Applies `exclude` to the two built-in slash sections (Style, Insert).
 * Drops empty sections and omits orphan labels.
 *
 * @param sections - `[styleSection, insertSection]` each starting with a label row.
 * @param exclude - Keys from module config; unknown keys are ignored.
 */
export function applySlashCommandExclude(
  sections: [EditorSuggestionMenuItem[], EditorSuggestionMenuItem[]],
  exclude: readonly SlashCommandExcludeKey[] | undefined,
): EditorSuggestionMenuItem[][] {
  if (!exclude?.length) {
    return sections
  }

  const set = new Set<string>(exclude)

  const out: EditorSuggestionMenuItem[][] = []
  const ids: BuiltinSectionId[] = ['style', 'insert']

  for (let i = 0; i < sections.length; i++) {
    const sectionId = ids[i]!
    const section = sections[i]!
    const filtered = filterBuiltinSlashSection(section, sectionId, set)
    if (filtered.length > 0) {
      out.push(filtered)
    }
  }

  return out
}

function filterBuiltinSlashSection(
  items: EditorSuggestionMenuItem[],
  sectionId: BuiltinSectionId,
  exclude: Set<string>,
): EditorSuggestionMenuItem[] {
  if (exclude.has(sectionId)) {
    return []
  }

  const [first, ...rest] = items
  if (!first || !('type' in first) || first.type !== 'label') {
    return items
  }

  const filteredCommands = rest.filter((cmd) => {
    const key = suggestionItemToExcludeKey(cmd)
    if (key === null) {
      return true
    }
    return !exclude.has(key)
  })

  if (filteredCommands.length === 0) {
    return []
  }

  return [first, ...filteredCommands]
}
