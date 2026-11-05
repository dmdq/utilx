<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">纸张克重换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">gsm 与美制 lb 按纸种基准互换：书纸 25×38、Bond 17×22、铜版纸、卡纸 20×26 各口径对照，附令重计算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线纸张克重换算工具：按「基准面积 × 500 张」的令重口径把克重 gsm 与美制磅数 lb 互换——书纸/双胶纸（25×38 in 基准）、Bond 办公纸（17×22 in 基准）、
        铜版纸（coated text，25×38 in 基准）、卡纸/封面纸（20×26 in 基准）四种口径分别换算（系数 lb ≈ gsm × 基准面积 ÷ 1406），任一纸种任一方向输入、四口径联动对照；
        附各纸种常见克重/磅数档位表（书纸 30-100 lb、Bond 16-32 lb、铜版 80-300 gsm、卡纸 60-130 lb，点行即载入换算），
        以及令重小算（gsm × 长 × 宽 × 张数 → kg，预置 A4/A3/Letter/全张尺寸）。美制 lb 为什么不是纸重、铜版纸和书纸 lb 为什么不可直接比，见下方说明。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Layers class="w-5 h-5 mr-2 text-primary" /> 选择纸种与方向
        </h2>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="t in PAPER_TYPES"
            :key="t.id"
            @click="paperType = t.id"
            class="px-2 py-2 rounded-lg border text-[11px] font-semibold transition"
            :class="paperType === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            :title="t.basis"
          >
            {{ t.name }}
          </button>
        </div>
        <p class="text-[10px] text-muted-foreground -mt-1">当前基准：{{ currentType.basis }}（基准令 {{ LB_REAM_SHEETS }} 张）</p>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            @click="direction = 'gsm'"
            class="px-2 py-2 rounded-lg border text-xs font-semibold transition"
            :class="direction === 'gsm' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
          >
            gsm → lb
          </button>
          <button
            @click="direction = 'lb'"
            class="px-2 py-2 rounded-lg border text-xs font-semibold transition"
            :class="direction === 'lb' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
          >
            lb → gsm
          </button>
        </div>

        <div>
          <label class="text-xs text-muted-foreground">{{ direction === 'gsm' ? '输入克重（g/m²）' : `输入磅数（${currentType.name}口径 lb）` }}</label>
          <input
            v-model="inputValue"
            type="number"
            min="0"
            step="any"
            :placeholder="direction === 'gsm' ? '如 75' : '如 20'"
            class="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>lb 必须先选定纸种口径才有意义：同样是「20 lb」，Bond 口径 ≈ 75 gsm，书纸口径只有 ≈ 29.6 gsm。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyAnchor('bond', 'gsm', 75)"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 75 gsm Bond
          </button>
          <button
            @click="applyAnchor('book', 'lb', 50)"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 50 lb 书纸
          </button>
          <button
            @click="applyAnchor('coated', 'gsm', 157)"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 157 gsm 铜版
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用锚点 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">常用锚点（点击载入）</p>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="a in anchorRows"
              :key="a.key"
              @click="applyAnchor(a.type, a.dir, a.value)"
              class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition text-center"
            >
              {{ a.text }}
            </button>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 令重计算（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <FileText class="w-5 h-5 mr-2 text-primary" /> 四口径对照结果
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
              :class="r.id === paperType ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
            >
              <div>
                <p class="text-sm font-semibold text-foreground">{{ r.name }}
                  <span v-if="r.id === paperType" class="ml-1.5 text-[10px] font-normal text-primary">当前输入口径</span>
                </p>
                <p class="text-[11px] text-muted-foreground">{{ r.basis }}</p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold font-mono" :class="r.id === paperType ? 'text-primary' : 'text-foreground'">
                  {{ r.value === null ? '—' : fmtGsm(r.value) }}
                </p>
                <p class="text-[10px] text-muted-foreground font-mono">{{ r.unitText }}</p>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 lb = 453.59237 g（精确定义）；美制「磅数」= 基准令 500 张的总磅重，换算式 lb = gsm × 基准面积(m²) × 500 ÷ 453.59237，即 lb ≈ gsm × 基准面积(in²) ÷ 1406。
            四个口径的 lb 数字互不相等、也互不可比：「20 lb bond ≈ 50 lb book ≈ 75 gsm」指同一张纸的两种市场叫法。铜版纸与书纸共用 25×38 基准，档位习惯不同但换算式相同。
          </p>
        </div>

        <!-- 令重计算卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 令重小算（gsm × 长 × 宽 × 张数 → kg）
          </h2>
          <p class="text-xs text-muted-foreground mb-4">按成品单张尺寸直接算重，适合估快递、报价与库容。印刷行话的「令重」按全张纸计算，选全张预置即可。</p>

          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="p in SIZE_PRESETS"
              :key="p.label"
              @click="applySizePreset(p)"
              class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
            >
              {{ p.label }}
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <label class="block">
              <span class="text-xs text-muted-foreground">克重（gsm）</span>
              <input
                v-model="reamGsm"
                type="number"
                min="0"
                step="any"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">长（m）</span>
              <input
                v-model="reamLen"
                type="number"
                min="0"
                step="any"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">宽（m）</span>
              <input
                v-model="reamWid"
                type="number"
                min="0"
                step="any"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">张数</span>
              <input
                v-model="reamSheets"
                type="number"
                min="0"
                step="any"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总重</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ reamKgText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">kg</span></p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-center mb-3">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">单张重</p>
              <p class="text-base font-bold text-foreground font-mono">{{ sheetWeightText }} g</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">单张面积</p>
              <p class="text-base font-bold text-foreground font-mono">{{ sheetAreaText }} m²</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>「一令」习惯指 500 张，但印刷计价常按「全张 × 500」（一令全张裁 A4 可得 16 张，即 8000 张 A4）。箱板纸/牛皮纸按每千平方英尺磅数（MSF）计价时与本工具口径不同，采购合同务必写明基准。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        gsm（g/m²）是每平方米克数，各国通用；美制 lb（磅数）不是纸的重量，而是「基准面积一张令（500 张）的总磅重」——基准面积随纸种（书纸 25×38 in、Bond 17×22 in、卡纸 20×26 in）而不同，所以同一种纸在不同口径下「磅数」完全不同。本工具换算按精确定义计算，市售对照表常按 ±5 gsm 取整。
      </p>
    </div>

    <!-- 常见档位对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Layers class="w-5 h-5 mr-2 text-primary" /> 常见档位对照（{{ currentType.name }}口径，点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">{{ currentGradeCaption }}</p>

      <div class="overflow-x-auto">
        <div class="min-w-[560px]">
          <div class="grid grid-cols-[0.7fr_0.8fr_0.8fr_1.8fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>档位</span><span>{{ currentType.id === 'coated' ? 'gsm' : '磅数 lb' }}</span><span>{{ currentType.id === 'coated' ? '≈ lb' : '≈ gsm' }}</span><span>说明</span>
          </div>
          <button
            v-for="row in gradeRows"
            :key="row.key"
            @click="loadGrade(row)"
            class="w-full grid grid-cols-[0.7fr_0.8fr_0.8fr_1.8fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.key }}</span>
            <span class="font-mono text-foreground">{{ row.primaryText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.convertedText }}</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>gsm 是什么？美制「磅数」又是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          gsm（g/m²）是纸张定量：每平方米纸重多少克，全世界通用的法定口径，中国标准 GB/T 也用它——A4 复印纸「80 克」就是 80 gsm。
          美制 lb（pound basis weight，磅数）的历史口径完全不同：它指「以该纸种的基准尺寸（basic size）裁出 500 张（一令基准令）称出的总磅重」。
          书纸基准是 25×38 英寸（950 in²）、Bond 办公纸是 17×22 英寸（374 in²）、卡纸/封面是 20×26 英寸（520 in²）。
          换算式：lb = gsm × 基准面积(m²) × 500 ÷ 453.59237（1 lb 精确等于 453.59237 g），工程速记为 lb ≈ gsm × 基准面积(in²) ÷ 1406。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么美制 lb 不是纸重？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为 lb 数字里没有「每张多重」的信息，只有「一令基准张数总重」——而基准张的面积随纸种变。同一张 75 gsm 的纸：
          按 Bond 口径（17×22 基准）称出来约 20 lb，按书纸口径（25×38 基准）称出来约 50 lb，按卡纸口径（20×26）约 28.9 lb。
          纸张本身一克未变，lb 数字却差了近三倍——这就是「20 lb 纸」在美国指办公打印纸（薄），而国内听上去像厚卡纸的原因。
          所以拿 lb 数字直接对比纸的厚薄毫无意义，必须先问「哪种基准的 lb」再换算回 gsm。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">铜版纸和书纸的 lb 不可直接比</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          更容易踩的坑：美国市场里 coated text（铜版纸书页口径）与 book/text（书纸）共用 25×38 基准，数值上可以换算；
          但 coated cover（铜版卡纸）用 20×26 基准——「100 lb cover」≈ 270 gsm，「100 lb text」只有 ≈ 148 gsm，同一个 100 lb 差了近一倍。
          国内印刷厂把铜版纸按 gsm（80/105/128/157/200/250/300 是常见档）报价，进口纸商按 lb 报价，落地前务必换算到 gsm 再比价，
          且要确认对方 lb 是 text 口径还是 cover 口径。此外市售对照表常有 ±5 gsm 的取整习惯（如 157 gsm 标 106 lb 也标 110 lb），以精确计算为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">令重怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          令重（kg）= 克重(gsm) × 长(m) × 宽(m) × 张数 ÷ 1000。例：A4（0.297 × 0.210 = 0.06237 m²）80 gsm 单张约 4.99 g，500 张一令约 2.495 kg——这就是「一箱 8 令 A4 约 20 kg」的来历。
          印刷报价的「令重」按全张纸算：正度全张 787×1092 mm（0.8594 m²）、大度全张 889×1194 mm（1.0615 m²），157 gsm 大度全张一令约 83.3 kg，大度全张可切 A4 约 16.8 张。
          做物流与库存估算时直接用上方令重小算，选预置尺寸即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">75 gsm 纸是多少磅？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 Bond 口径（17×22 基准）约 19.95 lb ≈ 20 lb，这是美国办公复印纸的常见叫法；同一张纸按书纸 25×38 口径则约 50 lb。先确认口径再看数字，两个 lb 指的是同一种纸。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">157 gsm 铜版纸等于多少 lb？</h3>
            <p class="text-sm text-muted-foreground mt-1">157 gsm ≈ 106 lb（coated text 口径，25×38 基准）。若对方按 cover 口径报价，157 gsm 只对应约 74 lb cover——「106 lb」和「74 lb」都可能是它，取决于基准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">一令 A4 80g 的纸有多重？</h3>
            <p class="text-sm text-muted-foreground mt-1">A4 面积 0.06237 m²，80 gsm 单张约 4.99 g，500 张约 2.495 kg（约 2.5 kg）。物流估算 8 令一箱约 20 kg，另加包装约 0.5-1 kg。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与令重计算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'paper-weight-convert'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  FileText, Layers, Scale, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'paper-weight-convert'

// ---------- SEO ----------
useSeoMeta({
  title: '纸张克重换算 - 在线gsm与磅数lb互换（书纸/Bond/铜版/卡纸口径）工具',
  description: '免费在线纸张克重换算，gsm 与美制磅数 lb 按纸种基准精确互换：书纸 25×38、Bond 17×22、铜版纸、卡纸 20×26 四口径对照表，附 80/128/157/200/300gsm 铜版常见档与令重计算（gsm×长×宽×张数→kg），纯浏览器本地运行不上传',
  keywords: '纸张克重换算,gsm换算,磅纸,纸磅数对照,157gsm多少磅,令重计算,铜版纸克重',
  author: '有条工具',
  ogTitle: '纸张克重换算 - 在线gsm与磅数lb互换工具 | 有条工具',
  ogDescription: 'gsm 与美制 lb 按纸种基准互换，四口径对照与令重小算，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/paper-weight-convert',
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
          name: '纸张克重换算器',
          url: 'https://www.util.cn/tools/paper-weight-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['gsm 与美制 lb 按纸种基准互换', '书纸 25×38 / Bond 17×22 / 铜版 coated / 卡纸 20×26 四口径联动对照', '各纸种常见克重/磅数档位表（铜版 80-300gsm）', '令重计算 gsm×长×宽×张数→kg（预置 A4/A3/Letter/全张）', 'lb 基准面积口径科普（为什么 lb 不是纸重）', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '纸张克重换算器', item: 'https://www.util.cn/tools/paper-weight-convert/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '75 gsm 纸是多少磅？',
              acceptedAnswer: { '@type': 'Answer', text: '按 Bond 口径（17×22 基准）约 19.95 lb ≈ 20 lb；同一张纸按书纸 25×38 口径则约 50 lb。两个 lb 指同一种纸，先确认口径再看数字。' }
            },
            {
              '@type': 'Question',
              name: '157 gsm 铜版纸等于多少 lb？',
              acceptedAnswer: { '@type': 'Answer', text: '157 gsm ≈ 106 lb（coated text 口径，25×38 基准）；按 cover 口径只对应约 74 lb cover。报价前务必确认 lb 的基准。' }
            },
            {
              '@type': 'Question',
              name: '一令 A4 80g 的纸有多重？',
              acceptedAnswer: { '@type': 'Answer', text: 'A4 面积 0.06237 m²，80 gsm 单张约 4.99 g，500 张约 2.495 kg。8 令一箱约 20 kg，另加包装约 0.5-1 kg。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与令重计算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const GRAMS_PER_POUND = 453.59237  // 1 lb 精确定义
const LB_REAM_SHEETS = 500         // 美制基准令张数
const IN2_TO_M2 = 0.0254 * 0.0254  // 1 in² = 0.00064516 m²（精确定义）

// 纸种口径：basis 为美制基准尺寸（基准令 500 张的总磅重口径）
const PAPER_TYPES = [
  { id: 'book', name: '书纸/双胶', basis: '25 × 38 in（950 in²）基准', basisIn2: 950 },
  { id: 'bond', name: 'Bond/复印纸', basis: '17 × 22 in（374 in²）基准', basisIn2: 374 },
  { id: 'coated', name: '铜版纸', basis: '25 × 38 in（950 in²）coated text', basisIn2: 950 },
  { id: 'cover', name: '卡纸/封面', basis: '20 × 26 in（520 in²）基准', basisIn2: 520 }
]

function paperTypeById(id) {
  return PAPER_TYPES.find((t) => t.id === id) || null
}

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附到整值，
// 使往返换算（如 bar→psi→bar）精确回到原值，同时不损失常规换算结果的精度
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// gsm → 该基准的磅数：lb = gsm × 基准面积(m²) × 500 ÷ 453.59237（≈ gsm × 基准in² / 1406）
function gsmToLb(gsm, basisIn2) {
  if (!Number.isFinite(gsm) || !Number.isFinite(basisIn2) || basisIn2 <= 0) return NaN
  return cleanFloat((gsm * basisIn2 * IN2_TO_M2 * LB_REAM_SHEETS) / GRAMS_PER_POUND)
}

// 该基准的磅数 → gsm：gsm = lb × 453.59237 ÷ (基准面积(m²) × 500)
function lbToGsm(lb, basisIn2) {
  if (!Number.isFinite(lb) || !Number.isFinite(basisIn2) || basisIn2 <= 0) return NaN
  return cleanFloat((lb * GRAMS_PER_POUND) / (basisIn2 * IN2_TO_M2 * LB_REAM_SHEETS))
}

// 跨口径换算：fromBasis 的 lb → gsm → toBasis 的 lb（展示「同一个 lb 数字在不同纸种里指什么」）
function lbAcrossBasis(lb, fromBasisIn2, toBasisIn2) {
  const gsm = lbToGsm(lb, fromBasisIn2)
  if (!Number.isFinite(gsm)) return NaN
  return gsmToLb(gsm, toBasisIn2)
}

// 令重：kg = gsm × 长(m) × 宽(m) × 张数 ÷ 1000
function reamWeightKg(gsm, lenM, widM, sheets) {
  if (!Number.isFinite(gsm) || !Number.isFinite(lenM) || !Number.isFinite(widM) || !Number.isFinite(sheets)) return NaN
  return cleanFloat((gsm * lenM * widM * sheets) / 1000)
}

// 输入解析：空串 / 非数字 / 负数一律视为无效
function parsePaperInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtGsm(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0005) return v.toExponential(2)
  const d = a >= 1000 ? 1 : a >= 100 ? 2 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const paperType = ref('bond')
const direction = ref('gsm') // 'gsm'：输入克重 → 显示各口径 lb；'lb'：输入当前口径 lb → 显示各口径 lb
const inputValue = ref('75')

const currentType = computed(() => paperTypeById(paperType.value) || PAPER_TYPES[0])
const parsed = computed(() => parsePaperInput(inputValue.value))

// 各口径 lb 对照：lb 输入先折回 gsm（按当前口径），再统一换算到各口径 lb
const lbValues = computed(() => {
  if (parsed.value === null) return null
  if (direction.value === 'gsm') {
    return PAPER_TYPES.map((t) => ({ id: t.id, lb: gsmToLb(parsed.value, t.basisIn2), gsm: parsed.value }))
  }
  const gsm = lbToGsm(parsed.value, currentType.value.basisIn2)
  if (!Number.isFinite(gsm)) return null
  return PAPER_TYPES.map((t) => ({ id: t.id, lb: gsmToLb(gsm, t.basisIn2), gsm }))
})

const resultRows = computed(() =>
  PAPER_TYPES.map((t) => {
    const row = lbValues.value ? lbValues.value.find((r) => r.id === t.id) : null
    return {
      id: t.id,
      name: t.name,
      basis: t.basis,
      value: row ? row.lb : null,
      unitText: direction.value === 'gsm' ? 'lb' : `lb（≈ ${row ? fmtGsm(row.gsm) : '—'} gsm）`
    }
  })
)
const canCopy = computed(() => lbValues.value !== null)

const copyText = computed(() => {
  if (lbValues.value === null) return ''
  const srcText = direction.value === 'gsm'
    ? `输入: ${parsed.value} gsm（${currentType.value.name}口径对照）`
    : `输入: ${parsed.value} lb（${currentType.value.name}口径）`
  const lines = resultRows.value.map((r) => `${r.name}: ${r.value === null ? '—' : fmtGsm(r.value)} lb`)
  return [srcText, ...lines].join('\n')
})

function applyAnchor(typeId, dir, value) {
  paperType.value = typeId
  direction.value = dir
  inputValue.value = String(value)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const anchorRows = [
  { key: 'bond20', type: 'bond', dir: 'gsm', value: 75, text: '75 gsm ≈ 20 lb bond' },
  { key: 'book50', type: 'book', dir: 'lb', value: 50, text: '50 lb 书纸 ≈ 74 gsm' },
  { key: 'coated157', type: 'coated', dir: 'gsm', value: 157, text: '157 gsm 铜版 ≈ 106 lb' },
  { key: 'cover80', type: 'cover', dir: 'lb', value: 80, text: '80 lb 卡纸 ≈ 216 gsm' },
  { key: 'a4ream', type: 'bond', dir: 'gsm', value: 80, text: '80 gsm 复印纸（A4 令重 2.5 kg）' }
]

// 各纸种常见档位：lb 档（书纸/Bond/卡纸）或 gsm 档（铜版）
const GRADE_TABLES = {
  book: [
    { key: '30 lb', v: 30, dir: 'lb', note: '轻量书页、词典纸（≈44 gsm）' },
    { key: '40 lb', v: 40, dir: 'lb', note: '小说内页（≈59 gsm）' },
    { key: '50 lb', v: 50, dir: 'lb', note: '通用书页 ≈ 74 gsm，与 20 lb bond 同纸' },
    { key: '60 lb', v: 60, dir: 'lb', note: '杂志内页（≈89 gsm）' },
    { key: '70 lb', v: 70, dir: 'lb', note: '画册内页（≈104 gsm）' },
    { key: '80 lb', v: 80, dir: 'lb', note: '宣传单/海报（≈118 gsm）' },
    { key: '100 lb', v: 100, dir: 'lb', note: '高质量单张（≈148 gsm）' }
  ],
  bond: [
    { key: '16 lb', v: 16, dir: 'lb', note: '航空信纸（≈60 gsm）' },
    { key: '20 lb', v: 20, dir: 'lb', note: '美标复印纸 ≈ 75 gsm（国内 70-80g 档）' },
    { key: '24 lb', v: 24, dir: 'lb', note: '高端信头纸（≈90 gsm）' },
    { key: '28 lb', v: 28, dir: 'lb', note: '重型打印纸（≈105 gsm）' },
    { key: '32 lb', v: 32, dir: 'lb', note: '卡片式通知（≈120 gsm）' }
  ],
  coated: [
    { key: '80 gsm', v: 80, dir: 'gsm', note: '轻涂/内页（≈54 lb text）' },
    { key: '105 gsm', v: 105, dir: 'gsm', note: '画册内页（≈71 lb text）' },
    { key: '128 gsm', v: 128, dir: 'gsm', note: '铜版内页主流档（≈86 lb text）' },
    { key: '157 gsm', v: 157, dir: 'gsm', note: '宣传单主流档 ≈ 106 lb text' },
    { key: '200 gsm', v: 200, dir: 'gsm', note: '海报/封面（≈135 lb text）' },
    { key: '250 gsm', v: 250, dir: 'gsm', note: '卡片/封面（≈169 lb text ≈ 92 lb cover）' },
    { key: '300 gsm', v: 300, dir: 'gsm', note: '名片/卡头（≈203 lb text ≈ 111 lb cover）' }
  ],
  cover: [
    { key: '60 lb', v: 60, dir: 'lb', note: '薄卡纸（≈162 gsm）' },
    { key: '65 lb', v: 65, dir: 'lb', note: '封面卡（≈176 gsm）' },
    { key: '80 lb', v: 80, dir: 'lb', note: '名片常用档 ≈ 216 gsm' },
    { key: '90 lb', v: 90, dir: 'lb', note: '厚卡（≈243 gsm）' },
    { key: '100 lb', v: 100, dir: 'lb', note: '高档名片 ≈ 270 gsm' },
    { key: '110 lb', v: 110, dir: 'lb', note: '索引卡（≈297 gsm）' },
    { key: '130 lb', v: 130, dir: 'lb', note: '包装卡头（≈352 gsm）' }
  ]
}

// 档位行展示：lb 档换 gsm；gsm 档换 lb（铜版档同时给 text/cover 双口径 lb）
const gradeRows = computed(() => {
  const rows = GRADE_TABLES[currentType.value.id] || []
  return rows.map((g) => {
    const basisIn2 = currentType.value.basisIn2
    if (g.dir === 'lb') {
      const gsm = lbToGsm(g.v, basisIn2)
      return {
        key: g.key,
        v: g.v,
        dir: 'lb',
        primaryText: `${g.v} lb`,
        convertedText: `≈ ${fmtGsm(gsm)} gsm`,
        note: g.note
      }
    }
    const lb = gsmToLb(g.v, basisIn2)
    const lbCover = gsmToLb(g.v, PAPER_TYPES[3].basisIn2)
    const extra = currentType.value.id === 'coated' ? `（cover 口径 ≈ ${fmtGsm(lbCover)} lb）` : ''
    return {
      key: g.key,
      v: g.v,
      dir: 'gsm',
      primaryText: `${g.v} gsm`,
      convertedText: `≈ ${fmtGsm(lb)} lb ${extra}`,
      note: g.note
    }
  })
})

const currentGradeCaption = computed(() => {
  if (currentType.value.id === 'coated') {
    return '铜版纸市场按 gsm 分档（80/105/128/157/200/250/300），lb 列按 25×38（text）口径换算并附 cover 口径参考；点击行载入 gsm 换算。'
  }
  return `美制市场按磅数分档，lb 列按 ${currentType.value.basis} 换算为 gsm；点击行载入该磅数换算。`
})

function loadGrade(row) {
  applyAnchor(currentType.value.id, row.dir, row.v)
}

// ---------- 令重计算状态 ----------
const SIZE_PRESETS = [
  { label: 'A4', len: 0.297, wid: 0.210 },
  { label: 'A3', len: 0.420, wid: 0.297 },
  { label: 'Letter', len: 0.2794, wid: 0.2159 },
  { label: '正度全张', len: 1.092, wid: 0.787 },
  { label: '大度全张', len: 1.194, wid: 0.889 }
]

const reamGsm = ref('80')
const reamLen = ref('0.297')
const reamWid = ref('0.210')
const reamSheets = ref('500')

const reamGsmNum = computed(() => parsePaperInput(reamGsm.value))
const reamLenNum = computed(() => parsePaperInput(reamLen.value))
const reamWidNum = computed(() => parsePaperInput(reamWid.value))
const reamSheetsNum = computed(() => parsePaperInput(reamSheets.value))

const reamKg = computed(() => reamWeightKg(reamGsmNum.value, reamLenNum.value, reamWidNum.value, reamSheetsNum.value))
const reamKgText = computed(() => (Number.isFinite(reamKg.value) ? fmtGsm(reamKg.value) : '—'))

const sheetAreaText = computed(() => {
  if (reamLenNum.value === null || reamWidNum.value === null) return '—'
  const a = cleanFloat(reamLenNum.value * reamWidNum.value)
  return Number.isFinite(a) ? fmtGsm(a) : '—'
})
const sheetWeightText = computed(() => {
  if (reamGsmNum.value === null || reamLenNum.value === null || reamWidNum.value === null) return '—'
  const w = cleanFloat(reamGsmNum.value * reamLenNum.value * reamWidNum.value)
  return Number.isFinite(w) ? fmtGsm(w) : '—'
})

function applySizePreset(p) {
  reamLen.value = String(p.len)
  reamWid.value = String(p.wid)
}

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
    if (PAPER_TYPES.some(t => t.id === s.paperType)) paperType.value = s.paperType
    if (s.direction === 'gsm' || s.direction === 'lb') direction.value = s.direction
    if (typeof s.inputValue === 'string' && parsePaperInput(s.inputValue) !== null) inputValue.value = s.inputValue
    if (typeof s.reamGsm === 'string' && parsePaperInput(s.reamGsm) !== null) reamGsm.value = s.reamGsm
    if (typeof s.reamLen === 'string' && parsePaperInput(s.reamLen) !== null) reamLen.value = s.reamLen
    if (typeof s.reamWid === 'string' && parsePaperInput(s.reamWid) !== null) reamWid.value = s.reamWid
    if (typeof s.reamSheets === 'string' && parsePaperInput(s.reamSheets) !== null) reamSheets.value = s.reamSheets
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([paperType, direction, inputValue, reamGsm, reamLen, reamWid, reamSheets], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      paperType: paperType.value,
      direction: direction.value,
      inputValue: inputValue.value,
      reamGsm: reamGsm.value,
      reamLen: reamLen.value,
      reamWid: reamWid.value,
      reamSheets: reamSheets.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
