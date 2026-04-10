import type { SlashCommandConfig, SlashCommandExcludeKey } from '../types/slashCommand'
import { SLASH_COMMAND_EXCLUDE_KEYS } from '../types/slashCommand'

const slashCommandExcludeKeySet = new Set<string>(SLASH_COMMAND_EXCLUDE_KEYS)

function isSlashCommandExcludeKey(key: string): key is SlashCommandExcludeKey {
  return slashCommandExcludeKeySet.has(key)
}

export function normalizeSlashCommandConfig(config?: { exclude?: string[] } | SlashCommandConfig): SlashCommandConfig {
  return {
    exclude: (config?.exclude ?? []).filter(isSlashCommandExcludeKey),
  }
}
