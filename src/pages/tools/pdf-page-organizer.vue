<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Move class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF页面整理</h1>
          <p class="text-sm text-muted-foreground mt-1">缩略图拖拽重排页序，删除/旋转页面，比命令行直观</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 PDF 后自动生成缩略图网格：拖拽即可调整页序，一键删除或旋转页面，应用更改后在浏览器本地重建新文件。整理过程基于页面复制而非重新渲染，原内容画质无损，文件全程不上传服务器。
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

        <!-- 操作说明与摘要 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 操作说明
          </h2>
          <ul class="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>按住缩略图卡片拖拽，可实时调整页面顺序</li>
            <li>「旋转」每点一次顺时针旋转 90°，可叠加</li>
            <li>「删除」将页面标记置灰，应用后移除</li>
          </ul>

          <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs space-y-1">
            <p class="text-muted-foreground">变更摘要</p>
            <p class="text-foreground">
              删除 <span class="font-bold text-primary">{{ deletedCount }}</span> 页 ·
              旋转 <span class="font-bold text-primary">{{ rotatedCount }}</span> 页 ·
              {{ orderChanged ? '顺序已调整' : '顺序未变' }}
            </p>
            <p class="text-muted-foreground">应用后保留 {{ keptCount }} / {{ items.length }} 页</p>
          </div>

          <button
            @click="applyChanges"
            :disabled="!items.length || processing || keptCount === 0"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <CheckCircle v-else class="w-4 h-4" />
            {{ processing ? '正在生成…' : '应用更改并下载' }}
          </button>
          <button
            @click="resetChanges"
            :disabled="!items.length || processing || (!deletedCount && !rotatedCount && !orderChanged)"
            class="w-full py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            撤销全部更改（还原）
          </button>
          <p v-if="items.length && keptCount === 0" class="text-xs text-destructive text-center">至少需要保留一页才能应用更改</p>
        </div>
      </div>

      <!-- 右侧缩略图区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> 页面缩略图
        </h2>

        <!-- 空状态 -->
        <div v-if="!items.length && !loadingThumbs" class="py-16 text-center text-muted-foreground">
          <LayoutGrid class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 PDF 后自动生成页面缩略图</p>
          <p class="text-xs mt-1">拖拽排序 · 删除 · 旋转，全部在本地完成</p>
        </div>

        <!-- 加载缩略图 -->
        <div v-if="loadingThumbs" class="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 class="w-4 h-4 animate-spin" /> 正在生成缩略图（{{ thumbProgress.done }} / {{ thumbProgress.total }} 页）…
        </div>

        <!-- 缩略图网格 -->
        <div v-else-if="items.length" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="(item, idx) in items"
            :key="item.id"
            draggable="true"
            class="relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all group"
            :class="[
              item.deleted ? 'border-border bg-muted/60 opacity-60' : 'border-border bg-muted/30 hover:border-primary/60',
              dragIndex === idx ? 'opacity-40 scale-95' : ''
            ]"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop.prevent="onDrop(idx)"
            @dragend="onDragEnd"
          >
            <!-- 页码角标 -->
            <div class="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
              第 {{ item.origIndex + 1 }} 页
            </div>
            <!-- 拖拽手柄提示 -->
            <div class="absolute top-1.5 right-1.5 z-10 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical class="w-3 h-3" />
            </div>
            <!-- 删除遮罩 -->
            <div v-if="item.deleted" class="absolute inset-0 z-[5] bg-background/70 flex items-center justify-center">
              <span class="text-xs font-medium text-destructive">已删除</span>
            </div>

            <div class="flex items-center justify-center bg-white" :style="{ minHeight: '120px' }">
              <img
                :src="item.thumb"
                :alt="`第 ${item.origIndex + 1} 页`"
                draggable="false"
                class="w-full h-auto pointer-events-none transition-transform"
                :style="item.rotation ? { transform: `rotate(${item.rotation}deg)` } : null"
              />
            </div>

            <div class="grid grid-cols-2 gap-1 p-1.5 bg-background">
              <button
                @click="toggleDelete(idx)"
                class="flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors"
                :class="item.deleted ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'"
              >
                <Trash2 class="w-3 h-3" /> {{ item.deleted ? '恢复' : '删除' }}
              </button>
              <button
                @click="rotatePage(idx)"
                class="flex items-center justify-center gap-1 py-1.5 rounded text-xs bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                <RotateCw class="w-3 h-3" /> 旋转
                <span v-if="item.rotation % 360 !== 0" class="text-primary font-medium">{{ item.rotation % 360 }}°</span>
              </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 页面整理</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            删掉扫描错的空白页、把封面挪到最前、把横放的页转正——这些"页面级"的整理需求，用命令行工具写页码范围远不如拖拽缩略图直观。本工具在浏览器本地生成页面缩略图，拖拽排序、删除、旋转全部可视化完成，文件不上传任何服务器。
          </p>
          <h3 class="text-lg font-semibold text-foreground">拖拽排序与删除、旋转</h3>
          <p>
            按住任意缩略图卡片拖动到目标位置即可实时换位；「删除」只是先标记置灰，确认无误后再应用；「旋转」每次顺时针 90°、可叠加多次，旋转角度会真实写入页面属性，在任何阅读器中打开都保持旋转后的方向。
          </p>
          <h3 class="text-lg font-semibold text-foreground">整理是无损的</h3>
          <p>
            应用更改时按新顺序复制原始页面对象重建文档，不重新渲染页面内容：矢量、文字、图片与原始清晰度完全一致，只有被删除和未保留的页面不会写入新文件。这与"压缩"类工具的画质代价完全不同，可放心用于合同、图纸等对画质敏感的文件。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。缩略图生成、排序、重建、下载全部在浏览器本地完成，文件不出浏览器。</li>
            <li><span class="text-foreground font-medium">整理会损失画质吗？</span>不会。采用页面复制方式重建，保留页的画质与原文件完全一致。</li>
            <li><span class="text-foreground font-medium">操作错了能撤销吗？</span>点「撤销全部更改」即可还原到刚上传时的状态；原文件始终不会被修改，下载前可以反复调整。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-page-organizer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Move, FileText, FileUp, FileWarning, Upload, X, Loader2, CheckCircle,
  Settings2, ShieldCheck, Trash2, RotateCw, LayoutGrid, GripVertical,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF页面整理 - 缩略图拖拽排序/删除/旋转工具',
  description: '在线 PDF 页面整理工具，缩略图网格拖拽重排页序，删除、旋转页面可视化操作，无损复制重建，纯浏览器本地处理不上传',
  keywords: 'pdf删除页面, pdf排序, pdf页面整理, pdf旋转, pdf重排, pdf缩略图',
  author: 'Util工具箱',
  ogTitle: 'PDF页面整理 - 有条工具',
  ogDescription: '缩略图拖拽重排页序，删除/旋转页面，比命令行直观，文件不出浏览器',
  ogUrl: 'https://www.util.cn/tools/pdf-page-organizer',
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
          name: 'PDF页面整理',
          url: 'https://www.util.cn/tools/pdf-page-organizer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['缩略图拖拽排序', '删除与恢复页面', '90° 旋转叠加', '变更摘要预览', '无损页面复制重建', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF页面整理', item: 'https://www.util.cn/tools/pdf-page-organizer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '整理 PDF 会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。缩略图生成、排序、重建、下载全部在浏览器本地完成，文件不出浏览器。' }
            },
            {
              '@type': 'Question',
              name: '整理会损失画质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。按新顺序复制原始页面对象重建，保留页画质与原文件完全一致。' }
            },
            {
              '@type': 'Question',
              name: '操作错了能撤销吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可一键还原到刚上传时的状态，原文件不会被修改，下载前可反复调整。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-page-organizer')
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
// 变更摘要：删除数 / 旋转数 / 顺序是否变化
const summarizeChanges = (items) => {
  const kept = items.filter(it => !it.deleted)
  const deletedCount = items.length - kept.length
  const rotatedCount = kept.filter(it => ((it.rotation % 360) + 360) % 360 !== 0).length
  // 顺序未变 ⇔ 保留页的原始页码序列严格递增
  const orderChanged = kept.some((it, i) => i > 0 && it.origIndex < kept[i - 1].origIndex)
  return { deletedCount, rotatedCount, orderChanged, keptCount: kept.length }
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
const loadingThumbs = ref(false)
const error = ref('')
const items = ref([]) // { id, origIndex, rotation, deleted, thumb }
const thumbProgress = ref({ done: 0, total: 0 })
const dragIndex = ref(-1)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const summary = computed(() => summarizeChanges(items.value))
const deletedCount = computed(() => summary.value.deletedCount)
const rotatedCount = computed(() => summary.value.rotatedCount)
const orderChanged = computed(() => summary.value.orderChanged)
const keptCount = computed(() => summary.value.keptCount)

const outputName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-整理.pdf`
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const clearFile = () => {
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  items.value = []
  error.value = ''
  dragIndex.value = -1
  thumbProgress.value = { done: 0, total: 0 }
}

// 生成单页缩略图（白底 JPEG，缩放 0.3）
const renderThumb = async (page) => {
  const scale = 0.3
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.7)
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
  loadingThumbs.value = true
  try {
    const lib = await loadPdfJs()
    const buf = await f.arrayBuffer()
    const doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise
    pageCount.value = doc.numPages
    thumbProgress.value = { done: 0, total: doc.numPages }
    const list = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const thumb = await renderThumb(page)
      list.push({
        id: `p-${n}-${Date.now()}`,
        origIndex: n - 1,
        rotation: 0,
        deleted: false,
        thumb
      })
      page.cleanup()
      thumbProgress.value = { done: n, total: doc.numPages }
      await new Promise((r) => setTimeout(r, 0)) // 让出主线程，刷新进度
    }
    items.value = list
    try { doc.destroy() } catch (e) { /* 忽略销毁异常 */ }
  } catch (e) {
    error.value = '无法读取该 PDF（文件可能损坏或加密），请确认后重试。' + (e && e.message ? `（${e.message}）` : '')
    clearFile()
  } finally {
    loadingThumbs.value = false
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

// ---------- 页面操作 ----------
const toggleDelete = (idx) => {
  const item = items.value[idx]
  if (item) item.deleted = !item.deleted
}

const rotatePage = (idx) => {
  const item = items.value[idx]
  if (item) item.rotation = (item.rotation + 90) % 360
}

const resetChanges = () => {
  items.value.forEach((it) => {
    it.deleted = false
    it.rotation = 0
  })
  // 还原原始顺序
  items.value.sort((a, b) => a.origIndex - b.origIndex)
}

// ---------- 拖拽排序（dragover 实时换位） ----------
const onDragStart = (idx) => { dragIndex.value = idx }

const onDragOver = (idx) => {
  const from = dragIndex.value
  if (from < 0 || from === idx) return
  // 实时换位
  const arr = items.value
  const moved = arr.splice(from, 1)[0]
  arr.splice(idx, 0, moved)
  dragIndex.value = idx
}

const onDrop = (idx) => { onDragOver(idx); dragIndex.value = -1 }

const onDragEnd = () => { dragIndex.value = -1 }

// ---------- 应用更改 ----------
const applyChanges = async () => {
  if (!file.value) {
    error.value = '请先选择 PDF 文件'
    return
  }
  if (keptCount.value === 0) {
    error.value = '至少需要保留一页才能应用更改'
    return
  }
  processing.value = true
  error.value = ''
  try {
    const { PDFDocument, degrees } = await import('pdf-lib')
    const srcBytes = await file.value.arrayBuffer()
    const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true })
    const outDoc = await PDFDocument.create()

    const kept = items.value.filter(it => !it.deleted)
    const indices = kept.map(it => it.origIndex)
    const copied = await outDoc.copyPages(srcDoc, indices)
    copied.forEach((page, i) => {
      const rot = ((kept[i].rotation % 360) + 360) % 360
      if (rot !== 0) page.setRotation(degrees(rot))
      outDoc.addPage(page)
    })

    const outBytes = await outDoc.save()
    const blob = new Blob([outBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = outputName.value
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = '应用更改失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    processing.value = false
  }
}
</script>
