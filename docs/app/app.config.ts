export default defineAppConfig({
  socials: {
    discord: 'https://discord.gg/sBXDm6e8SP',
    bluesky: 'https://go.nuxt.com/bluesky',
    x: 'https://x.com/nuxtstudio',
  },
  toc: {
    bottom: {
      links: [
        {
          icon: 'i-lucide-book-open',
          label: 'Nuxt Content docs',
          to: 'https://content.nuxt.com/docs/getting-started',
          target: '_blank',
        },
        {
          icon: 'i-lucide-book-open',
          label: 'Nuxt UI docs',
          to: 'https://ui.nuxt.com/getting-started/installation/nuxt',
          target: '_blank',
        },
      ],
    },
  },
  ui: {
    colors: {
      primary: 'green',
      secondary: 'sky',
      neutral: 'slate',
    },
    pageSection: {
      slots: {
        title: 'font-semibold lg:text-4xl',
        featureLeadingIcon: 'text-(--ui-text-highlighted)',
      },
    },
  },
  github: {
    rootDir: 'docs',
  },
})
