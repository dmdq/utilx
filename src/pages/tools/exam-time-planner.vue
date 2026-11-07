<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">考试时间分配器</h1>
          <p class="text-sm text-muted-foreground mt-1">按题型分值占比拆分作答时间，时间轴可视化 + 考场时间小抄打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        考前规划工具：输入考试总时长与各题型（题量、每题分值、难度系数），自动扣除涂卡检查预留后，
        按题型分值占比把净作答时间分配到每个题型（可选难度系数加权：时间×系数后归一化），给出单题用时（秒/分双显）与
        单题下限告警（低于 45 秒/题时提示提速或弃题策略）。时间轴按比例分段可视化，并生成从开考时刻累加的
        每题型起止时刻表，可打印成考场时间小抄。纯前端本地计算，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 考试与预留
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">考试名称（打印在时间卡顶部）</label>
            <input v-model="examTitle" type="text" placeholder="如：八年级数学期中考试" :class="SEL_CLS" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">考试总时长（分钟）</label>
              <input v-model.number="totalMin" type="number" min="10" max="600" step="5" :class="SEL_CLS" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">开考时刻（用于时间小抄）</label>
              <input v-model="clockStart" type="time" :class="SEL_CLS" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">
              预留（涂卡 + 检查）：<span class="text-primary font-medium">{{ reserveMin }} 分钟</span>
            </label>
            <input v-model.number="reserveMin" type="range" min="0" max="20" step="1" class="w-full accent-primary" />
            <p class="text-xs text-muted-foreground mt-1">净作答时间 = 总时长 − 预留 = <b class="text-foreground">{{ plan.net }} 分钟</b></p>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="weighted" type="checkbox" class="accent-primary w-4 h-4" />
            按难度系数加权（时间 × 难度系数后归一化，难题多分时间）
          </label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ListOrdered class="w-5 h-5 mr-2 text-primary" /> 题型列表
            </h2>
            <button
              type="button"
              @click="addRow"
              class="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground hover:bg-muted/70 transition flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> 加一行
            </button>
          </div>
          <p class="text-xs text-muted-foreground">每行一个题型：名称 / 题量 / 每题分值；难度系数 1-3 可选（仅在加权模式下参与计算）。</p>
          <div class="space-y-2">
            <div v-for="(row, i) in rows" :key="i" class="grid grid-cols-[1fr_64px_64px_56px_32px] gap-1.5 items-center">
              <input v-model="row.name" type="text" placeholder="题型名" :class="SEL_CLS + ' text-sm'" />
              <input v-model.number="row.count" type="number" min="0" placeholder="题量" :class="SEL_CLS + ' text-sm'" />
              <input v-model.number="row.score" type="number" min="0" placeholder="分值" :class="SEL_CLS + ' text-sm'" />
              <select v-model.number="row.diff" :class="SEL_CLS + ' text-sm'">
                <option :value="1">×1</option>
                <option :value="2">×2</option>
                <option :value="3">×3</option>
              </select>
              <button
                type="button"
                @click="removeRow(i)"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted/60 transition"
                aria-label="删除该题型"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">默认示例：选择 40 题 40 分、填空 20 题 20 分、解答 6 题 60 分（总 120 分）。</p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 分配结果 -->
        <div class="bg-card border border-border rounded-lg p-6 no-print">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <PieChart class="w-5 h-5 mr-2 text-primary" /> 时间分配方案
            <span class="ml-auto text-xs font-normal text-muted-foreground">总 {{ plan.totalMin }} 分钟 = 净作答 {{ plan.net }} + 预留 {{ plan.reserveMin }}</span>
          </h2>

          <template v-if="plan.sections.length">
            <!-- 时间轴 -->
            <div class="mb-5">
              <p class="text-xs text-muted-foreground mb-1.5">时间轴（按分钟比例分段）</p>
              <div class="flex h-8 w-full rounded-lg overflow-hidden border border-border">
                <div
                  v-for="(seg, i) in plan.timeline"
                  :key="i"
                  class="h-full flex items-center justify-center overflow-hidden"
                  :class="seg.cls"
                  :style="{ width: (seg.minutes / Math.max(1, plan.totalMin) * 100) + '%' }"
                  :title="seg.name + ' ' + seg.minutes + ' 分钟'"
                >
                  <span class="text-[11px] font-medium text-white whitespace-nowrap px-1" v-if="seg.minutes / plan.totalMin > 0.08">{{ seg.name }} {{ seg.minutes }}′</span>
                </div>
              </div>
            </div>

            <!-- 各题型卡片 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div v-for="s in plan.sections" :key="s.name" class="bg-muted/50 rounded-xl p-4 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-foreground">{{ s.name }}</span>
                  <span class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{{ s.minutes }} 分钟</span>
                </div>
                <p class="text-xs text-muted-foreground">{{ s.count }} 题 · {{ s.score }} 分/题 · 占比 {{ s.sharePct }}%</p>
                <p class="text-sm text-foreground tabular-nums">
                  单题 <b>{{ s.perQuestionSec }}秒</b>
                  <span class="text-muted-foreground">（{{ s.perQuestionText }}）</span>
                </p>
                <p v-if="s.warn" class="text-xs text-amber-600 flex items-start gap-1">
                  <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" /> 单题不足 45 秒：建议整体提速，或计划性放弃部分难题（弃题止损），把时间让给高分题。
                </p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-foreground">涂卡 + 检查</span>
                  <span class="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{{ plan.reserveMin }} 分钟</span>
                </div>
                <p class="text-xs text-muted-foreground">固定预留，安排在最后；不要挪用去答题。</p>
              </div>
            </div>
          </template>
          <div v-else class="py-8 text-center text-sm text-muted-foreground">
            请至少填写一行有效的题型（题量与分值需大于 0）。
          </div>
        </div>

        <!-- 考场时间小抄（打印区） -->
        <div class="bg-card border border-border rounded-lg p-6 print-card-area">
          <div class="flex items-center justify-between mb-4 no-print">
            <h2 class="text-lg font-semibold flex items-center">
              <Clock class="w-5 h-5 mr-2 text-primary" /> 考场时间小抄
            </h2>
            <button
              type="button"
              @click="printCard"
              class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印时间卡
            </button>
          </div>
          <h2 class="print-only text-lg font-bold mb-2">{{ examTitle || '考场时间分配卡' }}</h2>
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th class="border border-border px-2 py-1.5 bg-muted/50 text-left text-muted-foreground font-medium">时段</th>
                <th class="border border-border px-2 py-1.5 bg-muted/50 text-left text-muted-foreground font-medium">题型</th>
                <th class="border border-border px-2 py-1.5 bg-muted/50 text-left text-muted-foreground font-medium">时长</th>
                <th class="border border-border px-2 py-1.5 bg-muted/50 text-left text-muted-foreground font-medium">策略提醒</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(seg, i) in plan.timeline" :key="'t' + i">
                <td class="border border-border px-2 py-1.5 tabular-nums text-foreground">{{ seg.clockStart }} – {{ seg.clockEnd }}</td>
                <td class="border border-border px-2 py-1.5 text-foreground">{{ seg.name }}</td>
                <td class="border border-border px-2 py-1.5 tabular-nums text-foreground">{{ seg.minutes }} 分钟</td>
                <td class="border border-border px-2 py-1.5 text-muted-foreground">{{ seg.tip }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            起止时刻从开考时刻（{{ plan.clockStartText }}）按分配时长累加得出；打印只输出此表，适合裁小贴在准考证背面。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <details class="bg-card border border-border rounded-lg mb-12 group">
        <summary class="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-foreground"><span class="text-primary mr-2">#</span>考场时间管理三原则与常见问题</h2>
          <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
        </summary>
        <div class="px-6 pb-6 space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">考场时间管理三原则</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              <b class="text-foreground">一、先易后难：</b>按"先熟后生、先易后难、先高分后低分"的顺序作答，本工具支持按难度系数加权，
              会自动把更多时间分给解答题等高耗题型；选择填空卡住超过单题用时两倍就先跳过并做标记。
              <b class="text-foreground">二、留足检查：</b>默认预留 10 分钟涂卡与检查（可用滑杆调 0-20 分钟），预留时间放在整场最后且不挪用；
              建议做完一个大题就随手涂卡，避免最后集中涂卡出错。
              <b class="text-foreground">三、弃题止损：</b>当某个题型的单题时间低于 45 秒（工具会告警），说明按正常速度做不完，
              此时理性的策略是：先保高分题、果断放弃低分值难题，把"一题耗全场"变成"弃一题保总分"。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">时间是怎么分配的？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              净作答时间 = 总时长 − 预留。各题型按分值占比瓜分净时间：例如总 120 分钟、预留 10 分钟、
              选择 40 分 / 填空 20 分 / 解答 60 分（共 120 分），则选择题得 110×40/120≈36.7 分钟、填空约 18.3 分钟、解答 55 分钟；
              工具用最大余数法把分钟数取整（37/18/55），保证各题型之和恰好等于净时间。
              勾选"按难度系数加权"后，权重 = 分值 × 难度系数再归一化，难题型会分到更多时间，但总和仍等于净时间。
              单题时间 = 题型时间 ÷ 题量，低于 45 秒/题时给出提速或弃题建议。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">需要专注训练配合怎么办？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              时间分配是考前规划，考场上执行靠节奏感。日常刷卷时可以用
              <NuxtLink to="/tools/pomodoro-timer/" class="text-primary hover:underline">番茄钟计时器</NuxtLink>
              按"选择 37 分钟一段、解答 55 分钟一段"的方式分段计时训练，让身体记住每个题型该有的速度；考试时再配合手表核对时间卡的节点即可。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-semibold text-foreground">为什么各题型时间之和刚好等于净时间？</p>
                <p class="text-sm text-muted-foreground mt-1">分配用最大余数法取整：先按比例算出精确值，整数部分相加后剩余的分钟按小数部分大小依次补足，保证总和不多不少正好等于净作答时间。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">单题 45 秒的下限是硬标准吗？</p>
                <p class="text-sm text-muted-foreground mt-1">不是。45 秒/题是常见的选择填空节奏参考口径，仅用于触发告警提示；解答题等大题按每题几分钟计，本工具对任何题型统一按 45 秒/题阈值提醒，请结合实际题型把握。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">数据会上传吗？</p>
                <p class="text-sm text-muted-foreground mt-1">不会。全部计算在浏览器本地完成，没有网络请求；打印时间卡使用浏览器打印，同样不经过服务器。</p>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Timer, ListOrdered, Plus, Trash2, PieChart, Clock, Printer,
  TriangleAlert, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'

// ---------- SEO ----------
useSeoMeta({
  title: '考试时间分配器 - 按题型分值分配作答时间并打印时间卡 | 有条工具',
  description: '免费在线考试时间分配器：输入总时长与各题型题量分值，自动扣除涂卡检查预留，按分值占比（可选难度加权）分配净作答时间，单题用时秒分双显、低于45秒告警提示弃题止损，时间轴比例分段可视化，开考时刻累加生成起止时刻表可打印考场小抄，纯本地计算',
  keywords: '考试时间分配,考场时间管理,答题时间规划,考试时间卡,单题用时计算',
  author: '有条工具',
  ogTitle: '考试时间分配器 - 时间轴可视化+考场时间小抄 | 有条工具',
  ogDescription: '按题型分值占比分配净作答时间，单题告警、时间轴分段、起止时刻表打印成考场小抄。',
  ogUrl: 'https://www.util.cn/tools/exam-time-planner',
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
          name: '考试时间分配器',
          url: 'https://www.util.cn/tools/exam-time-planner',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '净作答时间 = 总时长 − 涂卡检查预留（滑杆 0-20 分钟）',
            '各题型按分值占比分配，可选难度系数加权归一化',
            '最大余数法取整，各题型分钟数之和恰等于净时间',
            '单题用时秒/分双显，低于 45 秒/题告警并给弃题止损建议',
            '时间轴按比例分段可视化',
            '从开考时刻累加的起止时刻表，可打印考场时间小抄'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '考试时间分配器', item: 'https://www.util.cn/tools/exam-time-planner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么各题型时间之和刚好等于净时间？',
              acceptedAnswer: { '@type': 'Answer', text: '分配用最大余数法取整：先按分值占比算出精确分钟数，整数部分相加后剩余分钟按小数部分大小依次补足，保证总和恰好等于净作答时间。' }
            },
            {
              '@type': 'Question',
              name: '单题 45 秒的下限是硬标准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。45秒/题是常见的选择填空节奏参考口径，仅用于触发告警提示提速或弃题止损，请结合实际题型把握。' }
            },
            {
              '@type': 'Question',
              name: '考场时间管理有哪三原则？',
              acceptedAnswer: { '@type': 'Answer', text: '先易后难（按先熟后生、先高分后低分作答，卡住就跳过）、留足检查（预留时间放最后不挪用）、弃题止损（单题时间不足时果断放弃低分难题保总分）。' }
            }
          ]
        }
      ]
    })
  }]
})

/* PURE-FNS-START（纯函数区：供 node 自测提取，勿在此使用浏览器 API / Vue 响应式） */

// 最大余数法：把 total 按权重取整分配，返回整数数组且 sum = total
function largestRemainder(weights, total) {
  const ws = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0))
  const sumW = ws.reduce((a, b) => a + b, 0)
  const n = ws.length
  if (n === 0 || sumW <= 0) return ws.map(() => 0)
  const floors = ws.map((w) => Math.floor((w / sumW) * total))
  let used = floors.reduce((a, b) => a + b, 0)
  const rest = total - used
  const fracs = ws
    .map((w, i) => ({ i, frac: (w / sumW) * total - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; k < rest; k++) floors[fracs[k % n].i] += 1
  return floors
}

// 分钟数格式化为开考时刻 + offset 的钟点（开考 09:00=540 分钟，+37 → "09:37"，支持跨小时与跨天回绕）
function minutesToClock(startMinutes, addMinutes) {
  const m = ((Math.round(startMinutes) + Math.round(addMinutes)) % 1440 + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}

// "HH:MM" → 距 0 点的分钟数；非法返回 540（09:00）
function clockToMinutes(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || '').trim())
  if (!m) return 540
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return h * 60 + mm
}

// 秒数友好显示：66 → "66秒"；550 → "9分10秒"
function fmtSec(sec) {
  const s = Math.round(sec)
  if (s < 60) return s + '秒'
  return Math.floor(s / 60) + '分' + String(s % 60).padStart(2, '0') + '秒'
}

// 时间分配核心：输入 {totalMin, reserveMin, sections:[{name,count,score,diff}], weighted, clockStart}
// 输出各题型分配（精确值 rawMinutes + 取整 minutes）、单题秒数、告警、时间轴与钟点时刻表
function computePlan(config) {
  const cfg = config && typeof config === 'object' ? config : {}
  const totalMin = Math.max(0, Math.floor(Number(cfg.totalMin) || 0))
  const reserveMin = Math.min(120, Math.max(0, Math.floor(Number(cfg.reserveMin) || 0)))
  const net = Math.max(0, totalMin - reserveMin)
  const weighted = !!cfg.weighted
  const clockStart = clockToMinutes(cfg.clockStart)

  const rawSections = Array.isArray(cfg.sections) ? cfg.sections : []
  const valid = rawSections
    .map((s, idx) => ({
      name: String(s && s.name ? s.name : '').trim() || '题型' + (idx + 1),
      count: Math.max(0, Math.floor(Number(s && s.count) || 0)),
      score: Math.max(0, Number(s && s.score) || 0),
      diff: [1, 2, 3].includes(Number(s && s.diff)) ? Number(s.diff) : 1
    }))
    .filter((s) => s.count > 0 && s.score > 0)

  // 权重 = 题型总分（题量 × 每题分值），加权模式下再乘难度系数
  const weights = valid.map((s) => s.count * s.score * (weighted ? s.diff : 1))
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const minutes = largestRemainder(weights, net)

  const sections = valid.map((s, i) => {
    const rawMinutes = totalWeight > 0 ? (weights[i] / totalWeight) * net : 0
    const perQuestionSec = s.count > 0 ? (minutes[i] * 60) / s.count : 0
    return {
      name: s.name,
      count: s.count,
      score: s.score,
      diff: s.diff,
      weight: weights[i],
      sharePct: totalWeight > 0 ? Math.round((weights[i] / totalWeight) * 100) : 0,
      rawMinutes,
      minutes: minutes[i],
      perQuestionSec,
      perQuestionText: fmtSec(perQuestionSec),
      warn: perQuestionSec > 0 && perQuestionSec < 45
    }
  })

  // 时间轴：按分配顺序累加，预留段固定在最后
  const SEG_CLS = ['bg-primary', 'bg-primary/75', 'bg-primary/50', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600']
  const SEG_TIP = [
    '按单题节奏推进，卡住超时先跳过',
    '先易后难，注意涂卡节奏',
    '高分题重点保证，读题两遍再动笔',
    '卡住超过单题用时两倍先标记跳过',
    '回头先补标记题，再全身检查',
    '压轴题量力而行，能写一步是一步'
  ]
  const timeline = []
  let acc = 0
  sections.forEach((s, i) => {
    if (s.minutes <= 0) return
    timeline.push({
      name: s.name,
      minutes: s.minutes,
      startMin: acc,
      endMin: acc + s.minutes,
      clockStart: minutesToClock(clockStart, acc),
      clockEnd: minutesToClock(clockStart, acc + s.minutes),
      cls: SEG_CLS[i % SEG_CLS.length],
      tip: SEG_TIP[i % SEG_TIP.length],
      isReserve: false
    })
    acc += s.minutes
  })
  if (reserveMin > 0) {
    timeline.push({
      name: '涂卡+检查',
      minutes: reserveMin,
      startMin: acc,
      endMin: acc + reserveMin,
      clockStart: minutesToClock(clockStart, acc),
      clockEnd: minutesToClock(clockStart, acc + reserveMin),
      cls: 'bg-muted-foreground/70',
      tip: '只涂卡与检查，不再答新题',
      isReserve: true
    })
    acc += reserveMin
  }

  return {
    totalMin,
    reserveMin,
    net,
    weighted,
    totalWeight,
    sections,
    timeline,
    clockStart,
    clockStartText: minutesToClock(clockStart, 0),
    clockEndText: minutesToClock(clockStart, acc)
  }
}

/* PURE-FNS-END */

// ---------- 页面状态 ----------
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const totalMin = ref(120)
const reserveMin = ref(10)
const weighted = ref(false)
const clockStart = ref('09:00')
const examTitle = ref('')
const rows = ref([
  { name: '选择题', count: 40, score: 1, diff: 1 },
  { name: '填空题', count: 20, score: 1, diff: 1 },
  { name: '解答题', count: 6, score: 10, diff: 2 }
])

const plan = computed(() =>
  computePlan({
    totalMin: totalMin.value,
    reserveMin: reserveMin.value,
    weighted: weighted.value,
    clockStart: clockStart.value,
    sections: rows.value.map((r) => ({ name: r.name, count: r.count, score: r.score, diff: r.diff }))
  })
)

function addRow() {
  rows.value = [...rows.value, { name: '', count: 10, score: 2, diff: 1 }]
}

function removeRow(i) {
  rows.value = rows.value.filter((_, idx) => idx !== i)
}

function printCard() {
  window.print()
}

onMounted(() => {
  addRecentTool('exam-time-planner')
})
</script>

<style scoped>
.print-only {
  display: none;
}
/* 打印：只输出考场时间小抄 */
@media print {
  .no-print,
  details {
    display: none !important;
  }
  .print-grid {
    display: block !important;
  }
  .print-card-area {
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  .print-only {
    display: block !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
}
</style>
