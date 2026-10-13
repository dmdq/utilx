<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Star class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">抽卡保底计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">通用模型算距保底抽数、期望出货点与欧非分位判定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按通用的"基础概率 + 软保底递增 + 硬保底必出"模型做概率递推：输入基础概率、软保底起始、每抽递增与硬保底抽数（默认对应原神/星穹铁道类五星参数），即可得到期望抽数、50%/90% 分位出货线，以及按"已垫抽数"判定的欧非状态。结果为娱乐参考，请理性消费。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <!-- 参数 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <Dice5 class="w-5 h-5 mr-2 text-primary" /> 模型参数
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">基础概率 p（%）</label>
            <input
              v-model.number="baseP"
              type="number"
              min="0.01"
              max="100"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">硬保底 M（抽）</label>
            <input
              v-model.number="hardPity"
              type="number"
              min="2"
              max="999"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">软保底起始 N（第几抽）</label>
          <input
            v-model.number="softStart"
            type="number"
            min="2"
            max="998"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">每抽递增 d（百分点）</label>
          <input
            v-model.number="stepD"
            type="number"
            min="0"
            max="100"
            step="0.5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">自第 N 抽起，单抽概率每抽增加 d 个百分点，至硬保底必出</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">已垫抽数（未出货）</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="pulled"
              type="number"
              min="0"
              :max="safeM - 1"
              step="1"
              class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-sm text-muted-foreground whitespace-nowrap">/ {{ safeM }} 抽</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          <button
            v-for="preset in modelPresets"
            :key="preset.name"
            @click="applyPreset(preset)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
          >{{ preset.name }}</button>
        </div>
      </div>

      <!-- 结果 -->
      <div class="lg:col-span-3 space-y-4">
        <!-- 三张核心卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-card border border-border rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">距硬保底剩余</p>
            <p class="text-3xl font-bold text-primary">{{ remaining }}<span class="text-base font-medium text-muted-foreground"> 抽</span></p>
            <p class="text-xs text-muted-foreground mt-1">第 {{ safeM }} 抽必出</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">期望抽数（从零开始）</p>
            <p class="text-3xl font-bold text-foreground">{{ fmtNum(summary.expected) }}<span class="text-base font-medium text-muted-foreground"> 抽</span></p>
            <p class="text-xs text-muted-foreground mt-1">概率递推均值，非保证</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">已垫 {{ safeJ }} 抽，期望还需</p>
            <p class="text-3xl font-bold text-foreground">{{ fmtNum(conditional.expected) }}<span class="text-base font-medium text-muted-foreground"> 抽</span></p>
            <p class="text-xs text-muted-foreground mt-1">按当前垫抽数条件计算</p>
          </div>
        </div>

        <!-- 分位与判定 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp class="w-3.5 h-3.5" /> 出货分位线（从零开始）</p>
              <p class="text-sm text-foreground mt-1.5">50% 分位：<span class="font-bold">{{ summary.q50 }} 抽</span> 内出货</p>
              <p class="text-sm text-foreground">90% 分位：<span class="font-bold">{{ summary.q90 }} 抽</span> 内出货</p>
              <p class="text-xs text-muted-foreground mt-2">软保底使出货集中在第 {{ safeN }} 抽之后，因此中位线晚于期望值，属正常现象</p>
            </div>
            <div :class="luckMeta.cardClass" class="rounded-lg p-4">
              <p class="text-xs opacity-80 mb-1 flex items-center gap-1"><Sparkles class="w-3.5 h-3.5" /> 垫抽数分位判定</p>
              <p class="text-xl font-bold">{{ luckMeta.label }}</p>
              <p class="text-xs leading-relaxed mt-1.5">{{ luckMeta.desc }}</p>
            </div>
          </div>

          <!-- 概率分布 -->
          <div>
            <p class="text-xs text-muted-foreground mb-2">首次出货概率分布（每 10 抽一组）</p>
            <div class="flex items-end gap-1.5 h-28">
              <div v-for="(seg, i) in distSegments" :key="i" class="flex-1 flex flex-col items-center justify-end h-full">
                <span class="text-[10px] text-muted-foreground mb-1">{{ seg.pct }}</span>
                <div
                  class="w-full rounded-t"
                  :class="i === distSegments.length - 1 ? 'bg-primary/70' : 'bg-primary/40'"
                  :style="{ height: seg.height + '%' }"
                  :title="seg.title"
                ></div>
                <span class="text-[10px] text-muted-foreground mt-1">{{ seg.range }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">未来 10 抽内出货概率</span>
              <span class="font-semibold text-foreground">{{ next10Pct }}%</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">撑到硬保底前出货概率</span>
              <span class="font-semibold text-foreground">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：本工具为娱乐参考，按公开流传的通用模型估算，不代表任何游戏的真实概率与保底实现；"欧/非"仅为统计口径下的相对位置，单次结果完全随机，请理性消费、适度娱乐，未成年人请勿参与任何抽卡充值。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于抽卡保底机制</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            现代抽卡游戏普遍采用"基础概率 + 软保底 + 硬保底"三层设计：平时按基础概率出货；连续未出货达到一定抽数后概率逐抽攀升（软保底）；到硬保底抽数则必出。以原神类五星参数为例：基础 0.6%，第 74 抽起每抽递增约 6 个百分点，第 90 抽必出。
          </p>
          <h3 class="text-lg font-semibold text-foreground">期望 62 抽是怎么算出来的</h3>
          <p>
            把"第 k 抽首次出货"的概率逐抽递推出来（第 k 抽出货概率 = 前 k-1 抽全未出货的概率 × 第 k 抽单抽概率），再对抽数加权求和即得期望。按上述默认参数，期望约 62 抽，这也是玩家常说"平均 62 抽一金"的来源——注意期望是平均值，不是保证值，更不是"62 抽必出"。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么 50% 分位线比期望更晚</h3>
          <p>
            该分布明显左偏：约 35% 的出货发生在软保底之前的漫长"平缓期"，而剩余出货高度集中在第 74-80 抽。因此一半玩家其实在第 76 抽左右才出货，中位线晚于期望值是数学上的正常现象——如果你在 60 多抽还没出，并不算特别非。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">计算结果准确吗？</span>模型本身数学上是自洽的，但各游戏真实概率未必与公开流传的参数一致，本工具结果仅供娱乐参考。</li>
            <li><span class="text-foreground font-medium">其他游戏能用吗？</span>可以调整四个参数适配：如明日方舟六星（基础 2%、第 51 抽起每抽 +2%、第 99 抽必出）、单抽常驻池（无软保底可把递增设为 0）。</li>
            <li><span class="text-foreground font-medium">垫抽数会一直累计吗？</span>取决于游戏规则：多数游戏出金后抽数清零重新计数，部分限定池会继承到下一期；记录垫抽数请以游戏内规则为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gacha-pity-calculator'" :category="'random'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Star, Dice5, TrendingUp, Sparkles, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '抽卡保底计算器 - 期望抽数/分位出货线/欧非判定',
  description: '在线抽卡保底计算器，按基础概率+软保底递增+硬保底通用模型做概率递推，计算期望抽数、50%/90% 分位出货线、距硬保底剩余抽数，并按已垫抽数判定欧非，支持原神/星穹铁道/明日方舟参数，纯本地计算',
  keywords: '抽卡保底计算, 原神保底抽数, 期望抽数, 抽卡概率, 距保底还有, 软保底, 抽卡数学',
  author: 'Util工具箱',
  ogTitle: '抽卡保底计算器 - 有条工具',
  ogDescription: '通用模型算距保底抽数、期望出货点与欧非分位判定',
  ogUrl: 'https://www.util.cn/tools/gacha-pity-calculator',
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
          name: '抽卡保底计算器',
          url: 'https://www.util.cn/tools/gacha-pity-calculator',
          applicationCategory: 'GameApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['软保底/硬保底通用模型', '期望抽数递推', '50%/90% 分位出货线', '距硬保底剩余', '垫抽数欧非分位判定', '常用游戏参数预设']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '抽卡保底计算器', item: 'https://www.util.cn/tools/gacha-pity-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '计算结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '模型数学上自洽，但各游戏真实概率未必与公开流传参数一致，结果仅供娱乐参考。' }
            },
            {
              '@type': 'Question',
              name: '其他游戏能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以调整四个参数适配，如明日方舟六星基础 2%、第 51 抽起每抽 +2%、第 99 抽必出。' }
            },
            {
              '@type': 'Question',
              name: '垫抽数会一直累计吗？',
              acceptedAnswer: { '@type': 'Answer', text: '多数游戏出金后清零重新计数，部分限定池继承到下一期，请以游戏内规则为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'gacha-pity-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 概率递推（独立纯函数，便于 node 实测；循环只在函数内，不在 setup 顶层执行） ----------
// dist[k-1] = 第 k 抽"首次出货"的概率；软保底自第 n 抽起每抽概率 +d 个百分点，第 m 抽必出
function computeDistribution({ p, n, d, m }) {
  const dist = new Array(m).fill(0)
  let survive = 1
  for (let k = 1; k <= m; k++) {
    let chance = p / 100
    if (k >= n) chance = p / 100 + (k - n + 1) * (d / 100)
    if (k === m) chance = 1
    if (chance > 1) chance = 1
    const pr = survive * chance
    dist[k - 1] = pr
    survive *= 1 - chance
  }
  return dist
}

function distCdf(dist, k) {
  let c = 0
  const limit = Math.min(k, dist.length)
  for (let i = 0; i < limit; i++) c += dist[i]
  return c
}

function distQuantile(dist, q) {
  let c = 0
  for (let i = 0; i < dist.length; i++) {
    c += dist[i]
    if (c >= q) return i + 1
  }
  return dist.length
}

function distExpected(dist) {
  let e = 0
  for (let i = 0; i < dist.length; i++) e += (i + 1) * dist[i]
  return e
}

// 已垫 j 抽未出货时，条件期望还需多少抽
function conditionalExpected(dist, j) {
  const survived = 1 - distCdf(dist, j)
  if (survived <= 0) return 0
  let e = 0
  for (let t = 1; t <= dist.length - j; t++) e += t * dist[j + t - 1]
  return e / survived
}

// 按垫抽数所处分位判欧非
function luckAssess(dist, j) {
  const f = distCdf(dist, j)
  const pct = Math.round(f * 1000) / 10
  if (f >= 0.75) return { key: 'very-unlucky', label: '非酋预警', pct, desc: `约 ${pct}% 的情形在第 ${j} 抽前就已出货，你已落后四分之三以上的玩家；好消息是硬保底就在眼前。`, cardClass: 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400' }
  if (f >= 0.5) return { key: 'unlucky', label: '偏非', pct, desc: `约 ${pct}% 的情形在第 ${j} 抽前出货，你已落后于一半玩家，但仍在正常波动范围内。`, cardClass: 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400' }
  if (f >= 0.25) return { key: 'normal', label: '正常', pct, desc: `约 ${pct}% 的情形在第 ${j} 抽前出货，你的垫抽数处于最常见的中段区间。`, cardClass: 'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400' }
  return { key: 'lucky', label: '偏欧', pct, desc: `只有约 ${pct}% 的情形会在这么早出货，绝大多数玩家此刻和你一样还没出，出货概率正在快速累积。`, cardClass: 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400' }
}

// ---------- 页面状态 ----------
const baseP = ref(0.6)
const softStart = ref(74)
const stepD = ref(6)
const hardPity = ref(90)
const pulled = ref(0)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const modelPresets = [
  { name: '原神/星铁五星', p: 0.6, n: 74, d: 6, m: 90 },
  { name: '原神/星铁四星', p: 5.1, n: 9, d: 5.1, m: 10 },
  { name: '明日方舟六星', p: 2, n: 51, d: 2, m: 99 },
  { name: '无软保底通用', p: 1, n: 9999, d: 0, m: 100 }
]

const applyPreset = (preset) => {
  baseP.value = preset.p
  softStart.value = preset.n
  stepD.value = preset.d
  hardPity.value = preset.m
  pulled.value = 0
}

const clampNum = (v, min, max, fallback) => {
  const n = Number(v)
  if (!isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const safeM = computed(() => Math.round(clampNum(hardPity.value, 2, 999, 90)))
const safeP = computed(() => clampNum(baseP.value, 0.01, 100, 0.6))
const safeN = computed(() => clampNum(softStart.value, 2, safeM.value - 1, 74))
const safeD = computed(() => clampNum(stepD.value, 0, 100, 6))
const safeJ = computed(() => Math.round(clampNum(pulled.value, 0, safeM.value - 1, 0)))

const params = computed(() => ({ p: safeP.value, n: safeN.value, d: safeD.value, m: safeM.value }))

// 所有重循环只在 computed 内惰性执行（含 SSR 首帧也不会在 setup 顶层跑）
const dist = computed(() => computeDistribution(params.value))

const summary = computed(() => ({
  expected: distExpected(dist.value),
  q50: distQuantile(dist.value, 0.5),
  q90: distQuantile(dist.value, 0.9)
}))

const remaining = computed(() => safeM.value - safeJ.value)

const conditional = computed(() => ({
  expected: conditionalExpected(dist.value, safeJ.value)
}))

const luckMeta = computed(() => luckAssess(dist.value, safeJ.value))

const next10Pct = computed(() => {
  const j = safeJ.value
  const survived = 1 - distCdf(dist.value, j)
  if (survived <= 0) return '100.0'
  const within = distCdf(dist.value, j + 10) - distCdf(dist.value, j)
  return (Math.round((within / survived) * 1000) / 10).toFixed(1)
})

const distSegments = computed(() => {
  const d = dist.value
  const size = 10
  const groups = []
  for (let start = 0; start < d.length; start += size) {
    let sum = 0
    for (let i = start; i < Math.min(start + size, d.length); i++) sum += d[i]
    groups.push({
      range: `${start + 1}-${Math.min(start + size, d.length)}`,
      prob: sum,
      title: `第 ${start + 1}-${Math.min(start + size, d.length)} 抽内首次出货概率 ${(sum * 100).toFixed(1)}%`
    })
  }
  const maxProb = Math.max(...groups.map(g => g.prob)) || 1
  return groups.map(g => ({
    range: g.range,
    title: g.title,
    pct: (g.prob * 100).toFixed(1) + '%',
    height: Math.max(4, Math.round((g.prob / maxProb) * 100))
  }))
})

const fmtNum = (v) => (isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '—')
</script>
