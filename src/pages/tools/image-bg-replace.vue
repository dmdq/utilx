<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Pipette class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">图片背景纯色替换</h1>
          <p class="text-sm text-muted-foreground mt-1">点选取色 + 容差控制，Canvas 像素级本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传图片后点击画面选取要替换的背景色（也可手动输入颜色），调节容差并用「全局替换」或「连续区域填充」两种模式把背景换成任意纯色，支持边缘柔化与原图对比。典型场景：证件照换底色。全部处理在浏览器 Canvas 中像素级完成，图片不会上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传与设置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Image class="w-5 h-5 mr-2 text-primary" /> 上传图片
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <Image v-if="!fileName" class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <CheckCircle v-else class="w-6 h-6 mx-auto mb-1.5 text-primary" />
            <p v-if="!fileName" class="text-xs text-muted-foreground">点击选择或拖入图片文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ fileName }}</p>
            <p v-if="imgInfo" class="text-xs text-muted-foreground mt-1">{{ imgInfo }}</p>
          </div>
          <button
            v-if="hasImage"
            @click="clearAll"
            class="w-full mt-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空重来
          </button>
        </div>

        <!-- 替换设置 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 替换设置
          </h2>

          <!-- 模式 -->
          <label class="block text-xs text-muted-foreground mb-1.5">替换模式</label>
          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              @click="mode = 'global'"
              :disabled="!hasImage"
              :class="mode === 'global' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >全局替换</button>
            <button
              @click="mode = 'flood'"
              :disabled="!hasImage"
              :class="mode === 'flood' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >连续区域填充</button>
          </div>
          <p class="text-xs text-muted-foreground mb-4">
            {{ mode === 'global'
              ? '画面中所有与点选色相近的像素都会被替换。'
              : '从点击位置向外扩散，只替换连成一片的相近区域，适合保留画面中同色物体。' }}
          </p>

          <!-- 点选颜色 -->
          <label class="block text-xs text-muted-foreground mb-1.5 flex items-center">
            <Pipette class="w-3.5 h-3.5 mr-1" /> 被替换的背景色
          </label>
          <div class="flex items-center gap-2 mb-1.5">
            <span
              class="w-9 h-9 rounded-lg border border-border flex-shrink-0"
              :style="{ background: pickedHex }"
            ></span>
            <input
              v-model="pickedHex"
              type="color"
              class="w-12 h-9 cursor-pointer bg-transparent border border-input rounded-lg p-0.5"
              title="手动选择背景色"
              @input="onManualPick"
            />
            <input
              v-model="pickedHex"
              type="text"
              class="flex-1 min-w-0 px-2.5 py-2 bg-background border border-input rounded-lg text-sm font-mono uppercase"
              @change="onManualPick"
            />
          </div>
          <p class="text-xs text-muted-foreground mb-4">在右侧图片上点击即可取色，也可手动输入色值。</p>

          <!-- 替换为 -->
          <label class="block text-xs text-muted-foreground mb-1.5">替换为</label>
          <div class="flex items-center gap-2 mb-4">
            <span
              class="w-9 h-9 rounded-lg border border-border flex-shrink-0"
              :style="{ background: replaceHex }"
            ></span>
            <input
              v-model="replaceHex"
              type="color"
              class="w-12 h-9 cursor-pointer bg-transparent border border-input rounded-lg p-0.5"
              title="选择替换颜色"
            />
            <input
              v-model="replaceHex"
              type="text"
              class="flex-1 min-w-0 px-2.5 py-2 bg-background border border-input rounded-lg text-sm font-mono uppercase"
            />
          </div>

          <!-- 容差 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs text-muted-foreground">颜色容差</label>
              <span class="text-xs text-muted-foreground">{{ tolerance }} / 100</span>
            </div>
            <input
              v-model.number="tolerance"
              type="range"
              min="0"
              max="100"
              class="w-full accent-primary"
              :disabled="!hasImage"
            />
          </div>

          <!-- 边缘柔化 -->
          <label class="flex items-center justify-between cursor-pointer">
            <span>
              <span class="text-sm text-foreground block">边缘柔化</span>
              <span class="text-xs text-muted-foreground">对替换边界做 1px 混合，降低锯齿</span>
            </span>
            <button
              type="button"
              @click="soften = !soften"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3"
              :class="soften ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="soften ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <button
            v-if="hasImage && processedData"
            @click="resetProcess"
            class="w-full mt-5 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" /> 恢复原图
          </button>
        </div>

        <!-- 使用提示 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 使用提示
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 证件照换底色：先用吸管点一下背景，再小幅调容差，直到人物边缘干净</li>
            <li>• <span class="text-foreground">半透明或渐变背景</span>建议调高容差并打开边缘柔化，过渡更自然</li>
            <li>• 背景与人物颜色接近时，改用「连续区域填充」可避免误伤同色区域</li>
            <li>• 全程 Canvas 像素级本地处理，图片不会上传到任何服务器</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：画布与下载 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 预览
            </h2>
            <div class="flex items-center gap-2">
              <div class="grid grid-cols-2 gap-1">
                <button
                  @click="showOriginal = true"
                  :disabled="!hasImage"
                  :class="showOriginal ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >原图</button>
                <button
                  @click="showOriginal = false"
                  :disabled="!hasImage"
                  :class="!showOriginal ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >处理后</button>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div
              v-if="hasImage"
              class="relative rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center"
            >
              <canvas
                ref="canvasRef"
                class="max-w-full h-auto block cursor-crosshair"
                @click="onCanvasClick"
              ></canvas>
              <div
                v-if="processing"
                class="absolute inset-0 flex items-center justify-center bg-background/60"
              >
                <Loader2 class="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>
            <div v-else class="rounded-lg border border-dashed border-border py-20 text-center">
              <Pipette class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">上传图片后，点击画面即可选取背景色</p>
            </div>

            <p v-if="hasImage" class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Pipette class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {{ mode === 'flood' && !pickedFromClick
                ? '连续区域模式：请先点击图片选择填充起点（或手动输入背景色，将自动寻找起点）'
                : '点击图片上要替换的背景色，调整容差后自动重新处理' }}
            </p>
          </div>
        </div>

        <!-- 下载 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Download class="w-4 h-4 mr-2 text-primary" /> 下载结果
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="downloadResult('png')"
              :disabled="!hasImage || !processedData"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Download class="w-4 h-4" /> 下载 PNG
            </button>
            <button
              @click="downloadResult('jpeg')"
              :disabled="!hasImage || !processedData"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Download class="w-4 h-4" /> 下载 JPEG（白底）
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-3">下载的是当前「处理后」结果；JPEG 不支持透明通道，透明区域会填充为白色。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于图片背景纯色替换</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            把证件照的红底、蓝底换成白底，或把产品图的杂乱背景统一成品牌色，是最高频的图片处理需求之一。本工具的做法是「颜色替换」而非「智能抠图」：你在图片上点一下背景色，工具把画面中（或与点击点连成一片的区域内）颜色相近的像素整体替换成目标色。因为不涉及前景建模，处理速度快、边缘可控，对证件照这类背景均匀的图片效果非常好。
          </p>
          <h3 class="text-lg font-semibold text-foreground">两种模式怎么选</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>全局替换：所有与点选色相近的像素都被替换，适合背景色干净、画面中没有其他同色物体的图片</li>
            <li>连续区域填充：从点击位置像油漆桶一样向外扩散，只替换连在一起的区域，适合画面中存在同色物体的情况</li>
            <li>容差决定「多近算相近」：背景有轻微渐变或噪点时调高容差，背景与主体颜色接近时调低容差</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">人物边缘有白边或锯齿怎么办？</span>适当调高容差并打开「边缘柔化」，工具会对替换边界做 1px 混合，过渡更自然。</li>
            <li><span class="text-foreground font-medium">图片会上传吗？</span>不会。所有处理都在浏览器 Canvas 中像素级完成，关掉页面数据即消失。</li>
            <li><span class="text-foreground font-medium">支持多大的图片？</span>为保障处理流畅，超长边会等比缩放至 3000 像素以内，日常证件照与电商图完全够用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'image-bg-replace'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Pipette, Image, Settings2, Eye, Download, Trash2, RefreshCw,
  Info, CheckCircle, Loader2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '图片背景纯色替换 - 在线证件照换底色工具',
  description: '在线图片背景颜色替换工具，点选取色或手动输入颜色，容差可调，支持全局替换与连续区域填充两种模式，边缘柔化降低锯齿，证件照换底色神器，Canvas像素级本地处理不上传',
  keywords: '证件照换底色, 图片背景替换, 换背景颜色, 照片底色替换, 抠图换底, 背景颜色修改',
  author: 'Util工具箱',
  ogTitle: '图片背景纯色替换 - 有条工具',
  ogDescription: '点选取色 + 容差控制，Canvas 像素级本地处理',
  ogUrl: 'https://www.util.cn/tools/image-bg-replace',
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
          name: '图片背景纯色替换',
          url: 'https://www.util.cn/tools/image-bg-replace',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['点选取色/手动输入颜色', '容差可调', '全局替换与连续区域填充', '边缘柔化', 'PNG/JPEG下载']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '图片背景纯色替换', item: 'https://www.util.cn/tools/image-bg-replace/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '人物边缘有锯齿怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '适当调高颜色容差并打开边缘柔化，工具会对替换边界像素做1px混合，过渡更自然。' }
            },
            {
              '@type': 'Question',
              name: '图片会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，所有处理都在浏览器Canvas中像素级完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'image-bg-replace')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const MAX_SIDE = 3000
const pickedHex = ref('#ffffff')
const replaceHex = ref('#3b82f6')
const tolerance = ref(20)
const mode = ref('global')
const soften = ref(true)
const showOriginal = ref(false)
const processing = ref(false)
const pickedFromClick = ref(false)
const fileName = ref('')
const imgInfo = ref('')
const isDragging = ref(false)
const hasImage = ref(false)
const canvasRef = ref(null)
const fileInput = ref(null)
const seoContentVisible = ref(true)

// 原始图像数据
let imgData = null
let imgWidth = 0
let imgHeight = 0
let processedData = null
let seedPoint = null   // { x, y } 点击位置

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 颜色工具 ----------
const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return { r: 255, g: 255, b: 255 }
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

const distSq = (data, i, r, g, b) => {
  const dr = data[i] - r
  const dg = data[i + 1] - g
  const db = data[i + 2] - b
  return dr * dr + dg * dg + db * db
}

// ---------- 图片加载 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const selected = e.target.files?.[0]
  if (selected) loadImageFile(selected)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped && dropped.type.startsWith('image/')) loadImageFile(dropped)
}

const loadImageFile = (file) => {
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      // 超长边等比缩放，保障处理性能
      let w = img.naturalWidth
      let h = img.naturalHeight
      const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
      w = Math.max(1, Math.round(w * scale))
      h = Math.max(1, Math.round(h * scale))

      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const ctx = off.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0, w, h)
      imgData = ctx.getImageData(0, 0, w, h)
      imgWidth = w
      imgHeight = h
      processedData = null
      seedPoint = null
      pickedFromClick.value = false
      pickedHex.value = '#ffffff'
      showOriginal.value = false
      fileName.value = file.name
      imgInfo.value = `${img.naturalWidth}×${img.naturalHeight}${scale < 1 ? ` → 处理尺寸 ${w}×${h}` : ''}`
      hasImage.value = true
      redraw()
    }
    img.onerror = () => alert('图片加载失败，请更换文件重试')
    img.src = reader.result
  }
  reader.readAsDataURL(file)
}

// ---------- 画布渲染与取色 ----------
const redraw = () => {
  const canvas = canvasRef.value
  if (!canvas || !imgData) return
  canvas.width = imgWidth
  canvas.height = imgHeight
  const ctx = canvas.getContext('2d')
  ctx.putImageData((!showOriginal.value && processedData) ? processedData : imgData, 0, 0)
}

const onCanvasClick = (e) => {
  if (!imgData) return
  const rect = e.target.getBoundingClientRect()
  const x = Math.max(0, Math.min(imgWidth - 1, Math.floor((e.clientX - rect.left) * (imgWidth / rect.width))))
  const y = Math.max(0, Math.min(imgHeight - 1, Math.floor((e.clientY - rect.top) * (imgHeight / rect.height))))
  const i = (y * imgWidth + x) * 4
  pickedHex.value = rgbToHex(imgData.data[i], imgData.data[i + 1], imgData.data[i + 2])
  seedPoint = { x, y }
  pickedFromClick.value = true
  scheduleProcess()
}

const onManualPick = () => {
  seedPoint = null
  pickedFromClick.value = false
  scheduleProcess()
}

// ---------- 核心处理 ----------
const processImage = () => {
  if (!imgData) return
  const target = hexToRgb(pickedHex.value)
  const replace = hexToRgb(replaceHex.value)
  const tolMax = 441.67 // RGB 欧氏距离最大值
  const tol = (tolerance.value / 100) * tolMax
  const tolSq = tol * tol
  const { data, width, height } = imgData
  const out = new ImageData(new Uint8ClampedArray(data), width, height)
  const mask = new Uint8Array(width * height)
  const od = out.data

  if (mode.value === 'global') {
    // 全局替换：所有与点选色容差内匹配的像素
    for (let i = 0; i < data.length; i += 4) {
      if (distSq(data, i, target.r, target.g, target.b) <= tolSq) {
        const p = i / 4
        mask[p] = 1
        od[i] = replace.r
        od[i + 1] = replace.g
        od[i + 2] = replace.b
      }
    }
  } else {
    // 连续区域填充：BFS 从点击点扩散（无点击点时自动寻找首个匹配像素作为起点）
    let seedIdx = -1
    if (seedPoint) {
      seedIdx = seedPoint.y * width + seedPoint.x
    } else {
      for (let i = 0; i < data.length; i += 4) {
        if (distSq(data, i, target.r, target.g, target.b) <= tolSq) {
          seedIdx = i / 4
          break
        }
      }
    }
    if (seedIdx >= 0) {
      const si = seedIdx * 4
      const sr = data[si], sg = data[si + 1], sb = data[si + 2]
      const visited = new Uint8Array(width * height)
      const queue = new Int32Array(width * height)
      let head = 0
      let tail = 0
      queue[tail++] = seedIdx
      visited[seedIdx] = 1
      while (head < tail) {
        const idx = queue[head++]
        mask[idx] = 1
        const oi = idx * 4
        od[oi] = replace.r
        od[oi + 1] = replace.g
        od[oi + 2] = replace.b
        const x = idx % width
        const y = (idx / width) | 0
        // 四邻域扩散
        if (x > 0 && !visited[idx - 1] && distSq(data, oi - 4, sr, sg, sb) <= tolSq) {
          visited[idx - 1] = 1; queue[tail++] = idx - 1
        }
        if (x < width - 1 && !visited[idx + 1] && distSq(data, oi + 4, sr, sg, sb) <= tolSq) {
          visited[idx + 1] = 1; queue[tail++] = idx + 1
        }
        if (y > 0 && !visited[idx - width] && distSq(data, oi - width * 4, sr, sg, sb) <= tolSq) {
          visited[idx - width] = 1; queue[tail++] = idx - width
        }
        if (y < height - 1 && !visited[idx + width] && distSq(data, oi + width * 4, sr, sg, sb) <= tolSq) {
          visited[idx + width] = 1; queue[tail++] = idx + width
        }
      }
    }
  }

  // 边缘柔化：替换边界像素与原色做 1px 混合，降低锯齿
  if (soften.value) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        if (!mask[p]) continue
        let boundary = false
        if (x > 0 && !mask[p - 1]) boundary = true
        else if (x < width - 1 && !mask[p + 1]) boundary = true
        else if (y > 0 && !mask[p - width]) boundary = true
        else if (y < height - 1 && !mask[p + width]) boundary = true
        if (boundary) {
          const i = p * 4
          od[i] = Math.round(od[i] * 0.5 + data[i] * 0.5)
          od[i + 1] = Math.round(od[i + 1] * 0.5 + data[i + 1] * 0.5)
          od[i + 2] = Math.round(od[i + 2] * 0.5 + data[i + 2] * 0.5)
        }
      }
    }
  }

  processedData = out
  showOriginal.value = false
  redraw()
}

let processTimer = null
const scheduleProcess = () => {
  if (!imgData) return
  if (processTimer) clearTimeout(processTimer)
  processing.value = true
  processTimer = setTimeout(() => {
    try {
      processImage()
    } catch (err) {
      alert('处理失败，请尝试更小的图片')
    }
    processing.value = false
  }, 60)
}

watch([tolerance, mode, soften, replaceHex], () => {
  if (hasImage.value) scheduleProcess()
})

const resetProcess = () => {
  processedData = null
  seedPoint = null
  pickedFromClick.value = false
  showOriginal.value = true
  redraw()
}

const clearAll = () => {
  imgData = null
  processedData = null
  seedPoint = null
  imgWidth = 0
  imgHeight = 0
  hasImage.value = false
  fileName.value = ''
  imgInfo.value = ''
  pickedFromClick.value = false
  showOriginal.value = false
}

// ---------- 下载 ----------
const downloadResult = (type) => {
  if (!processedData) return
  try {
    const src = document.createElement('canvas')
    src.width = imgWidth
    src.height = imgHeight
    src.getContext('2d').putImageData(processedData, 0, 0)

    let exportCanvas = src
    if (type === 'jpeg') {
      // JPEG 无透明通道，铺白底合成
      exportCanvas = document.createElement('canvas')
      exportCanvas.width = imgWidth
      exportCanvas.height = imgHeight
      const ectx = exportCanvas.getContext('2d')
      ectx.fillStyle = '#ffffff'
      ectx.fillRect(0, 0, imgWidth, imgHeight)
      ectx.drawImage(src, 0, 0)
    }

    const url = exportCanvas.toDataURL(type === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92)
    const a = document.createElement('a')
    a.href = url
    a.download = `bg-replaced.${type === 'jpeg' ? 'jpg' : 'png'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    alert('导出失败，请重试')
  }
}
</script>
