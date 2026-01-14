import { describe, it, expect } from 'vitest'
import { filterComponents } from '../../src/runtime/server/utils/meta'
import type { ComponentMeta } from 'nuxt-studio/app'

describe('filterComponents', () => {
  const mockMeta: ComponentMeta['meta'] = { props: [], slots: [], events: [] }

  const components: ComponentMeta[] = [
    { name: 'MyComponent', path: 'components/MyComponent.vue', meta: mockMeta },
    { name: 'AwesomeButton', path: 'components/ui/AwesomeButton.vue', meta: mockMeta },
    { name: 'ContentProse', path: 'content/prose/ContentProse.vue', meta: mockMeta },
    { name: 'ContentList', path: 'content/ContentList.vue', meta: mockMeta },
  ]

  it('should exclude components by name', () => {
    const result = filterComponents(components, { exclude: ['MyComponent'] })
    expect(result).toHaveLength(3)
    expect(result.find(c => c.name === 'MyComponent')).toBeUndefined()
  })

  it('should exclude components by path', () => {
    const result = filterComponents(components, { exclude: ['content/prose/**'] })
    expect(result).toHaveLength(3)
    expect(result.find(c => c.name === 'ContentProse')).toBeUndefined()
  })

  it('should support glob patterns', () => {
    const result = filterComponents(components, { exclude: ['Awesome*'] })
    expect(result).toHaveLength(3)
    expect(result.find(c => c.name === 'AwesomeButton')).toBeUndefined()
  })

  it('should handle include whitelist', () => {
    const result = filterComponents(components, { include: ['Content*'] })
    expect(result).toHaveLength(2)
    expect(result.map(c => c.name)).toEqual(['ContentProse', 'ContentList'])
  })

  it('should handle mixed include/exclude', () => {
    // Include all Content*, but exclude specifically ContentProse
    const result = filterComponents(components, {
      include: ['Content*'],
      exclude: ['content/prose/**'],
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toEqual('ContentList')
  })
})
