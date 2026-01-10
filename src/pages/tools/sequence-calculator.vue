<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">数列计算器 - 等差等比数列求和、通项公式、数列生成</h1>
      <p class="text-muted-foreground">一款免费的在线数列计算工具。支持等差数列、等比数列的通项公式计算、求和计算以及数列生成。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 等差数列 -->
      <div class="flex flex-col h-full bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">等差数列</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">首项 a₁</label>
              <input v-model.number="ap.a1" type="number" class="w-full px-3 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">公差 d</label>
              <input v-model.number="ap.d" type="number" class="w-full px-3 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">项数 n</label>
            <input v-model.number="ap.n" type="number" class="w-full px-3 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
          </div>
          <button @click="calculateArithmetic" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">计算</button>
        </div>
      </div>

      <!-- 等比数列 -->
      <div class="flex flex-col h-full bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">等比数列</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">首项 a₁</label>
              <input v-model.number="gp.a1" type="number" class="w-full px-3 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">公比 q</label>
              <input v-model.number="gp.q" type="number" step="0.01" class="w-full px-3 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">项数 n</label>
            <input v-model.number="gp.n" type="number" class="w-full px-3 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
          </div>
          <button @click="calculateGeometric" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">计算</button>
        </div>
      </div>
    </div>

    <!-- 计算结果 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-xl font-semibold text-foreground mb-4">计算结果</h2>
      <div v-if="arithmeticResult" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="p-3 bg-muted rounded">
          <p class="text-sm text-muted-foreground">等差数列求和</p>
          <p class="text-xl font-bold text-primary">{{ arithmeticResult.sum }}</p>
        </div>
        <div class="p-3 bg-muted rounded">
          <p class="text-sm text-muted-foreground">通项公式</p>
          <p class="text-sm text-foreground">aₙ = {{ ap.a1 }} + (n-1)×{{ ap.d }}</p>
        </div>
      </div>
      <div v-if="geometricResult" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-3 bg-muted rounded">
          <p class="text-sm text-muted-foreground">等比数列求和</p>
          <p class="text-xl font-bold text-primary">{{ geometricResult.sum }}</p>
        </div>
        <div class="p-3 bg-muted rounded">
          <p class="text-sm text-muted-foreground">通项公式</p>
          <p class="text-sm text-foreground">aₙ = {{ gp.a1 }} × {{ gp.q }}^(n-1)</p>
        </div>
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
          什么是数列计算器？
        </h2>
        <p class="text-muted-foreground mb-4">
          数列是数学中的重要概念，按照一定规律排列的一列数叫做数列。数列中的每一个数都叫做这个数列的项。
          数列在数学、物理、计算机科学等领域都有广泛的应用。数列计算器可以帮助您快速计算等差数列和等比数列的各项数值、
          求和以及推导通项公式。
        </p>
        <p class="text-muted-foreground">
          等差数列是指相邻两项的差是一个常数（公差）的数列，如 1, 3, 5, 7, 9...
          等比数列是指相邻两项的比值是一个常数（公比）的数列，如 1, 2, 4, 8, 16...
          使用本工具可以快速计算这两种常见数列的各项参数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入首项（a₁）的值</li>
          <li>输入公差（d）或公比（q）的值</li>
          <li>输入要计算的项数（n）</li>
          <li>点击"计算"按钮获取结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>等差数列计算</strong>: 支持等差数列的通项公式和求和计算</li>
          <li><strong>等比数列计算</strong>: 支持等比数列的通项公式和求和计算</li>
          <li><strong>实时计算</strong>: 输入参数后立即显示计算结果</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>通项公式显示</strong>: 自动生成并显示数列的通项公式</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是等差数列？</h3>
            <p class="text-muted-foreground mt-1">
              等差数列是指从第二项起，每一项与它的前一项的差等于同一个常数的一种数列。
              这个常数叫做等差数列的公差，公差常用字母 d 表示。例如：1, 3, 5, 7, 9 就是一个公差为 2 的等差数列。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是等比数列？</h3>
            <p class="text-muted-foreground mt-1">
              等比数列是指从第二项起，每一项与它的前一项的比等于同一个常数的一种数列。
              这个常数叫做等比数列的公比，公比通常用字母 q 表示。例如：1, 2, 4, 8, 16 就是一个公比为 2 的等比数列。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算数列的和？</h3>
            <p class="text-muted-foreground mt-1">
              等差数列前 n 项和公式：Sₙ = n(a₁ + aₙ)/2 = n[2a₁ + (n-1)d]/2
              等比数列前 n 项和公式：Sₙ = a₁(1-qⁿ)/(1-q) (q≠1)
              使用本工具可以自动计算这些结果。
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

<script setup>
import { ref, computed } from 'vue'
import { ChevronUp, HelpCircle, Calculator, FunctionSquare, Hash, Divide } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '数列计算器 - 等差等比数列求和与通项公式计算 | Util工具箱',
  description: '免费在线数列计算器，支持等差数列、等比数列的通项公式计算、求和计算以及数列生成。纯本地计算，数据安全隐私。数学学习必备工具。',
  keywords: '数列计算,等差数列,等比数列,数列求和,通项公式,数列生成,数学计算,在线计算器',
  author: 'Util工具箱',
  ogTitle: '数列计算器 - 免费在线等差等比数列计算工具',
  ogDescription: '专业的数列计算工具，支持等差数列、等比数列的通项公式和求和计算。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/sequence-calculator.png',
  ogUrl: 'https://www.util.cn/tools/sequence-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '数列计算器 - 免费在线等差等比数列计算',
  twitterDescription: '专业的数列计算工具，支持等差数列、等比数列的通项公式和求和计算。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/sequence-calculator.png'
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
            name: '数列计算器',
            description: '免费在线数列计算器，支持等差数列和等比数列计算',
            url: 'https://www.util.cn/tools/sequence-calculator',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '等差数列计算',
              '等比数列计算',
              '通项公式推导',
              '数列求和',
              '本地安全处理',
              '实时计算结果'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '数列计算器',
                item: 'https://www.util.cn/tools/sequence-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是等差数列？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '等差数列是指从第二项起，每一项与它的前一项的差等于同一个常数的一种数列。这个常数叫做等差数列的公差。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是等比数列？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '等比数列是指从第二项起，每一项与它的前一项的比等于同一个常数的一种数列。这个常数叫做等比数列的公比。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 数据状态
const ap = ref({ a1: 1, d: 2, n: 10 })
const gp = ref({ a1: 1, q: 2, n: 10 })
const arithmeticResult = ref(null)
const geometricResult = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calculator, FunctionSquare, Hash, Divide
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'proportion-calculator'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'scientific-calculator'),
    tools.find(t => t.id === 'unit-converter')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 计算等差数列
function calculateArithmetic() {
  const n = ap.value.n
  const a1 = ap.value.a1
  const d = ap.value.d
  const an = a1 + (n - 1) * d
  const sum = (a1 + an) * n / 2
  arithmeticResult.value = { sum: sum.toFixed(2), an: an.toFixed(2) }
}

// 计算等比数列
function calculateGeometric() {
  const n = gp.value.n
  const a1 = gp.value.a1
  const q = gp.value.q
  if (q === 1) {
    geometricResult.value = { sum: (a1 * n).toFixed(2) }
  } else {
    const sum = a1 * (1 - Math.pow(q, n)) / (1 - q)
    geometricResult.value = { sum: sum.toFixed(4) }
  }
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
