/**
 * Nuxt UI only lets a closing select hand focus back to its trigger while `document.activeElement`
 * is inside the menu, a lookup that stops at Studio's shadow host, so focus drops to `<body>` instead.
 * The next open then reads as focus arriving from outside, which dismisses any popover around the select.
 * Bind on the menu's `closeAutoFocus`.
 */
export function restoreSelectFocus(event: Event, trigger?: HTMLElement) {
  const menu = event.target as HTMLElement
  const { activeElement } = menu.getRootNode() as ShadowRoot

  if (!activeElement || menu.contains(activeElement)) {
    trigger?.focus({ preventScroll: true })
  }
}
