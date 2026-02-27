import { minimatch } from 'minimatch'
import type { ComponentMeta } from 'nuxt-studio/app'

export interface ComponentGroupConfig {
  label: string
  include: string[]
}

export interface ComponentGroup {
  label: string
  components: ComponentMeta[]
}

/**
 * Matches a component against glob patterns.
 * Pattern with `/` matches component.path, otherwise matches component.name (kebab-case).
 */
function matchAnyPattern(component: ComponentMeta, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const value = pattern.includes('/') ? component.path : component.name
    return minimatch(value, pattern)
  })
}

/**
 * Assigns components to groups based on include patterns.
 * First-match wins when a component matches multiple groups.
 *
 * @param components - Flat list of components to group
 * @param groups - Group configs with label and include patterns
 * @param ungrouped - Whether unmatched components go in a fallback group
 * @param fallbackLabel - Label for the fallback group when ungrouped is 'include'
 * @returns Array of groups with their components (empty groups omitted)
 */
export function assignComponentsToGroups(
  components: ComponentMeta[],
  groups: ComponentGroupConfig[],
  ungrouped: 'include' | 'omit',
  fallbackLabel: string,
): ComponentGroup[] {
  const result: ComponentGroup[] = groups.map(g => ({ label: g.label, components: [] }))
  const unmatched: ComponentMeta[] = []

  for (const component of components) {
    let matched = false
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (group && matchAnyPattern(component, group.include)) {
        result[i]!.components.push(component)
        matched = true
        break
      }
    }
    if (!matched) {
      unmatched.push(component)
    }
  }

  const filtered = result.filter(g => g.components.length > 0)

  if (ungrouped === 'include' && unmatched.length > 0) {
    filtered.push({ label: fallbackLabel, components: unmatched })
  }

  return filtered
}
