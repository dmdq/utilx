<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingDown class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">通货膨胀计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">基于中国历年 CPI 估算货币购买力变化：N 年前的 100 元相当于现在多少钱</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        「90 年代的万元户」到底有多有钱？输入任意金额与两个年份，工具按国家统计局历年 CPI 同比数据逐年累乘，估算该金额在目标年份的等值购买力，并给出年均通胀率与通俗解读。数据基于国家统计局历年 CPI 同比数据整理，结果为估算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算条件
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">金额（元）</label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            step="10"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">起始年份</label>
            <select v-model.number="startYear" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option v-for="y in yearOptions" :key="'s' + y" :value="y">{{ y }} 年</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">目标年份</label>
            <select v-model.number="targetYear" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option v-for="y in yearOptions" :key="'t' + y" :value="y">{{ y }} 年</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="q in quickExamples"
            :key="q.label"
            @click="applyExample(q)"
            class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
          >{{ q.label }}</button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          算法：等值金额 = 金额 × Π(1 + 当年CPI/100)，从起始年跨到目标年，按经过的每个年度 CPI 同比逐项累乘；若目标年份早于起始年份则反向折算（除以途经年度的 CPI）。
        </p>

        <div class="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            基于国家统计局历年 CPI 同比数据整理（2025 年为约估值），CPI 反映一篮子消费价格变化，不含房价等资产价格，结果为估算，仅供参考。
          </p>
        </div>
      </div>

      <!-- 中间：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Coins class="w-5 h-5 mr-2 text-primary" /> 购买力换算结果
        </h2>

        <div v-if="startYear !== targetYear && amount > 0" class="space-y-4">
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ startYear }} 年的 {{ fmtYuan(amount) }} 元，相当于 {{ targetYear }} 年的</p>
            <p class="text-3xl font-bold text-primary">{{ fmtYuan2(equivalent) }} 元</p>
            <p class="text-xs text-primary mt-1">累计为原来的 {{ factor.toFixed(2) }} 倍</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">物价累计上涨</p>
              <p class="text-sm font-bold text-foreground">{{ ((factor - 1) * 100).toFixed(1) }}%</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">年均通胀率（几何平均）</p>
              <p class="text-sm font-bold text-foreground">{{ avgInflation.toFixed(2) }}%</p>
            </div>
          </div>

          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">货币购买力变化</p>
            <p class="text-sm font-bold text-foreground">
              {{ targetYear }} 年的 {{ fmtYuan(amount) }} 元，购买力只相当于 {{ startYear }} 年的 {{ fmtYuan2(amount / factor) }} 元
              <span class="text-muted-foreground">（变化 {{ ((1 / factor - 1) * 100).toFixed(1) }}%）</span>
            </p>
          </div>

          <div class="bg-primary/10 rounded-lg p-4 text-xs text-primary leading-relaxed">
            {{ interpretation }}
          </div>
        </div>

        <div v-else class="text-center text-muted-foreground py-12">
          {{ startYear === targetYear ? '请选择两个不同的年份' : '请输入有效金额' }}
        </div>
      </div>

      <!-- 右侧：直观对比 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Scale class="w-5 h-5 mr-2 text-primary" /> 同样金额的购买力
        </h2>

        <div class="space-y-2">
          <div class="bg-muted/50 rounded-lg p-3">
            <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{{ startYear }} 年</span>
              <span>购买力 100%</span>
            </div>
            <div class="h-3 rounded-full bg-primary/20 overflow-hidden">
              <div class="h-full bg-primary rounded-full" style="width: 100%"></div>
            </div>
            <p class="text-xs text-foreground mt-1.5 font-medium">{{ fmtYuan(amount) }} 元</p>
          </div>

          <div class="bg-muted/50 rounded-lg p-3">
            <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{{ targetYear }} 年</span>
              <span>购买力 {{ purchasingPowerPct.toFixed(1) }}%</span>
            </div>
            <div class="h-3 rounded-full bg-muted overflow-hidden">
              <div class="h-full bg-primary/60 rounded-full transition-all" :style="{ width: Math.min(100, purchasingPowerPct) + '%' }"></div>
            </div>
            <p class="text-xs text-foreground mt-1.5 font-medium">同样的 {{ fmtYuan(amount) }} 元，只买得到 {{ startYear }} 年 {{ fmtYuan2(amount / factor) }} 元的东西</p>
          </div>
        </div>

        <div class="text-sm">
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">跨越年数</span>
            <span class="text-foreground font-medium">{{ Math.abs(targetYear - startYear) }} 年</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">途经年度 CPI 累乘项数</span>
            <span class="text-foreground font-medium">{{ Math.abs(targetYear - startYear) }} 项</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">期间最高单年 CPI</span>
            <span class="text-foreground font-medium">{{ maxCpiValue.toFixed(1) }}%（{{ maxCpiYear }}）</span>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          1993-1995 年是中国近几十年通胀最高的时期（连续三年 CPI 超过 14%），而 1998-1999、2002、2009、2021 之后出现过 CPI 为负的「通缩」年份，会小幅抵消此前累计的物价上涨。
        </p>
      </div>
    </div>

    <!-- 年度 CPI 简表（可折叠） -->
    <div class="relative mb-8">
      <button
        @click="cpiTableVisible = !cpiTableVisible"
        class="w-full flex items-center justify-between bg-card border border-border rounded-lg px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span class="font-semibold text-foreground flex items-center">
          <Table class="w-5 h-5 mr-2 text-primary" /> 历年 CPI 同比数据简表（{{ cpiYears[0] }}-{{ cpiYears[cpiYears.length - 1] }}）
        </span>
        <ChevronUp v-if="cpiTableVisible" class="w-5 h-5 text-muted-foreground" />
        <ChevronDown v-else class="w-5 h-5 text-muted-foreground" />
      </button>
      <div v-show="cpiTableVisible" class="bg-card border border-t-0 border-border rounded-b-lg p-6">
        <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
          <div
            v-for="y in cpiYears"
            :key="y"
            :class="y === startYear || y === targetYear ? 'bg-primary/10' : 'bg-muted/50'"
            class="rounded-lg p-2 text-center"
          >
            <p class="text-[10px] text-muted-foreground">{{ y }}</p>
            <p :class="cpiData[y] < 0 ? 'text-destructive' : 'text-foreground'" class="text-sm font-bold">{{ cpiData[y].toFixed(1) }}%</p>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
          CPI 为居民消费价格指数同比涨幅（%），负值表示当年物价整体下跌（通缩）。数据基于国家统计局公开数据整理，2025 年为约估值。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span> CPI 与货币购买力</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            CPI（居民消费价格指数）衡量一篮子消费品与服务的价格同比变化，是衡量通货膨胀最常用的指标。把每年的 CPI 同比涨幅逐年累乘，就能把某个年份的金额换算成另一个年份的「等值购买力」。例如按本页内置数据，1990 年的 100 元约相当于 2024 年的 328 元——三十多年间物价累计涨到原来的 3.3 倍左右，年均通胀约 3.6%。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么「体感」比 CPI 高</h3>
          <p>
            CPI 一篮子里食品、衣着、交通通信占大头，而房价、教育、医疗中涨价最快的部分权重有限或按租金口径计入，所以不少人觉得「钱贬得比 CPI 快」。CPI 换算更适合衡量日常消费层面的购买力变化，不宜直接套用于房价等资产价格。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">数据来源是什么？</span>基于国家统计局公布的历年 CPI 同比数据整理，2025 年为约估值；官方数据可能随基期轮换修订，结果为估算。</li>
            <li><span class="text-foreground font-medium">等值金额是怎么算的？</span>从起始年到目标年，按途经每个年度的 CPI 同比逐项累乘（如 1990→2024 即乘以 1991-2024 年共 34 个 (1+CPI) ），等价于复利式累加物价涨幅。</li>
            <li><span class="text-foreground font-medium">可以反向计算吗？</span>可以。目标年份早于起始年份时，工具会自动反向折算，用于回答「现在的 100 元相当于当年多少钱」。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'inflation-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { TrendingDown, Calculator, Coins, Scale, Info, Table, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '通货膨胀计算器 - 基于中国历年CPI估算货币购买力变化',
  description: '在线通货膨胀计算器，基于国家统计局1990-2025年CPI同比数据逐年累乘，估算N年前的100元相当于现在多少钱，含年均通胀率与购买力变化，纯本地计算',
  keywords: '通货膨胀计算器, 货币购买力计算, CPI计算, 钱贬值计算, 90年代100块, 物价对比',
  author: 'Util工具箱',
  ogTitle: '通货膨胀计算器 - 有条工具',
  ogDescription: '基于中国历年CPI估算货币购买力变化，N年前的100元相当于现在多少钱',
  ogUrl: 'https://www.util.cn/tools/inflation-calculator',
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
          name: '通货膨胀计算器',
          url: 'https://www.util.cn/tools/inflation-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['1990-2025年CPI逐年累乘', '任意年份双向换算', '年均通胀率（几何平均）', '购买力变化可视化', '历年CPI数据简表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '通货膨胀计算器', item: 'https://www.util.cn/tools/inflation-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '等值金额是怎么计算的？',
              acceptedAnswer: { '@type': 'Answer', text: '按国家统计局历年CPI同比数据，从起始年到目标年逐年累乘(1+CPI/100)得到累计倍数，再乘以原金额；目标年份更早时反向折算。' }
            },
            {
              '@type': 'Question',
              name: '结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'CPI反映一篮子消费价格变化，不含房价等资产价格，且数据为整理值（2025年为约估），结果为估算，仅供参考。' }
            },
            {
              '@type': 'Question',
              name: '1990年的100元相当于2024年多少钱？',
              acceptedAnswer: { '@type': 'Answer', text: '按本页内置CPI数据逐年累乘，约为328元左右（累计约3.28倍，年均通胀约3.6%）。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'inflation-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 内置 CPI 数据（国家统计局历年 CPI 同比 %，2025 为约估） ----------
const cpiData = {
  1990: 3.1, 1991: 3.4, 1992: 6.4, 1993: 14.7, 1994: 24.1, 1995: 17.1,
  1996: 8.3, 1997: 2.8, 1998: -0.8, 1999: -1.4, 2000: 0.4, 2001: 0.7,
  2002: -0.8, 2003: 1.2, 2004: 3.9, 2005: 1.8, 2006: 1.5, 2007: 4.8,
  2008: 5.9, 2009: -0.7, 2010: 3.3, 2011: 5.4, 2012: 2.6, 2013: 2.6,
  2014: 2.0, 2015: 1.4, 2016: 2.0, 2017: 1.6, 2018: 2.1, 2019: 2.9,
  2020: 2.5, 2021: 0.9, 2022: 2.0, 2023: 0.2, 2024: 0.2, 2025: 0.3
}
const cpiYears = Object.keys(cpiData).map(Number).sort((a, b) => a - b)
const yearOptions = cpiYears

// ---------- 状态 ----------
const amount = ref(100)
const startYear = ref(1990)
const targetYear = ref(2024)
const seoContentVisible = ref(true)
const cpiTableVisible = ref(false)

const quickExamples = [
  { label: '90年的100元', amount: 100, startYear: 1990, targetYear: 2024 },
  { label: '00年的100元', amount: 100, startYear: 2000, targetYear: 2024 },
  { label: '10年的100元', amount: 100, startYear: 2010, targetYear: 2024 },
  { label: '万元户换算', amount: 10000, startYear: 1990, targetYear: 2024 }
]

const applyExample = (q) => {
  amount.value = q.amount
  startYear.value = q.startYear
  targetYear.value = q.targetYear
}

const fmtYuan = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '—')
const fmtYuan2 = (v) => (isFinite(v) ? (Math.round(v * 100) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')

// ---------- 核心计算 ----------
// 累计倍数：从起始年跨到目标年，按经过的每个年度 CPI 累乘
const factor = computed(() => {
  if (startYear.value === targetYear.value) return 1
  let f = 1
  if (targetYear.value > startYear.value) {
    for (let y = startYear.value + 1; y <= targetYear.value; y++) {
      f *= 1 + cpiData[y] / 100
    }
  } else {
    for (let y = targetYear.value + 1; y <= startYear.value; y++) {
      f /= 1 + cpiData[y] / 100
    }
  }
  return f
})

const equivalent = computed(() => Math.max(0, amount.value) * factor.value)

const avgInflation = computed(() => {
  const years = Math.abs(targetYear.value - startYear.value)
  if (years === 0 || factor.value <= 0) return 0
  return (Math.pow(factor.value, 1 / years) - 1) * 100
})

const purchasingPowerPct = computed(() => {
  if (factor.value <= 0) return 100
  // 目标年同样金额的购买力相对起始年的比例
  return (startYear.value < targetYear.value ? 1 / factor.value : factor.value) * 100
})

const interpretation = computed(() => {
  const a = Math.max(0, amount.value)
  const years = Math.abs(targetYear.value - startYear.value)
  if (factor.value > 1) {
    return `${startYear.value} 年的 ${fmtYuan(a)} 元放到 ${targetYear.value} 年，需要 ${fmtYuan2(equivalent.value)} 元才能买到同样的东西：这 ${years} 年里物价累计涨到原来的 ${factor.value.toFixed(2)} 倍，平均每年上涨约 ${avgInflation.value.toFixed(2)}%。换句话说，钱如果一直躺在手里不增值，购买力就悄悄缩水到了原来的约 ${(1 / factor.value * 100).toFixed(0)}%。`
  }
  return `${startYear.value} 年的 ${fmtYuan(a)} 元相当于 ${targetYear.value} 年的约 ${fmtYuan2(equivalent.value)} 元：这 ${years} 年整体物价不升反降（年均约 ${avgInflation.value.toFixed(2)}%），同样的钱反而更耐花了。`
})

const maxCpiInSpan = computed(() => {
  const lo = Math.min(startYear.value, targetYear.value) + 1
  const hi = Math.max(startYear.value, targetYear.value)
  let maxV = -Infinity
  let maxY = startYear.value
  for (let y = lo; y <= hi; y++) {
    if (cpiData[y] > maxV) {
      maxV = cpiData[y]
      maxY = y
    }
  }
  return { v: maxV, y: maxY }
})
const maxCpiYear = computed(() => maxCpiInSpan.value.y)
// 模板里用到数值时取 v
const maxCpiValue = computed(() => (isFinite(maxCpiInSpan.value.v) ? maxCpiInSpan.value.v : 0))
</script>
