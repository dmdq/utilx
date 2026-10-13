<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电动车充电成本计算</h1>
          <p class="text-sm text-muted-foreground mt-1">算清电车一公里几分钱，与油车成本并排对比</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入电池容量、实际续航、充电效率与电价，按「每公里成本 = 容量 × 电价 ÷ 续航 ÷ 充电效率」算出电车每公里电费；
        可选填油车油耗与油价并排对比，自动折算每公里与每年固定里程的成本差，作为购车决策参考。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 价格口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        默认家充 0.5 元/度、公共桩 1.2 元/度、油价 7.8 元/L 均<strong>按公开信息整理，以官方最新公布为准</strong>；
        各地居民电价、公共桩服务费与油价存在差异，请按实际账单价格修改，未计入保险、保养与折旧等固定成本。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 电车输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BatteryCharging class="w-5 h-5 mr-2 text-primary" /> 电车参数
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">电池容量（kWh）</label>
            <input v-model.number="battery" type="number" min="0" step="0.5" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="如 60" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">实际续航（km）</label>
            <input v-model.number="range" type="number" min="0" step="10" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="按真实表显，如 450" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            充电效率：<span class="text-primary">{{ efficiency }}%</span>（电网取电 ÷ 充入电池的损耗口径）
          </label>
          <input v-model.number="efficiency" type="range" min="70" max="100" step="1" class="w-full accent-primary" />
          <p class="text-xs text-muted-foreground mt-1">默认 90%，即从电网取 100 度约充入 90 度，损耗计入每公里成本</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">电价（元/度）</label>
          <div class="grid grid-cols-3 gap-1.5 mb-2">
            <button
              v-for="opt in priceOptions"
              :key="opt.key"
              @click="priceMode = opt.key"
              :class="priceMode === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ opt.label }}</button>
          </div>
          <input v-if="priceMode === 'custom'" v-model.number="customPrice" type="number" min="0" step="0.01" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="输入电价，如 0.55" />
          <p v-else class="text-xs text-muted-foreground mt-1">{{ activePriceLabel }}</p>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
          口径说明：充满一次从电网取电约 {{ gridKwh }} 度（容量 ÷ 效率），花费约 {{ fmt2(fullChargeCost) }} 元，
          按实际续航摊到每公里即 <span class="text-foreground font-medium">{{ fmt4(evPerKm) }} 元/km</span>。
        </div>
      </div>

      <!-- 油车输入 + 对比结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Fuel class="w-5 h-5 mr-2 text-primary" /> 油车对比（可选）
          </h2>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="compareIce" type="checkbox" class="w-4 h-4 rounded border-border" />
            启用对比
          </label>
        </div>

        <div v-if="compareIce" class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">油耗（L/100km）</label>
            <input v-model.number="fuelConsumption" type="number" min="0" step="0.1" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">油价（元/L）</label>
            <input v-model.number="fuelPrice" type="number" min="0" step="0.01" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">年行驶里程（km）</label>
          <input v-model.number="annualKm" type="number" min="0" step="1000" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <p class="text-xs text-muted-foreground mt-1">默认 20000 公里，可按实际情况修改</p>
        </div>

        <!-- 对比结果 -->
        <div v-if="battery > 0 && range > 0" class="space-y-2">
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">电车每公里电费</span>
            <span class="text-sm font-semibold text-green-600 dark:text-green-400">{{ fmt4(evPerKm) }} 元/km</span>
          </div>
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">电车每百公里电费</span>
            <span class="text-sm font-semibold text-foreground">{{ fmt2(evPerKm * 100) }} 元</span>
          </div>
          <template v-if="compareIce">
            <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
              <span class="text-sm text-muted-foreground">油车每公里油费</span>
              <span class="text-sm font-semibold text-red-500 dark:text-red-400">{{ fmt4(icePerKm) }} 元/km</span>
            </div>
            <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
              <span class="text-sm text-muted-foreground">油车每百公里油费</span>
              <span class="text-sm font-semibold text-foreground">{{ fmt2(icePerKm * 100) }} 元</span>
            </div>
          </template>
        </div>

        <div v-if="battery > 0 && range > 0 && compareIce" class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">按年行驶 {{ fmtNum(annualKm) }} 公里，电车比油车省</p>
          <p class="text-2xl font-bold text-primary">{{ fmt2(annualSaving) }} 元</p>
          <p class="text-xs text-primary mt-1">
            电车 {{ fmt2(evPerKm * annualKm) }} 元 / 年 vs 油车 {{ fmt2(icePerKm * annualKm) }} 元 / 年
          </p>
        </div>

        <NuxtLink
          to="/tools/fuel-calculator"
          class="flex items-center gap-2 text-xs text-primary hover:underline"
        >
          <Fuel class="w-3.5 h-3.5" />
          油车成本可去站内【油耗计算器】细算百公里油耗与行程油费
        </NuxtLink>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于电车用车成本</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            电车的能耗成本主要由三件事决定：电池容量与电价的乘积（充满一次花多少钱）、实际续航（这钱能跑多远）、
            以及常被忽略的充电效率（从电网取的电并没有全部充进电池）。把三者放在一起，才能得到接近账单真实水平的每公里成本。
          </p>
          <h3 class="text-lg font-semibold text-foreground">每公里成本公式</h3>
          <p>
            每公里成本 =（电池容量 × 电价）÷ 实际续航 ÷ 充电效率。例如 60kWh 电池、实际续航 450km、
            家充电价 0.55 元/度、充电效率 90%：60 × 0.55 ÷ 450 ÷ 0.9 ≈ 0.0815 元/km，即一公里约 8 分钱；
            同工况下油车 8L/100km、7.8 元/L 为 0.624 元/km，年行驶 2 万公里相差约 1.09 万元。
            充电效率按 90% 计对应交流慢充的典型损耗，直流快充与低温环境损耗更高。
          </p>
          <h3 class="text-lg font-semibold text-foreground">家充与公共桩差多少</h3>
          <p>
            家充按居民电价计费，夜间谷段更低；公共桩电费之外还叠加服务费与停车费，单价常达家充的两倍以上。
            同一辆车用家充与公共桩的每公里成本可以差一倍多——能否安装家充桩，往往比续航数字更能决定真实用车成本，
            建议两种电价分别代入对比。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">续航应该填标定还是实际？</span>建议填真实使用中的表显续航（考虑空调、高速与季节衰减），标定续航会把每公里成本算得偏乐观。</li>
            <li><span class="text-foreground font-medium">充电效率为什么不是 100%？</span>交流充电经车载充电机与电池内阻存在转化损耗，通常按 85%-95% 计，本工具默认 90% 并可调节。</li>
            <li><span class="text-foreground font-medium">结果包含保险保养吗？</span>不包含。本工具只对比能耗成本；电车的保险与保养同样需要纳入总持有成本后再做购车决策。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ev-charging-cost-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Zap, BatteryCharging, Fuel, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '电动车充电成本计算 - 每公里电费与油车对比',
  description: '在线电动车充电成本计算器，按容量×电价÷续航÷充电效率算每公里电费，家充/公共桩/自定义电价可选，与油车油耗成本并排对比并折算年行驶成本差，纯本地计算',
  keywords: '电动车充电成本, 电车一公里几毛, 油电成本对比, 充电费用计算, 每公里电费, 用车成本',
  author: 'Util工具箱',
  ogTitle: '电动车充电成本计算 - 有条工具',
  ogDescription: '算清电车一公里几分钱，与油车成本并排对比',
  ogUrl: 'https://www.util.cn/tools/ev-charging-cost-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '电动车充电成本计算',
          url: 'https://www.util.cn/tools/ev-charging-cost-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['每公里电费折算', '充电效率损耗计入', '家充/公共桩/自定义电价', '油车成本并排对比', '年行驶成本差测算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电动车充电成本计算', item: 'https://www.util.cn/tools/ev-charging-cost-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '续航应该填标定还是实际？',
              acceptedAnswer: { '@type': 'Answer', text: '建议填真实表显续航，标定续航会把每公里成本算得偏乐观。' }
            },
            {
              '@type': 'Question',
              name: '充电效率为什么不是100%？',
              acceptedAnswer: { '@type': 'Answer', text: '充电存在转化损耗，交流慢充通常按85%-95%计，本工具默认90%且可调节。' }
            },
            {
              '@type': 'Question',
              name: '结果包含保险保养吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不包含，本工具只对比能耗成本，购车决策还需纳入保险保养等固定支出。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ev-charging-cost-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const battery = ref(60)
const range = ref(450)
const efficiency = ref(90)
const priceMode = ref('home')
const customPrice = ref(0.55)
const compareIce = ref(true)
const fuelConsumption = ref(8)
const fuelPrice = ref(7.8)
const annualKm = ref(20000)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const priceOptions = [
  { key: 'home', label: '家充 0.5', price: 0.5, desc: '按居民电价常见水平' },
  { key: 'public', label: '公共桩 1.2', price: 1.2, desc: '含服务费的公共桩常见水平' },
  { key: 'custom', label: '自定义', price: 0, desc: '按充电账单实际单价填写' }
]
const activePrice = computed(() => {
  if (priceMode.value === 'custom') return Math.max(0, Number(customPrice.value) || 0)
  const opt = priceOptions.find(o => o.key === priceMode.value)
  return opt ? opt.price : 0
})
const activePriceLabel = computed(() => (priceOptions.find(o => o.key === priceMode.value) || {}).desc || '')

// ---------- 核心口径：每公里成本 = 容量×电价 ÷ 续航 ÷ 充电效率 ----------
const evPerKm = computed(() => {
  const eff = Math.min(100, Math.max(1, Number(efficiency.value) || 90)) / 100
  if (battery.value <= 0 || range.value <= 0) return 0
  return (battery.value * activePrice.value) / range.value / eff
})

const gridKwh = computed(() => {
  const eff = Math.min(100, Math.max(1, Number(efficiency.value) || 90)) / 100
  if (eff <= 0) return '—'
  return (Math.round((battery.value / eff) * 100) / 100).toString()
})
const fullChargeCost = computed(() => battery.value * activePrice.value)

const icePerKm = computed(() => (fuelConsumption.value * fuelPrice.value) / 100)
const annualSaving = computed(() => (icePerKm.value - evPerKm.value) * Math.max(0, annualKm.value))

// ---------- 格式 ----------
const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100
const fmt2 = (v) => (isFinite(v) ? round2(v).toFixed(2) : '—')
const fmt4 = (v) => (isFinite(v) ? (Math.round(v * 10000) / 10000).toFixed(4) : '—')
const fmtNum = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '—')
</script>
