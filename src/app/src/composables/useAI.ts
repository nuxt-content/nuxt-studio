import { useCompletion } from '@ai-sdk/vue'
import { ref } from 'vue'
import type { AIGenerateOptions } from '../../../shared/types/ai'

export function useAI() {
  const host = window.useStudioHost()
  const enabled = host.meta.ai

  if (!enabled) {
    const emptyPromise = async () => ''
    return {
      enabled: false,
      isLoading: ref(false),
      error: ref(undefined),
      completion: ref(''),
      stop: () => {},
      generate: emptyPromise,
      continue: emptyPromise,
      fix: emptyPromise,
      improve: emptyPromise,
      simplify: emptyPromise,
      translate: emptyPromise,
    }
  }

  const {
    completion,
    isLoading,
    error,
    stop,
    complete,
  } = useCompletion({
    api: '/__nuxt_studio/ai/generate',
    streamProtocol: 'text',
  })

  async function generate(options: AIGenerateOptions): Promise<string> {
    if (!enabled) {
      throw new Error('AI features are not enabled')
    }

    await complete(options.prompt, {
      body: {
        mode: options.mode,
        language: options.language,
      },
    })

    if (error.value) {
      throw error.value
    }

    return completion.value
  }

  async function continueText(prompt: string): Promise<string> {
    return generate({ prompt, mode: 'continue' })
  }

  async function fix(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'fix' })
  }

  async function improve(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'improve' })
  }

  async function simplify(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'simplify' })
  }

  async function translate(text: string, language: string): Promise<string> {
    return generate({ prompt: text, mode: 'translate', language })
  }

  return {
    enabled,
    isLoading,
    error,
    completion,
    stop,
    generate,
    continue: continueText,
    fix,
    improve,
    simplify,
    translate,
  }
}
