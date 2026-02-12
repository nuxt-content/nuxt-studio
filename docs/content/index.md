---
seo:
  title: Nuxt Studio - Edit your Nuxt Content website in production
  description: Self-hosted, open-source CMS for Nuxt Content websites. Edit content visually, manage media, and publish directly to Git from your production site.
---

::u-page-hero
---
orientation: horizontal
---
  :::browser-frame
  :video{controls loop poster="/video-thumbnail.jpg" src="https://res.cloudinary.com/nuxt/video/upload/v1767647099/studio/studio-demo_eiofld.mp4"}
  :::

#headline
  :::u-button
  ---
  class: mb-3 rounded-full
  size: sm
  target: _blank
  to: https://github.com/nuxt-content/studio
  trailing-icon: i-lucide-arrow-right
  variant: outline
  ---
  Open Source & Self-hosted
  :::

#title
Edit your [Nuxt]{.text-primary} :br website in production.

#description
Self-hosted CMS for Nuxt Content websites. Edit content visually, manage media, and publish changes directly to Git from your production site.

#links
  :::u-button
  ---
  label: Get Started
  size: lg
  to: /introduction
  trailingIcon: i-lucide-arrow-right
  ---
  :::

:u-input-copy{value="npx nuxi module add nuxt-studio"}
::

::u-container{.pb-12.xl:pb-24}
  :::u-page-grid
    ::::u-page-feature
    ---
    icon: i-lucide-pen-tool
    ---
    #title{unwrap="p"}
    Visual Editor

    #description{unwrap="p"}
    Notion-like editing with MDC component support. Insert Vue components and drag-and-drop blocks.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-form-input
    ---
    #title{unwrap="p"}
    Schema-based Forms

    #description{unwrap="p"}
    Auto-generated forms for Frontmatter and YAML/JSON files based on your collection schema.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-image
    ---
    #title{unwrap="p"}
    Media Library

    #description{unwrap="p"}
    Centralized media management. Browse folders, upload files, and insert images directly.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-git-branch
    ---
    #title{unwrap="p"}
    Git Integration

    #description{unwrap="p"}
    Commit changes directly to GitHub or GitLab. Your CI/CD pipeline handles the rest.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-shield-check
    ---
    #title{unwrap="p"}
    Flexible Auth

    #description{unwrap="p"}
    Secure access with GitHub, GitLab, or Google OAuth. Or implement your own auth flow.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-eye
    ---
    #title{unwrap="p"}
    Real-time Preview

    #description{unwrap="p"}
    See changes instantly on your production website. Drafts are stored locally until published.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-languages
    ---
    #title{unwrap="p"}
    Multi languages

    #description{unwrap="p"}
    Full i18n support for the Studio interface. Available in 25+ languages.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-server
    ---
    #title{unwrap="p"}
    Self-hosted

    #description{unwrap="p"}
    Deploy on your own infrastructure with no external dependencies. Free forever under MIT.
    ::::

    ::::u-page-feature
    ---
    icon: i-lucide-file-code
    ---
    #title{unwrap="p"}
    Code Editor

    #description{unwrap="p"}
    Monaco editor for Markdown, MDC, YAML, and JSON files. Switch between visual and code modes.
    ::::
  :::
::

::u-page-section
#title
Everything you need for content editing

#description
Edit **Markdown** with **Vue** components, structure data using **YAML** and **JSON** forms, manage media assets and publish directly to **Git**. All from your live production website.
::

::u-page-section
---
reverse: true
orientation: horizontal
---
  :::browser-frame
  ![Visual Markdown Editor](/studio/visual-markdown-editor.webp){.rounded-none height="900" width="1440"}
  :::

#title
Notion-like [Visual Editor]{.text-primary}

#description
A powerful editor built on TipTap that enables natural content creation while automatically generating complete MDC syntax behind the scenes. Integrate interactive components directly within your content.

#features
  :::u-page-feature
  ---
  icon: i-lucide-puzzle
  ---
  #title{unwrap="p"}
  Insert Vue components with props and slots
  :::

  :::u-page-feature
  ---
  icon: i-lucide-move
  ---
  #title{unwrap="p"}
  Drag and drop content blocks
  :::

  :::u-page-feature
  ---
  icon: i-lucide-eye
  ---
  #title{unwrap="p"}
  Real-time preview on your production site
  :::

#links
  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  label: Learn more about the Visual Editor
  size: lg
  target: _blank
  to: /content
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  :::
::

::u-page-section
---
orientation: horizontal
---
  :::browser-frame
  ![Schema-based Forms](/studio/json-yml-forms.webp){.rounded-none height="900" width="1440"}
  :::

#title
[Schema-based]{.text-primary} Forms

#description
Forms are automatically generated from your [Nuxt Content](https://content.nuxt.com) collection schema. Edit frontmatter, YAML, and JSON files with a beautiful form interface.

#features
  :::u-page-feature
  ---
  icon: i-lucide-layout-grid
  ---
  #title{unwrap="p"}
  Auto-generated from collection schema
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-json
  ---
  #title{unwrap="p"}
  YAML and JSON support
  :::

  :::u-page-feature
  ---
  icon: i-lucide-list
  ---
  #title{unwrap="p"}
  Frontmatter edition
  :::

#links
  :::u-button
  ---
  color: neutral
  label: Learn more about Forms
  to: /content#form-editor
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  :::
::

::u-page-section
---
reverse: true
orientation: horizontal
---
  :::browser-frame
  ![GitHub Sync](/studio/github-sync.webp){.rounded-none height="900" width="1440"}
  :::

#title
Commit to [Git]{.text-primary} directly

#description
Publish changes directly to GitHub or GitLab from your production site. Your CI/CD pipeline automatically rebuilds and deploys the updated content.

#features
  :::u-page-feature
  ---
  icon: i-simple-icons-github
  ---
  #title{unwrap="p"}
  GitHub and GitLab support
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title{unwrap="p"}
  Flexible OAuth authentication
  :::

  :::u-page-feature
  ---
  icon: i-lucide-workflow
  ---
  #title{unwrap="p"}
  Triggers your CI/CD pipeline
  :::

#links
  :::u-button
  ---
  color: neutral
  label: Configure Git providers
  to: /git-providers
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  :::
::

::u-page-section
---
orientation: horizontal
---
  :::browser-frame
  :video{controls loop muted src="https://res.cloudinary.com/nuxt/video/upload/v1770661582/studio/studio-ai_bsmqs6.mp4"}
  :::

#title
[AI Powered]{.text-primary} content generation

#description
Leverage [Vercel AI Gateway](https://vercel.com/ai-gateway) to automatically generate and refine your content. The system intelligently adapts based on your project context, cursor position, active components, and overall project architecture.

#features
  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title{unwrap="p"}
  Built-in features (grammar check, improvements, translation...)
  :::

  :::u-page-feature
  ---
  icon: i-lucide-brain
  ---
  #title{unwrap="p"}
  Contextualized autocompletion
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  ---
  #title{unwrap="p"}
  One environment variable setup
  :::

#links
  :::u-button
  ---
  color: neutral
  label: Learn more about AI integration
  to: /ai
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  :::
::

::div{.relative.min-h-[400px]}
  :::div{.hidden.md:block}
  :cta-background
  :::

  :::u-page-section
  ---
  class: relative z-10
  ---
  #title
  Start editing your Nuxt website today.

  #links
  :u-button{label="Get Started" to="/introduction" trailing-icon="i-lucide-arrow-right"}

    ::::u-button
    ---
    color: neutral
    icon: i-simple-icons-github
    target: _blank
    to: https://github.com/nuxt-content/studio
    variant: outline
    ---
    Star on GitHub
    ::::
  :::
::
