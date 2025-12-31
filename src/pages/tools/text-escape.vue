<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本转义工具</h1>
      <p class="text-gray-600 dark:text-gray-400">HTML/XML/JSON/SQL特殊字符转义，防止注入和格式错误</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要转义的文本..."
          @input="escape"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">转义结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">转义类型</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in escapeTypes"
          :key="type.id"
          @click="currentType = type.id; escape()"
          :class="['px-4 py-2 rounded', currentType === type.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          {{ type.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '文本转义工具 - HTML/XML/JSON/SQL特殊字符转义',
  meta: [{ name: 'description', content: '在线文本转义工具，支持HTML、XML、JSON、SQL特殊字符转义和反转义，防止注入攻击。' }],
  keywords: ['文本转义', 'HTML转义', 'XML转义', 'JSON转义', 'SQL转义', '特殊字符']
})

const inputText = ref('')
const outputText = ref('')
const currentType = ref('html')

const escapeTypes = [
  { id: 'html', name: 'HTML转义' },
  { id: 'html-un', name: 'HTML反转义' },
  { id: 'xml', name: 'XML转义' },
  { id: 'json', name: 'JSON转义' },
  { id: 'json-un', name: 'JSON反转义' },
  { id: 'sql', name: 'SQL转义' },
  { id: 'url', name: 'URL转义' },
  { id: 'url-un', name: 'URL反转义' }
]

function escape() {
  const text = inputText.value

  switch (currentType.value) {
    case 'html':
      outputText.value = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
      break
    case 'html-un':
      outputText.value = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
      break
    case 'xml':
      outputText.value = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      break
    case 'json':
      outputText.value = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
      break
    case 'json-un':
      try {
        outputText.value = JSON.parse(`"${text}"`)
      } catch {
        outputText.value = text
      }
      break
    case 'sql':
      outputText.value = text.replace(/'/g, "''")
      break
    case 'url':
      outputText.value = encodeURIComponent(text)
      break
    case 'url-un':
      outputText.value = decodeURIComponent(text)
      break
  }
}

inputText.value = '<div class="test">Hello & "World"</div>'
escape()
</script>
