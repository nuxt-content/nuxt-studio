/**
 * Built-in slash command entries in the TipTap `/` menu (Style and Insert sections).
 * Use with `studio.meta.slashCommand.exclude` in `nuxt.config.ts`.
 *
 * - `style` / `insert` remove the entire section.
 * - Other keys remove a single default command (headings use `heading1` to `heading4`).
 */
export const SLASH_COMMAND_EXCLUDE_KEYS = [
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
] as const

export type SlashCommandExcludeKey = typeof SLASH_COMMAND_EXCLUDE_KEYS[number]

/**
 * Configuration for built-in TipTap slash menu defaults (not custom components).
 */
export interface SlashCommandConfig {
  /**
   * Keys to hide from the `/` suggestion menu. Omitted keys remain visible.
   */
  exclude?: SlashCommandExcludeKey[]
}
