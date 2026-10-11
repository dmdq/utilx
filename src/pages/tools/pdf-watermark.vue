<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF水印添加器</h1>
          <p class="text-sm text-muted-foreground mt-1">本地为 PDF 平铺文字水印，角度/透明度/密度/页码范围可调，文件不出浏览器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 PDF 后在浏览器本地平铺文字水印，支持自定义水印文字、字号、颜色、透明度、旋转角与平铺密度，可指定页码范围。中文水印自动采用浏览器渲染模式（canvas 预渲染后嵌入），文件全程不上传服务器，适合合同、标书、内部资料加注。
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

        <!-- 水印配置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 水印设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">水印文字</label>
            <input
              v-model="watermarkText"
              type="text"
              maxlength="60"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="仅供内部查阅"
            />
            <p v-if="hasCJK" class="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
              <Info class="w-3 h-3 flex-shrink-0" /> 检测到中文，自动使用浏览器渲染模式（canvas 预渲染嵌入），支持任意中文
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">颜色</label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="c in colorPalette"
                :key="c.hex"
                @click="colorHex = c.hex"
                class="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110"
                :class="colorHex === c.hex ? 'border-primary ring-2 ring-primary/30' : 'border-border'"
                :style="{ backgroundColor: c.hex }"
                :title="c.name"
              ></button>
              <input
                v-model="colorHex"
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                title="自定义颜色"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              透明度：<span class="text-primary">{{ opacity.toFixed(2) }}</span>
            </label>
            <input v-model.number="opacity" type="range" min="0.05" max="0.5" step="0.05" class="w-full accent-primary" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">字号（pt）</label>
              <input
                v-model.number="fontSize"
                type="number"
                min="8"
                max="120"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">旋转角（度）</label>
              <input
                v-model.number="rotation"
                type="number"
                min="-90"
                max="90"
                step="15"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">横向间距（pt）</label>
              <input
                v-model.number="spacingX"
                type="number"
                min="40"
                max="600"
                step="10"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">纵向间距（pt）</label>
              <input
                v-model.number="spacingY"
                type="number"
                min="40"
                max="600"
                step="10"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">页码范围</label>
            <div class="grid grid-cols-2 gap-1.5 mb-2">
              <button
                @click="pageRangeMode = 'all'"
                :class="pageRangeMode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded-lg text-xs font-medium transition-all"
              >全部页面</button>
              <button
                @click="pageRangeMode = 'custom'"
                :class="pageRangeMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded-lg text-xs font-medium transition-all"
              >自定义范围</button>
            </div>
            <div v-if="pageRangeMode === 'custom'" class="flex items-center gap-2">
              <input
                v-model.number="rangeFrom"
                type="number"
                min="1"
                class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="起始页"
              />
              <span class="text-muted-foreground text-sm">至</span>
              <input
                v-model.number="rangeTo"
                type="number"
                min="1"
                class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="结束页"
              />
            </div>
            <p v-if="pageRangeMode === 'custom' && pageCount" class="text-xs text-muted-foreground mt-1.5">输入 1 到 {{ pageCount }} 之间的页码</p>
          </div>
        </div>
      </div>

      <!-- 右侧：处理与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 处理按钮 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              @click="processPdf"
              :disabled="!file || processing"
              class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
              <Stamp v-else class="w-4 h-4" />
              {{ processing ? '正在加水印…' : '开始加水印并下载' }}
            </button>
            <div v-if="file" class="text-xs text-muted-foreground sm:max-w-[45%]">
              {{ watermarkText || '（未填写水印文字）' }} · {{ colorHex }} · 透明度 {{ opacity.toFixed(2) }} · {{ rotation }}° · {{ pageRangeMode === 'all' ? '全部页面' : `第 ${clampedFrom}-${clampedTo} 页` }}
            </div>
          </div>

          <div v-if="error" class="mt-4 flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- 成功结果卡片 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 处理完成
          </h2>
          <div class="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 rounded-lg p-5 text-center mb-4">
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ result.pageCount }} 页</p>
            <p class="text-sm text-muted-foreground mt-1">已为 {{ result.watermarkedPages }} 页添加水印 · 输出 {{ formatSize(result.size) }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm mb-4">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">原文件</span>
              <span class="font-medium text-foreground truncate max-w-[60%]" :title="fileName">{{ fileName }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">渲染模式</span>
              <span class="font-medium text-foreground">{{ result.mode === 'cjk' ? '浏览器渲染（中文）' : 'PDF 字体直绘' }}</span>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 {{ outputName }}
          </button>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 使用建议
          </h2>
          <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
            <li>水印文字建议 2-12 个字，过长会显著增加文件体积（浏览器渲染模式为图片平铺）。</li>
            <li>透明度 0.05-0.5：正文阅读场景建议 0.1-0.2，防转发场景可提高到 0.3-0.5。</li>
            <li>间距越小水印越密，防抠图能力越强，但视觉干扰也越大；常用横向 200 / 纵向 150。</li>
            <li>本工具只加水印不做内容加密，如需限制打开请配合 PDF 权限工具使用。</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 水印</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            给 PDF 加水印是最常用的文档防泄露手段：在每一页平铺半透明文字（如"仅供内部查阅""XX公司机密"或接收人姓名），既不影响正文阅读，又能在截图外传时留下溯源标记。本工具基于 pdf-lib 在浏览器本地完成，PDF 文件不会上传到任何服务器。
          </p>
          <h3 class="text-lg font-semibold text-foreground">两种渲染模式的区别</h3>
          <p>
            纯英文/数字水印直接以 PDF 字体（Helvetica）矢量绘制，文件体积几乎不变；中文水印因 PDF 标准字体不含中文字形，自动切换为"浏览器渲染模式"——用 canvas 把文字预渲染为透明 PNG 再平铺嵌入，支持任意中文并保留颜色与透明度，代价是文件体积略有增加。
          </p>
          <h3 class="text-lg font-semibold text-foreground">水印参数怎么选</h3>
          <p>
            阅读优先：透明度 0.1 左右、字号 30-40、间距 200×150、旋转 -45°，是"看得见但不吵"的经典组合；防扩散优先：透明度提到 0.3-0.5、间距缩小到 120×100，让水印覆盖全部正文区域，截图后无法裁剪绕开。指定页码范围还可以只给封面或合同首页加注。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。文件读取、水印绘制、保存全部在浏览器本地完成，断网状态下同样可用。</li>
            <li><span class="text-foreground font-medium">为什么中文水印的文件变大较多？</span>中文走 canvas 预渲染 PNG 平铺，每个平铺位置都会引用同一张图片，体积增加有限但与页数成正比；纯西文水印为矢量绘制，几乎不变。</li>
            <li><span class="text-foreground font-medium">加密过的 PDF 能加水印吗？</span>带打开密码的 PDF 无法直接处理，需先解密；带权限密码但可正常打开的文件通常可以处理成功。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-watermark'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  Settings2, Stamp, ShieldCheck, Info, Lightbulb, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF水印添加器 - 本地平铺文字水印工具',
  description: '在浏览器本地为PDF平铺文字水印，水印文字/字号/颜色/透明度/旋转角/平铺密度/页码范围可调，中文自动走canvas渲染模式，文件不上传服务器',
  keywords: 'pdf加水印, pdf文字水印, 水印平铺, pdf保护, 合同水印, pdf水印在线',
  author: 'Util工具箱',
  ogTitle: 'PDF水印添加器 - 有条工具',
  ogDescription: '本地为PDF平铺文字水印，角度/透明度/密度/页码范围可调，文件不出浏览器',
  ogUrl: 'https://www.util.cn/tools/pdf-watermark',
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
          name: 'PDF水印添加器',
          url: 'https://www.util.cn/tools/pdf-watermark',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['平铺文字水印', '自定义颜色与透明度', '旋转角与密度可调', '页码范围指定', '中文canvas渲染', '纯本地处理']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF水印添加器', item: 'https://www.util.cn/tools/pdf-watermark/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '文件会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。文件读取、水印绘制、保存全部在浏览器本地完成，断网状态下同样可用。' }
            },
            {
              '@type': 'Question',
              name: '为什么中文水印的文件变大较多？',
              acceptedAnswer: { '@type': 'Answer', text: '中文走canvas预渲染PNG平铺嵌入，体积与页数成正比略有增加；纯西文水印为矢量绘制，几乎不变。' }
            },
            {
              '@type': 'Question',
              name: '加密过的PDF能加水印吗？',
              acceptedAnswer: { '@type': 'Answer', text: '带打开密码的PDF无法直接处理，需先解密；带权限密码但可正常打开的文件通常可以处理成功。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-watermark')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数（可独立测试） ----------
// 平铺位置网格：从半间距起步，覆盖整页（含旋转溢出余量）
const buildTilePositions = (pageW, pageH, stepX, stepY) => {
  const sx = Math.max(20, stepX)
  const sy = Math.max(20, stepY)
  const positions = []
  for (let y = sy * 0.5; y < pageH + sy; y += sy) {
    for (let x = sx * 0.5; x < pageW + sx; x += sx) {
      positions.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100])
    }
  }
  return positions
}

// 页码范围解析（1 基，含端点，自动钳制）
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

// 是否含中日韩字符
const hasCJKChar = (s) => /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(s || '')

// 十六进制颜色 → 0-1 rgb
const hexToRgb01 = (hex) => {
  let h = String(hex || '').replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0.6, g: 0.6, b: 0.6 }
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  }
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

const watermarkText = ref('仅供内部查阅')
const colorHex = ref('#9ca3af')
const opacity = ref(0.15)
const fontSize = ref(36)
const rotation = ref(-45)
const spacingX = ref(200)
const spacingY = ref(150)
const pageRangeMode = ref('all')
const rangeFrom = ref(1)
const rangeTo = ref(1)

const colorPalette = [
  { name: '中性灰', hex: '#9ca3af' },
  { name: '浅黑', hex: '#374151' },
  { name: '红', hex: '#ef4444' },
  { name: '蓝', hex: '#3b82f6' },
  { name: '绿', hex: '#22c55e' }
]

const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const hasCJK = computed(() => hasCJKChar(watermarkText.value))
const clampedRange = computed(() => resolvePageRange(pageRangeMode.value, pageCount.value, rangeFrom.value, rangeTo.value))
const clampedFrom = computed(() => clampedRange.value.start)
const clampedTo = computed(() => clampedRange.value.end)

const outputName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-水印.pdf`
})

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetResult = () => { result.value = null; error.value = '' }

const acceptFile = async (f) => {
  if (!f) return
  if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
    error.value = '请选择 PDF 文件'
    return
  }
  resetResult()
  file.value = f
  fileName.value = f.name
  fileSize.value = f.size
  pageCount.value = 0
  rangeFrom.value = 1
  rangeTo.value = 1
  try {
    const { PDFDocument } = await import('pdf-lib')
    const bytes = await f.arrayBuffer()
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    pageCount.value = doc.getPageCount()
  } catch (e) {
    error.value = '无法读取该 PDF（文件可能损坏或加密），请确认后重试。'
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

const clearFile = () => {
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  resetResult()
}

// ---------- 中文 canvas 预渲染 ----------
const renderTextPng = (text, opts) => {
  const scale = 4
  const fontPx = Math.max(8, Math.min(120, opts.fontSize)) * scale
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const font = `bold ${fontPx}px "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.font = font
  const metrics = ctx.measureText(text)
  const pad = Math.ceil(fontPx * 0.3)
  canvas.width = Math.ceil(metrics.width) + pad * 2
  canvas.height = Math.ceil(fontPx * 1.4) + pad * 2
  const ctx2 = canvas.getContext('2d')
  ctx2.clearRect(0, 0, canvas.width, canvas.height)
  ctx2.font = font
  ctx2.textBaseline = 'middle'
  ctx2.textAlign = 'center'
  const { r, g, b } = hexToRgb01(opts.colorHex)
  ctx2.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opts.opacity})`
  ctx2.fillText(text, canvas.width / 2, canvas.height / 2)
  return {
    dataUrl: canvas.toDataURL('image/png'),
    widthPt: canvas.width / scale,
    heightPt: canvas.height / scale
  }
}

// ---------- 主流程 ----------
const processPdf = async () => {
  if (!file.value) {
    error.value = '请先选择 PDF 文件'
    return
  }
  const text = (watermarkText.value || '').trim()
  if (!text) {
    error.value = '请填写水印文字'
    return
  }
  processing.value = true
  error.value = ''
  result.value = null
  try {
    const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib')
    const bytes = await file.value.arrayBuffer()
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const pages = pdfDoc.getPages()
    const { start, end } = resolvePageRange(pageRangeMode.value, pages.length, rangeFrom.value, rangeTo.value)

    const cjk = hasCJKChar(text)
    let cjkImage = null
    let cjkW = 0
    let cjkH = 0
    let helv = null
    if (cjk) {
      const png = renderTextPng(text, { fontSize: fontSize.value, colorHex: colorHex.value, opacity: opacity.value })
      cjkImage = await pdfDoc.embedPng(png.dataUrl)
      cjkW = png.widthPt
      cjkH = png.heightPt
    } else {
      helv = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }
    const { r, g, b } = hexToRgb01(colorHex.value)
    const drawOpts = { size: fontSize.value, font: helv, color: rgb(r, g, b), opacity: opacity.value, rotate: degrees(rotation.value) }
    const rad = (rotation.value * Math.PI) / 180

    let touched = 0
    for (let i = start - 1; i <= end - 1; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()
      const positions = buildTilePositions(width, height, spacingX.value, spacingY.value)
      if (cjk) {
        // 旋转后整体向原点方向平移，保证视觉居中
        const midX = cjkW / 2
        const midY = cjkH / 2
        const offX = midX * Math.cos(rad) - midY * Math.sin(rad) - midX
        const offY = midX * Math.sin(rad) + midY * Math.cos(rad) - midY
        for (const [px, py] of positions) {
          page.drawImage(cjkImage, {
            x: px - offX,
            y: py - offY,
            width: cjkW,
            height: cjkH,
            rotate: degrees(rotation.value)
          })
        }
      } else {
        for (const [px, py] of positions) {
          page.drawText(text, { x: px, y: py, ...drawOpts })
        }
      }
      touched++
    }

    const outBytes = await pdfDoc.save()
    result.value = {
      pageCount: pages.length,
      watermarkedPages: touched,
      size: outBytes.byteLength,
      data: outBytes,
      mode: cjk ? 'cjk' : 'vector'
    }
  } catch (err) {
    error.value = '水印处理失败，文件可能已损坏或受加密保护。' + (err && err.message ? `（${err.message}）` : '')
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
