import { ref } from 'vue'

export function useClipboard() {
  const isSupported = ref(!!navigator.clipboard)
  const text = ref('')
  const error = ref(null)

  const copy = async (content) => {
    if (!isSupported.value) {
      error.value = new Error('Clipboard API not supported')
      return false
    }

    try {
      await navigator.clipboard.writeText(content)
      text.value = content
      error.value = null
      return true
    } catch (err) {
      error.value = err
      return false
    }
  }

  return {
    isSupported,
    text,
    error,
    copy
  }
}