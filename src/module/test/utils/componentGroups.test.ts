import { describe, it, expect } from 'vitest'
import { assignComponentsToGroups } from '../../src/runtime/utils/componentGroups'
import type { ComponentMeta } from 'nuxt-studio/app'

const mockMeta: ComponentMeta['meta'] = { props: [], slots: [], events: [] }

function createComponent(name: string, path: string): ComponentMeta {
  return { name, path, meta: mockMeta }
}

describe('assignComponentsToGroups', () => {
  const components: ComponentMeta[] = [
    createComponent('content-prose', 'content/prose/ContentProse.vue'),
    createComponent('content-list', 'content/ContentList.vue'),
    createComponent('landing-hero', 'app/components/landing/LandingHero.vue'),
    createComponent('landing-cta', 'app/components/landing/LandingCta.vue'),
    createComponent('ui-button', 'app/components/ui/Button.vue'),
    createComponent('ui-input', 'app/components/ui/Input.vue'),
    createComponent('shared-footer', 'components/SharedFooter.vue'),
  ]

  it('groups components by name pattern', () => {
    const groups = [
      { label: 'Content', include: ['content*'] },
      { label: 'Landing', include: ['landing*'] },
    ]
    const result = assignComponentsToGroups(components, groups, 'omit', 'Components')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ label: 'Content', components: [components[0], components[1]] })
    expect(result[1]).toEqual({ label: 'Landing', components: [components[2], components[3]] })
  })

  it('groups components by path pattern', () => {
    const groups = [
      { label: 'UI', include: ['app/components/ui/**'] },
      { label: 'Landing', include: ['app/components/landing/**'] },
    ]
    const result = assignComponentsToGroups(components, groups, 'omit', 'Components')

    expect(result).toHaveLength(2)
    expect(result[0]?.components.map(c => c.name)).toEqual(['ui-button', 'ui-input'])
    expect(result[1]?.components.map(c => c.name)).toEqual(['landing-hero', 'landing-cta'])
  })

  it('uses first-match when component matches multiple groups', () => {
    const groups = [
      { label: 'Content', include: ['content*', 'app/components/**'] },
      { label: 'Landing', include: ['landing*'] },
    ]
    const result = assignComponentsToGroups(components, groups, 'omit', 'Components')

    expect(result[0]?.label).toBe('Content')
    expect(result[0]?.components.map(c => c.name)).toContain('landing-hero')
    const landingGroup = result.find(g => g.label === 'Landing')
    expect(landingGroup?.components.map(c => c.name) ?? []).not.toContain('landing-hero')
  })

  it('includes unmatched components in fallback group when ungrouped is include', () => {
    const groups = [
      { label: 'Content', include: ['content*'] },
      { label: 'UI', include: ['ui*'] },
    ]
    const result = assignComponentsToGroups(components, groups, 'include', 'Other')

    expect(result).toHaveLength(3)
    const fallback = result.find(g => g.label === 'Other')
    expect(fallback?.components.map(c => c.name)).toEqual([
      'landing-hero',
      'landing-cta',
      'shared-footer',
    ])
  })

  it('omits unmatched components when ungrouped is omit', () => {
    const groups = [
      { label: 'Content', include: ['content*'] },
      { label: 'UI', include: ['ui*'] },
    ]
    const result = assignComponentsToGroups(components, groups, 'omit', 'Components')

    expect(result).toHaveLength(2)
    expect(result.find(g => g.label === 'Components')).toBeUndefined()
    expect(result.flatMap(g => g.components)).toHaveLength(4)
  })

  it('omits empty groups from result', () => {
    const groups = [
      { label: 'Content', include: ['content*'] },
      { label: 'Empty', include: ['nonexistent*'] },
      { label: 'UI', include: ['ui*'] },
    ]
    const result = assignComponentsToGroups(components, groups, 'omit', 'Components')

    expect(result).toHaveLength(2)
    expect(result.map(g => g.label)).toEqual(['Content', 'UI'])
  })

  it('returns fallback group with all components when groups is empty and ungrouped is include', () => {
    const result = assignComponentsToGroups(components, [], 'include', 'Components')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ label: 'Components', components })
  })

  it('returns empty array when groups is empty and ungrouped is omit', () => {
    const result = assignComponentsToGroups(components, [], 'omit', 'Components')

    expect(result).toHaveLength(0)
  })

  it('returns empty array when components is empty', () => {
    const groups = [{ label: 'Content', include: ['content*'] }]
    const result = assignComponentsToGroups([], groups, 'include', 'Components')

    expect(result).toHaveLength(0)
  })

  it('returns only fallback group when no components match any group and ungrouped is include', () => {
    const groups = [
      { label: 'Content', include: ['content*'] },
      { label: 'UI', include: ['ui*'] },
    ]
    const unmatchedOnly = [components[2]!, components[3]!, components[6]!]
    const result = assignComponentsToGroups(unmatchedOnly, groups, 'include', 'Other')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ label: 'Other', components: unmatchedOnly })
  })

  it('returns empty array when no components match and ungrouped is omit', () => {
    const groups = [{ label: 'Content', include: ['content*'] }]
    const unmatchedOnly = [components[4]!, components[5]!, components[6]!]
    const result = assignComponentsToGroups(unmatchedOnly, groups, 'omit', 'Components')

    expect(result).toHaveLength(0)
  })
})
