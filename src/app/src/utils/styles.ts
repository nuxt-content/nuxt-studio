export function refineTailwindStyles(styles: string) {
  styles = convertPropertyToVar(styles)
  // Replace :root, html, and body with :host
  styles = styles.replace(/:root/g, ':host')
    .replace(/([^-])html/g, '$1:host')
    .replace(/([^-])body/g, '$1:host')

  return styles
}

export function convertPropertyToVar(cssText: string) {
  const propertyRegex = /@property\s+(--[\w-]+)\s*\{([^}]*)\}/g
  const cssVars: string[] = []

  const result = cssText.replace(propertyRegex, (_, propertyName, propertyContent) => {
    const initialValueMatch = propertyContent.match(/initial-value\s*:([^;]+)(;|$)/)

    if (initialValueMatch) {
      let initialValue = initialValueMatch[1].trim()

      if (propertyContent.includes('<length>') && !initialValue.endsWith('px')) {
        initialValue = `${initialValue}px`
      }

      cssVars.push(`${propertyName}: ${initialValue};`)
    }

    return ''
  })

  const cssVarsBlock = cssVars.length > 0 ? `:host {\n  ${cssVars.join('\n  ')}\n}` : ''

  return cssVarsBlock + (cssVarsBlock && result.trim() ? '\n\n' : '') + result.trim()
}
