import { useCompletion } from '@ai-sdk/vue'
import type { Ref } from 'vue'
import { ref } from 'vue'

export interface AIGenerateOptions {
  prompt: string
  mode?: 'continue' | 'fix' | 'simplify' | 'summarize' | 'translate' | 'extend' | 'reduce'
  language?: string
}

export interface UseAIReturn {
  enabled: boolean
  isLoading: Ref<boolean | undefined>
  error: Ref<Error | undefined>
  completion: Ref<string>
  stop: () => void
  generate: (options: AIGenerateOptions) => Promise<string>
  continue: (prompt: string) => Promise<string>
  fix: (text: string) => Promise<string>
  simplify: (text: string) => Promise<string>
  summarize: (text: string) => Promise<string>
  translate: (text: string, language: string) => Promise<string>
  extend: (text: string) => Promise<string>
  reduce: (text: string) => Promise<string>
}

export function useAI(): UseAIReturn {
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
      simplify: emptyPromise,
      summarize: emptyPromise,
      translate: emptyPromise,
      extend: emptyPromise,
      reduce: emptyPromise,
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

  async function simplify(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'simplify' })
  }

  async function summarize(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'summarize' })
  }

  async function translate(text: string, language: string): Promise<string> {
    return generate({ prompt: text, mode: 'translate', language })
  }

  async function extend(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'extend' })
  }

  async function reduce(text: string): Promise<string> {
    return generate({ prompt: text, mode: 'reduce' })
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
    simplify,
    summarize,
    translate,
    extend,
    reduce,
  }
}
