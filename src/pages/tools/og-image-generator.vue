<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Share class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">OG 分享卡片生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">生成 1200×630 标准社交分享预览图，标题自动断行排版</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线 OG Image 生成器：填写网站名、标题、副标题，可选上传 Logo 与配图，
        5 套主题模板（简约白 / 深色系 / 渐变 / 品牌蓝绿 / 暗色科技），按 1200×630 的 Open Graph 标准尺寸
        在浏览器 Canvas 中实时合成，导出 PNG 并附推荐 meta 标签代码。全程本地处理，图片不上传。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
          <ShieldCheck class="w-3.5 h-3.5" /> 本地合成 · 不上传
        </span>
        <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">1200×630 标准尺寸</span>
        <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">中文按字 · 英文按词断行</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：文案与素材 -->
      <div class="lg:col-span-1 space-y-5">
        <div class="bg-card border border-border rounded-lg p-4 space-y-4">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <Type class="w-4 h-4 text-primary" /> 卡片文案
          </h3>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">网站名称</label>
            <input
              v-model="siteName"
              type="text"
              maxlength="30"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="例如：有条工具"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">页面标题（自动断行与缩字号）</label>
            <input
              v-model="pageTitle"
              type="text"
              maxlength="80"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="例如：发现 1000+ 免费在线实用工具"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">副标题（可选）</label>
            <input
              v-model="subtitle"
              type="text"
              maxlength="60"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="一句话卖点补充"
            />
          </div>
        </div>

        <!-- 模板 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">主题模板</h3>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="tpl in templates"
              :key="tpl.id"
              @click="templateId = tpl.id"
              :class="templateId === tpl.id ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'"
              class="h-12 rounded-lg border border-border transition-all flex items-end justify-center pb-1"
              :style="{ background: tpl.mode === 'gradient' ? `linear-gradient(135deg, ${tpl.colors[0]}, ${tpl.colors[1]})` : tpl.bg }"
            >
              <span
                class="text-[10px] px-1 rounded"
                :style="{ color: tpl.mode === 'gradient' ? '#fff' : tpl.title, background: 'rgba(127,127,127,0.15)' }"
              >{{ tpl.name }}</span>
            </button>
          </div>
        </div>

        <!-- 素材 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon class="w-4 h-4 text-primary" /> 素材（可选 · 仅本地读取）
          </h3>
          <input ref="logoInputEl" type="file" accept="image/*" class="hidden" @change="e => handleFile(e, 'logo')" />
          <input ref="coverInputEl" type="file" accept="image/*" class="hidden" @change="e => handleFile(e, 'cover')" />
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="logoInputEl && logoInputEl.click()"
              class="py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground transition-colors"
            >
              上传 Logo
            </button>
            <button
              @click="coverInputEl && coverInputEl.click()"
              class="py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground transition-colors"
            >
              上传配图
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            Logo 建议方形透明 PNG；右侧配图建议 4:5 竖图，未上传时自动绘制装饰图形。
            {{ logoName ? `已选 Logo：${logoName}。` : '' }}{{ coverName ? `已选配图：${coverName}。` : '' }}
          </p>
        </div>

        <button
          @click="exportPng"
          class="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Download class="w-4 h-4" /> 导出 PNG（1200×630）
        </button>
      </div>

      <!-- 右侧：实时预览 + meta 代码 -->
      <div class="lg:col-span-2 space-y-4">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-foreground">实时预览（本地 Canvas 合成，未上传）</h3>
            <span class="text-xs text-muted-foreground">1200 × 630 px</span>
          </div>
          <div class="bg-card border border-border rounded-xl p-4">
            <canvas ref="canvasEl" class="w-full h-auto rounded-lg shadow-sm" />
          </div>
        </div>

        <div class="bg-card border border-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
              <Code class="w-4 h-4 text-primary" /> 推荐 meta 标签
            </h3>
            <button
              @click="copySnippet"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            >
              <Check v-if="copied" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制代码' }}
            </button>
          </div>
          <pre class="p-3 bg-muted rounded-lg text-xs font-mono text-foreground overflow-x-auto leading-relaxed">{{ metaSnippet }}</pre>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            导出的 PNG 保存在本地，请先上传到图床或您网站的静态目录，再把 og:image 中的占位地址替换为真实 URL；
            og:title / og:description 建议与卡片文案保持一致。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 OG 图（Open Graph Image）？
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          OG 图是网页在社交分享时展示的预览大图，来自 Open Graph 协议中的 <code>og:image</code> 元标签。
          当链接被分享到微信、微博、X（Twitter）、Telegram、Slack 等平台时，爬虫会读取这些标签生成带图卡片。
          官方推荐尺寸正是 1200×630——宽比约 1.91:1，太小会被拉伸模糊，太大则加载缓慢。
          一张排版干净的分享卡片能显著提升链接点击率，是站长和内容创作者的必备物料。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          生成步骤
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>填写网站名称、页面标题与副标题</li>
          <li>选择一套主题模板，可选上传 Logo 和右侧配图</li>
          <li>在实时预览中确认断行与字号效果</li>
          <li>点击导出 PNG，将图片上传到图床或网站目录</li>
          <li>复制推荐 meta 标签，替换 og:image 的 URL 后放入页面 head</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          标题排版原理：自动断行 + 字号自适应
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          中文没有空格分词，本工具对中文按字符逐字断行、对英文按单词整体断行（不把单词从中间切断），
          使用 measureText 实测每行宽度；当标题过长导致行数超出时自动逐级缩小字号，直到最小字号下限为止，
          保证长短标题都能保持美观的版式重心。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">上传的 Logo 和配图会被传到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。素材只通过浏览器 FileReader 读入内存，在本地 Canvas 内完成裁切与合成，任何像素都不会离开您的设备，
              这也是本站所有图片工具的隐私底线。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么微信里我的链接没有显示这张卡片？</h3>
            <p class="text-muted-foreground mt-1">
              社交平台需要先抓取到您页面 head 里的 og:image 且图片 URL 公网可访问才会生成卡片。
              请确认：① 标签已放入 head；② 图片已上传图床/服务器且地址正确；③ 域名在平台有正常收录。
              微信对未备案或新域名可能不展示外链缩略图。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以用其他尺寸吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具固定输出 1200×630，因为这是 Open Graph 与各主流平台通用的推荐尺寸；
              若需要 Twitter 专用比例或更大 banner，可把导出图当作源文件再行裁剪。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <RelatedTools :currentToolId="'og-image-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Share, Image as ImageIcon, Type, Code, Copy, Check, Download, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* === PURE-HELPERS-START ===
   以下为纯计算函数：不访问任何浏览器 API，可被 node 直接提取自测
   === PURE-HELPERS-START */
function isCjk (ch) {
  const code = ch.codePointAt(0)
  return (
    (code >= 0x2e80 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xac00 && code <= 0xd7af)
  )
}

function tokenizeText (text) {
  const s = String(text === null || text === undefined ? '' : text)
  const tokens = []
  let word = ''
  for (const ch of s) {
    if (/\s/.test(ch)) {
      if (word) { tokens.push(word); word = '' }
      continue
    }
    if (isCjk(ch)) {
      if (word) { tokens.push(word); word = '' }
      tokens.push(ch)
    } else {
      word += ch
    }
  }
  if (word) tokens.push(word)
  return tokens
}

function unitsOf (str) {
  let u = 0
  for (const ch of String(str)) u += isCjk(ch) ? 1 : 0.5
  return u
}

function needsSpace (cur, token) {
  const a = cur.charAt(cur.length - 1)
  const b = token.charAt(0)
  return a !== '' && b !== '' && !isCjk(a) && !isCjk(b)
}

// 通用断行：measure(s) 返回字符串宽度（px 或“字宽单位”均可）
function wrapText (text, maxWidth, measure) {
  const tokens = tokenizeText(text)
  const lines = []
  let cur = ''
  for (const tk of tokens) {
    const joined = cur === '' ? tk : (needsSpace(cur, tk) ? cur + ' ' + tk : cur + tk)
    if (cur !== '' && measure(joined) > maxWidth) {
      lines.push(cur)
      cur = tk
    } else {
      cur = joined
    }
  }
  if (cur !== '') lines.push(cur)
  return lines
}

function wrapByUnits (text, maxUnits) {
  return wrapText(text, maxUnits, unitsOf)
}

// 字号自适应：单位宽 = 字号 × 单位数，行数达标为止，不小于 min
function fitTitleSize (text, maxWidth, maxLines, start, min, step) {
  let fs = start
  while (fs > min) {
    const lines = wrapByUnits(text, maxWidth / fs)
    if (lines.length <= maxLines) return { fontSize: fs, lines }
    fs -= step
  }
  return { fontSize: min, lines: wrapByUnits(text, maxWidth / min) }
}

function coverRect (imgW, imgH, boxW, boxH) {
  if (!(imgW > 0) || !(imgH > 0)) return { sx: 0, sy: 0, sw: boxW, sh: boxH }
  const scale = Math.max(boxW / imgW, boxH / imgH)
  const sw = boxW / scale
  const sh = boxH / scale
  return { sx: (imgW - sw) / 2, sy: (imgH - sh) / 2, sw, sh }
}

function attrEsc (s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
/* === PURE-HELPERS-END === */

// ---------- 模板配置 ----------
const templates = [
  { id: 'white', name: '简约白', mode: 'solid', bg: '#ffffff', title: '#0f172a', sub: '#64748b', accent: '#0ea5e9', footer: '#334155', decor: 'ring', decorColor: 'rgba(14, 165, 233, 0.14)' },
  { id: 'dark', name: '深色系', mode: 'solid', bg: '#0f172a', title: '#f8fafc', sub: '#94a3b8', accent: '#38bdf8', footer: '#cbd5e1', decor: 'blocks', decorColor: 'rgba(56, 189, 248, 0.16)' },
  { id: 'gradient', name: '渐变', mode: 'gradient', colors: ['#4f46e5', '#06b6d4'], title: '#ffffff', sub: 'rgba(255, 255, 255, 0.82)', accent: 'rgba(255, 255, 255, 0.9)', footer: '#ffffff', decor: 'circles', decorColor: 'rgba(255, 255, 255, 0.18)' },
  { id: 'brand', name: '品牌蓝绿', mode: 'gradient', colors: ['#0d9488', '#2563eb'], title: '#ffffff', sub: 'rgba(255, 255, 255, 0.85)', accent: 'rgba(255, 255, 255, 0.92)', footer: '#ffffff', decor: 'circles', decorColor: 'rgba(255, 255, 255, 0.16)' },
  { id: 'tech', name: '暗色科技', mode: 'solid', bg: '#09090b', title: '#e4e4e7', sub: '#a1a1aa', accent: '#22d3ee', footer: '#d4d4d8', decor: 'gridGlow', decorColor: 'rgba(34, 211, 238, 0.22)', grid: true }
]

const OG_W = 1200
const OG_H = 630
const PAD = 72
const COVER_W = 400
const COVER_H = 470
const FONT_STACK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

// ---------- 状态 ----------
const canvasEl = ref(null)
const logoInputEl = ref(null)
const coverInputEl = ref(null)

const siteName = ref('有条工具')
const pageTitle = ref('发现 1000+ 免费在线实用工具')
const subtitle = ref('图片、文本、计算……全部本地处理，不上传')

const logoImg = ref(null)
const logoName = ref('')
const coverImg = ref(null)
const coverName = ref('')
const assetTick = ref(0)

const templateId = ref('gradient')
const seoContentVisible = ref(true)
const copied = ref(false)

const currentTemplate = computed(
  () => templates.find(t => t.id === templateId.value) || templates[0]
)

const metaSnippet = computed(() => {
  const t = pageTitle.value || '页面标题'
  const d = subtitle.value || siteName.value || '网站描述'
  return [
    `<meta property="og:title" content="${attrEsc(t)}">`,
    `<meta property="og:description" content="${attrEsc(d)}">`,
    `<meta property="og:image" content="https://your-site.com/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ].join('\n')
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 绘制 ----------
const traceRoundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

const ellipsisLine = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1)
  return t + '…'
}

const fitAndWrapCanvas = (ctx, text, maxWidth, maxLines, start, min, step) => {
  let fs = start
  while (fs > min) {
    ctx.font = `700 ${fs}px ${FONT_STACK}`
    const lines = wrapText(text, maxWidth, (s) => ctx.measureText(s).width)
    if (lines.length <= maxLines) return { fs, lines }
    fs -= step
  }
  ctx.font = `700 ${min}px ${FONT_STACK}`
  const lines = wrapText(text, maxWidth, (s) => ctx.measureText(s).width)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = ellipsisLine(ctx, lines.slice(maxLines - 1).join(''), maxWidth)
    return { fs: min, lines: kept }
  }
  return { fs: min, lines }
}

const drawDecor = (ctx, tpl, x, y, w, h) => {
  ctx.fillStyle = tpl.decorColor
  ctx.strokeStyle = tpl.decorColor
  if (tpl.decor === 'ring') {
    ctx.lineWidth = w * 0.06
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, w * 0.36, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, w * 0.16, 0, Math.PI * 2)
    ctx.fill()
  } else if (tpl.decor === 'blocks') {
    traceRoundRect(ctx, x, y + h * 0.1, w * 0.62, h * 0.34, 24); ctx.fill()
    traceRoundRect(ctx, x + w * 0.34, y + h * 0.52, w * 0.66, h * 0.38, 24); ctx.fill()
  } else if (tpl.decor === 'gridGlow') {
    ctx.lineWidth = 1.5
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(x + w * 0.55, y + h * 0.45, w * (0.1 + i * 0.09), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillRect(x, y + h - 6, w, 6)
  } else {
    // circles
    ctx.beginPath()
    ctx.arc(x + w * 0.35, y + h * 0.3, w * 0.3, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc(x + w * 0.68, y + h * 0.68, w * 0.24, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }
}

const drawOg = () => {
  const canvas = canvasEl.value
  if (!canvas) return
  canvas.width = OG_W
  canvas.height = OG_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const tpl = currentTemplate.value

  // 背景
  if (tpl.mode === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, OG_W, OG_H)
    grad.addColorStop(0, tpl.colors[0])
    grad.addColorStop(1, tpl.colors[1])
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = tpl.bg
  }
  ctx.fillRect(0, 0, OG_W, OG_H)

  // 科技网格线
  if (tpl.grid) {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.07)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= OG_W; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, OG_H); ctx.stroke()
    }
    for (let gy = 0; gy <= OG_H; gy += 60) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(OG_W, gy); ctx.stroke()
    }
    const glow = ctx.createLinearGradient(0, 0, 0, 6)
    glow.addColorStop(0, 'rgba(34, 211, 238, 0.5)')
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, OG_W, 6)
  }

  const coverX = OG_W - PAD - COVER_W
  const coverY = (OG_H - COVER_H) / 2
  const textMaxW = coverX - PAD * 2

  // 右侧配图 / 装饰
  const cover = coverImg.value
  if (cover) {
    ctx.save()
    traceRoundRect(ctx, coverX, coverY, COVER_W, COVER_H, 24)
    ctx.clip()
    ctx.fillStyle = 'rgba(127, 127, 127, 0.12)'
    ctx.fillRect(coverX, coverY, COVER_W, COVER_H)
    const r = coverRect(cover.naturalWidth, cover.naturalHeight, COVER_W, COVER_H)
    ctx.drawImage(cover, r.sx, r.sy, r.sw, r.sh, coverX, coverY, COVER_W, COVER_H)
    ctx.restore()
    traceRoundRect(ctx, coverX, coverY, COVER_W, COVER_H, 24)
    ctx.strokeStyle = 'rgba(127, 127, 127, 0.22)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  } else {
    drawDecor(ctx, tpl, coverX, coverY, COVER_W, COVER_H)
  }

  // 强调条 + 标题（自动断行 + 字号自适应）
  ctx.fillStyle = tpl.accent
  traceRoundRect(ctx, PAD, 132, 88, 8, 4)
  ctx.fill()

  const titleText = (pageTitle.value || '').trim() || '输入您的页面标题'
  const title = fitAndWrapCanvas(ctx, titleText, textMaxW, 3, 64, 36, 4)
  ctx.font = `700 ${title.fs}px ${FONT_STACK}`
  ctx.fillStyle = tpl.title
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const lineH = Math.round(title.fs * 1.28)
  let cursorY = 168
  title.lines.forEach((line) => {
    ctx.fillText(line, PAD, cursorY)
    cursorY += lineH
  })

  // 副标题（最多 2 行）
  const subText = (subtitle.value || '').trim()
  if (subText) {
    const subY = cursorY + 14
    ctx.font = `400 27px ${FONT_STACK}`
    ctx.fillStyle = tpl.sub
    const subLines = wrapText(subText, textMaxW, (s) => ctx.measureText(s).width).slice(0, 2)
    if (subLines.length === 2) subLines[1] = ellipsisLine(ctx, subLines[1], textMaxW)
    subLines.forEach((line, i) => ctx.fillText(line, PAD, subY + i * 38))
  }

  // 底部：站点名 + Logo
  const footerY = OG_H - PAD - 44
  ctx.strokeStyle = 'rgba(127, 127, 127, 0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, footerY - 24)
  ctx.lineTo(PAD + textMaxW, footerY - 24)
  ctx.stroke()

  let textX = PAD
  const logo = logoImg.value
  if (logo) {
    ctx.save()
    traceRoundRect(ctx, PAD, footerY, 44, 44, 10)
    ctx.clip()
    const lr = coverRect(logo.naturalWidth, logo.naturalHeight, 44, 44)
    ctx.drawImage(logo, lr.sx, lr.sy, lr.sw, lr.sh, PAD, footerY, 44, 44)
    ctx.restore()
    textX = PAD + 44 + 14
  }
  ctx.font = `500 26px ${FONT_STACK}`
  ctx.fillStyle = tpl.footer
  ctx.fillText(siteName.value || '您的网站', textX, footerY + 8)
}

// ---------- 交互 ----------
const handleFile = (e, which) => {
  const input = e.target
  const file = input.files && input.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      if (which === 'logo') {
        logoImg.value = img
        logoName.value = file.name
      } else {
        coverImg.value = img
        coverName.value = file.name
      }
      assetTick.value++
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const exportPng = () => {
  const canvas = canvasEl.value
  if (!canvas) return
  drawOg()
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'og-image-1200x630.png'
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

const copySnippet = async () => {
  try {
    await navigator.clipboard.writeText(metaSnippet.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1600)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

watch(
  [siteName, pageTitle, subtitle, templateId, assetTick],
  () => { drawOg() }
)

onMounted(() => {
  drawOg()
})

// ---------- SEO ----------
useSeoMeta({
  title: 'OG分享卡片生成器 - 1200x630社交预览图制作工具',
  description: '免费在线OG Image生成器，按1200×630标准尺寸合成微信/微博/Twitter分享卡片，5套主题模板，标题自动断行与字号自适应，可上传Logo与配图，浏览器Canvas本地合成导出PNG，图片不上传。',
  keywords: 'OG图生成,og:image,分享卡片制作,社交预览图,1200x630,open graph,网站分享图,Twitter卡片',
  author: '有条工具',
  ogTitle: 'OG分享卡片生成器 - 社交预览图本地制作',
  ogDescription: '1200×630标准尺寸，5套模板，标题自动断行，Canvas本地合成导出PNG，不上传。',
  ogUrl: 'https://www.util.cn/tools/og-image-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'OG分享卡片生成器',
          url: 'https://www.util.cn/tools/og-image-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['1200×630标准尺寸', '5套主题模板', '标题自动断行与字号自适应', 'Logo与配图本地合成', '推荐meta标签一键复制', '图片不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: 'OG分享卡片生成器', item: 'https://www.util.cn/tools/og-image-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '上传的Logo和配图会被传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。素材仅在浏览器内存中读取并本地Canvas合成，任何像素都不会离开您的设备。' }
            },
            {
              '@type': 'Question',
              name: '为什么微信里我的链接没有显示分享卡片？',
              acceptedAnswer: { '@type': 'Answer', text: '需要head中包含og:image且图片URL公网可访问；新域名或未备案域名在部分平台可能不展示外链缩略图。' }
            },
            {
              '@type': 'Question',
              name: 'OG图标准尺寸是多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'Open Graph推荐1200×630（约1.91:1），微信等主流平台均按此比例裁切展示，本工具固定输出该尺寸。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'og-image-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})
</script>
