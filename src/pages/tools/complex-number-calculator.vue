<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">复数计算器 - 复数运算工具</h1>
      <p class="text-muted-foreground">在线复数计算器，支持复数加减乘除运算、模幅角计算、极坐标转换、共轭复数计算。适用于数学学习、工程计算等场景。</p>
    </div>

    <!-- 复数输入 -->
    <div class="bg-card rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">复数输入</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2 text-foreground">复数 A (a + bi)</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="complexA.real"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="实部 a"
            >
            <span class="text-muted-foreground">+</span>
            <input
              v-model.number="complexA.imag"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="虚部 b"
            >
            <span class="text-muted-foreground">i</span>
          </div>
          <p class="text-sm text-primary mt-2">
            {{ formatComplex(complexA.real, complexA.imag) }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2 text-foreground">复数 B (c + di)</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="complexB.real"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="实部 c"
            >
            <span class="text-muted-foreground">+</span>
            <input
              v-model.number="complexB.imag"
              type="number"
              step="0.01"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="虚部 d"
            >
            <span class="text-muted-foreground">i</span>
          </div>
          <p class="text-sm text-primary mt-2">
            {{ formatComplex(complexB.real, complexB.imag) }}
          </p>
        </div>
      </div>

      <!-- 运算选择 -->
      <div class="mt-6">
        <label class="block text-sm font-medium mb-2 text-foreground">选择运算</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="op in operations"
            :key="op.id"
            @click="selectedOperation = op.id; calculate()"
            :class="[
              'px-4 py-2 rounded-lg transition',
              selectedOperation === op.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
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
      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">运算结果</h2>

        <div v-if="result" class="space-y-4">
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">结果 (a + bi)</p>
            <p class="text-2xl font-bold text-primary">
              {{ formatComplex(result.real, result.imag) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">实部</p>
              <p class="text-lg font-semibold text-foreground">{{ result.real.toFixed(4) }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">虚部</p>
              <p class="text-lg font-semibold text-foreground">{{ result.imag.toFixed(4) }}i</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          选择运算查看结果
        </div>
      </div>

      <!-- 极坐标形式 -->
      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">极坐标形式</h2>

        <div class="space-y-4">
          <!-- 复数A -->
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm font-medium mb-2 text-foreground">复数 A</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-muted-foreground">模</p>
                <p class="font-semibold text-foreground">{{ modulusA.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">幅角</p>
                <p class="font-semibold text-foreground">{{ argumentA.toFixed(4) }} rad</p>
              </div>
            </div>
            <p class="text-sm text-primary mt-2">
              {{ modulusA.toFixed(4) }} × e^({{ argumentA.toFixed(4) }}i)
            </p>
          </div>

          <!-- 复数B -->
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm font-medium mb-2 text-foreground">复数 B</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-muted-foreground">模</p>
                <p class="font-semibold text-foreground">{{ modulusB.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">幅角</p>
                <p class="font-semibold text-foreground">{{ argumentB.toFixed(4) }} rad</p>
              </div>
            </div>
            <p class="text-sm text-primary mt-2">
              {{ modulusB.toFixed(4) }} × e^({{ argumentB.toFixed(4) }}i)
            </p>
          </div>

          <!-- 结果极坐标 -->
          <div v-if="result" class="p-4 bg-muted rounded-lg">
            <p class="text-sm font-medium mb-2 text-foreground">结果</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-muted-foreground">模</p>
                <p class="font-semibold text-foreground">{{ resultModulus.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">幅角</p>
                <p class="font-semibold text-foreground">{{ resultArgument.toFixed(4) }} rad</p>
              </div>
            </div>
            <p class="text-sm text-primary mt-2">
              {{ resultModulus.toFixed(4) }} × e^({{ resultArgument.toFixed(4) }}i)
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷计算 -->
    <div class="bg-card rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">单复数计算</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 共轭复数 -->
        <div class="p-4 bg-muted rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">共轭复数</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">A 的共轭</span>
              <span class="font-medium text-foreground">{{ formatComplex(complexA.real, -complexA.imag) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">B 的共轭</span>
              <span class="font-medium text-foreground">{{ formatComplex(complexB.real, -complexB.imag) }}</span>
            </div>
          </div>
        </div>

        <!-- 平方根 -->
        <div class="p-4 bg-muted rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">平方根</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">√A</span>
              <span class="font-medium text-foreground">{{ sqrtA }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">√B</span>
              <span class="font-medium text-foreground">{{ sqrtB }}</span>
            </div>
          </div>
        </div>

        <!-- 倒数 -->
        <div class="p-4 bg-muted rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">倒数 (1/z)</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">1/A</span>
              <span class="font-medium text-foreground">{{ reciprocalA }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">1/B</span>
              <span class="font-medium text-foreground">{{ reciprocalB }}</span>
            </div>
          </div>
        </div>

        <!-- 平方 -->
        <div class="p-4 bg-muted rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">平方 (z²)</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">A²</span>
              <span class="font-medium text-foreground">{{ squareA }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">B²</span>
              <span class="font-medium text-foreground">{{ squareB }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 公式说明 -->
    <div class="bg-card rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">复数运算公式</h2>
      <div class="space-y-3 text-sm text-muted-foreground">
        <p><strong class="text-foreground">加法：</strong> (a + bi) + (c + di) = (a + c) + (b + d)i</p>
        <p><strong class="text-foreground">减法：</strong> (a + bi) - (c + di) = (a - c) + (b - d)i</p>
        <p><strong class="text-foreground">乘法：</strong> (a + bi) × (c + di) = (ac - bd) + (ad + bc)i</p>
        <p><strong class="text-foreground">除法：</strong> (a + bi) ÷ (c + di) = [(ac + bd) + (bc - ad)i] / (c² + d²)</p>
        <p><strong class="text-foreground">模：</strong> |z| = √(a² + b²)</p>
        <p><strong class="text-foreground">幅角：</strong> arg(z) = arctan(b/a)</p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是复数？
        </h2>
        <p class="text-muted-foreground mb-4">
          复数是实数的扩展，形式为 a + bi，其中 a 是实部，b 是虚部，i 是虚数单位（满足 i² = -1）。
          复数在数学、物理、工程等领域有广泛应用，特别是在交流电路分析、信号处理、量子力学等方面。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          复数的表示方法
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>代数形式</strong>: a + bi，最常用的表示形式</li>
          <li><strong>极坐标形式</strong>: r(cos θ + i·sin θ)，其中 r 是模，θ 是幅角</li>
          <li><strong>指数形式</strong>: re^(iθ)，使用欧拉公式表示</li>
          <li><strong>几何表示</strong>: 在复平面上用点或向量表示</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          复数的运算规则
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>加减法</strong>: 实部与实部相加减，虚部与虚部相加减</li>
          <li><strong>乘法</strong>: 使用分配律展开，注意 i² = -1</li>
          <li><strong>除法</strong>: 分子分母同时乘以分母的共轭复数，使分母实数化</li>
          <li><strong>共轭复数</strong>: 改变虚部的符号，即 a + bi 的共轭为 a - bi</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          复数的应用
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>电气工程</strong>: 交流电路分析，阻抗计算</li>
          <li><strong>信号处理</strong>: 傅里叶变换，频域分析</li>
          <li><strong>控制系统</strong>: 传递函数，稳定性分析</li>
          <li><strong>量子力学</strong>: 波函数，量子态表示</li>
          <li><strong>流体力学</strong>: 势流理论，复变函数</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是虚数单位 i？</h3>
            <p class="text-muted-foreground mt-1">
              虚数单位 i 是一个特殊的数，满足 i² = -1。它使得负数也可以开平方根。
              在实数范围内，负数没有实数平方根，但在复数范围内，-1 的平方根就是 i。
              虚数单位在工程和物理中非常重要，特别是在交流电路分析中。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是共轭复数？</h3>
            <p class="text-muted-foreground mt-1">
              共轭复数是指将复数的虚部符号取反而得到的新复数。例如，a + bi 的共轭复数是 a - bi。
              共轭复数的一个重要性质是：复数与其共轭复数的乘积等于该复数模的平方，即 (a + bi)(a - bi) = a² + b²。
              这个性质在复数除法中非常有用，可以用来有理化分母。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">复数的模和幅角是什么？</h3>
            <p class="text-muted-foreground mt-1">
              复数的模（也叫绝对值或大小）表示复数在复平面上到原点的距离，计算公式为 |z| = √(a² + b²)。
              幅角表示复数在复平面上的方向，是复数向量与正实轴的夹角，计算公式为 arg(z) = arctan(b/a)。
              使用模和幅角可以方便地进行复数的乘除运算，以及极坐标和指数形式的转换。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '复数计算器 - 复数运算工具 | Util工具箱',
  description: '在线复数计算器，支持复数加减乘除运算、模幅角计算、极坐标转换、共轭复数计算。适用于数学学习、工程计算等场景。',
  keywords: '复数计算,复数运算,复数加减乘除,模计算,幅角计算,共轭复数,极坐标,复数计算器',
  author: 'Util工具箱',
  ogTitle: '复数计算器 - 复数运算工具',
  ogDescription: '在线复数计算器，支持复数加减乘除运算、模幅角计算、极坐标转换、共轭复数计算。',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '复数计算器',
            description: '在线复数计算器，支持复数加减乘除运算',
            url: 'https://www.util.cn/tools/complex-number-calculator',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '复数加减乘除运算',
              '模幅角计算',
              '极坐标转换',
              '共轭复数计算',
              '平方根和倒数计算'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是虚数单位 i？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '虚数单位 i 是一个特殊的数，满足 i² = -1。它使得负数也可以开平方根。在实数范围内，负数没有实数平方根，但在复数范围内，-1 的平方根就是 i。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是共轭复数？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '共轭复数是指将复数的虚部符号取反而得到的新复数。例如，a + bi 的共轭复数是 a - bi。共轭复数的一个重要性质是：复数与其共轭复数的乘积等于该复数模的平方。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

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

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap: Record<string, any> = {
  Calculator: null,
  Functions: null,
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'scientific-calculator'),
    tools.find(t => t.id === 'matrix-calculator'),
    tools.find(t => t.id === 'vector-calculator'),
    tools.find(t => t.id === 'statistics-calculator')
  ].filter(Boolean)
})
</script>
