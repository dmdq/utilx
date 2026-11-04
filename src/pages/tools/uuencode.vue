<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">UUEncode 编码工具</h1>
      <p class="text-muted-foreground">Unix-to-Unix 编码与解码，用于二进制文件传输</p>
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

        <textarea v-model="inputText" placeholder="请输入需要编码的内容..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">UUEncode 说明</h3>
          <ul class="text-xs text-muted-foreground space-y-1">
            <li>• 传统 Unix 文件传输编码</li>
            <li>• 开始标记：begin &lt;mode&gt; &lt;file&gt;</li>
            <li>• 每 行开头包含长度字节</li>
            <li>• 结束标记：包含单反引号的行</li>
          </ul>
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

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">{{ outputText }}</pre>
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

const examples = [
  'Hello UUEncode World!',
  'Binary file transfer test',
  'Unix encoding example'
]
const currentExample = ref(0)

const encodeUU = (text) => {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  const lines = []
  const chunkSize = 45

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    const len = chunk.length
    const encoded = btoa(String.fromCharCode(...chunk))
    lines.push(`${len + 32}${encoded}`)
  }

  return `begin 644 file.txt\r\n${lines.join('\r\n')}\r\n\`\r\nend`
}

const decodeUU = (text) => {
  try {
    const lines = text.split('\n')
    const dataLines = lines.slice(1, lines.indexOf('`'))
    const bytes = []

    for (const line of dataLines) {
      if (!line || line.startsWith('end')) continue
      const len = line.charCodeAt(0) - 32
      const encoded = line.slice(1)
      const decoded = atob(encoded)
      for (let i = 0; i < decoded.length; i++) {
        if (bytes.length < len) {
          bytes.push(decoded.charCodeAt(i))
        }
      }
    }

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch {
    return '解码错误：无效的 UUEncode 格式'
  }
}

watch([inputText, direction], ([text]) => {
  if (text) {
    outputText.value = direction.value === 'encode' ? encodeUU(text) : decodeUU(text)
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
  title: 'UUEncode编码 - 在线UUEncode编码解码工具',
  description: '免费在线UUEncode编码工具，Unix-to-Unix编码与解码，用于二进制文件传输。',
  keywords: ['uuencode', 'unix', '编码', '文件传输', '二进制', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('UUEncode编码工具')
</script>
