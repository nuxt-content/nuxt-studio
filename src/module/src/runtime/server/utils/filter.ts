import { minimatch } from 'minimatch'

export interface StudioComponent {
  name: string
  path: string
}

export function filterComponents<T extends StudioComponent>(
  components: T[],
  include: string[] = [],
  exclude: string[] = [],
): T[] {
  // Return early if no components
  if (components.length === 0) {
    return []
  }

  let result = components

  // 1. Filter by include patterns (if any)
  if (include.length > 0) {
    result = result.filter(component => matchAnyPattern(component, include))
  }

  // 2. Filter by exclude patterns (if any)
  if (exclude.length > 0) {
    result = result.filter(component => !matchAnyPattern(component, exclude))
  }

  return result
}

function matchAnyPattern(component: StudioComponent, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const value = pattern.includes('/') ? component.path : component.name
    return minimatch(value, pattern)
  })
}
