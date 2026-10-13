<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Code class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">代码截图美化器</h1>
          <p class="text-sm text-muted-foreground mt-1">Canvas 本地渲染分享图，中英混排不缺字，一键导出 PNG</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴代码，选择语言与主题，右侧实时渲染 macOS 风格的精美分享图。基于系统等宽字体栈 <code class="px-1 bg-muted rounded text-sm">ui-monospace, 'SF Mono', Menlo, Consolas, 'PingFang SC', monospace</code> 渲染，天然支持中文注释与中英混排（这是相对 carbon 等在线工具的核心差异化：无需上传代码、无需注册登录、中文不再显示为豆腐块）。全部渲染与导出在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Code class="w-5 h-5 mr-2 text-primary" /> 代码输入
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">代码内容（支持中文注释）</label>
          <textarea
            v-model="code"
            rows="12"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="粘贴你的代码..."
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">语言（影响高亮规则）</label>
            <select
              v-model="language"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="(meta, key) in LANG_META" :key="key" :value="key">{{ meta.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">文件名标签（可选）</label>
            <input
              v-model="fileName"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 main.js"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">主题（深色 / 浅色 / 渐变色板）</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in THEMES"
              :key="t.id"
              @click="themeId = t.id"
              :title="t.label"
              :class="[
                'w-14 h-9 rounded-lg border-2 transition-all flex items-center justify-center text-[10px] font-medium',
                themeId === t.id ? 'border-primary scale-105' : 'border-border hover:border-muted-foreground'
              ]"
              :style="{ background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]})`, color: t.light ? '#334155' : '#f8fafc' }"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="showControls"
            type="checkbox"
            id="windowControls"
            class="w-4 h-4 rounded border-border"
          >
          <label for="windowControls" class="text-sm text-foreground">显示 macOS 窗口控件（三圆点标题栏）</label>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            外边距（内边距）：<span class="text-primary">{{ padding }}px</span>
          </label>
          <input v-model.number="padding" type="range" min="16" max="96" step="4" class="w-full accent-primary" />
        </div>
      </div>

      <!-- 右侧：预览与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 flex flex-col">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <button
            @click="exportPng"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download class="w-4 h-4" /> 导出 PNG
          </button>
        </div>

        <div class="flex-1 overflow-auto rounded-lg border border-border bg-muted/30 p-3 max-h-[560px]">
          <canvas ref="canvasRef" class="max-w-full h-auto rounded"></canvas>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          按设备像素比（devicePixelRatio）高清渲染，导出即为所见。渲染纯本地完成，代码不会离开浏览器。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于代码截图美化器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            写技术博客、发朋友圈、提 PR 描述时，一张排版精美的代码分享图远比干巴巴的文本更受欢迎。本工具把代码渲染成 macOS 风格的窗口截图，支持 8 种语言的高亮、深色/浅色与 6 款渐变背景、窗口控件开关与边距调节，一键导出高清 PNG。整个过程基于 Canvas 在你的浏览器本地完成——代码不上传服务器、不依赖任何在线 API，离线也能用。
          </p>

          <h3 class="text-lg font-semibold text-foreground">为什么中文注释不再变成豆腐块</h3>
          <p>
            carbon 等主流代码截图工具使用 Web 字体（如 JetBrains Mono、Fira Code），这些字体不含中文字形，中文注释只能靠浏览器回退字体拼接，常常出现宽窄不一、字体突兀甚至豆腐块（□□□）。本工具直接使用系统等宽字体栈：<code class="px-1 bg-muted rounded">ui-monospace, 'SF Mono', Menlo, Consolas, 'PingFang SC', monospace</code>——macOS 走 SF Mono + 苹方，Windows 走 Consolas + 微软雅黑回退，中文注释与英文代码天然同排渲染，观感统一。
          </p>

          <h3 class="text-lg font-semibold text-foreground">语法高亮是怎么实现的</h3>
          <p>
            内置一套轻量正则高亮引擎，对每一行做四类着色：注释（<code class="px-1 bg-muted rounded">//</code>、<code class="px-1 bg-muted rounded">#</code>、<code class="px-1 bg-muted rounded">/* */</code>、<code class="px-1 bg-muted rounded">&lt;!-- --&gt;</code>）、字符串（含转义引号处理）、关键字（按语言切换关键字表：JS/TS/Python/Java/Go/CSS/HTML/JSON）与数字。虽不及专业 IDE 精细，但对分享图场景完全够用，且零依赖、纯本地计算。
          </p>

          <h3 class="text-lg font-semibold text-foreground">如何使用本工具</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>左侧粘贴代码，选择语言（影响高亮规则）</li>
            <li>挑选主题：深色、浅色或 6 款渐变背景之一</li>
            <li>按需开关 macOS 三圆点窗口控件、填写文件名标签、拖动滑条调节边距</li>
            <li>点击「导出 PNG」保存分享图</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">代码会被上传吗？</span>不会。渲染与导出全部在你的浏览器内通过 Canvas 完成，页面没有网络请求，纯本地处理。</li>
            <li><span class="text-foreground font-medium">导出的图清晰吗？</span>画布按设备像素比（devicePixelRatio）渲染，Retina 屏导出即为 2x 高清图，适合直接发布。</li>
            <li><span class="text-foreground font-medium">支持哪些语言？</span>JavaScript、TypeScript、Python、Java、Go、CSS、HTML、JSON 八种，覆盖绝大多数分享场景；其余语言可选 JS 规则获得基础着色。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'code-screenshot-beautifier'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Code, Download, ImageIcon, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '代码截图美化器 - 中文注释完美渲染，导出高清 PNG',
  description: '在线代码截图美化工具，Canvas 本地渲染 macOS 风格代码分享图。系统等宽字体栈天然支持中文注释，8 种语言语法高亮，深色/浅色/渐变主题，一键导出高清 PNG，纯本地处理不上传代码',
  keywords: '代码截图美化, 代码分享图生成, carbon替代, 代码美化图, 中文代码截图, 程序员截图工具',
  author: 'Util工具箱',
  ogTitle: '代码截图美化器 - 有条工具',
  ogDescription: 'Canvas 本地渲染代码分享图，中文注释不缺字，一键导出 PNG',
  ogUrl: 'https://www.util.cn/tools/code-screenshot-beautifier',
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
          name: '代码截图美化器',
          url: 'https://www.util.cn/tools/code-screenshot-beautifier',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Canvas 本地渲染', '中文注释等宽渲染', '8 种语言语法高亮', '深色/浅色/渐变主题', 'macOS 窗口控件', '高清 PNG 导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '代码截图美化器', item: 'https://www.util.cn/tools/code-screenshot-beautifier/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '代码会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。渲染与导出全部在浏览器内通过 Canvas 本地完成，页面没有网络请求，代码不会离开你的设备。' }
            },
            {
              '@type': 'Question',
              name: '为什么中文注释显示效果比 carbon 好？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具使用系统等宽字体栈（ui-monospace、SF Mono、Menlo、Consolas、PingFang SC），中文字形由系统原生回退，中文与英文天然同排渲染，不会出现豆腐块。' }
            },
            {
              '@type': 'Question',
              name: '导出的 PNG 清晰度如何？',
              acceptedAnswer: { '@type': 'Answer', text: '画布按设备像素比（devicePixelRatio）渲染，Retina 屏上导出即为 2 倍高清图，适合直接发布到社交平台或博客。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'code-screenshot-beautifier')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 语法高亮纯函数（可独立提取测试） =====
const KEYWORDS = {
  js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'new', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'this', 'super', 'switch', 'case', 'break', 'continue', 'do', 'delete', 'void', 'yield', 'static', 'get', 'set', 'of', 'in'],
  ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'implements', 'interface', 'type', 'enum', 'import', 'export', 'from', 'default', 'async', 'await', 'new', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'this', 'super', 'switch', 'case', 'break', 'continue', 'public', 'private', 'protected', 'readonly', 'static', 'abstract', 'declare', 'namespace', 'as', 'satisfies', 'keyof', 'void', 'never', 'unknown', 'any', 'string', 'number', 'boolean'],
  python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'class', 'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'global', 'nonlocal', 'yield', 'async', 'await', 'assert', 'del', 'match', 'case', 'self'],
  java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package', 'this', 'super', 'abstract', 'synchronized', 'volatile', 'transient', 'enum', 'instanceof', 'boolean', 'int', 'long', 'double', 'float', 'char', 'byte', 'short', 'var', 'record', 'null', 'true', 'false'],
  go: ['func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'go', 'defer', 'chan', 'select', 'package', 'import', 'type', 'struct', 'interface', 'map', 'var', 'const', 'new', 'make', 'nil', 'true', 'false', 'goto', 'fallthrough'],
  css: [],
  html: [],
  json: ['true', 'false', 'null']
}

const LANG_META = {
  js: { label: 'JavaScript', quotes: ["'", '"', '`'], lineComment: '//', blockStart: '/*', blockEnd: '*/' },
  ts: { label: 'TypeScript', quotes: ["'", '"', '`'], lineComment: '//', blockStart: '/*', blockEnd: '*/' },
  python: { label: 'Python', quotes: ['"""', "'''", '"', "'"], lineComment: '#', blockStart: null, blockEnd: null },
  java: { label: 'Java', quotes: ['"', "'"], lineComment: '//', blockStart: '/*', blockEnd: '*/' },
  go: { label: 'Go', quotes: ['`', '"', "'"], lineComment: '//', blockStart: '/*', blockEnd: '*/' },
  css: { label: 'CSS', quotes: ['"', "'"], lineComment: null, blockStart: '/*', blockEnd: '*/' },
  html: { label: 'HTML', quotes: ['"', "'"], lineComment: null, blockStart: '<!--', blockEnd: '-->' },
  json: { label: 'JSON', quotes: ['"'], lineComment: null, blockStart: null, blockEnd: null }
}

// 对单行代码做轻量语法高亮，返回 token 数组 [{text, type}]
// type ∈ 'plain' | 'keyword' | 'string' | 'comment' | 'number'
function highlightLine(line, lang) {
  const meta = LANG_META[lang] || LANG_META.js
  const keywords = KEYWORDS[lang] || KEYWORDS.js
  const tokens = []
  const n = line.length
  let i = 0
  let plain = ''
  const flush = () => {
    if (plain) {
      tokens.push({ text: plain, type: 'plain' })
      plain = ''
    }
  }
  const quotes = meta.quotes.slice().sort((a, b) => b.length - a.length)

  while (i < n) {
    // 行注释：// 或 #，到行尾
    if (meta.lineComment && line.startsWith(meta.lineComment, i)) {
      flush()
      tokens.push({ text: line.slice(i), type: 'comment' })
      return tokens
    }
    // 块注释：本行内闭合，未闭合则着色到行尾
    if (meta.blockStart && line.startsWith(meta.blockStart, i)) {
      flush()
      const end = line.indexOf(meta.blockEnd, i + meta.blockStart.length)
      const stop = end === -1 ? n : end + meta.blockEnd.length
      tokens.push({ text: line.slice(i, stop), type: 'comment' })
      i = stop
      continue
    }
    // 字符串：支持 ' " ` 与三引号，处理转义引号
    let hitQuote = null
    for (const q of quotes) {
      if (line.startsWith(q, i)) {
        hitQuote = q
        break
      }
    }
    if (hitQuote) {
      flush()
      let stop = n
      let p = i + hitQuote.length
      while (p <= n - hitQuote.length) {
        const idx = line.indexOf(hitQuote, p)
        if (idx === -1) break
        let esc = 0
        let k = idx - 1
        while (k >= i && line[k] === '\\') {
          esc++
          k--
        }
        if (esc % 2 === 0) {
          stop = idx + hitQuote.length
          break
        }
        p = idx + hitQuote.length
      }
      tokens.push({ text: line.slice(i, stop), type: 'string' })
      i = stop
      continue
    }
    const ch = line[i]
    // CSS 十六进制颜色按数字着色
    if (lang === 'css' && ch === '#' && /[0-9a-fA-F]/.test(line[i + 1] || '')) {
      flush()
      let j = i + 1
      while (j < n && /[0-9a-fA-F]/.test(line[j])) j++
      tokens.push({ text: line.slice(i, j), type: 'number' })
      i = j
      continue
    }
    // HTML 标签括号与标签名按关键字着色
    if (lang === 'html' && (ch === '<' || ch === '>')) {
      flush()
      if (ch === '<') {
        let j = i + 1
        if (line[j] === '/') j++
        while (j < n && /[a-zA-Z0-9-]/.test(line[j])) j++
        tokens.push({ text: line.slice(i, j), type: 'keyword' })
        i = j
      } else {
        tokens.push({ text: ch, type: 'keyword' })
        i++
      }
      continue
    }
    // 数字（含小数与简单科学计数）
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(line[i + 1] || ''))) {
      flush()
      let j = i + 1
      while (j < n && /[0-9a-zA-Z._]/.test(line[j])) j++
      tokens.push({ text: line.slice(i, j), type: 'number' })
      i = j
      continue
    }
    // 标识符 / 关键字（@开头供 CSS at 规则使用）
    if (/[A-Za-z_$@]/.test(ch)) {
      let j = i + 1
      while (j < n && /[A-Za-z0-9_$]/.test(line[j])) j++
      const word = line.slice(i, j)
      let type = 'plain'
      const bare = word.startsWith('@') ? word.slice(1) : word
      if (word.startsWith('@') && lang === 'css') type = 'keyword'
      else if (keywords.includes(word) || keywords.includes(word.toLowerCase())) type = 'keyword'
      flush()
      tokens.push({ text: word, type })
      i = j
      continue
    }
    plain += ch
    i++
  }
  flush()
  return tokens
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const DEFAULT_CODE = `// 中文注释也能完美渲染，这是与 carbon 的核心差异
const greet = (name) => {
  const msg = \`你好, \${name}! 欢迎使用\`
  console.log(msg) // 控制台输出
  return msg
}

const answer = 42
greet('世界')`

const code = ref(DEFAULT_CODE)
const language = ref('js')
const fileName = ref('main.js')
const themeId = ref('dark')
const showControls = ref(true)
const padding = ref(40)
const seoContentVisible = ref(true)

const THEMES = [
  { id: 'dark', label: '深色', bg: ['#334155', '#0f172a'], editorBg: '#0d1117', plain: '#e6edf3', keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', number: '#79c0ff', titleText: '#8b949e', light: false },
  { id: 'light', label: '浅色', bg: ['#e2e8f0', '#cbd5e1'], editorBg: '#ffffff', plain: '#1f2328', keyword: '#cf222e', string: '#0a3069', comment: '#6e7781', number: '#0550ae', titleText: '#6e7781', light: true },
  { id: 'grad-purple', label: '紫粉', bg: ['#a855f7', '#ec4899'], editorBg: '#0d1117', plain: '#e6edf3', keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', number: '#79c0ff', titleText: '#8b949e', light: false },
  { id: 'grad-blue', label: '蓝青', bg: ['#3b82f6', '#06b6d4'], editorBg: '#0d1117', plain: '#e6edf3', keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', number: '#79c0ff', titleText: '#8b949e', light: false },
  { id: 'grad-sunset', label: '日落', bg: ['#f97316', '#ef4444'], editorBg: '#1c1917', plain: '#fafaf9', keyword: '#fb7185', string: '#fde68a', comment: '#a8a29e', number: '#7dd3fc', titleText: '#a8a29e', light: false },
  { id: 'grad-green', label: '青绿', bg: ['#10b981', '#0ea5e9'], editorBg: '#0d1117', plain: '#e6edf3', keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', number: '#79c0ff', titleText: '#8b949e', light: false },
  { id: 'grad-night', label: '夜空', bg: ['#312e81', '#0f172a'], editorBg: '#111827', plain: '#e5e7eb', keyword: '#f472b6', string: '#93c5fd', comment: '#9ca3af', number: '#fbbf24', titleText: '#9ca3af', light: false },
  { id: 'grad-paper', label: '纸白', bg: ['#fef3c7', '#fde68a'], editorBg: '#fffbeb', plain: '#292524', keyword: '#b91c1c', string: '#1d4ed8', comment: '#78716c', number: '#047857', titleText: '#78716c', light: true }
]

const currentTheme = computed(() => THEMES.find(t => t.id === themeId.value) || THEMES[0])

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- Canvas 渲染（仅客户端，onMounted / watch / 回调中访问 DOM） ----------
const canvasRef = ref(null)
const FONT_STACK = "ui-monospace, 'SF Mono', Menlo, Consolas, 'PingFang SC', monospace"

const roundRectPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const draw = () => {
  const cvs = canvasRef.value
  if (!cvs || typeof document === 'undefined') return
  const ctx = cvs.getContext('2d')
  if (!ctx) return

  const theme = currentTheme.value
  const lines = (code.value || '').split('\n')
  const fontSize = 15
  const lineHeight = 24
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1

  // 测量最长行
  const measureCanvas = document.createElement('canvas')
  const mctx = measureCanvas.getContext('2d')
  mctx.font = `${fontSize}px ${FONT_STACK}`
  let maxW = 0
  for (const ln of lines) {
    const w = mctx.measureText(ln).width
    if (w > maxW) maxW = w
  }

  const editorPadX = 24
  const titleBarH = showControls.value ? 48 : 0
  const editorPadTop = titleBarH + 16
  const editorPadBottom = 20
  const editorW = Math.max(360, Math.ceil(maxW) + editorPadX * 2 + 8)
  const editorH = editorPadTop + lines.length * lineHeight + editorPadBottom
  const outer = Math.max(8, padding.value || 0)
  const cssW = editorW + outer * 2
  const cssH = editorH + outer * 2

  cvs.width = Math.round(cssW * dpr)
  cvs.height = Math.round(cssH * dpr)
  cvs.style.width = cssW + 'px'
  cvs.style.height = cssH + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 背景：渐变或纯色
  const g = ctx.createLinearGradient(0, 0, cssW, cssH)
  g.addColorStop(0, theme.bg[0])
  g.addColorStop(1, theme.bg[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cssW, cssH)

  // 编辑器卡片（带阴影圆角）
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  ctx.fillStyle = theme.editorBg
  roundRectPath(ctx, outer, outer, editorW, editorH, 12)
  ctx.fill()
  ctx.restore()

  // macOS 标题栏：三圆点 + 文件名
  if (showControls.value) {
    const dotY = outer + 24
    const dotColors = ['#ff5f57', '#febc2e', '#28c840']
    dotColors.forEach((c, idx) => {
      ctx.beginPath()
      ctx.arc(outer + 24 + idx * 18, dotY, 6, 0, Math.PI * 2)
      ctx.fillStyle = c
      ctx.fill()
    })
    const name = fileName.value.trim()
    if (name) {
      ctx.font = `13px ${FONT_STACK}`
      ctx.fillStyle = theme.titleText
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(name, outer + editorW / 2, dotY)
      ctx.textAlign = 'left'
    }
    // 标题栏分隔线
    ctx.strokeStyle = theme.light ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(outer + 1, outer + 44)
    ctx.lineTo(outer + editorW - 1, outer + 44)
    ctx.stroke()
  }

  // 逐行绘制高亮 token
  ctx.font = `${fontSize}px ${FONT_STACK}`
  ctx.textBaseline = 'middle'
  const firstLineY = outer + editorPadTop
  lines.forEach((ln, li) => {
    const y = firstLineY + li * lineHeight + lineHeight / 2
    let x = outer + editorPadX
    const toks = highlightLine(ln, language.value)
    for (const t of toks) {
      ctx.fillStyle = theme[t.type] || theme.plain
      ctx.fillText(t.text, x, y)
      x += ctx.measureText(t.text).width
    }
  })
}

watch([code, language, fileName, themeId, showControls, padding], () => draw())

onMounted(() => {
  draw()
})

// 导出 PNG（用户点击回调内访问 DOM 与下载 API）
const exportPng = () => {
  const cvs = canvasRef.value
  if (!cvs) return
  cvs.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = (fileName.value.trim() || 'code').replace(/\.[^.]*$/, '')
    a.download = `${base || 'code'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}
</script>
