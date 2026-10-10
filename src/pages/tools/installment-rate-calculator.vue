<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CreditCard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">信用卡分期实际利率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">分期手续费率一键换算真实年化利率（IRR），看清名义费率背后的真实成本</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        信用卡分期常被宣传为「月费率仅 0.6%」的低成本方式，但由于本金逐期偿还而手续费按全额计收，真实年化利率（IRR）通常接近名义费率的 1.8 倍。输入分期金额、期数与手续费率，工具会用二分法求解现金流内含报酬率，给出每期还款计划与实际年化，并提供常见期数×费率的 IRR 速查表。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 分期信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">分期总金额（元）</label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            step="100"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">期数</label>
          <div class="grid grid-cols-6 gap-1.5">
            <button
              v-for="p in periodOptions"
              :key="p"
              @click="periods = p"
              :class="periods === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ p }}期</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">每期手续费率（%）</label>
          <div class="grid grid-cols-3 gap-1.5 mb-2">
            <button
              v-for="r in ratePresets"
              :key="r"
              @click="feeRate = r"
              :class="feeRate === r ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ r.toFixed(2) }}%</button>
          </div>
          <input
            v-model.number="feeRate"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">常见为每期 0.60% ~ 0.75%，以账单展示为准</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">手续费收取方式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="feeMode = 'per'"
              :class="feeMode === 'per' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >每期收取</button>
            <button
              @click="feeMode = 'upfront'"
              :class="feeMode === 'upfront' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >一次性首期收取</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">一次性首期收取时手续费提前支付，实际利率通常更高</p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          计算口径：首期银行全额垫付本金，之后每期偿还 本金/期数 + 手续费；用二分法在月利率区间 [0.01%, 10%] 内求解现金流净现值为零的内含报酬率（IRR），月利率 × 12 即实际年化利率。
        </p>
      </div>

      <!-- 中间：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Percent class="w-5 h-5 mr-2 text-primary" /> 分期成本明细
        </h2>

        <div v-if="isValidInput" class="space-y-4">
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">实际年化利率（IRR）</p>
            <p class="text-3xl font-bold text-primary">{{ irrAnnual.toFixed(2) }}%</p>
            <p class="text-xs text-primary mt-1">约为名义年化的 {{ irrRatio.toFixed(1) }} 倍</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">{{ feeMode === 'per' ? '每期手续费' : '一次性手续费' }}</p>
              <p class="text-sm font-bold text-foreground">{{ fmtYuan(perFee) }} 元</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总手续费</p>
              <p class="text-sm font-bold text-foreground">{{ fmtYuan(totalFee) }} 元</p>
            </div>
          </div>

          <div class="text-sm">
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">每期应还本金</span>
              <span class="text-foreground font-medium">{{ fmtYuan(principalPart) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <template v-if="feeMode === 'per'">
                <span class="text-muted-foreground">每期实还金额</span>
                <span class="text-foreground font-medium">{{ fmtYuan(principalPart + perFee) }} 元</span>
              </template>
              <template v-else>
                <span class="text-muted-foreground">首期实还 / 其余每期</span>
                <span class="text-foreground font-medium text-xs">
                  {{ fmtYuan(principalPart + totalFee) }} / {{ fmtYuan(principalPart) }} 元
                </span>
              </template>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">名义总费率（费率×期数）</span>
              <span class="text-foreground font-medium">{{ (feeRateDecimal * 100 * periods).toFixed(2) }}%</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">名义年化（月费率×12）</span>
              <span class="text-foreground font-medium">{{ (feeRateDecimal * 12 * 100).toFixed(2) }}%</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">还款总额（本息合计）</span>
              <span class="text-foreground font-medium">{{ fmtYuan(amount + totalFee) }} 元</span>
            </div>
          </div>

          <div class="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
            名义 vs 实际：分期的手续费始终按<b class="text-foreground">原始本金全额</b>计收，但你每期都在归还本金，实际占用的资金远少于分期总额，因此真实资金成本（IRR）通常约为名义年化的 1.8 倍左右。以本页默认示例（12000 元、12 期、每期 0.60%）为例：名义年化仅 7.2%，实际年化约 13.03%。
          </div>
        </div>

        <div v-else class="text-center text-muted-foreground py-12">
          请输入有效的分期金额与手续费率
        </div>
      </div>

      <!-- 右侧：IRR 速查表 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Table class="w-5 h-5 mr-2 text-primary" /> 常见期数×费率 IRR 速查
        </h2>

        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-muted-foreground border-b border-border">
                <th class="py-2 text-left font-medium">期数</th>
                <th v-for="r in quickRates" :key="r" class="py-2 text-right font-medium">{{ r.toFixed(2) }}%/期</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="n in quickPeriods"
                :key="n"
                :class="periods === n ? 'bg-primary/5' : ''"
                class="border-b border-border/40"
              >
                <td class="py-2 font-medium text-foreground">{{ n }} 期</td>
                <td v-for="r in quickRates" :key="r" class="py-2 text-right text-foreground font-mono">
                  {{ quickIRR(n, r).toFixed(2) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
          上表按「每期收取手续费」口径计算实际年化。可以看到：无论期数长短，月费率 0.60% 的实际年化都在 13% 上下，接近名义值 7.2% 的 1.8 倍；若手续费为一次性首期收取，实际利率还会更高。
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-xs text-primary leading-relaxed">
          决策参考：若手头有年化低于上表对应 IRR 的稳健理财或可低成本周转的资金，通常不如不分期；若确需分期，优先选费率更低、期数更短（总手续费更少）的方案，并留意是否有提前还款减免规则。
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>信用卡分期的名义费率与实际利率</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            信用卡账单分期几乎从不公布「利率」，只公布「每期手续费率」，例如 0.60%/期。直觉上，0.60%×12=7.2% 似乎比很多贷款便宜，但这是一个典型的口径错觉：手续费按分期时的原始本金计算，而你的欠款每个月都在减少，最后一期实际只占用本金的 1/12，却仍按全额付手续费。把真实现金流（首期收到全额、之后每期等额偿还本息）折现求内部收益率，才是这笔分期真正的年化利率。
          </p>
          <h3 class="text-lg font-semibold text-foreground">IRR 是怎么算出来的</h3>
          <p>
            把分期看作一笔贷款：t=0 时刻银行给你 P 元，之后 n 期每期偿还 P/n 加手续费，手续费按「每期收取」或「一次性首期收取」两种口径排入现金流。实际年化利率就是使这组现金流净现值（NPV）为零的月利率再乘以 12。工具采用二分法在 [0.01%, 10%] 的月利率区间内迭代求解，收敛稳定、无需求导。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么实际利率比名义高这么多？</span>因为手续费按全额本金计收，而本金逐期归还、实际占用资金逐期减少，折算下来真实成本约为名义年化的 1.8 倍左右。</li>
            <li><span class="text-foreground font-medium">一次性首期收取和每期收取哪种更贵？</span>手续费总额相同时，一次性首期收取相当于更早付出全部手续费，资金时间价值上更吃亏，实际年化一般比每期收取高 0.5~1 个百分点。</li>
            <li><span class="text-foreground font-medium">分期提前还款能省手续费吗？</span>多数银行提前结清仍需支付剩余全部手续费或收取违约金，具体以发卡行章程为准；建议在决策时把这一点计入成本。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'installment-rate-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CreditCard, Calculator, Percent, Table, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '信用卡分期实际利率计算器 - 手续费率换算真实年化IRR',
  description: '在线信用卡分期实际利率计算器，输入分期金额、期数与每期手续费率，用二分法求解IRR真实年化利率，名义费率与实际利率对照，含常见期数费率速查表，纯本地计算',
  keywords: '信用卡分期实际利率, 分期手续费率换算, IRR利率计算器, 分期利率计算, 信用卡分期划算吗, 分期真实年化',
  author: 'Util工具箱',
  ogTitle: '信用卡分期实际利率计算器 - 有条工具',
  ogDescription: '分期手续费率一键换算真实年化利率（IRR），看清名义费率背后的真实成本',
  ogUrl: 'https://www.util.cn/tools/installment-rate-calculator',
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
          name: '信用卡分期实际利率计算器',
          url: 'https://www.util.cn/tools/installment-rate-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['IRR实际年化求解', '每期/一次性手续费对照', '名义费率与实际利率对比', '常见期数费率速查表', '二分法本地计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '信用卡分期实际利率计算器', item: 'https://www.util.cn/tools/installment-rate-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么分期实际利率比名义费率高？',
              acceptedAnswer: { '@type': 'Answer', text: '手续费按原始本金全额计收，而本金逐期归还、实际占用资金逐期减少，折算后的真实年化（IRR）约为名义年化的1.8倍左右。' }
            },
            {
              '@type': 'Question',
              name: '实际年化利率（IRR）是怎么计算的？',
              acceptedAnswer: { '@type': 'Answer', text: '将分期视为首期收到全额本金、之后每期偿还本金加手续费的现金流，用二分法求解使净现值为零的月利率，再乘以12得到年化利率。' }
            },
            {
              '@type': 'Question',
              name: '一次性收取手续费和每期收取哪个更贵？',
              acceptedAnswer: { '@type': 'Answer', text: '手续费总额相同时，一次性首期收取因提前支付全部手续费，实际年化一般比每期收取高0.5~1个百分点。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'installment-rate-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const amount = ref(12000)
const periods = ref(12)
const feeRate = ref(0.6)
const feeMode = ref('per')
const seoContentVisible = ref(true)

const periodOptions = [3, 6, 12, 18, 24, 36]
const ratePresets = [0.6, 0.66, 0.75]

const fmtYuan = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '—')

// ---------- 核心：二分法求 IRR ----------
// cashflows: 第 i 期还款额（i 从 1 开始计息）；principal: t=0 收到的本金
const solveIRRMonthly = (cashflows, principal) => {
  const n = cashflows.length
  if (principal <= 0 || n === 0) return 0
  const npv = (r) => {
    let pv = 0
    for (let i = 0; i < n; i++) pv += cashflows[i] / Math.pow(1 + r, i + 1)
    return pv - principal
  }
  let lo = 0.0001
  let hi = 0.1
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2
    if (npv(mid) > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// 构建现金流
const buildFlows = (principal, n, feeRateDecimal, mode) => {
  const flows = []
  const principalPart = principal / n
  const perFee = principal * feeRateDecimal
  for (let i = 0; i < n; i++) {
    if (mode === 'upfront') {
      flows.push(i === 0 ? principalPart + perFee * n : principalPart)
    } else {
      flows.push(principalPart + perFee)
    }
  }
  return flows
}

const isValidInput = computed(() => amount.value > 0 && periods.value >= 1 && feeRate.value >= 0)

const feeRateDecimal = computed(() => Math.max(0, feeRate.value) / 100)
const principalPart = computed(() => Math.max(0, amount.value) / Math.max(1, periods.value))
const perFee = computed(() => Math.max(0, amount.value) * feeRateDecimal.value)
const totalFee = computed(() => perFee.value * Math.max(1, periods.value))

const irrAnnual = computed(() => {
  if (!isValidInput.value) return 0
  const flows = buildFlows(Math.max(0, amount.value), Math.max(1, periods.value), feeRateDecimal.value, feeMode.value)
  return solveIRRMonthly(flows, Math.max(0, amount.value)) * 12 * 100
})

const irrRatio = computed(() => {
  const nominal = feeRateDecimal.value * 12 * 100
  if (nominal <= 0) return 0
  return irrAnnual.value / nominal
})

// 速查表（每期收取口径）
const quickPeriods = [3, 6, 12, 18, 24, 36]
const quickRates = [0.6, 0.66, 0.75]
const quickIRR = (n, ratePercent) => {
  const flows = buildFlows(12000, n, ratePercent / 100, 'per')
  return solveIRRMonthly(flows, 12000) * 12 * 100
}
</script>
