# BlogPost

A customizable article to display in a blog page.

## Key Props

- `title`: to display the title of the BlogPost.
- `description`: to display the description of the BlogPost.
- `date`: to display the date of the BlogPost.
- `badge`: to display a [Badge](/docs/components/badge) in the BlogPost.
- `image`: to display an image in the BlogPost.
- `authors`: to display a list of [User](/docs/components/user) in the BlogPost as an array of objects with the following properties:

- `name?: string`{lang="ts-type"}
- `description?: string`{lang="ts-type"}
- `avatar?: Omit<AvatarProps, 'size'>`{lang="ts-type"}
- `chip?: boolean | Omit<ChipProps, 'size' | 'inset'>`{lang="ts-type"}
- `size?: UserProps['size']`{lang="ts-type"}
- `orientation?: UserProps['orientation']`{lang="ts-type"}

You can pass any property from the [Link](/docs/components/link#props) component such as `to`, `target`, etc.

- `variant`: to change the style of the BlogPost.
- `orientation`: to change the BlogPost orientation.

## Usage

```vue
<UBlogPost
  <!-- props here -->
/>
```
