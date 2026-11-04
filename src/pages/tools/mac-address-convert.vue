<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">MAC 地址转换工具</h1>
      <p class="text-muted-foreground">MAC 地址格式转换与编码，支持多种格式</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入 MAC 地址</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入 MAC 地址..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>
      </div>

      <div class="space-y-3">
        <h2 class="text-lg font-semibold">转换结果</h2>
        <div v-if="results.colon" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">冒号分隔 (XX:XX:XX:XX:XX:XX):</p>
          <code class="text-sm font-mono">{{ results.colon }}</code>
        </div>
        <div v-if="results.dash" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">横杠分隔 (XX-XX-XX-XX-XX-XX):</p>
          <code class="text-sm font-mono">{{ results.dash }}</code>
        </div>
        <div v-if="results.dot" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">点分隔 (XXXX.XXXX.XXXX):</p>
          <code class="text-sm font-mono">{{ results.dot }}</code>
        </div>
        <div v-if="results.hex" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">连续十六进制:</p>
          <code class="text-sm font-mono">{{ results.hex }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const results = ref({ colon: '', dash: '', dot: '', hex: '' })

const examples = [
  '00:1A:2B:3C:4D:5E',
  '00-1A-2B-3C-4D-5E',
  '001A.2B3C.4D5E',
  '001A2B3C4D5E'
]
const currentExample = ref(0)

const parseMAC = (mac) => {
  const clean = mac.replace(/[^0-9A-Fa-f]/g, '')
  if (clean.length !== 12) return null

  const parts = clean.match(/.{2}/g)
  if (!parts) return null

  return {
    colon: parts.join(':').toUpperCase(),
    dash: parts.join('-').toUpperCase(),
    dot: [parts.slice(0, 2).join(''), parts.slice(2, 4).join(''), parts.slice(4, 6).join('')].join('.').toUpperCase(),
    hex: clean.toUpperCase()
  }
}

watch(inputText, (newText) => {
  if (newText) {
    const parsed = parseMAC(newText.trim())
    if (parsed) {
      results.value = parsed
    } else {
      results.value = { colon: '', dash: '', dot: '', hex: '' }
    }
  } else {
    results.value = { colon: '', dash: '', dot: '', hex: '' }
  }
})

const clearInput = () => { inputText.value = ''; results.value = { colon: '', dash: '', dot: '', hex: '' } }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }

useSeoMeta({
  title: 'MAC地址转换 - 在线MAC地址格式转换工具',
  description: '免费在线MAC地址转换工具，支持冒号、横杠、点分隔等多种格式互转。',
  keywords: ['mac', '地址', '转换', '硬件地址', '网络适配器', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('MAC地址转换工具')
</script>
