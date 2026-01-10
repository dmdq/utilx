<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">大数计算器 - 超大整数精确计算</h1>
      <p class="text-muted-foreground">在线大数计算器，支持超大整数的加减乘除精确计算、阶乘计算、幂运算。适用于数学计算、密码学等领域，突破JavaScript数字精度限制。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">大数运算</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">数字 A</label>
            <input v-model="numA" type="text" class="w-full px-4 py-2 border border-border rounded bg-muted" placeholder="输入大整数">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">数字 B</label>
            <input v-model="numB" type="text" class="w-full px-4 py-2 border border-border rounded bg-muted" placeholder="输入大整数">
          </div>
          <div class="flex gap-2">
            <button @click="calculateBigNumber('+')" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">加</button>
            <button @click="calculateBigNumber('-')" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">减</button>
            <button @click="calculateBigNumber('*')" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">乘</button>
            <button @click="calculateBigNumber('/')" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">除</button>
          </div>
          <div v-if="result" class="p-4 bg-green-500/10 rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">结果</p>
            <p class="text-lg font-semibold text-green-600 break-all">{{ result }}</p>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">阶乘与幂</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">阶乘 n!</label>
            <input v-model.number="factorialN" type="number" min="0" max="500" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <button @click="calculateFactorial" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">计算阶乘</button>
          <div v-if="factorialResult" class="p-4 bg-purple-500/10 rounded-lg">
            <p class="text-sm font-medium text-foreground break-all">{{ factorialN }}! = {{ factorialResult }}</p>
          </div>
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
          什么是大数计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          在JavaScript中，Number类型的安全整数范围是-(2^53-1)到2^53-1，超过这个范围的数字会失去精度。
          BigInt是JavaScript的一种新的数据类型，可以表示任意大的整数，不会丢失精度。
          大数计算器使用BigInt技术，支持超大整数的精确运算，适用于密码学、数学研究、金融计算等需要高精度计算的场景。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入两个大整数（支持任意长度）</li>
          <li>点击运算按钮（加、减、乘、除）查看结果</li>
          <li>在右侧输入阶乘计算的非负整数（0-500）</li>
          <li>点击"计算阶乘"按钮查看完整结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          大数运算特点
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>任意精度</strong>: 支持任意大小的整数运算，不受数字位数限制</li>
          <li><strong>精确计算</strong>: 不会因为数字过大而丢失精度</li>
          <li><strong>四则运算</strong>: 支持加、减、乘、除基本运算</li>
          <li><strong>阶乘计算</strong>: 快速计算大数的阶乘，支持0-500的阶乘</li>
          <li><strong>即时结果</strong>: 运算结果即时显示，无需等待</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>密码学</strong>: RSA加密算法需要大数运算</li>
          <li><strong>数学研究</strong>: 大数阶乘、组合数学、数论研究</li>
          <li><strong>金融计算</strong>: 高精度货币计算，避免舍入误差</li>
          <li><strong>科学计算</strong>: 天文数字、物理常数的高精度计算</li>
          <li><strong>区块链</strong>: 加密货币交易金额计算</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">JavaScript的Number类型有什么限制？</h3>
            <p class="text-muted-foreground mt-1">
              JavaScript的Number类型基于IEEE 754双精度浮点数，安全整数范围是-(2^53-1)到2^53-1（即-9007199254740991到9007199254740991）。
              超过这个范围的整数计算可能不准确。BigInt类型解决了这个问题，可以表示任意大的整数。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么阶乘限制在500以内？</h3>
            <p class="text-muted-foreground mt-1">
              虽然BigInt理论上支持任意大的数字，但阶乘增长非常快，500!已经是一个超过1000位的数字。
              计算更大的阶乘会消耗大量计算资源，可能导致浏览器卡顿。对于大多数实际应用场景，500!已经足够大。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">大数运算的性能如何？</h3>
            <p class="text-muted-foreground mt-1">
              BigInt运算的性能通常比Number类型慢，但对于大多数应用场景来说性能是可接受的。
              现代JavaScript引擎对BigInt有很好的优化，日常使用中通常不会感觉到明显的性能差异。
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
import { ref } from 'vue'
import { HelpCircle, ChevronUp, Calculator, Hash, Infinity, Divide } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '大数计算器 - 超大整数精确计算 | Util工具箱',
  description: '在线大数计算器，支持超大整数的加减乘除精确计算、阶乘计算、幂运算。适用于数学计算、密码学等领域，突破JavaScript数字精度限制。',
  keywords: '大数计算,大整数,阶乘计算,精确计算,BigInt,超大数',
  author: 'Util工具箱',
  ogTitle: '大数计算器 - 超大整数精确计算',
  ogDescription: '专业的大数计算工具，支持超大整数的四则运算、阶乘计算。基于BigInt技术，突破JavaScript数字精度限制。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '大数计算器 - 超大整数精确计算',
  twitterDescription: '专业的大数计算工具，支持超大整数的四则运算、阶乘计算。'
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
            name: '大数计算器',
            description: '在线大数计算工具，支持超大整数精确计算',
            url: 'https://www.util.cn/tools/big-number-calculator',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '大数加减乘除',
              '阶乘计算',
              '任意精度',
              'BigInt支持',
              '即时计算',
              '密码学应用'
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
                name: '大数计算器',
                item: 'https://www.util.cn/tools/big-number-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'JavaScript的Number类型有什么限制？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'JavaScript的Number类型基于IEEE 754双精度浮点数，安全整数范围是-(2^53-1)到2^53-1。超过这个范围的整数计算可能不准确。BigInt类型解决了这个问题。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么阶乘限制在500以内？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '虽然BigInt理论上支持任意大的数字，但阶乘增长非常快，500!已经是一个超过1000位的数字。计算更大的阶乘会消耗大量计算资源。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const numA = ref('')
const numB = ref('')
const result = ref('')
const factorialN = ref(10)
const factorialResult = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calculator, Hash, Infinity, Divide
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'scientific-calculator'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'vector-calculator'),
    tools.find(t => t.id === 'matrix-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

function calculateBigNumber(op) {
  try {
    const a = BigInt(numA.value || '0')
    const b = BigInt(numB.value || '0')
    let res

    switch (op) {
      case '+': res = a + b; break
      case '-': res = a - b; break
      case '*': res = a * b; break
      case '/': res = b !== 0n ? a / b : 0n; break
    }
    result.value = res.toString()
  } catch (e) {
    result.value = '错误: ' + e.message
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
    factorialResult.value = '错误: ' + e.message
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
