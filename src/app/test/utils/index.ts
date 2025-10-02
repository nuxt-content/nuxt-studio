/**
 * Normalize a storage key using the same logic as unstorage
 */
export function normalizeKey(key: string): string {
  if (!key) {
    return ''
  }

  return key
    .split('?')[0] // Remove query parameters if any
    ?.replace(/[/\\]/g, ':') // Replace forward/back slashes with colons
    .replace(/:+/g, ':') // Replace multiple consecutive colons with single colon
    .replace(/^:|:$/g, '') // Remove leading/trailing colons
    || ''
}

/**
 * Generate a unique test document ID to avoid conflicts between tests
 */
export function generateUniqueDocumentId(filename = 'document'): string {
  const uniqueId = Math.random().toString(36).substr(2, 9)
  return `docs/${filename}-${uniqueId}.md`
}
