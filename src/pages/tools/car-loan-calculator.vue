<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Landmark class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">车贷月供计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">等额本息/等额本金双口径月供对比，含首付比例、总利息与月供收入占比提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        买车贷款前算清楚三件事：月供多少、总利息多少、两种还款方式差多少。输入车辆成交价、首付比例、年利率与期数，工具会同时按「等额本息」（每月固定）与「等额本金」（逐月递减）计算月供、首末月供与总利息，并给出对比结论与月供占收入的安全线提示。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Car class="w-5 h-5 mr-2 text-primary" /> 贷款条件
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">车辆成交价（元）</label>
          <input
            v-model.number="carPrice"
            type="number"
            min="0"
            step="1000"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            首付比例：<span class="text-primary">{{ (downPaymentRate * 100).toFixed(0) }}%</span>
            <span class="text-muted-foreground text-xs ml-1">（首付 {{ fmtYuan(downPayment) }} 元）</span>
          </label>
          <div class="grid grid-cols-3 gap-1.5 mb-2">
            <button
              v-for="r in downPaymentPresets"
              :key="r"
              @click="downPaymentRate = r"
              :class="downPaymentRate === r ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ (r * 100).toFixed(0) }}%</button>
          </div>
          <input v-model.number="downPaymentRate" type="range" min="0" max="0.9" step="0.05" class="w-full accent-primary" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">年利率（%）</label>
          <div class="grid grid-cols-3 gap-1.5 mb-2">
            <button
              v-for="r in ratePresets"
              :key="r"
              @click="annualRate = r"
              :class="annualRate === r ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ r.toFixed(0) }}%</button>
          </div>
          <input
            v-model.number="annualRate"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">厂商贴息可能低至 0%~3%，银行车贷常见 3%~6%</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">期数</label>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="n in termOptions"
              :key="n"
              @click="term = n"
              :class="term === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ n }}期</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ (term / 12).toFixed(0) }} 年期，部分金融机构支持更长</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">月收入（元，选填）</label>
          <input
            v-model.number="monthlyIncome"
            type="number"
            min="0"
            step="500"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">填写后可评估月供压力</p>
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">贷款金额（车价 × (1 − 首付比例)）</p>
          <p class="text-xl font-bold text-primary">{{ fmtYuan(loanPrincipal) }} 元</p>
        </div>
      </div>

      <!-- 中间：等额本息 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarClock class="w-5 h-5 mr-2 text-primary" /> 等额本息（月供固定）
        </h2>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">每月月供</p>
          <p class="text-3xl font-bold text-primary">{{ fmtYuan2(annuity.monthlyPay) }} 元</p>
        </div>

        <div class="text-sm">
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">还款总额</span>
            <span class="text-foreground font-medium">{{ fmtYuan(annuity.totalPayment) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">总利息</span>
            <span class="text-foreground font-medium">{{ fmtYuan(annuity.totalInterest) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">利息占贷款</span>
            <span class="text-foreground font-medium">{{ annuity.interestRatio.toFixed(2) }}%</span>
          </div>
        </div>

        <!-- 月供压力提示 -->
        <div v-if="monthlyIncome > 0" :class="paymentBurden.isHeavy ? 'bg-destructive/10' : 'bg-muted/50'" class="rounded-lg p-3 text-xs leading-relaxed">
          <p :class="paymentBurden.isHeavy ? 'text-destructive' : 'text-muted-foreground'">
            {{ paymentBurden.text }}
          </p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          公式：月供 = 本金 × 月利率 × (1+月利率)^n ÷ [(1+月利率)^n − 1]，其中月利率 = 年利率 ÷ 12。每月还款额固定，便于规划，适合收入稳定的人群。
        </p>
      </div>

      <!-- 右侧：等额本金 + 对比 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <TrendingDown class="w-5 h-5 mr-2 text-primary" /> 等额本金（逐月递减）
        </h2>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">首月月供</p>
            <p class="text-sm font-bold text-foreground">{{ fmtYuan2(equalPrincipal.firstPay) }} 元</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">末月月供</p>
            <p class="text-sm font-bold text-foreground">{{ fmtYuan2(equalPrincipal.lastPay) }} 元</p>
          </div>
        </div>

        <div class="text-sm">
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">每月递减</span>
            <span class="text-foreground font-medium">{{ fmtYuan2(equalPrincipal.monthlyDecrease) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">还款总额</span>
            <span class="text-foreground font-medium">{{ fmtYuan(equalPrincipal.totalPayment) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">总利息</span>
            <span class="text-foreground font-medium">{{ fmtYuan(equalPrincipal.totalInterest) }} 元</span>
          </div>
        </div>

        <!-- 两法对比 -->
        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">{{ comparison.text }}</p>
          <p class="text-lg font-bold text-primary">利息差 {{ fmtYuan(comparison.gap) }} 元</p>
          <p class="text-xs text-primary mt-0.5">等额本金前期压力更大，等额本息总成本更高，按现金流选择</p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          等额本金：首月供 = 本金/n + 本金×月利率，此后每月递减 本金/n×月利率；总利息 = 本金×月利率×(n+1)÷2。前期还款多、适合当前收入较高或计划提前还款的人群。
        </p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：本工具按标准等额本息/等额本金公式估算，未包含手续费、GPS/抵押等附加费用与提前还款违约金；实际利率、还款计划以贷款合同与金融机构核算为准，结果仅供参考。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>车贷怎么算才不吃亏</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            车贷的真实成本由三个变量决定：贷款本金（车价×(1−首付比例)）、年利率与期数。月供公式本身不复杂，容易被忽略的是口径：厂商金融常宣传「0 息」「2 厘」，但可能伴随服务费、GPS 费、捆绑保险等隐性成本；银行车贷利率透明但审批更严。把利率、期数、附加费用都填进同一把尺子里量，才是可比的。
          </p>
          <h3 class="text-lg font-semibold text-foreground">等额本息 vs 等额本金怎么选</h3>
          <p>
            以贷款 10 万元、3 年、年利率 4% 为例：等额本息每月还约 2952.4 元，总利息约 6286 元；等额本金首月约 3111 元、末月约 2787 元，总利息约 6167 元，两者相差约 120 元。期限越长、金额越大，差距越明显。等额本金前期压力大但总成本略低，等额本息每月固定便于安排现金流——多数车贷默认等额本息。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">首付比例多少合适？</span>常见 30%~50%。首付越高、贷款越少、总利息越低；但也要留出购置税、保险与上牌费用，不必盲目压低月供。</li>
            <li><span class="text-foreground font-medium">月供占收入多少合适？</span>一般建议不超过月收入的三分之一，叠加养车费用（油/电、保险、停车）后整体用车支出最好控制在月收入 40% 以内。</li>
            <li><span class="text-foreground font-medium">年利率应该填多少？</span>按贷款合同或报价单上的名义年利率填写；若对方只给「月费率」，乘以 12 后再填，或使用分期实际利率计算器换算真实年化。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'car-loan-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Landmark, Car, CalendarClock, TrendingDown, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '车贷月供计算器 - 等额本息/等额本金对比与总利息',
  description: '在线车贷月供计算器，输入车价、首付比例、年利率与期数，同时计算等额本息与等额本金月供、首末月供、总利息与两法对比，含月供占收入安全线提示，纯本地计算',
  keywords: '车贷计算器, 车贷月供计算, 汽车贷款月供, 车贷利率, 买车贷款计算, 等额本息, 等额本金',
  author: 'Util工具箱',
  ogTitle: '车贷月供计算器 - 有条工具',
  ogDescription: '车贷月供一键计算，等额本息/等额本金对比，含首付比例与总利息明细',
  ogUrl: 'https://www.util.cn/tools/car-loan-calculator',
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
          name: '车贷月供计算器',
          url: 'https://www.util.cn/tools/car-loan-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['等额本息月供计算', '等额本金首末月供', '总利息两法对比', '首付比例自定义', '月供收入占比提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '车贷月供计算器', item: 'https://www.util.cn/tools/car-loan-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '等额本息和等额本金哪个划算？',
              acceptedAnswer: { '@type': 'Answer', text: '相同利率下等额本金总利息更少，但前期月供更高；等额本息月供固定、便于规划。贷款 10 万、3 年、年利率 4% 时两者总利息相差约 120 元。' }
            },
            {
              '@type': 'Question',
              name: '车贷月供占收入多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '一般建议月供不超过月收入的三分之一，加上养车费用后整体用车支出最好控制在月收入的 40% 以内。' }
            },
            {
              '@type': 'Question',
              name: '计算结果包含手续费等其他费用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不包含。工具按标准贷款公式只计算利息，服务费、GPS 费、抵押费与提前还款违约金等需另行考虑，实际以贷款合同为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'car-loan-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
// 默认 20 万车、首付 50% → 贷款 10 万，36 期、年利率 4%
const carPrice = ref(200000)
const downPaymentRate = ref(0.5)
const annualRate = ref(4)
const term = ref(36)
const monthlyIncome = ref(0)
const seoContentVisible = ref(true)

const downPaymentPresets = [0.3, 0.4, 0.5]
const ratePresets = [3, 4, 5]
const termOptions = [12, 24, 36, 48, 60]

const fmtYuan = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '—')
const fmtYuan2 = (v) => (isFinite(v) ? (Math.round(v * 100) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')

// ---------- 派生 ----------
const loanPrincipal = computed(() => Math.max(0, carPrice.value) * (1 - Math.min(0.95, Math.max(0, downPaymentRate.value))))
const monthlyRate = computed(() => Math.max(0, annualRate.value) / 100 / 12)
const nPeriods = computed(() => Math.max(1, term.value))
const downPayment = computed(() => Math.max(0, carPrice.value) * Math.min(0.95, Math.max(0, downPaymentRate.value)))

// 等额本息：月供 = P×r×(1+r)^n / ((1+r)^n − 1)
const annuity = computed(() => {
  const P = loanPrincipal.value
  const r = monthlyRate.value
  const n = nPeriods.value
  if (P <= 0) return { monthlyPay: 0, totalPayment: 0, totalInterest: 0, interestRatio: 0 }
  const factor = Math.pow(1 + r, n)
  const pay = r === 0 ? P / n : P * r * factor / (factor - 1)
  const total = pay * n
  return {
    monthlyPay: pay,
    totalPayment: total,
    totalInterest: total - P,
    interestRatio: (total - P) / P * 100
  }
})

// 等额本金：首月供 = P/n + P×r，每月递减 P/n×r
const equalPrincipal = computed(() => {
  const P = loanPrincipal.value
  const r = monthlyRate.value
  const n = nPeriods.value
  if (P <= 0) return { firstPay: 0, lastPay: 0, monthlyDecrease: 0, totalPayment: P, totalInterest: 0 }
  const monthlyPrincipal = P / n
  const firstPay = monthlyPrincipal + P * r
  const lastPay = monthlyPrincipal + monthlyPrincipal * r
  const decrease = monthlyPrincipal * r
  const totalInterest = P * r * (n + 1) / 2
  return {
    firstPay,
    lastPay,
    monthlyDecrease: decrease,
    totalPayment: P + totalInterest,
    totalInterest
  }
})

// 两法对比
const comparison = computed(() => {
  const gap = annuity.value.totalInterest - equalPrincipal.value.totalInterest
  return {
    gap: Math.abs(gap),
    text: gap > 0.5 ? '等额本金总利息更少' : gap < -0.5 ? '等额本息总利息更少' : '两种方式利息基本相同'
  }
})

// 月供压力提示
const paymentBurden = computed(() => {
  const income = Math.max(0, monthlyIncome.value)
  if (income <= 0) return { isHeavy: false, text: '' }
  const ratio = annuity.value.monthlyPay / income * 100
  if (annuity.value.monthlyPay >= income / 3) {
    return {
      isHeavy: true,
      text: `等额本息月供约占月收入的 ${ratio.toFixed(0)}%，超过 1/3 安全线，建议提高首付、延长或缩短期数平衡月供与总利息，或谨慎评估购车预算。`
    }
  }
  return {
    isHeavy: false,
    text: `等额本息月供约占月收入的 ${ratio.toFixed(0)}%，低于 1/3 的常规安全线，月供压力可控。`
  }
})
</script>
