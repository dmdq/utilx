<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <GitCompare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Offer 多维对比器</h1>
          <p class="text-sm text-muted-foreground mt-1">base / 奖金 / 签字费 / 股票逐年折算，比税后总包更比时薪</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填入两个 Offer 的月薪、年终奖月数、签字费、股票总包、年福利与周工时，工具自动把总包逐年折算
        （第 1 年含签字费，股票按 4 年 vesting 年均摊），并按简化年度个税口径估算第 1-4 年税后收入、平摊月收入与时薪，
        帮你看清"高 base 低奖金"与"低 base 高奖金"哪个更划算。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        税后为<strong>简化口径</strong>：按年度综合所得税率表（3%-45% 速算）、减除 6 万元费用、社保公积金按年总包 10.5% 简化估算，
        未考虑专项附加扣除、年终奖单独计税与股票行权税务细节，按公开税收政策整理，以官方最新政策与实际发薪为准。
      </p>
    </div>

    <!-- 两个 Offer 卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div v-for="(o, idx) in offers" :key="idx" class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Briefcase class="w-5 h-5 mr-2 text-primary" /> Offer {{ idx + 1 }}
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">月薪 base（元）</label>
            <input
              v-model.number="o.base"
              type="number"
              min="0"
              step="500"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年终奖（月数）</label>
            <input
              v-model.number="o.bonusMonths"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">签字费（元，首年一次性）</label>
            <input
              v-model.number="o.signBonus"
              type="number"
              min="0"
              step="1000"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">股票总包（元，4 年摊）</label>
            <input
              v-model.number="o.stockTotal"
              type="number"
              min="0"
              step="10000"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年福利合计（元）</label>
            <input
              v-model.number="o.welfare"
              type="number"
              min="0"
              step="500"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">周工时（小时）</label>
            <input
              v-model.number="o.hours"
              type="number"
              min="1"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          第 1 年税前总包约 <strong class="text-foreground">{{ fmt(annual(o, 1).gross) }}</strong> 元，
          第 2-4 年每年约 <strong class="text-foreground">{{ fmt(annual(o, 2).gross) }}</strong> 元。
        </p>
      </div>
    </div>

    <!-- 对比表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6 overflow-x-auto">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <List class="w-5 h-5 mr-2 text-primary" /> 逐年对比
      </h2>
      <table class="w-full text-sm min-w-[560px]">
        <thead>
          <tr class="text-left text-muted-foreground border-b border-border">
            <th class="py-2.5 pr-4 font-medium">指标</th>
            <th class="py-2.5 pr-4 font-medium">Offer 1</th>
            <th class="py-2.5 pr-4 font-medium">Offer 2</th>
            <th class="py-2.5 font-medium">差额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in compareRows" :key="row.label" class="border-b border-border/50">
            <td class="py-2.5 pr-4 text-muted-foreground">{{ row.label }}</td>
            <td class="py-2.5 pr-4">
              <span class="text-foreground font-medium">{{ fmtCell(row.v1, row.dec) }}</span>
              <span v-if="row.winner === 1" class="ml-2 inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs rounded-full">胜出 +{{ fmtCell(row.v1 - row.v2, row.dec) }}</span>
            </td>
            <td class="py-2.5 pr-4">
              <span class="text-foreground font-medium">{{ fmtCell(row.v2, row.dec) }}</span>
              <span v-if="row.winner === 2" class="ml-2 inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs rounded-full">胜出 +{{ fmtCell(row.v2 - row.v1, row.dec) }}</span>
            </td>
            <td class="py-2.5 text-muted-foreground">{{ fmtCell(Math.abs(row.v1 - row.v2), row.dec) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 结论 -->
      <div class="mt-5 bg-primary/10 rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">按第 1 年税后收入，推荐</p>
        <p class="text-xl font-bold text-primary">{{ winnerLabel }}</p>
        <p class="text-sm text-primary mt-1">
          税后多 {{ fmt(Math.abs(year1Net1 - year1Net2)) }} 元/年 ·
          时薪 {{ fmt2(winnerHourly) }} 元/小时（税后年 ÷ 周工时 × 52）
        </p>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed mt-4">
        时薪 = 第 1 年税后年收入 ÷（周工时 × 52 周）。签字费只在第 1 年计入，股票按总包 ÷ 4 年均摊；若两份 Offer 的发放节奏差异大，请结合逐年明细判断。
      </p>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：Offer 实际价值还受五险一金基数、期权行权价与流动性、年终奖实际发放、调休与加班文化等影响，本工具按简化口径估算，仅供参考，不构成任何决策依据。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 Offer 对比</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            跳槽谈 Offer 时，只看月薪容易踩坑：签字费是一次性的、股票分多年归属、年终奖浮动发放，福利与工时也会显著影响实际性价比。
            Offer 多维对比器把总包逐年折算成税后收入与时薪，让"总包 60 万但 996"和"总包 45 万朝九晚六"可以直接比较。
          </p>
          <h3 class="text-lg font-semibold text-foreground">逐年总包怎么折算</h3>
          <p>
            第 1 年总包 = 月薪 × 12 + 月薪 × 年终奖月数 + 签字费 + 股票总包 ÷ 4 + 年福利；
            第 2-4 年不再计入签字费，其余项不变。签字费和股票摊销分开看很重要：一份靠签字费抬高的第 1 年总包，
            从第 2 年起会明显回落。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么还要看时薪</h3>
          <p>
            时薪 = 税后年收入 ÷（周工时 × 52）。两份税后接近的 Offer，周工时 40 小时与 55 小时的真实差距接近 40%，
            时薪是把"隐性加班成本"折算进收入的最直接指标，也更适合与当前工作对照。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">税后是怎么算的？</span>简化口径：应纳税所得额 = 年总包 − 6 万元 − 年总包 × 10.5%（简化社保公积金），套用年度综合所得税率表 3%-45% 与速算扣除数。与实际发薪会有出入，仅用于横向比较。</li>
            <li><span class="text-foreground font-medium">股票价值应该填多少？</span>建议按授予时的市值填总包，工具按 4 年均摊；未上市公司期权存在不确定性，可以折价或填 0 保守估计。</li>
            <li><span class="text-foreground font-medium">年终奖月数填多少合理？</span>按公司历史上一般发放水平填写（如 15.5 薪填 3.5），绩效强浮动的公司建议用保守值，避免高估。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'offer-comparator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { GitCompare, Briefcase, List, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Offer 多维对比器 - 两个 offer 总包/税后/时薪对比',
  description: '在线 Offer 对比计算器，把两个 offer 的月薪、年终奖、签字费、股票总包、福利逐年折算总包，按简化年度个税口径估算第 1-4 年税后收入、平摊月收入与时薪，纯本地计算',
  keywords: 'offer比较, offer计算器, 总包对比, 税后收入, 时薪计算, 跳槽比较, 年终奖折算',
  author: 'Util工具箱',
  ogTitle: 'Offer 多维对比器 - 有条工具',
  ogDescription: '两个 offer 的 base/奖金/签字费/期权本地折算逐年总包，并排比税后与时薪',
  ogUrl: 'https://www.util.cn/tools/offer-comparator',
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
          name: 'Offer 多维对比器',
          url: 'https://www.util.cn/tools/offer-comparator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['两个 Offer 并排对比', '签字费/股票/奖金逐年折算', '简化年度个税估算', '平摊月收入与时薪', '逐年胜出徽章与差额']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: 'Offer 多维对比器', item: 'https://www.util.cn/tools/offer-comparator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '税后是怎么算的？',
              acceptedAnswer: { '@type': 'Answer', text: '简化口径：应纳税所得额 = 年总包 − 6 万元 − 年总包 × 10.5%（简化社保公积金），套用年度综合所得税率表 3%-45% 与速算扣除数。' }
            },
            {
              '@type': 'Question',
              name: '股票价值应该填多少？',
              acceptedAnswer: { '@type': 'Answer', text: '建议按授予时的市值填总包，工具按 4 年均摊；未上市公司期权有不确定性，可折价或填 0 保守估计。' }
            },
            {
              '@type': 'Question',
              name: '年终奖月数填多少合理？',
              acceptedAnswer: { '@type': 'Answer', text: '按公司历史上一般发放水平填写，如 15.5 薪填 3.5；绩效强浮动的公司建议用保守值避免高估。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'offer-comparator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// 状态：两个 Offer
const offer1 = { base: 25000, bonusMonths: 3, signBonus: 0, stockTotal: 0, welfare: 0, hours: 40 }
const offer2 = { base: 20000, bonusMonths: 3, signBonus: 0, stockTotal: 0, welfare: 0, hours: 40 }
const offers = ref([offer1, offer2])

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmt = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '—')
const fmt2 = (v) => (isFinite(v) ? v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')
const fmtCell = (v, dec) => (dec ? fmt2(v) : fmt(v))

// ---------- 年度综合所得税率表（简化口径） ----------
const annualTaxBrackets = [
  { limit: 960000, rate: 0.45, deduct: 181920 },
  { limit: 660000, rate: 0.35, deduct: 85920 },
  { limit: 420000, rate: 0.30, deduct: 52920 },
  { limit: 300000, rate: 0.25, deduct: 31920 },
  { limit: 144000, rate: 0.20, deduct: 16920 },
  { limit: 36000,  rate: 0.10, deduct: 2520 },
  { limit: 0,      rate: 0.03, deduct: 0 }
]
const annualTax = (taxable) => {
  if (taxable <= 0) return 0
  for (const b of annualTaxBrackets) {
    if (taxable > b.limit) return taxable * b.rate - b.deduct
  }
  return 0
}

// ---------- 单个 Offer 第 year 年总包与税后 ----------
const annual = (o, year) => {
  const base = Math.max(0, o.base)
  const bonus = base * Math.max(0, o.bonusMonths)
  const stock = Math.max(0, o.stockTotal) / 4
  const welfare = Math.max(0, o.welfare)
  const sign = year === 1 ? Math.max(0, o.signBonus) : 0
  const gross = base * 12 + bonus + stock + welfare + sign

  const social = gross * 0.105
  const taxable = gross - 60000 - social
  const tax = annualTax(taxable)
  const net = gross - social - tax
  return { gross, social, taxable, tax, net }
}

const year1Net1 = computed(() => annual(offers.value[0], 1).net)
const year1Net2 = computed(() => annual(offers.value[1], 1).net)

// ---------- 对比行 ----------
const compareRows = computed(() => {
  const rows = []
  rows.push({ label: '第 1 年税前总包', v1: annual(offers.value[0], 1).gross, v2: annual(offers.value[1], 1).gross })
  for (let y = 1; y <= 4; y++) {
    rows.push({ label: `第 ${y} 年税后`, v1: annual(offers.value[0], y).net, v2: annual(offers.value[1], y).net })
  }
  const total1 = [1, 2, 3, 4].reduce((s, y) => s + annual(offers.value[0], y).net, 0)
  const total2 = [1, 2, 3, 4].reduce((s, y) => s + annual(offers.value[1], y).net, 0)
  rows.push({ label: '4 年税后合计', v1: total1, v2: total2 })
  rows.push({ label: '平摊月收入（第 1 年税后 ÷ 12）', v1: year1Net1.value / 12, v2: year1Net2.value / 12, dec: true })
  rows.push({
    label: '时薪（第 1 年税后 ÷ 周工时 × 52）',
    v1: year1Net1.value / (Math.max(1, offers.value[0].hours) * 52),
    v2: year1Net2.value / (Math.max(1, offers.value[1].hours) * 52),
    dec: true
  })
  return rows.map(r => ({ ...r, winner: r.v1 === r.v2 ? 0 : (r.v1 > r.v2 ? 1 : 2) }))
})

const winnerLabel = computed(() => {
  const diff = year1Net1.value - year1Net2.value
  if (diff === 0) return '两者打平'
  return diff > 0 ? 'Offer 1' : 'Offer 2'
})
const winnerHourly = computed(() => {
  const isFirst = year1Net1.value >= year1Net2.value
  const o = isFirst ? offers.value[0] : offers.value[1]
  const net = isFirst ? year1Net1.value : year1Net2.value
  return net / (Math.max(1, o.hours) * 52)
})
</script>
