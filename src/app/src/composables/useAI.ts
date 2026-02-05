import { useCompletion } from '@ai-sdk/vue'
import { ref } from 'vue'
import type { AIGenerateOptions } from '../types'
import type { CollectionInfo } from '@nuxt/content'

export function useAI() {
  const host = window.useStudioHost()
  const enabled = host.meta.ai.enabled
  const contextFolder = host.meta.ai.context?.contentFolder

  if (!enabled) {
    const emptyPromise = async () => ''
    return {
      enabled: false,
      contextFolder,
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
    // For continue mode, use previousContext. For other modes, use prompt.
    const promptText = options.mode === 'continue' ? (options.previousContext || '') : (options.prompt || '')

    await complete(promptText, {
      body: {
        prompt: options.prompt,
        previousContext: options.previousContext,
        nextContext: options.nextContext,
        mode: options.mode,
        language: options.language,
        selectionLength: options.selectionLength,
        fsPath: options.fsPath,
        collectionName: options.collectionName,
        hintOptions: options.hintOptions,
      },
    })

    if (error.value) {
      throw error.value
    }

    return completion.value
  }

  async function continueText(options: Partial<AIGenerateOptions>): Promise<string> {
    return generate({
      ...options,
      mode: 'continue',
    })
  }

  async function fix(text: string, fsPath?: string, collectionName?: string): Promise<string> {
    return generate({ prompt: text, mode: 'fix', fsPath, collectionName })
  }

  async function improve(text: string, fsPath?: string, collectionName?: string): Promise<string> {
    return generate({ prompt: text, mode: 'improve', fsPath, collectionName })
  }

  async function simplify(text: string, fsPath?: string, collectionName?: string): Promise<string> {
    return generate({ prompt: text, mode: 'simplify', fsPath, collectionName })
  }

  async function translate(text: string, language: string, fsPath?: string, collectionName?: string): Promise<string> {
    return generate({ prompt: text, mode: 'translate', language, fsPath, collectionName })
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
    contextFolder,
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
