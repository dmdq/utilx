<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Base58 编码工具</h1>
      <p class="text-muted-foreground">Base58 编码与解码，用于比特币地址和短链接服务</p>
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
          <h3 class="font-medium text-sm mb-2">Base58 字符集</h3>
          <code class="text-xs font-mono">123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz</code>
          <p class="text-xs text-muted-foreground mt-2">比特币地址编码标准，去除 0OIl 等易混淆字符</p>
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
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const direction = ref('encode')
const copied = ref(false)

const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const examples = [
  'Hello World!',
  'Bitcoin Address',
  'Short URL Test'
]
const currentExample = ref(0)

const encodeBase58 = (text) => {
  const bytes = new TextEncoder().encode(text)
  let num = 0n
  let base = 1n

  for (const byte of bytes) {
    num += BigInt(byte) * base
    base *= 256n
  }

  let result = ''
  while (num > 0n) {
    const remainder = num % 58n
    num /= 58n
    result = BASE58_CHARS[Number(remainder)] + result
  }

  for (const byte of bytes) {
    if (byte === 0) result = '1' + result
    else break
  }

  return result || '1'
}

const decodeBase58 = (text) => {
  try {
    let num = 0n
    let base = 1n

    for (let i = text.length - 1; i >= 0; i--) {
      const index = BASE58_CHARS.indexOf(text[i])
      if (index === -1) throw new Error('Invalid character')
      num += BigInt(index) * base
      base *= 58n
    }

    const bytes = []
    while (num > 0n) {
      bytes.push(Number(num % 256n))
      num /= 256n
    }

    let leadingZeros = 0
    for (const char of text) {
      if (char === '1') leadingZeros++
      else break
    }

    while (bytes.length < leadingZeros) {
      bytes.push(0)
    }

    return new TextDecoder().decode(new Uint8Array(bytes.reverse()))
  } catch (e) {
    return '解码错误: ' + e.message
  }
}

watch([inputText, direction], ([text]) => {
  if (text) {
    outputText.value = direction.value === 'encode' ? encodeBase58(text) : decodeBase58(text)
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
  title: 'Base58编码 - 在线Base58编码解码工具',
  description: '免费在线Base58编码工具，比特币地址编码标准，支持文本与Base58格式互转。',
  keywords: ['base58', '编码', 'bitcoin', '比特币', '短链接', 'decode', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Base58编码工具')
</script>
