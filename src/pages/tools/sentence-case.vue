<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">句首大写工具</h1>
      <p class="text-gray-600 dark:text-gray-400">将每个句子的首字母转换为大写，适用于英文文本编辑</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入英文文本..."
          @input="convert"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">转换结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">转换选项</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in types"
          :key="type.id"
          @click="currentType = type.id; convert()"
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
  title: '句首大写工具 - 每个句子首字母大写',
  meta: [{ name: 'description', content: '在线句首大写工具，将每个句子的首字母转换为大写，支持多种句子分隔符。' }],
  keywords: ['句首大写', '句子大写', '首字母大写', '英文格式化', '文本编辑']
})

const inputText = ref('')
const outputText = ref('')
const currentType = ref('sentence')

const types = [
  { id: 'sentence', name: '句首大写' },
  { id: 'word', name: '每个单词大写' },
  { id: 'lower', name: '全部小写后句首大写' },
  { id: 'upper', name: '首字母大写其余小写' }
]

function convert() {
  const text = inputText.value

  switch (currentType.value) {
    case 'sentence':
      outputText.value = text.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
      break
    case 'word':
      outputText.value = text.replace(/\b\w/g, c => c.toUpperCase())
      break
    case 'lower':
      outputText.value = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
      break
    case 'upper':
      outputText.value = text.toLowerCase().replace(/^\w/g, c => c.toUpperCase())
      break
  }
}

inputText.value = `hello world. this is a TEST. another sentence here.`
convert()
</script>
