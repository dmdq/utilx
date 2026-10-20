<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Heart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">情侣头像切图</h1>
          <p class="text-sm text-muted-foreground mt-1">一张合照切成两张情侣头像，左右 / 上下 / 对角三种切法</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线情头制作：上传一张双人合照或方形图，选择左右对半、上下对半或斜对角线切割，
        每半可「补成正方」（居中裁方）或「补白边」（留白凑方），实时生成头像 A / B 并可分别下载 PNG，
        附带模拟聊天界面的配对预览。全部在浏览器 Canvas 本地裁切，图片不上传，隐私安全。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
          <ShieldCheck class="w-3.5 h-3.5" /> 本地裁切 · 不上传
        </span>
        <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">导出双 PNG</span>
        <span class="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium">配对预览</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：参数 -->
      <div class="lg:col-span-1 space-y-5">
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon class="w-4 h-4 text-primary" /> 合照素材（仅本地读取）
          </h3>
          <input ref="fileInputEl" type="file" accept="image/*" class="hidden" @change="handleFile" />
          <button
            @click="triggerUpload"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Upload class="w-4 h-4" /> 上传一张合照
          </button>
          <p v-if="srcName" class="text-xs text-muted-foreground truncate">已选择：{{ srcName }}（{{ srcSize }}）</p>
          <p v-if="srcIsSquare === false" class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
            提示：情头以方形效果最佳，当前 {{ srcSize }} 非方形，已默认「先居中裁方」再切分，可关闭查看原比例切法。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <Scissors class="w-4 h-4 text-primary" /> 切法
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="m in splitModes"
              :key="m.id"
              @click="splitMode = m.id"
              :class="splitMode === m.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >
              {{ m.name }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            对角切法用 Canvas 三角形裁剪，生成左上 / 右下两个三角头像，拼回时正好组成一张方图。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-foreground mb-2">非方块区域处理</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="fillMode = 'crop'"
                :class="fillMode === 'crop' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >
                补成正方（居中裁方）
              </button>
              <button
                @click="fillMode = 'pad'"
                :class="fillMode === 'pad' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >
                补白边（留白凑方）
              </button>
            </div>
          </div>
          <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input v-model="centerSquare" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
            先居中裁方再切（建议，适合非方形原图）
          </label>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">输出边长（px）</label>
            <input
              v-model.number="outputSize"
              type="number"
              min="64"
              max="1024"
              step="16"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1">微信头像建议 512；最大 1024</p>
          </div>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 space-y-4">
        <div v-if="!avatarA" class="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground min-h-[360px] flex flex-col items-center justify-center gap-3">
          <Heart class="w-10 h-10 opacity-30" />
          <p>上传一张合照，即可切成一对情侣头像</p>
          <p class="text-xs">方形合照效果最佳 · 全程本地处理不上传</p>
        </div>

        <template v-else>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-card border border-border rounded-xl p-4 text-center">
              <h3 class="text-sm font-semibold text-foreground mb-3">头像 A</h3>
              <img :src="avatarA" alt="情侣头像A" class="w-full max-w-[240px] mx-auto rounded-xl border border-border" />
              <button
                @click="downloadAvatar('A')"
                class="mt-3 w-full max-w-[240px] py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Download class="w-4 h-4" /> 下载头像 A（PNG）
              </button>
            </div>
            <div class="bg-card border border-border rounded-xl p-4 text-center">
              <h3 class="text-sm font-semibold text-foreground mb-3">头像 B</h3>
              <img :src="avatarB" alt="情侣头像B" class="w-full max-w-[240px] mx-auto rounded-xl border border-border" />
              <button
                @click="downloadAvatar('B')"
                class="mt-3 w-full max-w-[240px] py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Download class="w-4 h-4" /> 下载头像 B（PNG）
              </button>
            </div>
          </div>

          <!-- 配对预览（模拟聊天界面） -->
          <div class="bg-card border border-border rounded-xl p-5">
            <h3 class="text-sm font-semibold text-foreground mb-4">配对预览（模拟聊天界面）</h3>
            <div class="bg-muted/50 rounded-xl p-4 space-y-4">
              <div class="flex items-start gap-3">
                <img :src="avatarA" alt="对方头像" class="w-11 h-11 rounded-full object-cover border-2 border-white shadow" />
                <div class="bg-background border border-border rounded-2xl rounded-tl-md px-3.5 py-2 text-sm text-foreground max-w-[70%]">
                  我的新头像好看吗～
                </div>
              </div>
              <div class="flex items-start justify-end gap-3">
                <div class="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-3.5 py-2 text-sm max-w-[70%]">
                  咱俩的一对儿，刚好拼回来 ❤
                </div>
                <img :src="avatarB" alt="我方头像" class="w-11 h-11 rounded-full object-cover border-2 border-white shadow" />
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              圆框即微信 / QQ 头像的实际取景范围；对角切法时两人头像各保留一半三角，互相换上后聊天界面正好拼合。
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          情侣头像切图是什么？
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          情侣头像（情头）是一对相互呼应的头像，常见做法是找一张双人合照或构图对称的方图，
          从中间切成左右两半，两人各用一半——放在一起时画面又能完整拼回。
          本工具把这件事自动化：上传一张图，选切法（左右 / 上下 / 对角），
          Canvas 精确对半裁切并输出两张正方形 PNG，保证两半尺寸一致、像素无缝衔接，不会出现手动裁剪的错位。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用步骤
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>上传一张双人合照（正方形最佳，非方形会提示并可自动居中裁方）</li>
          <li>选择切法：左右对半、上下对半或对角线三角</li>
          <li>选择「补成正方」或「补白边」处理非方形块</li>
          <li>分别下载头像 A 与头像 B，发给对方各用一半</li>
          <li>用配对预览确认聊天界面里的拼合效果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          隐私承诺：合照为什么不需要上传？
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          合照往往是最不想外传的图片。本工具的裁切流程是：FileReader 读入浏览器内存 → Canvas 计算源矩形 / 三角路径 →
          本地生成两张 PNG 的 data URL 直接下载。整个过程零网络请求、零服务端存储，
          即便图片里只有你们两个人，也没有第三个「人」看过它。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">不是正方形的照片可以切吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以，但不推荐直接使用：横图左右对半会得到两块竖长方形。
              建议开启「先居中裁方再切」，两半都落在同一张正方取景框内，拼合关系最自然；
              或者上传前自行把合照修成方形。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">「补成正方」和「补白边」有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              补成正方是居中裁方：把非方形块按短边等比放大、居中截取成正方，画面铺满头像框但会裁掉长边部分内容；
              补白边是留白凑方：保留整块画面不裁内容，短边方向用白色填充成正方形，适合人物紧贴边缘、不希望再裁掉的场景。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">对角切出来的三角头像怎么用？</h3>
            <p class="text-muted-foreground mt-1">
              沿副对角线（右上到左下）把方图切成左上、右下两个三角，各占一半面积且互不重叠。
              两人分别换上后，在聊天界面并排看时两个三角正好想象拼回一张完整合照，比普通对半更有设计感。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <RelatedTools :currentToolId="'couple-avatar-splitter'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  Heart, Image as ImageIcon, Upload, Download, Scissors, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* === PURE-HELPERS-START ===
   以下为纯计算函数：不访问任何浏览器 API，可被 node 直接提取自测
   === PURE-HELPERS-START */
function splitCoords (w, h, mode) {
  if (mode === 'left') {
    const half = Math.floor(w / 2)
    return [
      { kind: 'rect', sx: 0, sy: 0, sw: half, sh: h },
      { kind: 'rect', sx: half, sy: 0, sw: w - half, sh: h }
    ]
  }
  if (mode === 'top') {
    const half = Math.floor(h / 2)
    return [
      { kind: 'rect', sx: 0, sy: 0, sw: w, sh: half },
      { kind: 'rect', sx: 0, sy: half, sw: w, sh: h - half }
    ]
  }
  if (mode === 'diag') {
    // 沿副对角线（右上→左下）切：左上三角 + 右下三角
    return [
      { kind: 'tri', bbox: { x: 0, y: 0, w, h }, points: [[0, 0], [w, 0], [0, h]] },
      { kind: 'tri', bbox: { x: 0, y: 0, w, h }, points: [[w, h], [0, h], [w, 0]] }
    ]
  }
  throw new Error('unknown split mode: ' + mode)
}

function squareCropRect (x, y, w, h) {
  const side = Math.min(w, h)
  return { sx: x + (w - side) / 2, sy: y + (h - side) / 2, sw: side, sh: side }
}

function containRect (bw, bh, box) {
  const scale = Math.min(box / Math.max(1, bw), box / Math.max(1, bh))
  const dw = Math.round(bw * scale)
  const dh = Math.round(bh * scale)
  return { dw, dh, ox: Math.round((box - dw) / 2), oy: Math.round((box - dh) / 2) }
}

function polyArea (pts) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    s += a[0] * b[1] - b[0] * a[1]
  }
  return Math.abs(s) / 2
}
/* === PURE-HELPERS-END === */

const splitModes = [
  { id: 'left', name: '左右对半' },
  { id: 'top', name: '上下对半' },
  { id: 'diag', name: '对角线' }
]

// ---------- 状态 ----------
const fileInputEl = ref(null)
const srcImg = ref(null) // HTMLImageElement，仅在事件回调内创建
const srcName = ref('')
const srcSize = ref('')
const srcIsSquare = ref(null)
const assetTick = ref(0)

const splitMode = ref('left')
const fillMode = ref('crop')
const centerSquare = ref(true)
const outputSize = ref(512)
const avatarA = ref('')
const avatarB = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 裁切基准图：非方形且开启裁方时，先在本地生成居中裁方的正方画布
let baseSource = null

const buildBaseSource = () => {
  const img = srcImg.value
  if (!img) { baseSource = null; return }
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (centerSquare.value && w !== h) {
    const side = Math.min(w, h)
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, side, side)
    }
    baseSource = { el: canvas, w: side, h: side }
  } else {
    baseSource = { el: img, w, h }
  }
}

const renderBlock = (block) => {
  const base = baseSource
  const size = Math.min(1024, Math.max(64, Math.round(outputSize.value) || 512))
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 补白边模式：白色底；裁方模式随后会被画面铺满
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  let srcX, srcY, srcW, srcH
  if (block.kind === 'rect') {
    srcX = block.sx; srcY = block.sy; srcW = block.sw; srcH = block.sh
  } else {
    srcX = block.bbox.x; srcY = block.bbox.y; srcW = block.bbox.w; srcH = block.bbox.h
  }

  let dest
  if (block.kind === 'rect' && fillMode.value === 'crop') {
    const q = squareCropRect(srcX, srcY, srcW, srcH)
    srcX = q.sx; srcY = q.sy; srcW = q.sw; srcH = q.sh
    dest = { ox: 0, oy: 0, dw: size, dh: size }
  } else if (block.kind === 'tri') {
    if (fillMode.value === 'crop') {
      dest = { ox: 0, oy: 0, dw: size, dh: size }
    } else {
      // 补白边：三角区域整体内缩，留出白边
      const c = containRect(srcW, srcH, size)
      const dw = Math.round(c.dw * 0.88)
      const dh = Math.round(c.dh * 0.88)
      dest = { ox: Math.round((size - dw) / 2), oy: Math.round((size - dh) / 2), dw, dh }
    }
  } else {
    dest = containRect(srcW, srcH, size)
  }

  ctx.save()
  if (block.kind === 'tri') {
    // Canvas clip 三角形（副对角线），顶点按目标矩形映射
    ctx.beginPath()
    block.points.forEach((p, i) => {
      const px = dest.ox + (p[0] / srcW) * dest.dw
      const py = dest.oy + (p[1] / srcH) * dest.dh
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.closePath()
    ctx.clip()
  }
  ctx.drawImage(base.el, srcX, srcY, srcW, srcH, dest.ox, dest.oy, dest.dw, dest.dh)
  ctx.restore()
  return canvas.toDataURL('image/png')
}

const processSplit = () => {
  const img = srcImg.value
  if (!img) {
    avatarA.value = ''
    avatarB.value = ''
    return
  }
  buildBaseSource()
  if (!baseSource) return
  const blocks = splitCoords(baseSource.w, baseSource.h, splitMode.value)
  avatarA.value = renderBlock(blocks[0])
  avatarB.value = renderBlock(blocks[1])
}

// ---------- 交互 ----------
const triggerUpload = () => {
  fileInputEl.value?.click()
}

const handleFile = (e) => {
  const input = e.target
  const file = input.files && input.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      srcImg.value = img
      srcName.value = file.name
      srcSize.value = `${img.naturalWidth}×${img.naturalHeight}`
      srcIsSquare.value = img.naturalWidth === img.naturalHeight
      assetTick.value++
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const downloadAvatar = (which) => {
  const dataUrl = which === 'A' ? avatarA.value : avatarB.value
  if (!dataUrl) return
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `couple-avatar-${which}.png`
  a.click()
}

watch(
  [assetTick, splitMode, fillMode, centerSquare, outputSize],
  () => { processSplit() }
)

// ---------- SEO ----------
useSeoMeta({
  title: '情侣头像切图 - 一张合照切成一对情头',
  description: '免费在线情侣头像切图工具，上传一张合照按左右/上下/对角线切成两张正方形头像PNG，支持补成正方或补白边，配对预览模拟聊天界面拼合效果，Canvas本地裁切图片不上传。',
  keywords: '情侣头像制作,情头切图,合照分割,头像一对,对角头像,情侣头像生成,情头配对',
  author: '有条工具',
  ogTitle: '情侣头像切图 - 一张合照切一对头像',
  ogDescription: '左右/上下/对角三种切法，本地裁切导出双PNG，不上传。',
  ogUrl: 'https://www.util.cn/tools/couple-avatar-splitter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '情侣头像切图',
          url: 'https://www.util.cn/tools/couple-avatar-splitter',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['左右/上下/对角三种切法', '补成正方或补白边', '双PNG分别下载', '聊天界面配对预览', '本地Canvas裁切不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '情侣头像切图', item: 'https://www.util.cn/tools/couple-avatar-splitter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '不是正方形的照片可以切吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，但建议开启「先居中裁方再切」，让两半落在同一张正方取景框内，拼合关系最自然。' }
            },
            {
              '@type': 'Question',
              name: '补成正方和补白边有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '补成正方按短边居中裁掉长边内容铺满头像框；补白边保留整块画面、短边方向留白凑成正方形。' }
            },
            {
              '@type': 'Question',
              name: '合照会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。图片仅在浏览器内存中经Canvas裁切生成本地PNG，全程零网络请求、零服务端存储。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'couple-avatar-splitter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})
</script>
