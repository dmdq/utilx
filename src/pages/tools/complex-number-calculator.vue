<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">复数计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">复数四则运算、模幅角计算、极坐标转换</p>
    </div>

    <!-- 复数输入 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">复数输入</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">复数 A (a + bi)</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="complexA.real"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="实部 a"
            >
            <span class="text-gray-500">+</span>
            <input
              v-model.number="complexA.imag"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="虚部 b"
            >
            <span class="text-gray-500">i</span>
          </div>
          <p class="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {{ formatComplex(complexA.real, complexA.imag) }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">复数 B (c + di)</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="complexB.real"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="实部 c"
            >
            <span class="text-gray-500">+</span>
            <input
              v-model.number="complexB.imag"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="虚部 d"
            >
            <span class="text-gray-500">i</span>
          </div>
          <p class="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {{ formatComplex(complexB.real, complexB.imag) }}
          </p>
        </div>
      </div>

      <!-- 运算选择 -->
      <div class="mt-6">
        <label class="block text-sm font-medium mb-2">选择运算</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="op in operations"
            :key="op.id"
            @click="selectedOperation = op.id; calculate()"
            :class="[
              'px-4 py-2 rounded-lg transition',
              selectedOperation === op.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900'
            ]"
          >
            {{ op.symbol }}
          </button>
        </div>
      </div>
    </div>

    <!-- 计算结果 -->
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <!-- 运算结果 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">运算结果</h2>

        <div v-if="result" class="space-y-4">
          <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">结果 (a + bi)</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ formatComplex(result.real, result.imag) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">实部</p>
              <p class="text-lg font-semibold">{{ result.real.toFixed(4) }}</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">虚部</p>
              <p class="text-lg font-semibold">{{ result.imag.toFixed(4) }}i</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          选择运算查看结果
        </div>
      </div>

      <!-- 极坐标形式 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">极坐标形式</h2>

        <div class="space-y-4">
          <!-- 复数A -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm font-medium mb-2">复数 A</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-gray-600 dark:text-gray-400">模</p>
                <p class="font-semibold">{{ modulusA.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-gray-600 dark:text-gray-400">幅角</p>
                <p class="font-semibold">{{ argumentA.toFixed(4) }} rad</p>
              </div>
            </div>
            <p class="text-sm text-blue-600 dark:text-blue-400 mt-2">
              {{ modulusA.toFixed(4) }} × e^({{ argumentA.toFixed(4) }}i)
            </p>
          </div>

          <!-- 复数B -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="text-sm font-medium mb-2">复数 B</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-gray-600 dark:text-gray-400">模</p>
                <p class="font-semibold">{{ modulusB.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-gray-600 dark:text-gray-400">幅角</p>
                <p class="font-semibold">{{ argumentB.toFixed(4) }} rad</p>
              </div>
            </div>
            <p class="text-sm text-purple-600 dark:text-purple-400 mt-2">
              {{ modulusB.toFixed(4) }} × e^({{ argumentB.toFixed(4) }}i)
            </p>
          </div>

          <!-- 结果极坐标 -->
          <div v-if="result" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm font-medium mb-2">结果</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-gray-600 dark:text-gray-400">模</p>
                <p class="font-semibold">{{ resultModulus.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-gray-600 dark:text-gray-400">幅角</p>
                <p class="font-semibold">{{ resultArgument.toFixed(4) }} rad</p>
              </div>
            </div>
            <p class="text-sm text-green-600 dark:text-green-400 mt-2">
              {{ resultModulus.toFixed(4) }} × e^({{ resultArgument.toFixed(4) }}i)
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷计算 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">单复数计算</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 共轭复数 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">共轭复数</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">A 的共轭</span>
              <span class="font-medium">{{ formatComplex(complexA.real, -complexA.imag) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">B 的共轭</span>
              <span class="font-medium">{{ formatComplex(complexB.real, -complexB.imag) }}</span>
            </div>
          </div>
        </div>

        <!-- 平方根 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">平方根</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">√A</span>
              <span class="font-medium">{{ sqrtA }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">√B</span>
              <span class="font-medium">{{ sqrtB }}</span>
            </div>
          </div>
        </div>

        <!-- 倒数 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">倒数 (1/z)</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">1/A</span>
              <span class="font-medium">{{ reciprocalA }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">1/B</span>
              <span class="font-medium">{{ reciprocalB }}</span>
            </div>
          </div>
        </div>

        <!-- 平方 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">平方 (z²)</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">A²</span>
              <span class="font-medium">{{ squareA }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">B²</span>
              <span class="font-medium">{{ squareB }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 公式说明 -->
    <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">复数运算公式</h2>
      <div class="space-y-3 text-sm">
        <p><strong>加法：</strong> (a + bi) + (c + di) = (a + c) + (b + d)i</p>
        <p><strong>减法：</strong> (a + bi) - (c + di) = (a - c) + (b - d)i</p>
        <p><strong>乘法：</strong> (a + bi) × (c + di) = (ac - bd) + (ad + bc)i</p>
        <p><strong>除法：</strong> (a + bi) ÷ (c + di) = [(ac + bd) + (bc - ad)i] / (c² + d²)</p>
        <p><strong>模：</strong> |z| = √(a² + b²)</p>
        <p><strong>幅角：</strong> arg(z) = arctan(b/a)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '复数计算器 - 复数运算工具',
  meta: [{ name: 'description', content: '在线复数计算器，支持复数加减乘除运算、模幅角计算、极坐标转换、共轭复数计算。适用于数学学习、工程计算等场景。' }],
  keywords: ['复数计算', '复数运算', '复数加减乘除', '模计算', '幅角计算', '共轭复数', '极坐标']
})

const complexA = ref({ real: 3, imag: 4 })
const complexB = ref({ real: 1, imag: 2 })
const selectedOperation = ref<string>('add')

const operations = [
  { id: 'add', symbol: '+' },
  { id: 'subtract', symbol: '-' },
  { id: 'multiply', symbol: '×' },
  { id: 'divide', symbol: '÷' }
]

const result = ref<{ real: number; imag: number } | null>(null)

// 计算模
const modulusA = computed(() => {
  return Math.sqrt(complexA.value.real ** 2 + complexA.value.imag ** 2)
})

const modulusB = computed(() => {
  return Math.sqrt(complexB.value.real ** 2 + complexB.value.imag ** 2)
})

// 计算幅角
const argumentA = computed(() => {
  return Math.atan2(complexA.value.imag, complexA.value.real)
})

const argumentB = computed(() => {
  return Math.atan2(complexB.value.imag, complexB.value.real)
})

// 结果的模和幅角
const resultModulus = computed(() => {
  if (!result.value) return 0
  return Math.sqrt(result.value.real ** 2 + result.value.imag ** 2)
})

const resultArgument = computed(() => {
  if (!result.value) return 0
  return Math.atan2(result.value.imag, result.value.real)
})

// 共轭复数
const conjugateA = computed(() => {
  return { real: complexA.value.real, imag: -complexA.value.imag }
})

const conjugateB = computed(() => {
  return { real: complexB.value.real, imag: -complexB.value.imag }
})

// 平方根
const sqrtA = computed(() => {
  return complexSqrt(complexA.value)
})

const sqrtB = computed(() => {
  return complexSqrt(complexB.value)
})

// 倒数
const reciprocalA = computed(() => {
  return complexReciprocal(complexA.value)
})

const reciprocalB = computed(() => {
  return complexReciprocal(complexB.value)
})

// 平方
const squareA = computed(() => {
  return complexMultiply(complexA.value, complexA.value)
})

const squareB = computed(() => {
  return complexMultiply(complexB.value, complexB.value)
})

function calculate() {
  const a = complexA.value
  const b = complexB.value

  switch (selectedOperation.value) {
    case 'add':
      result.value = {
        real: a.real + b.real,
        imag: a.imag + b.imag
      }
      break
    case 'subtract':
      result.value = {
        real: a.real - b.real,
        imag: a.imag - b.imag
      }
      break
    case 'multiply':
      result.value = complexMultiply(a, b)
      break
    case 'divide':
      result.value = complexDivide(a, b)
      break
  }
}

function complexMultiply(a: { real: number; imag: number }, b: { real: number; imag: number }) {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real
  }
}

function complexDivide(a: { real: number; imag: number }, b: { real: number; imag: number }) {
  const denominator = b.real ** 2 + b.imag ** 2
  if (denominator === 0) {
    return { real: 0, imag: 0 }
  }
  return {
    real: (a.real * b.real + a.imag * b.imag) / denominator,
    imag: (a.imag * b.real - a.real * b.imag) / denominator
  }
}

function complexSqrt(z: { real: number; imag: number }): string {
  const r = Math.sqrt(z.real ** 2 + z.imag ** 2)
  const theta = Math.atan2(z.imag, z.real)

  const sqrtR = Math.sqrt(r)
  const real = sqrtR * Math.cos(theta / 2)
  const imag = sqrtR * Math.sin(theta / 2)

  return `±(${real.toFixed(4)} + ${imag.toFixed(4)}i)`
}

function complexReciprocal(z: { real: number; imag: number }): string {
  const denominator = z.real ** 2 + z.imag ** 2
  if (denominator === 0) return '不存在'

  const real = z.real / denominator
  const imag = -z.imag / denominator

  return formatComplex(real, imag)
}

function formatComplex(real: number, imag: number): string {
  const r = parseFloat(real.toFixed(4))
  const i = parseFloat(imag.toFixed(4))

  if (i === 0) return `${r}`
  if (r === 0) return `${i}i`
  if (i > 0) return `${r} + ${i}i`
  return `${r} - ${Math.abs(i)}i`
}
</script>
