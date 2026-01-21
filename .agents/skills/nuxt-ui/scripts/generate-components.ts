#!/usr/bin/env npx tsx
/**
 * Generates nuxt-ui component docs from Nuxt UI repo (cloned to /tmp)
 * Run: npx tsx skills/nuxt-ui/scripts/generate-components.ts
 *
 * Creates:
 *   - references/components.md (index with version column for Other category)
 *   - components/<name>.md (per-component details)
 */

import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TMP_DIR = join(tmpdir(), 'nuxt-ui-docs-gen')
const REPO_URL = 'https://github.com/nuxt/ui.git'
const DOCS_PATH = 'docs/content/docs/2.components'

interface ComponentMeta {
  name: string
  description: string
  category: string
  rekaLink?: string
  version?: string
}

// Category groupings for better organization
const CATEGORIES: Record<string, string> = {
  element: 'Element',
  form: 'Form',
  data: 'Data',
  navigation: 'Navigation',
  overlay: 'Overlay',
  layout: 'Layout',
}

// Version mapping for components introduced after v4.0
const VERSION_MAP: Record<string, string> = {
  'empty': 'v4.1+',
  'scroll-area': 'v4.3+',
  'input-date': 'v4.2+',
  'input-time': 'v4.2+',
  'editor': 'v4.3+',
  'editor-drag-handle': 'v4.3+',
  'editor-emoji-menu': 'v4.3+',
  'editor-mention-menu': 'v4.3+',
  'editor-suggestion-menu': 'v4.3+',
  'editor-toolbar': 'v4.3+',
}

function parseYamlFrontmatter(content: string): { frontmatter: Record<string, any>, body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match)
    return { frontmatter: {}, body: content }

  const frontmatter: Record<string, any> = {}
  const yamlContent = match[1]

  // Simple YAML parsing for our needs
  for (const line of yamlContent.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      frontmatter[key] = value.replace(/^['"]|['"]$/g, '')
    }
  }

  // Parse links for Reka UI reference
  if (yamlContent.includes('reka-ui.com')) {
    const rekaMatch = yamlContent.match(/to:\s*(https:\/\/reka-ui\.com[^\n]+)/)
    if (rekaMatch)
      frontmatter.rekaLink = rekaMatch[1]
  }

  return { frontmatter, body: match[2] }
}

function generateComponentFile(name: string, meta: ComponentMeta, body: string): string {
  const lines: string[] = []
  const displayName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

  lines.push(`# ${displayName}`)
  lines.push('')
  lines.push(meta.description)
  lines.push('')

  if (meta.rekaLink) {
    lines.push(`> Based on [Reka UI ${displayName}](${meta.rekaLink})`)
    lines.push('')
  }

  // Extract key props from body text
  const propMentions = body.match(/Use the `(\w+)` prop/g)
  if (propMentions && propMentions.length > 0) {
    lines.push('## Key Props')
    lines.push('')
    const uniqueProps = [...new Set(propMentions.map(m => m.match(/`(\w+)`/)?.[1]).filter(Boolean))]
    for (const prop of uniqueProps.slice(0, 10)) {
      // Find the description after the prop mention
      const propRegex = new RegExp(`Use the \`${prop}\` prop ([^.]+\\.?)`)
      const desc = body.match(propRegex)?.[1] || ''
      lines.push(`- \`${prop}\`: ${desc.replace(/to\s+$/, '').trim()}`)
    }
    lines.push('')
  }

  // Add basic usage
  lines.push('## Usage')
  lines.push('')
  lines.push('```vue')
  lines.push(`<U${displayName}`)
  lines.push(`  <!-- props here -->`)
  lines.push(`/>`)
  lines.push('```')
  lines.push('')

  // Add slot info if present - look for slot mentions in text
  const slotPattern = /`#(\w+)`\{?/g
  const slotMatches = [...body.matchAll(slotPattern)]
  if (slotMatches.length > 0) {
    const validSlots = ['default', 'content', 'header', 'body', 'footer', 'title', 'description', 'leading', 'trailing', 'icon', 'label', 'close', 'trigger', 'actions', 'item', 'empty']
    const uniqueSlots = [...new Set(slotMatches.map(m => m[1]))]
      .filter(s => validSlots.includes(s))
    if (uniqueSlots.length > 0) {
      lines.push('## Slots')
      lines.push('')
      for (const slot of uniqueSlots.slice(0, 8)) {
        lines.push(`- \`#${slot}\``)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const baseDir = join(__dirname, '..')
  const componentsDir = join(baseDir, 'components')

  // Clean previous run and clone fresh
  rmSync(TMP_DIR, { recursive: true, force: true })
  console.log('Cloning nuxt/ui (sparse checkout)...')
  try {
    execSync(`git clone --depth 1 --filter=blob:none --sparse ${REPO_URL} ${TMP_DIR}`, { stdio: 'inherit' })
    execSync(`git sparse-checkout set ${DOCS_PATH}`, { cwd: TMP_DIR, stdio: 'inherit' })
  }
  catch {
    console.error(`\nFailed to clone ${REPO_URL}. Check network/GitHub status.`)
    process.exit(1)
  }

  const NUXT_UI_DOCS = join(TMP_DIR, DOCS_PATH)

  mkdirSync(componentsDir, { recursive: true })

  console.log('Generating Nuxt UI component docs...')

  const files = readdirSync(NUXT_UI_DOCS).filter(f => f.endsWith('.md') && f !== '0.index.md')
  const components: ComponentMeta[] = []

  for (const file of files) {
    const name = basename(file, '.md')
    const content = readFileSync(join(NUXT_UI_DOCS, file), 'utf-8')
    const { frontmatter, body } = parseYamlFrontmatter(content)

    const meta: ComponentMeta = {
      name,
      description: frontmatter.description || '',
      category: frontmatter.category || 'other',
      rekaLink: frontmatter.rekaLink,
      version: VERSION_MAP[name],
    }
    components.push(meta)

    // Generate component file
    const componentContent = generateComponentFile(name, meta, body)
    writeFileSync(join(componentsDir, `${name}.md`), componentContent)
    console.log(`✓ Generated components/${name}.md`)
  }

  // Generate index
  const index: string[] = []
  index.push('# Components')
  index.push('')
  index.push('> Auto-generated from Nuxt UI docs. Run `npx tsx skills/nuxt-ui/scripts/generate-components.ts` to update.')
  index.push('')
  index.push('> **For headless primitives (API, accessibility):** see `reka-ui` skill')
  index.push('')

  // Group by category
  const byCategory: Record<string, ComponentMeta[]> = {}
  for (const comp of components) {
    const cat = CATEGORIES[comp.category] || 'Other'
    if (!byCategory[cat])
      byCategory[cat] = []
    byCategory[cat].push(comp)
  }

  // Calculate column widths for alignment
  function getMaxLengths(comps: ComponentMeta[], hasVersionCol: boolean) {
    let maxComp = 'Component'.length
    let maxDesc = 'Description'.length
    for (const comp of comps) {
      const displayName = comp.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
      const link = `[${displayName}](components/${comp.name}.md)`
      if (link.length > maxComp)
        maxComp = link.length
      const desc = hasVersionCol ? comp.description : (comp.version ? `${comp.description} (${comp.version})` : comp.description)
      if (desc.length > maxDesc)
        maxDesc = desc.length
    }
    return { maxComp, maxDesc }
  }

  for (const [cat, comps] of Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0]))) {
    index.push(`## ${cat}`)
    index.push('')
    const hasVersionCol = cat === 'Other'
    const { maxComp, maxDesc } = getMaxLengths(comps, hasVersionCol)

    if (hasVersionCol) {
      index.push(`| ${'Component'.padEnd(maxComp)} | ${'Description'.padEnd(maxDesc)} | Version |`)
      index.push(`| ${'-'.repeat(maxComp)} | ${'-'.repeat(maxDesc)} | ------- |`)
    }
    else {
      index.push(`| ${'Component'.padEnd(maxComp)} | ${'Description'.padEnd(maxDesc)} |`)
      index.push(`| ${'-'.repeat(maxComp)} | ${'-'.repeat(maxDesc)} |`)
    }

    for (const comp of comps.sort((a, b) => a.name.localeCompare(b.name))) {
      const displayName = comp.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
      const link = `[${displayName}](components/${comp.name}.md)`
      if (hasVersionCol) {
        const desc = comp.version ? `${comp.description} (${comp.version})` : comp.description
        index.push(`| ${link.padEnd(maxComp)} | ${desc.padEnd(maxDesc)} | ${(comp.version || '').padEnd(7)} |`)
      }
      else {
        const desc = comp.version ? `${comp.description} (${comp.version})` : comp.description
        index.push(`| ${link.padEnd(maxComp)} | ${desc.padEnd(maxDesc)} |`)
      }
    }
    index.push('')
  }

  writeFileSync(join(baseDir, 'references', 'components.md'), index.join('\n'))
  console.log('✓ Generated references/components.md (index)')

  console.log(`\nDone! Generated ${components.length + 1} files.`)
}

main().catch(console.error)
