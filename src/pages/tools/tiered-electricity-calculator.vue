<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">阶梯电价计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按省份分档规则逐档算电费，看懂账单、预估换档</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择省份并输入月用电量，工具按居民阶梯电价三档规则把电量切分到各档，逐档给出「电量 × 单价 = 电费」明细与累计总额，
        并提示距离下一档还差多少度；也可以切换自定义模式，手填三档阈值与电价。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 政策口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        内置各省档位区间与电价<strong>按公开信息整理，以官方最新公布为准</strong>；居民阶梯电价按年度/月度周期、暑期与冬季标准在各地存在差异，本工具统一按月度三档简化口径计算，未计入峰谷分时、季节性档位与政府性基金附加，结果仅供参考。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <PlugZap class="w-5 h-5 mr-2 text-primary" /> 用电信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">省份 / 档位方案</label>
          <select
            v-model="province"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="name in provinceNames" :key="name" :value="name">{{ name }}</option>
            <option value="自定义">自定义模式（手填档位与电价）</option>
          </select>
          <p v-if="province !== '自定义'" class="text-xs text-muted-foreground mt-1.5">
            {{ provinceNote }}
          </p>
        </div>

        <!-- 自定义模式 -->
        <div v-if="province === '自定义'" class="bg-muted/40 rounded-lg p-4 space-y-3">
          <p class="text-xs text-muted-foreground">按「一档上限、二档上限、各档单价」填写，一档从 0 度起算，三档不封顶。</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">一档上限（度）</label>
              <input v-model.number="cTier1End" type="number" min="1" step="1" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">一档单价（元/度）</label>
              <input v-model.number="cTier1Price" type="number" min="0" step="0.0001" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">二档上限（度）</label>
              <input v-model.number="cTier2End" type="number" min="1" step="1" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">二档单价（元/度）</label>
              <input v-model.number="cTier2Price" type="number" min="0" step="0.0001" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">三档单价（元/度）</label>
              <input v-model.number="cTier3Price" type="number" min="0" step="0.0001" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <p v-if="customInvalid" class="text-xs text-red-500">一档上限需小于二档上限，且单价不小于 0</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">月用电量（度 / kWh）</label>
          <input
            v-model.number="usage"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 350"
          />
        </div>

        <!-- 峰谷开关（简化口径：仍按平段计算） -->
        <div class="flex items-start gap-2">
          <input v-model="peakValley" type="checkbox" id="peakValley" class="w-4 h-4 mt-0.5 rounded border-border" />
          <label for="peakValley" class="text-sm text-foreground">我家用的是峰谷分时电价</label>
        </div>
        <div v-if="peakValley" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p class="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            简化说明：本工具暂按平段（一口价）计算。开通峰谷分时的家庭，峰段通常上浮、谷段下浮（各省市时段与浮动比例不同），
            实际电费需按「分时电量 × 分时电价」另行累加，请以当地电网账单为准。
          </p>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ReceiptText class="w-5 h-5 mr-2 text-primary" /> 电费明细
        </h2>

        <div v-if="usage > 0 && !customInvalid" class="space-y-4">
          <!-- 逐档明细 -->
          <div class="space-y-2">
            <div
              v-for="(row, i) in tierRows"
              :key="i"
              class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5 text-sm"
            >
              <span class="text-muted-foreground">
                {{ tierLabel(i) }}：{{ fmtNum(row.units) }} 度 × {{ row.price }} 元
              </span>
              <span class="font-semibold text-foreground">{{ fmt2(row.cost) }} 元</span>
            </div>
          </div>

          <!-- 总电费 -->
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">当月电费合计（{{ fmtNum(usage) }} 度）</p>
            <p class="text-2xl font-bold text-primary">{{ fmt2(totalFee) }} 元</p>
            <p class="text-xs text-primary mt-1">平均单价约 {{ avgPrice }} 元/度</p>
          </div>

          <!-- 换档提示 -->
          <div class="bg-muted/50 rounded-lg p-4">
            <p class="text-sm text-foreground leading-relaxed">
              <component :is="Gauge" class="w-4 h-4 inline mr-1 text-primary" />
              <template v-if="nextTier">
                本月还能按本档单价用电 <strong class="text-primary">{{ fmtNum(nextTier.diff) }} 度</strong>，
                第 {{ fmtNum(nextTier.threshold) }} 度起进入{{ nextTier.label }}（{{ nextTier.price }} 元/度）。
              </template>
              <template v-else>
                本月已进入最高档（三档），全部超出电量按 {{ tiers[2].price }} 元/度计价，注意节约用电。
              </template>
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          选择省份并输入月用电量，开始计算
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于阶梯电价</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            阶梯电价是居民用电的「用得越多、单价越高」定价机制：每月电量按先后顺序切进一、二、三档，各档分别用对应单价计价后求和。
            它既保障基本用电的低价，又用更高档价引导节约用电。本工具内置主要省份的常用分档口径，也可在自定义模式下按自家账单参数计算。
          </p>
          <h3 class="text-lg font-semibold text-foreground">阶梯电费怎么算</h3>
          <p>
            逐档切分计算：一档电量 = min(用电量, 一档上限)；二档电量 = min(用电量, 二档上限) − 一档上限；三档电量 = 用电量 − 二档上限（不足取 0）。
            例如北京月用电 350 度：一档 240 度 × 0.4883 元 + 二档 110 度 × 0.5383 元 = 176.41 元。
            注意各档单价只作用于「落在该档内的电量」，不是整月电量都按高档价算。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么要关注换档临界点</h3>
          <p>
            档位是「月初清零、按年/按月累计」的临界结构：一旦电量跨过档界，超出部分整体按高档单价计价。
            以北京为例，从二档跨入三档后每度贵 0.25 元，月底若只剩几度余量，错峰使用大功率电器（热水器、空调）就能明显省钱——
            这正是本工具给出「距下一档还差多少度」的原因。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么我家电费和计算结果不一样？</span>实际账单还包含政府性基金及附加、峰谷分时差异、阶梯周期（按年或按月）以及暑期/冬季档位标准等，本工具按月度三档简化口径估算，请以电网账单为准。</li>
            <li><span class="text-foreground font-medium">档位上限是「含」还是「不含」？</span>通常按「不超过上限的电量」归本档，例如北京一档为 1-240 度，第 241 度起进入二档；本工具按同一口径切分。</li>
            <li><span class="text-foreground font-medium">租房合租怎么分电费？</span>房东按总表计量、总电量进高档的情况很常见，可先用本工具算出总额，再按人数、房间数或分表电量比例分摊，并核对房东加价是否超出规定。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'tiered-electricity-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  TrendingUp, PlugZap, ReceiptText, Gauge, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '阶梯电价计算器 - 各省分档电费明细与换档提醒',
  description: '在线阶梯电价计算器，内置北京/上海/广东等省份居民三档电价口径，输入月用电量逐档给出电量×单价电费明细与总额，提示距下一档度数，支持自定义档位与电价，纯本地计算',
  keywords: '阶梯电价计算器, 电费计算, 分档电价, 电费多少, 居民电价, 一档二档三档电价',
  author: 'Util工具箱',
  ogTitle: '阶梯电价计算器 - 有条工具',
  ogDescription: '按省份分档规则逐档算电费，看懂账单、预估换档',
  ogUrl: 'https://www.util.cn/tools/tiered-electricity-calculator',
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
          name: '阶梯电价计算器',
          url: 'https://www.util.cn/tools/tiered-electricity-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['内置多省三档电价口径', '逐档电量与电费明细', '距下一档换档提醒', '自定义档位与电价', '平均单价折算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '阶梯电价计算器', item: 'https://www.util.cn/tools/tiered-electricity-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么我家电费和计算结果不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '实际账单还含政府性基金及附加、峰谷分时差异、阶梯周期与季节性档位等，本工具按月度三档简化口径估算，以电网账单为准。' }
            },
            {
              '@type': 'Question',
              name: '档位上限是含还是不含？',
              acceptedAnswer: { '@type': 'Answer', text: '通常不超过上限的电量归本档，如北京一档为 1-240 度，第 241 度起进入二档，本工具按同一口径切分。' }
            },
            {
              '@type': 'Question',
              name: '合租房电费怎么分摊？',
              acceptedAnswer: { '@type': 'Answer', text: '可先按总表电量算出总额，再按人数、房间数或分表电量比例分摊，并核对房东加价是否合理。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'tiered-electricity-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 内置省份三档口径（按公开信息整理，以当地电网最新公布为准） ----------
const PROVINCE_TIERS = {
  '北京': { note: '月度三档：1-240 度、241-400 度、400 度以上', tiers: [{ end: 240, price: 0.4883 }, { end: 400, price: 0.5383 }, { end: Infinity, price: 0.7883 }] },
  '上海': { note: '月度三档：1-260 度、261-400 度、400 度以上', tiers: [{ end: 260, price: 0.617 }, { end: 400, price: 0.667 }, { end: Infinity, price: 0.917 }] },
  '广东（夏季口径）': { note: '夏季标准月度三档：1-260 度、261-600 度、600 度以上', tiers: [{ end: 260, price: 0.59 }, { end: 600, price: 0.64 }, { end: Infinity, price: 0.89 }] },
  '江苏': { note: '月度三档：1-276 度、277-480 度、480 度以上', tiers: [{ end: 276, price: 0.5283 }, { end: 480, price: 0.5783 }, { end: Infinity, price: 0.8283 }] },
  '浙江': { note: '月度三档：1-276 度、277-480 度、480 度以上', tiers: [{ end: 276, price: 0.538 }, { end: 480, price: 0.588 }, { end: Infinity, price: 0.838 }] },
  '四川': { note: '月度三档：1-180 度、181-280 度、280 度以上', tiers: [{ end: 180, price: 0.5224 }, { end: 280, price: 0.6224 }, { end: Infinity, price: 0.8224 }] },
  '湖北': { note: '月度三档：1-180 度、181-400 度、400 度以上', tiers: [{ end: 180, price: 0.57 }, { end: 400, price: 0.62 }, { end: Infinity, price: 0.87 }] },
  '河南': { note: '月度三档：1-180 度、181-260 度、260 度以上', tiers: [{ end: 180, price: 0.56 }, { end: 260, price: 0.61 }, { end: Infinity, price: 0.86 }] }
}
const provinceNames = Object.keys(PROVINCE_TIERS)

// ---------- 状态 ----------
const province = ref('北京')
const usage = ref(350)
const peakValley = ref(false)
const seoContentVisible = ref(true)

// 自定义模式字段
const cTier1End = ref(100)
const cTier1Price = ref(0.5)
const cTier2End = ref(200)
const cTier2Price = ref(0.6)
const cTier3Price = ref(0.8)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const customInvalid = computed(() =>
  !(cTier1End.value > 0 && cTier2End.value > cTier1End.value) ||
  !(cTier1Price.value >= 0 && cTier2Price.value >= 0 && cTier3Price.value >= 0)
)

const provinceNote = computed(() => (PROVINCE_TIERS[province.value] || {}).note || '')
const tiers = computed(() => {
  if (province.value === '自定义') {
    return [
      { end: cTier1End.value, price: cTier1Price.value },
      { end: cTier2End.value, price: cTier2Price.value },
      { end: Infinity, price: cTier3Price.value }
    ]
  }
  return (PROVINCE_TIERS[province.value] || PROVINCE_TIERS['北京']).tiers
})

// ---------- 核心切分：把用电量按档切分并逐档计价 ----------
const splitByTiers = (u, tierList) => {
  const rows = []
  let prevEnd = 0
  let cum = 0
  const total = Math.max(0, u)
  for (let i = 0; i < tierList.length; i++) {
    const t = tierList[i]
    const upper = Math.min(total, t.end)
    const units = Math.max(0, upper - prevEnd)
    const cost = units * t.price
    cum += cost
    rows.push({ units, price: t.price, cost, cum })
    prevEnd = t.end
    if (total <= t.end) break
  }
  return rows
}

const tierRows = computed(() => splitByTiers(usage.value, tiers.value))
const totalFee = computed(() => tierRows.value.reduce((s, r) => s + r.cost, 0))
const avgPrice = computed(() => (usage.value > 0 ? (Math.round(totalFee.value / usage.value * 10000) / 10000).toFixed(4) : '—'))

// ---------- 换档提示 ----------
const nextTier = computed(() => {
  const u = Math.max(0, usage.value)
  if (u <= tiers.value[0].end) {
    return { label: '二档', diff: tiers.value[0].end - u, threshold: tiers.value[0].end + 1, price: tiers.value[1].price }
  }
  if (u <= tiers.value[1].end) {
    return { label: '三档', diff: tiers.value[1].end - u, threshold: tiers.value[1].end + 1, price: tiers.value[2].price }
  }
  return null
})

// ---------- 展示格式 ----------
const TIER_NAMES = ['一档', '二档', '三档']
const tierLabel = (i) => TIER_NAMES[i] || `第 ${i + 1} 档`
const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100
const fmt2 = (v) => (isFinite(v) ? round2(v).toFixed(2) : '—')
const fmtNum = (v) => (isFinite(v) ? Math.round(v * 100) / 100 : '—')
</script>
