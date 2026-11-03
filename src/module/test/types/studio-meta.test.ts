import { describe, expectTypeOf, it } from 'vitest'
import type { StudioComponentMeta } from '../../../app/src/types/editor'

// Checked by `pnpm typecheck`: a `@ts-expect-error` that no longer errors fails it.
interface AuthorCardProps {
  cover?: string
  social?: { github?: string, avatar?: string }
  links?: { label: string, to: string }[]
}

describe('StudioComponentMeta<Props>', () => {
  it('accepts the props and fields of the component', () => {
    const meta = {
      props: {
        cover: { label: 'Cover image', input: 'media' },
        social: { fields: { github: { label: 'GitHub username' } } },
        links: { fields: { to: { label: 'URL' } } },
      },
    } satisfies StudioComponentMeta<AuthorCardProps>

    expectTypeOf(meta).toExtend<StudioComponentMeta<AuthorCardProps>>()
  })

  it('rejects unknown props', () => {
    // @ts-expect-error `title` is not a prop of AuthorCard
    const meta: StudioComponentMeta<AuthorCardProps> = { props: { title: { label: 'Title' } } }

    expectTypeOf(meta).not.toBeAny()
  })

  it('rejects unknown fields of object props and of array items', () => {
    const meta: StudioComponentMeta<AuthorCardProps> = {
      props: {
        // @ts-expect-error `twitter` is not a field of `social`
        social: { fields: { twitter: { label: 'Twitter' } } },
        // @ts-expect-error `href` is not a field of the items of `links`
        links: { fields: { href: { label: 'URL' } } },
      },
    }

    expectTypeOf(meta).not.toBeAny()
  })

  it('rejects fields on a prop that has none', () => {
    // @ts-expect-error `cover` is a string
    const meta: StudioComponentMeta<AuthorCardProps> = { props: { cover: { fields: { url: { label: 'URL' } } } } }

    expectTypeOf(meta).not.toBeAny()
  })

  it('accepts any name without props type', () => {
    const meta = {
      props: { anything: { label: 'Anything', fields: { nested: { label: 'Nested' } } } },
    } satisfies StudioComponentMeta

    expectTypeOf(meta).toExtend<StudioComponentMeta>()
  })
})
