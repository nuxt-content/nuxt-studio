import type { DefinedCollection } from '@nuxt/content'
import { defineCollection, defineContentConfig, property } from '@nuxt/content'
import z from 'zod/v3'

const pageSchema = z.object({
  hero: z.object({
    image: property(z.string()).editor({ input: 'media', label: 'Cloudinary image' }),
    alt: property(z.string()).editor({ label: 'Alt text' }),
  }).optional(),
})

const collections: Record<string, DefinedCollection> = {
  pages: defineCollection({
    type: 'page',
    source: {
      include: '**/*.md',
    },
    schema: pageSchema,
  }),
}

export default defineContentConfig({ collections })
