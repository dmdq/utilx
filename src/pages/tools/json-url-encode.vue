<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JSON URL 编码工具</h1>
      <p class="text-muted-foreground">将 JSON 对象转换为 URL 编码格式，适用于 API 请求参数传递</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">JSON 输入</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          placeholder='{"key": "value", "name": "张三"}'
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">编码选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input type="radio" v-model="encodeMode" value="form" class="rounded" />
              <span class="text-sm">表单编码 (application/x-www-form-urlencoded)</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" v-model="encodeMode" value="json" class="rounded" />
              <span class="text-sm">JSON 字符串 (需要再次 URL 编码)</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" v-model="encodeMode" value="bracket" class="rounded" />
              <span class="text-sm">括号表示法 (key[]=value)</span>
            </label>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">编码结果</h2>
          <div class="flex gap-2">
            <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
            <button v-if="outputText" @click="downloadOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">下载</button>
          </div>
        </div>

        <div class="relative">
          <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all">{{ outputText }}</pre>
          <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">编码结果将显示在这里</div>
        </div>

        <div v-if="parsed" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">解析结果</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>字段数: {{ fieldCount }}</div>
            <div>嵌套层级: {{ nestingLevel }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-12 space-y-6">
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">使用场景</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>GET 请求传递 JSON 参数</li>
          <li>表单提交复杂数据结构</li>
          <li>URL 参数嵌套对象</li>
          <li>API 接口参数序列化</li>
        </ul>
      </div>

      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink to="/tools/url-encode" class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <Globe class="w-5 h-5 text-primary" />
            <div><p class="font-medium">URL 编码</p><p class="text-xs text-muted-foreground">URL 百分比编码</p></div>
          </NuxtLink>
          <NuxtLink to="/tools/js-string-escape" class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <Code class="w-5 h-5 text-primary" />
            <div><p class="font-medium">JS 字符串转义</p><p class="text-xs text-muted-foreground">JavaScript 转义</p></div>
          </NuxtLink>
          <NuxtLink to="/tools/url-params-builder" class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <Link class="w-5 h-5 text-primary" />
            <div><p class="font-medium">URL 参数构建</p><p class="text-xs text-muted-foreground">参数构建工具</p></div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSeoMeta } from '#app'
import { Globe, Code, Link } from 'lucide-vue-next'

const inputText = ref('')
const outputText = ref('')
const encodeMode = ref('form')
const copied = ref(false)
const parsed = ref(null)

const examples = [
  '{"name": "张三", "age": 25, "city": "北京"}',
  '{"user": {"name": "John", "email": "john@example.com"}, "tags": ["a", "b"]}',
  '{"search": "hello world", "page": 1, "limit": 10}'
]
const currentExample = ref(0)

const fieldCount = computed(() => parsed.value ? Object.keys(parsed.value).length : 0)
const nestingLevel = computed(() => {
  const getDepth = (obj) => {
    if (typeof obj !== 'object' || obj === null) return 0
    return 1 + Math.max(0, ...Object.values(obj).map(v => getDepth(v)))
  }
  return parsed.value ? getDepth(parsed.value) : 0
})

const flattenObject = (obj, prefix = '') => {
  const result = {}
  for (const key in obj) {
    const newKey = prefix ? `${prefix}[${key}]` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], newKey))
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.assign(result, flattenObject(item, `${newKey}[${index}]`))
        } else {
          result[`${newKey}[${index}]`] = item
        }
      })
    } else {
      result[newKey] = obj[key]
    }
  }
  return result
}

const encodeJSON = (text, mode) => {
  try {
    const obj = JSON.parse(text)
    parsed.value = obj

    if (mode === 'json') {
      return JSON.stringify(obj)
    }

    const flattened = flattenObject(obj)
    const params = new URLSearchParams()

    for (const key in flattened) {
      params.append(key, String(flattened[key]))
    }

    return params.toString()
  } catch (e) {
    parsed.value = null
    return 'JSON 解析错误: ' + e.message
  }
}

watch([inputText, encodeMode], ([text]) => {
  if (text) {
    outputText.value = encodeJSON(text, encodeMode.value)
  } else {
    outputText.value = ''
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = ''; parsed.value = null }
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

const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'json-url-encoded.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

useSeoMeta({
  title: 'JSON URL编码 - 在线JSON对象URL编码工具',
  description: '免费在线JSON URL编码工具，支持将JSON对象转换为URL编码格式，适用于API请求参数传递，支持表单编码和括号表示法。',
  keywords: ['json', 'url encode', 'urlencode', 'json to url', 'api', '参数编码', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('JSON URL编码工具')
</script>
