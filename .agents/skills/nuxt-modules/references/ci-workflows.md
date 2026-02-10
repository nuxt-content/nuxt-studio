# CI Workflow Templates

Copy-paste templates for GitHub Actions.

## Contents

- [ci.yml](#ciyml) - Lint, typecheck, test
- [pkg.yml](#pkgyml) - Preview packages via pkg-pr-new
- [release.yml](#releaseyml) - npm publish + GitHub release
- [npm Trusted Publishing Setup](#npm-trusted-publishing-setup)

---

## ci.yml

Runs lint, typecheck, and tests on every push/PR/tag.

```yaml
name: ci

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install
      - run: pnpm dev:prepare
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

## pkg.yml

Publishes preview packages for every PR via pkg-pr-new.

```yaml
name: pkg.new

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  pkg:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install
      - run: pnpm dev:prepare
      - run: pnpm prepack
      - run: pnpm dlx pkg-pr-new publish
```

## release.yml

Triggered by tag push. Waits for CI, then publishes to npm via OIDC + creates GitHub release.

```yaml
name: release

permissions:
  id-token: write
  contents: write
  actions: read

on:
  push:
    tags:
      - 'v*'

jobs:
  wait-for-ci:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for CI to complete
        uses: lewagon/wait-on-check-action@v1.3.4
        with:
          ref: ${{ github.sha }}
          check-name: ci
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 10

  release:
    needs: wait-for-ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install
      - run: pnpm dev:prepare
      - run: pnpm prepack

      - name: GitHub Release
        run: pnpm dlx changelogithub
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}

      - name: Publish to npm
        run: npm publish --provenance --access public
```

## npm Trusted Publishing Setup (OIDC)

**Preferred method** - No `NPM_TOKEN` secret needed. Uses OIDC for secure, tokenless authentication.

**See also:** [ts-library/ci-workflows.md](../../ts-library/references/ci-workflows.md) for general TypeScript library CI patterns.

### Requirements

1. **Node.js 24+** (npm 11.5.1+ required for OIDC - Node 22 has npm 10.x which fails)
2. **Workflow permissions**: `id-token: write`
3. **Publish command**: must include `--provenance` flag
4. **package.json**: must have `repository` field for provenance verification
5. **npm 2FA setting**: "Require 2FA or granular access token" (first option, allows tokens)

### package.json Requirements

Each package must have a `repository` field or provenance verification fails:

```json
{
  "name": "my-package",
  "repository": { "type": "git", "url": "git+https://github.com/org/repo.git" }
}
```

### Setup Steps

1. **Open package settings**: `https://www.npmjs.com/package/<PACKAGE_NAME>/access`
2. **Scroll to "Publishing access"** section
3. **Click "Add GitHub Actions"** under Trusted Publishers
4. **Fill in the form**:
   - Owner: `<github-org-or-username>`
   - Repository: `<repo-name>`
   - Workflow file: `release.yml`
   - Environment: _(leave empty)_
5. **Click "Add"**

Repeat for each package in your monorepo.

### Troubleshooting

| Error                                         | Cause                    | Fix                                                            |
| --------------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| "Access token expired or revoked" E404        | npm version too old      | Use Node.js 24 (npm 11.5.1+)                                   |
| ENEEDAUTH                                     | Missing registry-url     | Add `registry-url: 'https://registry.npmjs.org'` to setup-node |
| "repository.url is empty" E422                | Missing repository field | Add `repository` to package.json                               |
| "npm/xyz not configured as trusted publisher" | Mismatch in config       | Check owner, repo, workflow filename match exactly             |

### Verify Setup

The workflow uses OIDC when:

- `id-token: write` permission is set
- `--provenance` flag is used
- No `NODE_AUTH_TOKEN` env var is set

npm automatically detects GitHub Actions and authenticates via OIDC.
