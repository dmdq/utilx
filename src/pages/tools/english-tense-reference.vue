<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Clock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">英语时态速查表</h1>
          <p class="text-sm text-muted-foreground mt-1">16 种时态 = 4 个时间 × 4 种体：结构公式、被动语态、例句与使用场景，4×4 矩阵总览 + 时间轴可视化</p>
        </div>
      </div>
      <p class="text-muted-foreground no-print">
        在线英语时态速查表：把 16 种时态放进「过去 / 现在 / 将来 / 过去将来」×「一般 / 进行 / 完成 / 完成进行」的 4×4 矩阵，
        每格给出主动结构公式、被动语态结构、一句中英对照例句与使用场景；点击任意格展开详情并高亮时间轴上该时态的覆盖区间。
        附「只看常用 8 时态」筛选、一般过去 vs 现在完成、现在完成 vs 过去完成两组易混对比卡，适合语法复习与写作自查。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 no-print">
        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          结构公式以主流语法著作（薄冰《英语语法》、Murphy《English Grammar in Use》、张道真《实用英语语法》）口径整理；
          三个完成进行时的被动语态在规范语法中极少使用，表内以「（无被动/极少用）」标注，具体用法以权威语法资料为准。
        </p>
      </div>
    </div>

    <!-- 主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：筛选与易混对比 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 筛选
          </h2>
          <button
            @click="onlyCommon = !onlyCommon"
            class="w-full px-3 py-2 rounded-lg text-sm font-medium transition"
            :class="onlyCommon ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:border-primary/40'"
          >
            {{ onlyCommon ? '已筛选：只看常用 8 时态（点击恢复全部）' : '只看常用 8 时态' }}
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            常用 8 时态：一般现在、现在进行、一般过去、过去进行、一般将来、现在完成、过去完成、一般过去将来。
            开启后矩阵中不常用的 8 格会变灰不可点，当前 {{ visibleTenses.length }} / {{ TENSES.length }} 格可交互。
          </p>
          <div class="border-t border-border pt-3">
            <p class="text-xs text-muted-foreground mb-1.5">图例</p>
            <ul class="text-xs text-muted-foreground space-y-1.5">
              <li>• 点击矩阵任意格 → 展开该时态完整卡片并高亮时间轴</li>
              <li>• 完成进行时四格：规范语法中无（或极少）被动语态</li>
              <li>• 「过去将来」= 站在过去的时点看将来，常出现于宾语从句</li>
            </ul>
          </div>
        </div>

        <!-- 易混对比卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 常混淆时态对比
          </h3>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground text-sm mb-1">一般过去时 vs 现在完成时</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              一般过去时只管「过去的某时刻发生了什么」，常带 yesterday、last week、in 2010 等明确过去时间，与现在切断；
              现在完成时管「过去发生的动作对现在的影响或延续」，不可与具体过去时间点连用。
              对比：I <b class="text-foreground">saw</b> this film last week.（上周看的，强调过去）
              ↔ I <b class="text-foreground">have seen</b> this film.（看过了，强调现在的经历/结果）
            </p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground text-sm mb-1">现在完成时 vs 过去完成时</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              现在完成时的「参照点」是现在：动作在过去发生、到说话时已完成或延续（have done）；
              过去完成时的「参照点」是过去某个时点，即「过去的过去」：在那之前就已发生（had done）。
              对比：I <b class="text-foreground">have finished</b> my homework.（说话前已完成）
              ↔ By the time she arrived, I <b class="text-foreground">had finished</b> my homework.（在她到达这个过去时点之前就完成了）
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：4×4 矩阵 + 详情 + 时间轴 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Table class="w-5 h-5 mr-2 text-primary" /> 16 时态 4×4 矩阵总览
            </h2>
            <span class="text-xs text-muted-foreground">横轴 = 时间 · 纵轴 = 体；点击格子展开</span>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[640px] grid grid-cols-5 gap-1.5">
              <div class="text-xs text-muted-foreground flex items-center justify-center">时间 \ 体</div>
              <div
                v-for="asp in ASPECTS"
                :key="asp.id"
                class="text-xs font-medium text-foreground bg-muted/60 rounded-lg px-1 py-2 text-center"
              >{{ asp.label }}</div>

              <template v-for="time in TIMES" :key="time.id">
                <div class="text-xs font-medium text-foreground bg-muted/60 rounded-lg px-1 py-2 flex items-center justify-center text-center leading-tight">
                  {{ time.label }}
                </div>
                <button
                  v-for="asp in ASPECTS"
                  :key="time.id + '-' + asp.id"
                  @click="selectTense(tenseOf(time.id, asp.id))"
                  :disabled="onlyCommon && !(tenseOf(time.id, asp.id) && tenseOf(time.id, asp.id).common)"
                  class="rounded-lg px-1.5 py-2 text-center transition border"
                  :class="matrixCellClass(tenseOf(time.id, asp.id))"
                >
                  <template v-if="tenseOf(time.id, asp.id)">
                    <p class="text-[11px] font-semibold leading-tight">{{ tenseOf(time.id, asp.id).name }}</p>
                    <p class="text-[10px] opacity-70 leading-tight mt-0.5">{{ tenseOf(time.id, asp.id).formula }}</p>
                  </template>
                  <template v-else>—</template>
                </button>
              </template>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            矩阵 4 × 4 = 16 格一一对应 16 种时态：先选「时间」（动作发生在何时），再选「体」（一般=陈述事实、进行=正在发生、完成=到某时点为止已完成、完成进行=持续到某时点且可能继续）。
          </p>
        </div>

        <!-- 时间轴 SVG -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3 no-print">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Clock class="w-4 h-4 mr-2 text-primary" /> 时间轴：{{ selectedTense ? selectedTense.name : '当前选中时态的时间位置' }}
          </h3>
          <svg viewBox="0 0 760 150" class="w-full h-auto" role="img" :aria-label="timelineAria">
            <text x="155" y="22" text-anchor="middle" class="fill-muted-foreground" font-size="12">过去</text>
            <text x="380" y="22" text-anchor="middle" class="fill-muted-foreground" font-size="12">现在</text>
            <text x="605" y="22" text-anchor="middle" class="fill-muted-foreground" font-size="12">将来</text>
            <rect x="30" y="30" width="250" height="70" rx="8" class="fill-muted/60 stroke-border" stroke-width="1" />
            <rect x="280" y="30" width="200" height="70" rx="8" class="fill-muted/60 stroke-border" stroke-width="1" />
            <rect x="480" y="30" width="250" height="70" rx="8" class="fill-muted/60 stroke-border" stroke-width="1" />
            <text x="380" y="122" text-anchor="middle" class="fill-muted-foreground" font-size="11">时间流向 →</text>
            <template v-if="selectedTense">
              <rect
                :x="selectedTense.tl.x" y="40"
                :width="selectedTense.tl.w" height="50" rx="6"
                :class="selectedTense.tl.dash ? 'fill-primary/20 stroke-primary' : 'fill-primary/25 stroke-primary'"
                :stroke-dasharray="selectedTense.tl.dash ? '6 4' : ''"
                stroke-width="1.5"
              />
              <line v-if="selectedTense.tl.arrow" :x1="selectedTense.tl.arrow[0]" :x2="selectedTense.tl.arrow[1]" y1="65" y2="65" class="stroke-primary" stroke-width="2.5" marker-end="url(#tenseArrow)" />
              <circle v-if="selectedTense.tl.point" :cx="selectedTense.tl.point" cy="65" r="5" class="fill-primary" />
              <rect v-if="selectedTense.tl.span" :x="selectedTense.tl.span" y="60" width="76" height="10" rx="5" class="fill-primary" />
            </template>
            <defs>
              <marker id="tenseArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" class="fill-primary" />
              </marker>
            </defs>
          </svg>
          <p v-if="selectedTense" class="text-xs text-muted-foreground leading-relaxed">{{ selectedTense.timeNote }}</p>
          <p v-else class="text-xs text-muted-foreground">点击上方矩阵任意格，查看该时态覆盖的时间区间：方块 = 覆盖范围，箭头 = 动作起点到参照点。</p>
        </div>

        <!-- 选中时态详情 -->
        <div v-if="selectedTense" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 class="text-lg font-semibold text-foreground">
              {{ selectedTense.name }}
              <span
                class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium align-middle"
                :class="selectedTense.common ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'"
              >{{ selectedTense.common ? '常用 8 时态' : '较少用' }}</span>
            </h3>
            <button
              @click="selectedTense = null"
              class="text-xs text-muted-foreground hover:text-foreground no-print"
            >收起详情</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground mb-1">主动结构</p>
              <p class="font-mono text-sm text-foreground">{{ selectedTense.active }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground mb-1">被动结构</p>
              <p class="font-mono text-sm text-foreground">{{ selectedTense.passive }}</p>
            </div>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="text-xs text-muted-foreground mb-1">例句</p>
            <p class="text-sm text-foreground">{{ selectedTense.en }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ selectedTense.zh }}</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="text-xs text-muted-foreground mb-1">使用场景</p>
            <p class="text-sm text-foreground leading-relaxed">{{ selectedTense.use }}</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            时间轴位置：{{ selectedTense.timeNote }}
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-8 no-print" open>
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none list-none flex items-center gap-2">
        <span class="text-primary">#</span> 英语时态速查表：怎么选时态与常见问题
      </summary>
      <div class="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          英语时态体系由「时间」与「体」两个维度组成：时间回答动作发生在何时（过去 / 现在 / 将来 / 过去将来），
          体回答动作的进程状态（一般 / 进行 / 完成 / 完成进行），两两组合恰好 16 种。把时态放进 4×4 矩阵而不是背成 16 条孤立规则，
          是语法复习中最快建立全局感的方法。
        </p>

        <h3 class="text-lg font-semibold text-foreground">选时态只需回答三个问题</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><b class="text-foreground">何时发生？</b>过去用过去系（did / was doing），将来用 will 系或 be going to；宾语从句里站在过去看将来则用 would 系（过去将来时）。</li>
          <li><b class="text-foreground">是否延续 / 正在进行？</b>强调此刻或某段时间内正在发生用进行体（be doing）；只是一般陈述用一般体。</li>
          <li><b class="text-foreground">是否影响现在 / 以某时点为界？</b>过去的动作影响现在用现在完成（have done）；强调到某时点为止已持续多久且可能继续，用完成进行（have been doing）。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">时间轴怎么看</h3>
        <p>
          每个时态在时间轴上的覆盖区间不同：一般时态只覆盖一个时间段；进行体覆盖某个时点前后的一小段；
          完成体从动作起点延伸到参照点（现在完成延伸到现在、过去完成延伸到过去某时点、将来完成延伸到将来某时点）；
          过去将来时以过去某时点为原点向后看，所以在时间轴上用虚线块表示「站在过去望将来」。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <div class="space-y-3">
          <div>
            <p class="font-semibold text-foreground">为什么完成进行时没有被动语态？</p>
            <p>规范语法中 have/has/had been being done 这类形式几乎不出现，习惯上认为完成进行体的被动形式不存在或极少使用。需要表达被动 + 持续义时，通常改用完成时被动（has been done）或改写句子。本表在对应格中明确标注。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">一般将来时 will do 和 be going to do 有什么区别？</p>
            <p>will do 强调说话时刻的决定或预测（I will help you.）；be going to 强调事先的计划或已有迹象（It's going to rain.）。两者都属一般将来时范畴，本表公式以 will do 为代表。此外现在进行时也可表已安排的将来（We are leaving tomorrow.）。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">过去将来时什么时候用？</p>
            <p>主要用于主句为过去时态的宾语从句：She said she <b class="text-foreground">would write</b> a letter. 结构是 would + 动词原形；同理有 would be doing、would have done、would have been doing，共同点是「站在过去的时点看将来」。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">现在完成时能和具体过去时间连用吗？</p>
            <p>不能。现在完成时不与 yesterday、last year、in 1990 等明确过去时间点连用（此时用一般过去时），但可与 already、just、ever、so far、for two years 等不锚定过去时点的时间状语连用。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">相关工具</h3>
        <p>
          时态学习离不开动词形态：<NuxtLink to="/tools/irregular-verbs-table/" class="text-primary hover:underline">不规则动词速查表</NuxtLink>收录 180 个常用动词的原形 / 过去式 / 过去分词，完成时的「过去分词」一栏正好用得上；两者搭配默写模式与 10 词小测验，时态 + 动词形态一次刷完。
        </p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'english-tense-reference'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Clock, Search, Table, Lightbulb, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '英语时态速查表 - 16种时态公式结构例句大全（4×4矩阵+时间轴）',
  description: '在线英语时态表：16种时态=4时间×4体，每格含主动结构公式、被动语态、中英对照例句与使用场景，4×4矩阵总览、时间轴可视化高亮、常用8时态筛选、易混时态对比，语法复习写作自查必备',
  keywords: '英语时态表,16种时态,时态公式,现在完成时,过去完成时,过去将来时,时态例句',
  author: '有条工具',
  ogTitle: '英语时态速查表 - 16种时态公式结构例句大全 | 有条工具',
  ogDescription: '16 种时态 4×4 矩阵总览：结构公式、被动语态、例句与时间轴可视化，附易混时态对比。',
  ogUrl: 'https://www.util.cn/tools/english-tense-reference',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '英语时态速查表',
          url: 'https://www.util.cn/tools/english-tense-reference',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '16 种时态 4×4 矩阵总览（4 时间 × 4 体）',
            '每时态主动结构公式与被动语态结构',
            '中英对照例句与一句使用场景说明',
            '时间轴 SVG 可视化高亮选中时态区间',
            '只看常用 8 时态筛选',
            '一般过去 vs 现在完成、现在完成 vs 过去完成对比卡'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '英语时态速查表', item: 'https://www.util.cn/tools/english-tense-reference/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么完成进行时没有被动语态？',
              acceptedAnswer: { '@type': 'Answer', text: '规范语法中 have been being done 这类形式几乎不出现，习惯上认为完成进行体的被动形式不存在或极少使用，需要被动+持续义时改用完成时被动或改写句子。' }
            },
            {
              '@type': 'Question',
              name: 'will do 和 be going to do 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'will do 强调说话时刻的决定或预测，be going to 强调事先的计划或已有迹象。两者都属一般将来时范畴，表内公式以 will do 为代表。' }
            },
            {
              '@type': 'Question',
              name: '过去将来时什么时候用？',
              acceptedAnswer: { '@type': 'Answer', text: '主要用于主句为过去时态的宾语从句，如 She said she would write a letter. 结构为 would + 动词原形，表示站在过去的时点看将来。' }
            },
            {
              '@type': 'Question',
              name: '现在完成时能和具体过去时间连用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。现在完成时不与 yesterday、last year 等明确过去时间点连用（此时用一般过去时），但可与 already、just、so far、for two years 等状语连用。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== DATA-BEGIN（纯逻辑与数据，可独立单测） =====
// 数据口径：4 时间（past/present/future/pastFuture）× 4 体（simple/continuous/perfect/perfectContinuous）
// = 16 时态；结构公式按主流语法著作整理；完成进行时被动标注「（无被动/极少用）」。
const TIMES = [
  { id: 'past', label: '过去' },
  { id: 'present', label: '现在' },
  { id: 'future', label: '将来' },
  { id: 'pastFuture', label: '过去将来' }
]
const ASPECTS = [
  { id: 'simple', label: '一般' },
  { id: 'continuous', label: '进行' },
  { id: 'perfect', label: '完成' },
  { id: 'perfectContinuous', label: '完成进行' }
]

const TENSES = [
  // —— 过去 ——
  {
    id: 'past-simple', time: 'past', aspect: 'simple', common: true,
    name: '一般过去时', formula: 'did',
    active: '主语 + 动词过去式（did）', passive: 'was / were + done',
    en: 'She wrote a letter yesterday.', zh: '她昨天写了一封信。',
    use: '表示过去某时发生的动作或状态，与现在无关；常与 yesterday、last week、in 2010 连用。',
    timeNote: '只覆盖过去的一个时间段，在时间轴上是一个封闭的过去区间，与现在切断。',
    tl: { x: 40, w: 230, point: 160 }
  },
  {
    id: 'past-continuous', time: 'past', aspect: 'continuous', common: true,
    name: '过去进行时', formula: 'was/were doing',
    active: '主语 + was / were + doing', passive: 'was / were being done',
    en: 'She was writing when I called.', zh: '我打电话时她正在写信。',
    use: '表示过去某一时刻或某段时间内正在进行的动作，常与 when、while 从句搭配。',
    timeNote: '覆盖过去某时点前后的一小段「正在发生」区间。',
    tl: { x: 40, w: 230, span: 120 }
  },
  {
    id: 'past-perfect', time: 'past', aspect: 'perfect', common: true,
    name: '过去完成时', formula: 'had done',
    active: '主语 + had + 过去分词', passive: 'had been done',
    en: 'She had written the letter before lunch.', zh: '午饭前她已写完了信。',
    use: '表示「过去的过去」：到过去某个时点为止已经完成的动作，常与 by the time、before 连用。',
    timeNote: '从过去某时点之前开始，箭头指向过去的参照点（动作完成于参照点之前）。',
    tl: { x: 40, w: 230, arrow: [90, 240] }
  },
  {
    id: 'past-perfect-continuous', time: 'past', aspect: 'perfectContinuous', common: false,
    name: '过去完成进行时', formula: 'had been doing',
    active: '主语 + had been + doing', passive: '（无被动 / 极少用）',
    en: 'She had been writing for two hours when he came.', zh: '他来时她已连续写了两个小时。',
    use: '表示到过去某时点为止一直在进行的动作，强调持续的过程与时长。',
    timeNote: '从过去更早处持续延伸到过去参照点，强调「一直写到那时」。',
    tl: { x: 40, w: 230, arrow: [80, 240] }
  },
  // —— 现在 ——
  {
    id: 'present-simple', time: 'present', aspect: 'simple', common: true,
    name: '一般现在时', formula: 'do / does',
    active: '主语 + do / does（三单加 -s/-es）', passive: 'am / is / are + done',
    en: 'She writes a letter every week.', zh: '她每周写一封信。',
    use: '表示经常性、习惯性动作或客观事实、普遍真理；常与 always、usually、every day 连用。',
    timeNote: '覆盖以现在为中心的习惯性时间带（不锚定某一点，可前后延伸）。',
    tl: { x: 290, w: 180, point: 380 }
  },
  {
    id: 'present-continuous', time: 'present', aspect: 'continuous', common: true,
    name: '现在进行时', formula: 'am/is/are doing',
    active: '主语 + am / is / are + doing', passive: 'am / is / are being done',
    en: 'She is writing a letter now.', zh: '她现在正在写信。',
    use: '表示此刻或现阶段正在进行的动作，也可表已安排好的将来（We are leaving tomorrow.）。',
    timeNote: '覆盖现在时刻前后的一小段「正在发生」区间。',
    tl: { x: 290, w: 180, span: 332 }
  },
  {
    id: 'present-perfect', time: 'present', aspect: 'perfect', common: true,
    name: '现在完成时', formula: 'have/has done',
    active: '主语 + have / has + 过去分词', passive: 'have / has been done',
    en: 'She has written three letters today.', zh: '她今天已经写了三封信。',
    use: '表示过去发生的动作对现在有影响（结果/经历），或从过去延续到现在（for/since）；不与具体过去时间点连用。',
    timeNote: '从过去某处开始，箭头延伸到「现在」参照点：动作完成或延续至今。',
    tl: { x: 150, w: 220, arrow: [160, 374] }
  },
  {
    id: 'present-perfect-continuous', time: 'present', aspect: 'perfectContinuous', common: false,
    name: '现在完成进行时', formula: 'have/has been doing',
    active: '主语 + have / has been + doing', passive: '（无被动 / 极少用）',
    en: 'She has been writing since nine o\'clock.', zh: '她从九点起一直在写信。',
    use: '表示从过去某时开始一直持续到现在的动作，可能刚停止，也可能继续下去。',
    timeNote: '从过去某处持续延伸到「现在」，强调持续过程本身。',
    tl: { x: 130, w: 240, arrow: [140, 374] }
  },
  // —— 将来 ——
  {
    id: 'future-simple', time: 'future', aspect: 'simple', common: true,
    name: '一般将来时', formula: 'will do',
    active: '主语 + will / shall + do', passive: 'will be done',
    en: 'She will write a letter tomorrow.', zh: '她明天会写一封信。',
    use: '表示将来发生的动作或状态；will 表临时决定或预测，be going to 表事先计划。',
    timeNote: '覆盖将来的一个时间段。',
    tl: { x: 490, w: 230, point: 600 }
  },
  {
    id: 'future-continuous', time: 'future', aspect: 'continuous', common: false,
    name: '将来进行时', formula: 'will be doing',
    active: '主语 + will be + doing', passive: '（无被动 / 极少用）',
    en: 'She will be writing at eight tonight.', zh: '今晚八点她会在写信。',
    use: '表示将来某时点正在进行的动作，语气比一般将来更「按计划进行」。',
    timeNote: '覆盖将来某时点前后的一小段「正在发生」区间。',
    tl: { x: 490, w: 230, span: 552 }
  },
  {
    id: 'future-perfect', time: 'future', aspect: 'perfect', common: false,
    name: '将来完成时', formula: 'will have done',
    active: '主语 + will have + 过去分词', passive: 'will have been done',
    en: 'She will have written the report by Friday.', zh: '到周五她就写完报告了。',
    use: '表示到将来某个时点为止将已完成的动作，常与 by + 将来时间连用。',
    timeNote: '从现在（或将来某处）开始，箭头指向将来的参照点：参照点之前完成。',
    tl: { x: 290, w: 420, arrow: [390, 660] }
  },
  {
    id: 'future-perfect-continuous', time: 'future', aspect: 'perfectContinuous', common: false,
    name: '将来完成进行时', formula: 'will have been doing',
    active: '主语 + will have been + doing', passive: '（无被动）',
    en: 'By May, she will have been writing for a year.', zh: '到五月她就持续写作一年了。',
    use: '表示到将来某时点为止将一直持续的动作，强调持续的时长。',
    timeNote: '从现在或过去某处持续延伸到将来参照点。',
    tl: { x: 290, w: 420, arrow: [380, 660] }
  },
  // —— 过去将来 ——
  {
    id: 'pastFuture-simple', time: 'pastFuture', aspect: 'simple', common: true,
    name: '一般过去将来时', formula: 'would do',
    active: '主语 + would + do', passive: 'would be done',
    en: 'She said she would write a letter.', zh: '她说她要写一封信。',
    use: '表示从过去看将要发生的动作，主要用于主句为过去时的宾语从句（间接引语）。',
    timeNote: '以过去某时点为原点望向将来（虚线覆盖）：过去说到、后来会发生的动作。',
    tl: { x: 150, w: 550, dash: true, arrow: [160, 640] }
  },
  {
    id: 'pastFuture-continuous', time: 'pastFuture', aspect: 'continuous', common: false,
    name: '过去将来进行时', formula: 'would be doing',
    active: '主语 + would be + doing', passive: '（无被动 / 极少用）',
    en: 'She said she would be writing all evening.', zh: '她说她整个晚上都会在写信。',
    use: '表示从过去某时点看，将来某段时间内将正在进行的动作。',
    timeNote: '从过去原点望向将来：将来某段「正在发生」区间。',
    tl: { x: 150, w: 550, dash: true, span: 500 }
  },
  {
    id: 'pastFuture-perfect', time: 'pastFuture', aspect: 'perfect', common: false,
    name: '过去将来完成时', formula: 'would have done',
    active: '主语 + would have + 过去分词', passive: 'would have been done',
    en: 'She said she would have finished it by ten.', zh: '她说她十点前就能写完。',
    use: '表示从过去某时点看，到将来某时点为止将已完成的动作。',
    timeNote: '从过去原点出发，箭头指向将来参照点：参照点之前完成。',
    tl: { x: 150, w: 550, dash: true, arrow: [160, 600] }
  },
  {
    id: 'pastFuture-perfect-continuous', time: 'pastFuture', aspect: 'perfectContinuous', common: false,
    name: '过去将来完成进行时', formula: 'would have been doing',
    active: '主语 + would have been + doing', passive: '（无被动）',
    en: 'She said by June she would have been writing for two years.', zh: '她说到六月她就持续写作两年了。',
    use: '表示从过去某时点看到将来某时点为止将一直持续的动作，极少使用。',
    timeNote: '从过去原点持续延伸到将来参照点，强调持续时长。',
    tl: { x: 150, w: 550, dash: true, arrow: [160, 600] }
  }
]

// 矩阵取格：time × aspect → 时态对象（找不到返回 null，由模板 v-if 兜底）
function tenseOf(timeId, aspectId) {
  return TENSES.find((t) => t.time === timeId && t.aspect === aspectId) || null
}

// 常用时态集合
const COMMON_IDS = TENSES.filter((t) => t.common).map((t) => t.id)

// 矩阵单元格样式
function matrixCellClass(t) {
  if (!t) return 'bg-muted/30 text-muted-foreground cursor-default'
  if (onlyCommon.value && !t.common) return 'bg-muted/30 text-muted-foreground/50 border-border cursor-not-allowed'
  const selected = t.id === selectedTenseId.value
  const base = selected
    ? 'bg-primary text-primary-foreground border-primary'
    : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
  return base
}
// ===== DATA-END =====

// ---------- 响应式状态 ----------
const onlyCommon = ref(false)
const selectedTenseId = ref(null)

// ---------- 派生 ----------
const selectedTense = computed(() => (TENSES.find((t) => t.id === selectedTenseId.value) || null))
const visibleTenses = computed(() => (onlyCommon.value ? TENSES.filter((t) => t.common) : TENSES))
const timelineAria = computed(() => (selectedTense.value ? `${selectedTense.value.name}时间轴区间示意` : '英语时态时间轴，未选中任何时态'))

// ---------- 交互（浏览器 API 仅在回调内，SSR 安全） ----------
function selectTense(t) {
  if (!t) return
  if (onlyCommon.value && !t.common) return
  selectedTenseId.value = t.id
  trackEvent('工具结果', '时态展开', 'english-tense-reference')
}

onMounted(() => {
  addRecentTool('english-tense-reference')
})
</script>

<style scoped>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  .no-print {
    display: none !important;
  }
}
</style>
