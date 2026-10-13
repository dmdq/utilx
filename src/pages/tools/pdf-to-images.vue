<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Image class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF转图片</h1>
          <p class="text-sm text-muted-foreground mt-1">逐页导出 JPG/PNG，分辨率与质量可调，文件不出浏览器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 PDF 后在浏览器本地逐页渲染导出图片：支持 JPG（三档质量）与 PNG、1x/2x/3x 分辨率、页码范围，单页下载或打包 ZIP。全部渲染在你的浏览器中完成，文件不上传任何服务器，适合发群、插图、归档等场景。
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
          <div v-if="pageCount > 50" class="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">该 PDF 超过 50 页，逐页渲染可能耗时较长且占用较多内存，建议降低缩放倍数或分批指定页码范围。</p>
          </div>
        </div>

        <!-- 转换设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 导出设置
          </h2>

          <!-- 格式 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">图片格式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="format = 'jpeg'"
                :class="format === 'jpeg' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >JPG（体积更小）</button>
              <button
                @click="format = 'png'"
                :class="format === 'png' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >PNG（无损）</button>
            </div>
          </div>

          <!-- JPG 质量 -->
          <div v-if="format === 'jpeg'">
            <label class="block text-sm font-medium text-foreground mb-2">JPG 质量</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="q in qualityOptions"
                :key="q.value"
                @click="quality = q.value"
                :class="quality === q.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ q.label }}</button>
            </div>
          </div>

          <!-- 缩放倍数 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">缩放倍数（分辨率）</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="s in scaleOptions"
                :key="s.value"
                @click="scale = s.value"
                :class="scale === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ s.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">1x=72dpi 屏幕预览，2x=144dpi 通用推荐，3x=216dpi 打印级</p>
          </div>

          <!-- 页码范围 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">页码范围</label>
            <div class="grid grid-cols-2 gap-1.5 mb-2">
              <button
                @click="rangeMode = 'all'"
                :class="rangeMode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >全部页面</button>
              <button
                @click="rangeMode = 'custom'"
                :class="rangeMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >指定范围</button>
            </div>
            <div v-if="rangeMode === 'custom'" class="grid grid-cols-2 gap-2">
              <input
                v-model.number="rangeFrom"
                type="number"
                min="1"
                :max="pageCount || 1"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="起始页"
              />
              <input
                v-model.number="rangeTo"
                type="number"
                min="1"
                :max="pageCount || 1"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="结束页"
              />
              <p class="col-span-2 text-xs text-muted-foreground">将在第 {{ clampedRange.start }} 页至第 {{ clampedRange.end }} 页之间导出</p>
            </div>
          </div>

          <button
            @click="convert"
            :disabled="!pdfjsReady || processing"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Image v-else class="w-4 h-4" />
            {{ processing ? '转换中…' : '开始转换' }}
          </button>
          <p v-if="!pdfjsReady" class="text-xs text-muted-foreground text-center">请先选择一个 PDF 文件</p>
        </div>
      </div>

      <!-- 右侧结果区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 导出结果
          </h2>
          <button
            v-if="results.length > 1"
            @click="downloadAllZip"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Package class="w-3.5 h-3.5" /> 打包下载 ZIP（{{ results.length }} 张）
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!results.length && !processing" class="py-16 text-center text-muted-foreground">
          <Image class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 PDF 并设置参数后，点击「开始转换」</p>
          <p class="text-xs mt-1">每页将导出为一张独立图片（page-页码.jpg / .png）</p>
        </div>

        <!-- 进度 -->
        <div v-if="processing" class="py-10">
          <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
            <Loader2 class="w-4 h-4 animate-spin" />
            正在渲染第 {{ progress.done }} / {{ progress.total }} 页…
          </div>
          <div class="max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: progress.total ? (progress.done / progress.total * 100) + '%' : '0%' }"
            ></div>
          </div>
        </div>

        <!-- 结果网格 -->
        <div v-else-if="results.length" class="space-y-4">
          <p class="text-xs text-muted-foreground">
            共导出 {{ results.length }} 张图片 · 合计 {{ formatSize(totalResultSize) }} · 点击图片下方的按钮即可下载
          </p>
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="item in results"
              :key="item.pageNo"
              class="border border-border rounded-lg overflow-hidden bg-muted/30"
            >
              <img :src="item.url" :alt="`第 ${item.pageNo} 页`" class="w-full h-auto bg-white" loading="lazy" />
              <div class="p-2 space-y-1.5">
                <p class="text-xs font-medium text-foreground truncate">page-{{ item.pageNo }}.{{ format === 'png' ? 'png' : 'jpg' }}</p>
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[10px] text-muted-foreground">{{ formatSize(item.size) }}</span>
                  <button
                    @click="downloadOne(item)"
                    class="flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-xs text-foreground transition-colors"
                  >
                    <Download class="w-3 h-3" /> 下载
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 转图片</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            把 PDF 每一页变成一张独立图片，是发微信群、插入 PPT/文档、提交图片格式材料时最常见的需求。本工具基于 pdf.js 在浏览器本地逐页渲染后导出，PDF 文件全程不上传服务器，断网也能用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">分辨率（缩放倍数）怎么选</h3>
          <p>
            1x 对应 72dpi，屏幕预览和微信传图足够；2x 对应 144dpi，是插入 PPT、Word 的通用推荐，文字边缘清晰；3x 对应 216dpi，适合打印或需要放大裁剪的场景。倍数越高越清晰，但耗时与图片体积按平方增长，大文件建议先用 2x 试转前几页。
          </p>
          <h3 class="text-lg font-semibold text-foreground">JPG 还是 PNG</h3>
          <p>
            JPG 有损压缩、体积小，适合扫描件、照片型页面，提供 0.6 / 0.8 / 0.92 三档质量：0.6 更省空间，0.8 均衡，0.92 接近无损；PNG 无损且边缘锐利，适合文字页、线条图、需要后期抠图或二次编辑的场景，但体积通常是 JPG 的数倍。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。渲染、导出、下载全部在浏览器本地完成，文件不出浏览器。</li>
            <li><span class="text-foreground font-medium">为什么导出的 JPG 背景是白色？</span>JPG 不支持透明通道，渲染时会自动铺白底；如需透明背景（例如 PDF 中有透明元素），请选择 PNG 格式。</li>
            <li><span class="text-foreground font-medium">大 PDF 转换很慢怎么办？</span>页数越多、倍数越高耗时越长；超过 50 页时建议降低缩放倍数，或用页码范围分批转换。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-to-images'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Image, FileText, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  Settings2, ShieldCheck, Package, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF转图片 - 逐页导出 JPG/PNG 本地工具',
  description: '在线 PDF 转图片，逐页导出 JPG/PNG，1x/2x/3x 分辨率与三档质量可调，支持页码范围与 ZIP 打包下载，纯浏览器本地处理不上传',
  keywords: 'pdf转图片, pdf转jpg, pdf导出图片, pdf转png, pdf页面导出, 在线pdf转图',
  author: 'Util工具箱',
  ogTitle: 'PDF转图片 - 有条工具',
  ogDescription: 'PDF 逐页导出 JPG/PNG，分辨率与质量可调，文件不出浏览器',
  ogUrl: 'https://www.util.cn/tools/pdf-to-images',
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
          name: 'PDF转图片',
          url: 'https://www.util.cn/tools/pdf-to-images',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['逐页导出 JPG/PNG', '1x/2x/3x 分辨率可选', 'JPG 三档质量', '页码范围指定', 'ZIP 打包下载', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF转图片', item: 'https://www.util.cn/tools/pdf-to-images/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'PDF 转图片会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。渲染、导出、下载全部在浏览器本地完成，文件不出浏览器，断网也能使用。' }
            },
            {
              '@type': 'Question',
              name: '导出 JPG 还是 PNG 好？',
              acceptedAnswer: { '@type': 'Answer', text: '扫描件、照片页选 JPG（体积小）；文字页、线条图或需要透明背景的场景选 PNG（无损）。' }
            },
            {
              '@type': 'Question',
              name: '大 PDF 转换慢怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '页数与倍数决定耗时，超过 50 页建议降低缩放倍数或用页码范围分批转换。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-to-images')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- pdf.js 加载（动态 import，仅在用户交互回调内调用） ----------
let pdfjsLib = null
const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib
  const lib = await import('pdfjs-dist')
  try {
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    lib.GlobalWorkerOptions.workerSrc = workerUrl
  } catch (e) {
    // 降级：worker 资源加载失败时置空，由 pdf.js 回退主线程解析
    console.warn('PDF worker 加载失败，回退主线程模式', e)
    lib.GlobalWorkerOptions.workerSrc = ''
  }
  pdfjsLib = lib
  return pdfjsLib
}

// ---------- 纯函数（可独立测试） ----------
// 页码范围解析（1 基，含端点，自动钳制与交换）
const resolvePageRange = (mode, pageCount, from, to) => {
  if (mode !== 'custom' || !pageCount) {
    return { start: 1, end: pageCount }
  }
  let start = Math.max(1, Math.floor(from) || 1)
  let end = Math.min(pageCount, Math.floor(to) || pageCount)
  if (start > end) {
    const tmp = start
    start = end
    end = tmp
  }
  return { start, end }
}

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
const pdfjsReady = ref(false)
const results = ref([])
const progress = ref({ done: 0, total: 0 })

const format = ref('jpeg')
const quality = ref(0.8)
const scale = ref(2)
const rangeMode = ref('all')
const rangeFrom = ref(1)
const rangeTo = ref(1)

const qualityOptions = [
  { value: 0.6, label: '0.6 更小' },
  { value: 0.8, label: '0.8 均衡' },
  { value: 0.92, label: '0.92 清晰' }
]
const scaleOptions = [
  { value: 1, label: '1x · 72dpi' },
  { value: 2, label: '2x · 144dpi' },
  { value: 3, label: '3x · 216dpi' }
]

let pdfjsDoc = null // 非响应式：已打开的 PDF 文档句柄

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const clampedRange = computed(() => resolvePageRange(rangeMode.value, pageCount.value, rangeFrom.value, rangeTo.value))
const totalResultSize = computed(() => results.value.reduce((sum, it) => sum + it.size, 0))

const outputExt = computed(() => (format.value === 'png' ? 'png' : 'jpg'))
const zipName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-图片.zip`
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const releaseResults = () => {
  results.value.forEach(it => URL.revokeObjectURL(it.url))
  results.value = []
}

const clearFile = async () => {
  releaseResults()
  if (pdfjsDoc) {
    try { pdfjsDoc.destroy() } catch (e) { /* 忽略销毁异常 */ }
    pdfjsDoc = null
  }
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  pdfjsReady.value = false
  error.value = ''
  progress.value = { done: 0, total: 0 }
}

const acceptFile = async (f) => {
  if (!f) return
  if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
    error.value = '请选择 PDF 文件'
    return
  }
  await clearFile()
  file.value = f
  fileName.value = f.name
  fileSize.value = f.size
  error.value = ''
  try {
    const lib = await loadPdfJs()
    const buf = await f.arrayBuffer()
    pdfjsDoc = await lib.getDocument({ data: new Uint8Array(buf) }).promise
    pageCount.value = pdfjsDoc.numPages
    rangeFrom.value = 1
    rangeTo.value = pdfjsDoc.numPages
    pdfjsReady.value = true
  } catch (e) {
    error.value = '无法读取该 PDF（文件可能损坏或加密），请确认后重试。' + (e && e.message ? `（${e.message}）` : '')
    file.value = null
    fileName.value = ''
    fileSize.value = 0
    pdfjsReady.value = false
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

// ---------- 渲染与导出 ----------
const canvasToBlob = (canvas, type, qualityVal) => new Promise((resolve, reject) => {
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas 导出失败'))), type, qualityVal)
})

const renderPageToCanvas = async (page, renderScale) => {
  const viewport = page.getViewport({ scale: renderScale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // JPG 无透明通道，统一铺白底
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

const convert = async () => {
  if (!pdfjsDoc) {
    error.value = '请先选择 PDF 文件'
    return
  }
  processing.value = true
  error.value = ''
  releaseResults()
  try {
    const { start, end } = resolvePageRange(rangeMode.value, pageCount.value, rangeFrom.value, rangeTo.value)
    const total = end - start + 1
    progress.value = { done: 0, total }
    const mime = format.value === 'png' ? 'image/png' : 'image/jpeg'
    const list = []
    for (let n = start; n <= end; n++) {
      const page = await pdfjsDoc.getPage(n)
      const canvas = await renderPageToCanvas(page, scale.value)
      const blob = await canvasToBlob(canvas, mime, format.value === 'png' ? undefined : quality.value)
      list.push({ pageNo: n, blob, url: URL.createObjectURL(blob), size: blob.size })
      page.cleanup()
      progress.value = { done: n - start + 1, total }
      await new Promise((r) => setTimeout(r, 0)) // 让出主线程，刷新进度
    }
    results.value = list
  } catch (e) {
    error.value = '转换失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    processing.value = false
  }
}

const triggerDownload = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadOne = (item) => {
  triggerDownload(item.blob, `page-${item.pageNo}.${outputExt.value}`)
}

const downloadAllZip = async () => {
  if (!results.value.length) return
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  results.value.forEach((it) => {
    zip.file(`page-${it.pageNo}.${outputExt.value}`, it.blob)
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, zipName.value)
}
</script>
