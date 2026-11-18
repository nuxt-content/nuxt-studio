import { defu } from 'defu'
import type { ExtendHookData } from 'nuxt-component-meta'
import { describe, expect, it, vi } from 'vitest'
import { dropPreviousStudioMeta, refreshStudioMetaOnChange } from '../../src/component-meta'

type Transformer = NonNullable<ExtendHookData['transformers']>[number]

describe('refreshStudioMetaOnChange', () => {
  const hook = vi.fn()

  refreshStudioMetaOnChange({ hook })

  const [hookName, extendParserOptions] = hook.mock.calls[0]!

  const builtInTransformer: Transformer = (component, code) => ({ component, code })

  function registerTransformers() {
    const parserOptions: Partial<ExtendHookData> = { transformers: [builtInTransformer] }

    extendParserOptions(parserOptions)
    // nuxt-component-meta calls the hook again with the same options whenever components change
    extendParserOptions(parserOptions)

    return parserOptions.transformers!
  }

  // What nuxt-component-meta does when a component file changes
  function parseAgain(component: { meta: Record<string, unknown> }, studio?: Record<string, unknown>) {
    for (const transform of registerTransformers()) {
      transform(component, '<template />')
    }

    const macroResults = studio ? [{ studio }] : []

    for (const result of macroResults) {
      component.meta = defu(component.meta, result)
    }

    return component.meta
  }

  it('registers the transformer once, after the existing ones', () => {
    expect(hookName).toBe('component-meta:extend')
    expect(registerTransformers()).toStrictEqual([builtInTransformer, dropPreviousStudioMeta])
  })

  it('replaces the previous annotations when a label is edited', () => {
    const component = { meta: { props: [], studio: { props: { title: { label: 'Old label' } } } } }

    expect(parseAgain(component, { props: { title: { label: 'New label' } } })).toStrictEqual({
      props: [],
      studio: { props: { title: { label: 'New label' } } },
    })
  })

  it('drops the annotations when defineStudioMeta() is removed', () => {
    const component = { meta: { props: [], studio: { props: { title: { label: 'Old label' } } } } }

    expect(parseAgain(component)).toStrictEqual({ props: [] })
  })
})
