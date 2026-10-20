<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Terminal class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">ANSI转义码预览</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴含 ANSI 颜色码的文本，本地渲染终端效果，支持 16/256/RGB 色并可复制为 HTML</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        CI 日志、终端输出里满是 <code class="font-mono text-xs">\x1b[31m</code> 这样的转义码，复制到聊天工具里只剩一片乱码。本工具把 SGR 转义序列（前景 30-37 / 90-97、背景 40-47、粗体 / 下划线 / 反色、256 色 <code class="font-mono text-xs">38;5;n</code> 与真彩色 <code class="font-mono text-xs">38;2;r;g;b</code>）实时翻译成 CSS 样式渲染成黑底终端预览，并支持一键复制为带样式的 HTML 片段。解析全部在浏览器本地完成，尖括号等字符做了转义，粘贴内容不会执行。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 文本输入
        </h2>
        <textarea
          v-model="ansiText"
          class="w-full h-72 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴带 ANSI 码的文本（支持真实 ESC 字符或字面量 \x1b[31m / \033[31m / \e[31m），例如：&#10;\x1b[31m这是红字\x1b[0m"
          spellcheck="false"
        ></textarea>

        <div>
          <p class="text-sm font-medium text-foreground mb-2">插入常用码（追加到文本末尾）</p>
          <div class="space-y-2">
            <div class="flex flex-wrap gap-1.5">
              <span class="text-xs text-muted-foreground leading-6 mr-1">前景 30-37：</span>
              <button
                v-for="c in fgCodes"
                :key="c.code"
                @click="insertCode(c.code)"
                class="px-2 py-0.5 rounded text-xs font-mono border border-border hover:opacity-80 transition-opacity"
                :style="{ color: c.hex }"
                :title="'\\x1b[' + c.code + 'm'"
              >{{ c.code }} {{ c.name }}</button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span class="text-xs text-muted-foreground leading-6 mr-1">亮色 90-97：</span>
              <button
                v-for="c in brightCodes"
                :key="c.code"
                @click="insertCode(c.code)"
                class="px-2 py-0.5 rounded text-xs font-mono border border-border hover:opacity-80 transition-opacity"
                :style="{ color: c.hex }"
                :title="'\\x1b[' + c.code + 'm'"
              >{{ c.code }} {{ c.name }}</button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span class="text-xs text-muted-foreground leading-6 mr-1">背景 40-47：</span>
              <button
                v-for="c in bgCodes"
                :key="c.code"
                @click="insertCode(c.code)"
                class="px-2 py-0.5 rounded text-xs font-mono border border-border hover:opacity-80 transition-opacity"
                :style="{ color: '#fff', backgroundColor: c.hex }"
                :title="'\\x1b[' + c.code + 'm'"
              >{{ c.code }} {{ c.name }}</button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button @click="insertCode('1')" class="px-2.5 py-1 rounded text-xs font-mono bg-muted hover:bg-muted/80 text-foreground font-bold">粗体 1</button>
              <button @click="insertCode('4')" class="px-2.5 py-1 rounded text-xs font-mono bg-muted hover:bg-muted/80 text-foreground underline">下划线 4</button>
              <button @click="insertCode('7')" class="px-2.5 py-1 rounded text-xs font-mono bg-foreground text-background">反色 7</button>
              <button @click="insertCode('0')" class="px-2.5 py-1 rounded text-xs font-mono border border-border hover:bg-muted text-foreground">重置 0</button>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="fillSample" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">填入示例</button>
          <button @click="copyHtml" class="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1">
            <Check v-if="copiedKey === 'html'" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            {{ copiedKey === 'html' ? '已复制' : '复制为 HTML' }}
          </button>
          <button @click="ansiText = ''" class="px-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">清空</button>
        </div>
      </div>

      <!-- 渲染输出 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <Terminal class="w-5 h-5 mr-2 text-primary" /> 终端预览
          </h2>
          <pre class="bg-[#0c0c0c] text-[#ccc] rounded-lg p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all min-h-[10rem] overflow-auto max-h-[24rem]"><template v-for="(seg, si) in renderSegs" :key="si"><span :style="segToCss(seg.style)">{{ seg.text }}</span></template><span v-if="renderSegs.length === 0" class="text-[#555]">等待输入……</span></pre>
          <p class="text-xs text-muted-foreground mt-2">不支持的转义码会被忽略并继续着色；纯文本原样显示。</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 16 色对照表
          </h2>
          <div class="grid grid-cols-8 gap-1.5">
            <div v-for="(hex, i) in ANSI16" :key="i" class="rounded p-2 text-center" :style="{ backgroundColor: i === 0 ? '#0c0c0c' : hex, border: '1px solid rgba(128,128,128,.3)' }">
              <p class="text-[10px] font-mono" :style="{ color: (i === 0 || i === 4 || i === 1 ? '#fff' : '#000') }">{{ i < 8 ? 30 + i : 90 + (i - 8) }}</p>
              <p class="text-[9px] font-mono break-all" :style="{ color: (i === 0 || i === 4 || i === 1 ? '#ddd' : '#111') }">{{ hex }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-3 text-xs font-mono text-muted-foreground">
            <p>256 色：<span class="text-foreground">38;5;0~255</span>（16 基础 + 216 立方 + 24 灰阶）</p>
            <p>真彩色：<span class="text-foreground">38;2;r;g;b</span>，背景用 <span class="text-foreground">48;…</span></p>
          </div>
        </div>

        <div v-if="ansiHtml.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <Code2 class="w-5 h-5 mr-2 text-primary" /> 生成的 HTML
          </h2>
          <p class="text-xs text-muted-foreground font-mono break-all bg-muted/50 rounded-lg p-3 max-h-32 overflow-auto">{{ ansiHtml }}</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 ANSI 转义码预览</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            ANSI 转义序列是终端给文字着色的约定：以 ESC（<code class="font-mono">\x1b</code>）接 <code class="font-mono">[</code>、若干以分号分隔的参数、结尾 <code class="font-mono">m</code>（SGR）表示一组样式开关。日志系统（Jenkins、GitLab CI、Docker logs、pytest）大量输出这些码，但聊天软件与浏览器不认识它们，于是就有了满屏的 <code class="font-mono">\x1b[0m</code>。本工具正是这层「翻译官」。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何使用</h3>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>直接把 CI/终端日志粘进左侧框——真实 ESC 控制字符、字面量 <code class="font-mono">\x1b[31m</code>、<code class="font-mono">\033[</code>、<code class="font-mono">\e[</code> 三种写法都能识别；</li>
            <li>右侧即时渲染黑底终端预览，颜色、粗体、下划线、反色与真实终端一致；</li>
            <li>需要写文档时点「复制为 HTML」，得到一串 <code class="font-mono">&lt;span style="color:…"&gt;</code>，粘到富文本编辑器即保留颜色。</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">支持的 SGR 码</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>前景 30-37 与亮色 90-97，背景 40-47 与 100-107；0 重置、1 粗体、2 暗淡、3 斜体、4 下划线、7 反色，以及 22/23/24/27/39/49 单项关闭。</li>
            <li>扩展色 <code class="font-mono">38;5;n</code>（xterm 256 色板）与 <code class="font-mono">38;2;r;g;b</code>（RGB 真彩色），背景同理用 48；冒号写法 <code class="font-mono">38:5:196</code> 也兼容。</li>
            <li>光标移动、屏幕清理等非 SGR 序列（如 <code class="font-mono">\x1b[2K</code>）不在预览范围内，会被忽略。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">粘贴带尖括号的内容安全吗？</span>安全。渲染走 Vue 的文本插值而非 v-html，HTML 导出前也做了 &amp; / &lt; / &gt; 转义，粘贴的 <code class="font-mono">&lt;script&gt;</code> 只会作为普通字符显示。</li>
            <li><span class="text-foreground font-medium">为什么颜色十六进制和别的工具不一样？</span>ANSI 的 16 色没有强制色值，各终端主题自行定义；本工具采用常见的紧凑取值（31 红为 #c00），256 色与真彩色按 xterm 标准色板换算。</li>
            <li><span class="text-foreground font-medium">文本会上传吗？</span>不会。解析、渲染、HTML 生成全部在浏览器本地完成，适合粘贴含密钥的 CI 日志。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ansi-preview'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Terminal, FileText, Copy, Check, Palette, Code2,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'ANSI转义码预览 - 终端颜色文本在线渲染与转HTML',
  description: '在线 ANSI 转义码预览器，把 \\x1b[31m 等 SGR 颜色码实时渲染成终端效果，支持 16 色、256 色 38;5;n、RGB 真彩色与粗体下划线反色，一键复制为 HTML，纯本地解析不上传',
  keywords: 'ANSI转义码, ansi颜色预览, 终端颜色渲染, 256色, xterm, CI日志颜色, ansi转html',
  author: 'Util工具箱',
  ogTitle: 'ANSI转义码预览 - 有条工具',
  ogDescription: '粘贴含 ANSI 颜色码的文本渲染出终端效果，支持16/256色与转 HTML',
  ogUrl: 'https://www.util.cn/tools/ansi-preview',
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
          name: 'ANSI转义码预览',
          url: 'https://www.util.cn/tools/ansi-preview',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['16/256/RGB 真彩色支持', '粗体/下划线/反色渲染', '字面量 \\x1b 与真实 ESC 均可', '一键复制为 HTML', '16 色对照表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'ANSI转义码预览', item: 'https://www.util.cn/tools/ansi-preview/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '粘贴带尖括号的内容安全吗？',
              acceptedAnswer: { '@type': 'Answer', text: '安全。渲染使用文本插值而非 v-html，HTML 导出前也对 & < > 做了转义，脚本只会作为普通字符显示。' }
            },
            {
              '@type': 'Question',
              name: '为什么颜色十六进制值和别的工具不一样？',
              acceptedAnswer: { '@type': 'Answer', text: 'ANSI 16 色没有强制色值，各终端主题自行定义；本工具采用常见紧凑取值（31 红为 #c00），256 色与真彩色按 xterm 标准色板换算。' }
            },
            {
              '@type': 'Question',
              name: '文本会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析、渲染与 HTML 生成全部在浏览器本地完成，适合粘贴含密钥的 CI 日志。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ansi-preview')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== 纯函数（node 自测提取区）begin ==== */
// ANSI 16 色（前 8 正常、后 8 亮色）；31 红取 #c00（见 FAQ）
const ANSI16 = ['#000', '#c00', '#0c0', '#cc0', '#00c', '#c0c', '#0cc', '#ccc', '#7f7f7f', '#f00', '#0f0', '#ff0', '#00f', '#f0f', '#0ff', '#fff']

function toHex2(v) {
  const n = Math.max(0, Math.min(255, Math.round(Number(v) || 0)))
  return n.toString(16).padStart(2, '0')
}

// xterm 256 色板
function xterm256(n) {
  const idx = Number(n)
  if (!Number.isFinite(idx) || idx < 0 || idx > 255) return null
  if (idx < 16) return ANSI16[idx]
  if (idx >= 232) {
    const h = toHex2(8 + (idx - 232) * 10)
    return '#' + h + h + h
  }
  const i = idx - 16
  const r = Math.floor(i / 36)
  const g = Math.floor(i / 6) % 6
  const b = i % 6
  const conv = (v) => (v === 0 ? 0 : 55 + v * 40)
  return '#' + toHex2(conv(r)) + toHex2(conv(g)) + toHex2(conv(b))
}

// 字面量 \x1b[ \033[ \e[（含大写）统一换成真实 ESC
function normalizeAnsiText(raw) {
  return String(raw == null ? '' : raw).replace(/\\(?:x1b|033|e)\[/gi, '\u001b[')
}

function newAnsiStyle() {
  return { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false }
}

function resetAnsiStyle(st) {
  st.fg = null
  st.bg = null
  st.bold = false
  st.dim = false
  st.italic = false
  st.underline = false
  st.inverse = false
}

function applySgrCodes(st, codes) {
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i]
    if (c === '' || c === '0') { resetAnsiStyle(st); continue }
    if (c === '38' || c === '48') {
      const isFg = c === '38'
      const mode = codes[++i]
      if (mode === '5') {
        const color = xterm256(codes[++i])
        if (color) { if (isFg) st.fg = color; else st.bg = color }
      } else if (mode === '2') {
        const rv = codes[++i]
        const gv = codes[++i]
        const bv = codes[++i]
        const color = '#' + toHex2(rv) + toHex2(gv) + toHex2(bv)
        if (isFg) st.fg = color; else st.bg = color
      }
      continue
    }
    const n = Number(c)
    if (!Number.isFinite(n)) continue
    if (n >= 30 && n <= 37) st.fg = ANSI16[n - 30]
    else if (n >= 90 && n <= 97) st.fg = ANSI16[n - 90 + 8]
    else if (n >= 40 && n <= 47) st.bg = ANSI16[n - 40]
    else if (n >= 100 && n <= 107) st.bg = ANSI16[n - 100 + 8]
    else if (n === 1) st.bold = true
    else if (n === 2) st.dim = true
    else if (n === 3) st.italic = true
    else if (n === 4) st.underline = true
    else if (n === 7) st.inverse = true
    else if (n === 22) { st.bold = false; st.dim = false }
    else if (n === 23) st.italic = false
    else if (n === 24) st.underline = false
    else if (n === 27) st.inverse = false
    else if (n === 39) st.fg = null
    else if (n === 49) st.bg = null
    // 其余码（5 闪烁、9 删除线、光标控制等）忽略
  }
}

// 文本 -> 带样式段
function parseAnsiSegments(text) {
  const segs = []
  const st = newAnsiStyle()
  const src = String(text == null ? '' : text)
  // 匹配全部 CSI 序列：ESC [ 参数 结束字节(@-~)；只有 m（SGR）着色，其余（如 2K、光标移动）剥除
  const re = new RegExp(String.fromCharCode(27) + '\\[([\\d;:?]*)([@-~])', 'g')
  let last = 0
  let m = re.exec(src)
  while (m !== null) {
    const plain = src.slice(last, m.index)
    if (plain) segs.push({ text: plain, style: Object.assign({}, st) })
    if (m[2] === 'm') applySgrCodes(st, m[1].split(/[;:]+/))
    last = re.lastIndex
    m = re.exec(src)
  }
  const tail = src.slice(last)
  if (tail) segs.push({ text: tail, style: Object.assign({}, st) })
  return segs
}

function segToCss(style) {
  let fg = style.fg
  let bg = style.bg
  if (style.inverse) {
    const nf = bg !== null ? bg : '#000'
    const nb = fg !== null ? fg : '#ccc'
    fg = nf
    bg = nb
  }
  const parts = []
  if (fg) parts.push('color:' + fg)
  if (bg) parts.push('background-color:' + bg)
  if (style.bold) parts.push('font-weight:bold')
  if (style.dim) parts.push('opacity:0.65')
  if (style.italic) parts.push('font-style:italic')
  if (style.underline) parts.push('text-decoration:underline')
  return parts.join(';')
}

function escapeHtmlText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ANSI 文本 -> 带 <span style> 的 HTML（已转义）
function ansiToHtml(raw) {
  const segs = parseAnsiSegments(normalizeAnsiText(raw))
  return segs.map(seg => {
    const css = segToCss(seg.style)
    const esc = escapeHtmlText(seg.text)
    return css ? '<span style="' + css + '">' + esc + '</span>' : esc
  }).join('')
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 状态 ----------
const ansiText = ref('')
const seoContentVisible = ref(true)
const copiedKey = ref('')
let copyTimer = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const renderSegs = computed(() => parseAnsiSegments(normalizeAnsiText(ansiText.value)))
const ansiHtml = computed(() => ansiToHtml(ansiText.value))

const fgCodes = [
  { code: '30', name: '黑', hex: ANSI16[0] },
  { code: '31', name: '红', hex: ANSI16[1] },
  { code: '32', name: '绿', hex: ANSI16[2] },
  { code: '33', name: '黄', hex: ANSI16[3] },
  { code: '34', name: '蓝', hex: ANSI16[4] },
  { code: '35', name: '品红', hex: ANSI16[5] },
  { code: '36', name: '青', hex: ANSI16[6] },
  { code: '37', name: '白', hex: ANSI16[7] }
]
const brightCodes = [
  { code: '90', name: '灰', hex: ANSI16[8] },
  { code: '91', name: '亮红', hex: ANSI16[9] },
  { code: '92', name: '亮绿', hex: ANSI16[10] },
  { code: '93', name: '亮黄', hex: ANSI16[11] },
  { code: '94', name: '亮蓝', hex: ANSI16[12] },
  { code: '95', name: '亮品红', hex: ANSI16[13] },
  { code: '96', name: '亮青', hex: ANSI16[14] },
  { code: '97', name: '亮白', hex: ANSI16[15] }
]
const bgCodes = [
  { code: '40', name: '黑', hex: ANSI16[0] },
  { code: '41', name: '红', hex: ANSI16[1] },
  { code: '42', name: '绿', hex: ANSI16[2] },
  { code: '43', name: '黄', hex: ANSI16[3] },
  { code: '44', name: '蓝', hex: ANSI16[4] },
  { code: '45', name: '品红', hex: ANSI16[5] },
  { code: '46', name: '青', hex: ANSI16[6] },
  { code: '47', name: '白', hex: ANSI16[7] }
]

// 以字面量形式插入（normalizeAnsiText 会识别）
const insertCode = (code) => {
  ansiText.value += '\\x1b[' + code + 'm'
}

const fillSample = () => {
  ansiText.value = [
    '\\x1b[31m错误：构建失败\\x1b[0m  \\x1b[32m成功：3 passed\\x1b[0m  \\x1b[1;33m警告：依赖过期\\x1b[0m',
    '\\x1b[38;5;196m256 色 196（红）\\x1b[0m  \\x1b[38;5;51m256 色 51（青）\\x1b[0m',
    '\\x1b[38;2;10;20;30mRGB 真彩色深蓝\\x1b[0m  \\x1b[48;5;21;97m蓝底白字（48;5 + 97）\\x1b[0m',
    '\\x1b[4m下划线\\x1b[24m \\x1b[7m反色\\x1b[27m \\x1b[3m斜体\\x1b[23m \\x1b[95m亮品红\\x1b[0m',
    '\\x1b[31m这段 <scr' + 'ipt>alert("xss")</scr' + 'ipt> 会被转义为普通文本\\x1b[0m'
  ].join('\n')
}

const copyText = async (text, key) => {
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch (e2) {
      ok = false
    }
  }
  if (ok) {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  }
}

const copyHtml = () => {
  copyText(ansiHtml.value, 'html')
}
</script>
