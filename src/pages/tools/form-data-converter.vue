<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">FormData 转换工具</h1>
      <p class="text-muted-foreground">JSON 与 FormData 格式相互转换，用于表单数据处理</p>
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

        <textarea v-model="inputText" placeholder="请输入 JSON 或 FormData 格式的内容..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">输入格式</h3>
          <select v-model="inputFormat" class="w-full p-2 border border-border rounded-lg text-sm">
            <option value="json">JSON</option>
            <option value="formdata">FormData</option>
            <option value="auto">自动检测</option>
          </select>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转换结果</h2>
          <div class="flex gap-2">
            <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
            <button v-if="outputText" @click="downloadOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">下载</button>
          </div>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">转换结果将显示在这里</div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">FormData 格式说明</h3>
      <div class="text-xs text-muted-foreground space-y-1">
        <p>• FormData 格式: key1=value1&key2=value2</p>
        <p>• 值会被 URL 编码，空格变为 +</p>
        <p>• 支持嵌套对象和数组</p>
        <p>• 常用于 HTTP POST 表单提交</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const inputFormat = ref('auto')
const copied = ref(false)

const examples = [
  JSON.stringify({ name: 'John Doe', email: 'john@example.com', age: 30 }, null, 2),
  'name=John+Doe&email=john%40example.com&age=30',
  JSON.stringify({
    user: { name: 'Alice', age: 25 },
    tags: ['javascript', 'vue'],
    active: true
  }, null, 2)
]
const currentExample = ref(0)

const detectFormat = (text) => {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json'
  }
  return 'formdata'
}

const jsonToFormData = (obj, prefix = '') => {
  const parts = []

  for (const key in obj) {
    const value = obj[key]
    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (value instanceof Object && !Array.isArray(value)) {
      parts.push(...jsonToFormData(value, fullKey))
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof Object) {
          parts.push(...jsonToFormData(item, `${fullKey}[${index}]`))
        } else {
          parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(item)}`)
        }
      })
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`)
    }
  }

  return parts
}

const formDataToJson = (str) => {
  const params = new URLSearchParams(str)
  const result = {}

  for (const [key, value] of params) {
    const keys = key.match(/([^\[\]]+)/g)

    if (keys) {
      let current = result
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
    }
  }

  return result
}

watch([inputText, inputFormat], ([text, format]) => {
  if (!text) {
    outputText.value = ''
    return
  }

  const detectedFormat = format === 'auto' ? detectFormat(text) : format

  try {
    if (detectedFormat === 'json') {
      const obj = JSON.parse(text)
      outputText.value = jsonToFormData(obj).join('&')
    } else {
      const obj = formDataToJson(text)
      outputText.value = JSON.stringify(obj, null, 2)
    }
  } catch (e) {
    outputText.value = '转换错误: ' + e.message
  }
})

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

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

const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formdata.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

useSeoMeta({
  title: 'FormData转换 - 在线JSON与FormData互转工具',
  description: '免费在线FormData转换工具，支持JSON与FormData格式相互转换，用于表单数据处理。',
  keywords: ['formdata', 'json', '转换', '表单', 'urlencoded', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('FormData转换工具')
</script>
