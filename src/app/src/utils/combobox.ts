/**
 * Reka closes a combobox when its search input blurs, and checks the new focus with `document`
 * lookups that can't see into Studio's shadow root, so option clicks never land.
 * Bind on an ancestor of the options, which means the menu needs `:portal="false"`.
 */
export function keepComboboxFocus(event: MouseEvent) {
  if ((event.target as Element).closest('[role="option"]')) {
    event.preventDefault()
  }
}
