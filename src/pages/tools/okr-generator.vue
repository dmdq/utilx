<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Target class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">OKR生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">O 定性 KR 定量结构化编写，信心值设定、权重归一校验、0.3/0.7 评分口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按「定性目标 O + 定量关键结果 KR」结构逐条编写：每个 O 设 1-10 信心值与季度周期，每个 KR 建议写「从 X 到 Y」格式并分配权重，
        工具自动校验组内权重归一（合计≠100% 告警）与「KR 必须有度量」（无数字黄标提醒）。
        附 Google 0.3/0.7 评分口径说明卡，支持复制 Markdown/纯文本 OKR 卡与 A4 打印，草稿自动保存在本机浏览器。全部处理本地完成，不上传数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：编辑区 -->
      <div class="no-print space-y-4">
        <!-- 周期与原则卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <ClipboardList class="w-5 h-5 mr-2 text-primary" /> OKR 周期
          </h2>
          <input v-model="period" type="text" class="fld" maxlength="30" placeholder="如：2026 Q4（按季度设定）" />
          <div class="bg-muted/50 rounded-xl p-4 mt-4">
            <p class="text-sm font-medium text-foreground mb-1">O 定性、KR 定量原则</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              O（目标）写方向与愿景，是定性的、鼓舞人心的、不带数字的；KR（关键结果）写可度量的结果，是定量的、
              有基线和终点的，推荐「从 X 到 Y」格式（如「DAU 从 1 万到 1.5 万」）。判断口诀：O 是「我们要去哪」，KR 是「怎么知道到了」。
            </p>
          </div>
        </div>

        <!-- O/KR 编辑 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Target class="w-5 h-5 mr-2 text-primary" /> 目标与关键结果
          </h2>
          <p class="text-xs text-muted-foreground mb-4">一个周期通常 3-5 个 O，每个 O 下 2-5 个 KR；KR 写结果不写任务清单</p>

          <div v-for="(o, oi) in objectives" :key="oi" class="border border-border rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold text-primary">O{{ oi + 1 }}</span>
              <button type="button" @click="removeO(oi)" class="p-1 text-muted-foreground hover:text-red-600 transition" aria-label="删除该目标">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div class="flex flex-wrap gap-2 mb-3">
              <input v-model="o.text" type="text" class="fld flex-1 min-w-[200px]" placeholder="定性目标描述（如：显著提升用户留存与活跃）" :aria-label="`O${oi + 1} 目标描述`" />
              <label class="flex items-center gap-1.5 text-xs text-muted-foreground">
                信心值
                <input
                  v-model.number="o.confidence"
                  type="number"
                  min="1"
                  max="10"
                  class="fld w-[76px]"
                  @change="o.confidence = clampConfidence(o.confidence)"
                  :aria-label="`O${oi + 1} 信心值 1-10`"
                />
                /10
              </label>
            </div>
            <div v-for="(k, ki) in o.krs" :key="ki" class="flex flex-wrap gap-2 mb-2 items-start">
              <span class="w-9 h-8 flex items-center justify-center text-xs text-muted-foreground">KR{{ ki + 1 }}</span>
              <input v-model="k.text" type="text" class="fld flex-1 min-w-[180px]" placeholder="定量结果，建议「从 X 到 Y」（如 DAU 从 1 万到 1.5 万）" :aria-label="`O${oi + 1} KR${ki + 1} 描述`" />
              <input v-model.number="k.weight" type="number" min="0" max="100" class="fld w-[84px]" placeholder="权重%" :aria-label="`O${oi + 1} KR${ki + 1} 权重`" />
              <input v-model="k.scale" type="text" class="fld w-[170px]" placeholder="评分口径（如 0.7=良好）" :aria-label="`O${oi + 1} KR${ki + 1} 评分口径`" />
              <button type="button" @click="removeKr(o, ki)" class="p-2 text-muted-foreground hover:text-red-600 transition" aria-label="删除该 KR">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <button type="button" @click="addKr(o)" class="mt-1 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" /> 添加 KR
            </button>
            <p class="text-xs mt-2" :class="weightBadge(o).cls">{{ weightBadge(o).text }}</p>
          </div>
          <button type="button" @click="addO" class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
            <Plus class="w-3.5 h-3.5" /> 添加目标 O
          </button>
        </div>

        <!-- 校验卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 校验与口径
          </h2>
          <div class="space-y-2">
            <div
              v-for="(iss, i) in issues"
              :key="i"
              class="flex items-start gap-2 rounded-lg bg-yellow-500/10 px-3 py-2"
            >
              <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p class="text-sm text-foreground">{{ iss.message }}</p>
            </div>
            <div v-if="!issues.length" class="flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2">
              <Check class="w-4 h-4 text-success shrink-0 mt-0.5" />
              <p class="text-sm text-foreground">校验通过：每个 O 下都有 KR、KR 均含度量、组内权重合计 100%。</p>
            </div>
          </div>
          <div class="bg-muted/50 rounded-xl p-4 mt-4">
            <p class="text-sm font-medium text-foreground mb-1">Google 0.3 / 0.7 评分口径</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              每个周期结束时给 KR 打 0-1 分：0.7 达成即良好（有雄心的 OKR 预期落点就在 0.6-0.7）；
              1.0 = 完全达成满分，出现是正常的，但如果长期打 1.0 说明目标定得不够挑战；0.4-0.6 需要调整打法；
              0.3 及以下要复盘——是 KR 设错、执行不力还是前提变了，并决定下周期重设。评分在 KR 行的「评分口径」里按此约定。
            </p>
          </div>
        </div>

        <!-- 操作 -->
        <div class="bg-card border border-border rounded-lg p-6 flex flex-wrap gap-2">
          <button type="button" @click="copyMarkdown" class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5">
            <Copy class="w-4 h-4" /> 复制 Markdown
          </button>
          <button type="button" @click="copyText" class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5">
            <Copy class="w-4 h-4" /> 复制纯文本
          </button>
          <button type="button" @click="printReport" class="flex-1 min-w-[100px] px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5">
            <Printer class="w-4 h-4" /> 打印
          </button>
          <button type="button" @click="clearDraft" class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5">
            <Eraser class="w-4 h-4" /> 清空
          </button>
        </div>
      </div>

      <!-- 右：A4 预览 -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> OKR 卡预览（A4）
          </h2>
          <button type="button" @click="printReport" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5">
            <Printer class="w-4 h-4" /> 打印
          </button>
        </div>
        <div class="bg-white text-black border border-border rounded-lg shadow-sm overflow-hidden a4-paper">
          <div class="px-[8%] py-[7%]" v-html="previewHtml"></div>
        </div>
        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：KR 建议全部写成「从 X 到 Y」的度量格式；权重在同一个 O 内合计应为 100%，便于期末按权重加权评分。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="no-print bg-card border border-border rounded-lg p-6 mb-8">
      <summary class="text-lg font-semibold cursor-pointer select-none text-foreground flex items-center">
        <span class="text-primary mr-2">#</span>OKR 和 KPI 有什么区别？写 OKR 最容易踩的三个坑
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <h3 class="text-lg font-semibold text-foreground">OKR vs KPI：目标管理思维不同</h3>
        <p>
          KPI（关键绩效指标）是「考核思维」：指标通常稳定、与绩效薪酬挂钩，追求的是可靠地达到既定水位，
          所以指标倾向于定得保守可达成。OKR（目标与关键结果）是「聚焦与挑战思维」：O 定性描述方向，KR 定量定义「怎么算到了」，
          通常按季度设定并公开对齐；按 Google 的评分口径，0.7 达成即良好——这意味着 OKR 有意设置「够不着才对」的挑战线，
          拿 1.0 反而提示目标定得太保守。简言之：KPI 问「你必须做到多少」，OKR 问「你敢不敢朝这里跳」。
          实践中两者并不互斥：经营底线常用 KPI 守，突破方向用 OKR 攻。
        </p>
        <h3 class="text-lg font-semibold text-foreground">写 OKR 最容易踩的三个坑</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">KR 写成任务清单：</span>「上线新版本」「召开复盘会」是任务（做了就完成），不是 KR（KR 必须有度量、有基线到终点的变化，如「崩溃率从 1.2% 降到 0.5%」）。本工具对不含数字的 KR 会黄标提醒。</li>
          <li><span class="text-foreground font-medium">O 写成 KPI 或口号：</span>「DAU 提升到 1.5 万」放在 O 的位置，是把 KR 混进了 O——O 应该是定性的方向（如「让新用户第一周就感受到核心价值」），数字留给 KR；而空喊「赋能、抓手」式的口号 O，则无法拆解出 KR。</li>
          <li><span class="text-foreground font-medium">把 KR 当承诺完成率：</span>有雄心的 OKR 按 0.7 即成功的口径评分，期末平均分长期接近 1.0 应主动上调目标；低于 0.4 的 KR 不应简单归咎执行，而要复盘 KR 本身是否设错。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">信心值怎么用</h3>
        <p>
          每个 O 设 1-10 的信心值（对「季度末能拿到 0.7」的主观概率）：团队对齐时用信心值暴露分歧——同一目标有人打 3 有人打 9，
          说明对资源或路径的理解不一致，正好借设定会拉齐；周期中段信心值大幅下调，是提前预警，而不是失败。
        </p>
        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">一个周期几个 O、每个 O 几条 KR？</span>通行口径是 3-5 个 O、每个 O 配 2-5 个 KR；超过 5 个 O 说明没聚焦，KR 超过 5 条通常是在列任务清单而不是选关键结果。</li>
          <li><span class="text-foreground font-medium">KR 权重怎么定？</span>同一个 O 内的 KR 按重要性分配权重、合计 100%（本工具自动校验），期末按 0-1 分 × 权重加权得到该 O 的得分，避免每条 KR 等权导致关键结果被稀释。</li>
          <li><span class="text-foreground font-medium">填写内容会上传吗？</span>不会。全部处理与草稿保存在当前浏览器 localStorage 中，换设备或清除浏览器数据会丢失，请及时复制或打印。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">延伸工具</h3>
        <p>
          OKR 定下后要拆解排期与依赖，可以配合 <a href="/tools/gantt-chart-maker/" class="text-primary hover:underline">甘特图制作器</a> 把 KR 落成时间线。
        </p>
        <h3 class="text-lg font-semibold text-foreground">来源与口径说明</h3>
        <p>
          OKR 方法源自安迪·格鲁夫在英特尔的实践，经约翰·杜尔（John Doerr）《这就是 OKR》（Measure What Matters）与 WhatMatters.com 推广；
          0.3/0.7 评分口径与「0.6-0.7 为预期落点、长期 1.0 说明目标不够挑战、0.4-0.6 黄灯调整、0.0-0.3 红灯复盘」的分档，
          与 Google re:Work《Set goals with OKRs》指南及 WhatMatters 的评分分档口径一致。本工具的校验规则为该口径的简化整理，输出为参考模板。
        </p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'okr-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Target, ClipboardList, Gauge, Plus, Trash2, Copy, Check, Printer, Eraser, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'OKR生成器 - 目标与关键结果模板在线编写（权重校验+评分口径）',
  description: '免费在线OKR生成器：定性目标 O + 定量关键结果 KR 结构化编写，O 设 1-10 信心值与季度周期，KR 建议「从 X 到 Y」格式并校验组内权重合计 100%，无数字 KR 黄标提醒，附 Google 0.3/0.7 评分口径说明，复制 Markdown/纯文本与打印，草稿本地保存不上传',
  keywords: 'OKR模板,OKR怎么写,关键结果制定,OKR生成器,OKR评分,OKR与KPI区别,目标管理工具',
  author: '有条工具',
  ogTitle: 'OKR生成器 - O定性KR定量，权重校验+评分口径 | 有条工具',
  ogDescription: '信心值设定、KR 度量校验、权重归一告警、Google 0.3/0.7 评分口径说明，导出 OKR 卡。',
  ogUrl: 'https://www.util.cn/tools/okr-generator',
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
          name: 'OKR生成器',
          url: 'https://www.util.cn/tools/okr-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['定性目标 O 与定量 KR 结构化行编辑', 'O 信心值 1-10 设定与自动钳制', 'KR 权重组内归一校验（合计≠100% 告警）', '无数字 KR 黄标提醒（KR 必须有度量）', 'Google 0.3/0.7 评分口径说明卡', '导出 Markdown/纯文本 OKR 卡与打印', '草稿本机保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: 'OKR生成器', item: 'https://www.util.cn/tools/okr-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'OKR 和 KPI 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'KPI 是考核思维：指标稳定、与绩效挂钩、追求可靠达成；OKR 是聚焦与挑战思维：O 定性定方向、KR 定量定终点，按季度公开对齐，0.7 达成即良好。经营底线用 KPI 守、突破方向用 OKR 攻，两者并不互斥。' }
            },
            {
              '@type': 'Question',
              name: '为什么 KR 里没有数字会被提醒？',
              acceptedAnswer: { '@type': 'Answer', text: 'KR 必须是可度量的结果（有基线到终点的变化，如「崩溃率从 1.2% 降到 0.5%」）；「上线新版本」这类没有度量的表述是任务清单，无法判断做到没做到。' }
            },
            {
              '@type': 'Question',
              name: 'Google 的 0.3/0.7 评分口径是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '每个周期结束按 0-1 分给 KR 评分：0.7 达成即良好（有雄心 OKR 的预期落点在 0.6-0.7）；1.0 满分罕见但正常，长期 1.0 说明目标不够挑战；0.4-0.6 黄灯需调整打法；0.3 及以下需复盘 KR 本身。' }
            },
            {
              '@type': 'Question',
              name: '填写内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。全部处理与草稿保存在当前浏览器 localStorage 中，不上传服务器；换设备或清除浏览器数据会丢失，请及时复制或打印。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const PLACEHOLDER = '____'

// 信心值钳制：空/非法 → 5（中性默认）；四舍五入后限制在 1-10
function clampConfidence(v) {
  const raw = String(v ?? '').trim()
  if (!raw) return 5
  const n = Number(raw)
  if (!isFinite(n)) return 5
  const r = Math.round(n)
  if (r < 1) return 1
  if (r > 10) return 10
  return r
}

// KR 是否含度量（含任意数字即视为通过黄标检测）
function krHasMetric(text) {
  return /\d/.test(String(text ?? ''))
}

// 权重求和（非法值按 0）
function weightSum(krs) {
  const list = Array.isArray(krs) ? krs : []
  return list.reduce((s, k) => s + (isFinite(Number(k && k.weight)) ? Number(k.weight) : 0), 0)
}

// KR 规范化：文本截断、权重钳制 0-100
function normalizeKr(k) {
  const o = k && typeof k === 'object' ? k : {}
  let w = Number(o.weight)
  if (!isFinite(w) || w < 0) w = 0
  if (w > 100) w = 100
  return {
    text: String(o.text ?? '').slice(0, 500),
    weight: Math.round(w * 10) / 10,
    scale: String(o.scale ?? '').slice(0, 200)
  }
}

// 草稿规范化（整棵 OKR 树）
function normalizeOkrDraft(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    period: String(r.period ?? '').slice(0, 30),
    objectives: (Array.isArray(r.objectives) ? r.objectives : []).slice(0, 10).map((o) => {
      const obj = o && typeof o === 'object' ? o : {}
      return {
        text: String(obj.text ?? '').slice(0, 300),
        confidence: clampConfidence(obj.confidence),
        krs: (Array.isArray(obj.krs) ? obj.krs : []).slice(0, 8).map(normalizeKr)
      }
    })
  }
}

// 校验：KR 缺失 / KR 无度量 / 权重未归一
function validateObjectives(objectives) {
  const d = normalizeOkrDraft({ objectives })
  const issues = []
  d.objectives.forEach((o, oi) => {
    const filled = o.krs.map((k, ki) => ({ ...k, ki })).filter((k) => k.text.trim())
    if (!filled.length) {
      issues.push({ oi, type: 'no-kr', message: `O${oi + 1} 还没有填写任何 KR：没有关键结果的 O 无法验证达成` })
      return
    }
    filled.forEach((k) => {
      if (!krHasMetric(k.text)) {
        issues.push({
          oi, ki: k.ki, type: 'no-metric',
          message: `O${oi + 1} 的 KR${k.ki + 1}「${k.text.trim().slice(0, 24)}」没有数字或度量——KR 必须可衡量，建议改写为「从 X 到 Y」格式`
        })
      }
    })
    const sum = Math.round(weightSum(filled) * 10) / 10
    if (sum !== 100) {
      issues.push({
        oi, type: 'weight',
        message: `O${oi + 1} 的 KR 权重合计为 ${sum}%（应为 100%）：请调整各 KR 权重使组内归一`
      })
    }
  })
  return issues
}

// Markdown 导出
function buildOkrMarkdown(f) {
  const d = normalizeOkrDraft(f)
  const lines = []
  lines.push('# OKR' + (d.period.trim() ? `（${d.period.trim()}）` : ''))
  d.objectives.forEach((o, oi) => {
    lines.push('')
    lines.push(`## O${oi + 1} ${o.text.trim() || PLACEHOLDER}（信心值 ${o.confidence}/10）`)
    if (!o.krs.filter((k) => k.text.trim()).length) {
      lines.push('- KR：（待填写）')
      return
    }
    o.krs.forEach((k, ki) => {
      if (!k.text.trim()) return
      const wTxt = isFinite(Number(k.weight)) && Number(k.weight) !== 0 ? `｜权重 ${k.weight}%` : ''
      const sTxt = k.scale.trim() ? `｜评分口径：${k.scale.trim()}` : ''
      lines.push(`- KR${ki + 1}：${k.text.trim()}${wTxt}${sTxt}`)
    })
  })
  if (!d.objectives.length) {
    lines.push('')
    lines.push('（还没有填写任何目标 O）')
  }
  return lines.join('\n')
}

// 纯文本导出（无 Markdown 语法）
function buildOkrText(f) {
  const d = normalizeOkrDraft(f)
  const lines = []
  lines.push('OKR' + (d.period.trim() ? `（${d.period.trim()}）` : ''))
  d.objectives.forEach((o, oi) => {
    lines.push(`【O${oi + 1}】${o.text.trim() || PLACEHOLDER}（信心值 ${o.confidence}/10）`)
    const filled = o.krs.filter((k) => k.text.trim())
    if (!filled.length) {
      lines.push('  KR：（待填写）')
      return
    }
    o.krs.forEach((k, ki) => {
      if (!k.text.trim()) return
      const wTxt = isFinite(Number(k.weight)) && Number(k.weight) !== 0 ? ` | 权重 ${k.weight}%` : ''
      const sTxt = k.scale.trim() ? ` | 评分口径: ${k.scale.trim()}` : ''
      lines.push(`  KR${ki + 1}. ${k.text.trim()}${wTxt}${sTxt}`)
    })
  })
  if (!d.objectives.length) lines.push('（还没有填写任何目标 O）')
  return lines.join('\n')
}

// A4 预览 HTML（全部转义）
function buildOkrHtml(f) {
  const d = normalizeOkrDraft(f)
  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  const txt = (s) => (String(s ?? '').trim() ? esc(s) : PLACEHOLDER)
  const TBL = 'width:100%;border-collapse:collapse;font-size:12px;'
  const TD = 'border:1px solid #888;padding:5px 7px;vertical-align:top;line-height:1.6;'
  const THH = TD + 'background:#f5f5f5;text-align:left;font-weight:bold;white-space:nowrap;'
  const SEC_H = 'font-size:14px;font-weight:bold;margin:16px 0 6px;padding:4px 8px;background:#efefef;border-left:4px solid #333;'

  const parts = []
  parts.push(`<h1 style="text-align:center;font-size:21px;font-weight:bold;margin:0 0 4px;letter-spacing:0.1em;">OKR 目标卡</h1>`)
  parts.push(`<p style="text-align:center;font-size:11px;color:#555;margin:0 0 14px;">周期：${esc(d.period.trim() || '（未填写）')}｜口径：0.7 达成即良好，1.0=达成满分，0.3 及以下需复盘</p>`)
  if (!d.objectives.length) {
    parts.push(`<p style="font-size:12px;color:#666;">（还没有填写任何目标 O）</p>`)
  }
  d.objectives.forEach((o, oi) => {
    parts.push(`<h2 style="${SEC_H}">O${oi + 1} ${txt(o.text)}（信心值 ${o.confidence}/10）</h2>`)
    const rows = o.krs
      .map((k, ki) => `<tr><td style="${TD}">KR${ki + 1}</td><td style="${TD}">${txt(k.text)}</td><td style="${TD}">${Number(k.weight) > 0 ? k.weight + '%' : PLACEHOLDER}</td><td style="${TD}">${txt(k.scale)}</td></tr>`)
      .join('')
    parts.push(`<table style="${TBL}"><tr><th style="${THH}">#</th><th style="${THH}">关键结果（定量）</th><th style="${THH}">权重</th><th style="${THH}">评分口径</th></tr>${rows || `<tr><td style="${TD}" colspan="4">${PLACEHOLDER}</td></tr>`}</table>`)
  })
  parts.push(`<p style="font-size:10px;color:#666;margin-top:14px;text-align:center;">本 OKR 卡由有条工具 OKR 生成器生成；「____」为待填空位。</p>`)
  return parts.join('')
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const DRAFT_KEY = 'okr-generator.draft-v1'

const period = ref('2026 Q4')
const objectives = reactive([])
const copyDone = ref(false)

const addO = () => objectives.push({ text: '', confidence: 5, krs: [{ text: '', weight: '', scale: '' }, { text: '', weight: '', scale: '' }] })
const removeO = (i) => objectives.splice(i, 1)
const addKr = (o) => o.krs.push({ text: '', weight: '', scale: '' })
const removeKr = (o, ki) => o.krs.splice(ki, 1)

const draftData = () => normalizeOkrDraft({ period: period.value, objectives })

// 单个 O 的权重提示
const weightBadge = (o) => {
  const filled = o.krs.filter((k) => String(k.text ?? '').trim())
  if (!filled.length) return { cls: 'text-muted-foreground', text: '尚未填写 KR' }
  const sum = Math.round(weightSum(filled) * 10) / 10
  if (sum === 100) return { cls: 'text-success', text: `权重合计 ${sum}%，已归一` }
  return { cls: 'text-yellow-600 dark:text-yellow-400', text: `权重合计 ${sum}%（应为 100%，请归一）` }
}

const issues = computed(() => validateObjectives(objectives))
const previewHtml = computed(() => buildOkrHtml(draftData()))
const markdownText = computed(() => buildOkrMarkdown(draftData()))
const textOutput = computed(() => buildOkrText(draftData()))

// ---------- 草稿 ----------
const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const d = normalizeOkrDraft(JSON.parse(raw))
    period.value = d.period || '2026 Q4'
    objectives.splice(0, objectives.length, ...d.objectives)
  } catch (e) { /* 草稿损坏则忽略 */ }
}
const persist = () => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData())) } catch (e) { /* 隐私模式静默 */ }
}
const clearDraft = () => {
  period.value = '2026 Q4'
  objectives.splice(0, objectives.length)
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) { /* 忽略 */ }
  }
}

const printReport = () => { window.print() }

let copyTimer = null
const doCopy = async (text) => {
  await navigator.clipboard.writeText(text)
  copyDone.value = true
  alert('已复制')
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyDone.value = false }, 2000)
}
const copyMarkdown = async () => {
  try { await doCopy(markdownText.value) } catch (e) { /* 剪贴板不可用 */ }
}
const copyText = async () => {
  try { await doCopy(textOutput.value) } catch (e) { /* 剪贴板不可用 */ }
}

onMounted(() => {
  addRecentTool('okr-generator')
  restore()
  if (!objectives.length) addO()
  watch(draftData, persist)
})
</script>

<style scoped>
.fld {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  outline: none;
}
.fld:focus {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
.a4-paper {
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media print {
  .no-print {
    display: none !important;
  }
  .a4-paper {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .bg-white {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>

<style>
@media print {
  header {
    display: none !important;
  }
}
@page {
  size: A4 portrait;
  margin: 0;
}
</style>
