<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">双色调效果工具</h1>
      <p class="text-muted-foreground">为图片添加双色调效果，创建艺术化的单色风格</p>
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
          <!-- 预设风格 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">预设风格</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in duotonePresets"
                :key="preset.name"
                @click="applyPreset(preset)"
                class="p-3 bg-background rounded hover:bg-muted transition-colors text-center"
              >
                <div class="flex gap-1 mb-2">
                  <div class="w-6 h-6 rounded" :style="{ backgroundColor: preset.light }"></div>
                  <div class="w-6 h-6 rounded" :style="{ backgroundColor: preset.dark }"></div>
                </div>
                <div class="text-xs">{{ preset.name }}</div>
              </button>
            </div>
          </div>

          <!-- 颜色设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">自定义颜色</h3>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">浅色 (高光)</label>
              <div class="flex gap-2">
                <input
                  v-model="lightColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="lightColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">深色 (阴影)</label>
              <div class="flex gap-2">
                <input
                  v-model="darkColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="darkColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
            </div>

            <!-- 交换颜色 -->
            <button @click="swapColors" class="w-full p-2 bg-background hover:bg-muted rounded text-sm">
              交换颜色
            </button>
          </div>

          <!-- 高级设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">高级设置</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>对比度</label>
                <span>{{ contrast }}%</span>
              </div>
              <input
                v-model.number="contrast"
                type="range"
                min="-100"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>亮度</label>
                <span>{{ brightness }}%</span>
              </div>
              <input
                v-model.number="brightness"
                type="range"
                min="-100"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>饱和度</label>
                <span>{{ saturation }}%</span>
              </div>
              <input
                v-model.number="saturation"
                type="range"
                min="-100"
                max="100"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="preserveAlpha" @change="updatePreview" class="rounded">
              <span class="text-sm">保留透明通道</span>
            </label>
          </div>

          <!-- 混合模式 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">混合模式</h3>
            <select v-model="blendMode" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
              <option value="normal">正常</option>
              <option value="multiply">正片叠底</option>
              <option value="screen">滤色</option>
              <option value="overlay">叠加</option>
              <option value="soft-light">柔光</option>
              <option value="hard-light">强光</option>
              <option value="color-dodge">颜色减淡</option>
              <option value="color-burn">颜色加深</option>
            </select>
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

          <!-- 双色调效果 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">双色调效果</span>
            </div>
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
            ></canvas>
          </div>

          <!-- 颜色条预览 -->
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-2">色调范围</h3>
            <div
              class="w-full h-8 rounded"
              :style="{ background: `linear-gradient(to right, ${darkColor}, ${lightColor})` }"
            ></div>
            <div class="flex justify-between text-xs mt-1">
              <span>{{ darkColor }}</span>
              <span>{{ lightColor }}</span>
            </div>
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

const lightColor = ref('#FFFFFF')
const darkColor = ref('#000000')
const contrast = ref(0)
const brightness = ref(0)
const saturation = ref(0)
const preserveAlpha = ref(true)
const blendMode = ref('normal')

const duotonePresets = [
  { name: '经典黑白', light: '#FFFFFF', dark: '#000000' },
  { name: '蓝色科技', light: '#E3F2FD', dark: '#1565C0' },
  { name: '温暖橙色', light: '#FFF3E0', dark: '#E65100' },
  { name: '复古棕色', light: '#D7CCC8', dark: '#5D4037' },
  { name: '清新绿色', light: '#E8F5E9', dark: '#2E7D32' },
  { name: '优雅紫色', light: '#F3E5F5', dark: '#6A1B9A' },
  { name: '金色奢华', light: '#FFFDE7', dark: '#FF8F00' },
  { name: '青色海洋', light: '#E0F7FA', dark: '#006064' },
  { name: '粉色浪漫', light: '#FCE4EC', dark: '#880E4F' }
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
    canvas.value.width = img.naturalWidth
    canvas.value.height = img.naturalHeight

    // 绘制原图
    ctx.drawImage(img, 0, 0)

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height)
    const data = imageData.data

    // 解析颜色
    const lightRGB = hexToRgb(lightColor.value)
    const darkRGB = hexToRgb(darkColor.value)

    // 应用双色调效果
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // 跳过透明像素
      if (!preserveAlpha.value && a < 10) continue

      // 计算亮度
      let luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255

      // 应用亮度调整
      luminance = luminance * (1 + brightness.value / 100)
      luminance = Math.max(0, Math.min(1, luminance))

      // 应用对比度
      const factor = (259 * (contrast.value + 255)) / (255 * (259 - contrast.value))
      luminance = factor * (luminance - 0.5) + 0.5
      luminance = Math.max(0, Math.min(1, luminance))

      // 应用饱和度
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      const satFactor = 1 + saturation.value / 100
      const sr = gray + (r - gray) * satFactor
      const sg = gray + (g - gray) * satFactor
      const sb = gray + (b - gray) * satFactor

      // 根据亮度混合两种颜色
      const tr = lightRGB.r + (darkRGB.r - lightRGB.r) * luminance
      const tg = lightRGB.g + (darkRGB.g - lightRGB.g) * luminance
      const tb = lightRGB.b + (darkRGB.b - lightRGB.b) * luminance

      // 应用混合模式
      if (blendMode.value === 'multiply') {
        data[i] = Math.min(255, (sr * tr) / 255)
        data[i + 1] = Math.min(255, (sg * tg) / 255)
        data[i + 2] = Math.min(255, (sb * tb) / 255)
      } else if (blendMode.value === 'screen') {
        data[i] = Math.min(255, 255 - ((255 - sr) * (255 - tr)) / 255)
        data[i + 1] = Math.min(255, 255 - ((255 - sg) * (255 - tg)) / 255)
        data[i + 2] = Math.min(255, 255 - ((255 - sb) * (255 - tb)) / 255)
      } else {
        data[i] = tr
        data[i + 1] = tg
        data[i + 2] = tb
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }
  img.src = imageUrl.value
}

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

const applyPreset = (preset) => {
  lightColor.value = preset.light
  darkColor.value = preset.dark
  updatePreview()
}

const swapColors = () => {
  const temp = lightColor.value
  lightColor.value = darkColor.value
  darkColor.value = temp
  updatePreview()
}

const resetSettings = () => {
  lightColor.value = '#FFFFFF'
  darkColor.value = '#000000'
  contrast.value = 0
  brightness.value = 0
  saturation.value = 0
  preserveAlpha.value = true
  blendMode.value = 'normal'
  updatePreview()
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName

  link.download = `${name}_duotone.png`
  link.click()
}

useSeoMeta({
  title: '双色调效果 - 在线图片双色调工具',
  description: '免费在线双色调效果工具，为图片添加艺术化的双色效果，支持多种预设和自定义颜色。',
  keywords: ['双色调', 'duotone', '单色效果', '图片调色', '色彩处理', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('双色调效果工具')
</script>
