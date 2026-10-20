<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">销售提成计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">阶梯提成自动算，全额累进 vs 超额累进两种口径并排对比</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        自定义阶梯提成档（区间下限-上限或「超过 X 元部分」+提成率），输入本月销售额即可同时得到全额累进（整笔按落入档的比率）与超额累进（分段各自计，类似个税）两种结果、逐档明细分解与两者差额提示，另可加底薪核对工资条。全部计算在浏览器本地完成，薪资数据不出本机。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 提成方案
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">本月销售额（元）</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <input
              v-model.number="sales"
              type="number"
              min="0"
              step="1000"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 20000"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">提成档位（按销售额从低到高）</label>
            <button
              @click="addTier"
              class="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            >+ 加一档</button>
          </div>
          <div class="space-y-2.5">
            <div
              v-for="(tier, i) in tiers"
              :key="i"
              class="grid grid-cols-[1fr_1fr_84px_32px] gap-2 items-center"
            >
              <div class="relative">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">≥</span>
                <input
                  v-model.number="tier.lower"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full pl-7 pr-2 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="下限"
                />
              </div>
              <div>
                <input
                  v-if="i < tiers.length - 1"
                  v-model.number="tiers[i].upper"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="上限"
                />
                <div v-else class="w-full px-2.5 py-2 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground text-center">以上不限</div>
              </div>
              <div class="relative">
                <input
                  v-model.number="tier.rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full px-2.5 py-2 pr-6 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              <button
                v-if="tiers.length > 1"
                @click="removeTier(i)"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                aria-label="删除该档"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <span v-else class="w-8" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-2">最后一档默认「超过下限的部分」不设上限；档位请按销售额从低到高排列</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">底薪（元，可选，加到最终）</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <input
              v-model.number="baseSalary"
              type="number"
              min="0"
              step="500"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 5000"
            />
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 两种口径对比
        </h2>

        <div v-if="sales > 0">
          <div class="grid grid-cols-2 gap-3">
            <div :class="['rounded-lg p-4 text-center border', preferredMode === 'full' ? 'bg-primary/10 border-primary/40' : 'bg-muted/50 border-border']">
              <p class="text-xs text-muted-foreground mb-1">全额累进（整笔按落入档）</p>
              <p class="text-2xl font-bold text-foreground">¥{{ fmt(fullCommission.commission) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">适用档：{{ fullCommission.bracketText }}</p>
            </div>
            <div :class="['rounded-lg p-4 text-center border', preferredMode === 'excess' ? 'bg-primary/10 border-primary/40' : 'bg-muted/50 border-border']">
              <p class="text-xs text-muted-foreground mb-1">超额累进（分段各自计）</p>
              <p class="text-2xl font-bold text-foreground">¥{{ fmt(excessCommission.total) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">共 {{ excessCommission.rows.length }} 段参与计算</p>
            </div>
          </div>

          <div class="mt-3 bg-muted/50 rounded-lg p-4">
            <p class="text-sm font-medium text-foreground mb-1">差额提示</p>
            <p class="text-sm text-muted-foreground leading-relaxed">
              两种口径相差 <span class="font-semibold text-foreground">¥{{ fmt(Math.abs(diff)) }}</span>，
              <span :class="preferredMode ? 'text-primary font-semibold' : 'text-foreground'">{{ diffText }}</span>
            </p>
            <div class="mt-3 space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-muted-foreground">全额累进 + 底薪</span>
                <span class="font-semibold text-foreground">¥{{ fmt(fullCommission.commission + baseSalary) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">超额累进 + 底薪</span>
                <span class="font-semibold text-foreground">¥{{ fmt(excessCommission.total + baseSalary) }}</span>
              </div>
            </div>
          </div>

          <!-- 逐档明细 -->
          <div class="mt-4">
            <h3 class="text-sm font-medium text-foreground mb-2">超额累进逐档明细</h3>
            <div class="rounded-lg border border-border overflow-hidden text-xs">
              <div class="grid grid-cols-[1fr_88px_52px_88px] px-3 py-2 bg-muted/60 text-muted-foreground font-medium">
                <span>区间</span>
                <span class="text-right">计入销售额</span>
                <span class="text-right">费率</span>
                <span class="text-right">提成</span>
              </div>
              <div
                v-for="(row, i) in excessCommission.rows"
                :key="i"
                class="grid grid-cols-[1fr_88px_52px_88px] px-3 py-2 border-t border-border/50"
              >
                <span class="text-foreground">{{ row.label }}</span>
                <span class="text-right text-foreground">{{ row.amount > 0 ? fmt(row.amount) : '0' }}</span>
                <span class="text-right text-muted-foreground">{{ row.rate }}%</span>
                <span class="text-right font-medium text-foreground">{{ row.amount > 0 ? fmt(row.commission) : '0' }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 bg-primary/10 rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">综合有效提成率（不含底薪）</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">全额累进</span>
              <span class="font-semibold text-foreground">{{ pctText(fullCommission.commission) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">超额累进</span>
              <span class="font-semibold text-foreground">{{ pctText(excessCommission.total) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          输入本月销售额开始计算
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：提成口径以公司薪酬制度与劳动合同约定为准——全额累进与超额累进、档位边界是否含税、退货与坏账如何冲减等规则各公司不同，本工具按公开常见口径估算，结果仅供核对工资条参考。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于销售提成计算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            阶梯提成是销售岗最常见的激励方式：销售额越高、适用费率越高。但「高费率」有两种截然不同的算法——全额累进与超额累进，工资条核对时务必先弄清公司用的是哪一种，同样的销售额两种结果可能差出百分之几十。
          </p>
          <h3 class="text-lg font-semibold text-foreground">全额累进与超额累进的区别</h3>
          <p>
            全额累进：销售额落入哪一档，整笔销售额都按该档费率计。超额累进：像个人所得税一样分段计税，每段只按本段费率计，再逐段相加。以档位 [0-1 万 @3%，1 万以上 @5%]、销售额 2 万为例：全额累进 = 20000 × 5% = 1000 元；超额累进 = 10000 × 3% + 10000 × 5% = 800 元。
          </p>
          <h3 class="text-lg font-semibold text-foreground">哪种口径对我更划算</h3>
          <p>
            对同一套档位表，全额累进的结果永远不低于超额累进，临界点附近差距最大（刚跨过档位线时整笔升档，提成跳涨）。所以作为拿提成的一方，档位边界附近的单子争取按全额累进口径、或把高档费率谈成「超过部分」的表述，直接影响当月收入；作为制定方案的一方，超额累进曲线更平滑，不会出现「多做一块钱、提成翻一倍」的悬崖。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <div class="space-y-3">
            <div>
              <h4 class="font-semibold text-foreground">Q1：「超过 1 万的部分按 5%」属于哪种算法？</h4>
              <p class="mt-1">这是超额累进口径：只有超过 1 万的增量部分按 5%，1 万以内仍按低档费率。若制度写「达 1 万以上按 5% 计全额提成」，则是全额累进。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q2：底薪需要算进提成吗？</h4>
              <p class="mt-1">底薪是固定部分，与提成无关，直接相加即可。本工具在两种口径的结果上分别加上底薪，方便与工资条上的「应发工资」核对。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q3：跨月回款、退货会影响提成吗？</h4>
              <p class="mt-1">多数公司按「实际回款」而非「签约额」计提成，退货与坏账会在后续月份冲减销售额。计算时请以当月实际参与计提的销售额为准，具体看公司提成制度。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'commission-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  TrendingUp, Calculator, BarChart3, Trash2, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '销售提成计算器 - 全额累进/超额累进阶梯提成对比',
  description: '在线销售提成计算器，自定义阶梯提成档（区间或超过X元部分），并排对比全额累进与超额累进两种口径，逐档明细分解、差额提示与底薪相加核对工资条，纯本地计算薪资不出本机',
  keywords: '提成怎么算, 阶梯提成计算, 销售提成计算器, 超额累进提成, 全额累进提成, 底薪加提成',
  author: 'Util工具箱',
  ogTitle: '销售提成计算器 - 有条工具',
  ogDescription: '阶梯销售额自动算提成，支持全额累进与超额累进两种口径，核对工资条',
  ogUrl: 'https://www.util.cn/tools/commission-calculator',
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
          name: '销售提成计算器',
          url: 'https://www.util.cn/tools/commission-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['自定义阶梯提成档', '全额累进/超额累进并排对比', '逐档明细分解', '底薪相加', '本地计算保护薪资']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '销售提成计算器', item: 'https://www.util.cn/tools/commission-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '「超过1万的部分按5%」属于哪种算法？',
              acceptedAnswer: { '@type': 'Answer', text: '这是超额累进口径：只有超过1万的增量部分按5%，1万以内仍按低档费率；若写「达1万以上整笔按5%」则为全额累进。' }
            },
            {
              '@type': 'Question',
              name: '全额累进和超额累进差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '以档位[0-1万@3%,1万以上@5%]、销售额2万为例：全额累进=20000×5%=1000元，超额累进=10000×3%+10000×5%=800元，相差200元。' }
            },
            {
              '@type': 'Question',
              name: '底薪需要算进提成吗？',
              acceptedAnswer: { '@type': 'Answer', text: '底薪是固定部分，与提成无关，直接在提成结果上相加即可，用于核对工资条应发数。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'commission-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const sales = ref(20000)
const baseSalary = ref(0)
const tiers = ref([
  { lower: 0, upper: 10000, rate: 3 },
  { lower: 10000, upper: null, rate: 5 }
])

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmt = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '0')

const addTier = () => {
  const last = tiers.value[tiers.value.length - 1]
  const prevUpper = last.upper === null || last.upper === undefined ? last.lower : last.upper
  // 原末档补上上限，新末档不封顶
  last.upper = prevUpper > last.lower ? prevUpper : last.lower + 10000
  tiers.value.push({ lower: last.upper, upper: null, rate: Math.min(100, (last.rate || 0) + 1) })
}

const removeTier = (i) => {
  tiers.value.splice(i, 1)
  const last = tiers.value[tiers.value.length - 1]
  last.upper = null
}

const cleanTiers = computed(() => {
  const list = tiers.value
    .map(t => ({
      lower: Math.max(0, Number(t.lower) || 0),
      upper: t.upper === null || t.upper === undefined || t.upper === '' ? null : Math.max(0, Number(t.upper) || 0),
      rate: Math.min(100, Math.max(0, Number(t.rate) || 0))
    }))
    .sort((a, b) => a.lower - b.lower)
  if (list.length) list[list.length - 1].upper = null
  return list
})

// ---------- 全额累进：整笔按落入档费率 ----------
const fullCommission = computed(() => {
  const s = Math.max(0, Number(sales.value) || 0)
  let hit = null
  for (const t of cleanTiers.value) {
    if (s >= t.lower && (t.upper === null || s < t.upper)) { hit = t; break }
  }
  if (!hit) return { commission: 0, bracketText: '未落入任何档位' }
  const rangeText = hit.upper === null
    ? `超过 ${fmt(hit.lower)} 元部分档`
    : `${fmt(hit.lower)}-${fmt(hit.upper)} 元档`
  return {
    commission: s * (hit.rate / 100),
    bracketText: `${rangeText} @ ${hit.rate}%`
  }
})

// ---------- 超额累进：分段各自计 ----------
const excessCommission = computed(() => {
  const s = Math.max(0, Number(sales.value) || 0)
  let total = 0
  const rows = cleanTiers.value.map((t) => {
    const segEnd = t.upper === null ? s : Math.min(s, t.upper)
    const amount = Math.max(0, segEnd - t.lower)
    const commission = amount * (t.rate / 100)
    total += commission
    const label = t.upper === null
      ? `${fmt(t.lower)} 元以上部分`
      : `${fmt(t.lower)} - ${fmt(t.upper)}`
    return { label, amount, rate: t.rate, commission }
  })
  return { total, rows }
})

const diff = computed(() => fullCommission.value.commission - excessCommission.value.total)
const preferredMode = computed(() => (diff.value < 0 ? 'excess' : 'full'))
const diffText = computed(() => {
  if (Math.abs(diff.value) < 0.5) return '两种口径结果几乎一致'
  return diff.value > 0
    ? '本方案下全额累进对你更有利（高档费率覆盖整笔销售额）'
    : '本方案下超额累进对你更有利（分段计更平滑，临界档附近差距最大）'
})

const pctText = (v) => {
  const s = Math.max(0, Number(sales.value) || 0)
  if (s <= 0) return '—'
  return `${((v / s) * 100).toFixed(2)}%`
}
</script>
