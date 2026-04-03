import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveIpxSource } from '../../src/runtime/server/utils/media/ipx'

const { runtimeConfig } = vi.hoisted(() => ({
  runtimeConfig: {
    public: {
      studio: {
        media: {
          external: false,
          publicUrl: '',
        },
      },
    },
  },
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: () => runtimeConfig,
}))

describe('resolveIpxSource', () => {
  beforeEach(() => {
    runtimeConfig.public.studio.media.external = false
    runtimeConfig.public.studio.media.publicUrl = ''
  })

  it('resolves local paths against the current request origin', () => {
    expect(resolveIpxSource('/mountains.webp', new URL('http://localhost:3000/__nuxt_studio/ipx/_/mountains.webp'))).toEqual({
      sourceId: 'http://localhost:3000/mountains.webp',
      domain: 'localhost:3000',
    })
  })

  it('allows configured external media domains', () => {
    runtimeConfig.public.studio.media.external = true
    runtimeConfig.public.studio.media.publicUrl = 'https://cdn.example.com'

    expect(resolveIpxSource('https://cdn.example.com/mountains.webp', new URL('https://studio.example.com/__nuxt_studio/ipx/_/https://cdn.example.com/mountains.webp'))).toEqual({
      sourceId: 'https://cdn.example.com/mountains.webp',
      domain: 'cdn.example.com',
    })
  })

  it('rejects external media from unconfigured domains', () => {
    runtimeConfig.public.studio.media.external = true
    runtimeConfig.public.studio.media.publicUrl = 'https://cdn.example.com'

    expect(() => resolveIpxSource('https://other.example.com/mountains.webp', new URL('https://studio.example.com/__nuxt_studio/ipx/_/https://other.example.com/mountains.webp'))).toThrowErrorMatchingInlineSnapshot(`[Error: IPX_FORBIDDEN_DOMAIN]`)
  })
})
