<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">相框效果工具</h1>
      <p class="text-muted-foreground">为图片添加相框、边框和装饰效果</p>
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
          <!-- 相框样式 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">相框样式</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="frameStyle = 'simple'"
                :class="['p-2 rounded text-xs transition-colors', frameStyle === 'simple' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                简约边框
              </button>
              <button
                @click="frameStyle = 'classic'"
                :class="['p-2 rounded text-xs transition-colors', frameStyle === 'classic' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                经典相框
              </button>
              <button
                @click="frameStyle = 'polaroid'"
                :class="['p-2 rounded text-xs transition-colors', frameStyle === 'polaroid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                拍立得
              </button>
              <button
                @click="frameStyle = 'vintage'"
                :class="['p-2 rounded text-xs transition-colors', frameStyle === 'vintage' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                复古风
              </button>
              <button
                @click="frameStyle = 'film'"
                :class="['p-2 rounded text-xs transition-colors', frameStyle === 'film' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                胶片效果
              </button>
              <button
                @click="frameStyle = 'shadow'"
                :class="['p-2 rounded text-xs transition-colors', frameStyle === 'shadow' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                阴影效果
              </button>
            </div>
          </div>

          <!-- 边框设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">边框设置</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>边框宽度</label>
                <span>{{ frameWidth }}px</span>
              </div>
              <input
                v-model.number="frameWidth"
                type="range"
                min="0"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">边框颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="frameColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="frameColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
            </div>

            <!-- 预设颜色 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">快速颜色</label>
              <div class="grid grid-cols-8 gap-1">
                <button
                  v-for="color in presetColors"
                  :key="color"
                  @click="frameColor = color; updatePreview()"
                  class="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>
          </div>

          <!-- 纹理设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">纹理效果</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addTexture" @change="updatePreview" class="rounded">
              <span class="text-sm">添加纹理</span>
            </label>

            <div v-if="addTexture">
              <select v-model="textureType" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
                <option value="wood">木纹</option>
                <option value="paper">纸质</option>
                <option value="metal">金属</option>
                <option value="fabric">布料</option>
                <option value="noise">噪点</option>
              </select>
            </div>
          </div>

          <!-- 装饰设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">装饰设置</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addCorner" @change="updatePreview" class="rounded">
              <span class="text-sm">角落装饰</span>
            </label>

            <div v-if="addCorner">
              <select v-model="cornerStyle" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
                <option value="ornate">华丽</option>
                <option value="simple">简约</option>
                <option value="rounded">圆角</option>
                <option value="bracket">括号</option>
              </select>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addVignette" @change="updatePreview" class="rounded">
              <span class="text-sm">暗角效果</span>
            </label>

            <div v-if="addVignette">
              <div class="flex justify-between text-xs mb-1">
                <label>暗角强度</label>
                <span>{{ vignetteStrength }}</span>
              </div>
              <input
                v-model.number="vignetteStrength"
                type="range"
                min="0"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>
          </div>

          <!-- 文字水印 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">文字水印</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addWatermark" @change="updatePreview" class="rounded">
              <span class="text-sm">添加水印</span>
            </label>

            <div v-if="addWatermark" class="space-y-2">
              <input
                v-model="watermarkText"
                @input="updatePreview"
                type="text"
                class="w-full p-2 border border-border rounded text-sm"
                placeholder="输入水印文字..."
              >
              <div class="flex gap-2">
                <input
                  v-model="watermarkColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="watermarkColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>字体大小</label>
                  <span>{{ watermarkSize }}px</span>
                </div>
                <input
                  v-model.number="watermarkSize"
                  type="range"
                  min="10"
                  max="100"
                  @input="updatePreview"
                  class="w-full"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">效果预览</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后查看效果
        </div>

        <div v-else class="space-y-4">
          <!-- 预览画布 -->
          <div class="bg-muted rounded-lg p-4">
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
            ></canvas>
          </div>

          <!-- 下载 -->
          <div class="flex gap-2">
            <button @click="downloadImage" class="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Download class="w-5 h-5 inline mr-2" />
              下载图片
            </button>
          </div>
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

const frameStyle = ref('simple')
const frameWidth = ref(20)
const frameColor = ref('#000000')
const addTexture = ref(false)
const textureType = ref('wood')
const addCorner = ref(false)
const cornerStyle = ref('simple')
const addVignette = ref(false)
const vignetteStrength = ref(50)
const addWatermark = ref(false)
const watermarkText = ref('')
const watermarkColor = ref('#FFFFFF')
const watermarkSize = ref(24)

const presetColors = [
  '#000000', '#FFFFFF', '#8B4513', '#D2691E', '#DEB887', '#F5DEB3', '#FFD700', '#C0C0C0'
]

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
  reader.onload = async (e) => {
    imageUrl.value = e.target.result
    await nextTick()
    updatePreview()
  }
  reader.readAsDataURL(file)
}

const updatePreview = () => {
  if (!imageUrl.value || !canvas.value) return

  const img = new Image()
  img.onload = () => {
    const ctx = canvas.value.getContext('2d')

    // 计算画布尺寸
    const padding = frameWidth.value
    const canvasWidth = img.naturalWidth + padding * 2
    const canvasHeight = img.naturalHeight + padding * 2

    canvas.value.width = canvasWidth
    canvas.value.height = canvasHeight

    // 绘制相框
    drawFrame(ctx, canvasWidth, canvasHeight, padding)

    // 绘制图片
    ctx.drawImage(img, padding, padding, img.naturalWidth, img.naturalHeight)

    // 应用效果
    if (addCorner.value) {
      drawCorners(ctx, canvasWidth, canvasHeight, padding)
    }

    if (addVignette.value) {
      applyVignette(ctx, canvasWidth, canvasHeight)
    }

    if (addWatermark.value && watermarkText.value) {
      drawWatermark(ctx, canvasWidth, canvasHeight)
    }
  }
  img.src = imageUrl.value
}

const drawFrame = (ctx, width, height, padding) => {
  // 绘制边框背景
  ctx.fillStyle = frameColor.value
  ctx.fillRect(0, 0, width, height)

  // 应用纹理
  if (addTexture.value) {
    applyTexture(ctx, width, height)
  }

  // 不同样式的处理
  if (frameStyle.value === 'polaroid') {
    // 拍立得效果：底部更宽
    const bottomPadding = padding * 3
    canvas.value.height += bottomPadding - padding
    ctx.fillStyle = frameColor.value
    ctx.fillRect(0, height - padding, width, bottomPadding)

    if (addTexture.value) {
      applyTexture(ctx, width, canvas.value.height)
    }
  } else if (frameStyle.value === 'vintage') {
    // 复古效果：内边框
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 2
    ctx.strokeRect(padding - 5, padding - 5, width - padding * 2 + 10, height - padding * 2 + 10)
  } else if (frameStyle.value === 'film') {
    // 胶片效果：上下黑边
    const filmHeight = padding * 0.3
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, filmHeight)
    ctx.fillRect(0, height - filmHeight, width, filmHeight)
  }
}

const applyTexture = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    let factor = 1

    if (textureType.value === 'wood') {
      // 木纹效果
      const x = (i / 4) % width
      factor = 0.8 + Math.sin(x * 0.1) * 0.2
    } else if (textureType.value === 'paper') {
      // 纸质效果
      factor = 0.9 + Math.random() * 0.2
    } else if (textureType.value === 'metal') {
      // 金属效果
      const x = (i / 4) % width
      factor = 0.7 + Math.cos(x * 0.05) * 0.3
    } else if (textureType.value === 'fabric') {
      // 布料效果
      const x = (i / 4) % width
      const y = Math.floor((i / 4) / width)
      factor = 0.9 + Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.1
    } else if (textureType.value === 'noise') {
      // 噪点效果
      factor = 0.8 + Math.random() * 0.4
    }

    data[i] = Math.min(255, data[i] * factor)
    data[i + 1] = Math.min(255, data[i + 1] * factor)
    data[i + 2] = Math.min(255, data[i + 2] * factor)
  }

  ctx.putImageData(imageData, 0, 0)
}

const drawCorners = (ctx, width, height, padding) => {
  const cornerSize = padding * 0.8
  ctx.strokeStyle = frameColor.value
  ctx.lineWidth = 3

  if (cornerStyle.value === 'ornate') {
    // 华丽角落
    const drawOrnateCorner = (x, y) => {
      ctx.beginPath()
      ctx.moveTo(x, y + cornerSize)
      ctx.lineTo(x, y)
      ctx.lineTo(x + cornerSize, y)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(x + cornerSize * 0.3, y + cornerSize * 0.3, cornerSize * 0.2, 0, Math.PI * 2)
      ctx.stroke()
    }

    drawOrnateCorner(padding, padding)
    drawOrnateCorner(width - padding, padding)
    drawOrnateCorner(padding, height - padding)
    drawOrnateCorner(width - padding, height - padding)
  } else if (cornerStyle.value === 'simple') {
    // 简约L形
    ctx.beginPath()
    ctx.moveTo(padding, padding + cornerSize)
    ctx.lineTo(padding, padding)
    ctx.lineTo(padding + cornerSize, padding)

    ctx.moveTo(width - padding - cornerSize, padding)
    ctx.lineTo(width - padding, padding)
    ctx.lineTo(width - padding, padding + cornerSize)

    ctx.moveTo(padding, height - padding - cornerSize)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(padding + cornerSize, height - padding)

    ctx.moveTo(width - padding - cornerSize, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.lineTo(width - padding, height - padding - cornerSize)

    ctx.stroke()
  } else if (cornerStyle.value === 'rounded') {
    // 圆角
    const radius = padding * 0.5
    ctx.beginPath()
    ctx.roundRect(padding, padding, width - padding * 2, height - padding * 2, radius)
    ctx.stroke()
  } else if (cornerStyle.value === 'bracket') {
    // 括号
    const bracketSize = cornerSize * 0.8
    const gap = 5

    ctx.beginPath()
    // 左上
    ctx.moveTo(padding + gap, padding + bracketSize)
    ctx.lineTo(padding + gap, padding + gap)
    ctx.lineTo(padding + bracketSize, padding + gap)

    // 右上
    ctx.moveTo(width - padding - bracketSize, padding + gap)
    ctx.lineTo(width - padding - gap, padding + gap)
    ctx.lineTo(width - padding - gap, padding + bracketSize)

    // 左下
    ctx.moveTo(padding + bracketSize, height - padding - gap)
    ctx.lineTo(padding + gap, height - padding - gap)
    ctx.lineTo(padding + gap, height - padding - bracketSize)

    // 右下
    ctx.moveTo(width - padding - gap, height - padding - bracketSize)
    ctx.lineTo(width - padding - gap, height - padding - gap)
    ctx.lineTo(width - padding - bracketSize, height - padding - gap)

    ctx.stroke()
  }
}

const applyVignette = (ctx, width, height) => {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  )

  const strength = vignetteStrength.value / 100
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

const drawWatermark = (ctx, width, height) => {
  ctx.save()
  ctx.font = `${watermarkSize.value}px Arial, sans-serif`
  ctx.fillStyle = watermarkColor.value
  ctx.globalAlpha = 0.7
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  // 底部居中
  ctx.fillText(watermarkText.value, width / 2, height - 10)
  ctx.restore()
}

const resetSettings = () => {
  frameStyle.value = 'simple'
  frameWidth.value = 20
  frameColor.value = '#000000'
  addTexture.value = false
  textureType.value = 'wood'
  addCorner.value = false
  cornerStyle.value = 'simple'
  addVignette.value = false
  vignetteStrength.value = 50
  addWatermark.value = false
  watermarkText.value = ''
  watermarkColor.value = '#FFFFFF'
  watermarkSize.value = 24
  updatePreview()
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName

  link.download = `${name}_frame.png`
  link.click()
}

useSeoMeta({
  title: '相框效果 - 在线图片相框工具',
  description: '免费在线相框效果工具，为图片添加各种相框、边框、纹理和装饰效果。',
  keywords: ['相框', '边框', '图片装饰', 'frame', 'border', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('相框效果工具')
</script>
