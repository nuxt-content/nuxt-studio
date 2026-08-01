import { defineCollection, defineContentConfig, property } from '@nuxt/content'
import z from 'zod/v3'

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        exclude: ['index.md'],
      },
      schema: z.object({
        hero: z.object({
          image: property(z.string()).editor({ input: 'media', label: 'Cloudinary image' }),
          alt: property(z.string()).editor({ label: 'Alt text' }),
        }).optional(),
      }),
    }),
    landing: defineCollection({
      type: 'page',
      source: 'index.md',
    }),
  },
})
