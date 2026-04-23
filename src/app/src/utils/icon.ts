export function resolveIconLibraries(
  fieldOptions: string[] | undefined,
  globalLibraries: string[] | undefined,
): 'all' | string[] {
  if (Array.isArray(fieldOptions) && fieldOptions.length > 0) {
    return fieldOptions
  }
  if (Array.isArray(globalLibraries) && globalLibraries.length > 0) {
    return globalLibraries
  }
  return 'all'
}
