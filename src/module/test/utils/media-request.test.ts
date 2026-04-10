import { describe, expect, it } from 'vitest'
import { parseMediaRequestBody } from '../../src/runtime/server/utils/media/request'

describe('parseMediaRequestBody', () => {
  it('returns an empty buffer for folder placeholder files', () => {
    const buffer = parseMediaRequestBody(JSON.stringify({ fsPath: 'hello/.gitkeep' }))

    expect(buffer.length).toBe(0)
  })

  it('decodes base64 media payloads', () => {
    const buffer = parseMediaRequestBody(JSON.stringify({ raw: 'data:text/plain;base64,aGVsbG8=' }))

    expect(buffer.toString('utf8')).toBe('hello')
  })

  it('throws on malformed raw payloads', () => {
    expect(() => parseMediaRequestBody(JSON.stringify({ raw: 'hello' }))).toThrow(
      'Invalid media payload: expected a base64 data URL',
    )
  })
})
