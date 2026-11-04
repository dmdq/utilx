<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">MIME Base64 编码工具</h1>
      <p class="text-muted-foreground">MIME 标准的 Base64 编码，用于电子邮件附件传输</p>
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
          <h3 class="font-medium text-sm mb-2">MIME 说明</h3>
          <ul class="text-xs text-muted-foreground space-y-1">
            <li>• MIME Base64 是标准 Base64 的变种</li>
            <li>• 每行限制 76 个字符</li>
            <li>• 用于电子邮件附件和 S/MIME</li>
            <li>• 使用 CRLF (\\r\\n) 作为行分隔符</li>
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
  'Hello World!',
  'This is a MIME Base64 encoding test.',
  'Email attachment content example'
]
const currentExample = ref(0)

const encodeMIME = (text) => {
  const base64 = btoa(text)
  // 每76字符插入换行
  return base64.match(/.{1,76}/g)?.join('\r\n') || base64
}

const decodeMIME = (text) => {
  try {
    const clean = text.replace(/\r?\n/g, '')
    return atob(clean)
  } catch {
    return '解码错误：无效的 Base64 格式'
  }
}

watch([inputText, direction], ([text]) => {
  if (text) {
    outputText.value = direction.value === 'encode' ? encodeMIME(text) : decodeMIME(text)
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
  title: 'MIME Base64编码 - 在线MIME编码工具',
  description: '免费在线MIME Base64编码工具，用于电子邮件附件传输，支持标准MIME格式。',
  keywords: ['mime', 'base64', 'email', '邮件', '附件', '编码', 'smime']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('MIME Base64编码工具')
</script>
