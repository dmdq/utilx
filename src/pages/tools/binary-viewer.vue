<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">二进制查看器</h1>
      <p class="text-muted-foreground">以十六进制和字符格式查看文件内容</p>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">输入文本</h2>
        <div class="flex gap-2">
          <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
          <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
        </div>
      </div>

      <textarea v-model="inputText" placeholder="请输入要查看的文本内容..." class="w-full h-48 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>
    </div>

    <div v-if="bytesView.length > 0" class="space-y-4">
      <h2 class="text-lg font-semibold">二进制视图</h2>
      <div class="bg-muted p-4 rounded-lg overflow-auto max-h-96">
        <table class="w-full text-xs font-mono">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">偏移</th>
              <th class="text-left py-2">十六进制</th>
              <th class="text-left py-2">ASCII</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in bytesView" :key="index" class="border-b">
              <td class="py-1">{{ row.offset }}</td>
              <td class="py-1">{{ row.hex }}</td>
              <td class="py-1">{{ row.ascii }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')

const examples = [
  'Hello World!',
  'Binary Viewer Test 123',
  '你好世界 Test'
]
const currentExample = ref(0)

const bytesView = computed(() => {
  if (!inputText.value) return []

  const encoder = new TextEncoder()
  const bytes = Array.from(encoder.encode(inputText.value))
  const rows = []
  const bytesPerRow = 16

  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const chunk = bytes.slice(i, i + bytesPerRow)
    const offset = (i).toString(16).toUpperCase().padStart(8, '0')
    const hex = chunk.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
    const ascii = chunk.map(b => {
      if (b >= 32 && b <= 126) return String.fromCharCode(b)
      return '.'
    }).join('')

    rows.push({ offset, hex, ascii })
  }

  return rows
})

const clearInput = () => { inputText.value = '' }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }

useSeoMeta({
  title: '二进制查看器 - 在线Hex查看工具',
  description: '免费在线二进制查看器，以十六进制和ASCII格式查看文件内容。',
  keywords: ['binary', 'hex', '查看器', '文件', '十六进制', 'ascii', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('二进制查看器')
</script>
