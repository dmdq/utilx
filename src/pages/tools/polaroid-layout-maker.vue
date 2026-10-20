<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileImage class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">拍立得排版</h1>
          <p class="text-sm text-muted-foreground mt-1">把照片排成拍立得相纸墙：白框 + 手写配文 + 错落投影，导出打印长图</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        批量上传照片（非方形会自动中心裁方），设置每行张数、白边比例、底边加厚、配文、背景色与随机微旋转，用 Canvas 逐张画出拍立得相纸并拼成一张长图导出 PNG。单张排版同样支持。全部在浏览器本地完成，照片不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传 + 设置 -->
      <div class="space-y-6">
        <!-- 上传 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 批量上传
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="handleFileChange" />
            <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入多张照片（建议方形）</p>
          </div>

          <!-- 缩略图与配文 -->
          <div v-if="photos.length > 0" class="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-for="(p, idx) in photos"
              :key="p.id"
              class="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
            >
              <span class="text-xs text-muted-foreground w-5 text-center font-mono">{{ idx + 1 }}</span>
              <img :src="p.url" :alt="p.name" class="w-11 h-11 object-cover rounded flex-shrink-0" />
              <input
                v-model="p.caption"
                @input="renderCollage"
                type="text"
                :placeholder="`第 ${idx + 1} 张配文（可留空）`"
                class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-input rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button @click="removePhoto(p.id)" class="text-destructive hover:text-destructive/80 flex-shrink-0" aria-label="删除">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-xs text-muted-foreground">共 {{ photos.length }} 张</span>
              <button @click="shuffleAngles" class="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Shuffle class="w-3.5 h-3.5" /> 重新打乱角度
              </button>
            </div>
          </div>
        </div>

        <!-- 排版设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> 排版设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">每行张数</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="n in [1, 2, 3]"
                :key="n"
                @click="setPerRow(n)"
                :class="perRow === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >
                {{ n }} 张
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">白边比例</label>
              <input v-model.number="borderRatio" @input="renderCollage" type="range" min="0.03" max="0.14" step="0.005" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(borderRatio * 100) }}%</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">照片尺寸</label>
              <input v-model.number="photoSide" @input="renderCollage" type="range" min="280" max="800" step="20" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ photoSide }} px</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">相纸间距</label>
              <input v-model.number="gap" @input="renderCollage" type="range" min="20" max="120" step="5" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ gap }} px</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">背景颜色</label>
              <input v-model="bgColor" @input="renderCollage" type="color" class="w-full h-9 rounded cursor-pointer bg-background border border-input" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <label class="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg cursor-pointer">
              <input v-model="bottomDouble" @change="renderCollage" type="checkbox" class="w-4 h-4 rounded accent-primary" />
              <span class="text-sm text-foreground">底边加厚</span>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg cursor-pointer">
              <input v-model="showShadow" @change="renderCollage" type="checkbox" class="w-4 h-4 rounded accent-primary" />
              <span class="text-sm text-foreground">投影</span>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg cursor-pointer">
              <input v-model="rotationEnabled" @change="onRotationToggle" type="checkbox" class="w-4 h-4 rounded accent-primary" />
              <span class="text-sm text-foreground">随机微旋转</span>
            </label>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            相纸色默认纯白，可在下方「纸纹/相纸色」微调；开启随机微旋转后每张 ±3° 错落摆放，投影用同层矩形近似。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-sm font-semibold text-foreground flex items-center">
            <Palette class="w-4 h-4 mr-2 text-primary" /> 纸纹 / 相纸色
          </h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-muted-foreground mb-1">相纸白边</label>
              <input v-model="paperColor" @input="renderCollage" type="color" class="w-full h-9 rounded cursor-pointer bg-background border border-input" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground mb-1">配文字色</label>
              <input v-model="captionColor" @input="renderCollage" type="color" class="w-full h-9 rounded cursor-pointer bg-background border border-input" />
            </div>
          </div>
          <button
            @click="downloadResult"
            :disabled="photos.length === 0 || processing"
            class="w-full mt-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ processing ? '导出中...' : '导出长图 PNG' }}
          </button>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 拍立得墙预览
            </h2>
            <span class="text-xs text-muted-foreground">{{ previewHint }}</span>
          </div>
          <div class="flex items-center justify-center rounded-lg overflow-auto max-h-[640px] border border-border" :style="{ backgroundColor: bgColor }">
            <canvas v-show="photos.length > 0" ref="previewCanvas" class="max-w-full" />
            <div v-if="photos.length === 0" class="text-center text-muted-foreground py-16">
              <FileImage class="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p class="text-sm">上传照片后这里显示拍立得排版</p>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于拍立得排版</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            拍立得（即时成像相纸）标志性的视觉语言是：厚白边、底部留白写一句手写体配文、微微倾斜错落叠放、边缘带一层淡投影。把这些照片排成一面相纸墙导出成长图，无论是贴手账、打印装订，还是发朋友圈九宫格，都特别有生活感和纪念感。
          </p>
          <h3 class="text-lg font-semibold text-foreground">排版的关键参数</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">每行张数</span>：1 张做竖排手账长条，2–3 张做规整的相纸墙。</li>
            <li><span class="text-foreground font-medium">白边比例与底边加厚</span>：白边按照片尺寸缩放；开启底边加厚后底框显著加宽，正好容纳手写配文。</li>
            <li><span class="text-foreground font-medium">随机微旋转与投影</span>：每张随机 ±3° 制造随意感，投影用同层偏移矩形近似，营造叠放厚度。</li>
            <li><span class="text-foreground font-medium">背景色与相纸色</span>：背景可选牛皮纸色或深色，相纸保持纯白最还原胶片质感。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">非方形照片怎么办</h3>
          <p>工具会把每张图沿中心裁成正方形再放进相纸，因此风景横图、人像竖图都能统一成一致的拍立得画面；想要完整保留主体时，建议先自己裁成正方再上传。</p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">能导出很高画质吗？</span>能。照片尺寸可调到 800px 一格，导出为无损 PNG，适合打印。</li>
            <li><span class="text-foreground font-medium">配文用的什么字体？</span>优先用系统里的楷体（Kaiti / STKaiti）营造手写感，缺失时回退到系统字体，不额外加载网络字体。</li>
            <li><span class="text-foreground font-medium">照片安全吗？</span>安全，解码与合成全在浏览器本地 Canvas 完成，不上传任何数据。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'polaroid-layout-maker'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileImage, ImageIcon, Upload, X, Shuffle, LayoutGrid, Palette,
  Eye, Download, Loader2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- 纯函数（可脱离浏览器单测） ----------
// 网格布局：返回每张相片的 [row, col]
const gridLayout = (count, perRow) => {
  const cells = []
  const cols = Math.max(1, Math.floor(perRow || 1))
  const n = Math.max(0, Math.floor(count))
  for (let i = 0; i < n; i++) {
    cells.push([Math.floor(i / cols), i % cols])
  }
  return cells
}

// 拍立得相纸尺寸：白边按 photoW*borderRatio，底边可选加厚
const polaroidRect = (photoW, borderRatio = 0.08, bottomDouble = true) => {
  const side = Math.max(1, photoW)
  const border = side * borderRatio
  const bottomBorder = bottomDouble ? border * 2.4 : border
  const frameW = side + border * 2
  const frameH = side + border + bottomBorder
  return {
    side,
    border,
    bottomBorder,
    frameW,
    frameH,
    photoX: border,
    photoY: border,
    photoW: side,
    photoH: side
  }
}

// 中心裁方：源图 → 正方形裁切矩形
const squareCrop = (srcW, srcH) => {
  const s = Math.min(srcW, srcH)
  return { sx: (srcW - s) / 2, sy: (srcH - s) / 2, sw: s, sh: s }
}

// ---------- SEO ----------
useSeoMeta({
  title: '拍立得排版 - 照片白框相纸墙排版导出长图',
  description: '在线拍立得排版工具，批量照片自动中心裁方，加拍立得白边、底边加厚、手写体配文、随机微旋转与投影，排成相纸墙长图导出PNG，支持单张与1-3张每行，适合手账打印，纯本地Canvas合成',
  keywords: '拍立得排版, 拍立得相纸, 照片白框, 照片墙长图, 手账素材, 复古照片排版, 照片配文, 即时成像',
  author: 'Util工具箱',
  ogTitle: '拍立得排版 - 有条工具',
  ogDescription: '照片排成拍立得相纸墙（白框+投影+手写配文），导出长图适合打印手账',
  ogUrl: 'https://www.util.cn/tools/polaroid-layout-maker',
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
          name: '拍立得排版',
          url: 'https://www.util.cn/tools/polaroid-layout-maker',
          applicationCategory: 'PhotographyApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['批量自动裁方', '拍立得白边与底边加厚', '手写体配文', '随机微旋转与投影', '长图PNG导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '拍立得排版', item: 'https://www.util.cn/tools/polaroid-layout-maker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '非方形的照片会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '工具会自动沿中心把每张图裁成正方形再放进相纸，横图竖图都能统一成一致的拍立得画面。' }
            },
            {
              '@type': 'Question',
              name: '配文用什么字体？',
              acceptedAnswer: { '@type': 'Answer', text: '优先使用系统楷体（Kaiti/STKaiti）营造手写感，缺失时回退到系统字体，不加载网络字体。' }
            },
            {
              '@type': 'Question',
              name: '照片会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，解码与合成全部在浏览器本地 Canvas 完成，关闭页面不留任何数据。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'polaroid-layout-maker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const fileInput = ref(null)
const previewCanvas = ref(null)

// 每项：{ id, name, url, img, w, h, caption, angle }
const photos = ref([])
const isDragging = ref(false)
const processing = ref(false)

const perRow = ref(2)
const borderRatio = ref(0.07)
const photoSide = ref(520)
const gap = ref(60)
const bgColor = ref('#e9e2d0')
const paperColor = ref('#ffffff')
const captionColor = ref('#4b4b4b')

const bottomDouble = ref(true)
const showShadow = ref(true)
const rotationEnabled = ref(true)

const seoContentVisible = ref(true)

const randomAngle = () => (Math.random() * 6 - 3)

const previewHint = computed(() => {
  if (photos.value.length === 0) return '未添加照片'
  const cols = Math.min(perRow.value, photos.value.length)
  const rows = Math.ceil(photos.value.length / perRow.value)
  return `${rows} 行 × ${cols} 列`
})

const setPerRow = (n) => { perRow.value = n; renderCollage() }
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const onRotationToggle = () => {
  if (rotationEnabled.value) shuffleAngles()
  else { photos.value.forEach(p => { p.angle = 0 }); renderCollage() }
}
// Math.random 仅在此点击/回调内使用
const shuffleAngles = () => {
  photos.value.forEach(p => { p.angle = rotationEnabled.value ? randomAngle() : 0 })
  renderCollage()
}

// ---------- 上传（浏览器 API 仅在回调内） ----------
const triggerFileSelect = () => fileInput.value?.click()
const handleFileChange = (e) => {
  const files = Array.from(e.target.files || [])
  addFiles(files)
  e.target.value = ''
}
const handleDrop = (e) => {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer?.files || []))
}

const addFiles = (files) => {
  files.forEach((f) => {
    if (!f.type.startsWith('image/')) return
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      photos.value.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        url,
        img,
        w: img.naturalWidth,
        h: img.naturalHeight,
        caption: '',
        angle: rotationEnabled.value ? randomAngle() : 0
      })
      renderCollage()
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  })
}

const removePhoto = (id) => {
  const i = photos.value.findIndex(p => p.id === id)
  if (i >= 0) {
    URL.revokeObjectURL(photos.value[i].url)
    photos.value.splice(i, 1)
    renderCollage()
  }
}

// ---------- 绘制单张相纸 ----------
const drawPolaroid = (ctx, p, rect, cx, cy) => {
  const { frameW, frameH, border, bottomBorder, photoW } = rect
  const angle = p.angle || 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((angle * Math.PI) / 180)

  // 投影：同层矩形近似（相对帧偏移）
  if (showShadow.value) {
    const off = Math.max(3, photoW * 0.02)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(-frameW / 2 + off, -frameH / 2 + off, frameW, frameH)
  }

  // 白框相纸
  ctx.fillStyle = paperColor.value
  ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH)

  // 照片（中心裁方）
  const crop = squareCrop(p.w, p.h)
  ctx.save()
  ctx.beginPath()
  ctx.rect(-frameW / 2 + border, -frameH / 2 + border, photoW, photoW)
  ctx.clip()
  ctx.drawImage(p.img, crop.sx, crop.sy, crop.sw, crop.sh, -frameW / 2 + border, -frameH / 2 + border, photoW, photoW)
  ctx.restore()

  // 配文（底边区，楷体手写感，自动缩字适配）
  const text = (p.caption || '').trim()
  if (text) {
    const capCenterY = frameH / 2 - bottomBorder / 2
    let fontPx = Math.max(12, Math.round(bottomBorder * 0.34))
    ctx.font = `italic ${fontPx}px "Kaiti SC", "STKaiti", "KaiTi", "楷体", cursive`
    ctx.fillStyle = captionColor.value
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // 过宽则缩字号
    let maxW = photoW * 0.98
    while (ctx.measureText(text).width > maxW && fontPx > 11) {
      fontPx -= 1
      ctx.font = `italic ${fontPx}px "Kaiti SC", "STKaiti", "KaiTi", "楷体", cursive`
    }
    ctx.fillText(text, 0, capCenterY, maxW)
  }

  ctx.restore()
}

// ---------- 合成长图到画布 ----------
const computeCanvas = () => {
  const count = photos.value.length
  if (count === 0) return null
  const rect = polaroidRect(photoSide.value, borderRatio.value, bottomDouble.value)
  const cols = Math.min(perRow.value, count)
  const rows = Math.ceil(count / perRow.value)
  const margin = gap.value
  const width = Math.round(margin * 2 + cols * rect.frameW + (cols - 1) * gap.value)
  const height = Math.round(margin * 2 + rows * rect.frameH + (rows - 1) * gap.value)
  return { count, rect, cols, rows, margin, width, height }
}

const paint = (canvas) => {
  const geo = computeCanvas()
  if (!geo) return
  canvas.width = geo.width
  canvas.height = geo.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const cells = gridLayout(geo.count, perRow.value)
  cells.forEach(([r, c], idx) => {
    const p = photos.value[idx]
    if (!p) return
    const cx = geo.margin + geo.rect.frameW / 2 + c * (geo.rect.frameW + gap.value)
    const cy = geo.margin + geo.rect.frameH / 2 + r * (geo.rect.frameH + gap.value)
    drawPolaroid(ctx, p, geo.rect, cx, cy)
  })
}

const renderCollage = () => {
  const canvas = previewCanvas.value
  if (!canvas || photos.value.length === 0) return
  paint(canvas)
}

// ---------- 导出 ----------
const downloadResult = () => {
  if (photos.value.length === 0) return
  processing.value = true
  const canvas = document.createElement('canvas')
  paint(canvas)
  canvas.toBlob((blob) => {
    processing.value = false
    if (!blob) { alert('导出失败'); return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `polaroid-${photos.value.length}张-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}
</script>
