<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scissors class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">朋友圈长图分割</h1>
          <p class="text-sm text-muted-foreground mt-1">超长截图按份数或高度切条，智能避字不拦腰切内容</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把超长聊天记录、游记、攻略截图切成多条再发朋友圈：支持按份数均分（2-9 条）、按目标高度切分（1080 / 1350px 适配屏幕比例），以及智能避字模式——扫描候选切割带的每行像素方差，挑近似纯色的空行下刀，避免把文字拦腰切断。全程本地 Canvas 处理，图片不上传。
      </p>
      <!-- 隐私提示 -->
      <div class="mt-4 bg-card border border-border rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-muted-foreground leading-relaxed">
          隐私保障：长图仅在浏览器内读取、扫描与切分，聊天记录等敏感截图不上传、不保存，导出 PNG 原像素无损。
        </p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Crop class="w-5 h-5 mr-2 text-primary" /> 上传与切分设置
        </h2>

        <!-- 上传区 -->
        <label class="block cursor-pointer">
          <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
          <div class="border-2 border-dashed border-border rounded-lg p-5 text-center hover:bg-accent/50 transition-colors">
            <Upload class="w-7 h-7 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm text-foreground font-medium">点击上传长图</p>
            <p class="text-xs text-muted-foreground mt-1">长截图、聊天记录、游记攻略均可</p>
          </div>
        </label>

        <div v-if="imgName" class="text-xs text-muted-foreground break-all bg-muted/60 rounded-lg p-3">
          <p>文件：{{ imgName }}</p>
          <p class="mt-1">尺寸：{{ imgW }} × {{ imgH }} px</p>
          <button
            @click="resetTool"
            class="mt-2 text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw class="w-3 h-3" /> 重新选择图片
          </button>
        </div>

        <!-- 切分模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">切分模式</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              @click="setMode('count')"
              :class="mode === 'count' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >按份数</button>
            <button
              @click="setMode('height')"
              :class="mode === 'height' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >按目标高度</button>
            <button
              @click="setMode('smart')"
              :class="mode === 'smart' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >智能避字</button>
          </div>
        </div>

        <!-- 按份数 -->
        <div v-if="mode === 'count'">
          <label class="block text-sm font-medium text-foreground mb-2">切成分数（2-9）</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="n in countOptions"
              :key="n"
              @click="setParts(n)"
              :class="parts === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ n }} 条</button>
          </div>
        </div>

        <!-- 按目标高度 -->
        <div v-if="mode === 'height'">
          <label class="block text-sm font-medium text-foreground mb-2">目标高度（px）</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="setTargetH(1080)"
              :class="targetH === 1080 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >1080 px</button>
            <button
              @click="setTargetH(1350)"
              :class="targetH === 1350 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >1350 px</button>
          </div>
          <input
            v-model.number="targetH"
            type="number"
            min="200"
            step="10"
            class="w-full mt-2 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            @change="process"
          />
          <p class="text-xs text-muted-foreground mt-1.5">1080 适合一屏看全，1350 适合朋友圈 3:4 展示；尾段过短会自动并入上一条</p>
        </div>

        <!-- 智能避字 -->
        <div v-if="mode === 'smart'">
          <label class="block text-sm font-medium text-foreground mb-2">切成分数（2-9）</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="n in countOptions"
              :key="n"
              @click="setSmartParts(n)"
              :class="smartParts === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ n }} 条</button>
          </div>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            以均分位置为候选，在附近扫描每行像素方差，选择最接近纯色空白的行切割，尽量避免拦腰切断文字。
          </p>
        </div>

        <button
          v-if="imgName"
          @click="process"
          :disabled="busy"
          class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Scissors class="w-4 h-4" /> {{ busy ? '正在切分…' : '开始切分' }}
        </button>
      </div>

      <!-- 输出 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Check class="w-5 h-5 mr-2 text-primary" /> 切分结果
          </h2>
          <button
            v-if="slices.length > 0"
            @click="downloadAll"
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Download class="w-4 h-4" /> 逐张下载（{{ slices.length }} 张）
          </button>
        </div>

        <div v-if="slices.length > 0">
          <p class="text-xs text-muted-foreground mb-3">
            原图 {{ imgW }} × {{ imgH }} px，共切成 {{ slices.length }} 条，按 part-1 至 part-{{ slices.length }} 编号，逐张按顺序发布即可。
          </p>
          <div class="space-y-4 max-h-[720px] overflow-y-auto pr-1">
            <div
              v-for="(s, i) in slices"
              :key="s.url"
              class="border border-border rounded-lg overflow-hidden bg-muted"
            >
              <div class="flex items-center justify-between px-3 py-2 bg-muted/80">
                <span class="text-xs font-medium text-foreground">第 {{ i + 1 }} 条 · {{ s.w }} × {{ s.h }} px</span>
                <button
                  @click="downloadSlice(i)"
                  class="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Download class="w-3.5 h-3.5" /> 下载 {{ s.name }}
                </button>
              </div>
              <img :src="s.url" :alt="'第' + (i + 1) + '条'" class="w-full max-h-80 object-contain" />
            </div>
          </div>
        </div>

        <div v-else-if="busy" class="py-16 text-center text-muted-foreground">正在切分…</div>

        <div v-else-if="errorMsg" class="py-16 text-center text-red-500 text-sm">{{ errorMsg }}</div>

        <div v-else class="py-16 text-center text-muted-foreground">
          <Scissors class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p class="text-sm">上传长图并选择切分模式，各条预览会显示在这里</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于长图分割</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            朋友圈单图最高约 1350px，超长聊天记录与游记截图直接发会被压成看不清的「蚂蚁线」。把长图切成多条、每条接近一屏高度依次发布，是保留可读性的通用做法。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种切分模式怎么选</h3>
          <p>
            按份数：指定 2-9 条均分，适合对条数有要求的场景；按目标高度：指定 1080 或 1350px，每条接近一屏，阅读体验最连贯；智能避字：先按份数均分，再在每条候选切割位置附近扫描像素方差，选最接近纯色的空行下刀，适合聊天记录等文字密集截图。
          </p>
          <h3 class="text-lg font-semibold text-foreground">智能避字的原理</h3>
          <p>
            工具把长图降采样后在内存中扫描，逐行计算灰度方差：文字行的像素明暗差异大、方差高，空白背景行方差极低。在均分切点附近一定范围内找方差最低的连续带作为切点，就能最大限度避开文字，且整个过程不发起任何网络请求。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么切点会避开文字？</span>智能模式扫描每行像素方差，优先在近似纯色的空白行切割，文字行方差高会被自动跳过。</li>
            <li><span class="text-foreground font-medium">支持多长的图片？</span>常规数千乃至上万像素的长图均可处理；扫描时自动降采样保证流畅，切分仍按原始像素输出，不缩放不压缩。</li>
            <li><span class="text-foreground font-medium">切出的图片会变糊吗？</span>不会。每条按原始像素通过 Canvas 无损导出 PNG，与原图同清晰度。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'long-image-splitter'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  Scissors, Upload, Download, ShieldCheck, ChevronUp, ChevronDown,
  Check, Crop, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '朋友圈长图分割 - 长截图切条工具',
  description: '在线长图分割工具，超长截图按份数（2-9）或目标高度（1080/1350px）切条，智能避字模式扫描空白行切割避免拦腰切字，PNG 无损逐张导出，本地处理不上传',
  keywords: '长图分割, 长截图切割, 朋友圈长图, 图片切条, 智能避字, 聊天记录截图分割',
  author: 'Util工具箱',
  ogTitle: '朋友圈长图分割 - 有条工具',
  ogDescription: '长图按份数或高度切条，扫描空白行智能避字，批量导出',
  ogUrl: 'https://www.util.cn/tools/long-image-splitter',
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
          name: '朋友圈长图分割',
          url: 'https://www.util.cn/tools/long-image-splitter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按份数 2-9 均分', '按目标高度 1080/1350px', '智能避字切割', '逐行方差扫描', 'PNG 无损导出', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '朋友圈长图分割', item: 'https://www.util.cn/tools/long-image-splitter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么切点会避开文字？',
              acceptedAnswer: { '@type': 'Answer', text: '智能模式扫描每行像素方差，优先在近似纯色的空白行切割，文字行方差高会被自动跳过。' }
            },
            {
              '@type': 'Question',
              name: '支持多长的图片？',
              acceptedAnswer: { '@type': 'Answer', text: '数千乃至上万像素的长图均可处理，扫描自动降采样，切分按原始像素输出。' }
            },
            {
              '@type': 'Question',
              name: '切出的图片会变糊吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。每条按原始像素通过 Canvas 无损导出 PNG，与原图同清晰度。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'long-image-splitter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数：切点计算与低方差带查找 ----------
// 均分切点：totalHeight 分成 parts 份，返回 parts-1 个内部切点
function splitPoints(totalHeight, parts) {
  const pts = []
  for (let i = 1; i < parts; i++) {
    pts.push(Math.round((totalHeight * i) / parts))
  }
  return pts
}

// 按目标高度切点：每 targetH 一个切点，尾段不足 minPart 时并入上一条
function splitByTargetHeight(totalHeight, targetH, minPart) {
  if (minPart === undefined) minPart = 150
  const pts = []
  let y = targetH
  while (y < totalHeight) {
    if (totalHeight - y < minPart) break
    pts.push(y)
    y += targetH
  }
  return pts
}

// 滑动窗口查找每行方差和最低的连续带，返回该带起始行号
function findLowestVarianceBand(rows, bandHeight) {
  const n = rows.length
  if (n === 0) return 0
  if (bandHeight >= n) return 0
  let sum = 0
  for (let i = 0; i < bandHeight; i++) sum += rows[i]
  let bestStart = 0
  let bestSum = sum
  for (let start = 1; start + bandHeight <= n; start++) {
    sum += rows[start + bandHeight - 1] - rows[start - 1]
    if (sum < bestSum) {
      bestSum = sum
      bestStart = start
    }
  }
  return bestStart
}

// 把候选切点调整到各自搜索窗内方差最低的带，并保证切点间最小间距
function adjustCutPoints(basePoints, variances, searchRange, bandHeight, minGap) {
  const sorted = basePoints.slice().sort(function (a, b) { return a - b })
  const adjusted = []
  const n = variances.length
  for (let i = 0; i < sorted.length; i++) {
    const base = sorted[i]
    const lo = Math.max(0, base - searchRange)
    const hi = Math.min(n - 1, base + searchRange)
    let cut = base
    if (hi - lo + 1 > bandHeight) {
      const localBest = findLowestVarianceBand(variances.slice(lo, hi + 1), bandHeight)
      cut = lo + localBest
    }
    const prev = adjusted.length > 0 ? adjusted[adjusted.length - 1] : 0
    if (cut - prev < minGap) cut = base
    adjusted.push(cut)
  }
  return adjusted
}

// 逐行灰度方差（data 为 ImageData.data）
function computeRowVariances(data, width, height) {
  const variances = new Array(height)
  for (let y = 0; y < height; y++) {
    let sum = 0
    let sumSq = 0
    const offset = y * width * 4
    for (let x = 0; x < width; x++) {
      const p = offset + x * 4
      const g = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
      sum += g
      sumSq += g * g
    }
    const mean = sum / width
    variances[y] = sumSq / width - mean * mean
  }
  return variances
}

function canvasToBlob(canvas, type, qualityValue) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, qualityValue)
  })
}

// ---------- 状态 ----------
const mode = ref('count') // count | height | smart
const countOptions = [2, 3, 4, 5, 6, 7, 8, 9]
const parts = ref(3)
const smartParts = ref(3)
const targetH = ref(1080)
const imageEl = ref(null)
const imgName = ref('')
const imgW = ref(0)
const imgH = ref(0)
const slices = ref([])
const busy = ref(false)
const errorMsg = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 用户交互回调 ----------
const onFileChange = (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      imageEl.value = img
      imgName.value = file.name
      imgW.value = img.naturalWidth
      imgH.value = img.naturalHeight
      process()
    }
    img.onerror = () => {
      errorMsg.value = '图片加载失败，请换一张图片试试'
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const setMode = (m) => {
  mode.value = m
  if (imageEl.value) process()
}

const setParts = (n) => {
  parts.value = n
  if (imageEl.value) process()
}

const setSmartParts = (n) => {
  smartParts.value = n
  if (imageEl.value) process()
}

const setTargetH = (v) => {
  targetH.value = v
  if (imageEl.value) process()
}

// ---------- 智能避字：降采样扫描每行方差，把均分切点调到最低方差带 ----------
const smartAdjustCuts = (img, w, h, baseCuts) => {
  const scanW = 200
  const scanH = Math.max(2, Math.min(4000, Math.round((h * scanW) / w)))
  const scale = h / scanH
  const scanCanvas = document.createElement('canvas')
  scanCanvas.width = scanW
  scanCanvas.height = scanH
  const sctx = scanCanvas.getContext('2d')
  sctx.drawImage(img, 0, 0, scanW, scanH)
  const data = sctx.getImageData(0, 0, scanW, scanH).data
  const variances = computeRowVariances(data, scanW, scanH)

  const bandHeight = Math.max(2, Math.round(16 / scale))
  const searchRange = Math.max(bandHeight, Math.round(60 / scale))
  const minGap = Math.max(1, Math.round(100 / scale))
  const scaledBase = baseCuts.map((p) => Math.max(1, Math.min(scanH - 1, Math.round(p / scale))))
  const adjusted = adjustCutPoints(scaledBase, variances, searchRange, bandHeight, minGap)
  return adjusted.map((s) => Math.max(1, Math.min(h - 1, Math.round(s * scale))))
}

// ---------- 切分（用户交互后执行） ----------
const process = async () => {
  const img = imageEl.value
  if (!img) return
  busy.value = true
  errorMsg.value = ''
  slices.value.forEach((s) => URL.revokeObjectURL(s.url))

  const w = img.naturalWidth
  const h = img.naturalHeight

  let cuts = []
  if (mode.value === 'height') {
    cuts = splitByTargetHeight(h, Math.max(200, targetH.value || 1080), 150)
  } else {
    const p = Math.min(9, Math.max(2, mode.value === 'smart' ? smartParts.value : parts.value))
    cuts = splitPoints(h, p)
    if (mode.value === 'smart') {
      cuts = smartAdjustCuts(img, w, h, cuts)
    }
  }

  const bounds = [0].concat(cuts, [h])
  const results = []
  for (let i = 0; i < bounds.length - 1; i++) {
    const top = bounds[i]
    const ph = bounds[i + 1] - top
    if (ph <= 0) continue
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = ph
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, top, w, ph, 0, 0, w, ph)
    const blob = await canvasToBlob(canvas, 'image/png')
    if (blob) {
      results.push({
        url: URL.createObjectURL(blob),
        name: 'part-' + (results.length + 1) + '.png',
        w,
        h: ph
      })
    }
  }
  slices.value = results
  busy.value = false
}

// ---------- 下载 ----------
const downloadBlob = (url, name) => {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const downloadSlice = (i) => {
  const s = slices.value[i]
  if (s) downloadBlob(s.url, s.name)
}

const downloadAll = () => {
  slices.value.forEach((s, i) => {
    setTimeout(() => downloadBlob(s.url, s.name), i * 300)
  })
}

const resetTool = () => {
  slices.value.forEach((s) => URL.revokeObjectURL(s.url))
  slices.value = []
  imageEl.value = null
  imgName.value = ''
  imgW.value = 0
  imgH.value = 0
  errorMsg.value = ''
}

onBeforeUnmount(() => {
  slices.value.forEach((s) => URL.revokeObjectURL(s.url))
})
</script>
