<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileArchive class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF压缩</h1>
          <p class="text-sm text-muted-foreground mt-1">三档质量本地压缩体积，扫描件标书瘦身，文件不出浏览器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 PDF 后在浏览器本地逐页重编码压缩：轻度 / 均衡 / 强力三档质量，实时对比压缩前后体积与压缩率。全程本地处理，文件不上传服务器，适合扫描件、标书、合同等超大附件瘦身。
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

        <!-- 压缩设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 压缩强度
          </h2>
          <div class="space-y-2">
            <button
              v-for="(preset, key) in qualityPresets"
              :key="key"
              @click="level = key"
              class="w-full text-left px-4 py-3 rounded-lg border transition-all"
              :class="level === key ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/70'"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">{{ preset.label }}（JPG 质量 {{ preset.quality }}）</span>
                <CheckCircle v-if="level === key" class="w-4 h-4 text-primary" />
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ preset.hint }}</p>
            </button>
          </div>

          <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5">
            <Info class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              重编码压缩方案：页面会被渲染为 JPEG 图像后重建，正文文字将变为图像清晰度。扫描件与图片型 PDF 效果最佳；文字型 PDF 建议先用站内「PDF页面整理」删减无用页，再回来压缩。
            </p>
          </div>

          <button
            @click="compress"
            :disabled="!pdfjsReady || processing"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <FileArchive v-else class="w-4 h-4" />
            {{ processing ? '压缩中…' : '开始压缩' }}
          </button>
          <p v-if="!pdfjsReady" class="text-xs text-muted-foreground text-center">请先选择一个 PDF 文件</p>
        </div>
      </div>

      <!-- 右侧结果区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 压缩结果
        </h2>

        <!-- 空状态 -->
        <div v-if="!result && !processing" class="py-16 text-center text-muted-foreground">
          <FileArchive class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 PDF 并选择压缩强度后，点击「开始压缩」</p>
          <p class="text-xs mt-1">完成后将对比压缩前后体积，并可下载新文件</p>
        </div>

        <!-- 进度 -->
        <div v-if="processing" class="py-10">
          <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
            <Loader2 class="w-4 h-4 animate-spin" />
            正在处理第 {{ progress.done }} / {{ progress.total }} 页…
          </div>
          <div class="max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: progress.total ? (progress.done / progress.total * 100) + '%' : '0%' }"
            ></div>
          </div>
        </div>

        <!-- 结果对比 -->
        <div v-else-if="result" class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">原始大小</p>
              <p class="text-lg font-bold text-foreground">{{ formatSize(result.origSize) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">压缩后</p>
              <p class="text-lg font-bold text-foreground">{{ formatSize(result.newSize) }}</p>
            </div>
            <div
              class="rounded-lg p-4 text-center"
              :class="result.newSize < result.origSize ? 'bg-green-500/10' : 'bg-amber-500/10'"
            >
              <p class="text-xs text-muted-foreground mb-1">压缩率</p>
              <p
                class="text-lg font-bold"
                :class="result.newSize < result.origSize ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'"
              >{{ formatRatio(result.origSize, result.newSize) }}</p>
            </div>
          </div>

          <div class="bg-muted/30 border border-border rounded-lg p-4 text-sm space-y-1.5">
            <div class="flex justify-between">
              <span class="text-muted-foreground">压缩档位</span>
              <span class="text-foreground font-medium">{{ currentPreset.label }}（渲染 {{ currentPreset.renderScale }}x · JPG 质量 {{ currentPreset.quality }}）</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">页数</span>
              <span class="text-foreground font-medium">{{ result.pageCount }} 页</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">节省空间</span>
              <span class="text-foreground font-medium">{{ formatSize(Math.max(0, result.origSize - result.newSize)) }}</span>
            </div>
          </div>

          <div v-if="result.newSize >= result.origSize" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
            <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              该文件压缩后没有变小：它可能已经是高度压缩的图像型 PDF。可以改用「强力」档重试，或改用「PDF页面整理」删减页数来减小体积。
            </p>
          </div>

          <button
            @click="downloadResult"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 下载压缩后的 PDF（{{ outputName }}）
          </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 压缩</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            邮件附件超限、系统上传失败、微信传文件被压缩画质，多半是因为 PDF 体积太大。本工具在浏览器本地对 PDF 逐页重编码压缩，文件不上传任何服务器，适合扫描件、标书、图纸等大体积文件瘦身。
          </p>
          <h3 class="text-lg font-semibold text-foreground">重编码压缩的原理与代价</h3>
          <p>
            工具会把每一页渲染成 JPEG 图像，再按原页面尺寸重建为新的 PDF：体积来自 JPEG 质量与渲染倍数的控制，因此压缩率远高于普通"另存"。代价是正文文字会变为图像清晰度、不可再选中文字——扫描件与图片型 PDF 效果最佳；文字型 PDF 建议先用站内「PDF页面整理」删减无用页，再回来压缩。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三档质量怎么选</h3>
          <p>
            轻度（JPG 质量 0.8、2 倍渲染）：画质几乎无损，适合要存档的高清扫描件；均衡（0.6、1.5 倍）：体积与清晰度平衡，邮件附件、在线提交通用，推荐首选；强力（0.4、1 倍）：体积优先，仅用于只求"能看清"的场合，如临时传阅、占位备份。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。读取、渲染、重建、下载全部在浏览器本地完成，文件不出浏览器。</li>
            <li><span class="text-foreground font-medium">压缩后文字会变模糊吗？</span>会。重编码后文字以图像形式呈现，清晰度取决于所选档位；对清晰度敏感请用「轻度」并接受较小的压缩率。</li>
            <li><span class="text-foreground font-medium">压缩后体积反而变大怎么办？</span>说明原文件本身已是高压缩图像型 PDF，工具会如实提示；此时改用「强力」档或删减页数更有效。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-compressor'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileArchive, FileText, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  Settings2, ShieldCheck, Info, BarChart3, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF压缩 - 本地三档质量压缩体积工具',
  description: '在线 PDF 压缩工具，轻度/均衡/强力三档质量本地重编码压缩，实时对比压缩前后体积与压缩率，扫描件标书瘦身，文件不上传服务器',
  keywords: 'pdf压缩, pdf体积缩小, pdf瘦身, 扫描件压缩, 压缩pdf, pdf在线压缩',
  author: 'Util工具箱',
  ogTitle: 'PDF压缩 - 有条工具',
  ogDescription: '三档质量本地压缩 PDF 体积，扫描件标书瘦身，文件不出浏览器',
  ogUrl: 'https://www.util.cn/tools/pdf-compressor',
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
          name: 'PDF压缩',
          url: 'https://www.util.cn/tools/pdf-compressor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['三档压缩强度', '体积对比与压缩率', '逐页重编码', '扫描件优化', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF压缩', item: 'https://www.util.cn/tools/pdf-compressor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '压缩会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。读取、渲染、重建、下载全部在浏览器本地完成，文件不出浏览器。' }
            },
            {
              '@type': 'Question',
              name: '压缩后文字会变模糊吗？',
              acceptedAnswer: { '@type': 'Answer', text: '重编码方案下文字以图像呈现，清晰度取决于档位；敏感场景请用轻度档。' }
            },
            {
              '@type': 'Question',
              name: '压缩后体积反而变大怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '原文件可能已是高压缩图像型 PDF，可改用强力档或先删减页数再压缩。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-compressor')
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
// 压缩档位 → 渲染倍数与 JPG 质量参数
const getCompressParams = (levelKey) => {
  const map = {
    light: { renderScale: 2, quality: 0.8 },
    balanced: { renderScale: 1.5, quality: 0.6 },
    strong: { renderScale: 1, quality: 0.4 }
  }
  return map[levelKey] || map.balanced
}

// 压缩率展示：变小显示负百分比（绿色），变大显示 +百分比
const formatRatio = (origSize, newSize) => {
  if (!origSize) return '—'
  const pct = ((newSize - origSize) / origSize) * 100
  return (pct > 0 ? '+' : '') + pct.toFixed(1) + '%'
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
const result = ref(null)
const progress = ref({ done: 0, total: 0 })

const level = ref('balanced')

const qualityPresets = {
  light: { label: '轻度', quality: 0.8, renderScale: 2, hint: '画质几乎无损，体积小幅下降，适合高清存档' },
  balanced: { label: '均衡', quality: 0.6, renderScale: 1.5, hint: '体积与清晰度平衡，邮件附件与在线提交通用（推荐）' },
  strong: { label: '强力', quality: 0.4, renderScale: 1, hint: '体积优先，画面明显变软，仅求能看清的场合' }
}

let pdfjsDoc = null // 非响应式：已打开的 PDF 文档句柄

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentPreset = computed(() => qualityPresets[level.value] || qualityPresets.balanced)
const outputName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-压缩.pdf`
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetResult = () => { result.value = null; error.value = ''; progress.value = { done: 0, total: 0 } }

const clearFile = async () => {
  if (pdfjsDoc) {
    try { pdfjsDoc.destroy() } catch (e) { /* 忽略销毁异常 */ }
    pdfjsDoc = null
  }
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  pdfjsReady.value = false
  resetResult()
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
  try {
    const lib = await loadPdfJs()
    const buf = await f.arrayBuffer()
    pdfjsDoc = await lib.getDocument({ data: new Uint8Array(buf) }).promise
    pageCount.value = pdfjsDoc.numPages
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

// ---------- 压缩主流程 ----------
const compress = async () => {
  if (!pdfjsDoc) {
    error.value = '请先选择 PDF 文件'
    return
  }
  processing.value = true
  error.value = ''
  result.value = null
  try {
    const { PDFDocument } = await import('pdf-lib')
    const params = getCompressParams(level.value)
    const total = pageCount.value
    progress.value = { done: 0, total }

    const outDoc = await PDFDocument.create()
    for (let n = 1; n <= total; n++) {
      const page = await pdfjsDoc.getPage(n)
      // 原始页面尺寸（pt）：缩放 1 倍的 viewport 即 pt 值
      const baseViewport = page.getViewport({ scale: 1 })
      const wPt = baseViewport.width
      const hPt = baseViewport.height

      // 按档位倍数渲染为 JPEG
      const viewport = page.getViewport({ scale: params.renderScale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport }).promise
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas 导出失败'))), 'image/jpeg', params.quality)
      })
      const imgBytes = new Uint8Array(await blob.arrayBuffer())
      const img = await outDoc.embedJpg(imgBytes)

      // 按原页面尺寸建页并铺满
      const newPage = outDoc.addPage([wPt, hPt])
      newPage.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt })
      page.cleanup()

      progress.value = { done: n, total }
      await new Promise((r) => setTimeout(r, 0)) // 让出主线程，刷新进度
    }

    const outBytes = await outDoc.save()
    result.value = {
      pageCount: total,
      origSize: fileSize.value,
      newSize: outBytes.byteLength,
      data: outBytes
    }
  } catch (e) {
    error.value = '压缩失败：' + (e && e.message ? e.message : '未知错误')
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
