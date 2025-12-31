<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本倒置工具</h1>
      <p class="text-gray-600 dark:text-gray-400">字符、单词、行倒序，支持多种倒置方式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要倒置的文本..."
          @input="reverse"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">倒置结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">倒置方式</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in reverseTypes"
          :key="type.id"
          @click="currentType = type.id; reverse()"
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
  title: '文本倒置工具 - 字符/单词/行倒序',
  meta: [{ name: 'description', content: '在线文本倒置工具，支持字符倒序、单词倒序、行倒序等多种倒置方式。' }],
  keywords: ['文本倒置', '字符串反转', '字符倒序', '单词倒序', '行倒序']
})

const inputText = ref('')
const outputText = ref('')
const currentType = ref('char')

const reverseTypes = [
  { id: 'char', name: '字符倒序' },
  { id: 'word', name: '单词倒序' },
  { id: 'line', name: '行倒序' },
  { id: 'word-line', name: '每行单词倒序' }
]

function reverse() {
  const text = inputText.value

  switch (currentType.value) {
    case 'char':
      outputText.value = text.split('').reverse().join('')
      break
    case 'word':
      outputText.value = text.split(/\s+/).reverse().join(' ')
      break
    case 'line':
      outputText.value = text.split('\n').reverse().join('\n')
      break
    case 'word-line':
      outputText.value = text.split('\n').map(line =>
        line.split(/\s+/).reverse().join(' ')
      ).join('\n')
      break
  }
}

inputText.value = 'Hello World\nThis is a test'
reverse()
</script>
