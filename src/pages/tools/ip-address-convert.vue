<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">IP 地址转换工具</h1>
      <p class="text-muted-foreground">IPv4/IPv6 地址与十进制、十六进制之间的互转</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入 IP 地址</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="192.168.1.1" class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">转换格式</h3>
          <div class="flex flex-wrap gap-2">
            <button v-for="format in formats" :key="format.value" @click="selectedFormat = format.value" :class="['px-3 py-2 text-sm rounded-lg border transition-colors', selectedFormat === format.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']">{{ format.label }}</button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转换结果</h2>
          <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <div class="space-y-3">
          <div v-if="results.dot" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">点分十进制:</p>
            <code class="text-sm font-mono">{{ results.dot }}</code>
          </div>
          <div v-if="results.decimal" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">十进制:</p>
            <code class="text-sm font-mono">{{ results.decimal }}</code>
          </div>
          <div v-if="results.hex" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">十六进制:</p>
            <code class="text-sm font-mono">{{ results.hex }}</code>
          </div>
          <div v-if="results.binary" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">二进制:</p>
            <code class="text-xs font-mono break-all">{{ results.binary }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const selectedFormat = ref('all')
const copied = ref(false)

const formats = [
  { value: 'all', label: '全部' },
  { value: 'decimal', label: '十进制' },
  { value: 'hex', label: '十六进制' },
  { value: 'binary', label: '二进制' }
]

const results = ref({
  dot: '',
  decimal: '',
  hex: '',
  binary: ''
})

const examples = [
  '192.168.1.1',
  '8.8.8.8',
  '255.255.255.255',
  '127.0.0.1'
]
const currentExample = ref(0)

const convertIP = (ip) => {
  const parts = ip.split('.')
  if (parts.length !== 4) return null

  const decimal = parts.reduce((acc, part) => acc * 256 + parseInt(part), 0)
  const hex = decimal.toString(16).toUpperCase().padStart(8, '0')
  const binary = decimal.toString(2).padStart(32, '0')

  return {
    dot: ip,
    decimal: decimal.toString(),
    hex: hex,
    binary: binary.match(/.{8}/g).join('.')
  }
}

watch(inputText, (newText) => {
  if (newText) {
    const converted = convertIP(newText.trim())
    if (converted) {
      results.value = converted
      outputText.value = converted[selectedFormat.value === 'all' ? 'decimal' : selectedFormat.value]
    } else {
      outputText.value = '无效的 IP 地址'
    }
  } else {
    results.value = { dot: '', decimal: '', hex: '', binary: '' }
    outputText.value = ''
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = ''; results.value = { dot: '', decimal: '', hex: '', binary: '' } }
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
  title: 'IP地址转换 - 在线IPv4地址转换工具',
  description: '免费在线IP地址转换工具，支持IPv4地址与十进制、十六进制、二进制之间的互转。',
  keywords: ['ip', 'ipv4', '地址转换', '十进制', '十六进制', '网络工具', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('IP地址转换工具')
</script>
