type MediaRequestBody = {
  raw?: string
}

/**
 * Parses a media upload request body into the file contents that should be written to storage.
 *
 * Folder creation sends a `.gitkeep` media item without a `raw` data URL, so that case must
 * create an empty placeholder file instead of trying to decode binary content.
 *
 * @param value Raw JSON request body received by the media route.
 * @returns The file contents to write to storage.
 * @throws {Error} When a `raw` payload is present but is not a valid base64 data URL.
 * @example
 * parseMediaRequestBody(JSON.stringify({ raw: 'data:text/plain;base64,aGVsbG8=' }))
 */
export function parseMediaRequestBody(value: string | undefined): Buffer {
  const body = JSON.parse(value || '{}') as MediaRequestBody

  if (typeof body.raw !== 'string') {
    return Buffer.alloc(0)
  }

  const [, data] = body.raw.split(';base64,')
  if (!data) {
    throw new Error('Invalid media payload: expected a base64 data URL')
  }

  return Buffer.from(data, 'base64')
}
