<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">空格格式化工具</h1>
      <p class="text-gray-600 dark:text-gray-400">统一空格与Tab、去除多余空白、代码缩进整理</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要格式化的文本..."
          @input="format"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">格式化结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">格式化选项</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium mb-2">Tab/空格转换</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="tabToSpaces"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded"
            >
              Tab转空格(4)
            </button>
            <button
              @click="spacesToTab"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded"
            >
              空格转Tab
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-2">空白处理</h3>
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeExtraSpaces" @change="format" class="rounded">
              <span>去多余空格</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeTrailSpaces" @change="format" class="rounded">
              <span>去行尾空格</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeEmptyLines" @change="format" class="rounded">
              <span>去空行</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '空格格式化工具 - 统一空格Tab、去除多余空白',
  meta: [{ name: 'description', content: '在线空格格式化工具，统一Tab和空格、去除多余空白、去除行尾空格、删除空行，适用于代码格式化。' }],
  keywords: ['空格格式化', 'Tab转空格', '去除空白', '代码格式化', '缩进整理']
})

const inputText = ref('')
const outputText = ref('')

const options = ref({
  removeExtraSpaces: false,
  removeTrailSpaces: true,
  removeEmptyLines: false
})

function format() {
  let text = inputText.value

  if (options.value.removeExtraSpaces) {
    text = text.replace(/[ \t]+/g, ' ')
  }

  if (options.value.removeTrailSpaces) {
    text = text.replace(/[ \t]+$/gm, '')
  }

  if (options.value.removeEmptyLines) {
    text = text.replace(/\n{2,}/g, '\n')
  }

  outputText.value = text
}

function tabToSpaces() {
  let text = inputText.value
  text = text.replace(/\t/g, '    ')
  inputText.value = text
  format()
}

function spacesToTab() {
  let text = inputText.value
  text = text.replace(/    /g, '\t')
  inputText.value = text
  format()
}

inputText.value = `Line 1
  Line 2\t\t
  Line 3


  Line 4`
format()
</script>
