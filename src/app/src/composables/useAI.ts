import { useCompletion } from '@ai-sdk/vue'
import { ref } from 'vue'
import type { AIGenerateOptions } from '../../../shared/types/ai'
import type { CollectionInfo } from '@nuxt/content'

export function useAI() {
  const host = window.useStudioHost()
  const enabled = host.meta.ai.enabled

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
      analyze: emptyPromise,
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
    await complete(options.prompt, {
      body: {
        mode: options.mode,
        language: options.language,
        selectionLength: options.selectionLength,
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

  async function analyze(collection: CollectionInfo): Promise<string> {
    const response = await fetch('/__nuxt_studio/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      result += chunk
      completion.value = result
    }

    return result
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
    analyze,
  }
}
