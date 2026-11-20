import { describe, expect, it } from 'vitest'
import { escapeHTML, isValidCustomAuthURL } from '../../src/runtime/utils/custom-auth'

describe('custom Studio authentication', () => {
  it('accepts a same-origin path', () => {
    expect(isValidCustomAuthURL('/studio-login?redirect=%2Fadmin')).toBe(true)
  })

  it('rejects external and protocol-relative URLs', () => {
    expect(isValidCustomAuthURL('https://example.com/login')).toBe(false)
    expect(isValidCustomAuthURL('//example.com/login')).toBe(false)
    expect(isValidCustomAuthURL('/\\example.com/login')).toBe(false)
  })

  it('escapes custom labels and URLs before rendering HTML', () => {
    expect(escapeHTML(`Continue <with> & 'care'`)).toBe('Continue &lt;with&gt; &amp; &#39;care&#39;')
  })
})
