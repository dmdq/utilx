<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">LRC 校验工具</h1>
      <p class="text-muted-foreground">纵向冗余校验 (Longitudinal Redundancy Check)，用于数据传输错误检测</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入数据</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入需要计算LRC的数据..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">输入格式</h3>
          <select v-model="inputFormat" class="w-full p-2 border border-border rounded-lg text-sm">
            <option value="text">文本 (ASCII)</option>
            <option value="hex">十六进制字符串</option>
          </select>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">校验结果</h2>
          <div class="flex gap-2">
            <button v-if="lrcResult" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
          </div>
        </div>

        <div v-if="lrcResult !== null" class="space-y-3">
          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">LRC 校验码 (十六进制):</p>
            <p class="font-mono text-2xl">{{ lrcResult.toString(16).toUpperCase().padStart(2, '0') }}</p>
          </div>

          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">LRC 校验码 (十进制):</p>
            <p class="font-mono text-xl">{{ lrcResult }}</p>
          </div>

          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">LRC 校验码 (二进制):</p>
            <p class="font-mono text-sm">{{ lrcResult.toString(2).padStart(8, '0') }}</p>
          </div>
        </div>

        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">输入数据后将显示LRC校验码</div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">LRC 算法说明</h3>
      <div class="text-xs text-muted-foreground space-y-2">
        <p>• LRC (纵向冗余校验) 是一种简单的错误检测算法</p>
        <p>• 计算方法: 将所有字节相加，然后取反</p>
        <p>• 公式: LRC = NOT(SUM(data[0..n]))</p>
        <p>• 常用于串口通信、Modbus协议等</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const inputFormat = ref('text')
const lrcResult = ref(null)
const copied = ref(false)

const examples = [
  'Hello World!',
  '123456789',
  'test'
]
const currentExample = ref(0)

const calculateLRC = (data) => {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }
  return ((sum ^ 0xFF) + 1) & 0xFF
}

watch([inputText, inputFormat], ([text, format]) => {
  if (!text) {
    lrcResult.value = null
    return
  }

  try {
    let bytes = []

    if (format === 'hex') {
      const hexStr = text.replace(/\s/g, '')
      if (hexStr.length % 2 !== 0) {
        lrcResult.value = null
        return
      }
      for (let i = 0; i < hexStr.length; i += 2) {
        bytes.push(parseInt(hexStr.substr(i, 2), 16))
      }
    } else {
      for (let i = 0; i < text.length; i++) {
        bytes.push(text.charCodeAt(i))
      }
    }

    lrcResult.value = calculateLRC(bytes)
  } catch (e) {
    lrcResult.value = null
  }
})

const clearInput = () => {
  inputText.value = ''
  lrcResult.value = null
}

const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

const copyOutput = async () => {
  const hexValue = lrcResult.value.toString(16).toUpperCase().padStart(2, '0')
  try {
    await navigator.clipboard.writeText(hexValue)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = hexValue
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

useSeoMeta({
  title: 'LRC校验 - 在线纵向冗余校验计算工具',
  description: '免费在线LRC校验工具，计算纵向冗余校验码，用于串口通信和Modbus协议的数据错误检测。',
  keywords: ['lrc', '纵向冗余校验', '校验码', '校验和', 'modbus', '串口通信', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('LRC校验工具')
</script>
