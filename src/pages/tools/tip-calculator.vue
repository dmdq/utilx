<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">小费计算器 - 餐厅分账计算工具</h1>
      <p class="text-muted-foreground">免费在线小费计算器，快速计算餐厅小费和分账金额。支持自定义小费比例、税率计算、多人分账功能，适用于餐厅结账、聚会AA制等场景。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">账单信息</label>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">账单金额</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <input
                v-model.number="billAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入账单金额"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">小费比例 (%)</label>
            <div class="flex gap-2">
              <input
                v-model.number="tipPercent"
                type="number"
                step="1"
                min="0"
                max="100"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="小费比例"
              >
              <span class="flex items-center px-3 text-muted-foreground">%</span>
            </div>
          </div>

          <!-- 快捷小费比例 -->
          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">快捷选择</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presetTips"
                :key="preset"
                @click="tipPercent = preset"
                :class="[
                  'px-4 py-2 rounded-lg transition',
                  tipPercent === preset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ preset }}%
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">税率 (%) (可选)</label>
            <div class="flex gap-2">
              <input
                v-model.number="taxRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="税率"
              >
              <span class="flex items-center px-3 text-muted-foreground">%</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">如果账单已含税请留空</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">分账人数</label>
            <div class="flex items-center gap-3">
              <button
                @click="peopleCount = Math.max(1, peopleCount - 1)"
                class="w-10 h-10 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 transition text-foreground"
              >
                -
              </button>
              <input
                v-model.number="peopleCount"
                type="number"
                min="1"
                max="100"
                class="flex-1 text-center px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <button
                @click="peopleCount++"
                class="w-10 h-10 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 transition text-foreground"
              >
                +
              </button>
            </div>
          </div>

          <!-- 是否税费包含在小费计算中 -->
          <div class="flex items-center gap-2">
            <input
              v-model="tipOnTax"
              type="checkbox"
              id="tipOnTax"
              class="w-4 h-4 rounded border-border"
            >
            <label for="tipOnTax" class="text-sm text-foreground">小费基于税前金额计算</label>
          </div>

          <!-- 自定义小费金额 -->
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">或直接输入小费金额</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <input
                v-model.number="customTipAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="直接输入小费金额"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 计算结果 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
        </div>

        <div v-if="billAmount > 0" class="space-y-4">
          <!-- 汇总卡片 -->
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">总计</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              ¥{{ totalAmount.toFixed(2) }}
            </p>
          </div>

          <!-- 详细明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">账单金额</span>
              <span class="font-semibold text-foreground">¥{{ billAmount.toFixed(2) }}</span>
            </div>

            <div v-if="taxAmount > 0" class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">税费 ({{ taxRate }}%)</span>
              <span class="font-semibold text-foreground">¥{{ taxAmount.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">小费 ({{ effectiveTipPercent }}%)</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">¥{{ tipAmount.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="font-medium text-foreground">总计</span>
              <span class="font-bold text-green-600 dark:text-green-400">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 分账信息 -->
          <div v-if="peopleCount > 1" class="p-4 bg-muted rounded-lg border border-border">
            <div class="flex items-center gap-2 mb-2">
              <Users class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span class="font-medium text-foreground">分账详情 ({{ peopleCount }}人)</span>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">每人应付</span>
                <span class="font-semibold text-foreground">¥{{ perPersonAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">每人小费</span>
                <span class="font-semibold text-foreground">¥{{ perPersonTip.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 小费建议 -->
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
              <Lightbulb class="w-4 h-4" />
              小费建议参考
            </h3>
            <div class="space-y-1 text-xs text-muted-foreground">
              <p>• 优质服务: 15-20%</p>
              <p>• 良好服务: 10-15%</p>
              <p>• 一般服务: 5-10%</p>
              <p>• 快餐/外卖: 通常不需要小费</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请输入账单金额开始计算
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
          什么是小费计算器？
        </h2>
        <p class="text-muted-foreground mb-4">
          小费计算器是一款实用的在线工具，帮助您快速计算餐厅小费和分账金额。
          在外出就餐、聚会AA制等场景下，这款工具能够帮助您准确计算每人应付金额，避免分账时的尴尬。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入账单总金额</li>
          <li>选择或输入小费比例（如15%、18%等）</li>
          <li>如有需要，输入税率和分账人数</li>
          <li>查看总计金额和每人应付金额</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          小费计算公式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>小费金额</strong>: 小费 = 账单金额 × 小费比例</li>
          <li><strong>税费</strong>: 税费 = 账单金额 × 税率</li>
          <li><strong>总金额</strong>: 总金额 = 账单金额 + 税费 + 小费</li>
          <li><strong>分账金额</strong>: 每人应付 = 总金额 ÷ 人数</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">小费应该给多少？</h3>
            <p class="text-muted-foreground mt-1">
              小费金额因地区和服务质量而异。在美国，餐厅小费通常为账单金额的15-20%。
              在欧洲，小费通常已包含在服务费中。在亚洲国家如日本，小费文化不普遍。
              建议根据当地习俗和服务质量决定小费金额。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算含税的小费？</h3>
            <p class="text-muted-foreground mt-1">
              通常有两种计算方式：基于税前金额计算小费（更公平）或基于含税金额计算。
              本工具支持两种模式，您可以勾选"小费基于税前金额计算"来选择计算方式。
              例如：账单100元，税率10%，小费15%。
              税前计算：小费 = 100 × 15% = 15元；含税计算：小费 = 110 × 15% = 16.5元。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">AA制如何分账？</h3>
            <p class="text-muted-foreground mt-1">
              AA制是指平均分摊账单。使用本工具时，只需输入分账人数，系统会自动计算每人应付金额。
              例如：账单300元，小费45元，总计345元，3人分账，每人应付115元。
              这种方式在朋友聚会、同事聚餐等场景中非常常见。
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
import { Users, Lightbulb, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '小费计算器 - 餐厅分账计算工具 | Util工具箱',
  description: '免费在线小费计算器，快速计算餐厅小费和分账金额。支持自定义小费比例、税率计算、多人分账功能，适用于餐厅结账、聚会AA制等场景。',
  keywords: '小费计算,分账计算,餐厅小费,AA制,小费比例,账单分摊',
  author: 'Util工具箱',
  ogTitle: '小费计算器 - 餐厅分账计算工具',
  ogDescription: '快速计算餐厅小费和分账金额。支持自定义小费比例、税率计算、多人分账功能。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '小费计算器 - 餐厅分账计算',
  twitterDescription: '快速计算餐厅小费和分账金额。支持自定义小费比例、税率计算、多人分账。'
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
            name: '小费计算器',
            description: '在线小费计算器，快速计算餐厅小费和分账金额',
            url: 'https://www.util.cn/tools/tip-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '小费计算',
              '税率计算',
              '多人分账',
              'AA制计算',
              '自定义小费',
              '小费建议'
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
                name: '小费计算器',
                item: 'https://www.util.cn/tools/tip-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '小费应该给多少？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '小费金额因地区和服务质量而异。在美国，餐厅小费通常为账单金额的15-20%。'
                }
              },
              {
                '@type': 'Question',
                name: '如何计算含税的小费？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '通常有两种计算方式：基于税前金额计算小费（更公平）或基于含税金额计算。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const billAmount = ref<number>(0)
const tipPercent = ref<number>(15)
const taxRate = ref<number>(0)
const peopleCount = ref<number>(1)
const tipOnTax = ref<boolean>(false)
const customTipAmount = ref<number>(0)

const presetTips = [0, 5, 10, 12, 15, 18, 20, 25]

const taxAmount = computed(() => {
  if (taxRate.value === 0) return 0
  return billAmount.value * (taxRate.value / 100)
})

const effectiveTipPercent = computed(() => {
  if (customTipAmount.value > 0) {
    return ((customTipAmount.value / billAmount.value) * 100).toFixed(1)
  }
  return tipPercent.value
})

const tipAmount = computed(() => {
  if (customTipAmount.value > 0) {
    return customTipAmount.value
  }

  const baseAmount = tipOnTax.value ? billAmount.value : billAmount.value + taxAmount.value
  return baseAmount * (tipPercent.value / 100)
})

const totalAmount = computed(() => {
  return billAmount.value + taxAmount.value + tipAmount.value
})

const perPersonAmount = computed(() => {
  return totalAmount.value / peopleCount.value
})

const perPersonTip = computed(() => {
  return tipAmount.value / peopleCount.value
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap: Record<string, any> = {
  Users,
  Lightbulb
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'calculator' && t.id !== 'tip-calculator'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'discount-calculator'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'split-bill')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
