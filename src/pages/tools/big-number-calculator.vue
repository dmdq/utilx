<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">大数计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">超大整数精确计算、阶乘、幂运算</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">大数运算</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">数字 A</label>
            <input v-model="numA" type="text" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="输入大整数">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">数字 B</label>
            <input v-model="numB" type="text" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="输入大整数">
          </div>
          <div class="flex gap-2">
            <button @click="calculateBigNumber('+')" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded">加</button>
            <button @click="calculateBigNumber('-')" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded">减</button>
            <button @click="calculateBigNumber('*')" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded">乘</button>
            <button @click="calculateBigNumber('/')" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded">除</button>
          </div>
          <div v-if="result" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">结果</p>
            <p class="text-lg font-semibold text-green-600 break-all">{{ result }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">阶乘与幂</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">阶乘 n!</label>
            <input v-model.number="factorialN" type="number" min="0" max="500" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <button @click="calculateFactorial" class="w-full px-4 py-2 bg-purple-500 text-white rounded">计算阶乘</button>
          <div v-if="factorialResult" class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="text-sm font-medium break-all">{{ factorialN }}! = {{ factorialResult }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '大数计算器 - 超大整数精确计算',
  meta: [{ name: 'description', content: '在线大数计算器，支持超大整数的加减乘除精确计算、阶乘计算、幂运算。适用于数学计算、密码学等领域。' }],
  keywords: ['大数计算', '大整数', '阶乘计算', '精确计算', 'BigInt', '超大数']
})

const numA = ref('')
const numB = ref('')
const result = ref('')
const factorialN = ref(10)
const factorialResult = ref('')

function calculateBigNumber(op: string) {
  try {
    const a = BigInt(numA.value || '0')
    const b = BigInt(numB.value || '0')
    let res: bigint

    switch (op) {
      case '+': res = a + b; break
      case '-': res = a - b; break
      case '*': res = a * b; break
      case '/': res = b !== 0n ? a / b : 0n; break
    }
    result.value = res.toString()
  } catch (e) {
    result.value = '错误: ' + (e as Error).message
  }
}

function calculateFactorial() {
  try {
    let res = 1n
    for (let i = 2n; i <= BigInt(factorialN.value); i++) {
      res *= i
    }
    factorialResult.value = res.toString()
  } catch (e) {
    factorialResult.value = '错误: ' + (e as Error).message
  }
}
</script>
