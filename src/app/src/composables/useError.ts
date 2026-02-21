import { ref } from 'vue'

const error = ref<{ title: string, message: string } | null>(null)

export function useError() {
  function showError(title: string, message: string) {
    error.value = { title, message }
  }

  function clearError() {
    error.value = null
  }

  return {
    error,
    showError,
    clearError,
  }
}
