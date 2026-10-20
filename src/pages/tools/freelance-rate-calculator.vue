<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Briefcase class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">自由职业报价换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">时薪/日薪/月薪互算，叠加社保自缴与空窗期成本系数，接单报价不亏</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        从期望年收入（或目标月薪）出发，扣除沟通行政占用的实际可计费工时、休假占用的年工作周数，再乘以社保自缴与无薪空窗的隐性成本系数，得到不亏本的时薪/日薪/周薪/月薪报价参考；也可反向输入客户项目预算，折算需要完成多少计费小时或天数。全部计算在浏览器本地完成，收入数据不出本机。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 我的目标
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">收入目标</label>
          <div class="grid grid-cols-2 gap-1.5 mb-2">
            <button
              @click="incomeMode = 'year'"
              :class="incomeMode === 'year' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >期望年收入</button>
            <button
              @click="incomeMode = 'month'"
              :class="incomeMode === 'month' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >目标月薪 × 12</button>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <input
              v-if="incomeMode === 'year'"
              v-model.number="targetAnnual"
              type="number"
              min="0"
              step="10000"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 300000"
            />
            <input
              v-else
              v-model.number="targetMonthly"
              type="number"
              min="0"
              step="1000"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 25000"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">每周实际可计费工时（h）</label>
            <input
              v-model.number="billableHours"
              type="number"
              min="1"
              max="80"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">扣掉沟通、行政、摸鱼，默认 30</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年工作周数（周）</label>
            <input
              v-model.number="workWeeks"
              type="number"
              min="1"
              max="52"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">扣休假与空档，默认 46</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            隐性成本系数：<span class="text-primary">{{ costFactor.toFixed(2) }}</span>
          </label>
          <input v-model.number="costFactor" type="range" min="1" max="2" step="0.05" class="w-full accent-primary" />
          <div class="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1.00 纯收入目标</span>
            <span>1.40 社保自缴+空窗（默认）</span>
            <span>2.00 高强度覆盖</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">覆盖社保/公积金自缴、无固定薪假期、接单空窗、设备与税费等隐性成本</p>
        </div>

        <div class="border-t border-border pt-4">
          <label class="block text-sm font-medium text-foreground mb-2">反向：客户项目预算（元）</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <input
              v-model.number="projectBudget"
              type="number"
              min="0"
              step="5000"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 50000"
            />
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ReceiptText class="w-5 h-5 mr-2 text-primary" /> 报价参考
        </h2>

        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">建议报价时薪（含成本系数）</p>
          <p class="text-3xl font-bold text-primary">¥{{ hourlyRate.toFixed(0) }}<span class="text-sm font-medium text-muted-foreground"> /小时</span></p>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">日薪（8h）</p>
            <p class="text-sm font-bold text-foreground">¥{{ fmt(dailyRate) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">周薪</p>
            <p class="text-sm font-bold text-foreground">¥{{ fmt(weeklyRate) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">月薪</p>
            <p class="text-sm font-bold text-foreground">¥{{ fmt(monthlyRate) }}</p>
          </div>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p class="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400" /> 亏损红线
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            不含成本系数的保本时薪约 <span class="font-semibold text-foreground">¥{{ breakEvenHourly.toFixed(0) }}/小时</span>——
            报价低于它就意味着社保自缴、空窗与休假成本在倒贴，等于「白干补贴客户」；对外报价请以 ¥{{ hourlyRate.toFixed(0) }}/小时 为底线。
          </p>
        </div>

        <div v-if="projectBudget > 0" class="bg-muted/50 rounded-lg p-4">
          <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
            <Coins class="w-4 h-4 text-primary" /> 反向折算：预算 ¥{{ fmt(projectBudget) }} 的项目
          </h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex justify-between py-1 pr-3 border-r border-border/50">
              <span class="text-muted-foreground">需完成计费小时</span>
              <span class="font-semibold text-foreground">{{ neededHours.toFixed(1) }} h</span>
            </div>
            <div class="flex justify-between py-1 pl-3">
              <span class="text-muted-foreground">约等于工作天数</span>
              <span class="font-semibold text-foreground">{{ neededDays.toFixed(1) }} 天</span>
            </div>
            <div class="flex justify-between py-1 pr-3 border-r border-border/50">
              <span class="text-muted-foreground">约等于自然周</span>
              <span class="font-semibold text-foreground">{{ (neededHours / Math.max(1, billableHours)).toFixed(1) }} 周</span>
            </div>
            <div class="flex justify-between py-1 pl-3">
              <span class="text-muted-foreground">按红线时薪最多可做</span>
              <span class="font-semibold text-foreground">{{ neededHoursBreakEven.toFixed(1) }} h</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-2">超出建议排期太多时，优先谈加钱或砍范围，而不是压低时薪硬接。</p>
        </div>

        <div class="p-4 bg-muted/50 rounded-lg border border-border">
          <h3 class="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
            <Lightbulb class="w-4 h-4" /> 常见报价区间（文案参考，非硬数据）
          </h3>
          <ul class="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <li>• 初级（1-3 年）：约 ¥100-200/小时，跑通交付流程为主</li>
            <li>• 中级（3-8 年）：约 ¥200-500/小时，独立负责模块与设计</li>
            <li>• 高级/专家（8 年+）：约 ¥500-1500+/小时，卖的是判断力与稀缺性</li>
            <li>• 上述因城市、行业与个人作品差异极大，仅供心理锚定，以本工具算出的个人底线为准</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：社保自缴比例、灵活就业参保口径与个体经营税费政策各地不同且按公开规定可能调整，隐性成本系数为经验默认值可自定义，报价区间文案仅供参考，以最新官方政策与市场行情为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>自由职业怎么报价</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            很多从公司出来接单的人犯的最大错误，是拿「离职前月薪」直接当时薪换算：上班时的月薪隐含了公司缴纳的社保公积金、带薪年假、免费工具与稳定排期。自由职业这些全部要自己买回来，所以报价必须乘一个隐性成本系数，常见的合理起点是 1.3-1.6。
          </p>
          <h3 class="text-lg font-semibold text-foreground">核心公式</h3>
          <p>
            时薪 = 期望年收入 × 隐性成本系数 ÷（每周实际可计费工时 × 年工作周数）。例如期望年入 30 万、系数 1.4、每周可计费 30 小时、年工作 46 周：300000 × 1.4 ÷ 1380 ≈ 304 元/小时。日薪按 8 小时计，月薪按年收入的 1/12 计。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么可计费工时不是 40 小时</h3>
          <p>
            上班时你觉得一周工作 40 小时，但真正能向客户交付的「计费时间」通常只有 60%-75%：需求沟通、返工、开票、找下一单的空档都不计费。自由职业者按 30 小时/周、46 周/年估算是常见的保守口径；把 40 小时、52 周当分母算出的时薪，等于给自己打了六折。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <div class="space-y-3">
            <div>
              <h4 class="font-semibold text-foreground">Q1：客户只给项目总预算，怎么判断接不接？</h4>
              <p class="mt-1">用反向折算：预算 ÷ 你的建议时薪 = 必须完成的小时数，再除以每周可计费工时得到周数。排期超过 12 周的项目回款风险高，建议要求 30%-50% 预付款或分期结算。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q2：成本系数 1.4 是怎么来的？</h4>
              <p class="mt-1">近似覆盖三块：社保公积金从公司代缴变自缴（约工资的 25%-35%）、无薪休假与接单空窗（约 8%-15%）、设备软件与税费（视收入结构）。不同城市与收入段差异大，可用 1.2-1.8 之间试算。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q3：报价比市场价高，客户嫌贵怎么办？</h4>
              <p class="mt-1">优先砍范围而不是砍时薪：把「全包」拆成 MVP 版本让总价下来，守住每小时的单价底线；否则等于用爱发电，接单越多亏越多。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'freelance-rate-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Briefcase, Calculator, ReceiptText, Coins, Lightbulb, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '自由职业报价换算器 - 时薪日薪项目价互算不亏本',
  description: '在线自由职业报价换算器，从期望年收入或目标月薪出发，扣沟通行政与休假空窗，叠加社保自缴等隐性成本系数，算出不亏的时薪/日薪/月薪，支持客户预算反向折算工时天数，纯本地计算',
  keywords: '接单怎么报价, 时薪换算日薪, 自由职业定价, 外包报价计算, 接私活收费, 自由职业时薪',
  author: 'Util工具箱',
  ogTitle: '自由职业报价换算器 - 有条工具',
  ogDescription: '时薪日薪项目价互算，叠加社保自缴与空窗期成本系数，接单报价不亏',
  ogUrl: 'https://www.util.cn/tools/freelance-rate-calculator',
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
          name: '自由职业报价换算器',
          url: 'https://www.util.cn/tools/freelance-rate-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['年收入/月薪双向输入', '隐性成本系数可调', '时薪日薪周薪月薪参考表', '亏损红线提示', '项目预算反向折算工时']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '自由职业报价换算器', item: 'https://www.util.cn/tools/freelance-rate-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '自由职业报价的核心公式是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '时薪=期望年收入×隐性成本系数÷（每周实际可计费工时×年工作周数）。例如年入30万、系数1.4、30小时/周×46周=1380小时，时薪约304元。' }
            },
            {
              '@type': 'Question',
              name: '成本系数1.4是怎么来的？',
              acceptedAnswer: { '@type': 'Answer', text: '近似覆盖社保公积金自缴、无薪休假与接单空窗、设备软件与税费三块隐性成本，不同城市与收入段可在1.2-1.8间调整。' }
            },
            {
              '@type': 'Question',
              name: '客户给项目总预算怎么判断接不接？',
              acceptedAnswer: { '@type': 'Answer', text: '用预算除以建议时薪得到必须完成的计费小时数，再折算成工作周数；排期过长或折算后时薪低于保本红线的项目，建议谈加钱、砍范围或要求预付款。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'freelance-rate-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const incomeMode = ref('year') // year | month
const targetAnnual = ref(300000)
const targetMonthly = ref(25000)
const billableHours = ref(30)
const workWeeks = ref(46)
const costFactor = ref(1.4)
const projectBudget = ref(50000)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmt = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '0')

// ---------- 计算 ----------
const annualTarget = computed(() => {
  if (incomeMode.value === 'month') {
    return Math.max(0, Number(targetMonthly.value) || 0) * 12
  }
  return Math.max(0, Number(targetAnnual.value) || 0)
})

const billableYearHours = computed(() => {
  const h = Math.max(1, Number(billableHours.value) || 0)
  const w = Math.max(1, Number(workWeeks.value) || 0)
  return h * w
})

const costFactorSafe = computed(() => Math.max(1, Math.min(3, Number(costFactor.value) || 1)))

const hourlyRate = computed(() => annualTarget.value * costFactorSafe.value / billableYearHours.value)
const breakEvenHourly = computed(() => annualTarget.value / billableYearHours.value)
const dailyRate = computed(() => hourlyRate.value * 8)
const weeklyRate = computed(() => hourlyRate.value * Math.max(1, Number(billableHours.value) || 30))
const monthlyRate = computed(() => annualTarget.value * costFactorSafe.value / 12)

// 反向：项目预算 → 需完成小时/天数
const neededHours = computed(() => {
  const b = Math.max(0, Number(projectBudget.value) || 0)
  if (hourlyRate.value <= 0) return 0
  return b / hourlyRate.value
})
const neededHoursBreakEven = computed(() => {
  const b = Math.max(0, Number(projectBudget.value) || 0)
  if (breakEvenHourly.value <= 0) return 0
  return b / breakEvenHourly.value
})
const neededDays = computed(() => neededHours.value / 8)
</script>
