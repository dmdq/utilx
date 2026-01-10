<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">比例计算器 - 正比例/反比例计算、比例缩放、配方调整</h1>
      <p class="text-muted-foreground">一款免费的在线比例计算工具。支持正比例、反比例计算、比例缩放、配方调整。解决a:b=c:d比例问题。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="space-y-6 mb-8">
      <!-- 比例计算 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">比例计算 a:b = c:d</h2>
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">a</label>
            <input v-model.number="a" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="a">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">b</label>
            <input v-model.number="b" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="b">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">c</label>
            <input v-model.number="c" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="c">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">d</label>
            <input v-model.number="d" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="d">
          </div>
        </div>
        <button @click="calculateProportion" class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">计算未知数</button>
        <div v-if="proportionResult !== null" class="mt-4 p-4 bg-muted rounded">
          <p class="text-lg font-semibold text-primary">未知数 = {{ proportionResult }}</p>
          <p class="text-sm text-muted-foreground mt-2">比例值 = {{ ratioValue }}</p>
        </div>
      </div>

      <!-- 缩放计算 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">缩放计算</h2>
        <div class="flex gap-4 mb-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-foreground mb-1">原值</label>
            <input v-model.number="originalValue" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="原值">
          </div>
          <div class="w-32">
            <label class="block text-sm font-medium text-foreground mb-1">缩放倍数</label>
            <input v-model.number="scale" type="number" step="0.01" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="倍数">
          </div>
          <div class="flex items-end">
            <button @click="scaledValue = originalValue * scale" class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">计算</button>
          </div>
        </div>
        <div v-if="scaledValue !== null" class="p-4 bg-muted rounded">
          <p class="text-lg font-semibold text-primary">结果 = {{ scaledValue }}</p>
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
          什么是比例计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          比例是数学中表示两个比相等的式子，即 a:b = c:d。比例计算在日常生活和工作中应用广泛，
          如地图比例尺、配方调整、尺寸缩放、价格换算等。比例计算器可以帮助您快速解决各种比例问题，
          无需手动计算，提高工作效率。
        </p>
        <p class="text-muted-foreground">
          正比例是指两个量的比值保持不变，当一个量增大时，另一个量也按相同的比例增大。
          反比例是指两个量的乘积保持不变，当一个量增大时，另一个量按相同的比例减小。
          本工具主要处理正比例计算。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在比例计算区域输入已知的三项数值（a、b、c或a、b、d）</li>
          <li>点击"计算未知数"按钮，系统将自动计算第四项</li>
          <li>在缩放计算区域输入原值和缩放倍数</li>
          <li>点击"计算"按钮获取缩放后的结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>比例计算</strong>: 快速计算 a:b=c:d 中的未知数</li>
          <li><strong>缩放计算</strong>: 按指定倍数缩放数值</li>
          <li><strong>配方调整</strong>: 按比例调整配方用量</li>
          <li><strong>实时计算</strong>: 输入参数后立即显示计算结果</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算比例中的未知数？</h3>
            <p class="text-muted-foreground mt-1">
              根据比例的基本性质，内项之积等于外项之积，即 a×d = b×c。
              如果要求解 d，则 d = (b×c)/a；如果要求解 c，则 c = (a×d)/b。
              本工具会自动识别并计算未知项。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">比例计算在实际中的应用有哪些？</h3>
            <p class="text-muted-foreground mt-1">
              比例计算在生活中应用广泛：烹饪时按比例调整配方用量、地图上根据比例尺计算实际距离、
              图像编辑时按比例缩放尺寸、购物时比较不同包装的单价、工程图纸的比例换算等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是缩放计算？</h3>
            <p class="text-muted-foreground mt-1">
              缩放计算是将一个数值乘以一个比例系数，得到放大或缩小后的结果。
              例如，原值为100，缩放倍数为1.5，则结果为150。
              这在图像处理、尺寸调整、数量换算等场景中非常有用。
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
import { ChevronUp, HelpCircle, Percent, Scale, Divide, Calculator } from 'lucide-vue-next'
import { useHead } from '#app'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '比例计算器 - 正反比例计算与比例缩放工具 | Util工具箱',
  description: '免费在线比例计算器，计算正比例、反比例、比例缩放、配方调整。解决a:b=c:d比例问题。纯本地计算，数据安全隐私。',
  keywords: '比例计算,正比例,反比例,比例缩放,配方计算,比例求解,在线计算器',
  author: 'Util工具箱',
  ogTitle: '比例计算器 - 免费在线比例计算工具',
  ogDescription: '专业的比例计算工具，支持正比例、反比例、比例缩放计算。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/proportion-calculator.png',
  ogUrl: 'https://www.util.cn/tools/proportion-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '比例计算器 - 免费在线比例计算',
  twitterDescription: '专业的比例计算工具，支持正比例、反比例、比例缩放计算。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/proportion-calculator.png'
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
            name: '比例计算器',
            description: '免费在线比例计算器，支持比例计算和缩放',
            url: 'https://www.util.cn/tools/proportion-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '比例计算',
              '缩放计算',
              '配方调整',
              '正比例计算',
              '反比例计算',
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
                name: '比例计算器',
                item: 'https://www.util.cn/tools/proportion-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何计算比例中的未知数？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '根据比例的基本性质，内项之积等于外项之积，即 a×d = b×c。如果要求解 d，则 d = (b×c)/a。'
                }
              },
              {
                '@type': 'Question',
                name: '比例计算在实际中的应用有哪些？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '比例计算在生活中应用广泛：烹饪时按比例调整配方用量、地图上根据比例尺计算实际距离、图像编辑时按比例缩放尺寸等。'
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
const a = ref(1)
const b = ref(2)
const c = ref(3)
const d = ref(null)
const proportionResult = ref(null)
const ratioValue = ref(0.5)
const originalValue = ref(100)
const scale = ref(1.5)
const scaledValue = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Percent, Scale, Divide, Calculator
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'sequence-calculator'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'sales-tax-calculator'),
    tools.find(t => t.id === 'unit-price-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 计算比例
function calculateProportion() {
  const values = [a.value, b.value, c.value, d.value].filter(v => v !== null && v !== 0)
  const known = values.length
  if (known >= 3) {
    if (d.value === null) {
      proportionResult.value = (c.value * b.value) / a.value
    } else if (c.value === null) {
      proportionResult.value = (a.value * d.value) / b.value
    } else if (b.value === null) {
      proportionResult.value = (a.value * d.value) / c.value
    } else if (a.value === null) {
      proportionResult.value = (b.value * c.value) / d.value
    }
    ratioValue.value = a.value / b.value
  }
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
