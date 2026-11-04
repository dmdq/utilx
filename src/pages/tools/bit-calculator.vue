<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">位运算计算器</h1>
      <p class="text-muted-foreground">支持 AND、OR、XOR、NOT、左移、右移等位运算操作</p>
    </div>

    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">操作数 A</h2>
            <button @click="clearAll" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
          </div>

          <div class="space-y-2">
            <input v-model.number="operandA" type="number" placeholder="输入数字" class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <div class="bg-muted p-3 rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">二进制:</p>
              <p class="font-mono text-sm">{{ operandA !== null ? toBinary(operandA) : '-' }}</p>
            </div>
            <div class="bg-muted p-3 rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">十六进制:</p>
              <p class="font-mono text-sm">{{ operandA !== null ? toHex(operandA) : '-' }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">操作数 B</h2>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>

          <div class="space-y-2">
            <input v-model.number="operandB" type="number" placeholder="输入数字" class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <div class="bg-muted p-3 rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">二进制:</p>
              <p class="font-mono text-sm">{{ operandB !== null ? toBinary(operandB) : '-' }}</p>
            </div>
            <div class="bg-muted p-3 rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">十六进制:</p>
              <p class="font-mono text-sm">{{ operandB !== null ? toHex(operandB) : '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-muted p-4 rounded-lg">
        <h3 class="font-medium text-sm mb-3">位运算操作</h3>
        <div class="flex flex-wrap gap-2">
          <button v-for="op in unaryOps" :key="op.key" @click="performUnary(op.key)" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            {{ op.label }} (A)
          </button>
          <button v-for="op in binaryOps" :key="op.key" @click="performBinary(op.key)" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            A {{ op.label }} B
          </button>
        </div>
      </div>

      <div v-if="result !== null" class="space-y-4">
        <h2 class="text-lg font-semibold">运算结果</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">十进制:</p>
            <p class="font-mono text-lg">{{ result }}</p>
          </div>
          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">二进制:</p>
            <p class="font-mono text-lg">{{ toBinary(result) }}</p>
          </div>
          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">十六进制:</p>
            <p class="font-mono text-lg">{{ toHex(result) }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="copyResult" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">{{ copied ? '已复制' : '复制结果' }}</button>
          <button @click="result = operandA" class="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80">设为操作数 A</button>
        </div>
      </div>

      <div class="bg-muted p-4 rounded-lg">
        <h3 class="font-medium text-sm mb-2">位运算说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p class="font-medium text-foreground mb-1">AND (&)</p>
            <p>按位与，两位都为 1 时结果为 1</p>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">OR (|)</p>
            <p>按位或，两位有一位为 1 时结果为 1</p>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">XOR (^)</p>
            <p>按位异或，两位不同时结果为 1</p>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">NOT (~)</p>
            <p>按位取反，0 变 1，1 变 0</p>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">左移 (<<)</p>
            <p>各位左移指定位数，低位补 0</p>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">右移 (>>)</p>
            <p>各位右移指定位数，正数高位补 0</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'

const operandA = ref(null)
const operandB = ref(null)
const result = ref(null)
const copied = ref(false)

const unaryOps = [
  { key: 'not', label: 'NOT ~' }
]

const binaryOps = [
  { key: 'and', label: 'AND &' },
  { key: 'or', label: 'OR |' },
  { key: 'xor', label: 'XOR ^' },
  { key: 'leftShift', label: '<<' },
  { key: 'rightShift', label: '>>' }
]

const toBinary = (num) => {
  const n = num | 0
  return n >= 0 ? n.toString(2) : (n >>> 0).toString(2)
}

const toHex = (num) => {
  const n = num | 0
  return n >= 0 ? n.toString(16).toUpperCase() : (n >>> 0).toString(16).toUpperCase()
}

const performUnary = (op) => {
  if (operandA.value === null) return
  const a = operandA.value | 0

  switch (op) {
    case 'not':
      result.value = ~a
      break
  }
}

const performBinary = (op) => {
  if (operandA.value === null || operandB.value === null) return
  const a = operandA.value | 0
  const b = operandB.value | 0

  switch (op) {
    case 'and':
      result.value = a & b
      break
    case 'or':
      result.value = a | b
      break
    case 'xor':
      result.value = a ^ b
      break
    case 'leftShift':
      result.value = a << b
      break
    case 'rightShift':
      result.value = a >> b
      break
  }
}

const clearAll = () => {
  operandA.value = null
  operandB.value = null
  result.value = null
}

const loadExample = () => {
  operandA.value = 10
  operandB.value = 6
}

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(String(result.value))
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = String(result.value)
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

useSeoMeta({
  title: '位运算计算器 - 在线位运算工具',
  description: '免费在线位运算计算器，支持AND、OR、XOR、NOT、左移、右移等位运算操作，实时显示二进制和十六进制结果。',
  keywords: ['位运算', 'bitwise', 'and', 'or', 'xor', 'not', '左移', '右移', '计算器', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('位运算计算器')
</script>
