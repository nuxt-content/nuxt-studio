import { createI18n, type LocaleMessages, type VueMessageType } from 'vue-i18n'

const defaultLocale = navigator.language.split('-')[0] || 'en'

type StudioMessages = Record<string, LocaleMessages<VueMessageType>>

export function createStudioI18n(messages: Record<string, unknown>) {
  return createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages: messages as StudioMessages,
    globalInjection: true, // to be able to use $t() in templates
  })
}
