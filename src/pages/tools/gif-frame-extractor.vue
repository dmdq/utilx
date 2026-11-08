<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Film class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GIF抽帧</h1>
          <p class="text-sm text-muted-foreground mt-1">解析 GIF 逐帧导出 PNG，查看帧数与每帧延时，纯本地解码不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 GIF 抽帧工具：拖入 .gif 文件，自研纯 JS 解码器在浏览器本地逐帧解析（支持全局/局部色表、LZW 解压、交织行还原、
        透明索引与 disposal 帧累积合成），给出帧数、尺寸、总时长、平均延时统计，帧网格展示每帧合成效果与延时；
        单帧可下载 PNG，全部帧可打包 ZIP 一次下载。所有数据只在本机处理，不上传服务器。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">纯本地解码</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">disposal 帧合成</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">帧延时明细</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">ZIP 批量导出</span>
      </div>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>每帧导出的是按 disposal 规则合成后的完整画布（与播放时所见一致），透明区域会保留 alpha 通道导出为透明 PNG。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左栏：输入与统计 -->
      <div class="space-y-6">
        <!-- 输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 选择 GIF 文件
          </h2>

          <div
            class="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            @drop="handleDrop"
            @dragover.prevent
            @dragleave.prevent
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".gif,image/gif"
              class="hidden"
              @change="handleFileSelect"
            />
            <Film class="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p class="text-sm font-medium mb-1">拖拽 .gif 文件到这里，或点击选择</p>
            <p class="text-xs text-muted-foreground">GIF 文件只在本机浏览器内解码，不会上传</p>
          </div>

          <div v-if="fileName" class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs">
            <Film class="w-4 h-4 text-primary flex-shrink-0" />
            <span class="font-medium text-foreground truncate">{{ fileName }}</span>
            <span class="text-muted-foreground flex-shrink-0">{{ formatBytes(fileSize) }}</span>
            <span v-if="gifResult" class="text-muted-foreground flex-shrink-0">循环：{{ loopText }}</span>
            <button @click="clearAll" class="ml-auto text-muted-foreground hover:text-red-500 transition" aria-label="移除文件">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>

          <div v-if="parseError" class="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg p-3">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ parseError }}</span>
          </div>
        </div>

        <!-- 统计卡 -->
        <div v-if="stats" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 解析统计
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ stats.frameCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">帧数</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ stats.sizeText }}</p>
              <p class="text-xs text-muted-foreground mt-1">画布尺寸 (px)</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-2xl font-bold text-primary font-mono tabular-nums">{{ stats.durationText }}</p>
              <p class="text-xs text-muted-foreground mt-1">总时长</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ stats.avgDelayText }}</p>
              <p class="text-xs text-muted-foreground mt-1">平均延时</p>
            </div>
          </div>
          <div class="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              @click="downloadAll"
              :disabled="isZipping"
              class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isZipping" class="w-4 h-4 inline mr-1.5 -mt-0.5 animate-spin" />
              <Archive v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {{ isZipping ? '打包中...' : `全部帧打包下载 ZIP（${frames.length} 帧）` }}
            </button>
          </div>
          <p class="mt-2 text-xs text-muted-foreground text-center">打包与单帧导出均为 PNG 格式，尺寸与 GIF 画布一致</p>
        </div>

        <!-- 空状态说明 -->
        <div v-if="!gifResult && !parseError" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 支持的 GIF 特性
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• GIF87a / GIF89a、全局与局部色表、LZW 变长码解压</li>
            <li>• 帧间 disposal 合成（0/1 保留、2 恢复背景、3 恢复上一帧），逐帧还原播放画面</li>
            <li>• 交织（interlaced）存储还原、透明索引、NETSCAPE 循环扩展识别</li>
            <li>• 解码完全在浏览器本地完成，无任何网络请求</li>
          </ul>
        </div>
      </div>

      <!-- 右栏：帧网格 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Grid3x3 class="w-5 h-5 mr-2 text-primary" /> 帧预览
            </h2>
            <span v-if="frames.length" class="text-xs text-muted-foreground">共 {{ frames.length }} 帧 · 点击角标下载单帧</span>
          </div>

          <div v-if="!frames.length" class="border border-dashed border-border rounded-lg min-h-48 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
            {{ parseError ? '解析失败，请更换文件' : '拖入 GIF 后逐帧显示在这里' }}
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto pr-1">
            <div
              v-for="(frame, index) in frames"
              :key="index"
              class="relative border border-border rounded-lg overflow-hidden bg-checkered"
            >
              <canvas
                :ref="(el) => onThumbRef(el, index)"
                class="w-full h-auto block"
                aria-label="帧缩略图"
              ></canvas>
              <span class="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">#{{ index + 1 }}</span>
              <span class="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{{ frame.delayMs }}ms</span>
              <button
                @click="downloadFrame(index)"
                class="absolute bottom-1 right-1 p-1.5 bg-black/70 hover:bg-primary text-white rounded transition"
                :aria-label="`下载第 ${index + 1} 帧 PNG`"
                title="下载该帧 PNG"
              >
                <Download class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> GIF抽帧是什么？逐帧导出、disposal 合成与常见问题
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          GIF抽帧把一张 GIF 动图拆解成一帧帧静态图片，并标出每帧的显示时长。GIF 文件内部并不存"完整的一帧接一帧"，
          而是大量使用差分帧：每一帧可能只记录画面中变化的一小块矩形，配合 disposal（处置方法）决定播放完这一帧后旧画面如何处理。
          本工具内置一套纯 JS 实现的 GIF 解码器，按浏览器播放的同一套规则把差分帧累积合成为完整画面再导出，
          保证抽出来的每一帧和你在播放器里看到的画面一致。
        </p>

        <h3 class="text-lg font-semibold text-foreground">功能介绍</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">逐帧解析</span>：解析 GIF87a/GIF89a、全局与局部色表、LZW 变长码压缩数据与交织行存储。</li>
          <li><span class="text-foreground font-medium">disposal 合成</span>：按处置方法 0/1（保留）、2（恢复背景）、3（恢复上一帧）逐帧累积，导出帧与播放画面一致。</li>
          <li><span class="text-foreground font-medium">统计信息</span>：帧数、画布尺寸、总时长与平均延时一目了然，并识别 NETSCAPE 循环次数。</li>
          <li><span class="text-foreground font-medium">帧网格预览</span>：每帧显示序号与延时（毫秒），透明区域以棋盘格标识。</li>
          <li><span class="text-foreground font-medium">单帧与批量导出</span>：单帧点击即存 PNG；全部帧自动打包 ZIP，文件名带帧序号。</li>
          <li><span class="text-foreground font-medium">纯本地解码</span>：自研解码器不依赖任何在线服务，GIF 文件与导出图片均不上传。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>表情包制作：把喜欢的 GIF 拆成静帧，挑出关键画面二次创作或做成静态表情。</li>
          <li>动效设计走查：从设计师交付的动效 GIF 中逐帧检查细节与节奏（每帧延时）。</li>
          <li>教学与教程：把演示动画拆成步骤图插入 PPT / 文档。</li>
          <li>数据分析与逆向：了解一个 GIF 的帧结构、循环设置与优化空间。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">为什么有的帧大部分是透明的？</h4>
            <p class="mt-1">
              这正是 GIF 差分帧的特性：该帧只刷新了一小块区域。本工具已经按 disposal 规则把它合成到前序画面之上，
              所以导出的 PNG 与播放画面一致；出现大面积透明通常说明源 GIF 本身使用了"恢复背景"的处置方法，
              透明区域在播放时露出的就是背景。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">帧延时 0ms 的帧是怎么回事？</h4>
            <p class="mt-1">
              GIF 的帧延时以 1/100 秒为单位存储，0 表示"尽快切下一帧"。多数播放器会把 0 或过短的延时按约 100ms 处理，
              本工具如实显示文件里记录的原始数值，方便你核对真实的帧节奏。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">为什么帧数和某些软件显示的不一样？</h4>
            <p class="mt-1">
              少数工具按"图像块"计数（一个 GIF 内可能包含多个图像块但逻辑上属于同一逻辑帧），或忽略没有图形控制扩展的帧。
              本工具按 GIF 规范把每个图像描述符计为一帧，与主流浏览器的播放帧序列一致。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">导出的 PNG 尺寸是多少？会丢透明吗？</h4>
            <p class="mt-1">
              每帧都按 GIF 的逻辑画布尺寸（即整个动图的宽高）导出，而不是只导出变化的小矩形；透明像素带 alpha 通道导出，
              不会被填充成白色或黑色。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">文件会上传服务器吗？</h4>
            <p class="mt-1">
              不会。解码使用页面内置的纯 JS 解码器在浏览器本地完成，导出与打包也都在本机进行，整个过程没有任何网络请求。
            </p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'gif-frame-extractor'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Film, Upload, Download, Info, AlertTriangle, Trash2, Loader2, Archive,
  BarChart3, Grid3x3
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { tools } from '~/data/tools'
import { parseGif } from '~/utils/gif-decoder'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find((t) => t.id === 'gif-frame-extractor')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SEO ----------
useSeoMeta({
  title: 'GIF抽帧 - 在线GIF逐帧分解导出PNG工具',
  description: '免费在线GIF抽帧工具：拖入GIF本地逐帧解码，查看帧数、尺寸、总时长与每帧延时，disposal 合成保证导出帧与播放画面一致，单帧下载PNG或全部帧打包ZIP，纯本地处理不上传',
  keywords: 'gif抽帧, gif分解, gif逐帧图片, gif拆帧, 动图导出png, gif帧延时',
  author: '有条工具',
  ogTitle: 'GIF抽帧 - 在线GIF逐帧分解导出PNG工具 | 有条工具',
  ogDescription: '本地逐帧解码 GIF，帧数/延时一目了然，单帧 PNG 或整包 ZIP 下载，不上传数据。',
  ogUrl: 'https://www.util.cn/tools/gif-frame-extractor',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'GIF抽帧',
          url: 'https://www.util.cn/tools/gif-frame-extractor',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['纯 JS 本地解码 GIF87a/GIF89a', 'LZW 解压与交织行还原', 'disposal 0/1/2/3 帧累积合成', '帧数/尺寸/总时长/平均延时统计', '帧网格预览带序号与延时', '单帧 PNG 下载', '全部帧 JSZip 打包下载', '数据不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image' },
            { '@type': 'ListItem', position: 3, name: 'GIF抽帧', item: 'https://www.util.cn/tools/gif-frame-extractor' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么有的帧大部分是透明的？',
              acceptedAnswer: { '@type': 'Answer', text: 'GIF 大量使用差分帧，某一帧可能只刷新一小块区域。工具已按 disposal 规则把差分帧累积合成到前序画面之上，导出帧与播放画面一致；大面积透明说明源 GIF 使用了恢复背景的处置方法。' }
            },
            {
              '@type': 'Question',
              name: '帧延时 0ms 的帧是怎么回事？',
              acceptedAnswer: { '@type': 'Answer', text: 'GIF 帧延时以 1/100 秒为单位，0 表示尽快切下一帧。多数播放器会把 0 或过短延时按约 100ms 处理，工具如实显示文件中记录的原始数值。' }
            },
            {
              '@type': 'Question',
              name: '导出的 PNG 尺寸是多少？会丢透明吗？',
              acceptedAnswer: { '@type': 'Answer', text: '每帧按 GIF 逻辑画布尺寸（整个动图宽高）导出，而非只导出变化的矩形；透明像素带 alpha 通道导出，不会填充白色或黑色。' }
            },
            {
              '@type': 'Question',
              name: '文件会上传服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解码由页面内置纯 JS 解码器在浏览器本地完成，导出与打包也都在本机进行，全程无网络请求。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 页面状态 ----------
const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const parseError = ref('')
const gifResult = ref(null)
const isZipping = ref(false)
const thumbCanvases = []

// ---------- 派生 ----------
const frames = computed(() => (gifResult.value ? gifResult.value.frames : []))

const loopText = computed(() => {
  if (!gifResult.value) return ''
  const n = gifResult.value.loopCount
  return n === 0 ? '无限循环' : `${n} 次`
})

const stats = computed(() => {
  const g = gifResult.value
  if (!g || !g.frames.length) return null
  const totalMs = g.frames.reduce((sum, f) => sum + (f.delayMs || 0), 0)
  const avgMs = Math.round(totalMs / g.frames.length)
  return {
    frameCount: g.frames.length,
    sizeText: `${g.width}×${g.height}`,
    durationText: totalMs < 1000 ? `${totalMs} ms` : `${(totalMs / 1000).toFixed(2)} s`,
    avgDelayText: `${avgMs} ms`
  }
})

// ---------- 纯展示格式化 ----------
function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return '0 B'
  if (n < 1024) return `${Math.round(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

// ---------- 输入处理（浏览器回调） ----------
function triggerFileInput() {
  fileInput.value && fileInput.value.click()
}

function handleFileSelect(e) {
  const file = e.target.files && e.target.files[0]
  if (file) loadGif(file)
  e.target.value = ''
}

function handleDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) loadGif(file)
}

function loadGif(file) {
  const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name)
  if (!isGif) {
    parseError.value = '请选择 .gif 文件'
    return
  }
  parseError.value = ''
  fileName.value = ''
  fileSize.value = 0
  gifResult.value = null
  thumbCanvases.length = 0

  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const result = parseGif(ev.target.result)
      fileName.value = file.name
      fileSize.value = file.size
      gifResult.value = result
    } catch (err) {
      parseError.value = 'GIF 解析失败：' + (err && err.message ? err.message : '文件可能已损坏')
    }
  }
  reader.onerror = () => {
    parseError.value = '读取文件失败，请重试'
  }
  reader.readAsArrayBuffer(file)
}

function clearAll() {
  fileName.value = ''
  fileSize.value = 0
  parseError.value = ''
  gifResult.value = null
  thumbCanvases.length = 0
}

// ---------- 帧网格绘制 ----------
function onThumbRef(el, index) {
  if (!el) return
  thumbCanvases[index] = el
  drawThumb(el, index)
}

function drawThumb(canvas, index) {
  const g = gifResult.value
  if (!g || !g.frames[index]) return
  const frame = g.frames[index]
  canvas.width = g.width
  canvas.height = g.height
  const ctx = canvas.getContext('2d')
  ctx.putImageData(new ImageData(frame.rgba, g.width, g.height), 0, 0)
}

// ---------- 导出 ----------
function frameToPngBlob(index) {
  const g = gifResult.value
  const frame = g && g.frames[index]
  if (!frame) return Promise.resolve(null)
  const canvas = document.createElement('canvas')
  canvas.width = g.width
  canvas.height = g.height
  const ctx = canvas.getContext('2d')
  ctx.putImageData(new ImageData(frame.rgba, g.width, g.height), 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('导出失败'))), 'image/png')
  })
}

function frameFileName(base, index) {
  const seq = String(index + 1).padStart(3, '0')
  return `${base}-frame-${seq}.png`
}

async function downloadFrame(index) {
  const base = String(fileName.value || 'gif').replace(/\.gif$/i, '') || 'gif'
  try {
    const blob = await frameToPngBlob(index)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = frameFileName(base, index)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    alert('导出失败：' + (err && err.message ? err.message : '未知错误'))
  }
}

async function downloadAll() {
  if (!frames.value.length) return
  isZipping.value = true
  try {
    const base = String(fileName.value || 'gif').replace(/\.gif$/i, '') || 'gif'
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (let i = 0; i < frames.value.length; i++) {
      const blob = await frameToPngBlob(i)
      if (blob) zip.file(frameFileName(base, i), blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}-frames.zip`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    alert('打包失败：' + (err && err.message ? err.message : '未知错误'))
  } finally {
    isZipping.value = false
  }
}

onUnmounted(() => {
  thumbCanvases.length = 0
})
</script>

<style scoped>
.bg-checkered {
  background-image:
    linear-gradient(45deg, rgba(128, 128, 128, 0.15) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(128, 128, 128, 0.15) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(128, 128, 128, 0.15) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(128, 128, 128, 0.15) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
</style>
