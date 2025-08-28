import '../../../preview-app/dist/preview-app'
import styles from '../../../preview-app/dist/preview-app.css?inline'
// import '../../../preview-app/src/preview-app.webcomponent'
// import styles from '../../../preview-app/src/assets/css/main.css?inline'

export function mountPreviewUI() {
  const el = document.createElement('preview-app')
  document.body.appendChild(el)

  const style = document.createElement('style')
  style.textContent = styles
  el.shadowRoot?.appendChild(style)
}
