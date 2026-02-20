::::u-page-card
---
spotlight: true
class: col-span-2
target: _blank
---
#default
```ts [app.config.ts]
export default defineAppConfig({
          ui: {
            colors: {
              primary: 'green',
              secondary: 'sky',
            },
          },
          socials: {
            x: 'https://x.com/nuxt_js',
            nuxt: 'https://nuxt.com'
          }
})
```

#title
Customize with [Nuxt App Config](https://nuxt.com/docs/4.x/getting-started/configuration#app-configuration)

#description
Update colors, social links, header logos and component styles globally using the `app.config.ts`, no direct code modifications required.
::::
