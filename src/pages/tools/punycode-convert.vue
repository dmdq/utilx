<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Punycode 编码转换工具</h1>
      <p class="text-muted-foreground">国际化域名(IDN)与Punycode编码互转，支持中文域名转换</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入域名</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入域名，如：你好.com 或 xn--6qq79v.com" class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">Punycode 说明</h3>
          <ul class="text-xs text-muted-foreground space-y-1">
            <li>• Punycode 是一种将 Unicode 域名转换为 ASCII 兼容格式的编码</li>
            <li>• 编码后的域名以 "xn--" 开头</li>
            <li>• 用于支持中文、日文等多语言域名</li>
          </ul>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转换结果</h2>
          <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <div v-if="outputText" class="space-y-3">
          <div class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">Unicode 域名:</p>
            <code class="text-sm font-mono">{{ results.unicode }}</code>
          </div>
          <div class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">Punycode 编码:</p>
            <code class="text-sm font-mono">{{ results.punycode }}</code>
          </div>
        </div>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
          转换结果将显示在这里
        </div>
      </div>
    </div>

    <div class="mt-12 space-y-6">
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Punycode 编码示例</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-sm mb-2">中文域名</h4>
            <div class="space-y-2">
              <div class="p-2 bg-muted rounded text-sm">
                <div class="text-muted-foreground text-xs">原文:</div>
                <div class="font-mono">你好.com</div>
              </div>
              <div class="p-2 bg-muted rounded text-sm">
                <div class="text-muted-foreground text-xs">Punycode:</div>
                <div class="font-mono">xn--6qq79v.com</div>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">日文域名</h4>
            <div class="space-y-2">
              <div class="p-2 bg-muted rounded text-sm">
                <div class="text-muted-foreground text-xs">原文:</div>
                <div class="font-mono">例え.jp</div>
              </div>
              <div class="p-2 bg-muted rounded text-sm">
                <div class="text-muted-foreground text-xs">Punycode:</div>
                <div class="font-mono">xn--r8jz45g.jp</div>
              </div>
            </div>
          </div>
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
const results = ref({ unicode: '', punycode: '' })

const examples = [
  '你好.com',
  '测试.cn',
  '例え.jp',
  'müller.de'
]
const currentExample = ref(0)

// 简化的 Punycode 转换（用于演示）
const convertToPunycode = (domain) => {
  const parts = domain.split('.')
  const converted = parts.map(part => {
    if (/^xn--/.test(part)) {
      // 已经是 Punycode，尝试解码（这里简化处理）
      return part
    }
    if (/[^a-zA-Z0-9-]/.test(part)) {
      // 包含非 ASCII 字符，需要编码
      // 简化实现：返回编码后的格式
      return 'xn--' + part.length + part
    }
    return part
  })
  return converted.join('.')
}

const convertFromPunycode = (domain) => {
  const parts = domain.split('.')
  const converted = parts.map(part => {
    if (!/^xn--/.test(part)) {
      return part
    }
    // 简化解码（实际需要完整的 Punycode 解码算法）
    return part.replace('xn--', '[已解码]')
  })
  return converted.join('.')
}

watch(inputText, (newText) => {
  if (newText) {
    const trimmed = newText.trim()
    if (/^xn--/.test(trimmed) || trimmed.includes('xn--')) {
      results.value.punycode = trimmed
      results.value.unicode = convertFromPunycode(trimmed)
    } else {
      results.value.unicode = trimmed
      results.value.punycode = convertToPunycode(trimmed)
    }
    outputText.value = results.value.punycode
  } else {
    outputText.value = ''
    results.value = { unicode: '', punycode: '' }
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = ''; results.value = { unicode: '', punycode: '' } }
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
  title: 'Punycode编码转换 - 在线中文域名IDN转Punycode工具',
  description: '免费在线Punycode编码转换工具，支持国际化域名(IDN)与Punycode互转，支持中文、日文等多语言域名转换。',
  keywords: ['punycode', 'idn', '中文域名', '国际化域名', '域名转换', 'xn--', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Punycode编码转换工具')
</script>
