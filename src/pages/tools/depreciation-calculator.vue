<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">折旧计算器 - 资产折旧计算工具</h1>
      <p class="text-muted-foreground">在线折旧计算器，支持直线法、双倍余额递减法、年数总和法三种折旧方法。生成固定资产折旧表，适用于会计、财务管理等领域。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">资产信息</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">原值</label>
            <input v-model.number="cost" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">残值</label>
            <input v-model.number="salvage" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">使用年限 (年)</label>
            <input v-model.number="life" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">折旧方法</label>
            <select v-model="method" class="w-full px-4 py-2 border border-border rounded bg-muted">
              <option value="straight">直线法</option>
              <option value="ddb">双倍余额递减法</option>
              <option value="syd">年数总和法</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">折旧表</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-2 text-foreground">年份</th>
                <th class="text-right py-2 text-foreground">折旧额</th>
                <th class="text-right py-2 text-foreground">累计折旧</th>
                <th class="text-right py-2 text-foreground">账面价值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in schedule" :key="row.year" class="border-b border-border">
                <td class="py-2 text-foreground">{{ row.year }}</td>
                <td class="text-right text-foreground">{{ row.depreciation.toFixed(2) }}</td>
                <td class="text-right text-foreground">{{ row.accumulated.toFixed(2) }}</td>
                <td class="text-right text-foreground">{{ row.bookValue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
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
          什么是折旧？
        </h2>
        <p class="text-muted-foreground mb-4">
          折旧是指固定资产在使用过程中逐渐损耗而转移到产品成本或费用中去的那部分价值。
          折旧计算是企业财务管理的重要组成部分，正确计算折旧对于准确反映企业财务状况、计算应纳税所得额具有重要意义。
          通过折旧计算器，您可以快速生成折旧表，简化会计工作流程。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入资产的原值（购买价格）</li>
          <li>输入资产的预计残值（报废时的价值）</li>
          <li>输入资产的使用年限</li>
          <li>选择折旧计算方法</li>
          <li>查看生成的折旧表，包括每年的折旧额、累计折旧和账面价值</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          折旧方法说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>直线法</strong>: 最简单的方法，每年折旧额相同。年折旧额 = (原值 - 残值) ÷ 使用年限。适用于损耗均匀的资产。</li>
          <li><strong>双倍余额递减法</strong>: 加速折旧法，前期折旧多后期折旧少。年折旧率 = 2 ÷ 使用年限，年折旧额 = 账面价值 × 年折旧率。适用于技术更新快的设备。</li>
          <li><strong>年数总和法</strong>: 加速折旧法，折旧额逐年递减。年折旧额 = (原值 - 残值) × (剩余使用年数 ÷ 年数总和)。适用于前期效益高的资产。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的折旧方法？</h3>
            <p class="text-muted-foreground mt-1">
              选择折旧方法应考虑资产的性质、使用情况、税法规定等因素。直线法适用于损耗均匀的资产；
              加速折旧法适用于技术更新快、前期效益高的资产。企业应遵循会计准则和税法要求选择折旧方法。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">折旧对企业有什么影响？</h3>
            <p class="text-muted-foreground mt-1">
              折旧是一项非现金支出，但会影响企业的财务报表和税务。折旧费用会减少企业利润，从而降低企业所得税负担。
              同时，折旧也会影响资产价值的计量和现金流分析。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是累计折旧和账面价值？</h3>
            <p class="text-muted-foreground mt-1">
              累计折旧是指资产从开始使用到当前为止的折旧总额。账面价值（也称净值）是指资产原值减去累计折旧后的余额，
              反映资产的当前账面价值。
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
import { HelpCircle, ChevronUp, Calculator, TrendingDown, DollarSign, PieChart } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '折旧计算器 - 资产折旧计算工具 | Util工具箱',
  description: '在线折旧计算器，支持直线法、双倍余额递减法、年数总和法三种折旧方法。生成固定资产折旧表，适用于会计、财务管理等领域。',
  keywords: '折旧计算,直线法,双倍余额递减法,年数总和法,固定资产折旧,折旧表',
  author: 'Util工具箱',
  ogTitle: '折旧计算器 - 资产折旧计算工具',
  ogDescription: '专业的折旧计算工具，支持三种折旧方法，生成完整的折旧表。适用于会计、财务管理、税务申报等场景。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '折旧计算器 - 资产折旧计算',
  twitterDescription: '专业的折旧计算工具，支持三种折旧方法，生成完整的折旧表。'
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
            name: '折旧计算器',
            description: '在线折旧计算工具，支持三种折旧方法',
            url: 'https://www.util.cn/tools/depreciation-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '直线法折旧',
              '双倍余额递减法',
              '年数总和法',
              '折旧表生成',
              '累计折旧计算',
              '账面价值计算'
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
                name: '折旧计算器',
                item: 'https://www.util.cn/tools/depreciation-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何选择合适的折旧方法？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '选择折旧方法应考虑资产的性质、使用情况、税法规定等因素。直线法适用于损耗均匀的资产；加速折旧法适用于技术更新快、前期效益高的资产。'
                }
              },
              {
                '@type': 'Question',
                name: '折旧对企业有什么影响？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '折旧是一项非现金支出，但会影响企业的财务报表和税务。折旧费用会减少企业利润，从而降低企业所得税负担。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const cost = ref(100000)
const salvage = ref(5000)
const life = ref(5)
const method = ref('straight')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calculator, TrendingDown, DollarSign, PieChart
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'loan-calculator'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'vat-calculator'),
    tools.find(t => t.id === 'roi-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const schedule = computed(() => {
  const result = []
  let bookValue = cost.value
  let accumulated = 0

  if (method.value === 'straight') {
    const annualDep = (cost.value - salvage.value) / life.value
    for (let i = 1; i <= life.value; i++) {
      accumulated += annualDep
      bookValue -= annualDep
      result.push({
        year: i,
        depreciation: annualDep,
        accumulated,
        bookValue: Math.max(salvage.value, bookValue)
      })
    }
  } else if (method.value === 'ddb') {
    const rate = 2 / life.value
    for (let i = 1; i <= life.value; i++) {
      let dep = bookValue * rate
      const remaining = cost.value - accumulated - salvage.value
      dep = Math.min(dep, remaining)
      accumulated += dep
      bookValue -= dep
      result.push({
        year: i,
        depreciation: dep,
        accumulated,
        bookValue: Math.max(salvage.value, bookValue)
      })
    }
  } else {
    let sumYears = (life.value * (life.value + 1)) / 2
    for (let i = 1; i <= life.value; i++) {
      const dep = (cost.value - salvage.value) * (life.value - i + 1) / sumYears
      accumulated += dep
      bookValue -= dep
      result.push({
        year: i,
        depreciation: dep,
        accumulated,
        bookValue: Math.max(salvage.value, bookValue)
      })
    }
  }

  return result
})

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
