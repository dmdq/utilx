<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileSignature class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF电子签名</h1>
          <p class="text-sm text-muted-foreground mt-1">手写板书写签名，拖拽定位到任意页任意位置，合同审批本地签</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三步完成电子签名：① 手写板书写签名并自动裁掉空白；② 上传 PDF 选择签名页面；③ 拖拽调整签名位置与大小后应用下载。签名与 PDF 全程在浏览器本地处理，不上传任何服务器，合同、审批单、承诺书即时签。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="space-y-6 mb-6">
      <!-- 步骤①：手写签名 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mr-2">1</span>
          书写签名
          <CheckCircle v-if="signatureDataUrl" class="w-4 h-4 ml-2 text-green-600 dark:text-green-400" />
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <canvas
              ref="padCanvas"
              width="900"
              height="300"
              class="w-full h-auto bg-background border-2 border-dashed border-border rounded-lg cursor-crosshair touch-none"
              @pointerdown="startDraw"
              @pointermove="moveDraw"
              @pointerup="endDraw"
              @pointercancel="endDraw"
              @pointerleave="endDraw"
            ></canvas>
            <p class="text-xs text-muted-foreground mt-2">用鼠标或触屏在虚线框内签名（建议签在中间区域，四周空白会自动裁掉）</p>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">笔画宽度</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="w in brushOptions"
                  :key="w.value"
                  @click="brushWidth = w.value"
                  :class="brushWidth === w.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ w.label }}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="clearPad"
                class="py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
              >
                <Eraser class="w-3.5 h-3.5" /> 清除重写
              </button>
              <button
                @click="saveSignature"
                class="py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
              >
                <Check class="w-3.5 h-3.5" /> 保存签名
              </button>
            </div>
            <div v-if="signatureDataUrl" class="border border-border rounded-lg p-3 bg-muted/30">
              <p class="text-xs text-muted-foreground mb-2">签名预览（透明底）</p>
              <div class="bg-white rounded border border-border p-2 flex items-center justify-center">
                <img :src="signatureDataUrl" alt="签名预览" class="max-h-16 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤②：上传 PDF 并定位 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mr-2">2</span>
          上传 PDF 并定位签名
          <CheckCircle v-if="pdfReady && targetPage" class="w-4 h-4 ml-2 text-green-600 dark:text-green-400" />
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 文件与页面选择 -->
          <div class="space-y-4">
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
              <Upload class="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">点击或拖入 PDF 文件</p>
              <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <ShieldCheck class="w-3 h-3" /> 纯本地处理，文件不上传
              </p>
            </div>
            <div v-if="fileName" class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <FileText class="w-4 h-4 text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
                <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}<span v-if="pageCount"> · 共 {{ pageCount }} 页</span></p>
              </div>
              <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <div v-if="thumbs.length">
              <label class="block text-sm font-medium text-foreground mb-2">选择签名页码</label>
              <select
                v-model.number="pageSelect"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="t in thumbs" :key="t.pageNo" :value="t.pageNo">第 {{ t.pageNo }} 页</option>
              </select>
              <div class="grid grid-cols-3 gap-2 mt-3 max-h-64 overflow-y-auto pr-1">
                <button
                  v-for="t in thumbs"
                  :key="t.pageNo"
                  @click="selectTargetPage(t.pageNo)"
                  class="relative border rounded-lg overflow-hidden transition-all"
                  :class="targetPage === t.pageNo ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'"
                >
                  <img :src="t.thumb" :alt="`第 ${t.pageNo} 页`" class="w-full h-auto bg-white" draggable="false" />
                  <span class="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] py-0.5">{{ t.pageNo }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 定位预览 -->
          <div class="lg:col-span-2 space-y-3">
            <div v-if="!previewUrl" class="py-16 text-center text-muted-foreground">
              <FileSignature class="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p class="text-sm">上传 PDF 后点击缩略图选择签名页面</p>
              <p class="text-xs mt-1">在大图上拖拽签名即可调整位置</p>
            </div>
            <template v-else>
              <div
                ref="previewBox"
                class="relative inline-block max-w-full border border-border rounded-lg overflow-hidden bg-white"
              >
                <img :src="previewUrl" alt="页面预览" class="block w-full h-auto select-none" draggable="false" />
                <img
                  v-if="signatureDataUrl"
                  :src="signatureDataUrl"
                  alt="签名"
                  class="absolute cursor-move touch-none select-none"
                  :style="sigStyle"
                  draggable="false"
                  @pointerdown="startDrag"
                  @pointermove="onDragMove"
                  @pointerup="stopDrag"
                  @pointercancel="stopDrag"
                />
                <div v-if="!signatureDataUrl" class="absolute inset-0 flex items-center justify-center bg-background/60">
                  <p class="text-xs text-muted-foreground">请先完成步骤①保存签名</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2">
                    签名宽度：<span class="text-primary">{{ Math.round(relW * 100) }}%</span> 页宽
                  </label>
                  <input v-model.number="relW" type="range" min="0.05" max="0.8" step="0.01" class="w-full accent-primary" />
                  <p class="text-xs text-muted-foreground mt-1">高度按签名原始比例自动等比缩放</p>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-xs text-muted-foreground space-y-0.5 self-end">
                  <p>目标页码：第 {{ targetPage }} 页</p>
                  <p>位置：水平 {{ Math.round(relX * 100) }}% · 垂直 {{ Math.round(relY * 100) }}%（可直接拖拽微调）</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 步骤③：应用并下载 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mr-2">3</span>
          应用签名并下载
        </h2>
        <button
          @click="applySignature"
          :disabled="!canApply || processing"
          class="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
          <Download v-else class="w-4 h-4" />
          {{ processing ? '正在生成…' : '应用签名并下载 PDF' }}
        </button>
        <p v-if="!canApply && !processing" class="text-xs text-muted-foreground mt-2">
          {{ !signatureDataUrl ? '请先完成步骤①保存签名' : !pdfReady ? '请先上传 PDF 文件' : '请选择签名页码' }}
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 电子签名</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            日常合同会签、审批单、承诺书、收据确认，多数场景只需要"签个名"的视觉效果。本工具在浏览器本地完成手写签名采集与 PDF 落章，文件不上传任何服务器，敏感合同也不出本机。
          </p>
          <h3 class="text-lg font-semibold text-foreground">手写签名如何导入</h3>
          <p>
            用鼠标或触屏在书写板签名，笔画按所选粗细实时绘制；保存时自动扫描笔迹边界、裁掉四周空白并导出透明底 PNG，落章时不会带白色底块，叠在文字上只显示笔画本身。
          </p>
          <h3 class="text-lg font-semibold text-foreground">位置与大小怎么调</h3>
          <p>
            点击页面缩略图选择签名页后，签名会叠在页面大图上：直接拖拽即可移动位置，宽度滑条按签名原始比例等比缩放。应用时按"缩略图相对位置 × 页面实际尺寸"换算为 PDF 坐标（PDF 原点在左下，自动完成翻转），落点即所见即所得。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。签名采集、页面渲染、签名写入、下载全部在浏览器本地完成。</li>
            <li><span class="text-foreground font-medium">这算有法律效力的电子签名吗？</span>本工具生成的是"视觉签名"，满足日常内部审批与双方确认场景；需要《电子签名法》意义上可靠电子签名（CA 数字证书、防篡改）的场合，请使用合规的第三方签约服务。</li>
            <li><span class="text-foreground font-medium">能在多页签名吗？</span>当前一次应用到一个页面；如需多页签名，可对已下载的文件再执行一遍步骤②③。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-signer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileSignature, FileText, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  ShieldCheck, Eraser, Check, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF电子签名 - 手写签名拖拽定位本地工具',
  description: '在线 PDF 电子签名工具，手写板书写签名自动裁边导出透明 PNG，拖拽定位到任意页任意位置，等比缩放，纯浏览器本地处理不上传',
  keywords: 'pdf签名, 电子签名, 手写签名pdf, pdf盖章, 在线签名, 合同签名',
  author: 'Util工具箱',
  ogTitle: 'PDF电子签名 - 有条工具',
  ogDescription: '手写板书写签名，拖拽定位到 PDF 任意页任意位置，合同审批本地签',
  ogUrl: 'https://www.util.cn/tools/pdf-signer',
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
          name: 'PDF电子签名',
          url: 'https://www.util.cn/tools/pdf-signer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['手写板签名采集', '自动裁边透明底 PNG', '页面缩略图选页', '拖拽定位等比缩放', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF电子签名', item: 'https://www.util.cn/tools/pdf-signer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'PDF 签名会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。签名采集、页面渲染、签名写入、下载全部在浏览器本地完成。' }
            },
            {
              '@type': 'Question',
              name: '这算有法律效力的电子签名吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具生成的是视觉签名，适合日常内部审批；需要可靠电子签名请使用 CA 数字证书服务。' }
            },
            {
              '@type': 'Question',
              name: '能在多页签名吗？',
              acceptedAnswer: { '@type': 'Answer', text: '当前一次应用到一个页面，多页需求可对下载后的文件再签一次。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-signer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  initPad()
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
// 签名落章坐标换算：缩略图相对位置 × 页面实际尺寸
// relX/relY：签名中心点相对页面左上角的比例（0~1，relY 向下为正，与屏幕一致）
// relW：签名宽度占页宽的比例；aspect：签名图宽高比（w/h）
// 返回 [x, y, w, h]，PDF 坐标系原点在左下，y 轴已翻转
const placeRect = (pageW, pageH, relX, relY, relW, aspect) => {
  const a = aspect > 0 ? aspect : 3
  const w = relW * pageW
  const h = w / a
  const x = relX * pageW - w / 2
  const y = (1 - relY) * pageH - h / 2
  return [x, y, w, h]
}

// 扫描 canvas 非透明像素边界并裁剪（返回新 canvas，全透明返回 null）
const trimCanvas = (canvas) => {
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const data = ctx.getImageData(0, 0, width, height).data
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  const pad = 8
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)
  const out = document.createElement('canvas')
  out.width = maxX - minX + 1
  out.height = maxY - minY + 1
  out.getContext('2d').drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height)
  return out
}

// 字节大小格式化
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 步骤①：手写板 ----------
const padCanvas = ref(null)
const brushWidth = ref(4)
const hasInk = ref(false)
const signatureDataUrl = ref('')
const sigAspect = ref(3)

const brushOptions = [
  { value: 2.5, label: '细' },
  { value: 4, label: '中' },
  { value: 7, label: '粗' }
]

let isDrawing = false
let lastX = 0
let lastY = 0

const initPad = () => {
  const canvas = padCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#111827'
}

const padPos = (e) => {
  const canvas = padCanvas.value
  const rect = canvas.getBoundingClientRect()
  return [
    (e.clientX - rect.left) * (canvas.width / rect.width),
    (e.clientY - rect.top) * (canvas.height / rect.height)
  ]
}

const startDraw = (e) => {
  const canvas = padCanvas.value
  if (!canvas) return
  e.preventDefault()
  canvas.setPointerCapture(e.pointerId)
  isDrawing = true
  const pos = padPos(e)
  lastX = pos[0]
  lastY = pos[1]
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
}

const moveDraw = (e) => {
  if (!isDrawing) return
  e.preventDefault()
  const ctx = padCanvas.value.getContext('2d')
  const pos = padPos(e)
  ctx.lineWidth = brushWidth.value
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos[0], pos[1])
  ctx.stroke()
  lastX = pos[0]
  lastY = pos[1]
  hasInk.value = true
}

const endDraw = () => { isDrawing = false }

const clearPad = () => {
  const canvas = padCanvas.value
  if (!canvas) return
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  hasInk.value = false
}

const saveSignature = () => {
  const canvas = padCanvas.value
  if (!canvas) return
  if (!hasInk.value) {
    error.value = '请先在书写区签名，再点击保存'
    return
  }
  error.value = ''
  const trimmed = trimCanvas(canvas)
  if (!trimmed) {
    error.value = '未检测到有效笔迹，请重新签名'
    return
  }
  signatureDataUrl.value = trimmed.toDataURL('image/png')
  sigAspect.value = trimmed.width / trimmed.height
}

// ---------- 步骤②：上传 PDF 并定位 ----------
const file = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const pageCount = ref(0)
const fileInput = ref(null)
const isDragging = ref(false)
const processing = ref(false)
const error = ref('')
const pdfReady = ref(false)
const thumbs = ref([]) // { pageNo, thumb }
const targetPage = ref(0)
const previewUrl = ref('')
const previewBox = ref(null)
const pageSelect = computed({
  get: () => targetPage.value,
  set: (v) => selectTargetPage(v)
})
const relX = ref(0.72)
const relY = ref(0.85)
const relW = ref(0.3)

let pdfjsDoc = null // 非响应式：已打开的 PDF 文档句柄
let dragging = false

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const sigStyle = computed(() => ({
  left: (relX.value * 100) + '%',
  top: (relY.value * 100) + '%',
  width: (relW.value * 100) + '%',
  transform: 'translate(-50%, -50%)'
}))

const canApply = computed(() => Boolean(signatureDataUrl.value && pdfReady.value && targetPage.value))

const outputName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-已签名.pdf`
})

const clamp01 = (v) => Math.min(0.98, Math.max(0.02, v))

const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const clearFile = async () => {
  if (pdfjsDoc) {
    try { pdfjsDoc.destroy() } catch (e) { /* 忽略销毁异常 */ }
    pdfjsDoc = null
  }
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  pdfReady.value = false
  thumbs.value = []
  targetPage.value = 0
  previewUrl.value = ''
  error.value = ''
}

// 渲染指定页为定位用大图
const renderPreview = async (pageNo) => {
  if (!pdfjsDoc || !pageNo) return
  const page = await pdfjsDoc.getPage(pageNo)
  const scale = 1.5
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  previewUrl.value = canvas.toDataURL('image/jpeg', 0.85)
  page.cleanup()
}

const selectTargetPage = async (pageNo) => {
  if (!pageNo || pageNo === targetPage.value) return
  targetPage.value = pageNo
  await renderPreview(pageNo)
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
    // 生成页面缩略图
    const list = []
    for (let n = 1; n <= pageCount.value; n++) {
      const page = await pdfjsDoc.getPage(n)
      const viewport = page.getViewport({ scale: 0.25 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport }).promise
      list.push({ pageNo: n, thumb: canvas.toDataURL('image/jpeg', 0.7) })
      page.cleanup()
      await new Promise((r) => setTimeout(r, 0))
    }
    thumbs.value = list
    pdfReady.value = true
    await selectTargetPage(1)
  } catch (e) {
    error.value = '无法读取该 PDF（文件可能损坏或加密），请确认后重试。' + (e && e.message ? `（${e.message}）` : '')
    await clearFile()
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

// ---------- 签名拖拽 ----------
const startDrag = (e) => {
  e.preventDefault()
  const img = e.currentTarget
  if (img && img.setPointerCapture) img.setPointerCapture(e.pointerId)
  dragging = true
}

const onDragMove = (e) => {
  if (!dragging) return
  const box = previewBox.value
  if (!box) return
  const rect = box.getBoundingClientRect()
  relX.value = clamp01((e.clientX - rect.left) / rect.width)
  relY.value = clamp01((e.clientY - rect.top) / rect.height)
}

const stopDrag = () => { dragging = false }

// ---------- 步骤③：应用签名 ----------
const applySignature = async () => {
  if (!canApply.value) return
  processing.value = true
  error.value = ''
  try {
    const { PDFDocument } = await import('pdf-lib')
    const bytes = await file.value.arrayBuffer()
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const pages = doc.getPages()
    const page = pages[targetPage.value - 1]
    const { width: pw, height: ph } = page.getSize()
    const pngImage = await doc.embedPng(signatureDataUrl.value)
    const rect = placeRect(pw, ph, relX.value, relY.value, relW.value, sigAspect.value)
    page.drawImage(pngImage, { x: rect[0], y: rect[1], width: rect[2], height: rect[3] })
    const outBytes = await doc.save()
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
    error.value = '签名写入失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    processing.value = false
  }
}
</script>
