<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">像素化工具</h1>
      <p class="text-muted-foreground">将图片像素化，创建复古像素艺术或马赛克效果</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和设置 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传图片</h2>
          <button @click="resetSettings" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">重置</button>
        </div>

        <div
          v-if="!imageUrl"
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="hidden"
          >
          <Upload class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">拖拽图片到此处</p>
          <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            选择文件
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- 像素化模式 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">像素化模式</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="pixelateMode = 'block'"
                :class="['p-2 rounded text-xs transition-colors', pixelateMode === 'block' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                块状像素
              </button>
              <button
                @click="pixelateMode = 'dot'"
                :class="['p-2 rounded text-xs transition-colors', pixelateMode === 'dot' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                点状马赛克
              </button>
              <button
                @click="pixelateMode = 'cross'"
                :class="['p-2 rounded text-xs transition-colors', pixelateMode === 'cross' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                十字像素
              </button>
            </div>
          </div>

          <!-- 像素大小 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex justify-between text-sm mb-2">
              <label>像素大小</label>
              <span class="text-muted-foreground">{{ pixelSize }}px</span>
            </div>
            <input
              v-model.number="pixelSize"
              type="range"
              min="2"
              max="50"
              @input="updatePreview"
              class="w-full"
            >
            <div class="flex gap-2 mt-2">
              <button @click="pixelSize = 4" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">超细 (4px)</button>
              <button @click="pixelSize = 8" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">细 (8px)</button>
              <button @click="pixelSize = 16" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">中 (16px)</button>
              <button @click="pixelSize = 32" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">粗 (32px)</button>
            </div>
          </div>

          <!-- 形状设置 -->
          <div v-if="pixelateMode === 'dot'" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">点状设置</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>点间距</label>
                <span>{{ dotGap }}px</span>
              </div>
              <input
                v-model.number="dotGap"
                type="range"
                min="0"
                max="20"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="dotShape" @change="updatePreview" class="rounded">
              <span class="text-sm">圆形点</span>
            </label>
          </div>

          <!-- 颜色设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">颜色设置</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="reduceColors" @change="updatePreview" class="rounded">
              <span class="text-sm">减少颜色 (复古效果)</span>
            </label>

            <div v-if="reduceColors">
              <div class="flex justify-between text-xs mb-1">
                <label>颜色数量</label>
                <span>{{ colorCount }}</span>
              </div>
              <input
                v-model.number="colorCount"
                type="range"
                min="2"
                max="32"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">色调调整</label>
              <select v-model="colorTone" @change="updatePreview" class="w-full p-2 border border-border rounded-lg text-sm">
                <option value="original">原始</option>
                <option value="grayscale">灰度</option>
                <option value="sepia">棕褐色</option>
                <option value="warm">暖色调</option>
                <option value="cool">冷色调</option>
                <option value="gameboy">Game Boy 绿</option>
                <option value="nes">NES 复古</option>
              </select>
            </div>
          </div>

          <!-- 边缘处理 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">边缘处理</h3>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="smoothEdges" @change="updatePreview" class="rounded">
              <span class="text-sm">平滑边缘</span>
            </label>
          </div>

          <!-- 图片信息 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">图片信息</h3>
            <div class="text-sm text-muted-foreground space-y-1">
              <p>原图尺寸: {{ imageInfo.width }} x {{ imageInfo.height }} px</p>
              <p>像素网格: {{ Math.ceil(imageInfo.width / pixelSize) }} x {{ Math.ceil(imageInfo.height / pixelSize) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">效果预览</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后查看像素化效果
        </div>

        <div v-else class="space-y-4">
          <!-- 原图对比 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">原图</span>
            </div>
            <img :src="imageUrl" class="max-w-full h-auto rounded-lg" alt="原图" />
          </div>

          <!-- 像素化效果 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">像素化效果</span>
            </div>
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
              :style="{ imageRendering: smoothEdges ? 'auto' : 'pixelated' }"
            ></canvas>
          </div>

          <!-- 下载 -->
          <div class="flex gap-2">
            <button @click="downloadImage" class="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Download class="w-5 h-5 inline mr-2" />
              下载图片 (PNG)
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">使用技巧</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div>
          <p class="font-medium text-foreground mb-1">复古游戏风格</p>
          <p>使用8-16像素大小，配合Game Boy色调，创造8位游戏风格</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">隐私保护</p>
          <p>使用较大的像素尺寸和点状模式，快速模糊敏感信息</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">像素艺术</p>
          <p>使用4-8像素大小，减少颜色到8-16色，制作像素画</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useSeoMeta } from '#app'
import { Upload, Download } from 'lucide-vue-next'

const fileInput = ref(null)
const canvas = ref(null)
const imageUrl = ref('')
const originalFile = ref(null)
const pixelateMode = ref('block')
const pixelSize = ref(16)
const dotGap = ref(2)
const dotShape = ref(false)
const reduceColors = ref(false)
const colorCount = ref(8)
const colorTone = ref('original')
const smoothEdges = ref(false)
const imageInfo = ref({ width: 0, height: 0 })

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

const loadImage = (file) => {
  originalFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
    const img = new Image()
    img.onload = () => {
      imageInfo.value = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      updatePreview()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const updatePreview = () => {
  if (!imageUrl.value || !canvas.value) return

  const img = new Image()
  img.onload = () => {
    const ctx = canvas.value.getContext('2d')
    canvas.value.width = img.naturalWidth
    canvas.value.height = img.naturalHeight

    if (pixelateMode.value === 'block') {
      applyBlockPixelate(ctx, img)
    } else if (pixelateMode.value === 'dot') {
      applyDotPixelate(ctx, img)
    } else if (pixelateMode.value === 'cross') {
      applyCrossPixelate(ctx, img)
    }

    // 应用色调调整
    if (colorTone.value !== 'original') {
      applyColorTone(ctx)
    }
  }
  img.src = imageUrl.value
}

const applyBlockPixelate = (ctx, img) => {
  const size = pixelSize.value
  const w = canvas.value.width
  const h = canvas.value.height

  // 创建小尺寸画布
  const smallCanvas = document.createElement('canvas')
  const smallCtx = smallCanvas.getContext('2d')
  const sw = Math.ceil(w / size)
  const sh = Math.ceil(h / size)
  smallCanvas.width = sw
  smallCanvas.height = sh

  // 绘制缩小版本
  smallCtx.drawImage(img, 0, 0, sw, sh)

  // 减少颜色
  if (reduceColors.value) {
    const imageData = smallCtx.getImageData(0, 0, sw, sh)
    reduceColorsInImage(imageData, colorCount.value)
    smallCtx.putImageData(imageData, 0, 0)
  }

  // 放大回原尺寸
  ctx.imageSmoothingEnabled = !smoothEdges.value
  ctx.drawImage(smallCanvas, 0, 0, w, h)
}

const applyDotPixelate = (ctx, img) => {
  const size = pixelSize.value
  const w = canvas.value.width
  const h = canvas.value.height

  // 绘制背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // 创建小尺寸画布采样颜色
  const smallCanvas = document.createElement('canvas')
  const smallCtx = smallCanvas.getContext('2d')
  const sw = Math.ceil(w / size)
  const sh = Math.ceil(h / size)
  smallCanvas.width = sw
  smallCanvas.height = sh
  smallCtx.drawImage(img, 0, 0, sw, sh)

  const imageData = smallCtx.getImageData(0, 0, sw, sh)
  const data = imageData.data

  // 绘制点
  const dotSize = size - dotGap.value
  const offset = (size - dotSize) / 2

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      ctx.fillStyle = `rgb(${r},${g},${b})`

      const px = x * size + offset
      const py = y * size + offset

      if (dotShape.value) {
        ctx.beginPath()
        ctx.arc(px + dotSize / 2, py + dotSize / 2, dotSize / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(px, py, dotSize, dotSize)
      }
    }
  }
}

const applyCrossPixelate = (ctx, img) => {
  const size = pixelSize.value
  const w = canvas.value.width
  const h = canvas.value.height

  // 绘制背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // 创建小尺寸画布采样颜色
  const smallCanvas = document.createElement('canvas')
  const smallCtx = smallCanvas.getContext('2d')
  const sw = Math.ceil(w / size)
  const sh = Math.ceil(h / size)
  smallCanvas.width = sw
  smallCanvas.height = sh
  smallCtx.drawImage(img, 0, 0, sw, sh)

  const imageData = smallCtx.getImageData(0, 0, sw, sh)
  const data = imageData.data
  const crossSize = size * 0.6

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.strokeStyle = `rgb(${r},${g},${b})`
      ctx.lineWidth = crossSize / 3

      const px = x * size + size / 2
      const py = y * size + size / 2
      const half = crossSize / 2

      ctx.beginPath()
      ctx.moveTo(px - half, py)
      ctx.lineTo(px + half, py)
      ctx.moveTo(px, py - half)
      ctx.lineTo(px, py + half)
      ctx.stroke()
    }
  }
}

const reduceColorsInImage = (imageData, count) => {
  const data = imageData.data
  const step = Math.floor(256 / count)

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(data[i] / step) * step
    data[i + 1] = Math.floor(data[i + 1] / step) * step
    data[i + 2] = Math.floor(data[i + 2] / step) * step
  }
}

const applyColorTone = (ctx) => {
  const imageData = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (colorTone.value === 'grayscale') {
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      data[i] = data[i + 1] = data[i + 2] = gray
    } else if (colorTone.value === 'sepia') {
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
    } else if (colorTone.value === 'warm') {
      data[i] = Math.min(255, r * 1.1)
      data[i + 1] = Math.min(255, g * 1.05)
      data[i + 2] = b * 0.9
    } else if (colorTone.value === 'cool') {
      data[i] = r * 0.9
      data[i + 1] = g * 0.95
      data[i + 2] = Math.min(255, b * 1.1)
    } else if (colorTone.value === 'gameboy') {
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      if (gray < 51) {
        data[i] = 15
        data[i + 1] = 56
        data[i + 2] = 15
      } else if (gray < 102) {
        data[i] = 48
        data[i + 1] = 98
        data[i + 2] = 48
      } else if (gray < 153) {
        data[i] = 139
        data[i + 1] = 172
        data[i + 2] = 15
      } else {
        data[i] = 155
        data[i + 1] = 188
        data[i + 2] = 15
      }
    } else if (colorTone.value === 'nes') {
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      const palette = [
        [124, 124, 124],
        [0, 0, 252],
        [0, 0, 188],
        [68, 40, 188],
        [148, 0, 132],
        [168, 0, 32],
        [168, 16, 0],
        [136, 20, 0],
        [80, 48, 0],
        [0, 120, 0],
        [0, 104, 0],
        [0, 88, 0],
        [0, 64, 88],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ]
      const index = Math.min(15, Math.floor(gray / 17))
      data[i] = palette[index][0]
      data[i + 1] = palette[index][1]
      data[i + 2] = palette[index][2]
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

const resetSettings = () => {
  pixelateMode.value = 'block'
  pixelSize.value = 16
  dotGap.value = 2
  dotShape.value = false
  reduceColors.value = false
  colorCount.value = 8
  colorTone.value = 'original'
  smoothEdges.value = false
  updatePreview()
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName

  link.download = `${name}_pixelate.png`
  link.click()
}

useSeoMeta({
  title: '像素化工具 - 在线图片像素化马赛克工具',
  description: '免费在线像素化工具，支持块状像素、点状马赛克、十字像素等多种效果，可调整颜色和色调。',
  keywords: ['像素化', '马赛克', '像素艺术', 'pixelate', 'mosaic', '8-bit', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('像素化工具')
</script>
