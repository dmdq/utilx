<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片配色方案提取工具</h1>
      <p class="text-muted-foreground">从图片中提取配色方案，生成和谐的色彩组合</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传图片</h2>
          <button @click="clearImage" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
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
          <!-- 图片预览 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">图片预览</h3>
            <img :src="imageUrl" class="max-w-full h-auto rounded-lg" alt="预览">
          </div>

          <!-- 提取设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">提取设置</h3>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>颜色数量</label>
                <span>{{ colorCount }}</span>
              </div>
              <input
                v-model.number="colorCount"
                type="range"
                min="3"
                max="12"
                @input="extractColors"
                class="w-full"
              >
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">配色方案</label>
              <select v-model="paletteType" @change="extractColors" class="w-full p-2 border border-border rounded text-sm">
                <option value="dominant">主色调</option>
                <option value="vibrant">鲜艳色</option>
                <option value="muted">柔和色</option>
                <option value="light">浅色调</option>
                <option value="dark">深色调</option>
                <option value="complementary">互补色</option>
                <option value="analogous">相邻色</option>
              </select>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showHex" class="rounded">
              <span class="text-sm">显示HEX代码</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showRgb" class="rounded">
              <span class="text-sm">显示RGB值</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 右侧：配色方案 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">配色方案</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后提取配色方案
        </div>

        <div v-else class="space-y-4">
          <!-- 主色板 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-medium text-sm">主色板</h3>
              <button @click="copyPalette" class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                复制配色
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(color, index) in palette"
                :key="index"
                class="cursor-pointer group"
                @click="copyColor(color.hex)"
              >
                <div
                  class="w-full aspect-square rounded-lg mb-2 relative"
                  :style="{ backgroundColor: color.hex }"
                >
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs">
                    点击复制
                  </div>
                </div>
                <div class="text-xs space-y-1">
                  <div v-if="showHex" class="font-mono">{{ color.hex }}</div>
                  <div v-if="showRgb" class="text-muted-foreground">rgb({{ color.rgb.join(', ') }})</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 色彩变体 -->
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-3">色彩变体</h3>
            <div v-for="(color, index) in palette.slice(0, 3)" :key="index" class="mb-4">
              <p class="text-xs text-muted-foreground mb-2">{{ color.hex }} 的变体</p>
              <div class="grid grid-cols-5 gap-2">
                <div
                  v-for="(shade, shadeIndex) in color.shades"
                  :key="shadeIndex"
                  class="cursor-pointer"
                  @click="copyColor(shade)"
                >
                  <div
                    class="w-full aspect-square rounded mb-1"
                    :style="{ backgroundColor: shade }"
                  ></div>
                  <div class="text-xs font-mono text-center">{{ shade }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 渐变色 -->
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-3">渐变色组合</h3>
            <div class="space-y-3">
              <div
                v-for="(gradient, index) in gradients"
                :key="index"
                class="relative"
              >
                <div
                  class="w-full h-16 rounded-lg cursor-pointer"
                  :style="{ background: gradient.css }"
                  @click="copyGradient(gradient)"
                ></div>
                <div class="text-xs mt-1 text-muted-foreground">{{ gradient.css }}</div>
              </div>
            </div>
          </div>

          <!-- 色彩信息 -->
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-2">色彩分析</h3>
            <div class="text-xs text-muted-foreground space-y-1">
              <p>主色调: {{ dominantColor }}</p>
              <p>色温: {{ colorTemperature }}</p>
              <p>亮度: {{ brightnessLevel }}</p>
              <p>饱和度: {{ saturationLevel }}</p>
            </div>
          </div>

          <!-- 导出选项 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">导出</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="exportAsCSS" class="p-2 bg-background hover:bg-muted rounded text-xs">
                导出 CSS
              </button>
              <button @click="exportAsJSON" class="p-2 bg-background hover:bg-muted rounded text-xs">
                导出 JSON
              </button>
              <button @click="exportAsASE" class="p-2 bg-background hover:bg-muted rounded text-xs">
                导出 ASE
              </button>
              <button @click="exportAsImage" class="p-2 bg-background hover:bg-muted rounded text-xs">
                导出图片
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import { Upload } from 'lucide-vue-next'

const fileInput = ref(null)
const imageUrl = ref('')
const palette = ref([])
const colorCount = ref(6)
const paletteType = ref('dominant')
const showHex = ref(true)
const showRgb = ref(false)

const dominantColor = computed(() => {
  return palette.value[0]?.hex || '#000000'
})

const colorTemperature = computed(() => {
  const color = palette.value[0]
  if (!color) return '未知'

  const [r, g, b] = color.rgb
  if (r > b && g > b) return '暖色'
  if (b > r && b > g) return '冷色'
  return '中性'
})

const brightnessLevel = computed(() => {
  const color = palette.value[0]
  if (!color) return '未知'

  const [r, g, b] = color.rgb
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  if (brightness > 200) return '明亮'
  if (brightness > 128) return '适中'
  return '深沉'
})

const saturationLevel = computed(() => {
  const color = palette.value[0]
  if (!color) return '未知'

  const [r, g, b] = color.rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = (max - min) / max

  if (saturation > 0.6) return '高饱和'
  if (saturation > 0.3) return '中饱和'
  return '低饱和'
})

const gradients = computed(() => {
  if (palette.value.length < 2) return []

  const result = []
  for (let i = 0; i < Math.min(3, palette.value.length - 1); i++) {
    result.push({
      css: `linear-gradient(135deg, ${palette.value[i].hex}, ${palette.value[i + 1].hex})`,
      colors: [palette.value[i].hex, palette.value[i + 1].hex]
    })
  }
  return result
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
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
    extractColors()
  }
  reader.readAsDataURL(file)
}

const extractColors = () => {
  if (!imageUrl.value) return

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 缩小图片以加快处理
    const maxSize = 150
    let width = img.naturalWidth
    let height = img.naturalHeight

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width
        width = maxSize
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height
        height = maxSize
      }
    }

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 提取颜色
    const colorMap = new Map()

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (a < 128) continue // 跳过透明像素

      // 量化颜色
      const quantize = (value) => Math.round(value / 16) * 16
      const qr = quantize(r)
      const qg = quantize(g)
      const qb = quantize(b)

      const key = `${qr},${qg},${qb}`
      colorMap.set(key, (colorMap.get(key) || 0) + 1)
    }

    // 排序并选择主要颜色
    let sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount.value * 2)
      .map(([key]) => {
        const [r, g, b] = key.split(',').map(Number)
        return { r, g, b }
      })

    // 根据类型筛选颜色
    palette.value = filterColorsByType(sortedColors, paletteType.value).slice(0, colorCount.value)

    // 为每个颜色生成变体
    palette.value.forEach(color => {
      color.hex = rgbToHex(color.r, color.g, color.b)
      color.rgb = [color.r, color.g, color.b]
      color.shades = generateShades(color.r, color.g, color.b)
    })
  }
  img.src = imageUrl.value
}

const filterColorsByType = (colors, type) => {
  switch (type) {
    case 'vibrant':
      return colors.filter(c => {
        const max = Math.max(c.r, c.g, c.b)
        const min = Math.min(c.r, c.g, c.b)
        return (max - min) / max > 0.4
      })
    case 'muted':
      return colors.filter(c => {
        const max = Math.max(c.r, c.g, c.b)
        const min = Math.min(c.r, c.g, c.b)
        return (max - min) / max <= 0.4
      })
    case 'light':
      return colors.filter(c => (c.r * 299 + c.g * 587 + c.b * 114) / 1000 > 180)
    case 'dark':
      return colors.filter(c => (c.r * 299 + c.g * 587 + c.b * 114) / 1000 < 100)
    default:
      return colors
  }
}

const generateShades = (r, g, b) => {
  const shades = []
  for (let i = 1; i <= 5; i++) {
    const factor = 0.5 + (i * 0.125)
    const nr = Math.min(255, Math.round(r * factor))
    const ng = Math.min(255, Math.round(g * factor))
    const nb = Math.min(255, Math.round(b * factor))
    shades.push(rgbToHex(nr, ng, nb))
  }
  return shades
}

const rgbToHex = (r, g, b) => {
  return `#${String(r).padStart(2, '0')}${String(g).padStart(2, '0')}${String(b).padStart(2, '0')}`.toUpperCase()
}

const clearImage = () => {
  imageUrl.value = ''
  palette.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const copyColor = (hex) => {
  navigator.clipboard.writeText(hex).then(() => {
    alert(`已复制: ${hex}`)
  })
}

const copyPalette = () => {
  const colors = palette.value.map(c => c.hex).join(', ')
  navigator.clipboard.writeText(colors).then(() => {
    alert('配色方案已复制')
  })
}

const copyGradient = (gradient) => {
  navigator.clipboard.writeText(gradient.css).then(() => {
    alert('渐变CSS已复制')
  })
}

const exportAsCSS = () => {
  const css = `:root {\n${palette.value.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}`
  downloadFile('palette.css', css, 'text/css')
}

const exportAsJSON = () => {
  const json = JSON.stringify(palette.value, null, 2)
  downloadFile('palette.json', json, 'application/json')
}

const exportAsASE = () => {
  // ASE 格式简化版
  alert('ASE 格式导出功能开发中')
}

const exportAsImage = () => {
  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size / palette.value.length

  const ctx = canvas.getContext('2d')
  const cellWidth = size / palette.value.length

  palette.value.forEach((color, index) => {
    ctx.fillStyle = color.hex
    ctx.fillRect(index * cellWidth, 0, cellWidth, canvas.height)
  })

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = 'palette.png'
  link.click()
}

const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

useSeoMeta({
  title: '图片配色方案提取 - 在线配色方案工具',
  description: '免费在线配色方案提取工具，从图片中提取和谐的颜色组合，支持多种配色类型。',
  keywords: ['配色方案', '取色器', '色彩提取', 'color palette', '调色板', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片配色方案提取工具')
</script>
