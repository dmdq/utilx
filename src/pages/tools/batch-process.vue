<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">批量图片处理工具</h1>
      <p class="text-muted-foreground">批量调整图片尺寸、格式、质量，支持多种操作</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和设置 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">添加图片</h2>
          <div class="flex gap-2">
            <button @click="clearAll" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
          </div>
        </div>

        <!-- 上传区域 -->
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
        <div v-if="files.length > 0" class="bg-muted p-4 rounded-lg space-y-2">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-sm">文件列表 ({{ files.length }}张)</h3>
            <button @click="removeAll" class="px-2 py-1 text-xs bg-background hover:bg-muted rounded">移除全部</button>
          </div>
          <div class="max-h-64 overflow-auto space-y-1">
            <div
              v-for="(file, index) in files"
              :key="index"
              class="flex items-center gap-2 p-2 bg-background rounded text-xs"
            >
              <img :src="file.url" class="w-10 h-10 object-cover rounded" alt="预览">
              <div class="flex-1 min-w-0">
                <div class="truncate">{{ file.name }}</div>
                <div class="text-muted-foreground">{{ file.width }}x{{ file.height }} | {{ formatSize(file.size) }}</div>
              </div>
              <button @click="removeFile(index)" class="p-1 hover:bg-red-500 hover:text-white rounded">✕</button>
            </div>
          </div>
        </div>

        <!-- 处理设置 -->
        <div v-if="files.length > 0" class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">处理设置</h3>

          <!-- 尺寸调整 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">调整尺寸</label>
            <select v-model="settings.sizeMode" class="w-full p-2 border border-border rounded text-sm">
              <option value="original">保持原始尺寸</option>
              <option value="max-width">限制最大宽度</option>
              <option value="max-height">限制最大高度</option>
              <option value="fit">适应尺寸</option>
              <option value="fill">填充尺寸</option>
              <option value="exact">精确尺寸</option>
            </select>

            <div v-if="settings.sizeMode !== 'original'" class="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">宽度 (px)</label>
                <input v-model.number="settings.width" type="number" min="1" class="w-full p-2 border border-border rounded text-sm">
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">高度 (px)</label>
                <input v-model.number="settings.height" type="number" min="1" class="w-full p-2 border border-border rounded text-sm">
              </div>
            </div>

            <div v-if="settings.sizeMode !== 'original'" class="mt-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="settings.maintainAspect" class="rounded">
                <span class="text-sm">保持宽高比</span>
              </label>
            </div>
          </div>

          <!-- 格式转换 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">输出格式</label>
            <select v-model="settings.format" class="w-full p-2 border border-border rounded text-sm">
              <option value="original">保持原始格式</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <!-- 质量设置 -->
          <div v-if="settings.format === 'jpeg' || settings.format === 'webp'">
            <div class="flex justify-between text-xs mb-1">
              <label>图片质量</label>
              <span>{{ settings.quality }}%</span>
            </div>
            <input
              v-model.number="settings.quality"
              type="range"
              min="1"
              max="100"
              class="w-full"
            >
          </div>

          <!-- 其他操作 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">其他操作</label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="settings.rotate" class="rounded">
                <span class="text-sm">自动旋转 (根据EXIF)</span>
              </label>
              <label v-if="settings.format === 'jpeg'" class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="settings.stripMetadata" class="rounded">
                <span class="text-sm">移除元数据 (EXIF)</span>
              </label>
            </div>
          </div>

          <!-- 文件命名 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">文件命名</label>
            <select v-model="settings.naming" class="w-full p-2 border border-border rounded text-sm">
              <option value="original">保持原文件名</option>
              <option value="suffix">添加后缀</option>
              <option value="prefix">添加前缀</option>
              <option value="number">数字序号</option>
            </select>

            <div v-if="settings.naming === 'suffix'" class="mt-2">
              <input v-model="settings.suffix" type="text" placeholder="_processed" class="w-full p-2 border border-border rounded text-sm">
            </div>

            <div v-if="settings.naming === 'prefix'" class="mt-2">
              <input v-model="settings.prefix" type="text" placeholder="processed_" class="w-full p-2 border border-border rounded text-sm">
            </div>

            <div v-if="settings.naming === 'number'" class="mt-2">
              <input v-model.number="settings.startNumber" type="number" min="1" placeholder="1" class="w-full p-2 border border-border rounded text-sm">
            </div>
          </div>
        </div>

        <!-- 处理进度 -->
        <div v-if="isProcessing" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">处理进度</h3>
          <div class="text-xs text-muted-foreground mb-2">
            {{ progress.current }} / {{ progress.total }}
          </div>
          <div class="w-full bg-background rounded-full h-2">
            <div
              class="bg-primary h-2 rounded-full transition-all"
              :style="{ width: `${(progress.current / progress.total) * 100}%` }"
            ></div>
          </div>
          <div class="text-xs text-muted-foreground mt-2">
            {{ progress.currentFileName }}
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">处理预览</h2>

        <div v-if="files.length === 0" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          添加图片后开始批量处理
        </div>

        <div v-else class="space-y-4">
          <!-- 处理按钮 -->
          <button
            @click="processImages"
            :disabled="isProcessing"
            class="w-full p-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isProcessing">处理中...</span>
            <span v-else>开始批量处理 ({{ files.length }} 张)</span>
          </button>

          <!-- 处理结果 -->
          <div v-if="processedFiles.length > 0" class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm text-muted-foreground">处理结果</span>
              <button @click="downloadAll" class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">
                下载全部
              </button>
            </div>
            <div class="space-y-2 max-h-96 overflow-auto">
              <div
                v-for="(file, index) in processedFiles"
                :key="index"
                class="flex items-center gap-3 p-2 bg-background rounded"
              >
                <img :src="file.preview" class="w-16 h-16 object-cover rounded" alt="预览">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ file.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ file.width }}x{{ file.height }} | {{ formatSize(file.size) }}
                  </div>
                </div>
                <button @click="downloadFile(file)" class="px-3 py-1 text-sm bg-background hover:bg-muted rounded">
                  下载
                </button>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div v-if="processedFiles.length > 0" class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">统计信息</h3>
            <div class="text-xs text-muted-foreground space-y-1">
              <p>处理数量: {{ processedFiles.length }} 张</p>
              <p>总大小: {{ formatSize(totalSize) }}</p>
              <p>输出格式: {{ settings.format === 'original' ? '保持原格式' : settings.format.toUpperCase() }}</p>
            </div>
          </div>

          <!-- 快速设置 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">快速预设</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="applyPreset('web')" class="p-2 bg-background rounded hover:bg-muted text-xs">
                网页图片<br>
                <span class="text-muted-foreground">最大1200px, 80%</span>
              </button>
              <button @click="applyPreset('thumbnail')" class="p-2 bg-background rounded hover:bg-muted text-xs">
                缩略图<br>
                <span class="text-muted-foreground">最大300px, 70%</span>
              </button>
              <button @click="applyPreset('social')" class="p-2 bg-background rounded hover:bg-muted text-xs">
                社交媒体<br>
                <span class="text-muted-foreground">1080x1080, 85%</span>
              </button>
              <button @click="applyPreset('print')" class="p-2 bg-background rounded hover:bg-muted text-xs">
                打印<br>
                <span class="text-muted-foreground">300DPI, PNG</span>
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
const files = ref([])
const processedFiles = ref([])
const isProcessing = ref(false)
const progress = ref({ current: 0, total: 0, currentFileName: '' })

const settings = ref({
  sizeMode: 'original',
  width: 1200,
  height: 1200,
  maintainAspect: true,
  format: 'original',
  quality: 80,
  rotate: false,
  stripMetadata: false,
  naming: 'original',
  suffix: '_processed',
  prefix: 'processed_',
  startNumber: 1
})

const totalSize = computed(() => {
  return processedFiles.value.reduce((sum, file) => sum + file.size, 0)
})

const handleFileSelect = (event) => {
  const fileList = Array.from(event.target.files || []).filter(f => f.type.startsWith('image/'))
  fileList.forEach(file => loadFile(file))
}

const handleDrop = (event) => {
  const fileList = Array.from(event.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
  fileList.forEach(file => loadFile(file))
}

const loadFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        files.value.push({
          file,
          url: e.target.result,
          name: file.name,
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight
        })
        resolve()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const removeAll = () => {
  files.value = []
  processedFiles.value = []
}

const clearAll = () => {
  removeAll()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const applyPreset = (preset) => {
  switch (preset) {
    case 'web':
      settings.value.sizeMode = 'max-width'
      settings.value.width = 1200
      settings.value.height = 1200
      settings.value.quality = 80
      settings.value.format = 'jpeg'
      break
    case 'thumbnail':
      settings.value.sizeMode = 'fit'
      settings.value.width = 300
      settings.value.height = 300
      settings.value.quality = 70
      settings.value.format = 'jpeg'
      break
    case 'social':
      settings.value.sizeMode = 'exact'
      settings.value.width = 1080
      settings.value.height = 1080
      settings.value.quality = 85
      settings.value.format = 'jpeg'
      break
    case 'print':
      settings.value.sizeMode = 'original'
      settings.value.quality = 100
      settings.value.format = 'png'
      break
  }
}

const processImages = async () => {
  if (files.value.length === 0) return

  isProcessing.value = true
  processedFiles.value = []
  progress.value = { current: 0, total: files.value.length, currentFileName: '' }

  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i]
    progress.value.currentFileName = file.name

    try {
      const processed = await processImage(file, i)
      processedFiles.value.push(processed)
    } catch (error) {
      console.error('处理失败:', file.name, error)
    }

    progress.value.current = i + 1
  }

  isProcessing.value = false
}

const processImage = (file, index) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let width = img.naturalWidth
      let height = img.naturalHeight

      // 计算目标尺寸
      const s = settings.value
      if (s.sizeMode === 'max-width' && width > s.width) {
        height = (height * s.width) / width
        width = s.width
      } else if (s.sizeMode === 'max-height' && height > s.height) {
        width = (width * s.height) / height
        height = s.height
      } else if (s.sizeMode === 'fit') {
        const ratio = Math.min(s.width / width, s.height / height)
        if (ratio < 1) {
          width *= ratio
          height *= ratio
        }
      } else if (s.sizeMode === 'fill') {
        const ratio = Math.max(s.width / width, s.height / height)
        width *= ratio
        height *= ratio
      } else if (s.sizeMode === 'exact') {
        width = s.width
        height = s.height
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // 确定输出格式
      let outputFormat = s.format
      if (outputFormat === 'original') {
        outputFormat = file.file.type === 'image/png' ? 'png' : 'jpeg'
      }

      // 生成文件名
      let fileName = file.name
      const dotIndex = fileName.lastIndexOf('.')
      const baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName
      const ext = outputFormat === 'png' ? 'png' : outputFormat === 'webp' ? 'webp' : 'jpg'

      if (s.naming === 'suffix') {
        fileName = `${baseName}${s.suffix}.${ext}`
      } else if (s.naming === 'prefix') {
        fileName = `${s.prefix}${baseName}.${ext}`
      } else if (s.naming === 'number') {
        fileName = `${String(s.startNumber + index).padStart(4, '0')}.${ext}`
      } else {
        fileName = `${baseName}.${ext}`
      }

      canvas.toBlob((blob) => {
        resolve({
          name: fileName,
          size: blob.size,
          width: Math.round(width),
          height: Math.round(height),
          url: URL.createObjectURL(blob),
          preview: canvas.toDataURL()
        })
      }, `image/${outputFormat}`, s.quality / 100)
    }
    img.onerror = reject
    img.src = file.url
  })
}

const downloadFile = (file) => {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name
  link.click()
}

const downloadAll = () => {
  processedFiles.value.forEach((file, index) => {
    setTimeout(() => downloadFile(file), index * 200)
  })
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

useSeoMeta({
  title: '批量图片处理 - 在线批量图片处理工具',
  description: '免费在线批量图片处理工具，支持批量调整尺寸、转换格式、压缩质量。',
  keywords: ['批量处理', '批量转换', '批量压缩', 'batch process', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('批量图片处理工具')
</script>
