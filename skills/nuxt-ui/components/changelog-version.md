# ChangelogVersion

A customizable article to display in a changelog.

## Key Props

- `title`: to display the title of the ChangelogVersion.
- `description`: to display the description of the ChangelogVersion.
- `date`: to display the date of the ChangelogVersion.
- `badge`: to display a [Badge](/docs/components/badge) on the ChangelogVersion.
- `image`: to display an image in the BlogPost.
- `authors`: to display a list of [User](/docs/components/user) in the ChangelogVersion as an array of objects with the following properties:

- `name?: string`{lang="ts-type"}
- `description?: string`{lang="ts-type"}
- `avatar?: Omit<AvatarProps, 'size'>`{lang="ts-type"}
- `chip?: boolean | Omit<ChipProps, 'size' | 'inset'>`{lang="ts-type"}
- `size?: UserProps['size']`{lang="ts-type"}
- `orientation?: UserProps['orientation']`{lang="ts-type"}

You can pass any property from the [Link](/docs/components/link#props) component such as `to`, `target`, etc.

- `indicator`: to hide the indicator dot on the left.

## Usage

```vue
<UChangelogVersion
  <!-- props here -->
/>
```
