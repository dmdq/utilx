<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">销售税计算器 - 增值税计算、含税价/不含税价转换</h1>
      <p class="text-muted-foreground">一款免费的在线销售税计算工具。支持含税价与不含税价互转、增值税计算。适用于电商、零售、财务管理。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 不含税价 → 含税价 -->
      <div class="flex flex-col h-full bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">不含税价 → 含税价</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">不含税价格</label>
            <input v-model.number="netPrice" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="不含税价">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">税率 (%)</label>
            <input v-model.number="taxRate" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 13">
          </div>
          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">含税价</p>
            <p class="text-2xl font-bold text-primary">¥{{ grossPrice }}</p>
          </div>
          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">税额</p>
            <p class="text-2xl font-bold text-primary">¥{{ taxAmount }}</p>
          </div>
        </div>
      </div>

      <!-- 含税价 → 不含税价 -->
      <div class="flex flex-col h-full bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">含税价 → 不含税价</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">含税价格</label>
            <input v-model.number="grossPrice2" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="含税价">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">税率 (%)</label>
            <input v-model.number="taxRate2" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 13">
          </div>
          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">不含税价</p>
            <p class="text-2xl font-bold text-primary">¥{{ netPrice2 }}</p>
          </div>
          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">税额</p>
            <p class="text-2xl font-bold text-primary">¥{{ taxAmount2 }}</p>
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
          什么是销售税计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          销售税是在商品或服务交易过程中向消费者征收的税费。在中国，主要体现为增值税（VAT）。
          增值税是以商品（含应税劳务）在流转过程中产生的增值额作为计税依据而征收的一种流转税。
          销售税计算器可以帮助您快速计算含税价、不含税价和税额，适用于电商卖家、财务人员和普通消费者。
        </p>
        <p class="text-muted-foreground">
          中国增值税税率分为多档：一般纳税人适用13%（货物销售）、9%（交通运输、建筑等）、6%（现代服务业）等税率；
          小规模纳税人适用3%或1%的征收率。本工具支持自定义税率，可以灵活应对不同场景。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择计算方向：不含税价→含税价 或 含税价→不含税价</li>
          <li>输入已知价格和税率</li>
          <li>自动计算并显示结果</li>
          <li>结果包括目标价格和税额</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>双向计算</strong>: 支持含税价与不含税价互转</li>
          <li><strong>灵活税率</strong>: 支持自定义税率，适应不同行业</li>
          <li><strong>实时计算</strong>: 输入参数后立即显示计算结果</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>精确计算</strong>: 保留两位小数，确保财务计算精度</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">含税价和不含税价有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              含税价是包含税费的最终价格，是消费者实际支付的金额；不含税价是不包含税费的价格，
              是商品或服务本身的价值。两者之间的差额就是税额。公式：含税价 = 不含税价 × (1 + 税率)
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">中国常见的增值税税率有哪些？</h3>
            <p class="text-muted-foreground mt-1">
              中国增值税税率分为多档：一般纳税人的基本税率为13%（适用于大部分货物销售），
              9%适用于交通运输、邮政、基础电信、建筑、不动产租赁/销售、转让土地使用权、销售或进口农产品等，
              6%适用于现代服务业、生活服务业、增值电信服务等；小规模纳税人征收率为3%或1%。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算税额？</h3>
            <p class="text-muted-foreground mt-1">
              从不含税价计算税额：税额 = 不含税价 × 税率
              从含税价计算税额：税额 = 含税价 - (含税价 ÷ (1 + 税率))
              本工具会自动计算并显示税额。
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
import { ChevronUp, HelpCircle, DollarSign, Percent, Calculator, Receipt } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '销售税计算器 - 增值税计算与价税分离工具 | Util工具箱',
  description: '免费在线销售税计算器，支持含税价与不含税价互转、增值税计算。适用于电商、零售、财务管理。纯本地计算，数据安全隐私。',
  keywords: '销售税计算,增值税计算,含税价,不含税价,税率换算,价税分离,在线计算器',
  author: 'Util工具箱',
  ogTitle: '销售税计算器 - 免费在线增值税计算工具',
  ogDescription: '专业的销售税计算工具，支持含税价与不含税价互转、增值税计算。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/sales-tax-calculator.png',
  ogUrl: 'https://www.util.cn/tools/sales-tax-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '销售税计算器 - 免费在线增值税计算',
  twitterDescription: '专业的销售税计算工具，支持含税价与不含税价互转、增值税计算。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/sales-tax-calculator.png'
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
            name: '销售税计算器',
            description: '免费在线销售税计算器，支持含税价与不含税价互转',
            url: 'https://www.util.cn/tools/sales-tax-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '含税价计算',
              '不含税价计算',
              '税额计算',
              '增值税换算',
              '灵活税率设置',
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
                name: '销售税计算器',
                item: 'https://www.util.cn/tools/sales-tax-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '含税价和不含税价有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '含税价是包含税费的最终价格，是消费者实际支付的金额；不含税价是不包含税费的价格，是商品或服务本身的价值。两者之间的差额就是税额。'
                }
              },
              {
                '@type': 'Question',
                name: '中国常见的增值税税率有哪些？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '中国增值税税率分为多档：一般纳税人的基本税率为13%（适用于大部分货物销售），9%适用于交通运输、建筑等，6%适用于现代服务业。'
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
const netPrice = ref(100)
const taxRate = ref(13)
const grossPrice2 = ref(113)
const taxRate2 = ref(13)

// 计算属性
const grossPrice = computed(() => (netPrice.value * (1 + taxRate.value / 100)).toFixed(2))
const taxAmount = computed(() => (netPrice.value * taxRate.value / 100).toFixed(2))
const netPrice2 = computed(() => (grossPrice2.value / (1 + taxRate2.value / 100)).toFixed(2))
const taxAmount2 = computed(() => (parseFloat(netPrice2.value) * taxRate2.value / 100).toFixed(2))

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  DollarSign, Percent, Calculator, Receipt
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'unit-price-calculator'),
    tools.find(t => t.id === 'proportion-calculator'),
    tools.find(t => t.id === 'discount-calculator'),
    tools.find(t => t.id === 'percentage-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
