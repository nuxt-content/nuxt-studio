/**
 * Resolves Iconify collection prefixes for the Studio icon picker.
 *
 * Field-level `iconLibraries` from the collection schema takes precedence over the
 * global `studio.iconLibraries` Nuxt option. When neither applies, all Iconify
 * collections are searchable.
 *
 * @param fieldOptions - From `FormItem.options` when the schema sets `editor.iconLibraries`
 * @param globalLibraries - From `studio.iconLibraries` in `nuxt.config`
 * @returns `'all'` or a non-empty list of Iconify prefixes
 */
export function resolveIconPickerLibraries(
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
