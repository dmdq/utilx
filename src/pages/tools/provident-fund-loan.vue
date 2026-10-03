<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Landmark class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">公积金贷款计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">额度试算、公积金/商贷月供对比与组合贷自动分配</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三个模块一站式算清公积金贷款：① 按账户余额倍数与还款能力试算可贷额度（三项取最低）；② 对比公积金与商业贷款的等额本息月供及总利息；③ 输入贷款总额自动分配公积金与商贷部分，算出组合贷相比纯商贷的节省额。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 模块①：额度试算 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 额度试算
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">账户余额（万元）</label>
          <input
            v-model.number="balanceWan"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            余额倍数：<span class="text-primary">{{ multiple }} 倍</span>
          </label>
          <input v-model.number="multiple" type="range" min="10" max="20" class="w-full accent-primary" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">月缴存额（元）</label>
            <input
              v-model.number="monthlyDeposit"
              type="number"
              min="0"
              step="10"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">缴存比例（%）</label>
            <input
              v-model.number="depositRate"
              type="number"
              min="1"
              max="24"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">现有月供（元）</label>
            <input
              v-model.number="existingPayment"
              type="number"
              min="0"
              step="100"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">贷款年限（年）</label>
            <input
              v-model.number="loanYearsQ"
              type="number"
              min="1"
              max="30"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">最高限额类型</label>
          <div class="grid grid-cols-2 gap-1.5 mb-2">
            <button
              @click="setQuotaType('family')"
              :class="quotaType === 'family' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >家庭（默认 120 万）</button>
            <button
              @click="setQuotaType('person')"
              :class="quotaType === 'person' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >个人（默认 60 万）</button>
          </div>
          <input
            v-model.number="maxQuotaWan"
            type="number"
            min="0"
            step="5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">最高限额（万元），可按当地政策编辑</p>
        </div>

        <!-- 试算结果 -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">余额×倍数</p>
            <p class="text-xs font-bold text-foreground">{{ fmtYuan(quotaA) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">还款能力</p>
            <p class="text-xs font-bold text-foreground">{{ fmtYuan(quotaB) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">最高限额</p>
            <p class="text-xs font-bold text-foreground">{{ fmtYuan(quotaC) }}</p>
          </div>
        </div>
        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">可贷额度（三项取最低）</p>
          <p class="text-xl font-bold text-primary">{{ fmtYuan(finalQuota) }} 元</p>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          还款能力测算 =（月缴存额 ÷ 缴存比例 × 0.45 − 现有月供）× 12 × 贷款年限；月缴存额按个人与单位合计填写。
        </p>
      </div>

      <!-- 模块②：月供对比 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Settings2 class="w-5 h-5 mr-2 text-primary" /> 月供对比
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">贷款金额（万元）</label>
            <input
              v-model.number="loanWan2"
              type="number"
              min="1"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">贷款年限（年）</label>
            <input
              v-model.number="years2"
              type="number"
              min="1"
              max="30"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">公积金利率（%）</label>
            <input
              v-model.number="gjjRate"
              type="number"
              min="0.1"
              step="0.01"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">首套 5 年以上 2.85%，可改</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">商贷利率（%）</label>
            <input
              v-model.number="syRate"
              type="number"
              min="0.1"
              step="0.01"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">默认 3.6%，可改</p>
          </div>
        </div>

        <!-- 对比表 -->
        <div class="text-sm">
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">公积金月供（等额本息）</span>
            <span class="text-foreground font-medium">{{ fmtYuan(gjjPlan.pay) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">公积金总利息</span>
            <span class="text-foreground font-medium">{{ fmtYuan(gjjPlan.totalInterest) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">商贷月供（等额本息）</span>
            <span class="text-foreground font-medium">{{ fmtYuan(syPlan.pay) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">商贷总利息</span>
            <span class="text-foreground font-medium">{{ fmtYuan(syPlan.totalInterest) }} 元</span>
          </div>
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">选择公积金贷款可节省</p>
          <p class="text-lg font-bold text-primary">每月 {{ fmtYuan(syPlan.pay - gjjPlan.pay) }} 元</p>
          <p class="text-sm text-primary mt-0.5">总利息少 {{ fmtYuan(syPlan.totalInterest - gjjPlan.totalInterest) }} 元</p>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          按等额本息公式计算：月供 = 本金 × 月利率 × (1+月利率)^n ÷ [(1+月利率)^n − 1]。
        </p>
      </div>

      <!-- 模块③：组合贷 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <List class="w-5 h-5 mr-2 text-primary" /> 组合贷分配
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">贷款总额（万元）</label>
          <input
            v-model.number="totalWan"
            type="number"
            min="1"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">公积金额度（万元）</label>
            <button
              @click="quota3 = Number(finalQuotaWan.toFixed(1))"
              class="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              使用①试算结果
            </button>
          </div>
          <input
            v-model.number="quota3"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">贷款年限（年）</label>
          <input
            v-model.number="years3"
            type="number"
            min="1"
            max="30"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- 自动分配结果 -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">公积金部分（用满额度）</p>
            <p class="text-sm font-bold text-primary">{{ fmtWan(gjjPartWan) }} 万</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">商贷部分（剩余）</p>
            <p class="text-sm font-bold text-foreground">{{ fmtWan(syPartWan) }} 万</p>
          </div>
        </div>

        <div class="text-sm">
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">组合贷月供</span>
            <span class="text-foreground font-medium">{{ fmtYuan(combo.combinedPay) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">其中：公积金月供 + 商贷月供</span>
            <span class="text-muted-foreground text-xs">{{ fmtYuan(combo.gjjPay) }} + {{ fmtYuan(combo.syPay) }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">纯商贷月供</span>
            <span class="text-foreground font-medium">{{ fmtYuan(combo.purePay) }} 元</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground">总利息对比</span>
            <span class="text-foreground font-medium text-xs">
              组合 {{ fmtYuan(combo.combinedInterest) }} / 纯商贷 {{ fmtYuan(combo.pureInterest) }}
            </span>
          </div>
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">组合贷相比纯商贷节省</p>
          <p class="text-lg font-bold text-primary">每月 {{ fmtYuan(combo.monthlySaving) }} 元</p>
          <p class="text-sm text-primary mt-0.5">总利息少 {{ fmtYuan(combo.totalSaving) }} 元</p>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：各城市公积金中心的额度公式、余额倍数、缴存比例认定、最高限额与执行利率差异较大且可能随时调整，本工具按常见规则与默认参数估算，结果仅供参考，一切以当地公积金中心与贷款银行审批为准。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于公积金贷款</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            住房公积金贷款利率显著低于商业贷款，是购房融资的首选。可贷额度通常受三重约束：账户余额的若干倍数、还款能力测算（月缴存额与月供的比例关系）以及当地最高限额，三者取最低值；额度不够覆盖房款时，可以用「组合贷」把公积金用满、差额走商贷，兼顾低成本与充足额度。
          </p>
          <h3 class="text-lg font-semibold text-foreground">组合贷为什么划算</h3>
          <p>
            以贷款 150 万、30 年、公积金 2.85%、商贷 3.6% 为例：公积金每承担 10 万元，比商贷每月少还约 40 元，30 年总利息少约 1.5 万元。组合贷把额度内尽量多的本金放进低利率区间，节省额随公积金占比线性增加——这正是模块③「公积金用满额度、剩余走商贷」分配策略的原理。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么我的额度试算和公积金中心不同？</span>各地公式不同：有的城市按余额倍数、有的按缴存基数或连续缴存时间，还可能叠加账户状态与征信条件，请以当地政策为准。</li>
            <li><span class="text-foreground font-medium">利率应该填多少？</span>默认为首套 5 年以上公积金利率 2.85% 与商贷参考利率 3.6%，二套房、多子女家庭或 LPR 调整后利率不同，请按实际执行利率修改。</li>
            <li><span class="text-foreground font-medium">月供是什么还款方式？</span>按等额本息计算（每月还款额固定）；等额本金首月更高、总利息更少，可用提前还款计算器另行测算。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'provident-fund-loan'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Landmark, Calculator, Settings2, List, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '公积金贷款计算器 - 额度试算/月供对比/组合贷分配',
  description: '在线公积金贷款计算器，按账户余额倍数与还款能力试算可贷额度（三项取最低），对比公积金与商贷等额本息月供及总利息，组合贷自动分配公积金与商贷并计算节省额，纯本地计算',
  keywords: '公积金贷款计算器, 公积金额度试算, 公积金月供, 组合贷计算, 商贷对比, 公积金贷款利率, 贷款额度测算',
  author: 'Util工具箱',
  ogTitle: '公积金贷款计算器 - 有条工具',
  ogDescription: '额度试算、公积金/商贷月供对比与组合贷自动分配',
  ogUrl: 'https://www.util.cn/tools/provident-fund-loan',
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
          name: '公积金贷款计算器',
          url: 'https://www.util.cn/tools/provident-fund-loan',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['额度三项取低试算', '公积金/商贷月供对比', '组合贷自动分配', '节省利息测算', '利率可自定义']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '公积金贷款计算器', item: 'https://www.util.cn/tools/provident-fund-loan/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '公积金可贷额度是怎么算的？',
              acceptedAnswer: { '@type': 'Answer', text: '按账户余额×倍数、还款能力测算与当地最高限额三项分别计算后取最低值，各地公式与倍数有差异。' }
            },
            {
              '@type': 'Question',
              name: '组合贷是怎么分配的？',
              acceptedAnswer: { '@type': 'Answer', text: '公积金部分用满可贷额度，超出部分走商业贷款，两部分分别按对应利率计算月供后相加。' }
            },
            {
              '@type': 'Question',
              name: '计算结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按标准等额本息公式与默认政策参数估算，各地政策不同且可能调整，结果仅供参考，以当地公积金中心审批为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'provident-fund-loan')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
// 模块①：额度试算
const balanceWan = ref(5)
const multiple = ref(15)
const monthlyDeposit = ref(2000)
const depositRate = ref(12)
const existingPayment = ref(0)
const loanYearsQ = ref(30)
const quotaType = ref('family')
const maxQuotaWan = ref(120)

// 模块②：月供对比（③共用利率）
const loanWan2 = ref(100)
const years2 = ref(30)
const gjjRate = ref(2.85)
const syRate = ref(3.6)

// 模块③：组合贷
const totalWan = ref(150)
const quota3 = ref(120)
const years3 = ref(30)

const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const setQuotaType = (t) => {
  quotaType.value = t
  maxQuotaWan.value = t === 'family' ? 120 : 60
}

const fmtYuan = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '—')
const fmtWan = (v) => (isFinite(v) ? (Math.round(v * 10) / 10).toLocaleString('zh-CN') : '—')

// ---------- 等额本息月供（参照 prepayment-calculator） ----------
const annuityPayment = (principal, r, n) => {
  if (r === 0) return principal / n
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

// ---------- 模块①：额度试算 ----------
const quotaA = computed(() => Math.max(0, balanceWan.value) * 10000 * multiple.value)

const quotaB = computed(() => {
  const rate = Math.max(0.01, depositRate.value) / 100
  const capacity = monthlyDeposit.value / rate * 0.45 - Math.max(0, existingPayment.value)
  return Math.max(0, capacity) * 12 * Math.max(1, loanYearsQ.value)
})

const quotaC = computed(() => Math.max(0, maxQuotaWan.value) * 10000)
const finalQuota = computed(() => Math.min(quotaA.value, quotaB.value, quotaC.value))
const finalQuotaWan = computed(() => finalQuota.value / 10000)

// ---------- 模块②：月供对比 ----------
const gjjPlan = computed(() => {
  const L = Math.max(0, loanWan2.value) * 10000
  const r = Math.max(0, gjjRate.value) / 100 / 12
  const n = Math.max(1, Math.round(years2.value * 12))
  const pay = annuityPayment(L, r, n)
  return { pay, totalInterest: pay * n - L }
})

const syPlan = computed(() => {
  const L = Math.max(0, loanWan2.value) * 10000
  const r = Math.max(0, syRate.value) / 100 / 12
  const n = Math.max(1, Math.round(years2.value * 12))
  const pay = annuityPayment(L, r, n)
  return { pay, totalInterest: pay * n - L }
})

// ---------- 模块③：组合贷自动分配 ----------
const gjjPartWan = computed(() => Math.min(Math.max(0, quota3.value), Math.max(0, totalWan.value)))
const syPartWan = computed(() => Math.max(0, Math.max(0, totalWan.value) - gjjPartWan.value))

const combo = computed(() => {
  const gjj = gjjPartWan.value * 10000
  const sy = syPartWan.value * 10000
  const rg = Math.max(0, gjjRate.value) / 100 / 12
  const rs = Math.max(0, syRate.value) / 100 / 12
  const n = Math.max(1, Math.round(years3.value * 12))

  const gjjPay = annuityPayment(gjj, rg, n)
  const syPay = annuityPayment(sy, rs, n)
  const combinedPay = gjjPay + syPay
  const combinedInterest = gjjPay * n - gjj + syPay * n - sy

  const purePay = annuityPayment(gjj + sy, rs, n)
  const pureInterest = purePay * n - (gjj + sy)

  return {
    gjjPay, syPay, combinedPay, combinedInterest,
    purePay, pureInterest,
    monthlySaving: purePay - combinedPay,
    totalSaving: pureInterest - combinedInterest
  }
})
</script>
