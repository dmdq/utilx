<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">BOM 处理工具</h1>
      <p class="text-muted-foreground">检测、添加和移除 UTF-8/UTF-16/UTF-32 文件的 BOM (字节顺序标记)</p>
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

        <textarea v-model="inputText" placeholder="请输入文本内容..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">BOM 类型</h3>
          <select v-model="selectedBom" class="w-full p-2 border border-border rounded-lg text-sm">
            <option value="utf8">UTF-8 BOM (EF BB BF)</option>
            <option value="utf16le">UTF-16 LE BOM (FF FE)</option>
            <option value="utf16be">UTF-16 BE BOM (FE FF)</option>
            <option value="utf32le">UTF-32 LE BOM (FF FE 00 00)</option>
            <option value="utf32be">UTF-32 BE BOM (00 00 FE FF)</option>
          </select>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">处理结果</h2>
          <div class="flex gap-2">
            <button v-if="inputText" @click="addBom" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">添加 BOM</button>
            <button v-if="inputText" @click="removeBom" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">移除 BOM</button>
            <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
          </div>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">处理结果将显示在这里</div>

        <div v-if="detectedBom" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">检测到的 BOM</h3>
          <p class="text-xs font-mono">{{ detectedBom }}</p>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">BOM 说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
        <div>
          <p class="font-medium text-foreground mb-1">UTF-8 BOM</p>
          <p>EF BB BF - 可选，用于标识 UTF-8 编码</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">UTF-16 LE BOM</p>
          <p>FF FE - 小端字节序</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">UTF-16 BE BOM</p>
          <p>FE FF - 大端字节序</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">UTF-32 LE BOM</p>
          <p>FF FE 00 00 - 小端字节序</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">UTF-32 BE BOM</p>
          <p>00 00 FE FF - 大端字节序</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const selectedBom = ref('utf8')
const copied = ref(false)
const detectedBom = ref('')

const examples = [
  'Hello, 世界!',
  '测试 BOM 处理',
  'Normal text without BOM'
]
const currentExample = ref(0)

const bomMarkers = {
  utf8: '\uFEFF',
  utf16le: '\uFEFF',
  utf16be: '\uFEFF',
  utf32le: '\uFEFF',
  utf32be: '\uFEFF'
}

const detectBom = (text) => {
  if (!text) return ''

  const code = text.charCodeAt(0)
  if (code === 0xFEFF) {
    return '检测到 BOM: U+FEFF (零宽非断空格)'
  } else if (code === 0xFFFE) {
    return '检测到 BOM: U+FFFE (非字符)'
  }

  return ''
}

const addBom = () => {
  if (!inputText.value) return

  const bom = bomMarkers[selectedBom.value]
  let text = inputText.value

  if (!text.startsWith(bom)) {
    outputText.value = bom + text
  } else {
    outputText.value = text
  }
}

const removeBom = () => {
  if (!inputText.value) return

  let text = inputText.value
  const bom = '\uFEFF'

  if (text.startsWith(bom)) {
    outputText.value = text.slice(1)
  } else {
    outputText.value = text
  }
}

watch(inputText, (newText) => {
  detectedBom.value = detectBom(newText)
})

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  detectedBom.value = ''
}

const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

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
  title: 'BOM处理工具 - 在线BOM检测添加移除工具',
  description: '免费在线BOM处理工具，支持检测、添加和移除UTF-8/UTF-16/UTF-32文件的字节顺序标记。',
  keywords: ['bom', '字节顺序标记', 'utf-8', 'utf-16', 'utf-32', '编码', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('BOM处理工具')
</script>
