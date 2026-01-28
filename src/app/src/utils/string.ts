export function fromBase64ToUTF8(base64: string) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export function slugifyString(str: string): string {
  return str.replace(/[\s_()@#$%^&*+={}';:"<>?/|`~!-]+/g, '-')
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
