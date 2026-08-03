# Cloudinary playground

This playground runs Nuxt Studio with Cloudinary as the external media provider.

## Setup

Cloudinary credentials only configure media storage; Nuxt Studio authentication still requires an auth provider. For GitHub authentication, fill in `STUDIO_GITHUB_CLIENT_ID`, `STUDIO_GITHUB_CLIENT_SECRET`, and `STUDIO_GITHUB_MODERATORS` in `.env` as well.

Copy `.env.example` to `.env` and fill in the server-only Cloudinary credentials:

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=nuxt-studio-playground
```

For a GitHub OAuth application, use this callback URL:

```text
http://localhost:3000/__nuxt_studio/auth/github/callback
```

Then start it from the repository root:

```bash
pnpm run dev:prepare
pnpm --filter nuxt-studio-playground-cloudinary dev
```

Open `http://localhost:3000/admin`, sign in with GitHub, and use the Media tab to upload and manage Cloudinary assets. The `STUDIO_GITHUB_MODERATORS` value must contain the email address of the GitHub account used for testing.
