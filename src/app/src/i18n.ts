import { createI18n, type LocaleMessages, type VueMessageType } from 'vue-i18n'

type StudioMessages = Record<string, LocaleMessages<VueMessageType>>

export function createStudioI18n(locale: string, messages: Record<string, unknown>) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: messages as StudioMessages,
    globalInjection: true, // to be able to use $t() in templates
  })
}
