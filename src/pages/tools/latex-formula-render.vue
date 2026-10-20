<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FunctionSquare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">LaTeX公式渲染</h1>
          <p class="text-sm text-muted-foreground mt-1">输入 LaTeX 源码，即时渲染为高质量数学公式</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        基于 KaTeX 引擎的在线 LaTeX 公式编辑器：支持行间/行内公式、字号与黑白主题切换、常用符号一键插入，渲染结果可复制 HTML、复制原始 LaTeX 源码，并可尽力导出为 PNG 图片。全部计算在浏览器本地完成，公式内容不会上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入与设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Code class="w-5 h-5 mr-2 text-primary" /> 公式源码
        </h2>

        <textarea
          ref="inputRef"
          v-model="latexSrc"
          rows="8"
          spellcheck="false"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="输入 LaTeX 公式，如 \frac{1}{2}"
        ></textarea>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">渲染模式</label>
            <div class="flex gap-2">
              <button
                @click="renderMode = 'display'"
                :class="renderMode === 'display' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              >行间公式</button>
              <button
                @click="renderMode = 'inline'"
                :class="renderMode === 'inline' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              >行内公式</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">显示主题</label>
            <div class="flex gap-2">
              <button
                @click="previewTheme = 'light'"
                :class="previewTheme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              >白底黑字</button>
              <button
                @click="previewTheme = 'dark'"
                :class="previewTheme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              >黑底白字</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            字号：<span class="text-primary">{{ fontSize }} px</span>
          </label>
          <input v-model.number="fontSize" type="range" min="14" max="48" step="1" class="w-full accent-primary" />
        </div>

        <!-- 常用符号面板 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">常用符号（点击插入光标处）</label>
          <div class="space-y-3">
            <div v-for="group in symbolGroups" :key="group.title">
              <p class="text-xs text-muted-foreground mb-1.5">{{ group.title }}</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="sym in group.items"
                  :key="sym.label"
                  @click="insertSymbol(sym.code)"
                  class="px-2 py-1 bg-muted hover:bg-muted/70 border border-border rounded text-xs font-mono text-foreground transition-colors"
                  :title="sym.code"
                >{{ sym.label }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 示例 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">示例公式</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(example, idx) in examples"
              :key="idx"
              @click="latexSrc = example.code"
              class="px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-lg text-xs text-muted-foreground transition-colors"
            >{{ example.name }}</button>
          </div>
        </div>
      </div>

      <!-- 右侧：渲染结果 -->
      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
          <Eye class="w-5 h-5 mr-2 text-primary" /> 渲染结果
        </h2>

        <!-- 错误提示 -->
        <div v-if="result.ok === false" class="border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm mb-1">
            <AlertTriangle class="w-4 h-4" /> 语法解析错误（ParseError）
          </div>
          <p class="text-xs font-mono text-red-700 dark:text-red-300 break-all leading-relaxed">{{ result.message }}</p>
        </div>

        <!-- 预览区 -->
        <div
          v-show="result.ok === true"
          class="flex-1 rounded-lg border border-border overflow-auto min-h-[160px] flex items-center justify-center"
          :style="previewStyle"
        >
          <div ref="previewRef" class="katex-preview-wrap p-6 max-w-full overflow-x-auto" :style="contentStyle" v-html="result.html"></div>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          <button
            @click="copyHtml"
            class="px-3 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm text-foreground transition-colors flex items-center justify-center gap-1.5"
          ><ClipboardCopy class="w-4 h-4" /> 复制HTML</button>
          <button
            @click="copySource"
            class="px-3 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm text-foreground transition-colors flex items-center justify-center gap-1.5"
          ><Code class="w-4 h-4" /> 复制LaTeX</button>
          <button
            @click="exportPng"
            :disabled="result.ok !== true"
            class="px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
          ><ImageIcon class="w-4 h-4" /> 导出PNG</button>
          <button
            @click="clearAll"
            class="px-3 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm text-foreground transition-colors flex items-center justify-center gap-1.5"
          ><RotateCcw class="w-4 h-4" /> 清空</button>
        </div>

        <p v-if="copyHint" class="text-xs text-primary mt-2">{{ copyHint }}</p>
        <p v-if="exportHint" class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ exportHint }}</p>
        <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
          说明：PNG 导出采用 SVG foreignObject 转 canvas 的方案，因浏览器安全限制无法嵌入 KaTeX 数学字体，导出图可能存在字形偏差；追求完美排版时建议直接对预览区截图。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线 LaTeX 公式渲染</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            LaTeX 是学术与科技文档的事实标准数学排版语言，但本地安装 TeX 发行版体积大、门槛高。本工具使用 KaTeX 渲染引擎，
            在浏览器内即时把 LaTeX 源码编译为公式，速度快、体积小，适合写论文摘公式、做课件、发技术博客、在支持 Markdown 的笔记软件中核对语法，
            以及把公式复制粘贴到 Notion、语雀、知乎等支持 HTML 或图片的编辑器中。
          </p>
          <h3 class="text-lg font-semibold text-foreground">行间公式与行内公式的区别</h3>
          <p>
            行内公式（inline）嵌在正文句子之间，例如 $E=mc^2$，积分上下限会排在两侧以节省高度；
            行间公式（display）独占一行、居中大字号显示，求和与积分的上下限排在符号上下方，如论文中独立成行的推导式。
            切换上方的「渲染模式」即可直观对比两种排版差异。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常用 LaTeX 语法速记</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>分数 \frac{a}{b}、根号 \sqrt{x} 与 n 次根 \sqrt[n]{x}、上下标 x_i^2；</li>
            <li>希腊字母直接输入 \alpha、\beta、\pi，大算符 \sum、\int、\lim；</li>
            <li>矩阵用 \begin{pmatrix} a & b \\ c & d \end{pmatrix}，分段函数用 \begin{cases}；</li>
            <li>括号自适应大小用 \left( ... \right)，空格微调用 \, 与 \;。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">渲染报错怎么办？</span>报错框会显示 KaTeX 的 ParseError 信息，常见原因是括号或花括号不配对（如 \frac{1}{ 少了右花括号）、命令拼写错误。根据报错位置修正源码即可。</li>
            <li><span class="text-foreground font-medium">公式内容安全吗？</span>安全。KaTeX 完全在您的浏览器本地运行，输入的 LaTeX 不会发送到任何服务器。</li>
            <li><span class="text-foreground font-medium">为什么导出的 PNG 字形不对？</span>foreignObject 方式无法加载外部数学字体，导出结果可能用回退字体。建议截图预览区，或复制 HTML 到支持 KaTeX/MathJax 的编辑器中使用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'latex-formula-render'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import {
  FunctionSquare, Code, Eye, ClipboardCopy, AlertTriangle, RotateCcw,
  ChevronUp, ChevronDown, Image as ImageIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'LaTeX公式渲染 - 在线LaTeX编辑器与公式转图片 | 有条工具',
  description: '免费在线LaTeX公式渲染工具，基于KaTeX引擎本地即时编译，支持行间/行内公式、字号主题调节、常用符号插入面板，可复制渲染HTML、复制源码并导出PNG图片',
  keywords: 'LaTeX在线编辑, LaTeX公式渲染, 公式转图片, KaTeX, 数学公式编辑器, latex在线预览, 公式转png',
  author: 'Util工具箱',
  ogTitle: 'LaTeX公式渲染 - 有条工具',
  ogDescription: '输入 LaTeX 即时渲染为公式，KaTeX 本地编译，支持符号面板与导出',
  ogUrl: 'https://www.util.cn/tools/latex-formula-render',
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
          name: 'LaTeX公式渲染',
          url: 'https://www.util.cn/tools/latex-formula-render',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['KaTeX本地即时渲染', '行间/行内模式切换', '字号与黑白主题', '常用符号插入面板', '复制HTML与导出PNG']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'LaTeX公式渲染', item: 'https://www.util.cn/tools/latex-formula-render/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '渲染报错怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '报错框会显示KaTeX的ParseError信息，常见原因是括号或花括号不配对、命令拼写错误，根据报错位置修正源码即可。' }
            },
            {
              '@type': 'Question',
              name: '公式内容安全吗？',
              acceptedAnswer: { '@type': 'Answer', text: '安全。KaTeX完全在浏览器本地运行，输入的LaTeX内容不会发送到任何服务器。' }
            },
            {
              '@type': 'Question',
              name: '为什么导出的PNG字形不对？',
              acceptedAnswer: { '@type': 'Answer', text: 'foreignObject方式无法加载外部数学字体，导出可能使用回退字体，建议直接截图预览区或复制HTML使用。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'latex-formula-render')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const latexSrc = ref('\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}')
const renderMode = ref('display')
const fontSize = ref(22)
const previewTheme = ref('light')
const inputRef = ref(null)
const previewRef = ref(null)
const copyHint = ref('')
const exportHint = ref('')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 纯函数：KaTeX 渲染 ----------
// --- pure-test-start ---
function renderLatex(src, opts = {}) {
  try {
    const html = katex.renderToString(src || '', {
      displayMode: opts.displayMode !== false,
      throwOnError: true,
      errorColor: '#dc2626'
    })
    return { ok: true, html, message: '' }
  } catch (err) {
    return { ok: false, html: '', message: err && err.message ? err.message : String(err) }
  }
}
// --- pure-test-end ---

const result = computed(() => renderLatex(latexSrc.value, { displayMode: renderMode.value === 'display' }))

const previewStyle = computed(() => {
  if (previewTheme.value === 'dark') {
    return { backgroundColor: '#1e1e1e', color: '#f5f5f5' }
  }
  return { backgroundColor: '#ffffff', color: '#111111' }
})

const contentStyle = computed(() => ({ fontSize: fontSize.value + 'px' }))

// ---------- 符号面板 ----------
const symbolGroups = [
  {
    title: '希腊字母',
    items: [
      { label: 'α', code: '\\alpha' }, { label: 'β', code: '\\beta' }, { label: 'γ', code: '\\gamma' },
      { label: 'δ', code: '\\delta' }, { label: 'ε', code: '\\varepsilon' }, { label: 'θ', code: '\\theta' },
      { label: 'λ', code: '\\lambda' }, { label: 'μ', code: '\\mu' }, { label: 'π', code: '\\pi' },
      { label: 'σ', code: '\\sigma' }, { label: 'φ', code: '\\varphi' }, { label: 'ω', code: '\\omega' },
      { label: 'Δ', code: '\\Delta' }, { label: 'Σ', code: '\\Sigma' }, { label: 'Ω', code: '\\Omega' }, { label: '∞', code: '\\infty' }
    ]
  },
  {
    title: '关系与运算符',
    items: [
      { label: '×', code: '\\times' }, { label: '÷', code: '\\div' }, { label: '±', code: '\\pm' },
      { label: '≤', code: '\\leq' }, { label: '≥', code: '\\geq' }, { label: '≠', code: '\\neq' },
      { label: '≈', code: '\\approx' }, { label: '∈', code: '\\in' }, { label: '⊂', code: '\\subset' },
      { label: '∪', code: '\\cup' }, { label: '∩', code: '\\cap' }, { label: '→', code: '\\rightarrow' },
      { label: '∂', code: '\\partial' }, { label: '∇', code: '\\nabla' }, { label: '·', code: '\\cdot' }
    ]
  },
  {
    title: '求和 · 积分 · 极限',
    items: [
      { label: '∑', code: '\\sum_{i=1}^{n} ' }, { label: '∏', code: '\\prod_{i=1}^{n} ' },
      { label: '∫', code: '\\int_{a}^{b} ' }, { label: '∬', code: '\\iint ' },
      { label: 'lim', code: '\\lim_{x \\to \\infty} ' }, { label: 'sqrt', code: '\\sqrt{x}' },
      { label: 'n次根', code: '\\sqrt[n]{x}' }, { label: 'frac', code: '\\frac{a}{b}' }
    ]
  },
  {
    title: '矩阵与结构',
    items: [
      { label: 'pmatrix', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { label: 'bmatrix', code: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
      { label: 'cases', code: '\\begin{cases} x, & x \\geq 0 \\\\ -x, & x < 0 \\end{cases}' },
      { label: '左右括号', code: '\\left( \\right)' },
      { label: '上下标', code: 'x_i^2' },
      { label: '分式堆叠', code: '\\frac{\\partial f}{\\partial x}' }
    ]
  }
]

const examples = [
  { name: '高斯积分', code: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
  { name: '欧拉公式', code: 'e^{i\\pi} + 1 = 0' },
  { name: '质能方程', code: 'E = mc^2' },
  { name: '求和式', code: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}' },
  { name: '矩阵', code: 'A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}' },
  { name: '极限', code: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' }
]

const insertSymbol = (code) => {
  const el = inputRef.value
  if (!el) {
    latexSrc.value = latexSrc.value + code
    return
  }
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : latexSrc.value.length
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start
  latexSrc.value = latexSrc.value.slice(0, start) + code + latexSrc.value.slice(end)
  nextTick(() => {
    el.focus()
    const pos = start + code.length
    el.setSelectionRange(pos, pos)
  })
}

// ---------- 复制与导出 ----------
const flashHint = (setter, text) => {
  setter(text)
  setTimeout(() => setter(''), 3000)
}

const copyHtml = async () => {
  if (result.value.ok !== true) return
  try {
    await navigator.clipboard.writeText(result.value.html)
    flashHint((t) => { copyHint.value = t }, '已复制渲染后的 HTML 代码')
  } catch {
    flashHint((t) => { copyHint.value = t }, '复制失败，请手动选中预览区内容复制')
  }
}

const copySource = async () => {
  try {
    await navigator.clipboard.writeText(latexSrc.value)
    flashHint((t) => { copyHint.value = t }, '已复制原始 LaTeX 源码')
  } catch {
    flashHint((t) => { copyHint.value = t }, '复制失败，请手动选中输入框内容复制')
  }
}

const exportPng = async () => {
  if (result.value.ok !== true) return
  try {
    const el = previewRef.value
    const width = Math.min(4000, Math.ceil((el ? el.scrollWidth : 400) + 32))
    const height = Math.min(4000, Math.ceil((el ? el.scrollHeight : 120) + 32))
    const bg = previewTheme.value === 'dark' ? '#1e1e1e' : '#ffffff'
    const fg = previewTheme.value === 'dark' ? '#f5f5f5' : '#111111'
    const wrapped = '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:' + fontSize.value +
      'px;color:' + fg + ';background:' + bg + ';display:inline-block;padding:16px;">' + result.value.html + '</div>'
    const svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
      '<foreignObject width="100%" height="100%">' + wrapped + '</foreignObject></svg>'
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('SVG 光栅化失败'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        flashHint((t) => { exportHint.value = t }, '导出失败：无法生成 PNG，建议直接截图预览区')
        return
      }
      const dlUrl = URL.createObjectURL(pngBlob)
      const a = document.createElement('a')
      a.href = dlUrl
      a.download = 'formula.png'
      a.click()
      URL.revokeObjectURL(dlUrl)
      flashHint((t) => { exportHint.value = t }, '已导出 formula.png（字体可能与屏幕渲染略有差异）')
    }, 'image/png')
  } catch (err) {
    flashHint((t) => { exportHint.value = t }, '导出失败（' + (err && err.message ? err.message : '浏览器限制') + '），建议对预览区直接截图')
  }
}

const clearAll = () => {
  latexSrc.value = ''
}
</script>

<style scoped>
.katex-preview-wrap :deep(.katex-display) {
  margin: 0;
}
</style>
