<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Smartphone class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">带壳截图生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">把 App 截图套进手机设备边框，一键合成宣传样机图</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线带壳截图工具：上传 App 截图，选择 iPhone / 安卓 / iPad 等程序化矢量机型边框，
        自定义边框颜色、背景渐变、屏幕圆角与边距，Canvas 本地合成并导出高清 PNG。
        全程在浏览器内完成，图片不上传服务器，隐私安全。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
          <ShieldCheck class="w-3.5 h-3.5" /> 图片不上传 · 纯本地处理
        </span>
        <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">免费 · 无需注册</span>
        <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">矢量边框 · 导出 PNG</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：参数面板 -->
      <div class="lg:col-span-1 space-y-5">
        <!-- 上传截图 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon class="w-4 h-4 text-primary" /> 截图素材（本地读取，不上传）
          </h3>
          <input ref="fileInputEl" type="file" accept="image/*" class="hidden" @change="handleFile" />
          <button
            @click="triggerUpload"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Upload class="w-4 h-4" /> 上传 App 截图
          </button>
          <p v-if="shotName" class="text-xs text-muted-foreground truncate">已选择：{{ shotName }}（{{ shotSize }}）</p>
          <p v-if="shotPortrait === false" class="text-xs text-amber-600 dark:text-amber-400">
            提示：当前为横屏比例截图，放入竖屏机型会上下留边（letterbox），建议使用竖屏截图。
          </p>
          <button
            v-if="shotName"
            @click="clearShot"
            class="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            移除截图
          </button>
        </div>

        <!-- 机型边框 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">机型边框</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="dev in deviceTemplates"
              :key="dev.id"
              @click="deviceId = dev.id"
              :class="deviceId === dev.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 px-2 rounded-lg text-xs font-medium transition-all"
            >
              {{ dev.name }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            边框为 Canvas 矢量绘制（圆角描边 + 灵动岛/孔位），非素材图片，任意输出尺寸都清晰。
          </p>
        </div>

        <!-- 边框颜色 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">边框颜色</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in framePresets"
              :key="preset.id"
              @click="framePreset = preset.id"
              :class="framePreset === preset.id
                ? 'ring-2 ring-primary'
                : 'hover:ring-1 hover:ring-border'"
              class="flex flex-col items-center gap-1 py-2 rounded-lg bg-muted transition-all"
            >
              <span v-if="preset.color" class="w-6 h-6 rounded-full border border-border" :style="{ background: preset.color }" />
              <span v-else class="w-6 h-6 rounded-full border border-border rainbow-swatch" />
              <span class="text-xs text-foreground">{{ preset.name }}</span>
            </button>
          </div>
          <div v-if="framePreset === 'custom'" class="flex items-center gap-2">
            <input v-model="customFrame" type="color" class="w-10 h-8 rounded border border-border bg-muted cursor-pointer" />
            <span class="text-xs text-muted-foreground font-mono">{{ customFrame }}</span>
          </div>
        </div>

        <!-- 背景 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-foreground">背景</h3>
            <div class="flex rounded-lg overflow-hidden border border-border text-xs">
              <button
                @click="bgType = 'solid'"
                :class="bgType === 'solid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
                class="px-2.5 py-1"
              >纯色</button>
              <button
                @click="bgType = 'gradient'"
                :class="bgType === 'gradient' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
                class="px-2.5 py-1"
              >渐变</button>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="(bg, i) in bgPresets"
              :key="bg.name"
              @click="bgPresetIndex = i"
              :class="bgPresetIndex === i ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'"
              class="h-8 rounded-lg border border-border transition-all"
              :style="{ background: bgType === 'gradient' ? `linear-gradient(135deg, ${bg.from}, ${bg.to})` : bg.from }"
              :title="bg.name"
            />
          </div>
        </div>

        <!-- 尺寸参数 -->
        <div class="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">
              屏幕圆角：<span class="text-primary">{{ screenRadius }}</span>
            </label>
            <input v-model.number="screenRadius" type="range" min="0" max="100" class="w-full accent-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">
              四周留白：<span class="text-primary">{{ margin }} px</span>
            </label>
            <input v-model.number="margin" type="range" min="0" max="300" class="w-full accent-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">输出宽度（px）</label>
            <input
              v-model.number="outputWidth"
              type="number"
              min="480"
              max="3200"
              step="10"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1">常用：1080（社媒）/ 1242（App Store）</p>
          </div>
        </div>

        <button
          @click="exportPng"
          class="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Download class="w-4 h-4" /> 导出 PNG
        </button>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-foreground">实时预览（本地合成，未上传）</h3>
          <span class="text-xs text-muted-foreground">{{ previewHint }}</span>
        </div>
        <div class="bg-card border border-border rounded-xl p-4 flex items-center justify-center min-h-[420px]">
          <canvas
            ref="canvasEl"
            class="w-full h-auto max-w-3xl rounded-lg shadow-sm"
          />
        </div>
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
          什么是带壳截图？
        </h2>
        <p class="text-muted-foreground mb-4">
          带壳截图（Device Mockup）是把 App 或网页截图放入手机、平板等设备边框中合成的展示图，
          常用于应用商店上架图、产品发布公告、融资 BP、社交媒体推广等场景。
          相比直接贴一张裸截图，带壳效果更有产品感和真实感。
          本工具的手机边框全部由 Canvas 矢量绘制（圆角描边、灵动岛、居中孔位、Home 圈），
          不依赖任何外部素材图片，输出多大尺寸都保持锐利。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          生成步骤
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>上传一张 App 截图（建议竖屏比例，如 1170×2532、1080×2400）</li>
          <li>选择机型边框：iPhone 灵动岛 / 安卓居中孔 / iPad 宽边框 / 经典 Home 键</li>
          <li>调整边框颜色、背景纯色或渐变色板</li>
          <li>微调屏幕圆角、四周留白与输出宽度</li>
          <li>点击「导出 PNG」保存到本地</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          隐私说明：图片为什么不上传？
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          很多在线样机工具会把你的截图上传到服务器再返回结果，未发布的界面截图存在泄露风险。
          本工具读取图片后只在浏览器的 Canvas 中完成裁切、圆角与合成，所有像素都不经过网络，
          断网也能正常使用，导出同样是浏览器本地生成，对设计师和产品经理的内部物料尤其重要。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">我的截图会被上传到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。图片通过 FileReader 读入内存后，直接在浏览器 Canvas 里完成缩放、圆角裁切和边框合成，
              全程不发送任何请求到服务器，这是本站所有图片工具的统一承诺。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">横屏截图放进竖屏机型会变形吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会变形。屏幕内容按等比 contain 方式适配：截图完整显示并居中，比例不一致时上下或左右自动留边
              （letterbox），留边区域为黑色屏幕底色，观感类似视频信箱模式。建议竖屏 App 使用竖屏截图以获得满屏效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">导出什么尺寸适合上架 App Store？</h3>
            <p class="text-muted-foreground mt-1">
              App Store 展示素材常用 1242×2688 或 1284×2778，社媒配图常用 1080 宽。
              把输出宽度设为对应值即可，高度按所选机型的屏幕比例自动推算；边框与圆角按宽度等比缩放，放大输出不会模糊。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <RelatedTools :currentToolId="'device-mockup-generator'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Smartphone, Image as ImageIcon, Upload, Download, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* === PURE-HELPERS-START ===
   以下为纯计算函数：不访问任何浏览器 API，可被 node 直接提取自测
   === PURE-HELPERS-START */
function fitScreen (imgW, imgH, screenW, screenH) {
  if (!(imgW > 0) || !(imgH > 0) || !(screenW > 0) || !(screenH > 0)) {
    return { scale: 0, drawW: 0, drawH: 0, offsetX: 0, offsetY: 0, letterX: 0, letterY: 0 }
  }
  const scale = Math.min(screenW / imgW, screenH / imgH)
  const drawW = Math.round(imgW * scale)
  const drawH = Math.round(imgH * scale)
  return {
    scale,
    drawW,
    drawH,
    offsetX: Math.round((screenW - drawW) / 2),
    offsetY: Math.round((screenH - drawH) / 2),
    letterX: screenW - drawW,
    letterY: screenH - drawH
  }
}

function roundRectPoints (x, y, w, h, r) {
  const rw = Math.max(1, w)
  const rh = Math.max(1, h)
  const rr = Math.max(0, Math.min(r, Math.min(rw, rh) / 2))
  return {
    r: rr,
    points: [
      [x + rr, y], [x + rw - rr, y],
      [x + rw, y + rr], [x + rw, y + rh - rr],
      [x + rw - rr, y + rh], [x + rr, y + rh],
      [x, y + rh - rr], [x, y + rr]
    ]
  }
}

function clamp (v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}
/* === PURE-HELPERS-END === */

// 机型模板：屏幕像素比例 + 边框厚度占比（相对机身宽/高）+ 刘海类型
const deviceTemplates = [
  { id: 'iphone', name: 'iPhone（灵动岛）', screenW: 1179, screenH: 2556, bezelX: 0.045, bezelY: 0.048, bodyRadius: 0.165, notch: 'island' },
  { id: 'android', name: '安卓全面屏（居中孔）', screenW: 1080, screenH: 2400, bezelX: 0.036, bezelY: 0.038, bodyRadius: 0.10, notch: 'punch' },
  { id: 'ipad', name: 'iPad（均匀宽边）', screenW: 1668, screenH: 2226, bezelX: 0.072, bezelY: 0.085, bodyRadius: 0.055, notch: 'none' },
  { id: 'classic', name: 'iPhone 经典（Home 圈）', screenW: 750, screenH: 1334, bezelX: 0.058, bezelY: 0.135, bodyRadius: 0.085, notch: 'home' }
]

const framePresets = [
  { id: 'dark', name: '深空黑', color: '#1f2937' },
  { id: 'silver', name: '银色', color: '#cbd5e1' },
  { id: 'custom', name: '自定义', color: null }
]

const bgPresets = [
  { name: '暮紫', from: '#c7d2fe', to: '#818cf8' },
  { name: '薄荷', from: '#a7f3d0', to: '#5eead4' },
  { name: '蜜桃', from: '#fed7aa', to: '#fdba74' },
  { name: '天空', from: '#bae6fd', to: '#93c5fd' },
  { name: '浅灰', from: '#e5e7eb', to: '#d1d5db' },
  { name: '深海', from: '#1e3a8a', to: '#312e81' },
  { name: '樱粉', from: '#fbcfe8', to: '#f9a8d4' },
  { name: '纯白', from: '#ffffff', to: '#f1f5f9' }
]

// ---------- 状态 ----------
const canvasEl = ref(null)
const fileInputEl = ref(null)

const shotImg = ref(null) // HTMLImageElement，仅在事件回调内创建
const shotName = ref('')
const shotSize = ref('')
const shotPortrait = ref(null)
const assetTick = ref(0)

const deviceId = ref('iphone')
const framePreset = ref('dark')
const customFrame = ref('#374151')
const bgType = ref('gradient')
const bgPresetIndex = ref(0)
const screenRadius = ref(32)
const margin = ref(80)
const outputWidth = ref(1080)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentDevice = computed(() =>
  deviceTemplates.find(d => d.id === deviceId.value) || deviceTemplates[0]
)

const currentFrameColor = computed(() => {
  const preset = framePresets.find(p => p.id === framePreset.value)
  if (preset && preset.color) return preset.color
  return customFrame.value || '#374151'
})

const previewHint = computed(() => {
  const canvas = canvasEl.value
  if (canvas && canvas.width > 0) return `${canvas.width} × ${canvas.height} px`
  return '实时渲染'
})

// ---------- 绘制 ----------
const traceRoundRect = (ctx, x, y, w, h, r) => {
  const rr = roundRectPoints(x, y, w, h, r).r
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.arcTo(x + w, y, x + w, y + rr, rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctx.lineTo(x + rr, y + h)
  ctx.arcTo(x, y + h, x, y + h - rr, rr)
  ctx.lineTo(x, y + rr)
  ctx.arcTo(x, y, x + rr, y, rr)
  ctx.closePath()
}

const drawMockup = () => {
  const canvas = canvasEl.value
  if (!canvas) return
  const dev = currentDevice.value
  const outW = clamp(Math.round(outputWidth.value) || 1080, 480, 3200)
  const mg = clamp(Math.round(margin.value), 0, Math.max(0, outW / 2 - 80))

  // 机身：屏幕宽占机身 (1 - 2*bezelX)，屏幕比例 = screenW/screenH
  const bodyW = outW - mg * 2
  const screenFracW = 1 - dev.bezelX * 2
  const screenFracH = 1 - dev.bezelY * 2
  const screenAspect = dev.screenW / dev.screenH
  const bodyH = (bodyW * screenFracW / screenAspect) / screenFracH
  const canvasH = Math.round(bodyH + mg * 2)

  canvas.width = outW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. 背景
  const bg = bgPresets[bgPresetIndex.value] || bgPresets[0]
  if (bgType.value === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, outW * 0.35, canvasH)
    grad.addColorStop(0, bg.from)
    grad.addColorStop(1, bg.to)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = bg.from
  }
  ctx.fillRect(0, 0, outW, canvasH)

  // 2. 机身（阴影 + 填充描边）
  const bodyX = mg
  const bodyY = mg
  const bodyRadius = bodyW * dev.bodyRadius
  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.35)'
  ctx.shadowBlur = bodyW * 0.05
  ctx.shadowOffsetY = bodyW * 0.018
  traceRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, bodyRadius)
  ctx.fillStyle = currentFrameColor.value
  ctx.fill()
  ctx.restore()

  ctx.lineWidth = Math.max(1, bodyW * 0.002)
  traceRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, bodyRadius)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)'
  ctx.stroke()
  traceRoundRect(ctx, bodyX + ctx.lineWidth, bodyY + ctx.lineWidth, bodyW - ctx.lineWidth * 2, bodyH - ctx.lineWidth * 2, bodyRadius)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.stroke()

  // 3. 屏幕区域
  const sw = bodyW * screenFracW
  const sh = sw / screenAspect
  const sx = bodyX + (bodyW - sw) / 2
  const sy = bodyY + (bodyH - sh) / 2
  const screenR = clamp(screenRadius.value, 0, 100) * (sw / 360)

  ctx.save()
  traceRoundRect(ctx, sx, sy, sw, sh, screenR)
  ctx.clip()
  ctx.fillStyle = '#0a0a0c'
  ctx.fillRect(sx, sy, sw, sh)

  const img = shotImg.value
  if (img) {
    const fit = fitScreen(img.naturalWidth, img.naturalHeight, sw, sh)
    ctx.drawImage(img, sx + fit.offsetX, sy + fit.offsetY, fit.drawW, fit.drawH)
  } else {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)'
    ctx.font = `500 ${Math.max(12, sw * 0.055)}px "PingFang SC", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('请上传截图', sx + sw / 2, sy + sh / 2)
  }

  // 屏幕玻璃微高光
  const gloss = ctx.createLinearGradient(sx, sy, sx + sw * 0.6, sy + sh * 0.5)
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.07)')
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gloss
  ctx.fillRect(sx, sy, sw, sh)

  // 4. 刘海：灵动岛 / 居中孔（绘制在屏幕内顶层）
  if (dev.notch === 'island') {
    const iw = sw * 0.30
    const ih = Math.max(8, sh * 0.028)
    traceRoundRect(ctx, sx + (sw - iw) / 2, sy + sh * 0.016, iw, ih, ih / 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(sx + (sw + iw) / 2 - ih * 0.42, sy + sh * 0.016 + ih / 2, ih * 0.16, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.fill()
  } else if (dev.notch === 'punch') {
    const pr = Math.max(4, sw * 0.028)
    ctx.beginPath()
    ctx.arc(sx + sw / 2, sy + sh * 0.035, pr, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.lineWidth = Math.max(1, pr * 0.12)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.stroke()
  }
  ctx.restore()

  // 5. 机身细节：Home 圈 / 顶部摄像头点
  if (dev.notch === 'home') {
    const bezelBottom = (bodyH - sh) / 2
    const hr = bezelBottom * 0.62
    ctx.beginPath()
    ctx.arc(bodyX + bodyW / 2, sy + sh + bezelBottom, hr, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)'
    ctx.lineWidth = Math.max(1.5, hr * 0.1)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(bodyX + bodyW / 2, sy + sh + bezelBottom, hr, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = Math.max(1, hr * 0.06)
    ctx.stroke()
  } else if (dev.notch === 'none') {
    const bezelTop = (bodyH - sh) / 2
    ctx.beginPath()
    ctx.arc(bodyX + bodyW / 2, sy - bezelTop / 2, Math.max(2, bodyW * 0.006), 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
    ctx.fill()
  }
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
      shotImg.value = img
      shotName.value = file.name
      shotSize.value = `${img.naturalWidth}×${img.naturalHeight}`
      shotPortrait.value = img.naturalHeight >= img.naturalWidth
      assetTick.value++
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const clearShot = () => {
  shotImg.value = null
  shotName.value = ''
  shotSize.value = ''
  shotPortrait.value = null
  assetTick.value++
}

const exportPng = () => {
  const canvas = canvasEl.value
  if (!canvas) return
  drawMockup()
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mockup-${deviceId.value}-${canvas.width}x${canvas.height}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

// 参数变化实时重绘（watch 回调只在浏览器运行，不使用 immediate）
watch(
  [deviceId, framePreset, customFrame, bgType, bgPresetIndex, screenRadius, margin, outputWidth, assetTick],
  () => { drawMockup() }
)

onMounted(() => {
  drawMockup()
})

// ---------- SEO ----------
useSeoMeta({
  title: '带壳截图生成器 - 手机样机边框截图合成工具',
  description: '免费在线带壳截图工具，把App截图套进iPhone/安卓/iPad设备边框，矢量绘制机型、自定义边框颜色与背景渐变，Canvas纯本地合成导出高清PNG，图片不上传保护隐私。',
  keywords: '带壳截图,手机样机生成,mockup在线,截图套边框,app宣传图,设备边框截图,灵动岛截图,截图美化工具',
  author: '有条工具',
  ogTitle: '带壳截图生成器 - 截图秒变设备宣传图',
  ogDescription: '截图套进手机/平板边框，矢量机型模板本地合成，导出高清PNG，不上传。',
  ogUrl: 'https://www.util.cn/tools/device-mockup-generator',
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
          name: '带壳截图生成器',
          url: 'https://www.util.cn/tools/device-mockup-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['矢量机型边框', 'iPhone灵动岛/安卓孔位/iPad边框', '边框颜色自定义', '纯色与渐变背景', '屏幕圆角与留白调节', '本地Canvas合成导出PNG', '图片不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '带壳截图生成器', item: 'https://www.util.cn/tools/device-mockup-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '我的截图会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。图片读入浏览器内存后在Canvas中本地合成，全程不发送到服务器，断网也能使用。' }
            },
            {
              '@type': 'Question',
              name: '横屏截图放进竖屏机型会变形吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。截图按等比contain适配居中显示，比例不一致时上下留边（letterbox），建议优先使用竖屏截图。' }
            },
            {
              '@type': 'Question',
              name: '导出什么尺寸适合上架App Store？',
              acceptedAnswer: { '@type': 'Answer', text: '常用1242×2688或1284×2778，社媒可用1080宽；输出宽度可自定义，高度按机型屏幕比例自动推算。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'device-mockup-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})
</script>

<style scoped>
.rainbow-swatch {
  background: conic-gradient(#ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444);
}
</style>
