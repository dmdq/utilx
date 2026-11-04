<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Query String 解析工具</h1>
      <p class="text-muted-foreground">解析和构建 URL 查询字符串，支持嵌套对象和数组</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">URL 或 Query String</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="https://example.com?name=John&amp;age=25" class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">解析结果 (JSON)</h2>
          <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">解析结果将显示在这里</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const copied = ref(false)

const examples = [
  'https://example.com/search?q=hello&page=1&limit=10',
  '?name=John&age=25&city=Beijing',
  'tags[]=a&tags[]=b&tags[]=c',
  'user[name]=John&user[age]=25'
]
const currentExample = ref(0)

const parseQueryString = (url) => {
  try {
    let queryString = url
    if (url.includes('?')) {
      queryString = url.split('?')[1]
    }
    if (url.includes('#')) {
      queryString = queryString.split('#')[0]
    }

    const params = new URLSearchParams(queryString)
    const result = {}

    for (const [key, value] of params) {
      // 处理数组格式 key[]
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2)
        if (!result[arrayKey]) result[arrayKey] = []
        result[arrayKey].push(value)
      }
      // 处理嵌套对象 key[subkey]
      else if (key.includes('[')) {
        const matches = key.match(/([^[]+)\[([^\]]+)\]/g)
        if (matches) {
          let current = result
          matches.forEach((match, index) => {
            const [k, subk] = match.match(/([^[]+)\[([^\]]+)\]/).slice(1)
            if (!current[k]) current[k] = {}
            if (index === matches.length - 1) {
              current[k][subk] = value
            } else {
              if (!current[k][subk]) current[k][subk] = {}
              current = current[k][subk]
            }
          })
        }
      } else {
        result[key] = value
      }
    }

    return JSON.stringify(result, null, 2)
  } catch (e) {
    return '解析错误: ' + e.message
  }
}

watch(inputText, (newText) => {
  if (newText) {
    outputText.value = parseQueryString(newText.trim())
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
  title: 'Query String解析 - 在线URL查询字符串解析工具',
  description: '免费在线Query String解析工具，解析URL查询字符串为JSON对象，支持数组、嵌套对象格式。',
  keywords: ['query string', 'url', 'parse', '解析', '参数', '在线工具', 'url params']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Query String解析工具')
</script>
