<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">散景虚化效果工具</h1>
      <p class="text-muted-foreground">为图片添加散景虚化效果，模拟景深和镜头光斑</p>
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
          <!-- 散景类型 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">散景类型</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="bokehType = 'circle'"
                :class="['p-2 rounded text-xs transition-colors', bokehType === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                圆形光斑
              </button>
              <button
                @click="bokehType = 'hexagon'"
                :class="['p-2 rounded text-xs transition-colors', bokehType === 'hexagon' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                六边形
              </button>
              <button
                @click="bokehType = 'heart'"
                :class="['p-2 rounded text-xs transition-colors', bokehType === 'heart' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                心形
              </button>
              <button
                @click="bokehType = 'star'"
                :class="['p-2 rounded text-xs transition-colors', bokehType === 'star' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                星形
              </button>
              <button
                @click="bokehType = 'bubble'"
                :class="['p-2 rounded text-xs transition-colors', bokehType === 'bubble' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                气泡
              </button>
              <button
                @click="bokehType = 'light'"
                :class="['p-2 rounded text-xs transition-colors', bokehType === 'light' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                光线
              </button>
            </div>
          </div>

          <!-- 模糊设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">模糊设置</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>模糊强度</label>
                <span>{{ blurAmount }}px</span>
              </div>
              <input
                v-model.number="blurAmount"
                type="range"
                min="0"
                max="50"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="keepCenter" @change="updatePreview" class="rounded">
                <span class="text-sm">保持中心清晰</span>
              </label>
            </div>

            <div v-if="keepCenter">
              <div class="flex justify-between text-xs mb-1">
                <label>清晰区域大小</label>
                <span>{{ focusSize }}%</span>
              </div>
              <input
                v-model.number="focusSize"
                type="range"
                min="10"
                max="80"
                @input="updatePreview"
                class="w-full"
              >
            </div>
          </div>

          <!-- 光斑设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">光斑设置</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>光斑数量</label>
                <span>{{ bokehCount }}</span>
              </div>
              <input
                v-model.number="bokehCount"
                type="range"
                min="0"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>光斑大小</label>
                <span>{{ bokehSize }}px</span>
              </div>
              <input
                v-model.number="bokehSize"
                type="range"
                min="5"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>透明度</label>
                <span>{{ Math.round(bokehOpacity * 100) }}%</span>
              </div>
              <input
                v-model.number="bokehOpacity"
                type="range"
                min="0"
                max="1"
                step="0.05"
                @input="updatePreview"
                class="w-full"
              >
            </div>
          </div>

          <!-- 颜色设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">颜色设置</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="colorfulBokeh" @change="updatePreview" class="rounded">
              <span class="text-sm">彩色光斑</span>
            </label>

            <div v-if="colorfulBokeh">
              <label class="text-xs text-muted-foreground mb-1 block">主色调</label>
              <div class="flex gap-2">
                <input
                  v-model="bokehColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="bokehColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
            </div>
          </div>

          <!-- 亮度效果 -->
          <div class="bg-muted p-4 rounded-lg">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addGlow" @change="updatePreview" class="rounded">
              <span class="text-sm">添加发光效果</span>
            </label>
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
          <!-- 原图对比 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">原图</span>
            </div>
            <img :src="imageUrl" class="max-w-full h-auto rounded-lg" alt="原图">
          </div>

          <!-- 散景效果 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">散景效果</span>
            </div>
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

const bokehType = ref('circle')
const blurAmount = ref(15)
const keepCenter = ref(true)
const focusSize = ref(30)
const bokehCount = ref(30)
const bokehSize = ref(30)
const bokehOpacity = ref(0.6)
const colorfulBokeh = ref(false)
const bokehColor = ref('#FFFFFF')
const addGlow = ref(false)

const bokehShapes = ref([])

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
    generateBokehShapes()
    await nextTick()
    updatePreview()
  }
  reader.readAsDataURL(file)
}

const generateBokehShapes = () => {
  bokehShapes.value = []
  for (let i = 0; i < bokehCount.value; i++) {
    bokehShapes.value.push({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 0.5,
      rotation: Math.random() * Math.PI * 2,
      colorOffset: Math.random() * 60 - 30
    })
  }
}

const updatePreview = () => {
  if (!imageUrl.value || !canvas.value) return

  const img = new Image()
  img.onload = () => {
    const ctx = canvas.value.getContext('2d')
    canvas.value.width = img.naturalWidth
    canvas.value.height = img.naturalHeight

    // 绘制模糊背景
    if (blurAmount.value > 0 || keepCenter.value) {
      applyBlurEffect(ctx, img)
    } else {
      ctx.drawImage(img, 0, 0)
    }

    // 绘制光斑
    if (bokehCount.value > 0) {
      drawBokeh(ctx)
    }

    // 添加发光效果
    if (addGlow.value) {
      applyGlow(ctx)
    }
  }
  img.src = imageUrl.value
}

const applyBlurEffect = (ctx, img) => {
  const width = canvas.value.width
  const height = canvas.value.height
  const centerX = width / 2
  const centerY = height / 2
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)

  // 创建临时画布处理模糊
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')

  // 应用模糊
  tempCtx.filter = `blur(${blurAmount.value}px)`
  tempCtx.drawImage(img, 0, 0)

  if (keepCenter.value) {
    // 绘制模糊版本
    ctx.drawImage(tempCanvas, 0, 0)

    // 在中心绘制清晰版本
    const focusRadius = Math.min(width, height) * (focusSize.value / 100)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, focusRadius)
    gradient.addColorStop(0, 'rgba(0,0,0,1)')
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.5)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.restore()

    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.drawImage(img, 0, 0)
    ctx.restore()
  } else {
    ctx.drawImage(tempCanvas, 0, 0)
  }
}

const drawBokeh = (ctx) => {
  const width = canvas.value.width
  const height = canvas.value.height

  bokehShapes.value.forEach(shape => {
    const x = shape.x * width
    const y = shape.y * height
    const size = bokehSize.value * shape.size

    ctx.save()
    ctx.globalAlpha = bokehOpacity.value

    if (colorfulBokeh.value) {
      const baseColor = hexToRgb(bokehColor.value)
      const r = Math.min(255, Math.max(0, baseColor.r + shape.colorOffset))
      const g = Math.min(255, Math.max(0, baseColor.g + shape.colorOffset))
      const b = Math.min(255, Math.max(0, baseColor.b + shape.colorOffset))
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    }

    ctx.translate(x, y)
    ctx.rotate(shape.rotation)

    switch (bokehType.value) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'hexagon':
        drawPolygon(ctx, 0, 0, size / 2, 6)
        break
      case 'heart':
        drawHeart(ctx, 0, 0, size)
        break
      case 'star':
        drawStar(ctx, 0, 0, size / 2, size / 4, 5)
        break
      case 'bubble':
        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, 0.2)`
        ctx.fill()
        ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`
        ctx.lineWidth = 2
        ctx.stroke()
        break
      case 'light':
        drawLightRay(ctx, 0, 0, size)
        break
    }

    ctx.restore()
  })
}

const drawPolygon = (ctx, x, y, radius, sides) => {
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2
    const px = x + radius * Math.cos(angle)
    const py = y + radius * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fill()
}

const drawHeart = (ctx, x, y, size) => {
  ctx.beginPath()
  const topY = y - size / 4
  ctx.moveTo(x, topY)
  ctx.bezierCurveTo(x + size / 2, topY - size / 2, x + size, topY + size / 6, x, topY + size / 1.5)
  ctx.bezierCurveTo(x - size, topY + size / 6, x - size / 2, topY - size / 2, x, topY)
  ctx.fill()
}

const drawStar = (ctx, x, y, outerRadius, innerRadius, points) => {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points - Math.PI / 2
    const px = x + radius * Math.cos(angle)
    const py = y + radius * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fill()
}

const drawLightRay = (ctx, x, y, size) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
}

const applyGlow = (ctx) => {
  const imageData = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * 1.1)
    data[i + 1] = Math.min(255, data[i + 1] * 1.1)
    data[i + 2] = Math.min(255, data[i + 2] * 1.1)
  }

  ctx.putImageData(imageData, 0, 0)
}

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

const resetSettings = () => {
  bokehType.value = 'circle'
  blurAmount.value = 15
  keepCenter.value = true
  focusSize.value = 30
  bokehCount.value = 30
  bokehSize.value = 30
  bokehOpacity.value = 0.6
  colorfulBokeh.value = false
  bokehColor.value = '#FFFFFF'
  addGlow.value = false
  generateBokehShapes()
  updatePreview()
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName

  link.download = `${name}_bokeh.png`
  link.click()
}

useSeoMeta({
  title: '散景虚化效果 - 在线散景效果生成工具',
  description: '免费在线散景虚化效果工具，为图片添加美丽的散景光斑和景深效果。',
  keywords: ['散景', '虚化', '景深', 'bokeh', '光斑', '背景模糊', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('散景虚化效果工具')
</script>
