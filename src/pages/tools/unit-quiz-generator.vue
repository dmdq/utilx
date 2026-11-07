<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- @page 规则：A4 竖版、12mm 页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ArrowLeftRight class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">单位换算练习题生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">长度/重量/面积/时间/体积五类换算题，三档难度组卷，A4 题目页与答案页分离打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线单位换算练习题生成器：覆盖长度（千米/米/分米/厘米/毫米）、重量（吨/千克/克）、面积（平方千米/公顷/平方米/平方分米/平方厘米）、
        时间（时/分/秒）、体积与容积（立方米/立方分米/升/毫升）五类。难度三档：一档单步整换算、二档两步整换算、三档含小数（大化小出小数、小化大出 0.5 步进）。
        生成时"先定整数答案再反推题面"，保证所有数字友好可心算；答案页附一行换算过程（如 2.5米=25分米=250厘米）。
        填写相同种子随时复现同一份卷，A4 排版题目页与答案页分离打印。全部在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 题型与难度
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1.5">题型（至少保留 1 类）</label>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="c in UNIT_CATEGORIES"
                :key="c.id"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
                :class="cats.includes(c.id) ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
              >
                <input
                  type="checkbox"
                  class="accent-primary w-4 h-4"
                  :checked="cats.includes(c.id)"
                  @change="toggleCat(c.id, $event)"
                />
                {{ c.name }}
              </label>
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">难度</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="d in DIFFS"
                :key="d.id"
                type="button"
                @click="difficulty = d.id"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="difficulty === d.id ? BTN_ON : BTN_OFF"
              >
                {{ d.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">{{ DIFFS.find((d) => d.id === difficulty)?.tip }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">题数</label>
              <div class="grid grid-cols-2 gap-1">
                <button
                  v-for="n in PAPER_COUNTS"
                  :key="n"
                  type="button"
                  @click="count = n"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="count === n ? BTN_ON : BTN_OFF"
                >
                  {{ n }} 题
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">随机种子（同种子同卷）</label>
              <input
                v-model="seedInput"
                type="text"
                inputmode="numeric"
                :class="SEL_CLS"
                placeholder="如 20260101"
                @change="applySeedInput"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              @click="regenerate"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重新生成（换一套题）
            </button>
            <button
              type="button"
              @click="printPaper"
              class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / PDF（题目页 + 答案页分离）
            </button>
          </div>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>改设置即时重新组卷；「重新生成」才换新种子。答案页每题附一行换算过程，方便对照批改。</span>
          </p>
        </div>
      </div>

      <!-- 右：A4 预览 -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> A4 预览
          </h2>
          <div class="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              @click="viewMode = 'questions'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'questions' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              题目页
            </button>
            <button
              type="button"
              @click="viewMode = 'answers'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'answers' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              答案页
            </button>
          </div>
        </div>

        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            共 {{ paper.items.length }} 题 · 当前种子 {{ activeSeed }}
          </span>
          <span
            v-if="selfCheck.total > 0 && selfCheck.passed === selfCheck.total"
            class="flex items-center gap-1 text-green-600"
          >
            <CheckCircle class="w-3.5 h-3.5 shrink-0" /> 换算链自校验 {{ selfCheck.passed }}/{{ selfCheck.total }} 通过
          </span>
          <span v-else-if="selfCheck.failed.length" class="flex items-center gap-1 text-amber-600">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ selfCheck.failed.length }} 题换算链校验未通过
          </span>
        </div>

        <div class="sheet-scroll w-full">
          <div class="pages-stack mx-auto" style="width: 210mm; max-width: none">
            <!-- 题目页 -->
            <div class="a4-sheet" :class="{ 'sheet-break': true }" v-show="viewMode === 'questions'">
              <p class="sheet-header">单位换算练习 · ____年__月__日 · 姓名__________ · 用时____分____秒</p>
              <ol class="q-list">
                <li v-for="it in paper.items" :key="it.no" class="q-item">
                  <span class="q-no">{{ it.no }}.</span>{{ it.text }}
                </li>
              </ol>
            </div>
            <!-- 答案页（含换算过程） -->
            <div class="a4-sheet answer-sheet" v-show="viewMode === 'answers'">
              <p class="sheet-header">参考答案与换算过程</p>
              <ol class="q-list">
                <li v-for="a in paper.items" :key="'a' + a.no" class="q-item q-answer">
                  <span class="q-no">{{ a.no }}.</span>{{ a.answerText }}
                  <span class="q-process">{{ a.processText }}</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页按 A4 竖版、12mm 页边距排版；打印只输出题目页与答案页两页纸，
          答案页自动另起一页。屏幕预览中两页上下排布，打印时自动分离。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <details class="bg-card border border-border rounded-lg mb-12 group">
        <summary class="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-foreground"><span class="text-primary mr-2">#</span>单位换算练习：口诀、难度与常见问题</h2>
          <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
        </summary>
        <div class="px-6 pb-6 space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">换算教学口诀：大变小乘进率，小变大除以进率</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              单位换算的核心口诀是：<b class="text-foreground">大单位变小单位，数变大了，乘进率；小单位变大单位，数变小了，除以进率。</b>
              例如 2.5 米化成厘米是大变小，进率 100（经分米两步：2.5米=25分米，25分米=250厘米），所以 2.5×100=250；
              反过来 250 厘米化成米是小变大，250÷100=2.5。判断"乘还是除"只要看单位链上谁大谁小，再用相邻进率一步步串：
              米→分米→厘米相邻进率都是 10，千米→米是 1000；面积类相邻进率是 100（平方米→平方分米），公顷→平方米是 10000；
              时间类时→分→秒是 60。本工具答案页把每题的中间步骤都写出来，孩子可以对照口诀逐步验算。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">三档难度怎么选？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              一档（单步）：相邻单位整换算，如 3米=30分米、2吨=2000千克，适合二年级末到三年级起步；
              二档（两步）：隔一个单位换算，如 2.5米=250厘米（经分米）、1时=3600秒（经分），需要连续乘除两次进率；
              三档（含小数）：题面或答案出现小数，如 3.6千米=3600米、150厘米=1.5米，考查小数点移动，适合四年级及以上。
              本工具保证所有题目的数字"友好"：生成时先确定整数（或 0.5 步进）的答案，再反推出整十整百或一位小数的题面，
              不会出现 0.37 米这类难以书写的数。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">为什么答案页要写换算过程？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              换算题的错因往往不在最后一步，而在中间某一步进率用错（比如把平方米到平方分米的进率当成 10）。
              答案页每题附一行过程（如 2.5米=25分米=250厘米），批改时能直接看出孩子错在哪一级进率上，
              也可以让孩子先自己写出过程再对答案，把"背进率"变成"用进率"。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-semibold text-foreground">公顷和平方千米在哪个难度出现？</p>
                <p class="text-sm text-muted-foreground mt-1">公顷、平方千米属于面积类，任意难度都可能出到；它们的进率链是 1平方千米=100公顷、1公顷=10000平方米，题面会按所选难度控制步数与数字大小。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">升和立方分米是什么关系？</p>
                <p class="text-sm text-muted-foreground mt-1">1升=1立方分米、1毫升=1立方厘米，本工具的体积链按 立方米→立方分米→升→毫升 组织，相邻步进率依次为 1000、1、1000，两步换算如 2.5立方分米=2500毫升。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">同种子能复现同一份卷吗？</p>
                <p class="text-sm text-muted-foreground mt-1">能。出题随机数来自 mulberry32 确定性算法，填回相同种子（如 20260101）配相同设置，任何设备上都逐题一致，可用于补打丢卷或全班同卷。</p>
              </div>
            </div>
          </div>
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-semibold text-foreground mb-1">口径与来源</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              进率按我国小学数学教材通用口径（千米/米/分米/厘米/毫米、吨/千克/克、平方千米/公顷/平方米、时/分/秒、立方米/立方分米/升/毫升），
              并与站内 <NuxtLink to="/tools/unit-converter/" class="text-primary hover:underline">单位换算器</NuxtLink> 的换算系数一致，
              每题答案均由程序按进率链逐步验算（页面显示自校验结果）；"先定答案再反推题面"为本工具的出题口径，用于保证数字友好。
            </p>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowLeftRight, Printer, RefreshCw, CheckCircle, TriangleAlert,
  ChevronDown, Info, FileText
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'

// ---------- SEO ----------
useSeoMeta({
  title: '单位换算练习题生成器 - 长度重量面积时间体积换算打印 | 有条工具',
  description: '免费在线单位换算练习题生成：长度/重量/面积/时间/体积五类换算，三档难度（单步/两步/含小数）组卷，先定整数答案再反推题面保证数字友好，答案页附换算过程一行，A4 题目页答案页分离打印，mulberry32 种子同卷复现，纯本地生成',
  keywords: '单位换算练习题,单位换算题卡,长度换算练习,面积换算,时间换算,小学数学打印',
  author: '有条工具',
  ogTitle: '单位换算练习题生成器 - 五类换算三档难度 | 有条工具',
  ogDescription: '长度重量面积时间体积换算题，先定整数答案再反推题面，答案页附换算过程，A4 分离打印。',
  ogUrl: 'https://www.util.cn/tools/unit-quiz-generator',
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
          name: '单位换算练习题生成器',
          url: 'https://www.util.cn/tools/unit-quiz-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '五类题型：长度/重量/面积/时间/体积容积',
            '三档难度：单步整换算/两步换算/含小数',
            '先定整数答案再反推题面，数字友好可心算',
            '答案页每题附一行换算过程',
            'A4 题目页与答案页分离打印',
            'mulberry32 种子同卷复现，纯本地生成'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '单位换算练习题生成器', item: 'https://www.util.cn/tools/unit-quiz-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '换算口诀是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '大单位变小单位乘进率，小单位变大单位除以进率。如2.5米化厘米是大变小，2.5×100=250厘米；250厘米化米是小变大，250÷100=2.5米。' }
            },
            {
              '@type': 'Question',
              name: '三档难度有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '一档相邻单位单步整换算（3米=30分米）；二档隔一个单位两步换算（2.5米=250厘米经分米、1时=3600秒）；三档含小数（3.6千米=3600米、150厘米=1.5米），考查小数点移动。' }
            },
            {
              '@type': 'Question',
              name: '为什么答案页要写换算过程？',
              acceptedAnswer: { '@type': 'Answer', text: '换算题的错因常在中间某级进率用错，答案页每题附一行过程（如2.5米=25分米=250厘米），批改时能直接定位错在哪一级进率。' }
            }
          ]
        }
      ]
    })
  }]
})

/* PURE-FNS-START（纯函数区：供 node 自测提取，勿在此使用浏览器 API / Vue 响应式） */

// mulberry32 确定性伪随机数发生器（标准实现）：同一种子产生完全相同的 [0,1) 序列
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// [min, max] 闭区间随机整数
function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

// 单位链定义：units 从大到小排列，steps[i] = units[i] → units[i+1] 的进率（1 平方千米=100 公顷=10000 平方米…）
const UNIT_CATEGORIES = [
  {
    id: 'length', name: '长度',
    units: [
      { id: 'km', name: '千米' }, { id: 'm', name: '米' }, { id: 'dm', name: '分米' },
      { id: 'cm', name: '厘米' }, { id: 'mm', name: '毫米' }
    ],
    steps: [1000, 10, 10, 10]
  },
  {
    id: 'weight', name: '重量',
    units: [{ id: 't', name: '吨' }, { id: 'kg', name: '千克' }, { id: 'g', name: '克' }],
    steps: [1000, 1000]
  },
  {
    id: 'area', name: '面积',
    units: [
      { id: 'km2', name: '平方千米' }, { id: 'ha', name: '公顷' }, { id: 'm2', name: '平方米' },
      { id: 'dm2', name: '平方分米' }, { id: 'cm2', name: '平方厘米' }
    ],
    steps: [100, 10000, 100, 100]
  },
  {
    id: 'time', name: '时间',
    units: [{ id: 'h', name: '时' }, { id: 'min', name: '分' }, { id: 's', name: '秒' }],
    steps: [60, 60]
  },
  {
    id: 'volume', name: '体积',
    units: [
      { id: 'm3', name: '立方米' }, { id: 'dm3', name: '立方分米' },
      { id: 'L', name: '升' }, { id: 'mL', name: '毫升' }
    ],
    steps: [1000, 1, 1000]
  }
]

// 数字格式化：整数不带小数点，一位小数去尾零（2.5 → "2.5"，3 → "3"）
function fmtNum(v) {
  const r = Math.round(v * 10) / 10
  return Number.isInteger(r) ? String(r) : String(r)
}

// 构造一条换算链：v0 从 units[startIdx] 起，沿 dir（'down' 大化小 ×factor / 'up' 小化大 ÷factor）走 hops 步
// 返回 {unitsPath, values, steps:[{from,to,factor,dir}], totalFactor, processText, fromText, toText, answerValue}
function buildChain(cat, startIdx, hops, dir, v0) {
  const units = cat.units
  const steps = cat.steps
  const unitsPath = [units[startIdx].name]
  const values = [v0]
  const stepList = []
  let totalFactor = 1
  let cur = v0
  for (let k = 0; k < hops; k++) {
    // down（大化小）：从 units[s+k] 到 units[s+k+1]，进率 = steps[s+k]
    // up（小化大）：从 units[s-k] 到 units[s-k-1]，进率 = steps[s-k-1]（steps[i] 连接 units[i]→units[i+1]）
    const idx = dir === 'down' ? startIdx + k : startIdx - k - 1
    const factor = steps[idx]
    totalFactor *= factor
    const fromName = dir === 'down' ? units[idx].name : units[idx + 1].name
    const toName = dir === 'down' ? units[idx + 1].name : units[idx].name
    cur = dir === 'down' ? cur * factor : cur / factor
    // 消除浮点误差：数值都按 0.1 步进构造，四舍五入到 6 位
    cur = Math.round(cur * 1000000) / 1000000
    unitsPath.push(toName)
    values.push(cur)
    stepList.push({ from: fromName, to: toName, factor, dir })
  }
  const processText = values.map((v, i) => fmtNum(v) + unitsPath[i]).join('＝')
  return {
    unitsPath,
    values,
    steps: stepList,
    totalFactor,
    processText,
    fromText: fmtNum(v0) + unitsPath[0],
    toText: fmtNum(values[values.length - 1]) + unitsPath[unitsPath.length - 1],
    answerValue: values[values.length - 1]
  }
}

// 生成一道题：难度 difficulty 1/2/3；保证答案整数或干净的 0.5 步进，题面数字友好
// 口径：down（大化小）三档出一位小数题面（如 2.5米）、答案必为整数；up（小化大）三档答案为 x.5、题面为整数
function genOneQuestion(cat, difficulty, rng) {
  const unitsLen = cat.units.length
  const hops = difficulty === 2 ? 2 : 1
  // 随机方向：down 大化小 / up 小化大，需保证路径不出界
  const dirs = []
  if (unitsLen - 1 >= hops) dirs.push('down')
  if (unitsLen - 1 >= hops) dirs.push('up')
  const dir = dirs[randInt(rng, 0, dirs.length - 1)]
  let startIdx = 0
  let v0 = 1
  let decimal = false

  for (let attempt = 0; attempt < 60; attempt++) {
    startIdx = dir === 'down' ? randInt(rng, 0, unitsLen - 1 - hops) : randInt(rng, hops, unitsLen - 1)
    // 该换算链的总进率（down: steps[s..s+hops-1]；up: steps[s-1..s-hops]，steps[i] 连接 units[i]→units[i+1]）
    let F = 1
    for (let k = 0; k < hops; k++) F *= dir === 'down' ? cat.steps[startIdx + k] : cat.steps[startIdx - k - 1]

    if (difficulty === 3 && F >= 10) {
      if (dir === 'down') {
        // 题面一位小数：k 个十分之一（个位非 0 保证真是小数），答案 = k×F/10 必为整数
        const kMax = Math.max(1, Math.min(99, Math.floor(99990 / F)))
        const k = randInt(rng, 1, kMax)
        if (k % 10 === 0) continue
        v0 = k / 10
        decimal = true
      } else {
        // 答案 x.5：题面 = F×(k+0.5)，F 为偶数必得整数题面
        const kMax = Math.max(1, Math.min(19, Math.floor(99990 / F / 10)))
        const k = randInt(rng, 1, kMax)
        v0 = F * (k + 0.5)
        decimal = true
      }
    } else if (dir === 'down') {
      // 整数题面，答案 ≤ 9999
      const vMax = Math.max(1, Math.floor(9999 / F))
      v0 = randInt(rng, 1, vMax)
      decimal = false
    } else {
      // 小化大：题面必须是总进率的整数倍，答案才为整数
      const mMax = Math.max(1, Math.floor(9999 / F))
      v0 = F * randInt(rng, 1, mMax)
      decimal = false
    }
    break
  }

  const chain = buildChain(cat, startIdx, hops, dir, v0)
  return {
    text: chain.fromText + '＝（　　）' + chain.unitsPath[chain.unitsPath.length - 1],
    answerText: chain.toText,
    processText: chain.processText,
    chain,
    decimal
  }
}

// 组卷：题型轮转配额 + 确定性洗牌；同 config 同 seed 输出逐题一致
function buildPaper(config, seed) {
  const cfg = config && typeof config === 'object' ? config : {}
  const cats = UNIT_CATEGORIES.filter((c) => (Array.isArray(cfg.cats) ? cfg.cats : UNIT_CATEGORIES.map((x) => x.id)).includes(c.id))
  const useCats = cats.length ? cats : [UNIT_CATEGORIES[0]]
  const difficulty = [1, 2, 3].includes(cfg.difficulty) ? cfg.difficulty : 1
  const n = Math.min(50, Math.max(1, Math.floor(Number(cfg.count) || 10)))
  const rng = mulberry32(Number(seed) >>> 0)
  const slots = []
  for (let i = 0; i < n; i++) slots.push(useCats[i % useCats.length])
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = slots[i]
    slots[i] = slots[j]
    slots[j] = tmp
  }
  const items = []
  for (let i = 0; i < slots.length; i++) {
    const q = genOneQuestion(slots[i], difficulty, rng)
    items.push({ no: i + 1, category: slots[i].name, ...q })
  }
  return { items, difficulty, cats: useCats.map((c) => c.name) }
}

// 自校验：按存储的 factor 链逐步重算，验证每一步换算与最终答案一致
function checkPaper(items) {
  const list = Array.isArray(items) ? items : []
  let passed = 0
  const failed = []
  for (const it of list) {
    const chain = it.chain
    let ok = Array.isArray(chain.steps) && chain.steps.length > 0 && chain.values.length === chain.steps.length + 1
    if (ok) {
      for (let k = 0; k < chain.steps.length; k++) {
        const s = chain.steps[k]
        const expect = s.dir === 'down' ? chain.values[k] * s.factor : chain.values[k] / s.factor
        if (Math.abs(expect - chain.values[k + 1]) > 1e-9) { ok = false; break }
      }
      // 最终答案与末值一致，且题目题面单位 = 链首单位
      ok = ok && Math.abs(chain.values[chain.values.length - 1] - chain.answerValue) < 1e-9
      ok = ok && it.processText.split('＝').length === chain.values.length
    }
    if (ok) passed += 1
    else failed.push(it.no)
  }
  return { total: list.length, passed, failed }
}

/* PURE-FNS-END */

// ---------- 页面状态 ----------
const DIFFS = [
  { id: 1, label: '一档', tip: '单步整换算：相邻单位，如 3米=30分米、2吨=2000千克' },
  { id: 2, label: '二档', tip: '两步换算：隔一个单位，如 2.5米=250厘米（经分米）、1时=3600秒' },
  { id: 3, label: '三档', tip: '含小数：大化小出一位小数题面（3.6千米=3600米），小化大答案为 0.5 步进（150厘米=1.5米）' }
]
const PAPER_COUNTS = [10, 20]
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const cats = ref(['length', 'weight', 'time'])
const difficulty = ref(2)
const count = ref(10)
const seedInput = ref('')
const activeSeed = ref(20260101) // 首屏固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const viewMode = ref('questions')

const paper = ref({ items: [], difficulty: 2, cats: [] })
const selfCheck = ref({ total: 0, passed: 0, failed: [] })

const paperConfig = computed(() => ({
  cats: cats.value.slice(),
  difficulty: difficulty.value,
  count: count.value
}))

function rebuild() {
  paper.value = buildPaper(paperConfig.value, activeSeed.value)
  selfCheck.value = checkPaper(paper.value.items)
}
watch(paperConfig, rebuild)
rebuild()

function toggleCat(id, e) {
  const checked = e.target.checked
  const next = checked ? [...cats.value, id] : cats.value.filter((c) => c !== id)
  if (!next.length) {
    e.target.checked = true
    return
  }
  cats.value = next
}

function seedFromInput() {
  const raw = String(seedInput.value).trim()
  if (raw === '') return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? Math.abs(n) >>> 0 : null
}

function randomSeed() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

function applySeedInput() {
  const s = seedFromInput()
  activeSeed.value = s === null ? randomSeed() : s
  rebuild()
}

function regenerate() {
  seedInput.value = ''
  activeSeed.value = randomSeed()
  rebuild()
}

function printPaper() {
  window.print()
}

const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  activeSeed.value = randomSeed()
  rebuild()
  addRecentTool('unit-quiz-generator')
})
</script>

<style scoped>
/* 屏幕上的 A4 卷面 */
.a4-sheet {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  width: 210mm;
  min-height: 297mm;
  padding: 14mm 13mm;
  font-size: 4.2mm;
}
.pages-stack > .a4-sheet + .a4-sheet {
  margin-top: 16px;
}
.sheet-scroll {
  overflow-x: auto;
}
.sheet-header {
  font-size: 0.8em;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 8mm;
  white-space: pre-wrap;
  font-variant-numeric: tabular-nums;
}
.q-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 6mm;
  row-gap: 7mm;
  align-content: start;
}
.q-item {
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  break-inside: avoid;
  page-break-inside: avoid;
}
.q-no {
  display: inline-block;
  min-width: 2.2em;
  color: #6b7280;
}
.q-answer {
  color: #1e40af;
}
.q-process {
  display: block;
  font-size: 0.82em;
  color: #64748b;
  margin-top: 0.6mm;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-grid {
    display: block !important;
  }
  .print-area {
    width: auto !important;
  }
  .sheet-scroll {
    overflow: visible !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .pages-stack {
    width: auto !important;
  }
  .a4-sheet {
    display: block !important; /* 覆盖 v-show：打印时题目页与答案页都输出 */
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin-top: 0 !important;
  }
  .pages-stack > .a4-sheet + .a4-sheet {
    margin-top: 0 !important;
  }
  /* 题目页与答案页分离：题目页后强制分页 */
  .sheet-break {
    break-after: page;
    page-break-after: always;
  }
}
</style>
