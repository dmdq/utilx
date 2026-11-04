<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片分割工具</h1>
      <p class="text-muted-foreground">将图片分割成九宫格、自定义行列，支持切片下载</p>
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
          <!-- 分割模式 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">分割模式</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="splitMode = 'grid'"
                :class="['p-3 rounded text-sm transition-colors', splitMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                <Grid3x3 class="w-5 h-5 mx-auto mb-1" />
                网格分割
              </button>
              <button
                @click="splitMode = 'custom'"
                :class="['p-3 rounded text-sm transition-colors', splitMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                <Settings class="w-5 h-5 mx-auto mb-1" />
                自定义行列
              </button>
            </div>
          </div>

          <!-- 网格分割设置 -->
          <div v-if="splitMode === 'grid'" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">快速预设</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in gridPresets"
                :key="preset.name"
                @click="applyGridPreset(preset)"
                class="p-3 bg-background rounded hover:bg-muted transition-colors text-center"
              >
                <div class="text-xs font-medium">{{ preset.name }}</div>
                <div class="text-xs text-muted-foreground">{{ preset.rows }}x{{ preset.cols }}</div>
              </button>
            </div>
          </div>

          <!-- 自定义分割设置 -->
          <div v-if="splitMode === 'custom'" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">自定义行列</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <label>行数</label>
                  <span class="text-muted-foreground">{{ rows }}</span>
                </div>
                <input
                  v-model.number="rows"
                  type="range"
                  min="1"
                  max="10"
                  class="w-full"
                  @input="splitImage"
                >
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <label>列数</label>
                  <span class="text-muted-foreground">{{ cols }}</span>
                </div>
                <input
                  v-model.number="cols"
                  type="range"
                  min="1"
                  max="10"
                  class="w-full"
                  @input="splitImage"
                >
              </div>
            </div>

            <!-- 手动输入 -->
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="text-xs text-muted-foreground mb-1 block">行数</label>
                <input
                  v-model.number="rows"
                  type="number"
                  min="1"
                  max="20"
                  class="w-full p-2 border border-border rounded-lg text-sm"
                  @input="splitImage"
                >
              </div>
              <div class="flex-1">
                <label class="text-xs text-muted-foreground mb-1 block">列数</label>
                <input
                  v-model.number="cols"
                  type="number"
                  min="1"
                  max="20"
                  class="w-full p-2 border border-border rounded-lg text-sm"
                  @input="splitImage"
                >
              </div>
            </div>
          </div>

          <!-- 输出设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">输出设置</h3>

            <!-- 文件命名 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">文件名格式</label>
              <input
                v-model="namingPattern"
                type="text"
                class="w-full p-2 border border-border rounded-lg text-sm font-mono"
                placeholder="{name}_row{row}_col{col}"
                @input="updatePreview"
              >
              <p class="text-xs text-muted-foreground mt-1">变量: {name}=原文件名, {row}=行号, {col}=列号</p>
            </div>

            <!-- 输出格式 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">输出格式</label>
              <select v-model="outputFormat" class="w-full p-2 border border-border rounded-lg text-sm">
                <option value="png">PNG (推荐)</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <!-- 显示网格线 -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="showGridLines"
                @change="updatePreview"
                class="rounded"
              >
              <span class="text-sm">显示分割线预览</span>
            </label>
          </div>

          <!-- 原图信息 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">原图信息</h3>
            <div class="text-sm text-muted-foreground space-y-1">
              <p>尺寸: {{ imageInfo.width }} x {{ imageInfo.height }} px</p>
              <p>分割: {{ rows }} 行 x {{ cols }} 列 = {{ rows * cols }} 张</p>
              <p v-if="splitImages.length > 0">单张尺寸: {{ singleSize.width }} x {{ singleSize.height }} px</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">分割预览</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后查看分割效果
        </div>

        <div v-else class="space-y-4">
          <!-- 分割预览 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">分割预览</span>
              <span class="text-xs text-muted-foreground">{{ rows * cols }} 张图片</span>
            </div>
            <div class="relative inline-block">
              <img :src="previewUrl" class="max-w-full h-auto rounded-lg" alt="预览" />
              <!-- 网格线覆盖 -->
              <svg
                v-if="showGridLines"
                class="absolute top-0 left-0 w-full h-full pointer-events-none"
                :viewBox="`0 0 ${imageInfo.width} ${imageInfo.height}`"
              >
                <!-- 垂直线 -->
                <line
                  v-for="i in cols - 1"
                  :key="`v-${i}`"
                  :x1="(imageInfo.width / cols) * i"
                  :y1="0"
                  :x2="(imageInfo.width / cols) * i"
                  :y2="imageInfo.height"
                  stroke="red"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                />
                <!-- 水平线 -->
                <line
                  v-for="i in rows - 1"
                  :key="`h-${i}`"
                  :x1="0"
                  :y1="(imageInfo.height / rows) * i"
                  :x2="imageInfo.width"
                  :y2="(imageInfo.height / rows) * i"
                  stroke="red"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                />
              </svg>
            </div>
          </div>

          <!-- 分割结果 -->
          <div v-if="splitImages.length > 0" class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm text-muted-foreground">分割结果</span>
              <button
                @click="downloadAll"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                下载全部
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
              <div
                v-for="(img, index) in splitImages"
                :key="index"
                class="relative group"
              >
                <img :src="img.url" class="w-full h-auto rounded border" alt="分割图片">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <button
                    @click="downloadSingle(index)"
                    class="px-2 py-1 bg-primary text-primary-foreground text-xs rounded"
                  >
                    下载
                  </button>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b text-center">
                  {{ getFileName(index) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 下载选项 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">下载选项</h3>
            <div class="space-y-2">
              <button
                @click="downloadAll"
                :disabled="splitImages.length === 0"
                class="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download class="w-5 h-5 inline mr-2" />
                下载全部 ({{ splitImages.length }} 张)
              </button>
              <button
                @click="downloadAsZip"
                :disabled="splitImages.length === 0"
                class="w-full p-3 bg-background border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive class="w-5 h-5 inline mr-2" />
                打包为 ZIP
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
import { Upload, Download, Grid3x3, Settings, Archive } from 'lucide-vue-next'

const fileInput = ref(null)
const imageUrl = ref('')
const previewUrl = ref('')
const splitMode = ref('grid')
const rows = ref(3)
const cols = ref(3)
const splitImages = ref([])
const namingPattern = ref('{name}_row{row}_col{col}')
const outputFormat = ref('png')
const showGridLines = ref(true)
const originalFile = ref(null)
const imageInfo = ref({ width: 0, height: 0 })

const gridPresets = [
  { name: '九宫格', rows: 3, cols: 3 },
  { name: '四宫格', rows: 2, cols: 2 },
  { name: '十六宫格', rows: 4, cols: 4 },
  { name: '2x3', rows: 2, cols: 3 },
  { name: '3x4', rows: 3, cols: 4 },
  { name: '2x1', rows: 2, cols: 1 }
]

const singleSize = computed(() => {
  if (imageInfo.value.width === 0) return { width: 0, height: 0 }
  return {
    width: Math.floor(imageInfo.value.width / cols.value),
    height: Math.floor(imageInfo.value.height / rows.value)
  }
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
  reader.onload = (e) => {
    imageUrl.value = e.target.result
    previewUrl.value = e.target.result

    const img = new Image()
    img.onload = () => {
      imageInfo.value = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      splitImage()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const splitImage = () => {
  if (!imageUrl.value) return

  const img = new Image()
  img.onload = () => {
    const pieceWidth = img.naturalWidth / cols.value
    const pieceHeight = img.naturalHeight / rows.value
    const results = []

    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
        const canvas = document.createElement('canvas')
        canvas.width = pieceWidth
        canvas.height = pieceHeight
        const ctx = canvas.getContext('2d')

        ctx.drawImage(
          img,
          col * pieceWidth,
          row * pieceHeight,
          pieceWidth,
          pieceHeight,
          0,
          0,
          pieceWidth,
          pieceHeight
        )

        results.push({
          url: canvas.toDataURL(`image/${outputFormat.value}`),
          row,
          col,
          canvas
        })
      }
    }

    splitImages.value = results
  }
  img.src = imageUrl.value
}

const applyGridPreset = (preset) => {
  rows.value = preset.rows
  cols.value = preset.cols
  splitMode.value = 'grid'
  splitImage()
}

const updatePreview = () => {
  // 预览更新
}

const getFileName = (index) => {
  const img = splitImages.value[index]
  const name = originalFile.value?.name || 'image'
  const dotIndex = name.lastIndexOf('.')
  const baseName = dotIndex > 0 ? name.substring(0, dotIndex) : name

  return namingPattern.value
    .replace('{name}', baseName)
    .replace('{row}', img.row + 1)
    .replace('{col}', img.col + 1)
}

const downloadSingle = (index) => {
  const img = splitImages.value[index]
  const fileName = getFileName(index) + '.' + outputFormat.value

  const link = document.createElement('a')
  link.href = img.url
  link.download = fileName
  link.click()
}

const downloadAll = () => {
  splitImages.value.forEach((_, index) => {
    setTimeout(() => downloadSingle(index), index * 200)
  })
}

const downloadAsZip = () => {
  // 简化版本：逐个下载
  // 实际项目中可以使用 JSZip 库
  downloadAll()
}

const resetSettings = () => {
  rows.value = 3
  cols.value = 3
  splitMode.value = 'grid'
  namingPattern.value = '{name}_row{row}_col{col}'
  outputFormat.value = 'png'
  showGridLines.value = true
  splitImage()
}

const clearImage = () => {
  imageUrl.value = ''
  previewUrl.value = ''
  splitImages.value = []
  imageInfo.value = { width: 0, height: 0 }
  originalFile.value = null
  resetSettings()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

useSeoMeta({
  title: '图片分割 - 在线图片九宫格分割工具',
  description: '免费在线图片分割工具，支持九宫格分割、自定义行列分割，批量下载切片图片。',
  keywords: ['图片分割', '九宫格', '切片', 'split', 'grid', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片分割工具')
</script>
