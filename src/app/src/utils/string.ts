export function stripNumericPrefix(name: string): string {
  return name.replace(/^\d+\./, '')
}
