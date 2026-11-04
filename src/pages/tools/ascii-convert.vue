<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">ASCII 编码转换工具</h1>
      <p class="text-muted-foreground">文本与 ASCII 码之间的转换，显示完整的 ASCII 字符表</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入文本</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入需要转换的文本..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">ASCII 码结果</h2>
          <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">ASCII 码将显示在这里</div>

        <div v-if="charDetails.length > 0" class="bg-muted p-4 rounded-lg max-h-48 overflow-auto">
          <h3 class="font-medium text-sm mb-2">字符详情</h3>
          <div class="space-y-1">
            <div v-for="(char, index) in charDetails" :key="index" class="flex items-center gap-2 text-xs font-mono">
              <span class="bg-background px-2 py-1 rounded">{{ char.char }}</span>
              <span class="text-muted-foreground">DEC: {{ char.dec }}</span>
              <span class="text-muted-foreground">HEX: {{ char.hex }}</span>
              <span class="text-muted-foreground">BIN: {{ char.bin }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-12">
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">ASCII 字符表</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">字符</th>
                <th class="text-left py-2">十进制</th>
                <th class="text-left py-2">十六进制</th>
                <th class="text-left py-2">说明</th>
                <th class="text-left py-2">字符</th>
                <th class="text-left py-2">十进制</th>
                <th class="text-left py-2">十六进制</th>
                <th class="text-left py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 8" :key="i" class="border-b">
                <td class="py-1 font-mono">{{ asciiTable[(i-1)*2].char }}</td>
                <td class="py-1 font-mono">{{ asciiTable[(i-1)*2].dec }}</td>
                <td class="py-1 font-mono">{{ asciiTable[(i-1)*2].hex }}</td>
                <td class="py-1 text-xs">{{ asciiTable[(i-1)*2].desc }}</td>
                <td class="py-1 font-mono">{{ asciiTable[(i-1)*2+1].char }}</td>
                <td class="py-1 font-mono">{{ asciiTable[(i-1)*2+1].dec }}</td>
                <td class="py-1 font-mono">{{ asciiTable[(i-1)*2+1].hex }}</td>
                <td class="py-1 text-xs">{{ asciiTable[(i-1)*2+1].desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const copied = ref(false)

const examples = [
  'Hello World!',
  'ABC123',
  'ASCII Test'
]
const currentExample = ref(0)

const asciiTable = [
  { char: 'NUL', dec: 0, hex: '00', desc: '空字符' },
  { char: 'SOH', dec: 1, hex: '01', desc: '标题开始' },
  { char: 'STX', dec: 2, hex: '02', desc: '正文开始' },
  { char: 'ETX', dec: 3, hex: '03', desc: '正文结束' },
  { char: 'EOT', dec: 4, hex: '04', desc: '传输结束' },
  { char: 'ENQ', dec: 5, hex: '05', desc: '询问' },
  { char: 'ACK', dec: 6, hex: '06', desc: '确认' },
  { char: 'BEL', dec: 7, hex: '07', desc: '响铃' },
  { char: 'BS', dec: 8, hex: '08', desc: '退格' },
  { char: 'HT', dec: 9, hex: '09', desc: '水平制表符' },
  { char: 'LF', dec: 10, hex: '0A', desc: '换行' },
  { char: 'VT', dec: 11, hex: '0B', desc: '垂直制表符' },
  { char: 'FF', dec: 12, hex: '0C', desc: '换页' },
  { char: 'CR', dec: 13, hex: '0D', desc: '回车' },
  { char: 'SO', dec: 14, hex: '0E', desc: '移出' },
  { char: 'SI', dec: 15, hex: '0F', desc: '移入' }
]

const charDetails = computed(() => {
  if (!inputText.value) return []
  return inputText.value.split('').map(char => ({
    char: char === ' ' ? 'SP' : char,
    dec: char.charCodeAt(0),
    hex: char.charCodeAt(0).toString(16).toUpperCase(),
    bin: char.charCodeAt(0).toString(2).padStart(8, '0')
  }))
})

watch(inputText, (newText) => {
  if (newText) {
    outputText.value = newText.split('').map(char => {
      const code = char.charCodeAt(0)
      return `${char} = ${code} (0x${code.toString(16).toUpperCase()})`
    }).join('\n')
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
  title: 'ASCII编码转换 - 在线ASCII码转换工具',
  description: '免费在线ASCII编码转换工具，文本与ASCII码互转，显示完整ASCII字符表，支持十进制、十六进制、二进制格式。',
  keywords: ['ascii', '编码转换', '字符编码', 'ascii表', '十进制', '十六进制', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('ASCII编码转换工具')
</script>
