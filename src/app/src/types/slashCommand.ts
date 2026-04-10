/**
 * Built-in slash command entries in the TipTap `/` menu (Style and Insert sections).
 * Use with `studio.meta.slashCommand.exclude` in `nuxt.config.ts`.
 *
 * - `style` / `insert` remove the entire section.
 * - Other keys remove a single default command (headings use `heading1` … `heading4`).
 */
export type SlashCommandExcludeKey
  = | 'style'
    | 'insert'
    | 'paragraph'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'heading4'
    | 'bulletList'
    | 'orderedList'
    | 'blockquote'
    | 'codeBlock'
    | 'bold'
    | 'italic'
    | 'strike'
    | 'code'
    | 'image'
    | 'video'
    | 'horizontalRule'

/**
 * Configuration for built-in TipTap slash menu defaults (not custom components).
 */
export interface SlashCommandConfig {
  /**
   * Keys to hide from the `/` suggestion menu. Omitted keys remain visible.
   */
  exclude?: SlashCommandExcludeKey[]
}

/** All valid `exclude` keys for runtime validation of server/meta payloads. */
export const SLASH_COMMAND_EXCLUDE_KEYS: readonly SlashCommandExcludeKey[] = [
  'style',
  'insert',
  'paragraph',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'bold',
  'italic',
  'strike',
  'code',
  'image',
  'video',
  'horizontalRule',
]

const slashExcludeKeySet = new Set<string>(SLASH_COMMAND_EXCLUDE_KEYS)

/**
 * @param key - Raw string from config or API.
 * @returns Whether `key` is a supported built-in slash exclude entry.
 */
export function isSlashCommandExcludeKey(key: string): key is SlashCommandExcludeKey {
  return slashExcludeKeySet.has(key)
}
