<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Thermometer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">温度单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">摄氏 °C / 华氏 °F / 开尔文 K / 兰氏 °R 四向精确换算，含绝对零度物理校验与常见温度点对照表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线温度单位换算工具：以摄氏度为基准的精确公式（°F = °C × 9/5 + 32、K = °C + 273.15、°R = (°C + 273.15) × 9/5），
        在摄氏度、华氏度、开尔文、兰氏度四个温度单位之间实时互转，任一单位输入、其余三个联动更新；
        输入低于绝对零度（0 K = −273.15 °C = −459.67 °F）时行内红色提示「低于绝对零度，物理不可能」但保留换算显示；
        附 °C↔°F 一键互换、常用温度点速查卡，以及绝对零度/冰点/室温/体温/沸水/烤箱等常见温度点四单位并列对照表（点行即载入换算）。
        华氏 32 度为什么是冰点、开尔文为什么写作 K 不带度数符号，见下方说明。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Thermometer class="w-5 h-5 mr-2 text-primary" /> 输入温度
        </h2>

        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="u in UNITS"
            :key="u.id"
            @click="inputUnit = u.id"
            class="px-1 py-2 rounded-lg border text-[11px] font-semibold transition"
            :class="inputUnit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            :title="u.name"
          >
            {{ u.symbol }}
          </button>
        </div>

        <div>
          <input
            v-model="inputValue"
            type="number"
            step="any"
            placeholder="如 37，可为负数"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计，温度可为负数；低于绝对零度时给出行内提示，但不清空换算显示。</span>
          </p>
        </div>

        <p
          v-if="belowAbsoluteZero"
          class="text-xs text-red-500 leading-relaxed p-2.5 rounded bg-red-500/10 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>低于绝对零度，物理不可能（0 K = −273.15 °C = −459.67 °F = 0 °R）。下方数值仅为数学换算结果。</span>
        </p>
        <p v-else-if="parsed === null" class="text-xs text-muted-foreground p-2.5 rounded bg-muted/40">
          请输入数值（可为负数），四单位换算结果将实时联动。
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            @click="swapUnits"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition flex items-center gap-1.5"
          >
            <ArrowLeftRight class="w-3 h-3" /> 互换 {{ currentUnit.symbol }} ⇄ {{ swapTargetUnit.symbol }}
          </button>
          <button
            @click="applyPreset(100, 'c')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 100 °C
          </button>
          <button
            @click="applyPreset(-40, 'c')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 −40 °C
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用速查卡 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">常用温度点速查（°C → °F，点击载入）</p>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="q in quickCTable"
              :key="'q' + q.c"
              @click="applyPreset(q.c, 'c')"
              class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition text-center"
            >
              {{ q.c }} °C = {{ q.fText }} °F
            </button>
          </div>
        </div>
      </div>

      <!-- 结果大表（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Thermometer class="w-5 h-5 mr-2 text-primary" /> 四单位换算结果
            </h2>
            <button
              @click="copyResults"
              :disabled="!canCopy"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="r in resultRows"
              :key="r.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border"
              :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
            >
              <div>
                <p class="text-sm font-semibold text-foreground">{{ r.symbol }}
                  <span v-if="r.id === inputUnit" class="ml-1.5 text-[10px] font-normal text-primary">当前输入单位</span>
                </p>
                <p class="text-[11px] text-muted-foreground">{{ r.name }}（{{ r.systemLabel }}）</p>
              </div>
              <p class="text-2xl font-bold font-mono" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                {{ r.value === null ? '—' : fmtTemp(r.value) }}
              </p>
            </div>
          </div>

          <p
            v-if="belowAbsoluteZero"
            class="text-xs text-red-500 mt-4 leading-relaxed"
          >
            ⚠ 当前输入低于绝对零度（0 K），物理上不存在——分子热运动动能不可能低于该极限。显示值仅是公式的数学延伸。
          </p>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            公式：°F = °C × 9/5 + 32；K = °C + 273.15；°R = °F + 459.67 = (°C + 273.15) × 9/5。
            锚点：100 °C = 212 °F = 373.15 K = 671.67 °R；37 °C = 98.6 °F；−40 °C = −40 °F（摄氏与华氏唯一相等的温度点）；
            0 K = −273.15 °C = −459.67 °F。
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        开尔文（K）是 SI 七个基本单位之一，单位符号不带「°」也不读作「度」（300 K 读作「300 开尔文」），0 K 即绝对零度。
        兰氏度（°R，Rankine）是华氏口径的热力学温标：0 °R = 0 K = −459.67 °F，每度大小与华氏度相同，美制工程热力学常用。
        华氏每度只有摄氏的 5/9，刻度更「密」——同样 1 度的体感变化，华氏读数变化 1.8。
      </p>
    </div>

    <!-- 常见温度点对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Thermometer class="w-5 h-5 mr-2 text-primary" /> 常见温度点四单位对照（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">°F / K / °R 列由 °C 列按精确公式自动换算；体温与室温为典型参考值，个体与季节有波动。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
          <div class="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>温度点</span><span>°C</span><span>°F</span><span>K</span><span>°R</span><span>说明</span>
          </div>
          <button
            v-for="row in milestoneRows"
            :key="row.name"
            @click="loadMilestone(row)"
            class="w-full grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.cText }}</span>
            <span class="font-mono text-foreground">{{ row.fText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.kText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.rText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
          </button>
        </div>
      </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>摄氏、华氏、开尔文、兰氏度都是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          四个单位量的是同一个物理量——温度，只是刻度原点与刻度间距不同。
          摄氏度 °C 把标准大气压下水的冰点定为 0、沸点定为 100，中间 100 等分，全世界日常与科学通用；
          华氏度 °F 把纯水冰点定为 32、沸水定为 212，中间恰好 180 等分，美国日常通用；
          开尔文 K 是热力学温标（0 K 为绝对零度），SI 基本单位，科学计算的标准口径；
          兰氏度 °R 是华氏版热力学温标（0 °R = 0 K，刻度间距与 °F 相同），英制工程热力学沿用。
          四者换算只是线性加减乘除，本工具按精确公式实时换算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">摄氏华氏怎么换算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          精确公式双向给出：°F = °C × 9/5 + 32，°C = (°F − 32) × 5/9。
          常用锚点：0 °C = 32 °F（冰点）、100 °C = 212 °F（沸水）、37 °C = 98.6 °F（经典体温口径）、−40 °C = −40 °F（两温标唯一相等的温度点）。
          粗略心算可用「华氏先减 30 再除以 2」：100 °F ≈ (100−30)/2 = 35 °C（精确 37.8 °C），误差适合日常估读，精确数值以本工具为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么华氏 32 度是冰点？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          华氏温标 1724 年由德国物理学家华伦海特（Daniel Gabriel Fahrenheit）定型：他把氯化铵与冰盐混合物的稳定最低温度定为 0 °F，
          纯水冰点落在 32 °F，健康人体温约 96 °F（后来用更准的体温计修正为 98.6 °F）。这样冰点到沸水正好 180 个华氏度——一个便于划分刻度的整数。
          所以「32 度才结冰」不是华氏刻度算错了，而是它的 0 点选在比纯水冰点更低的盐水冰点上：华氏 0 °F 对应约 −17.8 °C。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">开尔文与兰氏度：热力学温标为什么没有「度」？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          热力学温标的零点不是「水结冰」这类人为约定，而是绝对零度——分子热运动动能达到理论最低值的状态，
          精确值为 0 K = −273.15 °C。K 是 SI 七个基本单位之一，按国际规范单位符号不带°、不叫「度」（读「300 开尔文」而非「300 度开」）。
          兰氏度 °R = °F + 459.67，与开尔文的关系是 °R = K × 9/5：同一热力学温标，只是刻度间距改用华氏度，方便与英制单位（BTU 等）配套计算。
          低于绝对零度的输入物理上不可能，本工具会给出行内提示但不清空显示，便于检查公式与笔误。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">摄氏华氏怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">°F = °C × 9/5 + 32，°C = (°F − 32) × 5/9。锚点：0 °C = 32 °F、100 °C = 212 °F、37 °C = 98.6 °F、−40 °C = −40 °F。上方输入任一单位即可四单位联动。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么华氏 32 度是冰点？</h3>
            <p class="text-sm text-muted-foreground mt-1">华氏温标的 0 °F 定在盐水混合物冰点（约 −17.8 °C），纯水冰点自然落在 32 °F，冰点到沸水恰好 180 华氏度。32 是刻度原点选择的结果，不是计算误差。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">37 °C 体温是多少华氏度、多少开尔文？</h3>
            <p class="text-sm text-muted-foreground mt-1">37 °C = 98.6 °F = 310.15 K = 558.27 °R。美剧与美国体温计上的「98.6 degrees」即来源于此；实际人体温 36.1-37.2 °C 波动均属正常。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有温度换算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="TOOL_ID" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Thermometer, ArrowLeftRight, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'temperature-converter'

// ---------- SEO ----------
useSeoMeta({
  title: '温度单位换算 - 摄氏华氏开尔文在线转换工具（°C/°F/K/°R）',
  description: '免费在线温度换算：摄氏度、华氏度、开尔文、兰氏度四向精确互转（°F=°C×9/5+32、K=°C+273.15），附绝对零度/冰点/体温/沸水四单位对照表、「低于绝对零度」物理校验与摄氏华氏换算公式说明，纯浏览器本地运行不上传',
  keywords: '温度换算,摄氏华氏转换,华氏度转摄氏度,开尔文换算,温度单位换算,兰氏度,温度换算器',
  author: '有条工具',
  ogTitle: '温度单位换算 - 摄氏华氏开尔文在线转换工具 | 有条工具',
  ogDescription: '°C/°F/K/°R 四向精确换算，绝对零度物理校验，常见温度点对照表，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/temperature-converter',
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
          name: '温度单位换算器',
          url: 'https://www.util.cn/tools/temperature-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['摄氏 °C / 华氏 °F / 开尔文 K / 兰氏 °R 四向精确互转', '精确公式 °F=°C×9/5+32、K=°C+273.15、°R=(°C+273.15)×9/5', '低于绝对零度行内物理校验提示', '绝对零度/冰点/室温/体温/沸水四单位对照表', '°C↔°F 一键互换', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '温度单位换算器', item: 'https://www.util.cn/tools/temperature-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '摄氏华氏怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '°F = °C × 9/5 + 32，°C = (°F − 32) × 5/9。锚点：0 °C = 32 °F、100 °C = 212 °F、37 °C = 98.6 °F、−40 °C = −40 °F（两温标唯一相等的点）。' }
            },
            {
              '@type': 'Question',
              name: '为什么华氏 32 度是冰点？',
              acceptedAnswer: { '@type': 'Answer', text: '华氏温标 0 °F 定在盐水混合物冰点（约 −17.8 °C），纯水冰点自然落在 32 °F，冰点到沸水恰好 180 华氏度——32 是刻度原点选择的结果。' }
            },
            {
              '@type': 'Question',
              name: '37 °C 体温是多少华氏度、多少开尔文？',
              acceptedAnswer: { '@type': 'Answer', text: '37 °C = 98.6 °F = 310.15 K = 558.27 °R。实际人体温 36.1-37.2 °C 波动均属正常。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有温度换算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- PURE-FNS-START ----------
// 摄氏度为基准的温度换算（温度可为负，与量纲类换算不同）
const ABSOLUTE_ZERO_C = -273.15

const UNITS = [
  { id: 'c', symbol: '°C', name: '摄氏度', systemLabel: '日常·中国标准' },
  { id: 'f', symbol: '°F', name: '华氏度', systemLabel: '美国·英制' },
  { id: 'k', symbol: 'K', name: '开尔文', systemLabel: 'SI 热力学温标' },
  { id: 'r', symbol: '°R', name: '兰氏度', systemLabel: '英制热力学温标' }
]

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附，
// 使往返换算（如 °C→°F→°C）精确回到原值
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → 摄氏度
function toC(value, unitId) {
  if (!Number.isFinite(value)) return NaN
  let c
  switch (unitId) {
    case 'c': c = value; break
    case 'f': c = (value - 32) * 5 / 9; break
    case 'k': c = value - 273.15; break
    case 'r': c = value * 5 / 9 - 273.15; break
    default: return NaN
  }
  return cleanFloat(c)
}

// 摄氏度 → 任意单位：°F = °C×9/5+32；K = °C+273.15；°R = (°C+273.15)×9/5 = °F+459.67
function fromC(c, unitId) {
  if (!Number.isFinite(c)) return NaN
  switch (unitId) {
    case 'c': return cleanFloat(c)
    case 'f': return cleanFloat(c * 9 / 5 + 32)
    case 'k': return cleanFloat(c + 273.15)
    case 'r': return cleanFloat((c + 273.15) * 9 / 5)
    default: return NaN
  }
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertTemp(value, fromId, toId) {
  return fromC(toC(value, fromId), toId)
}

// 是否低于绝对零度（留 1e-9 相对容差，避免浮点尾差把恰好 −273.15 °C 误判为非法）
function isBelowAbsoluteZero(c) {
  if (!Number.isFinite(c)) return false
  return c < ABSOLUTE_ZERO_C - 1e-9
}

// 输入解析：空串/非数字视为无效；温度可为负数，不拦截负值
function parseTempInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// 展示格式化：6 位小数并去尾零；极小/超大值用科学计数
function fmtTemp(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 1e-4 || a >= 1e15) {
    let s = v.toExponential(6)
    s = s.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
    return s
  }
  const s = v.toFixed(6)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

// 互换/预设载入时回填输入框的紧凑字符串（10 位有效数字，避免长尾小数）
function toInputString(v) {
  if (!Number.isFinite(v)) return ''
  return String(Number(v.toPrecision(10)))
}

// 常见温度点（°C 基准，其余单位由公式派生）
const TEMP_MILESTONES = [
  { name: '绝对零度', c: -273.15, note: '0 K，热力学温度下限，只能逼近不可达到' },
  { name: '水的冰点', c: 0, note: '标准大气压下纯水固液平衡，0 °C = 32 °F' },
  { name: '典型室温', c: 25, note: '空调舒适区 22-26 °C，25 °C = 77 °F' },
  { name: '人体正常体温', c: 37, note: '经典口径 37 °C = 98.6 °F，实际 36.1-37.2 °C 波动' },
  { name: '标准大气压沸水', c: 100, note: '100 °C = 212 °F；气压降低沸点下降（高原约 85-95 °C）' },
  { name: '烤箱常用温度', c: 180, note: '180 °C = 356 °F；美式食谱 350 °F ≈ 176.7 °C' }
]
// ---------- PURE-FNS-END ----------

// ---------- 换算状态 ----------
const SWAP_PAIR = { c: 'f', f: 'c', k: 'r', r: 'k' }

const inputUnit = ref('c')
const inputValue = ref('37')

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

const currentUnit = computed(() => unitById(inputUnit.value) || UNITS[0])
const swapTargetUnit = computed(() => unitById(SWAP_PAIR[inputUnit.value]) || UNITS[1])

const parsed = computed(() => parseTempInput(inputValue.value))
const cValue = computed(() => (parsed.value === null ? NaN : toC(parsed.value, inputUnit.value)))
const belowAbsoluteZero = computed(() => isBelowAbsoluteZero(cValue.value))

const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: parsed.value === null ? null : fromC(cValue.value, u.id) }))
)
const canCopy = computed(() => parsed.value !== null)

const copyText = computed(() => {
  if (parsed.value === null) return ''
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtTemp(r.value)}`)
  return [`输入: ${fmtTemp(parsed.value)} ${currentUnit.value.symbol}`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

function loadMilestone(row) {
  applyPreset(row.c, 'c')
}

function swapUnits() {
  const target = SWAP_PAIR[inputUnit.value]
  if (!target) return
  if (parsed.value !== null) {
    const converted = convertTemp(parsed.value, inputUnit.value, target)
    if (Number.isFinite(converted)) inputValue.value = toInputString(converted)
  }
  inputUnit.value = target
  trackEvent('工具使用', '互换单位', TOOL_ID)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const quickCTable = [-40, 0, 25, 37, 100].map((c) => ({
  c,
  fText: fmtTemp(convertTemp(c, 'c', 'f'))
}))

const milestoneRows = TEMP_MILESTONES.map((m) => ({
  name: m.name,
  c: m.c,
  note: m.note,
  cText: fmtTemp(m.c),
  fText: fmtTemp(convertTemp(m.c, 'c', 'f')),
  kText: fmtTemp(convertTemp(m.c, 'c', 'k')),
  rText: fmtTemp(convertTemp(m.c, 'c', 'r'))
}))

// ---------- 复制（浏览器 API 仅在回调中，SSR 安全） ----------
const copied = ref(false)
let copyTimer = null

async function copyResults() {
  if (!canCopy.value) return
  try {
    await navigator.clipboard.writeText(copyText.value)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
const SETTINGS_KEY = `${TOOL_ID}-settings`

function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (UNITS.some(u => u.id === s.inputUnit)) inputUnit.value = s.inputUnit
    if (typeof s.inputValue === 'string' && parseTempInput(s.inputValue) !== null) inputValue.value = s.inputValue
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([inputUnit, inputValue], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      inputUnit: inputUnit.value,
      inputValue: inputValue.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
