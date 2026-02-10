# AuthForm

A customizable Form to create login, register or password reset forms.

## Key Props

- `fields`: as an array of objects with the following properties:

- `name: string`{lang="ts-type"}
- `type: 'checkbox' | 'select' | 'otp' | 'InputHTMLAttributes['type']'`{lang="ts-type"}

Each field must include a `type` property, which determines the input component and any additional props applied: `checkbox` fields use [Checkbox](/docs/components/checkbox#props) props, `select` fields use [SelectMenu](/docs/components/select-menu#props) props, `otp` fields use [PinInput](/docs/components/pin-input#props) props, and all other types use [Input](/docs/components/input#props) props.

- `title`: to set the title of the Form.
- `description`: to set the description of the Form.
- `icon`: to set the icon of the Form.
- `providers`: to add providers to the form.
- `separator`: to customize the [Separator](/docs/components/separator) between the providers and the fields.
- `submit`: to change the submit button of the Form.

## Usage

```vue
<UAuthForm
  <!-- props here -->
/>
```
