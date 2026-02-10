---
seo:
  title: Nuxt Studio - Edit your Nuxt Content website in production
  description: Self-hosted, open-source CMS for Nuxt Content websites. Edit content visually, manage media, and publish directly to Git from your production site.
---

::u-page-hero
---
orientation: horizontal
---
#headline
  :::u-button
  ---
  size: sm
  to: https://github.com/nuxt-content/studio
  variant: outline
  trailing-icon: i-lucide-arrow-right
  class: mb-3 rounded-full
  target: _blank
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

#default
  :::browser-frame
  :video{controls loop poster="/video-thumbnail.jpg" src="https://res.cloudinary.com/nuxt/video/upload/v1767647099/studio/studio-demo_eiofld.mp4"}
  :::
::

::u-container{class="pb-12 xl:pb-24"}
  :::u-page-grid
    :::u-page-feature
    ---
    icon: i-lucide-pen-tool
    ---
    #title{unwrap="p"}
    Visual Editor

    #description{unwrap="p"}
    Notion-like editing with MDC component support. Insert Vue components and drag-and-drop blocks.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-form-input
    ---
    #title{unwrap="p"}
    Schema-based Forms

    #description{unwrap="p"}
    Auto-generated forms for Frontmatter and YAML/JSON files based on your collection schema.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-image
    ---
    #title{unwrap="p"}
    Media Library

    #description{unwrap="p"}
    Centralized media management. Browse folders, upload files, and insert images directly.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-git-branch
    ---
    #title{unwrap="p"}
    Git Integration

    #description{unwrap="p"}
    Commit changes directly to GitHub or GitLab. Your CI/CD pipeline handles the rest.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-shield-check
    ---
    #title{unwrap="p"}
    Flexible Auth

    #description{unwrap="p"}
    Secure access with GitHub, GitLab, or Google OAuth. Or implement your own auth flow.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-eye
    ---
    #title{unwrap="p"}
    Real-time Preview

    #description{unwrap="p"}
    See changes instantly on your production website. Drafts are stored locally until published.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-languages
    ---
    #title{unwrap="p"}
    Multi languages

    #description{unwrap="p"}
    Full i18n support for the Studio interface. Available in 25+ languages.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-server
    ---
    #title{unwrap="p"}
    Self-hosted

    #description{unwrap="p"}
    Deploy on your own infrastructure with no external dependencies. Free forever under MIT.
    :::

    :::u-page-feature
    ---
    icon: i-lucide-file-code
    ---
    #title{unwrap="p"}
    Code Editor

    #description{unwrap="p"}
    Monaco editor for Markdown, MDC, YAML, and JSON files. Switch between visual and code modes.
    :::
  :::
::

::u-page-section
#title
Everything you need for content editing

#description
Edit Markdown with Vue components, manage media, and publish to Git. All from your production website.

  :::div{.hidden.md:block}
    ::::u-color-mode-image
    ---
    class: size-full absolute top-0 inset-0
    dark: /home/features-dark.svg
    light: /home/features-light.svg
    ---
    ::::
  :::
::

::u-page-section
---
reverse: true
orientation: horizontal
---
  :::browser-frame
  ![Visual Markdown Editor](/studio/visual-markdown-editor.webp){class="rounded-none" width="1440" height="900"}
  :::

#title
Notion-like [Visual Editor]{.text-primary}

#description
A powerful WYSIWYG editor built on TipTap. Write content naturally with full MDC syntax support for embedding Vue components.

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
  size: xl
  target: _blank
  to: https://github.com/nuxt-content/nuxt-studio
  variant: outline
  label: Learn more about the Visual Editor
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
  ![Schema-based Forms](/studio/json-yml-forms.webp){class="rounded-none" width="1440" height="900"}
  :::

#title
[Schema-based]{.text-(--ui-secondary)} Forms

#description
Forms are automatically generated from your Nuxt Content collection schema. Edit frontmatter, YAML, and JSON files with a beautiful form interface.

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
  Full YAML and JSON support
  :::

  :::u-page-feature
  ---
  icon: i-lucide-list
  ---
  #title{unwrap="p"}
  Frontmatter editing with validation
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
  ![GitHub Sync](/studio/github-sync.webp){class="rounded-none" width="1440" height="900"}
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
  ![Code Editor](/studio/code-editor.webp){class="rounded-none" width="1440" height="900"}
  :::

#title
Full-featured [Code Editor]{.text-(--ui-secondary)}

#description
Need to edit raw content? Switch to the Monaco-powered code editor with syntax highlighting for Markdown, MDC, YAML, and JSON files.

#features
  :::u-page-feature
  ---
  icon: i-lucide-code
  ---
  #title{unwrap="p"}
  Monaco editor with syntax highlighting
  :::

  :::u-page-feature
  ---
  icon: i-lucide-refresh-cw
  ---
  #title{unwrap="p"}
  Switch between visual and code modes
  :::

  :::u-page-feature
  ---
  icon: i-simple-icons-markdown
  ---
  #title{unwrap="p"}
  Full MDC syntax support
  :::

#links
  :::u-button
  ---
  color: neutral
  label: Learn more about the Code Editor
  to: /content#code-editor
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  :::
::

::div{.relative.min-h-[400px]}
  :::div{.hidden.md:block}
  :cta-background
  :::

  ::::u-page-section{.relative.z-10}
  #title
  Start editing your Nuxt website today.

  #links
    :::::u-button
    ---
    label: Get Started
    to: /introduction
    trailingIcon: i-lucide-arrow-right
    ---
    :::::

    :::::u-button
    ---
    color: neutral
    icon: i-simple-icons-github
    target: _blank
    to: https://github.com/nuxt-content/studio
    variant: outline
    ---
    Star on GitHub
    :::::
  ::::
::
