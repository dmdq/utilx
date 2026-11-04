<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Base62 编码工具</h1>
      <p class="text-muted-foreground">Base62 编码与解码，用于短链接服务和 URL 压缩</p>
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

        <textarea v-model="inputText" placeholder="请输入需要编码的文本或数字..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">Base62 字符集</h3>
          <code class="text-xs font-mono">0-9 a-z A-Z</code>
          <p class="text-xs text-muted-foreground mt-2">62 个字符：0-9 (10) + a-z (26) + A-Z (26)</p>
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

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const examples = [
  '123456789',
  'Hello World!',
  'https://example.com/page'
]
const currentExample = ref(0)

const encodeBase62 = (text) => {
  try {
    const num = BigInt(new TextEncoder().encode(text).reduce((acc, byte) => acc * 256n + BigInt(byte), 0n))
    if (num === 0n) return BASE62_CHARS[0]

    let result = ''
    let base = num

    while (base > 0n) {
      const remainder = base % 62n
      base /= 62n
      result = BASE62_CHARS[Number(remainder)] + result
    }

    return result
  } catch {
    return '编码错误'
  }
}

const decodeBase62 = (text) => {
  try {
    let num = 0n
    let base = 1n

    for (let i = text.length - 1; i >= 0; i--) {
      const index = BASE62_CHARS.indexOf(text[i])
      if (index === -1) throw new Error('Invalid character')
      num += BigInt(index) * base
      base *= 62n
    }

    const bytes = []
    while (num > 0n) {
      bytes.unshift(Number(num % 256n))
      num /= 256n
    }

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch (e) {
    return '解码错误: ' + e.message
  }
}

watch([inputText, direction], ([text]) => {
  if (text) {
    outputText.value = direction.value === 'encode' ? encodeBase62(text) : decodeBase62(text)
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
  title: 'Base62编码 - 在线Base62编码解码工具',
  description: '免费在线Base62编码工具，用于短链接服务和URL压缩，支持文本与Base62格式互转。',
  keywords: ['base62', '编码', '短链接', 'url压缩', 'decode', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Base62编码工具')
</script>
