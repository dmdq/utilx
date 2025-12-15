<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片格式转换</h1>
      <p class="text-muted-foreground">支持多种图片格式之间的相互转换，批量处理</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：上传列表 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">图片列表</h2>

          <!-- 上传按钮 -->
          <div
            class="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer mb-4"
            @drop="handleDrop"
            @dragover.prevent
            @dragleave.prevent
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              multiple
              @change="handleFileSelect"
            />
            <Plus class="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm">点击或拖拽添加图片</p>
          </div>

          <!-- 图片列表 -->
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(image, index) in images"
              :key="image.id"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg group"
            >
              <img
                :src="image.preview"
                :alt="image.name"
                class="w-12 h-12 object-cover rounded"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ image.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ image.format }} • {{ formatFileSize(image.size) }}
                </p>
              </div>
              <button
                @click="removeImage(index)"
                class="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 批量操作 -->
          <div v-if="images.length > 0" class="mt-4 pt-4 border-t space-y-2">
            <button
              @click="clearAll"
              class="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/5 rounded-md transition-colors"
            >
              清空列表
            </button>
            <p class="text-xs text-muted-foreground text-center">
              共 {{ images.length }} 张图片
            </p>
          </div>
        </div>

        <!-- 转换设置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">转换设置</h2>

          <div class="space-y-4">
            <!-- 目标格式 -->
            <div>
              <label class="text-sm font-medium">目标格式</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="format in formats"
                  :key="format.value"
                  @click="targetFormat = format.value"
                  :class="[
                    'p-3 rounded-lg border transition-all',
                    targetFormat === format.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">{{ format.icon }}</span>
                    <div class="text-left">
                      <div class="font-medium text-sm">{{ format.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ format.ext }}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- JPEG质量 -->
            <div v-if="targetFormat === 'jpeg'">
              <label class="text-sm font-medium">JPEG质量</label>
              <div class="mt-2 space-y-2">
                <div class="flex justify-between text-sm">
                  <span>质量</span>
                  <span class="font-mono">{{ jpegQuality }}%</span>
                </div>
                <input
                  v-model="jpegQuality"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="w-full"
                />
              </div>
            </div>

            <!-- PNG设置 -->
            <div v-if="targetFormat === 'png'">
              <label class="flex items-center gap-2">
                <input
                  v-model="pngOptimized"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">优化压缩</span>
              </label>
            </div>

            <!-- 高级选项 -->
            <details>
              <summary class="text-sm font-medium cursor-pointer">高级选项</summary>
              <div class="mt-3 space-y-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="keepOriginal"
                    type="checkbox"
                    class="rounded"
                  />
                  <span class="text-sm">保持原始尺寸</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="autoRename"
                    type="checkbox"
                    class="rounded"
                    checked
                  />
                  <span class="text-sm">自动重命名</span>
                </label>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- 右侧：转换结果 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 转换预览 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">转换预览</h2>

          <div v-if="images.length === 0" class="text-center py-12 text-muted-foreground">
            <ImageIcon class="w-16 h-16 mx-auto mb-4" />
            <p>请添加图片开始转换</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 转换按钮 -->
            <div class="flex justify-center">
              <button
                @click="startConversion"
                :disabled="isConverting"
                class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw v-if="isConverting" class="w-4 h-4 animate-spin" />
                {{ isConverting ? '转换中...' : '开始转换' }}
              </button>
            </div>

            <!-- 图片对比 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(image, index) in images" :key="image.id" class="space-y-2">
                <h3 class="text-sm font-medium">{{ image.name }}</h3>

                <div class="grid grid-cols-2 gap-2">
                  <!-- 原图 -->
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">原图 ({{ image.format }})</p>
                    <div class="relative group">
                      <img
                        :src="image.preview"
                        :alt="image.name"
                        class="w-full h-32 object-cover rounded border"
                      />
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ image.width }}×{{ image.height }} • {{ formatFileSize(image.size) }}
                    </p>
                  </div>

                  <!-- 转换后 -->
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">
                      转换后 ({{ formats.find(f => f.value === targetFormat)?.name }})
                    </p>
                    <div class="relative group">
                      <div
                        v-if="image.convertedUrl"
                        class="relative"
                      >
                        <img
                          :src="image.convertedUrl"
                          :alt="image.name"
                          class="w-full h-32 object-cover rounded border"
                        />
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <button
                            @click="downloadImage(image)"
                            class="p-2 bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <Download class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div
                        v-else
                        class="w-full h-32 bg-muted rounded flex items-center justify-center"
                      >
                        <span class="text-sm text-muted-foreground">
                          {{ isConverting ? '转换中...' : '等待转换' }}
                        </span>
                      </div>
                    </div>
                    <p v-if="image.convertedSize" class="text-xs text-muted-foreground mt-1">
                      {{ image.convertedWidth }}×{{ image.convertedHeight }} • {{ formatFileSize(image.convertedSize) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量下载 -->
        <div v-if="hasConvertedImages" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">批量下载</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="downloadAllAsZip"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Archive class="w-4 h-4" />
              下载为ZIP
            </button>
            <button
              @click="downloadAll"
              class="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" />
              逐个下载
            </button>
          </div>
        </div>

        <!-- 格式说明 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">格式说明</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="format in formats"
              :key="format.value"
              class="p-4 border rounded-lg"
            >
              <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">{{ format.icon }}</span>
                <h3 class="font-medium">{{ format.name }}</h3>
              </div>
              <p class="text-sm text-muted-foreground">{{ format.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用说明
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">支持的格式</h4>
            <p class="mb-2">输入格式：JPG/JPEG、PNG、WebP、GIF、BMP、TIFF、ICO</p>
            <p>输出格式：JPG、PNG、WebP、AVIF（实验性）、GIF、BMP</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">使用提示</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>支持批量转换，可同时处理多张图片</li>
              <li>JPG适合照片，有损压缩但文件较小</li>
              <li>PNG支持透明通道，适合图标和截图</li>
              <li>WebP格式在保持画质的同时有更好的压缩率</li>
              <li>转换后可批量下载为ZIP文件</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/image-compress"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Zap class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片压缩</p>
              <p class="text-xs text-muted-foreground">在线压缩图片</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/image-resize"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Maximize2 class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片尺寸调整</p>
              <p class="text-xs text-muted-foreground">调整图片尺寸</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/base64-image"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64图片</p>
              <p class="text-xs text-muted-foreground">图片与Base64互转</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, Plus, X, ImageIcon, RefreshCw, Download, Archive, Zap, Maximize2, Hash, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'
// JSZip 将在需要时动态导入

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const images = ref([])
const targetFormat = ref('webp')
const jpegQuality = ref(90)
const pngOptimized = ref(false)
const keepOriginal = ref(true)
const autoRename = ref(true)
const isConverting = ref(false)
const fileInput = ref(null)

// 支持的格式
const formats = [
  {
    value: 'jpeg',
    name: 'JPEG',
    ext: '.jpg',
    icon: '🖼️',
    description: '适合照片，有损压缩，文件小'
  },
  {
    value: 'png',
    name: 'PNG',
    ext: '.png',
    icon: '🗺️',
    description: '支持透明，无损压缩，适合图标'
  },
  {
    value: 'webp',
    name: 'WebP',
    ext: '.webp',
    icon: '🌐',
    description: '新一代格式，高压缩率，支持动画'
  },
  {
    value: 'avif',
    name: 'AVIF',
    ext: '.avif',
    icon: '🎨',
    description: '最新格式，超高压缩率，实验性支持'
  },
  {
    value: 'gif',
    name: 'GIF',
    ext: '.gif',
    icon: '🎬',
    description: '支持动画，256色，适合简单图像'
  },
  {
    value: 'bmp',
    name: 'BMP',
    ext: '.bmp',
    icon: '📋',
    description: '无压缩位图，文件较大'
  }
]

// 计算属性
const hasConvertedImages = computed(() => {
  return images.value.some(img => img.convertedUrl)
})

// 处理文件选择
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
}

// 处理拖拽
const handleDrop = (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

// 处理文件
const processFiles = (files) => {
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const imageObj = {
          id: Date.now() + Math.random(),
          name: file.name,
          file,
          preview: e.target.result,
          size: file.size,
          format: file.type.split('/')[1].toUpperCase(),
          width: img.width,
          height: img.height,
          convertedUrl: null,
          convertedSize: null,
          convertedWidth: null,
          convertedHeight: null
        }
        images.value.push(imageObj)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 移除图片
const removeImage = (index) => {
  const image = images.value[index]
  if (image.convertedUrl) {
    URL.revokeObjectURL(image.convertedUrl)
  }
  images.value.splice(index, 1)
}

// 清空列表
const clearAll = () => {
  images.value.forEach(img => {
    if (img.convertedUrl) {
      URL.revokeObjectURL(img.convertedUrl)
    }
  })
  images.value = []
}

// 开始转换
const startConversion = async () => {
  isConverting.value = true

  for (const image of images.value) {
    await convertImage(image)
  }

  isConverting.value = false
}

// 转换单张图片
const convertImage = (image) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.onload = () => {
      canvas.width = keepOriginal.value ? image.width : img.width
      canvas.height = keepOriginal.value ? image.height : img.height

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const mimeType = getMimeType(targetFormat.value)
      const quality = targetFormat.value === 'jpeg' ? jpegQuality.value / 100 : undefined

      canvas.toBlob((blob) => {
        if (image.convertedUrl) {
          URL.revokeObjectURL(image.convertedUrl)
        }

        const url = URL.createObjectURL(blob)
        image.convertedUrl = url
        image.convertedSize = blob.size
        image.convertedWidth = canvas.width
        image.convertedHeight = canvas.height

        resolve()
      }, mimeType, quality)
    }
    img.src = image.preview
  })
}

// 获取MIME类型
const getMimeType = (format) => {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    bmp: 'image/bmp'
  }
  return mimeTypes[format] || 'image/jpeg'
}

// 下载单张图片
const downloadImage = (image) => {
  const a = document.createElement('a')
  a.href = image.convertedUrl
  const ext = formats.find(f => f.value === targetFormat.value)?.ext
  const name = autoRename.value
    ? `${image.name.split('.')[0]}_converted${ext}`
    : image.name.split('.')[0] + ext
  a.download = name
  a.click()
}

// 下载所有图片
const downloadAll = async () => {
  for (const image of images.value) {
    if (image.convertedUrl) {
      await new Promise(resolve => {
        setTimeout(() => {
          downloadImage(image)
          resolve()
        }, 100)
      })
    }
  }
}

// 下载为ZIP
const downloadAllAsZip = async () => {
  // 动态导入 JSZip
  const JSZip = await import('jszip')
  const zip = new JSZip.default()

  for (const image of images.value) {
    if (image.convertedUrl) {
      const response = await fetch(image.convertedUrl)
      const blob = await response.blob()
      const ext = formats.find(f => f.value === targetFormat.value)?.ext
      const name = autoRename.value
        ? `${image.name.split('.')[0]}_converted${ext}`
        : image.name.split('.')[0] + ext
      zip.file(name, blob)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted_images_${targetFormat.value.toUpperCase()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value.click()
}

// SEO配置
useSeoMeta({
  title: '图片格式转换 - 在线图片格式转换工具',
  description: '免费在线图片格式转换工具，支持JPG、PNG、WebP、GIF等格式互转，批量处理，保持高质量。',
  keywords: ['图片格式转换', '图片转WebP', 'JPG转PNG', '格式转换', '在线工具']
})

definePageMeta({
  layout: 'default'
})
</script>