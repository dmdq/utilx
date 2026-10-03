<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Landmark class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">提前还款计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">对比「缩短年限」与「减少月供」两种还款方式，算清能省多少利息</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入贷款金额、利率、期限与提前还款计划，精确计算等额本息/等额本金两种还款方式下，提前还款后的剩余利息、节省金额、新月供或新期限。全部计算在浏览器本地完成，银行实际结算可能存在尾差。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 贷款信息
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">还款方式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="t in repaymentTypes"
                :key="t.value"
                @click="repayType = t.value"
                :class="repayType === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ t.label }}</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">贷款总额（万元）</label>
              <input v-model.number="loanWan" type="number" min="1" step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">年利率（%）</label>
              <input v-model.number="ratePct" type="number" min="0.1" step="0.01"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">贷款期限：<span class="text-primary">{{ loanYears }} 年</span></label>
            <input v-model.number="loanYears" type="range" min="1" max="30" class="w-full accent-primary" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">已还期数</label>
              <input v-model.number="paidMonths" type="number" min="0" :max="loanYears * 12 - 1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">提前还款（万元）</label>
              <input v-model.number="prepayWan" type="number" min="0" step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div v-if="prepayValid">
            <label class="block text-sm font-medium text-foreground mb-2">还款后选择</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="prepayMode = 'shorten'"
                :class="prepayMode === 'shorten' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >缩短年限</button>
              <button
                @click="prepayMode = 'reduce'"
                :class="prepayMode === 'reduce' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >减少月供</button>
            </div>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              {{ prepayMode === 'shorten'
                ? '保持月供不变，尽快结清贷款——总利息节省最多，但后续每月压力不变。'
                : '保持剩余期限不变，降低月供——减轻现金流压力，利息节省相对少。' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 核心对比 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 利息对比
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">不提前还款总利息</p>
              <p class="text-xl font-bold text-foreground">{{ fmtWan(plan.totalInterest) }} 万</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">提前还款后总利息</p>
              <p class="text-xl font-bold text-foreground">{{ plan.prepay ? fmtWan(plan.prepay.totalInterest) + ' 万' : '—' }}</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">节省利息</p>
              <p class="text-xl font-bold text-primary">{{ plan.saving !== null ? fmtWan(plan.saving) + ' 万' : '—' }}</p>
            </div>
          </div>

          <div v-if="plan.prepay" class="space-y-2.5 text-sm">
            <div class="flex justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">当前月供{{ repayType === 'principal' ? '本金部分' : '' }}</span>
              <span class="text-foreground font-medium">{{ fmtYuan(plan.currentPayment) }} 元</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">剩余本金（第 {{ paidMonths + 1 }} 期时）</span>
              <span class="text-foreground font-medium">{{ fmtWan(plan.remainingPrincipal) }} 万元</span>
            </div>
            <template v-if="prepayMode === 'shorten'">
              <div class="flex justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">月供保持</span>
                <span class="text-foreground font-medium">{{ fmtYuan(plan.prepay.newPayment) }} 元</span>
              </div>
              <div class="flex justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">剩余期限 {{ remainingMonths }} 期 →</span>
                <span class="text-foreground font-medium">{{ plan.prepay.newMonths }} 期（约 {{ (plan.prepay.newMonths / 12).toFixed(1) }} 年）</span>
              </div>
            </template>
            <template v-else>
              <div class="flex justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">新月供</span>
                <span class="text-foreground font-medium text-primary">{{ fmtYuan(plan.prepay.newPayment) }} 元（省 {{ fmtYuan(plan.currentPayment - plan.prepay.newPayment) }} 元/月）</span>
              </div>
              <div class="flex justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">剩余期限保持</span>
                <span class="text-foreground font-medium">{{ remainingMonths }} 期</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 提示 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 提前还款注意事项
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 多数银行要求还款满 1 年才可提前还款，部分收取违约金（通常为还款额的 1% 或数月利息），需提前确认</li>
            <li>• 利率高位（如 >4%）时优先提前还款；若有理财收益能稳定跑赢贷款利率，则不必急于还款</li>
            <li>• 等额本息前期还的大多是利息，贷款初期提前还款更划算；已还超过 1/2 期限时节省效果明显下降</li>
            <li>• 公积金贷款利率低，优先偿还商贷部分</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于提前还款</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>提前还款指在贷款期限内一次性偿还部分或全部本金。核心决策是选择「缩短年限」还是「减少月供」：两者节省的利息差距可能达到数万元——缩短年限保持月供不变，本金下降更快，利息节省最多；减少月供则优先改善现金流。</p>
          <h3 class="text-lg font-semibold text-foreground">什么时机提前还款最划算</h3>
          <p>等额本息的月供中利息占比随时间递减：前 1/3 期限大约偿还了总利息的一半以上。因此在贷款前半段提前还款的资金效率最高；进入后半段后，大部分利息已支付完毕，提前还款的节省效果大幅缩水，此时把资金用于稳健理财可能更合理。</p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">计算结果和银行不一样？</span>银行按实际计息日、 leap 年天数和合同细节计算，可能存在几元到几十元尾差；本工具按标准等额本息/等额本金公式计算。</li>
            <li><span class="text-foreground font-medium">部分提前还款有最低金额要求吗？</span>通常为 1 万元起或月供的整数倍，各行政策不同。</li>
            <li><span class="text-foreground font-medium">LPR 调整会影响结果吗？</span>会。重定价日之后利率变化，建议按最新执行利率计算。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'prepayment-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Landmark, Settings2, BarChart3, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '提前还款计算器 - 房贷提前还款式节省利息对比',
  description: '在线计算房贷提前还款，对比缩短年限与减少月供两种方式的节省利息，支持等额本息与等额本金，精确到每月还款计划',
  keywords: '提前还款计算器, 房贷提前还款, 缩短年限, 减少月供, 等额本息, 等额本金, 提前还贷划算吗',
  author: 'Util工具箱',
  ogTitle: '提前还款计算器 - 有条工具',
  ogDescription: '对比缩短年限与减少月供两种提前还款方式，算清能省多少利息',
  ogUrl: 'https://www.util.cn/tools/prepayment-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '提前还款计算器', url: 'https://www.util.cn/tools/prepayment-calculator', applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['缩短年限/减少月供对比', '等额本息/等额本金', '节省利息精确计算'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
          { '@type': 'ListItem', position: 3, name: '提前还款计算器', item: 'https://www.util.cn/tools/prepayment-calculator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'prepayment-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const repaymentTypes = [
  { value: 'annuity', label: '等额本息' },
  { value: 'principal', label: '等额本金' }
]

const repayType = ref('annuity')
const loanWan = ref(100)
const ratePct = ref(3.6)
const loanYears = ref(30)
const paidMonths = ref(24)
const prepayWan = ref(20)
const prepayMode = ref('shorten')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const totalMonths = computed(() => Math.round(loanYears.value * 12))
const remainingMonths = computed(() => Math.max(1, totalMonths.value - paidMonths.value))
const prepayValid = computed(() => prepayWan.value > 0 && paidMonths.value > 0 && paidMonths.value < totalMonths.value)

const fmtWan = (v) => (v == null ? '—' : (Math.round(v / 1000) / 10).toLocaleString('zh-CN'))
const fmtYuan = (v) => (v == null ? '—' : Math.round(v).toLocaleString('zh-CN'))

// ---------- 计算引擎 ----------
// 等额本息月供
const annuityPayment = (principal, r, n) => {
  if (r === 0) return principal / n
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}
// 等额本息：k 期后剩余本金
const annuityRemain = (principal, r, n, k) => {
  return principal * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1)
}

const plan = computed(() => {
  const L = Math.max(0, loanWan.value) * 10000
  const r = Math.max(0, ratePct.value) / 100 / 12
  const n = totalMonths.value
  const k = Math.min(Math.max(0, paidMonths.value), n - 1)
  const prepay = prepayValid.value ? Math.max(0, prepayWan.value) * 10000 : 0
  if (L <= 0 || n <= 0) return { totalInterest: 0, prepay: null, saving: null }

  let totalInterest, currentPayment, remainingPrincipal

  if (repayType.value === 'annuity') {
    const pay = annuityPayment(L, r, n)
    currentPayment = pay
    totalInterest = pay * n - L
    remainingPrincipal = annuityRemain(L, r, n, k)

    if (prepay > 0) {
      const newPrincipal = remainingPrincipal - prepay
      if (newPrincipal <= 0) {
        // 一次性结清：未来只剩本期利息
        const paidInterest = pay * k - (L - remainingPrincipal)
        const futureInterest = remainingPrincipal * r
        const newTotalInterest = paidInterest + futureInterest
        return {
          totalInterest,
          currentPayment: pay,
          remainingPrincipal,
          prepay: { totalInterest: newTotalInterest, newPayment: 0, newMonths: 0 },
          saving: totalInterest - newTotalInterest
        }
      }
      if (prepayMode.value === 'shorten') {
        // 月供不变，求新期限
        let newMonths = Math.ceil(-Math.log(1 - newPrincipal * r / pay) / Math.log(1 + r))
        if (!isFinite(newMonths) || newMonths < 1) newMonths = 1
        if (newMonths > remainingMonths.value) newMonths = remainingMonths.value
        // 按实际期数重算尾期月供
        const exactPay = newPrincipal * r * Math.pow(1 + r, newMonths) / (Math.pow(1 + r, newMonths) - 1)
        const interest = exactPay * (newMonths - 1) + newPrincipal * (1 + r) - newPrincipal
        const newTotalInterest = (pay * k - (L - remainingPrincipal) + interest) // 已还利息 + 未来利息
        return {
          totalInterest,
          currentPayment: pay,
          remainingPrincipal,
          prepay: { totalInterest: newTotalInterest, newPayment: exactPay, newMonths },
          saving: totalInterest - newTotalInterest
        }
      } else {
        // 期限不变，减月供
        const newPay = annuityPayment(newPrincipal, r, remainingMonths.value)
        const newTotalInterest = pay * k - (L - remainingPrincipal) + newPay * remainingMonths.value - newPrincipal
        return {
          totalInterest,
          currentPayment: pay,
          remainingPrincipal,
          prepay: { totalInterest: newTotalInterest, newPayment: newPay, newMonths: remainingMonths.value },
          saving: totalInterest - newTotalInterest
        }
      }
    }
  } else {
    // 等额本金：每期固定还本金 L/n，利息=剩余本金×r
    const monthlyPrincipal = L / n
    const interestOf = (k) => (L - monthlyPrincipal * k) * r
    totalInterest = 0
    for (let i = 0; i < n; i++) totalInterest += (L - monthlyPrincipal * i) * r
    currentPayment = monthlyPrincipal + interestOf(k)
    remainingPrincipal = L - monthlyPrincipal * k

    if (prepay > 0) {
      const newPrincipal = remainingPrincipal - prepay
      if (newPrincipal <= 0) {
        return { totalInterest, currentPayment, remainingPrincipal, prepay: { totalInterest: interestOf(k), newPayment: 0, newMonths: 0 }, saving: totalInterest - interestOf(k) }
      }
      const m = remainingMonths.value
      let newMonthlyPrincipal, newMonths
      if (prepayMode.value === 'shorten') {
        newMonthlyPrincipal = newPrincipal / m
        newMonths = m
      } else {
        newMonthlyPrincipal = monthlyPrincipal
        newMonths = Math.ceil(newPrincipal / monthlyPrincipal)
      }
      let futureInterest = 0
      for (let i = 0; i < newMonths; i++) {
        futureInterest += (newPrincipal - newMonthlyPrincipal * i) * r
      }
      const firstPay = newMonthlyPrincipal + newPrincipal * r
      const newTotalInterest = interestOf(k) + futureInterest
      return {
        totalInterest,
        currentPayment,
        remainingPrincipal,
        prepay: { totalInterest: newTotalInterest, newPayment: firstPay, newMonths },
        saving: totalInterest - newTotalInterest
      }
    }
  }

  return { totalInterest, currentPayment, remainingPrincipal, prepay: null, saving: null }
})
</script>
