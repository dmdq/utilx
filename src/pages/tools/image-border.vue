<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片边框圆角工具</h1>
      <p class="text-muted-foreground">为图片添加边框、圆角和阴影效果</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和设置 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传图片</h2>
          <div class="flex gap-2">
            <button @click="resetSettings" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">重置</button>
            <button @click="clearImage" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
          </div>
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
          <!-- 边框设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">边框设置</h3>

            <!-- 边框宽度 -->
            <div>
              <div class="flex justify-between text-sm mb-1">
                <label>边框宽度</label>
                <span class="text-muted-foreground">{{ settings.borderWidth }}px</span>
              </div>
              <input
                v-model.number="settings.borderWidth"
                type="range"
                min="0"
                max="100"
                class="w-full"
                @input="applySettings"
              >
            </div>

            <!-- 边框颜色 -->
            <div>
              <label class="text-sm mb-1 block">边框颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="settings.borderColor"
                  type="color"
                  class="w-12 h-10 rounded cursor-pointer"
                  @input="applySettings"
                >
                <input
                  v-model="settings.borderColor"
                  type="text"
                  class="flex-1 p-2 border border-border rounded-lg text-sm font-mono"
                  @input="applySettings"
                >
              </div>
            </div>

            <!-- 边框样式 -->
            <div>
              <label class="text-sm mb-1 block">边框样式</label>
              <select v-model="settings.borderStyle" class="w-full p-2 border border-border rounded-lg text-sm" @change="applySettings">
                <option value="solid">实线 (Solid)</option>
                <option value="dashed">虚线 (Dashed)</option>
                <option value="dotted">点线 (Dotted)</option>
                <option value="double">双线 (Double)</option>
                <option value="groove">凹槽 (Groove)</option>
                <option value="ridge">凸起 (Ridge)</option>
              </select>
            </div>
          </div>

          <!-- 圆角设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">圆角设置</h3>

            <!-- 统一圆角 -->
            <div class="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                v-model="settings.uniformRadius"
                @change="applySettings"
                class="rounded"
              >
              <label class="text-sm">统一设置所有角</label>
            </div>

            <div v-if="settings.uniformRadius">
              <div class="flex justify-between text-sm mb-1">
                <label>圆角大小</label>
                <span class="text-muted-foreground">{{ settings.borderRadius }}px</span>
              </div>
              <input
                v-model.number="settings.borderRadius"
                type="range"
                min="0"
                max="250"
                class="w-full"
                @input="applySettings"
              >
            </div>

            <div v-else class="space-y-2">
              <div>
                <label class="text-xs">左上: {{ settings.borderTopLeftRadius }}px</label>
                <input v-model.number="settings.borderTopLeftRadius" type="range" min="0" max="250" class="w-full" @input="applySettings">
              </div>
              <div>
                <label class="text-xs">右上: {{ settings.borderTopRightRadius }}px</label>
                <input v-model.number="settings.borderTopRightRadius" type="range" min="0" max="250" class="w-full" @input="applySettings">
              </div>
              <div>
                <label class="text-xs">右下: {{ settings.borderBottomRightRadius }}px</label>
                <input v-model.number="settings.borderBottomRightRadius" type="range" min="0" max="250" class="w-full" @input="applySettings">
              </div>
              <div>
                <label class="text-xs">左下: {{ settings.borderBottomLeftRadius }}px</label>
                <input v-model.number="settings.borderBottomLeftRadius" type="range" min="0" max="250" class="w-full" @input="applySettings">
              </div>
            </div>
          </div>

          <!-- 阴影设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-sm">阴影效果</h3>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  v-model="settings.shadowEnabled"
                  @change="applySettings"
                  class="rounded"
                >
                启用
              </label>
            </div>

            <div v-if="settings.shadowEnabled" class="space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>水平偏移</label>
                  <span>{{ settings.shadowOffsetX }}px</span>
                </div>
                <input v-model.number="settings.shadowOffsetX" type="range" min="-50" max="50" class="w-full" @input="applySettings">
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>垂直偏移</label>
                  <span>{{ settings.shadowOffsetY }}px</span>
                </div>
                <input v-model.number="settings.shadowOffsetY" type="range" min="-50" max="50" class="w-full" @input="applySettings">
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>模糊半径</label>
                  <span>{{ settings.shadowBlur }}px</span>
                </div>
                <input v-model.number="settings.shadowBlur" type="range" min="0" max="50" class="w-full" @input="applySettings">
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>扩展半径</label>
                  <span>{{ settings.shadowSpread }}px</span>
                </div>
                <input v-model.number="settings.shadowSpread" type="range" min="-20" max="50" class="w-full" @input="applySettings">
              </div>
              <div>
                <label class="text-xs mb-1 block">阴影颜色</label>
                <div class="flex gap-2">
                  <input
                    v-model="settings.shadowColor"
                    type="color"
                    class="w-12 h-8 rounded cursor-pointer"
                    @input="applySettings"
                  >
                  <input
                    v-model="settings.shadowColor"
                    type="text"
                    class="flex-1 p-1 border border-border rounded text-sm font-mono"
                    @input="applySettings"
                  >
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>透明度</label>
                  <span>{{ Math.round(settings.shadowOpacity * 100) }}%</span>
                </div>
                <input v-model.number="settings.shadowOpacity" type="range" min="0" max="1" step="0.01" class="w-full" @input="applySettings">
              </div>
            </div>
          </div>

          <!-- 背景填充 -->
          <div class="bg-muted p-4 rounded-lg space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-sm">背景填充</h3>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  v-model="settings.backgroundEnabled"
                  @change="applySettings"
                  class="rounded"
                >
                启用
              </label>
            </div>

            <div v-if="settings.backgroundEnabled">
              <label class="text-xs mb-1 block">背景颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="settings.backgroundColor"
                  type="color"
                  class="w-12 h-8 rounded cursor-pointer"
                  @input="applySettings"
                >
                <input
                  v-model="settings.backgroundColor"
                  type="text"
                  class="flex-1 p-1 border border-border rounded text-sm font-mono"
                  @input="applySettings"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">效果预览</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后查看效果
        </div>

        <div v-else class="space-y-4">
          <!-- 预览画布 -->
          <div class="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[400px]">
            <canvas
              ref="canvas"
              :style="{ maxWidth: '100%' }"
            ></canvas>
          </div>

          <!-- 下载按钮 -->
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

const settings = ref({
  borderWidth: 10,
  borderColor: '#000000',
  borderStyle: 'solid',
  borderRadius: 20,
  uniformRadius: true,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
  borderBottomLeftRadius: 20,
  shadowEnabled: false,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  shadowBlur: 10,
  shadowSpread: 0,
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  backgroundEnabled: false,
  backgroundColor: '#ffffff'
})

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
    resetSettings()
    await nextTick()
    applySettings()
  }
  reader.readAsDataURL(file)
}

const applySettings = () => {
  if (!imageUrl.value || !canvas.value) return

  const img = new Image()
  img.onload = () => {
    const ctx = canvas.value.getContext('2d')
    const s = settings.value

    // 计算画布尺寸（考虑边框和阴影）
    const padding = Math.max(s.borderWidth, s.shadowEnabled ? s.shadowBlur + s.shadowSpread + Math.abs(s.shadowOffsetX) + Math.abs(s.shadowOffsetY) : 0)
    const canvasWidth = img.naturalWidth + padding * 2
    const canvasHeight = img.naturalHeight + padding * 2

    canvas.value.width = canvasWidth
    canvas.value.height = canvasHeight

    // 绘制背景（如果有圆角或背景填充）
    if (s.backgroundEnabled || s.borderRadius > 0 || !s.uniformRadius) {
      const radius = s.uniformRadius ? s.borderRadius : 0

      if (s.backgroundEnabled) {
        ctx.fillStyle = s.backgroundColor
        roundRect(ctx, padding, padding, img.naturalWidth, img.naturalHeight, radius)
        ctx.fill()
      }

      // 绘制图片（带圆角裁剪）
      if (radius > 0 || !s.uniformRadius) {
        ctx.save()
        roundRect(ctx, padding, padding, img.naturalWidth, img.naturalHeight, radius)
        ctx.clip()
        ctx.drawImage(img, padding, padding)
        ctx.restore()
      } else {
        ctx.drawImage(img, padding, padding)
      }
    } else {
      ctx.drawImage(img, padding, padding)
    }

    // 绘制阴影
    if (s.shadowEnabled && s.borderWidth > 0) {
      ctx.save()
      const shadowColor = hexToRgba(s.shadowColor, s.shadowOpacity)
      ctx.shadowColor = shadowColor
      ctx.shadowOffsetX = s.shadowOffsetX
      ctx.shadowOffsetY = s.shadowOffsetY
      ctx.shadowBlur = s.shadowBlur

      const radius = s.uniformRadius ? s.borderRadius : 0
      if (radius > 0 || !s.uniformRadius) {
        roundRect(ctx, padding - s.shadowSpread, padding - s.shadowSpread, img.naturalWidth + s.shadowSpread * 2, img.naturalHeight + s.shadowSpread * 2, radius)
      } else {
        ctx.strokeRect(padding - s.shadowSpread, padding - s.shadowSpread, img.naturalWidth + s.shadowSpread * 2, img.naturalHeight + s.shadowSpread * 2)
      }
      ctx.restore()
    }

    // 绘制边框
    if (s.borderWidth > 0) {
      ctx.strokeStyle = s.borderColor
      ctx.lineWidth = s.borderWidth

      const halfBorder = s.borderWidth / 2
      const offset = padding + halfBorder

      if (s.borderStyle === 'dashed') {
        ctx.setLineDash([s.borderWidth * 2, s.borderWidth])
      } else if (s.borderStyle === 'dotted') {
        ctx.setLineDash([s.borderWidth, s.borderWidth])
      } else if (s.borderStyle === 'double') {
        ctx.setLineDash([])
        ctx.lineWidth = s.borderWidth / 3
        ctx.strokeRect(offset - s.borderWidth / 3, offset - s.borderWidth / 3, img.naturalWidth + s.borderWidth * 2 / 3, img.naturalHeight + s.borderWidth * 2 / 3)
        ctx.strokeRect(offset + s.borderWidth / 3, offset + s.borderWidth / 3, img.naturalWidth - s.borderWidth * 2 / 3, img.naturalHeight - s.borderWidth * 2 / 3)
        ctx.lineWidth = s.borderWidth
      } else {
        ctx.setLineDash([])
      }

      const radius = s.uniformRadius ? s.borderRadius : 0
      if (radius > 0 || !s.uniformRadius) {
        ctx.beginPath()
        if (s.uniformRadius) {
          roundRectPath(ctx, offset, offset, img.naturalWidth - s.borderWidth, img.naturalHeight - s.borderWidth, radius)
        } else {
          const x = offset
          const y = offset
          const w = img.naturalWidth - s.borderWidth
          const h = img.naturalHeight - s.borderWidth
          ctx.moveTo(x + s.borderTopLeftRadius, y)
          ctx.lineTo(x + w - s.borderTopRightRadius, y)
          ctx.quadraticCurveTo(x + w, y, x + w, y + s.borderTopRightRadius)
          ctx.lineTo(x + w, y + h - s.borderBottomRightRadius)
          ctx.quadraticCurveTo(x + w, y + h, x + w - s.borderBottomRightRadius, y + h)
          ctx.lineTo(x + s.borderBottomLeftRadius, y + h)
          ctx.quadraticCurveTo(x, y + h, x, y + h - s.borderBottomLeftRadius)
          ctx.lineTo(x, y + s.borderTopLeftRadius)
          ctx.quadraticCurveTo(x, y, x + s.borderTopLeftRadius, y)
        }
        ctx.stroke()
      } else {
        ctx.strokeRect(offset, offset, img.naturalWidth - s.borderWidth, img.naturalHeight - s.borderWidth)
      }
    }
  }
  img.src = imageUrl.value
}

const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath()
  roundRectPath(ctx, x, y, width, height, radius)
}

const roundRectPath = (ctx, x, y, width, height, radius) => {
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const resetSettings = () => {
  settings.value = {
    borderWidth: 10,
    borderColor: '#000000',
    borderStyle: 'solid',
    borderRadius: 20,
    uniformRadius: true,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    shadowBlur: 10,
    shadowSpread: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    backgroundEnabled: false,
    backgroundColor: '#ffffff'
  }
  applySettings()
}

const clearImage = () => {
  imageUrl.value = ''
  originalFile.value = null
  resetSettings()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName

  link.download = `${name}_border.png`
  link.click()
}

useSeoMeta({
  title: '图片边框圆角 - 在线图片边框圆角工具',
  description: '免费在线图片边框圆角工具，支持添加各种边框样式、圆角裁剪、阴影效果和背景填充。',
  keywords: ['图片边框', '圆角', '阴影', 'border', 'radius', 'shadow', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片边框圆角工具')
</script>
