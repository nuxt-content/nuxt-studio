export function isValidCustomAuthURL(value: string) {
  const hasUnsafeCharacter = Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 0x20 || code === 0x7F
  })

  return value.startsWith('/') && !value.startsWith('//') && !hasUnsafeCharacter
}

export function escapeHTML(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    [String.fromCharCode(39)]: '&#39;',
  }[character]!))
}
