<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Base32 编码工具</h1>
      <p class="text-muted-foreground">Base32 编码与解码，使用 32 个字符表示二进制数据</p>
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

        <textarea v-model="inputText" placeholder="请输入需要编码的文本..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">Base32 字符集</h3>
          <code class="text-xs font-mono">A-Z 2-7</code>
          <p class="text-xs text-muted-foreground mt-2">RFC 4648 标准字符集</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">编码结果</h2>
          <div class="flex gap-2">
            <button v-if="outputText" @click="toggleDirection" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ direction === 'encode' ? '解码' : '编码' }}</button>
            <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
          </div>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">编码结果将显示在这里</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const inputText = ref('')
const outputText = ref('')
const direction = ref('encode')
const copied = ref(false)

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const examples = [
  'Hello World!',
  'Base32 Encoding Test',
  '你好'
]
const currentExample = ref(0)

const encodeBase32 = (text) => {
  const bytes = new TextEncoder().encode(text)
  let bits = ''
  let result = ''

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0')
  }

  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5)
    const index = parseInt(chunk, 2)
    result += BASE32_CHARS[index]
  }

  if (bits.length % 5 > 0) {
    result += '='.repeat((8 - bits.length % 5) / 5)
  }

  return result
}

const decodeBase32 = (text) => {
  try {
    const cleanText = text.replace(/=/g, '').toUpperCase()
    let bits = ''

    for (const char of cleanText) {
      const index = BASE32_CHARS.indexOf(char)
      if (index === -1) throw new Error('Invalid character')
      bits += index.toString(2).padStart(5, '0')
    }

    const bytes = []
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2))
    }

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch (e) {
    return '解码错误: ' + e.message
  }
}

watch([inputText, direction], ([text]) => {
  if (text) {
    outputText.value = direction.value === 'encode' ? encodeBase32(text) : decodeBase32(text)
  } else {
    outputText.value = ''
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = '' }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }
const toggleDirection = () => { direction.value = direction.value === 'encode' ? 'decode' : 'encode' }

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
  title: 'Base32编码 - 在线Base32编码解码工具',
  description: '免费在线Base32编码工具，RFC 4648标准，支持文本与Base32格式互转。',
  keywords: ['base32', '编码', 'decode', '编码解码', 'rfc4648', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Base32编码工具')
</script>
