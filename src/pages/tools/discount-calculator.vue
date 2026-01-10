<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">折扣计算器 - 在线打折价格计算工具</h1>
      <p class="text-muted-foreground">免费在线折扣计算器，快速计算打折后价格、节省金额和折扣率。支持折扣率和折数输入，适用于购物优惠、促销活动计算。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入数据</label>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">原价</label>
            <input
              v-model.number="originalPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入原价"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">折扣率 (%)</label>
            <input
              v-model.number="discountPercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入折扣率，如 20 表示 8 折"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">折数（可选）</label>
            <input
              v-model.number="discountDecimal"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 8 表示 8 折，会自动转换折扣率"
              @input="convertDecimalToPercent"
            >
            <p class="text-xs text-muted-foreground mt-1">输入折数会自动转换折扣率</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">额外减免金额（可选）</label>
            <input
              v-model.number="extraDiscount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="额外的减免金额"
            >
          </div>
        </div>

        <!-- 快捷折扣按钮 -->
        <div class="mt-4">
          <label class="block text-sm font-medium mb-2 text-foreground">快捷折扣</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in presetDiscounts"
              :key="preset"
              @click="setDiscount(preset)"
              class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground transition"
            >
              {{ preset }}%
            </button>
          </div>
        </div>

        <!-- 快捷折数按钮 -->
        <div class="mt-4">
          <label class="block text-sm font-medium mb-2 text-foreground">快捷折数</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="discount in presetDecimals"
              :key="discount.label"
              @click="setDecimal(discount.value)"
              class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground transition"
            >
              {{ discount.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 计算结果 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
        </div>

        <div v-if="isValid" class="space-y-4">
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">折后价格</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              ¥{{ finalPrice.toFixed(2) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">折扣金额</p>
              <p class="text-xl font-semibold text-red-500">-¥{{ discountAmount.toFixed(2) }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">实际折扣率</p>
              <p class="text-xl font-semibold text-blue-500">{{ actualDiscountPercent.toFixed(1) }}%</p>
            </div>
          </div>

          <div class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">节省</p>
            <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {{ ((originalPrice - finalPrice) / originalPrice * 100).toFixed(1) }}% 的价格
            </p>
          </div>

          <!-- 计算详情 -->
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-medium mb-2 text-foreground">计算详情</h3>
            <div class="text-sm space-y-1 text-muted-foreground">
              <p>原价: ¥{{ originalPrice.toFixed(2) }}</p>
              <p>折扣: {{ discountPercent }}% = -¥{{ (originalPrice * discountPercent / 100).toFixed(2) }}</p>
              <p v-if="extraDiscount > 0">额外减免: -¥{{ extraDiscount.toFixed(2) }}</p>
              <p class="font-medium">最终价格: ¥{{ finalPrice.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请输入有效的原价和折扣率
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
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
          什么是折扣计算器？
        </h2>
        <p class="text-muted-foreground mb-4">
          折扣计算器是一款实用的在线工具，帮助您快速计算商品打折后的价格。
          无论您是购物时想快速计算折扣价，还是商家制定促销策略，这款工具都能为您提供准确的折扣计算结果。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入商品的原价</li>
          <li>输入折扣率（如20表示打8折）或直接输入折数（如8表示8折）</li>
          <li>可选择性添加额外减免金额</li>
          <li>查看折后价格、折扣金额和节省比例</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          折扣计算公式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>折扣率计算</strong>: 折扣率 = (1 - 折数) × 100%</li>
          <li><strong>折后价格</strong>: 折后价格 = 原价 × (1 - 折扣率/100)</li>
          <li><strong>折扣金额</strong>: 折扣金额 = 原价 × 折扣率/100 + 额外减免</li>
          <li><strong>实际折扣率</strong>: 实际折扣率 = (折扣金额 / 原价) × 100%</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">8折是多少折扣率？</h3>
            <p class="text-muted-foreground mt-1">
              8折表示按原价的80%出售，折扣率为20%。计算公式：(1 - 0.8) × 100% = 20%。
              例如原价100元的商品，8折后价格为80元，节省20元。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算多重折扣？</h3>
            <p class="text-muted-foreground mt-1">
              多重折扣不能简单相加，需要逐步计算。例如先打8折再打9折，最终价格为原价的72%（0.8 × 0.9 = 0.72），
              相当于约7.2折，实际折扣率为28%。建议分多次计算或使用累计折扣计算功能。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">额外减免如何计算？</h3>
            <p class="text-muted-foreground mt-1">
              额外减免是在折扣的基础上再减去固定金额。例如原价100元打8折后80元，再额外减免10元，最终价格为70元。
              这种优惠方式在满减促销中很常见。
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
import { ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '折扣计算器 - 在线打折价格计算 | Util工具箱',
  description: '免费在线折扣计算器，快速计算打折后价格、节省金额和折扣率。支持折扣率和折数输入，适用于购物优惠、促销活动计算。',
  keywords: '折扣计算,打折计算,价格计算,优惠计算,折扣率,折数转换',
  author: 'Util工具箱',
  ogTitle: '折扣计算器 - 在线打折价格计算工具',
  ogDescription: '快速计算折扣后价格、节省金额和折扣率。支持折扣率和折数输入，适用于购物优惠、促销活动计算。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '折扣计算器 - 在线打折价格计算',
  twitterDescription: '快速计算折扣后价格、节省金额和折扣率。支持折扣率和折数输入。'
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
            name: '折扣计算器',
            description: '在线折扣计算器，快速计算打折后价格、节省金额和折扣率',
            url: 'https://www.util.cn/tools/discount-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '折扣率计算',
              '折数转换',
              '折后价格计算',
              '节省金额计算',
              '额外减免计算',
              '快捷折扣选择'
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
                name: '折扣计算器',
                item: 'https://www.util.cn/tools/discount-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '8折是多少折扣率？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '8折表示按原价的80%出售，折扣率为20%。计算公式：(1 - 0.8) × 100% = 20%。'
                }
              },
              {
                '@type': 'Question',
                name: '如何计算多重折扣？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '多重折扣不能简单相加，需要逐步计算。例如先打8折再打9折，最终价格为原价的72%。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const originalPrice = ref<number>(100)
const discountPercent = ref<number>(20)
const extraDiscount = ref<number>(0)
const discountDecimal = ref<number>(0)

const presetDiscounts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80]
const presetDecimals = [
  { label: '9折', value: 9 },
  { label: '8折', value: 8 },
  { label: '7折', value: 7 },
  { label: '6折', value: 6 },
  { label: '5折', value: 5 },
  { label: '4折', value: 4 },
  { label: '3折', value: 3 },
  { label: '2折', value: 2 },
  { label: '1折', value: 1 }
]

const isValid = computed(() => {
  return originalPrice.value > 0 && discountPercent.value >= 0 && discountPercent.value <= 100
})

const discountAmount = computed(() => {
  return originalPrice.value * (discountPercent.value / 100) + extraDiscount.value
})

const finalPrice = computed(() => {
  const price = Math.max(0, originalPrice.value - discountAmount.value)
  return price
})

const actualDiscountPercent = computed(() => {
  if (originalPrice.value === 0) return 0
  return ((originalPrice.value - finalPrice.value) / originalPrice.value) * 100
})

function setDiscount(percent: number) {
  discountPercent.value = percent
  discountDecimal.value = 0
}

function setDecimal(decimal: number) {
  discountDecimal.value = decimal
  discountPercent.value = (1 - decimal / 10) * 100
}

function convertDecimalToPercent() {
  if (discountDecimal.value > 0) {
    const decimal = Math.min(10, Math.max(0.1, discountDecimal.value))
    discountPercent.value = (1 - decimal / 10) * 100
  }
}

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap: Record<string, any> = {}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'calculator' && t.id !== 'discount-calculator'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'tip-calculator'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'loan-calculator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
