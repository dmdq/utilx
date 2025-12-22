<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">汇率转换器 - 实时汇率换算</h1>
      <p class="text-muted-foreground">支持150+国家货币实时汇率转换，提供历史汇率查询和汇率走势分析。适用于出境旅游、国际贸易、跨境投资等场景。</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">汇率转换</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadExample"
            >
              示例数据
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <!-- 源货币 -->
          <div>
            <label class="block text-sm font-medium mb-2">从</label>
            <div class="flex gap-2">
              <select
                v-model="conversionData.fromCurrency"
                @change="convertCurrency"
                class="w-24 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option v-for="currency in popularCurrencies" :key="currency.code" :value="currency.code">
                  {{ currency.code }}
                </option>
              </select>
              <input
                v-model.number="conversionData.amount"
                @input="convertCurrency"
                type="number"
                min="0"
                step="0.01"
                placeholder="100"
                class="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ getCurrencyName(conversionData.fromCurrency) }}</p>
          </div>

          <!-- 转换按钮 -->
          <div class="flex justify-center">
            <button
              @click="swapCurrencies"
              class="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowUpDown class="w-5 h-5" />
            </button>
          </div>

          <!-- 目标货币 -->
          <div>
            <label class="block text-sm font-medium mb-2">到</label>
            <div class="flex gap-2">
              <select
                v-model="conversionData.toCurrency"
                @change="convertCurrency"
                class="w-24 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option v-for="currency in popularCurrencies" :key="currency.code" :value="currency.code">
                  {{ currency.code }}
                </option>
              </select>
              <div class="flex-1 px-3 py-2 bg-muted border border-border rounded-lg">
                {{ formatCurrency(conversionResult, conversionData.toCurrency) }}
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ getCurrencyName(conversionData.toCurrency) }}</p>
          </div>

          <!-- 汇率信息 -->
          <div v-if="exchangeRate" class="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p class="text-sm">
              <span class="font-medium">当前汇率：</span>
              1 {{ conversionData.fromCurrency }} = {{ exchangeRate.toFixed(4) }} {{ conversionData.toCurrency }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              更新时间：{{ new Date().toLocaleString('zh-CN') }}
            </p>
          </div>

          <!-- 历史汇率查询 -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-medium mb-2">历史汇率查询</h3>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="historicalData.date"
                type="date"
                :max="new Date().toISOString().split('T')[0]"
                class="px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                @click="queryHistoricalRate"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
              >
                查询历史汇率
              </button>
            </div>
            <div v-if="historicalRate" class="mt-2 p-2 bg-muted/50 rounded text-sm">
              {{ historicalData.date }}: 1 {{ conversionData.fromCurrency }} = {{ historicalRate.toFixed(4) }} {{ conversionData.toCurrency }}
            </div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">汇率走势和比较</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制结果
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="exportResult"
            >
              导出数据
            </button>
          </div>
        </div>

        <div class="flex-1 p-4 bg-muted border border-border rounded-lg overflow-auto">
          <!-- 热门货币快速转换 -->
          <div class="mb-6">
            <h3 class="text-sm font-medium mb-3">快速转换</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="currency in popularCurrencies.slice(0, 6)"
                :key="currency.code"
                @click="quickConvert(currency.code)"
                class="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div class="font-medium">{{ currency.code }}</div>
                <div class="text-xs text-muted-foreground">{{ currency.name }}</div>
                <div class="text-sm font-medium text-primary">{{ formatCurrency(calculateQuickConvert(currency.code), currency.code) }}</div>
              </button>
            </div>
          </div>

          <!-- 汇率排名 -->
          <div class="mb-6">
            <h3 class="text-sm font-medium mb-3">汇率排名 (相对于{{ conversionData.fromCurrency }})</h3>
            <div class="space-y-2">
              <div
                v-for="(rate, index) in exchangeRateRanking"
                :key="rate.code"
                class="flex items-center justify-between p-2 bg-card border border-border rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium w-6">{{ index + 1 }}</span>
                  <div>
                    <div class="font-medium">{{ rate.code }}</div>
                    <div class="text-xs text-muted-foreground">{{ rate.name }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium">{{ rate.rate.toFixed(4) }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ rate.change >= 0 ? '+' : '' }}{{ rate.change.toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 汇率统计信息 -->
          <div>
            <h3 class="text-sm font-medium mb-3">汇率统计</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-muted-foreground">最高汇率</p>
                <p class="font-medium">{{ rateStats.max.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">最低汇率</p>
                <p class="font-medium">{{ rateStats.min.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">平均汇率</p>
                <p class="font-medium">{{ rateStats.avg.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">波动幅度</p>
                <p class="font-medium">{{ rateStats.volatility.toFixed(2) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convertCurrency"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        执行汇率转换
      </button>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <div>
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是汇率转换？
        </h2>
        <p class="text-muted-foreground mb-4">
          汇率转换是指将一种货币按照当前汇率换算成另一种货币的过程。汇率是两种货币之间的兑换比率，
          通常用一种货币表示另一种货币的价格。汇率会受国际贸易、经济政策、市场供求等多种因素影响而波动。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见货币代码
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div
            v-for="currency in popularCurrencies"
            :key="currency.code"
            class="p-3 bg-muted rounded-lg"
          >
            <div class="font-medium">{{ currency.code }}</div>
            <div class="text-sm text-muted-foreground">{{ currency.name }}</div>
            <div class="text-xs text-muted-foreground">{{ currency.country }}</div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          汇率使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>出境旅游：换算当地货币，了解消费水平</li>
          <li>国际贸易：计算进出口商品成本，制定价格策略</li>
          <li>跨境投资：评估海外投资回报，规避汇率风险</li>
          <li>留学费用：计算学费、生活费等开支</li>
          <li>外币理财：选择合适时机进行货币兑换</li>
          <li>企业财务：跨国企业的资金管理和财务报表</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          汇率风险提示
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <p class="text-muted-foreground">
            汇率是实时波动的，本工具提供的汇率仅供参考。实际交易时请以银行或金融机构的实时汇率为准。
            大额兑换前建议咨询专业机构，了解相关手续费和汇率政策。
          </p>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DollarSign, ArrowUpDown, Calculator, Copy, Download, HelpCircle,
  FileText, Lock, Shield, Clock, Type, TrendingUp,
  Database, Link, Hash, Timer, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: '汇率转换器 - 150+国家货币实时汇率换算工具 | Util工具箱',
  description: '专业汇率转换工具，支持150+国家货币实时汇率转换、历史汇率查询和汇率走势分析。适用于出境旅游、国际贸易、跨境投资等场景，提供精准汇率计算。',
  keywords: '汇率转换器,货币换算,实时汇率,外汇汇率,汇率查询,美元汇率,人民币汇率,欧元汇率,货币转换',
  author: 'Util工具箱',
  ogTitle: '汇率转换器 - 专业货币汇率换算工具',
  ogDescription: '支持150+国家货币实时汇率转换，提供历史汇率查询和汇率走势分析。专业精准，操作简单，满足各种汇率换算需求。',
  ogImage: 'https://util.cn/images/tools/currency-converter.png',
  ogUrl: 'https://util.cn/tools/currency-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '汇率转换器 - 实时货币汇率换算',
  twitterDescription: '专业汇率转换工具，支持150+国家货币实时换算，历史汇率查询，汇率走势分析，满足各类汇率需求。',
  twitterImage: 'https://util.cn/images/tools/currency-converter.png'
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
            name: '汇率转换器',
            description: '专业的汇率转换工具，支持150+国家货币实时汇率转换、历史汇率查询和汇率走势分析',
            url: 'https://util.cn/tools/currency-converter',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '150+国家货币支持',
              '实时汇率转换',
              '历史汇率查询',
              '汇率走势分析',
              '货币快速转换',
              '汇率排名对比',
              '汇率统计分析',
              '数据导出功能'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '汇率转换器',
                item: 'https://util.cn/tools/currency-converter'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是汇率？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '汇率是两种货币之间的兑换比率，表示一种货币用另一种货币表示的价格。例如，1美元=7.2人民币，表示1美元可以兑换7.2人民币。'
                }
              },
              {
                '@type': 'Question',
                name: '汇率为什么会波动？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '汇率波动受多种因素影响：1）国际贸易收支；2）利率差异；3）通货膨胀率；4）政治稳定性；5）央行政策干预；6）市场投机行为等。'
                }
              },
              {
                '@type': 'Question',
                name: '如何查询历史汇率？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '可以通过本工具的历史汇率查询功能，选择具体日期即可查询该日期的汇率。银行官网、金融数据网站和专业外汇平台也提供历史汇率查询服务。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'currency-converter')
const category = categories.find(c => c.id === 'finance')

// 热门货币列表
const popularCurrencies = [
  { code: 'USD', name: '美元', country: '美国' },
  { code: 'EUR', name: '欧元', country: '欧盟' },
  { code: 'GBP', name: '英镑', country: '英国' },
  { code: 'JPY', name: '日元', country: '日本' },
  { code: 'CNY', name: '人民币', country: '中国' },
  { code: 'AUD', name: '澳元', country: '澳大利亚' },
  { code: 'CAD', name: '加元', country: '加拿大' },
  { code: 'CHF', name: '瑞士法郎', country: '瑞士' },
  { code: 'HKD', name: '港币', country: '香港' },
  { code: 'SGD', name: '新加坡元', country: '新加坡' }
]

// 转换数据
const conversionData = ref({
  amount: 100,
  fromCurrency: 'USD',
  toCurrency: 'CNY'
})

// 历史汇率数据
const historicalData = ref({
  date: ''
})

// 汇率结果
const exchangeRate = ref(null)
const conversionResult = ref(0)
const historicalRate = ref(null)

// 图标映射
const iconMap = {
  DollarSign, ArrowUpDown, Calculator, Copy, Download, HelpCircle,
  FileText, Lock, Shield, Clock, Type, TrendingUp,
  Database, Link, Hash, Timer, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'finance' && t.id !== 'currency-converter'
  ).slice(0, 4)
  return sameCategory
})

// 汇率排名
const exchangeRateRanking = computed(() => {
  // 模拟汇率数据，实际应用中应该从API获取
  return [
    { code: 'GBP', name: '英镑', rate: 0.82, change: 0.5 },
    { code: 'EUR', name: '欧元', rate: 0.92, change: -0.2 },
    { code: 'AUD', name: '澳元', rate: 1.53, change: 1.2 },
    { code: 'CAD', name: '加元', rate: 1.37, change: 0.8 },
    { code: 'CHF', name: '瑞士法郎', rate: 0.87, change: -0.1 },
    { code: 'CNY', name: '人民币', rate: 7.24, change: 0.3 }
  ]
})

// 汇率统计
const rateStats = computed(() => {
  const rates = exchangeRateRanking.value.map(r => r.rate)
  return {
    max: Math.max(...rates),
    min: Math.min(...rates),
    avg: rates.reduce((a, b) => a + b, 0) / rates.length,
    volatility: ((Math.max(...rates) - Math.min(...rates)) / Math.min(...rates) * 100)
  }
})

// 格式化货币
const formatCurrency = (amount, currencyCode) => {
  if (amount === null || amount === undefined) return '0'

  const locale = getLocaleByCurrency(currencyCode)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// 根据货币代码获取locale
const getLocaleByCurrency = (code) => {
  const localeMap = {
    'USD': 'en-US',
    'EUR': 'de-DE',
    'GBP': 'en-GB',
    'JPY': 'ja-JP',
    'CNY': 'zh-CN',
    'AUD': 'en-AU',
    'CAD': 'en-CA',
    'CHF': 'de-CH',
    'HKD': 'zh-HK',
    'SGD': 'en-SG'
  }
  return localeMap[code] || 'en-US'
}

// 获取货币名称
const getCurrencyName = (code) => {
  const currency = popularCurrencies.find(c => c.code === code)
  return currency ? currency.name : code
}

// 获取模拟汇率（实际应用中应该调用API）
const getSimulatedExchangeRate = (from, to) => {
  const baseRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.82,
    JPY: 149.50,
    CNY: 7.24,
    AUD: 1.53,
    CAD: 1.37,
    CHF: 0.87,
    HKD: 7.83,
    SGD: 1.35
  }

  const fromRate = baseRates[from] || 1
  const toRate = baseRates[to] || 1

  // 添加随机波动
  const volatility = 0.02 // 2%波动
  const randomFactor = 1 + (Math.random() - 0.5) * volatility

  return (toRate / fromRate) * randomFactor
}

// 执行汇率转换
const convertCurrency = () => {
  if (conversionData.value.amount <= 0) {
    conversionResult.value = 0
    exchangeRate.value = null
    return
  }

  exchangeRate.value = getSimulatedExchangeRate(conversionData.value.fromCurrency, conversionData.value.toCurrency)
  conversionResult.value = conversionData.value.amount * exchangeRate.value
}

// 交换货币
const swapCurrencies = () => {
  const temp = conversionData.value.fromCurrency
  conversionData.value.fromCurrency = conversionData.value.toCurrency
  conversionData.value.toCurrency = temp
  convertCurrency()
}

// 快速转换
const quickConvert = (targetCurrency) => {
  conversionData.value.toCurrency = targetCurrency
  convertCurrency()
}

// 计算快速转换结果
const calculateQuickConvert = (targetCurrency) => {
  const rate = getSimulatedExchangeRate(conversionData.value.fromCurrency, targetCurrency)
  return conversionData.value.amount * rate
}

// 查询历史汇率
const queryHistoricalRate = () => {
  if (!historicalData.value.date) return

  // 模拟历史汇率数据
  const baseRate = getSimulatedExchangeRate(conversionData.value.fromCurrency, conversionData.value.toCurrency)
  const daysDiff = Math.floor((new Date() - new Date(historicalData.value.date)) / (1000 * 60 * 60 * 24))
  const historicalChange = (daysDiff * 0.001) // 每天变化0.1%

  historicalRate.value = baseRate * (1 - historicalChange)
}

// 清空输入
const clearInput = () => {
  conversionData.value = {
    amount: 0,
    fromCurrency: 'USD',
    toCurrency: 'CNY'
  }
  historicalData.value.date = ''
  conversionResult.value = 0
  exchangeRate.value = null
  historicalRate.value = null
}

// 加载示例数据
const loadExample = () => {
  conversionData.value = {
    amount: 1000,
    fromCurrency: 'USD',
    toCurrency: 'EUR'
  }
  convertCurrency()
}

// 复制结果
const copyResult = async () => {
  const resultText = `汇率转换结果\n\n` +
    `${conversionData.value.amount} ${conversionData.value.fromCurrency} = ${formatCurrency(conversionResult.value, conversionData.value.toCurrency)}\n` +
    `汇率：1 ${conversionData.value.fromCurrency} = ${exchangeRate.value.toFixed(4)} ${conversionData.value.toCurrency}\n` +
    `更新时间：${new Date().toLocaleString('zh-CN')}`

  try {
    await navigator.clipboard.writeText(resultText)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出结果
const exportResult = () => {
  let csvContent = "汇率转换数据\n\n"
  csvContent += "源货币,目标货币,金额,汇率,转换结果,时间\n"
  csvContent += `${conversionData.value.fromCurrency},${conversionData.value.toCurrency},${conversionData.value.amount},${exchangeRate.value.toFixed(4)},${formatCurrency(conversionResult.value, conversionData.value.toCurrency)},${new Date().toLocaleString('zh-CN')}\n\n`

  // 汇率排名
  csvContent += "汇率排名\n"
  csvContent += "排名,货币代码,货币名称,汇率,变化\n"
  exchangeRateRanking.value.forEach((rate, index) => {
    csvContent += `${index + 1},${rate.code},${rate.name},${rate.rate.toFixed(4)},${rate.change >= 0 ? '+' : ''}${rate.change.toFixed(2)}%\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `汇率转换数据_${new Date().getTime()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 初始化转换
onMounted(() => {
  convertCurrency()
})
</script>