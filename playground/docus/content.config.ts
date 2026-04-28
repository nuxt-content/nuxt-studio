import type { DefinedCollection } from '@nuxt/content'
import { defineContentConfig, defineCollection, property } from '@nuxt/content'
import z from 'zod/v3'

const createDocsSchema = () => z.object({
  layout: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    to: z.string(),
    target: z.string().optional(),
  })).optional(),
})

const createAuthorsSchema = () => z.object({
  name: property(z.string()).editor({
    description: 'Full display name shown on the author page',
    tooltip: 'Use your real name or well-known alias',
  }),
  avatar: z.object({
    src: property(z.string()).editor({ input: 'media', label: 'Avatar image', description: 'Profile picture displayed next to the author name' }),
    alt: property(z.string()).editor({ label: 'Alt text', description: 'Describes the image for screen readers and SEO', tooltip: 'Keep it short: "Jane Doe avatar"' }),
  }),
  to: property(z.string()).editor({ label: 'Profile URL', description: 'Link to the author\'s profile page or website' }),
  username: property(z.string()).editor({ tooltip: 'GitHub or GitLab username, used to link commits' }),
  description: property(z.string()).editor({ input: 'textarea', label: 'Bio', description: 'Short biography displayed on the author card', tooltip: 'Aim for 1–2 sentences' }),
  role: z.enum(['creator', 'maintainer', 'contributor']).default('contributor'),
  order: property(z.number()).editor({ description: 'Lower numbers appear first in author listings' }),
  birthDate: property(z.string().date()).editor({ label: 'Date of birth' }),
  lastCommitAt: property(z.string().datetime()).editor({ label: 'Last commit date', tooltip: 'ISO 8601 datetime, e.g. 2024-01-15T12:00:00Z' }),
  icon: property(z.string()).editor({ input: 'icon', iconLibraries: ['lucide'], description: 'Icon shown next to the author name in listings' }),
  isOpenSourceLover: property(z.boolean()).editor({ label: 'Open source lover', tooltip: 'Enables the ❤️ badge on the author card' }).default(true),
  modules: property(z.array(z.string())).editor({ label: 'Maintained modules', description: 'List of Nuxt module names this author maintains' }),
})

const collections: Record<string, DefinedCollection> = {
  pages: defineCollection({
    type: 'page',
    source: {
      include: '3.pages/**/*.md',
      prefix: '/',
    },
  }),
  landing: defineCollection({
    type: 'page',
    source: {
      include: 'index.md',
    },
  }),
  docs: defineCollection({
    type: 'page',
    source: {
      include: '**',
      exclude: ['index.md', '3.pages/**/*.md', 'authors/**/*', 'fs-prefix/**'],
    },
    schema: createDocsSchema(),
  }),
  prefixed: defineCollection({
    type: 'page',
    source: {
      include: 'fs-prefix/**',
      prefix: '/route-prefix',
    },
    schema: createDocsSchema(),
  }),
  authors: defineCollection({
    type: 'data',
    source: {
      include: 'authors/**/*',
    },
    schema: createAuthorsSchema(),
  }),
}

export default defineContentConfig({ collections })
