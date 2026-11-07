<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SWOT分析生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">四象限填表，自动交叉 TOWS 策略引导，导出 SVG 四象限图 / Markdown / A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按 S 优势 / W 劣势 / O 机会 / T 威胁四象限逐条填写，每个象限不足 2 条时黄标提醒「分析单薄」；
        填完自动展开 TOWS 交叉策略四格（SO 进攻 / WO 补强 / ST 防御 / WT 规避），每格带引导问题帮你把「分析」推进到「策略」。
        支持导出彩色 SVG 四象限图、复制 Markdown、A4 打印，草稿自动保存在本机浏览器。全部处理本地完成，不上传数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：填表区 -->
      <div class="no-print space-y-4">
        <!-- 分析对象 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <PenLine class="w-5 h-5 mr-2 text-primary" /> 分析对象
          </h2>
          <input v-model="subject" type="text" class="fld" maxlength="60" placeholder="如：本公司智能硬件业务 2027 年 / 某产品线 / 个人职业发展" />
          <p class="text-xs text-muted-foreground mt-2">建议写「主体 + 时间范围」，同一个主体下的事实才能互相比较</p>
        </div>

        <!-- 四象限 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="q in QUADRANT_UI"
            :key="q.key"
            class="bg-card border rounded-lg p-4"
            :class="cardClsFor(q.key)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold" :class="q.textCls">{{ q.key }} · {{ q.label }}</span>
              <span class="text-xs" :class="badgeFor(q.key).cls">{{ badgeFor(q.key).badge }}</span>
            </div>
            <textarea
              v-model="quads[q.key]"
              rows="5"
              class="fld resize-y"
              :placeholder="q.placeholder"
              :aria-label="`${q.key} ${q.label}，每行一条`"
            ></textarea>
          </div>
        </div>

        <!-- TOWS 交叉策略 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> TOWS 交叉策略
          </h2>
          <p class="text-xs text-muted-foreground mb-4">
            TOWS 把上面已填的象限两两交叉出策略：每格的引导问题基于对应象限自动关联（如 SO 格用的就是 S×O），想不出来时先回头补充对应象限
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="k in TOWS_KEYS" :key="k.key" class="border border-border rounded-lg p-4">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">{{ k.key }}</span>
                <span class="text-sm font-semibold text-foreground">{{ k.label }}</span>
              </div>
              <p class="text-xs text-muted-foreground mb-2">{{ k.prompt }}</p>
              <textarea
                v-model="tows[k.key]"
                rows="3"
                class="fld resize-y"
                :placeholder="k.placeholder"
                :aria-label="`${k.key} ${k.label}，每行一条`"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 操作 -->
        <div class="bg-card border border-border rounded-lg p-6 flex flex-wrap gap-2">
          <button type="button" @click="copyMarkdown" class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5">
            <Copy class="w-4 h-4" /> 复制 Markdown
          </button>
          <button type="button" @click="downloadSvg" class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5">
            <Download class="w-4 h-4" /> 下载 SVG 四象限图
          </button>
          <button type="button" @click="printReport" class="flex-1 min-w-[100px] px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5">
            <Printer class="w-4 h-4" /> A4 打印
          </button>
          <button type="button" @click="clearDraft" class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5">
            <Eraser class="w-4 h-4" /> 清空
          </button>
        </div>
      </div>

      <!-- 右：预览 -->
      <div class="space-y-6">
        <!-- SVG 四象限图预览 -->
        <div class="no-print">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> SVG 四象限图预览
          </h2>
          <div class="border border-border rounded-lg overflow-auto bg-card p-3" v-html="svgCode"></div>
        </div>
        <!-- A4 打印预览 -->
        <div class="print-area">
          <div class="no-print flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Printer class="w-5 h-5 mr-2 text-primary" /> 报告预览（A4）
            </h2>
            <button type="button" @click="printReport" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5">
              <Printer class="w-4 h-4" /> 打印
            </button>
          </div>
          <div class="bg-white text-black border border-border rounded-lg shadow-sm overflow-hidden a4-paper">
            <div class="px-[8%] py-[7%]" v-html="previewHtml"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="no-print bg-card border border-border rounded-lg p-6 mb-8">
      <summary class="text-lg font-semibold cursor-pointer select-none text-foreground flex items-center">
        <span class="text-primary mr-2">#</span>SWOT 与 TOWS 什么关系？SWOT 分析最常见的三种误用
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <h3 class="text-lg font-semibold text-foreground">SWOT 是「盘点」，TOWS 才是「出招」</h3>
        <p>
          SWOT 四象限只完成了一件事：把内部事实（优势 S、劣势 W）与外部环境（机会 O、威胁 T）分门别类地摆上桌面。
          但摆事实不产生行动——1982 年海因茨·韦里克（Heinz Weihrich）提出的 TOWS 矩阵把四个象限两两交叉，
          得到四类策略：SO 用优势去抓机会（进攻）、WO 补劣势去够机会（补强）、ST 用优势去挡威胁（防御）、WT 收缩回避劣势撞威胁（规避）。
          所以专业说法里 TOWS 常被叫做「SWOT 的行动化」：先 SWOT 盘点，再 TOWS 出策略。本工具的四格引导问题就是按这个交叉关系自动关联的。
        </p>
        <h3 class="text-lg font-semibold text-foreground">SWOT 最常见的三种误用</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">把 O 写成愿望：</span>「机会：成为行业第一」不是机会，是愿望。机会必须写外部环境里真实存在、且不随你主观意愿改变的事实，如「政策补贴窗口期到 2027 年」「竞品 A 因合规问题被迫收缩华东市场」。</li>
          <li><span class="text-foreground font-medium">把 W 写成借口：</span>「劣势：行业太卷」「劣势：预算不够」是把锅甩给环境。劣势应写「与关键对手相比可改变的相对短板」，如「交付周期 45 天，是头部对手的两倍」，并区分「改得动的」与「改不动的」。</li>
          <li><span class="text-foreground font-medium">填完四格就结束：</span>没有 TOWS 交叉的 SWOT 只是汇报素材。每条重要组合至少落一行策略，并追问「谁、什么时候、先做哪一步」，才进入可执行的决策链路。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">怎么判断分析做扎实了</h3>
        <p>
          一个实用标准：每个象限至少 2 条（本工具对少于 2 条的象限黄标提醒），每条都是「具体事实＋可核对」（有时间、数字、对象），
          且四象限之间存在张力——S 能回应 T、W 挡着 O，说明内外部信息是同一套事实体系，而不是各写各的好话与坏话。
        </p>
        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">S 和 O 划不清怎么办？</span>用内外部试金石：来自主体内部、别人拿不走也学不会的是 S；来自外部环境、时过境迁就消失的是 O。「团队有十年硬件经验」是 S，「政策补贴窗口开启」是 O。</li>
          <li><span class="text-foreground font-medium">TOWS 四格必须都填吗？</span>建议至少填 SO 与 ST（进攻与防御是主线）；WT 格填的是「要不要放弃/收缩」的判断，很多分析的价值恰恰在这里显形。</li>
          <li><span class="text-foreground font-medium">导出的 SVG 能改吗？</span>SVG 是标准矢量格式，可用 Figma、Illustrator 或 PPT 直接打开继续编辑配色与排版，也可插入文档无损缩放。</li>
          <li><span class="text-foreground font-medium">填写内容会上传吗？</span>不会。全部处理与草稿保存在当前浏览器 localStorage 中，换设备或清除数据会丢失，请及时导出。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">延伸工具</h3>
        <p>
          分析完要拍板排序，可以配合 <a href="/tools/decision-framework-cards/" class="text-primary hover:underline">决策执行框架卡</a>（5W2H 计划 / PDCA 循环 / 四象限优先级）把策略落成行动。
        </p>
        <h3 class="text-lg font-semibold text-foreground">来源与口径说明</h3>
        <p>
          SWOT 框架源于 20 世纪 60 年代斯坦福研究院（SRI）等机构的企业规划实践；TOWS 矩阵出自 Heinz Weihrich 1982 年论文
          《The TOWS Matrix — A Tool for Situational Analyses》（Long Range Planning）。本工具的象限划分、完整度阈值与引导问题为教学口径的简化整理，
          输出为参考模板，不构成投资或经营建议。
        </p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'swot-analysis-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  LayoutGrid, PenLine, Lightbulb, Download, Printer, Copy, Check, Eraser
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'SWOT分析生成器 - 四象限填表自动交叉TOWS策略',
  description: '免费在线SWOT分析工具：优势/劣势/机会/威胁四象限逐条填写，不足2条黄标提醒分析单薄，自动关联TOWS交叉策略四格（SO进攻/WO补强/ST防御/WT规避）并给出引导问题，导出彩色SVG四象限图、复制Markdown、A4打印，草稿本地保存不上传',
  keywords: 'SWOT分析,SWOT模板,swot怎么写,TOWS矩阵,SWOT分析生成器,战略分析工具,四象限分析',
  author: '有条工具',
  ogTitle: 'SWOT分析生成器 - 四象限填表自动交叉TOWS策略 | 有条工具',
  ogDescription: 'SWOT 四象限逐条填写，自动关联 TOWS 交叉策略引导，导出 SVG 四象限图 / Markdown / A4 打印。',
  ogUrl: 'https://www.util.cn/tools/swot-analysis-generator',
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
          name: 'SWOT分析生成器',
          url: 'https://www.util.cn/tools/swot-analysis-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['优势/劣势/机会/威胁四象限逐条填写', '象限不足2条黄标提醒分析单薄', 'TOWS交叉策略四格自动关联引导问题', '导出彩色SVG四象限图', '复制Markdown报告', 'A4打印报告', '草稿本机保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: 'SWOT分析生成器', item: 'https://www.util.cn/tools/swot-analysis-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'SWOT 和 TOWS 是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: 'SWOT 负责盘点内部优势劣势与外部机会威胁；TOWS 矩阵（Weihrich，1982）把四个象限两两交叉出策略：SO 进攻、WO 补强、ST 防御、WT 规避。SWOT 摆事实，TOWS 出行动。' }
            },
            {
              '@type': 'Question',
              name: '为什么说「把 O 写成愿望」是 SWOT 最常见误用？',
              acceptedAnswer: { '@type': 'Answer', text: '机会必须是外部环境里真实存在、不随主观意愿改变的事实（如政策窗口、竞品收缩）；「成为行业第一」是目标不是机会，写成机会会让 SO 策略失去事实支撑。' }
            },
            {
              '@type': 'Question',
              name: '每个象限应该写几条？',
              acceptedAnswer: { '@type': 'Answer', text: '建议每象限 3-6 条、至少 2 条：少于 2 条说明盘点不充分（本工具会黄标提醒）；超过 6 条时通常需要合并同类，聚焦最重要的信息。' }
            },
            {
              '@type': 'Question',
              name: '填写内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。全部处理与草稿保存在当前浏览器 localStorage 中，不上传服务器；换设备或清除浏览器数据会丢失，请及时导出。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const PLACEHOLDER = '____'

// 四象限元信息（S×O→SO 等 TOWS 交叉关系）
const TOWS_MAP = {
  SO: { sources: ['S', 'O'], label: '进攻策略', prompt: '如何用优势（S）抓住机会（O）？——哪些优势能直接放大机会？' },
  WO: { sources: ['W', 'O'], label: '补强策略', prompt: '要抓住机会（O），需先补上哪些劣势（W）？' },
  ST: { sources: ['S', 'T'], label: '防御策略', prompt: '如何用优势（S）化解或抵御威胁（T）？' },
  WT: { sources: ['W', 'T'], label: '规避策略', prompt: '当劣势（W）撞上威胁（T）时，如何收缩、规避或退出？' }
}

// 按交叉关系返回某策略格依赖的象限（如 SO → ['S','O']）
function towsSources(kind) {
  const k = String(kind || '').toUpperCase()
  return TOWS_MAP[k] ? TOWS_MAP[k].sources.slice() : null
}

// 按行拆分非空条目
function splitLines(text) {
  return String(text || '').split('\n').map((s) => s.trim()).filter(Boolean)
}

// 象限完整度：0 条 empty（待填写）、1 条 thin（分析单薄）、其余 ok
function quadrantStatus(count) {
  const n = Number(count) || 0
  if (n <= 0) return { count: n, level: 'empty', message: '待填写' }
  if (n < 2) return { count: n, level: 'thin', message: '分析单薄（少于 2 条）' }
  return { count: n, level: 'ok', message: n + ' 条' }
}

// 四象限完整度汇总
function analyzeCompleteness(quads) {
  const q = quads && typeof quads === 'object' ? quads : {}
  const result = {}
  ;['S', 'W', 'O', 'T'].forEach((k) => {
    result[k] = quadrantStatus(splitLines(q[k]).length)
  })
  return result
}

// SVG 文本转义
function escapeXml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// CJK 全角按 1 个单位、半角按 0.5 个单位折行
function charUnits(ch) {
  return /[\x00-\xff]/.test(ch) ? 0.5 : 1
}
function wrapText(text, maxUnits) {
  const s = String(text ?? '').trim()
  if (!s) return []
  const lines = []
  let cur = ''
  let units = 0
  for (const ch of s) {
    const u = charUnits(ch)
    if (units + u > maxUnits && cur) {
      lines.push(cur)
      cur = ch
      units = u
    } else {
      cur += ch
      units += u
    }
  }
  if (cur) lines.push(cur)
  return lines
}

const SWOT_COLORS = {
  S: { head: '#16a34a', bg: '#f0fdf4', line: '#bbf7d0' },
  W: { head: '#ea580c', bg: '#fff7ed', line: '#fed7aa' },
  O: { head: '#2563eb', bg: '#eff6ff', line: '#bfdbfe' },
  T: { head: '#9333ea', bg: '#faf5ff', line: '#e9d5ff' }
}
const SWOT_LABELS = {
  S: { label: '优势 Strengths', cn: '优势' },
  W: { label: '劣势 Weaknesses', cn: '劣势' },
  O: { label: '机会 Opportunities', cn: '机会' },
  T: { label: '威胁 Threats', cn: '威胁' }
}

// 生成 SWOT 四象限 SVG（全部文本转义；每条最多 3 行，超出省略）
function buildSwotSvg(data) {
  const d = data && typeof data === 'object' ? data : {}
  const items = {}
  ;['S', 'W', 'O', 'T'].forEach((k) => { items[k] = splitLines(d[k]) })

  const W = 920
  const M = 24
  const GAP = 12
  const quadW = Math.floor((W - M * 2 - GAP) / 2)
  const HEAD_H = 30
  const LINE_H = 19
  const ITEM_GAP = 7
  const MAX_LINES = 3
  const MAX_UNITS = 26

  const itemLines = (text) => {
    let lines = wrapText(text, MAX_UNITS)
    if (lines.length > MAX_LINES) {
      lines = lines.slice(0, MAX_LINES)
      lines[MAX_LINES - 1] = lines[MAX_LINES - 1] + '…'
    }
    return lines
  }

  const quadHeight = (k) => {
    const list = items[k]
    if (!list.length) return HEAD_H + 14 + LINE_H + ITEM_GAP + 12
    const sum = list.reduce((s, it) => s + itemLines(it).length * LINE_H + ITEM_GAP, 0)
    return HEAD_H + 14 + sum + 12
  }

  const gridTop = 84
  const colH1 = Math.max(quadHeight('S'), quadHeight('W'), 110)
  const colH2 = Math.max(quadHeight('O'), quadHeight('T'), 110)
  const H = gridTop + colH1 + GAP + colH2 + M

  const quadRects = []
  const drawQuad = (k, x, y, w, h) => {
    const c = SWOT_COLORS[k]
    const meta = SWOT_LABELS[k]
    const list = items[k]
    quadRects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c.bg}" stroke="${c.line}" stroke-width="1.5"/>`)
    quadRects.push(`<text x="${x + 16}" y="${y + 21}" font-size="15" font-weight="bold" fill="${c.head}">${k} · ${escapeXml(meta.label)}</text>`)
    let cy = y + HEAD_H + 8
    if (!list.length) {
      quadRects.push(`<text x="${x + 16}" y="${cy + 13}" font-size="13" fill="#9ca3af">（待填写）</text>`)
      return
    }
    list.forEach((it) => {
      const lines = itemLines(it)
      lines.forEach((ln, li) => {
        const bullet = li === 0 ? '· ' : '  '
        quadRects.push(`<text x="${x + 16}" y="${cy + 13}" font-size="13" fill="#1f2937">${escapeXml(bullet + ln)}</text>`)
        cy += LINE_H
      })
      cy += ITEM_GAP
    })
  }

  const subject = String(d.subject ?? '').trim()
  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'PingFang SC','Microsoft YaHei','Helvetica Neue',Arial,sans-serif">`)
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`)
  parts.push(`<text x="${W / 2}" y="40" font-size="20" font-weight="bold" fill="#111827" text-anchor="middle">SWOT 分析</text>`)
  parts.push(`<text x="${W / 2}" y="63" font-size="13" fill="#6b7280" text-anchor="middle">分析对象：${escapeXml(subject || '（未填写）')}</text>`)
  drawQuad('S', M, gridTop, quadW, colH1)
  drawQuad('W', M + quadW + GAP, gridTop, quadW, colH1)
  drawQuad('O', M, gridTop + colH1 + GAP, quadW, colH2)
  drawQuad('T', M + quadW + GAP, gridTop + colH1 + GAP, quadW, colH2)
  parts.push(...quadRects)
  parts.push('</svg>')
  return parts.join('\n')
}

// 草稿规范化
function normalizeSwotDraft(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const str = (v) => String(v ?? '').slice(0, 8000)
  return {
    subject: str(r.subject),
    S: str(r.S), W: str(r.W), O: str(r.O), T: str(r.T),
    SO: str(r.SO), WO: str(r.WO), ST: str(r.ST), WT: str(r.WT)
  }
}

// Markdown 报告（含全部象限条目与 TOWS 策略）
function buildSwotMarkdown(f) {
  const d = normalizeSwotDraft(f)
  const lines = []
  lines.push('# SWOT 分析' + (d.subject.trim() ? '：' + d.subject.trim() : ''))
  const sec = (k) => {
    const list = splitLines(d[k])
    lines.push('')
    lines.push(`## ${k} ${SWOT_LABELS[k].label}`)
    lines.push('')
    if (list.length) list.forEach((it, i) => lines.push(`${i + 1}. ${it}`))
    else lines.push('（待填写）')
  }
  ;['S', 'W', 'O', 'T'].forEach(sec)
  lines.push('')
  lines.push('## TOWS 交叉策略')
  ;['SO', 'WO', 'ST', 'WT'].forEach((k) => {
    const meta = TOWS_MAP[k]
    const list = splitLines(d[k])
    lines.push('')
    lines.push(`### ${k} ${meta.label}（${meta.sources.join('×')}）——${meta.prompt}`)
    lines.push('')
    if (list.length) list.forEach((it) => lines.push('- ' + it))
    else lines.push('（待填写）')
  })
  return lines.join('\n')
}

// A4 报告 HTML（预览与打印共用，全部转义）
function buildSwotHtml(f) {
  const d = normalizeSwotDraft(f)
  const esc = escapeXml
  const listHtml = (k) => {
    const list = splitLines(d[k])
    if (!list.length) return `<p style="margin:4px 0;color:#666;">${PLACEHOLDER}</p>`
    return `<ol style="margin:4px 0;padding-left:22px;font-size:12px;line-height:1.8;">${list.map((it) => `<li>${esc(it)}</li>`).join('')}</ol>`
  }
  const SEC_H = 'font-size:15px;font-weight:bold;margin:14px 0 6px;padding:4px 8px;border-left:4px solid;'
  const block = (k) => {
    const c = SWOT_COLORS[k]
    return `<h2 style="${SEC_H}border-left-color:${c.head};color:${c.head};">${k} ${SWOT_LABELS[k].label}</h2>${listHtml(k)}`
  }
  const TD = 'border:1px solid #888;padding:6px 8px;vertical-align:top;font-size:12px;line-height:1.7;width:50%;'
  const towsCell = (k) => {
    const meta = TOWS_MAP[k]
    const list = splitLines(d[k])
    const body = list.length
      ? `<ul style="margin:4px 0;padding-left:18px;">${list.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`
      : `<p style="margin:4px 0;color:#666;">${PLACEHOLDER}</p>`
    return `<td style="${TD}"><strong style="color:${SWOT_COLORS[meta.sources[0]].head};">${k} ${meta.label}</strong>（${meta.sources.join('×')}）<br/><span style="font-size:11px;color:#555;">${esc(meta.prompt)}</span>${body}</td>`
  }
  return [
    `<h1 style="text-align:center;font-size:21px;font-weight:bold;margin:0 0 4px;letter-spacing:0.1em;">SWOT 分析报告</h1>`,
    `<p style="text-align:center;font-size:11px;color:#555;margin:0 0 14px;">分析对象：${esc(d.subject.trim() || '（未填写）')}</p>`,
    block('S'), block('W'), block('O'), block('T'),
    `<h2 style="font-size:15px;font-weight:bold;margin:16px 0 6px;padding:4px 8px;background:#efefef;border-left:4px solid #333;">TOWS 交叉策略</h2>`,
    `<table style="width:100%;border-collapse:collapse;"><tr>${towsCell('SO')}${towsCell('WO')}</tr><tr>${towsCell('ST')}${towsCell('WT')}</tr></table>`,
    `<p style="font-size:10px;color:#666;margin-top:14px;text-align:center;">本报告由有条工具 SWOT 分析生成器生成；「____」为待填空位。</p>`
  ].join('')
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const DRAFT_KEY = 'swot-analysis-generator.draft-v1'

const QUADRANT_UI = [
  { key: 'S', label: '优势 Strengths', textCls: 'text-green-600 dark:text-green-400', placeholder: '每行一条，写具体事实：如\n自研供应链成本低于同行 15%\n核心团队有十年硬件量产经验' },
  { key: 'W', label: '劣势 Weaknesses', textCls: 'text-orange-600 dark:text-orange-400', placeholder: '每行一条，写与对手比较的相对短板：如\n交付周期 45 天，是头部对手两倍\n线下渠道覆盖率不足 30%' },
  { key: 'O', label: '机会 Opportunities', textCls: 'text-blue-600 dark:text-blue-400', placeholder: '每行一条，写外部真实存在的事实：如\n补贴政策窗口期到 2027 年\n竞品 A 因合规问题收缩华东市场' },
  { key: 'T', label: '威胁 Threats', textCls: 'text-purple-600 dark:text-purple-400', placeholder: '每行一条，写外部不利变化：如\n头部厂商降价 20% 清库存\n上游主控芯片供应集中度过高' }
]
const TOWS_UI = [
  { key: 'SO', label: '进攻策略', placeholder: '每行一条策略' },
  { key: 'WO', label: '补强策略', placeholder: '每行一条策略' },
  { key: 'ST', label: '防御策略', placeholder: '每行一条策略' },
  { key: 'WT', label: '规避策略', placeholder: '每行一条策略' }
]
const TOWS_KEYS = TOWS_UI.map((t) => t.key)

const subject = ref('')
const quads = reactive({ S: '', W: '', O: '', T: '' })
const tows = reactive({ SO: '', WO: '', ST: '', WT: '' })
const copyDone = ref(false)

const quadrantStatuses = computed(() => analyzeCompleteness(quads))
const badgeFor = (key) => {
  const st = quadrantStatuses.value[key]
  if (st.level === 'ok') return { cls: 'text-success', badge: st.count + ' 条' }
  return { cls: 'text-yellow-600 dark:text-yellow-400', badge: st.message }
}
const cardClsFor = (key) => {
  const st = quadrantStatuses.value[key]
  return st.level === 'ok' ? 'border-border' : 'border-yellow-500/50'
}

const draftData = () => normalizeSwotDraft({
  subject: subject.value, S: quads.S, W: quads.W, O: quads.O, T: quads.T,
  SO: tows.SO, WO: tows.WO, ST: tows.ST, WT: tows.WT
})
const svgCode = computed(() => buildSwotSvg(draftData()))
const previewHtml = computed(() => buildSwotHtml(draftData()))
const markdownText = computed(() => buildSwotMarkdown(draftData()))

// ---------- 草稿 ----------
const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const d = normalizeSwotDraft(JSON.parse(raw))
    subject.value = d.subject
    quads.S = d.S; quads.W = d.W; quads.O = d.O; quads.T = d.T
    tows.SO = d.SO; tows.WO = d.WO; tows.ST = d.ST; tows.WT = d.WT
  } catch (e) { /* 草稿损坏则忽略 */ }
}
const persist = () => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData())) } catch (e) { /* 隐私模式静默 */ }
}
const clearDraft = () => {
  subject.value = ''
  quads.S = ''; quads.W = ''; quads.O = ''; quads.T = ''
  tows.SO = ''; tows.WO = ''; tows.ST = ''; tows.WT = ''
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) { /* 忽略 */ }
  }
}

const printReport = () => { window.print() }

const sanitizeFileTag = (s) => String(s || '').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 40) || '分析'

const downloadSvg = () => {
  try {
    const blob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `SWOT_${sanitizeFileTag(subject.value)}_${today}.svg`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('导出 SVG 失败，请改用浏览器截图或 A4 打印。')
  }
}

let copyTimer = null
const copyMarkdown = async () => {
  try {
    await navigator.clipboard.writeText(markdownText.value)
    copyDone.value = true
    alert('已复制')
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copyDone.value = false }, 2000)
  } catch (e) { /* 剪贴板不可用时用户可手动复制 */ }
}

onMounted(() => {
  addRecentTool('swot-analysis-generator')
  restore()
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
