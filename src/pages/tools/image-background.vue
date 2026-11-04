<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片背景处理工具</h1>
      <p class="text-muted-foreground">更换图片背景颜色、添加模糊效果，支持纯色背景移除</p>
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
          <!-- 背景模式 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">背景模式</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="mode = 'replace'"
                :class="['p-2 rounded text-xs transition-colors', mode === 'replace' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                更换颜色
              </button>
              <button
                @click="mode = 'blur'"
                :class="['p-2 rounded text-xs transition-colors', mode === 'blur' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                背景模糊
              </button>
              <button
                @click="mode = 'remove'"
                :class="['p-2 rounded text-xs transition-colors', mode === 'remove' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                移除背景
              </button>
            </div>
          </div>

          <!-- 更换颜色模式 -->
          <div v-if="mode === 'replace'" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">更换背景颜色</h3>

            <!-- 预设颜色 -->
            <div>
              <label class="text-xs text-muted-foreground mb-2 block">预设颜色</label>
              <div class="grid grid-cols-8 gap-1">
                <button
                  v-for="color in presetColors"
                  :key="color"
                  @click="settings.backgroundColor = color; applySettings()"
                  :class="['w-8 h-8 rounded border-2', settings.backgroundColor === color ? 'border-primary' : 'border-transparent']"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>

            <!-- 自定义颜色 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">自定义颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="settings.backgroundColor"
                  type="color"
                  class="w-12 h-10 rounded cursor-pointer"
                  @input="applySettings"
                >
                <input
                  v-model="settings.backgroundColor"
                  type="text"
                  class="flex-1 p-2 border border-border rounded-lg text-sm font-mono"
                  @input="applySettings"
                >
              </div>
            </div>

            <!-- 透明度 -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>背景透明度</label>
                <span>{{ Math.round(settings.backgroundOpacity * 100) }}%</span>
              </div>
              <input
                v-model.number="settings.backgroundOpacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-full"
                @input="applySettings"
              >
            </div>
          </div>

          <!-- 背景模糊模式 -->
          <div v-if="mode === 'blur'" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">背景模糊效果</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>模糊强度</label>
                <span>{{ settings.blurAmount }}px</span>
              </div>
              <input
                v-model.number="settings.blurAmount"
                type="range"
                min="0"
                max="50"
                class="w-full"
                @input="applySettings"
              >
            </div>

            <div class="text-xs text-muted-foreground">
              <p>• 背景模糊会自动检测主体并模糊周围区域</p>
              <p>• 当前版本使用简单的边缘模糊</p>
            </div>
          </div>

          <!-- 移除背景模式 -->
          <div v-if="mode === 'remove'" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">移除纯色背景</h3>

            <div class="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                v-model="settings.useColorPicker"
                class="rounded"
              >
              <label class="text-sm">使用取色器选择要移除的颜色</label>
            </div>

            <div v-if="settings.useColorPicker">
              <label class="text-xs text-muted-foreground mb-1 block">点击图片选择颜色</label>
              <div class="flex gap-2 items-center">
                <div
                  class="w-12 h-10 rounded border cursor-pointer"
                  :style="{ backgroundColor: settings.targetColor }"
                  @click="$refs.colorInput.click()"
                ></div>
                <input
                  ref="colorInput"
                  v-model="settings.targetColor"
                  type="color"
                  class="opacity-0 absolute"
                  @input="applySettings"
                >
                <input
                  v-model="settings.targetColor"
                  type="text"
                  class="flex-1 p-2 border border-border rounded-lg text-sm font-mono"
                  @input="applySettings"
                >
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>颜色容差</label>
                <span>{{ settings.colorTolerance }}</span>
              </div>
              <input
                v-model.number="settings.colorTolerance"
                type="range"
                min="0"
                max="150"
                class="w-full"
                @input="applySettings"
              >
              <p class="text-xs text-muted-foreground mt-1">容差越大，移除的颜色范围越广</p>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>边缘羽化</label>
                <span>{{ settings.featherAmount }}px</span>
              </div>
              <input
                v-model.number="settings.featherAmount"
                type="range"
                min="0"
                max="20"
                class="w-full"
                @input="applySettings"
              >
            </div>

            <div class="bg-background p-3 rounded text-xs text-muted-foreground">
              <p class="font-medium text-foreground mb-1">提示：</p>
              <p>• 适合移除纯白或纯色背景</p>
              <p>• 复杂背景建议使用专业抠图工具</p>
            </div>
          </div>

          <!-- 透明度调整 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex justify-between text-sm mb-2">
              <label>图片透明度</label>
              <span class="text-muted-foreground">{{ Math.round(settings.opacity * 100) }}%</span>
            </div>
            <input
              v-model.number="settings.opacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="w-full"
              @input="applySettings"
            >
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
          <!-- 原图对比 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">原图</span>
            </div>
            <img :src="imageUrl" class="max-w-full h-auto rounded-lg" alt="原图" />
          </div>

          <!-- 处理后图片 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">处理后</span>
              <span v-if="mode === 'remove'" class="text-xs bg-muted px-2 py-1 rounded">棋盘格表示透明</span>
            </div>
            <div class="relative">
              <canvas
                ref="canvas"
                class="max-w-full h-auto rounded-lg"
                :style="{ backgroundImage: mode === 'remove' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : '', backgroundSize: mode === 'remove' ? '20px 20px' : '', backgroundPosition: mode === 'remove' ? '0 0, 0 10px, 10px -10px, -10px 0px' : '' }"
              ></canvas>
            </div>
          </div>

          <!-- 下载按钮 -->
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
      <h3 class="font-medium text-sm mb-2">使用说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div>
          <p class="font-medium text-foreground mb-1">更换颜色</p>
          <p>为图片添加纯色背景，支持自定义颜色和透明度</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">背景模糊</p>
          <p>模糊图片背景，突出主体内容</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">移除背景</p>
          <p>移除纯色背景，生成透明图片</p>
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
const colorInput = ref(null)
const canvas = ref(null)
const imageUrl = ref('')
const mode = ref('replace')
const originalFile = ref(null)

const presetColors = [
  '#ffffff', '#000000', '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
]

const settings = ref({
  backgroundColor: '#ffffff',
  backgroundOpacity: 1,
  blurAmount: 10,
  opacity: 1,
  useColorPicker: false,
  targetColor: '#ffffff',
  colorTolerance: 30,
  featherAmount: 2
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
    canvas.value.width = img.naturalWidth
    canvas.value.height = img.naturalHeight

    const s = settings.value

    if (mode.value === 'replace') {
      // 绘制背景颜色
      ctx.fillStyle = hexToRgba(s.backgroundColor, s.backgroundOpacity)
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

      // 绘制图片
      ctx.globalAlpha = s.opacity
      ctx.drawImage(img, 0, 0)
      ctx.globalAlpha = 1

    } else if (mode.value === 'blur') {
      // 简单的边缘模糊效果
      const blurRadius = Math.min(s.blurAmount, Math.min(img.naturalWidth, img.naturalHeight) / 4)

      // 绘制模糊背景
      ctx.filter = `blur(${blurRadius}px)`
      ctx.drawImage(img, 0, 0)
      ctx.filter = 'none'

      // 绘制清晰中心区域（模拟主体）
      const margin = blurRadius * 2
      ctx.globalAlpha = s.opacity
      ctx.drawImage(
        img,
        margin * img.naturalWidth / img.naturalHeight / 2,
        margin * img.naturalHeight / img.naturalWidth / 2,
        img.naturalWidth - margin * img.naturalWidth / img.naturalHeight,
        img.naturalHeight - margin * img.naturalHeight / img.naturalWidth,
        margin * img.naturalWidth / img.naturalHeight / 2,
        margin * img.naturalHeight / img.naturalWidth / 2,
        img.naturalWidth - margin * img.naturalWidth / img.naturalHeight,
        img.naturalHeight - margin * img.naturalHeight / img.naturalWidth
      )
      ctx.globalAlpha = 1

    } else if (mode.value === 'remove') {
      // 移除指定颜色
      const imageData = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)
      const data = imageData.data

      const targetRGB = hexToRgb(s.targetColor)
      const tolerance = s.colorTolerance

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const distance = Math.sqrt(
          Math.pow(r - targetRGB.r, 2) +
          Math.pow(g - targetRGB.g, 2) +
          Math.pow(b - targetRGB.b, 2)
        )

        if (distance <= tolerance) {
          // 完全透明
          data[i + 3] = 0
        } else if (distance <= tolerance + s.featherAmount * 10) {
          // 羽化边缘
          const alpha = Math.min(255, (distance - tolerance) / (s.featherAmount * 10) * 255)
          data[i + 3] = Math.max(0, Math.min(255, data[i + 3] * (alpha / 255)))
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // 应用整体透明度
      ctx.globalAlpha = s.opacity
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.value.width
      tempCanvas.height = canvas.value.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(canvas.value, 0, 0)

      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
      ctx.drawImage(tempCanvas, 0, 0)
      ctx.globalAlpha = 1
    }
  }
  img.src = imageUrl.value
}

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const hexToRgb = (hex) => {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }
}

const resetSettings = () => {
  mode.value = 'replace'
  settings.value = {
    backgroundColor: '#ffffff',
    backgroundOpacity: 1,
    blurAmount: 10,
    opacity: 1,
    useColorPicker: false,
    targetColor: '#ffffff',
    colorTolerance: 30,
    featherAmount: 2
  }
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

  const suffix = mode.value === 'remove' ? '_nobg' : mode.value === 'blur' ? '_blur' : '_bg'
  link.download = `${name}${suffix}.png`
  link.click()
}

useSeoMeta({
  title: '图片背景处理 - 在线背景更换移除工具',
  description: '免费在线图片背景处理工具，支持更换背景颜色、背景模糊效果、移除纯色背景生成透明图片。',
  keywords: ['图片背景', '背景移除', '背景更换', '透明背景', 'background', 'remove', 'blur', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片背景处理工具')
</script>
