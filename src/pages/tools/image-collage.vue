<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">拼图制作器</h1>
      <p class="text-muted-foreground">多张图片拼接成网格拼图，支持自定义布局和背景</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：上传和管理 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">添加图片</h2>
          <button @click="clearAll" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
        </div>

        <div
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="hidden"
          >
          <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">拖拽多张图片到此处</p>
          <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
            选择文件
          </button>
        </div>

        <!-- 已添加图片列表 -->
        <div v-if="images.length > 0" class="bg-muted p-4 rounded-lg space-y-2">
          <h3 class="font-medium text-sm mb-2">已添加 ({{ images.length }}张)</h3>
          <div class="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
            <div
              v-for="(img, index) in images"
              :key="index"
              class="relative group aspect-square"
            >
              <img :src="img.url" class="w-full h-full object-cover rounded border-2" alt="图片">
              <button
                @click="removeImage(index)"
                class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >✕</button>
              <div class="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">{{ index + 1 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：布局设置 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">布局设置</h2>

        <!-- 布局模式 -->
        <div class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm mb-2">布局模式</h3>
          <select v-model="layoutMode" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
            <option value="grid-2x2">2x2 网格</option>
            <option value="grid-3x3">3x3 网格</option>
            <option value="grid-4x4">4x4 网格</option>
            <option value="horizontal">横向排列</option>
            <option value="vertical">纵向排列</option>
          </select>

          <!-- 间距设置 -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <label>图片间距</label>
              <span class="text-muted-foreground">{{ gap }}px</span>
            </div>
            <input
              v-model.number="gap"
              type="range"
              min="0"
              max="50"
              @input="updatePreview"
              class="w-full"
            >
          </div>

          <!-- 圆角设置 -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <label>圆角大小</label>
              <span class="text-muted-foreground">{{ borderRadius }}px</span>
            </div>
            <input
              v-model.number="borderRadius"
              type="range"
              min="0"
              max="50"
              @input="updatePreview"
              class="w-full"
            >
          </div>

          <!-- 背景颜色 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">背景颜色</label>
            <div class="flex gap-2">
              <input
                v-model="backgroundColor"
                type="color"
                @input="updatePreview"
                class="w-12 h-8 rounded cursor-pointer"
              >
              <input
                v-model="backgroundColor"
                type="text"
                @input="updatePreview"
                class="flex-1 p-2 border border-border rounded text-sm font-mono"
              >
            </div>
          </div>

          <!-- 宽高比 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">输出比例</label>
            <select v-model="aspectRatio" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
              <option value="1:1">1:1 (正方形)</option>
              <option value="4:3">4:3 (标准)</option>
              <option value="16:9">16:9 (宽屏)</option>
              <option value="auto">自动适应</option>
            </select>
          </div>
        </div>

        <!-- 预设布局 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">快速布局</h3>
          <div class="grid grid-cols-2 gap-2">
            <button @click="applyLayout('row-2')" class="p-2 bg-background rounded hover:bg-muted text-xs">2张横排</button>
            <button @click="applyLayout('col-2')" class="p-2 bg-background rounded hover:bg-muted text-xs">2张竖排</button>
            <button @click="applyLayout('row-3')" class="p-2 bg-background rounded hover:bg-muted text-xs">3张横排</button>
            <button @click="applyLayout('col-3')" class="p-2 bg-background rounded hover:bg-muted text-xs">3张竖排</button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">拼图预览</h2>

        <div v-if="images.length === 0" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          添加图片后生成拼图
        </div>

        <div v-else class="space-y-4">
          <!-- 预览画布 -->
          <div class="bg-muted rounded-lg p-4">
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
            ></canvas>
          </div>

          <!-- 输出信息 -->
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-2">输出信息</h3>
            <div class="text-xs text-muted-foreground space-y-1">
              <p>图片数量: {{ images.length }} 张</p>
              <p>输出尺寸: {{ outputSize.width }} x {{ outputSize.height }} px</p>
              <p>布局模式: {{ layoutModeText }}</p>
            </div>
          </div>

          <!-- 下载选项 -->
          <div class="space-y-2">
            <button @click="downloadImage" class="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Download class="w-5 h-5 inline mr-2" />
              下载拼图
            </button>
            <button
              v-if="images.length >= 2"
              @click="downloadImages"
              class="w-full p-3 bg-background border rounded-lg hover:bg-muted"
            >
              单独下载所有图片
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useSeoMeta } from '#app'
import { Upload, Download } from 'lucide-vue-next'

const fileInput = ref(null)
const canvas = ref(null)
const images = ref([])
const layoutMode = ref('grid-3x3')
const gap = ref(10)
const borderRadius = ref(0)
const backgroundColor = ref('#ffffff')
const aspectRatio = ref('1:1')

const layoutModeText = computed(() => {
  const modes = {
    'grid-2x2': '2x2 网格',
    'grid-3x3': '3x3 网格',
    'grid-4x4': '4x4 网格',
    'horizontal': '横向排列',
    'vertical': '纵向排列'
  }
  return modes[layoutMode.value] || layoutMode.value
})

const outputSize = computed(() => {
  if (!canvas.value) return { width: 0, height: 0 }
  return { width: canvas.value.width, height: canvas.value.height }
})

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || []).filter(f => f.type.startsWith('image/'))
  files.forEach(file => loadImage(file))
}

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
  files.forEach(file => loadImage(file))
}

const loadImage = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    images.value.push({
      url: e.target.result,
      file,
      name: file.name
    })
    nextTick(() => updatePreview())
  }
  reader.readAsDataURL(file)
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  updatePreview()
}

const clearAll = () => {
  images.value = []
}

const applyLayout = (layout) => {
  if (layout === 'row-2' || layout === 'row-3') {
    layoutMode.value = 'horizontal'
  } else if (layout === 'col-2' || layout === 'col-3') {
    layoutMode.value = 'vertical'
  }
  updatePreview()
}

const updatePreview = () => {
  if (!canvas.value || images.value.length === 0) return

  const ctx = canvas.value.getContext('2d')

  // 计算布局
  let rows = 1
  let cols = 1

  if (layoutMode.value === 'grid-2x2') {
    rows = cols = 2
  } else if (layoutMode.value === 'grid-3x3') {
    rows = cols = 3
  } else if (layoutMode.value === 'grid-4x4') {
    rows = cols = 4
  } else if (layoutMode.value === 'horizontal') {
    rows = 1
    cols = images.value.length
  } else if (layoutMode.value === 'vertical') {
    rows = images.value.length
    cols = 1
  }

  // 计算每个单元格的大小
  const cellWidth = 500
  const cellHeight = aspectRatio.value === 'auto' ? 500 : aspectRatio.value === '16:9' ? 281 : aspectRatio.value === '4:3' ? 375 : 500

  const canvasWidth = cols * cellWidth + (cols + 1) * gap.value
  const canvasHeight = rows * cellHeight + (rows + 1) * gap.value

  canvas.value.width = canvasWidth
  canvas.value.height = canvasHeight

  // 绘制背景
  ctx.fillStyle = backgroundColor.value
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 绘制图片
  for (let i = 0; i < Math.min(images.value.length, rows * cols); i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = gap.value + col * (cellWidth + gap.value)
    const y = gap.value + row * (cellHeight + gap.value)

    const img = images.value[i]
    const image = new Image()
    image.onload = () => {
      // 计算缩放以填充单元格
      const scaleX = cellWidth / image.naturalWidth
      const scaleY = cellHeight / image.naturalHeight
      const scale = Math.max(scaleX, scaleY)

      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      const offsetX = (cellWidth - width) / 2
      const offsetY = (cellHeight - height) / 2

      ctx.save()

      // 圆角裁剪
      if (borderRadius.value > 0) {
        ctx.beginPath()
        ctx.roundRect(x, y, cellWidth, cellHeight, borderRadius.value)
        ctx.clip()
      }

      ctx.drawImage(image, x + offsetX, y + offsetY, width, height)
      ctx.restore()
    }
    image.src = img.url
  }
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')
  link.download = `collage_${images.value.length}images.png`
  link.click()
}

const downloadImages = () => {
  images.value.forEach((img, index) => {
    setTimeout(() => {
      const link = document.createElement('a')
      link.href = img.url
      link.download = `image_${index + 1}.${img.file.name.split('.').pop() || 'png'}`
      link.click()
    }, index * 200)
  })
}

useSeoMeta({
  title: '拼图制作器 - 在线图片拼接工具',
  description: '免费在线拼图制作器，支持多张图片网格拼接、自定义布局和背景，生成美观的拼图。',
  keywords: ['拼图', '图片拼接', '照片墙', 'collage', 'grid', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('拼图制作器')
</script>
