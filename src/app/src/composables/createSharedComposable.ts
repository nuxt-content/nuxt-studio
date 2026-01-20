import type { EffectScope } from 'vue'
import { effectScope, getCurrentScope, onScopeDispose } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFn = (...args: any[]) => any

/**
 * Make a composable function usable with multiple Vue instances.
 *
 * This is our own implementation of createSharedComposable from VueUse.
 *
 * @param composable - The composable function to make shared
 * @returns A shared version of the composable
 */
export function createSharedComposable<Fn extends AnyFn>(composable: Fn): Fn {
  let subscribers = 0
  let state: ReturnType<Fn> | undefined
  let scope: EffectScope | undefined

  const dispose = () => {
    subscribers -= 1
    if (scope && subscribers <= 0) {
      scope.stop()
      state = undefined
      scope = undefined
    }
  }

  return ((...args: Parameters<Fn>) => {
    subscribers += 1
    if (!scope) {
      scope = effectScope(true)
      state = scope.run(() => composable(...args))
    }
    // Only register disposal if there's an active scope
    if (getCurrentScope()) {
      onScopeDispose(dispose)
    }
    return state
  }) as Fn
}
