<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">CSS 转义工具</h1>
      <p class="text-muted-foreground">CSS 选择器和字符串转义，处理特殊字符和中文</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入内容</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入需要转义的 CSS 选择器或字符串..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">转义选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input type="radio" v-model="escapeMode" value="identifier" class="rounded" />
              <span class="text-sm">标识符 (class, id 等)</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" v-model="escapeMode" value="string" class="rounded" />
              <span class="text-sm">字符串值</span>
            </label>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转义结果</h2>
          <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">转义结果将显示在这里</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const escapeMode = ref('identifier')
const copied = ref(false)

const examples = [
  '.my-class',
  '#my-id',
  'div.content',
  '.测试类'
]
const currentExample = ref(0)

const escapeCSS = (text, mode) => {
  if (mode === 'identifier') {
    return text.split('').map(char => {
      const code = char.charCodeAt(0)
      // 需要转义的字符
      if (/[^a-zA-Z0-9_-]/.test(char)) {
        if (code > 127) {
          return '\\' + code.toString(16) + ' '
        }
        return '\\' + char
      }
      // 如果以数字开头，需要转义
      if (/^[0-9]/.test(char)) {
        return '\\3' + char + ' '
      }
      return char
    }).join('')
  } else {
    // 字符串转义
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\\\n ')
      .replace(/\r/g, '\\\\r ')
  }
}

watch([inputText, escapeMode], ([text]) => {
  if (text) {
    outputText.value = escapeCSS(text, escapeMode.value)
  } else {
    outputText.value = ''
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = '' }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

useSeoMeta({
  title: 'CSS转义 - 在线CSS选择器转义工具',
  description: '免费在线CSS转义工具，处理CSS选择器和字符串中的特殊字符，支持中文等多语言字符转义。',
  keywords: ['css', 'escape', '转义', 'selector', '选择器', '特殊字符', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('CSS转义工具')
</script>
