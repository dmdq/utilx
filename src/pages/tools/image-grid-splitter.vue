<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">九宫格切图</h1>
          <p class="text-sm text-muted-foreground mt-1">一张图切 3×3 九张，按朋友圈发布顺序编号，逐张下载</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传一张图片，按 2×2、3×3 或 4×4 网格切分，可选圆形裁切模式，输出按朋友圈发布顺序（从左到右、从上到下）编号的 grid-1 至 grid-16，逐张下载后按编号发图即可拼出完整大图。全程在浏览器本地 Canvas 切图，图片不会上传到任何服务器。
      </p>
      <!-- 隐私提示 -->
      <div class="mt-4 bg-card border border-border rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-muted-foreground leading-relaxed">
          隐私保障：图片全程在你的浏览器内完成读取、切分与导出，不上传、不保存、无水印，关闭页面后即全部清除。
        </p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入与设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 上传与设置
        </h2>

        <!-- 上传区 -->
        <label class="block cursor-pointer">
          <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
          <div class="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
            <Upload class="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm text-foreground font-medium">点击选择图片</p>
            <p class="text-xs text-muted-foreground mt-1">支持 JPG / PNG / WebP 等常见格式</p>
          </div>
        </label>

        <p v-if="imgName" class="text-xs text-muted-foreground break-all">
          当前图片：{{ imgName }}（{{ imgW }} × {{ imgH }} px）
        </p>

        <!-- 网格选择 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">网格规格</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="n in gridOptions"
              :key="n"
              @click="setGrid(n)"
              :class="gridSize === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ n }} × {{ n }}</button>
          </div>
        </div>

        <!-- 圆形模式 -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-foreground">圆形模式</span>
          <button
            @click="toggleCircle"
            :class="circleMode ? 'bg-primary' : 'bg-muted'"
            class="relative w-11 h-6 rounded-full transition-colors"
            aria-label="切换圆形模式"
          >
            <span
              :class="circleMode ? 'translate-x-5' : 'translate-x-0.5'"
              class="absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
            ></span>
          </button>
        </div>
        <p class="text-xs text-muted-foreground -mt-3">开启后每格裁成圆形，导出为带透明背景的 PNG</p>

        <!-- 导出格式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">导出格式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="setFormat('png')"
              :class="effectiveFormat === 'png' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >PNG</button>
            <button
              @click="setFormat('jpeg')"
              :disabled="circleMode"
              :class="[
                effectiveFormat === 'jpeg' && !circleMode ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                circleMode ? 'opacity-40 cursor-not-allowed' : ''
              ]"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >JPEG</button>
          </div>
          <p v-if="circleMode" class="text-xs text-muted-foreground mt-1.5">圆形模式已自动切换为 PNG（保留透明圆角）</p>
        </div>

        <!-- 质量 -->
        <div v-if="effectiveFormat === 'jpeg'">
          <label class="block text-sm font-medium text-foreground mb-2">
            导出质量：<span class="text-primary">{{ Math.round(quality * 100) }}%</span>
          </label>
          <input
            v-model.number="quality"
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            class="w-full accent-primary"
            @change="onQualityChange"
          />
        </div>

        <button
          v-if="imgName"
          @click="resetTool"
          class="w-full py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-4 h-4" /> 重新选择图片
        </button>
      </div>

      <!-- 输出预览 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Check class="w-5 h-5 mr-2 text-primary" /> 切图预览
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
          <div
            class="grid gap-2"
            :style="{ gridTemplateColumns: 'repeat(' + gridSize + ', minmax(0, 1fr))' }"
          >
            <div
              v-for="(s, i) in slices"
              :key="s.url"
              class="relative group border border-border rounded-lg overflow-hidden bg-muted"
            >
              <img :src="s.url" :alt="'第' + (i + 1) + '格'" class="w-full h-full aspect-square object-cover" />
              <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs font-medium">{{ i + 1 }}</span>
              <button
                @click="downloadSlice(i)"
                class="absolute bottom-1 right-1 p-1.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
                :title="'下载 ' + s.name"
              >
                <Download class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">
            编号即朋友圈发布顺序：从左到右、从上到下依次发图，拼出完整 {{ gridSize }}×{{ gridSize }} 宫格。
          </p>
        </div>

        <div v-else-if="busy" class="py-16 text-center text-muted-foreground">正在切图…</div>

        <div v-else-if="errorMsg" class="py-16 text-center text-red-500 text-sm">{{ errorMsg }}</div>

        <div v-else class="py-16 text-center text-muted-foreground">
          <LayoutGrid class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p class="text-sm">先在左侧上传一张图片，切图结果会按发布顺序编号显示在这里</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于九宫格切图</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            九宫格切图是把一张完整图片按网格切成多张小图，发布到朋友圈、微博等九宫格相册后，好友在相册页看到的是被拆开的碎片，点开单张则是完整画面——一种简单又有仪式感的社交玩法。
          </p>
          <h3 class="text-lg font-semibold text-foreground">什么是九宫格切图</h3>
          <p>
            朋友圈相册以 3×3 宫格展示，九张图恰好铺满一屏。把一张图按 3×3 等分切开后按顺序发布，相册缩略图会呈现出「被打碎又拼合」的视觉效果；也可以选择 2×2、4×4 等规格适配不同平台与构图需求。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何使用本工具</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>点击左侧上传区选择一张图片，工具会自动完成切图</li>
            <li>按需切换 2×2 / 3×3 / 4×4 网格、圆形模式与导出格式</li>
            <li>点击「逐张下载」，按 grid-1 至 grid-9 的编号依次保存</li>
            <li>发朋友圈时严格按编号顺序选图，即可拼出完整大图</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">切图会损失画质吗？</span>切分直接在原始像素上进行，不缩放、不重压缩；选择 PNG 格式为无损导出，选择 JPEG 时可自行调节质量滑条。</li>
            <li><span class="text-foreground font-medium">我的图片会被上传吗？</span>不会。切图全部通过浏览器本地 Canvas 完成，图片不经过任何网络请求，关闭页面后自动清除。</li>
            <li><span class="text-foreground font-medium">非正方形图片可以切吗？</span>可以，工具按图片实际宽高等分切割；若希望每格都是正方形（朋友圈展示更整齐），建议先裁剪为正方形再切。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'image-grid-splitter'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  LayoutGrid, Upload, Download, RefreshCw, ShieldCheck,
  ChevronUp, ChevronDown, Check, Image as ImageIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '九宫格切图 - 朋友圈切九张图工具',
  description: '在线九宫格切图工具，一张图切 3×3 九张按朋友圈发布顺序编号，支持 2×2/4×4 网格与圆形模式，PNG/JPEG 本地导出，图片不上传',
  keywords: '九宫格切图, 朋友圈切九张, 图片切九格, 九宫格图片, 切图工具, 一图九切',
  author: 'Util工具箱',
  ogTitle: '九宫格切图 - 有条工具',
  ogDescription: '一张图切 3×3 九张按发布顺序编号，本地切图不上传',
  ogUrl: 'https://www.util.cn/tools/image-grid-splitter',
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
          name: '九宫格切图',
          url: 'https://www.util.cn/tools/image-grid-splitter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['3×3 九宫格切图', '2×2/4×4 网格可选', '圆形裁切模式', 'PNG/JPEG 导出', '按发布顺序编号', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '九宫格切图', item: 'https://www.util.cn/tools/image-grid-splitter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '切图会损失画质吗？',
              acceptedAnswer: { '@type': 'Answer', 'text': '切分直接在原始像素上进行，不缩放不重压缩，PNG 为无损导出，JPEG 可自行调节质量。' }
            },
            {
              '@type': 'Question',
              name: '我的图片会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。切图全部通过浏览器本地 Canvas 完成，图片不经过任何网络请求。' }
            },
            {
              '@type': 'Question',
              name: '非正方形图片可以切吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，工具按图片实际宽高等分切割，想让每格都是正方形建议先裁剪为正方形。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'image-grid-splitter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数：按行列计算每格矩形 [x, y, w, h] ----------
function gridRects(w, h, rows, cols) {
  const cellW = Math.floor(w / cols)
  const cellH = Math.floor(h / rows)
  const rects = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push([c * cellW, r * cellH, cellW, cellH])
    }
  }
  return rects
}

function canvasToBlob(canvas, type, qualityValue) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, qualityValue)
  })
}

// ---------- 状态 ----------
const gridOptions = [2, 3, 4]
const imageEl = ref(null)
const imgName = ref('')
const imgW = ref(0)
const imgH = ref(0)
const gridSize = ref(3)
const circleMode = ref(false)
const format = ref('png')
const quality = ref(0.92)
const slices = ref([])
const busy = ref(false)
const errorMsg = ref('')
const seoContentVisible = ref(true)

const effectiveFormat = computed(() => (circleMode.value ? 'png' : format.value))

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
      regenerate()
    }
    img.onerror = () => {
      errorMsg.value = '图片加载失败，请换一张图片试试'
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const setGrid = (n) => {
  gridSize.value = n
  if (imageEl.value) regenerate()
}

const toggleCircle = () => {
  circleMode.value = !circleMode.value
  if (imageEl.value) regenerate()
}

const setFormat = (f) => {
  format.value = f
  if (imageEl.value) regenerate()
}

const onQualityChange = () => {
  if (imageEl.value) regenerate()
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

// ---------- 切图（仅在用户交互后执行，浏览器 API 不进入 setup 顶层） ----------
const regenerate = async () => {
  const img = imageEl.value
  if (!img) return
  busy.value = true
  errorMsg.value = ''
  slices.value.forEach((s) => URL.revokeObjectURL(s.url))

  const rects = gridRects(img.naturalWidth, img.naturalHeight, gridSize.value, gridSize.value)
  const type = effectiveFormat.value === 'jpeg' ? 'image/jpeg' : 'image/png'
  const ext = type === 'image/png' ? 'png' : 'jpg'

  const results = []
  for (let i = 0; i < rects.length; i++) {
    const x = rects[i][0]
    const y = rects[i][1]
    const w = rects[i][2]
    const h = rects[i][3]
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    if (circleMode.value) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
      ctx.restore()
    } else {
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
    }
    const blob = await canvasToBlob(canvas, type, quality.value)
    if (blob) {
      results.push({ url: URL.createObjectURL(blob), name: 'grid-' + (i + 1) + '.' + ext })
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

onBeforeUnmount(() => {
  slices.value.forEach((s) => URL.revokeObjectURL(s.url))
})
</script>
