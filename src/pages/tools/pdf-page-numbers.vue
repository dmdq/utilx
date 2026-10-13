<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ListOrdered class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF页码添加</h1>
          <p class="text-sm text-muted-foreground mt-1">起始号/格式/位置/字号可调，论文标书归档必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 PDF 后在浏览器本地为页面补页码：支持起始页码与起始编号、四种页码格式、四个位置与字号边距调节，纯数字格式矢量写入体积几乎不变。文件全程不上传服务器，论文、标书、归档材料一键编页。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择 PDF 文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf,.pdf"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入一个 PDF 文件</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 纯本地处理，文件不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <FileText class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}<span v-if="pageCount"> · 共 {{ pageCount }} 页</span></p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- 页码设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 页码设置
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">起始页码</label>
              <input
                v-model.number="startPage"
                type="number"
                min="1"
                :max="pageCount || 999"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">从第几页开始加页码</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">起始编号</label>
              <input
                v-model.number="startNumberInput"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="`默认同起始页码（${effectiveStartPage}）`"
              />
              <p class="text-xs text-muted-foreground mt-1.5">第一个加页码的页面显示的数字</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">页码格式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="s in styleOptions"
                :key="s.value"
                @click="style = s.value"
                :class="style === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ s.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              格式预览：<span class="text-foreground font-medium">{{ sampleLabel }}</span>
              <span v-if="hasCJKStyle">（含中文，自动采用高清图像渲染）</span>
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">页码位置</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="p in positionOptions"
                :key="p.value"
                @click="position = p.value"
                :class="position === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ p.label }}</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">字号（pt）</label>
              <input
                v-model.number="fontSize"
                type="number"
                min="6"
                max="36"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">边距（pt）</label>
              <input
                v-model.number="margin"
                type="number"
                min="8"
                max="100"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            @click="applyNumbers"
            :disabled="!file || processing"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <ListOrdered v-else class="w-4 h-4" />
            {{ processing ? '正在添加…' : '添加页码并下载' }}
          </button>
          <p v-if="!file" class="text-xs text-muted-foreground text-center">请先选择一个 PDF 文件</p>
        </div>
      </div>

      <!-- 右侧说明区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <Info class="w-5 h-5 mr-2 text-primary" /> 当前方案预览
        </h2>

        <div v-if="file" class="space-y-4">
          <div class="bg-muted/30 border border-border rounded-lg p-5">
            <div class="flex items-center justify-center min-h-[120px] relative border border-dashed border-border rounded bg-white">
              <span
                class="absolute text-gray-700"
                :class="previewPosClass"
                :style="{ fontSize: Math.min(28, fontSize + 14) + 'px', [previewPosInset]: margin / 3 + 'px' }"
              >{{ sampleLabel }}</span>
              <span class="text-[10px] text-gray-300">第 {{ effectiveStartPage }} 页效果示意</span>
            </div>
          </div>

          <div class="bg-muted/50 border border-border rounded-lg p-4 text-sm space-y-1.5">
            <div class="flex justify-between">
              <span class="text-muted-foreground">加页码范围</span>
              <span class="text-foreground font-medium">第 {{ effectiveStartPage }} 页 至 第 {{ pageCount }} 页（共 {{ numberedCount }} 页被添加）</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">页码格式</span>
              <span class="text-foreground font-medium">{{ currentStyleLabel }}，首个编号为「{{ sampleLabel }}」</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">位置 / 字号 / 边距</span>
              <span class="text-foreground font-medium">{{ currentPositionLabel }} · {{ fontSize }}pt · {{ margin }}pt</span>
            </div>
          </div>

          <div v-if="result" class="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2.5">
            <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p class="text-xs text-green-700 dark:text-green-300">
              页码添加完成：{{ result.pages }} 页已处理，输出 {{ formatSize(result.size) }}，文件已开始下载（可点击下方按钮重新下载）。
            </p>
          </div>
          <button
            v-if="result"
            @click="downloadResult"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 重新下载（{{ outputName }}）
          </button>
        </div>

        <div v-else class="py-16 text-center text-muted-foreground">
          <ListOrdered class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 PDF 后这里会展示页码方案示意</p>
          <p class="text-xs mt-1">支持纯数字与「第 X 页」等中文格式，含中文时自动高清图像渲染</p>
        </div>

        <div v-if="error" class="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <FileWarning class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-xs text-destructive leading-relaxed">{{ error }}</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 页码添加</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            打印出来才发现没有页码、装订时页序混乱、归档系统要求"第 X / 共 Y 页"格式——这些都可以在提交前用页码添加工具补齐。本工具在浏览器本地完成页码写入，文件不上传任何服务器，论文、标书、合同归档材料都能安全处理。
          </p>
          <h3 class="text-lg font-semibold text-foreground">起始页码与起始编号的区别</h3>
          <p>
            "起始页码"决定从 PDF 的第几页开始加页码（之前的页面保持原样，适合封面、目录不编页的场景）；"起始编号"决定第一个被加页码的页面显示的数字——比如从第 3 页开始加、编号从 1 开始，正文就显示 1、2、3…，而封面目录无页码；若编号留空则默认与起始页码一致。
          </p>
          <h3 class="text-lg font-semibold text-foreground">格式、位置与实现方式</h3>
          <p>
            提供纯数字、"第 X 页"、"第 X / 共 Y 页"、"X / Y"四种格式与底部居中/左下/右下、顶部居中四个位置，字号边距可调。纯数字格式以标准字体矢量写入，文件体积几乎不变；含中文的格式因 PDF 标准字体不含中文字形，自动切换为高清透明图像渲染，清晰度与正文一致。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。读取、写入、下载全部在浏览器本地完成，文件不出浏览器。</li>
            <li><span class="text-foreground font-medium">会覆盖文件里原有的页码吗？</span>不会检测或擦除已有页码，若原文件已印页码可能重叠，建议先预览示意或换位置错开。</li>
            <li><span class="text-foreground font-medium">"第 X 页"这类中文格式支持吗？</span>支持。含中文的格式自动采用高清图像渲染写入，纯数字格式则以矢量字体写入、体积不变。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-page-numbers'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ListOrdered, FileText, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  Settings2, ShieldCheck, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF页码添加 - 起始号/格式/位置可调本地工具',
  description: '在线 PDF 添加页码工具，起始页码与起始编号可分设，四种页码格式、四个位置与字号边距可调，纯数字矢量写入，含中文自动高清图像渲染，本地处理不上传',
  keywords: 'pdf添加页码, pdf页码, pdf编页码, pdf页码格式, 文档页码, pdf编页',
  author: 'Util工具箱',
  ogTitle: 'PDF页码添加 - 有条工具',
  ogDescription: '起始号/格式/位置/字号可调，论文标书归档必备，文件不出浏览器',
  ogUrl: 'https://www.util.cn/tools/pdf-page-numbers',
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
          name: 'PDF页码添加',
          url: 'https://www.util.cn/tools/pdf-page-numbers',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['起始页码/起始编号分设', '四种页码格式', '四个位置与字号边距', '指定范围编页', '矢量与图像双模式', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF页码添加', item: 'https://www.util.cn/tools/pdf-page-numbers/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '添加页码会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。读取、写入、下载全部在浏览器本地完成，文件不出浏览器。' }
            },
            {
              '@type': 'Question',
              name: '会覆盖文件里原有的页码吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会检测或擦除已有页码，原文件已有页码时建议换位置错开。' }
            },
            {
              '@type': 'Question',
              name: '支持"第 X 页"中文格式吗？',
              acceptedAnswer: { '@type': 'Answer', text: '支持。含中文格式自动高清图像渲染写入，纯数字格式矢量写入体积不变。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-page-numbers')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数（可独立测试） ----------
// 页码文本格式化
const formatLabel = (current, total, style) => {
  switch (style) {
    case 'plain':
      return `${current}`
    case 'di-x-ye':
      return `第 ${current} 页`
    case 'di-slash':
      return `第 ${current} / 共 ${total} 页`
    case 'slash':
      return `${current} / ${total}`
    default:
      return `${current}`
  }
}

// 页码在页面上的绘制基准点（左对齐/居中/右对齐 + 上/下边）
// textW 为页码文本宽度，返回 { x, y }（PDF 坐标系，原点左下）
const labelPosition = (pageW, pageH, textW, fontSize, margin, position) => {
  let x
  if (position === 'bottom-center' || position === 'top-center') {
    x = (pageW - textW) / 2
  } else if (position === 'bottom-right') {
    x = pageW - margin - textW
  } else {
    x = margin
  }
  const y = position === 'top-center' ? pageH - margin - fontSize : margin
  return { x, y }
}

// 样式是否含中文（需要图像渲染路径）
const isCJKStyle = (style) => style === 'di-x-ye' || style === 'di-slash'

// 字节大小格式化
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态 ----------
const file = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const pageCount = ref(0)
const fileInput = ref(null)
const isDragging = ref(false)
const processing = ref(false)
const error = ref('')
const result = ref(null)

const startPage = ref(1)
const startNumberInput = ref(null) // null = 默认同起始页码
const style = ref('plain')
const position = ref('bottom-center')
const fontSize = ref(11)
const margin = ref(28)

const styleOptions = [
  { value: 'plain', label: '纯数字（1）' },
  { value: 'di-x-ye', label: '第 X 页' },
  { value: 'di-slash', label: '第 X / 共 Y 页' },
  { value: 'slash', label: 'X / Y' }
]
const positionOptions = [
  { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-right', label: '右下' },
  { value: 'bottom-left', label: '左下' },
  { value: 'top-center', label: '顶部居中' }
]

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 计算属性
const effectiveStartPage = computed(() => Math.max(1, Math.min(Math.floor(startPage.value) || 1, pageCount.value || 9999)))
const effectiveStartNumber = computed(() => {
  const n = Number(startNumberInput.value)
  return Number.isFinite(n) && startNumberInput.value !== null && startNumberInput.value !== '' ? Math.floor(n) : effectiveStartPage.value
})
const hasCJKStyle = computed(() => isCJKStyle(style.value))
const numberedCount = computed(() => Math.max(0, (pageCount.value || 0) - effectiveStartPage.value + 1))
const sampleLabel = computed(() => formatLabel(effectiveStartNumber.value, Math.max(pageCount.value, effectiveStartPage.value), style.value))
const currentStyleLabel = computed(() => (styleOptions.find(s => s.value === style.value) || styleOptions[0]).label)
const currentPositionLabel = computed(() => (positionOptions.find(p => p.value === position.value) || positionOptions[0]).label)
const outputName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-页码.pdf`
})

// 示意位置
const previewPosClass = computed(() => {
  if (position.value === 'bottom-center') return 'bottom-1 left-1/2 -translate-x-1/2'
  if (position.value === 'bottom-left') return 'bottom-1 left-2'
  if (position.value === 'bottom-right') return 'bottom-1 right-2'
  return 'top-1 left-1/2 -translate-x-1/2'
})
const previewPosInset = computed(() => (position.value === 'top-center' ? 'top' : 'bottom'))

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetResult = () => { result.value = null; error.value = '' }

const clearFile = () => {
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  startPage.value = 1
  startNumberInput.value = null
  resetResult()
}

const acceptFile = async (f) => {
  if (!f) return
  if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
    error.value = '请选择 PDF 文件'
    return
  }
  clearFile()
  file.value = f
  fileName.value = f.name
  fileSize.value = f.size
  try {
    // 两遍处理的第一遍：仅统计总页数
    const { PDFDocument } = await import('pdf-lib')
    const bytes = await f.arrayBuffer()
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    pageCount.value = doc.getPageCount()
  } catch (e) {
    error.value = '无法读取该 PDF（文件可能损坏或加密），请确认后重试。' + (e && e.message ? `（${e.message}）` : '')
    file.value = null
    fileName.value = ''
    fileSize.value = 0
  }
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

// ---------- 中文格式高清图像渲染 ----------
const renderLabelPng = (text, fontSizePt) => {
  const scale = 4
  const fontPx = fontSizePt * scale
  const measureCanvas = document.createElement('canvas')
  const mctx = measureCanvas.getContext('2d')
  const font = `${fontPx}px Helvetica, "PingFang SC", "Microsoft YaHei", sans-serif`
  mctx.font = font
  const metrics = mctx.measureText(text)
  const pad = Math.ceil(fontPx * 0.2)
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(metrics.width) + pad * 2
  canvas.height = Math.ceil(fontPx * 1.3) + pad * 2
  const ctx = canvas.getContext('2d')
  ctx.font = font
  ctx.fillStyle = '#374151'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  return {
    dataUrl: canvas.toDataURL('image/png'),
    widthPt: canvas.width / scale,
    heightPt: canvas.height / scale
  }
}

// ---------- 主流程 ----------
const applyNumbers = async () => {
  if (!file.value) {
    error.value = '请先选择 PDF 文件'
    return
  }
  if (effectiveStartPage.value > pageCount.value) {
    error.value = `起始页码超出范围：该文件共 ${pageCount.value} 页`
    return
  }
  processing.value = true
  error.value = ''
  result.value = null
  try {
    // 两遍处理：先 count 总页数，再逐页写入
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const bytes = await file.value.arrayBuffer()
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const pages = doc.getPages()
    const total = pages.length // 已知总页数，供 "共 Y 页" 格式使用

    const needVector = !isCJKStyle(style.value)
    const font = needVector ? await doc.embedFont(StandardFonts.Helvetica) : null
    const color = rgb(0x37 / 255, 0x41 / 255, 0x51 / 255)

    for (let i = effectiveStartPage.value; i <= total; i++) {
      const current = effectiveStartNumber.value + (i - effectiveStartPage.value)
      const label = formatLabel(current, total, style.value)
      const page = pages[i - 1]
      const { width: pw, height: ph } = page.getSize()

      if (needVector) {
        const textW = font.widthOfTextAtSize(label, fontSize.value)
        const pos = labelPosition(pw, ph, textW, fontSize.value, margin.value, position.value)
        page.drawText(label, { x: pos.x, y: pos.y, size: fontSize.value, font, color })
      } else {
        const png = renderLabelPng(label, fontSize.value)
        const img = await doc.embedPng(png.dataUrl)
        const pos = labelPosition(pw, ph, png.widthPt, png.heightPt, margin.value, position.value)
        page.drawImage(img, { x: pos.x, y: pos.y, width: png.widthPt, height: png.heightPt })
      }
    }

    const outBytes = await doc.save()
    result.value = { pages: total - effectiveStartPage.value + 1, size: outBytes.byteLength, data: outBytes }
    downloadResult()
  } catch (e) {
    error.value = '页码添加失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    processing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return
  const blob = new Blob([result.value.data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = outputName.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
