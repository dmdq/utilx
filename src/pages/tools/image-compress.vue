<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片压缩</h1>
      <p class="text-muted-foreground">在线压缩图片，支持多种格式和质量调节</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传区域 -->
      <div class="space-y-4">
        <div class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">上传图片</h2>

          <!-- 拖拽上传区域 -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            :class="{ 'border-primary bg-primary/5': isDragging }"
            @drop="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
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
            <ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p class="text-lg font-medium mb-2">拖拽图片到这里上传</p>
            <p class="text-sm text-muted-foreground mb-4">或者点击选择文件</p>
            <p class="text-xs text-muted-foreground">支持 JPG、PNG、WebP、GIF 格式</p>
          </div>

          <!-- 快速示例 -->
          <div class="mt-4">
            <p class="text-sm font-medium mb-2">快速示例</p>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="sample in sampleImages"
                :key="sample.id"
                @click="loadSampleImage(sample)"
                class="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              >
                <img :src="sample.url" :alt="sample.name" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>

        <!-- 压缩设置 -->
        <div class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">压缩设置</h2>

          <div class="space-y-4">
            <!-- 质量调节 -->
            <div>
              <label class="text-sm font-medium">压缩质量</label>
              <div class="mt-2 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">质量</span>
                  <span class="text-sm font-mono">{{ quality }}%</span>
                </div>
                <input
                  v-model="quality"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="w-full"
                  @input="updateCompressedImages"
                />
              </div>
            </div>

            <!-- 格式选择 -->
            <div>
              <label class="text-sm font-medium">输出格式</label>
              <select
                v-model="outputFormat"
                class="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                @change="updateCompressedImages"
              >
                <option value="original">保持原格式</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="avif">AVIF (实验性)</option>
              </select>
            </div>

            <!-- 预设选项 -->
            <div>
              <label class="text-sm font-medium">快速预设</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="preset in qualityPresets"
                  :key="preset.name"
                  @click="applyPreset(preset)"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- 高级选项 -->
            <details class="mt-4">
              <summary class="text-sm font-medium cursor-pointer">高级选项</summary>
              <div class="mt-3 space-y-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="removeMetadata"
                    type="checkbox"
                    class="rounded"
                    @change="updateCompressedImages"
                  />
                  <span class="text-sm">移除EXIF元数据</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="progressive"
                    type="checkbox"
                    class="rounded"
                    @change="updateCompressedImages"
                  />
                  <span class="text-sm">渐进式JPEG</span>
                </label>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-4">
        <!-- 压缩统计 -->
        <div v-if="images.length > 0" class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">压缩统计</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">原始大小</div>
              <div class="text-xl font-bold">{{ formatFileSize(originalSize) }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">压缩后大小</div>
              <div class="text-xl font-bold text-primary">{{ formatFileSize(compressedSize) }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">节省空间</div>
              <div class="text-xl font-bold text-green-600">{{ savedSize }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">压缩率</div>
              <div class="text-xl font-bold text-blue-600">{{ compressionRatio }}%</div>
            </div>
          </div>
        </div>

        <!-- 图片预览对比 -->
        <div v-if="images.length > 0" class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">预览对比</h2>

          <!-- 分页控制 -->
          <div v-if="images.length > 1" class="mb-4">
            <div class="flex items-center justify-between">
              <button
                @click="currentIndex = Math.max(0, currentIndex - 1)"
                :disabled="currentIndex === 0"
                class="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ChevronLeft class="w-5 h-5" />
              </button>
              <span class="text-sm text-muted-foreground">
                {{ currentIndex + 1 }} / {{ images.length }}
              </span>
              <button
                @click="currentIndex = Math.min(images.length - 1, currentIndex + 1)"
                :disabled="currentIndex === images.length - 1"
                class="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- 当前图片信息 -->
          <div v-if="currentImage" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- 原图 -->
              <div>
                <h3 class="text-sm font-medium mb-2">原图</h3>
                <div class="relative group">
                  <img
                    :src="currentImage.originalUrl"
                    :alt="currentImage.name"
                    class="w-full rounded-lg border"
                  />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      @click="downloadOriginal(currentImage)"
                      class="px-4 py-2 bg-white text-black rounded-md hover:bg-muted transition-colors"
                    >
                      下载原图
                    </button>
                  </div>
                </div>
                <div class="mt-2 text-xs text-muted-foreground">
                  {{ currentImage.originalWidth }} × {{ currentImage.originalHeight }} • {{ formatFileSize(currentImage.originalSize) }}
                </div>
              </div>

              <!-- 压缩后 -->
              <div>
                <h3 class="text-sm font-medium mb-2">压缩后</h3>
                <div class="relative group">
                  <img
                    v-if="currentImage.compressedUrl"
                    :src="currentImage.compressedUrl"
                    :alt="currentImage.name"
                    class="w-full rounded-lg border"
                  />
                  <div
                    v-if="currentImage.compressedUrl"
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                  >
                    <button
                      @click="downloadCompressed(currentImage)"
                      class="px-4 py-2 bg-white text-black rounded-md hover:bg-muted transition-colors"
                    >
                      下载压缩图
                    </button>
                  </div>
                  <div v-else class="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <span class="text-muted-foreground">压缩中...</span>
                  </div>
                </div>
                <div v-if="currentImage.compressedSize" class="mt-2 text-xs text-muted-foreground">
                  {{ currentImage.compressedWidth }} × {{ currentImage.compressedHeight }} • {{ formatFileSize(currentImage.compressedSize) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量操作 -->
        <div v-if="images.length > 0" class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">批量操作</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="downloadAll"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" />
              下载所有
            </button>
            <button
              @click="clearAll"
              class="px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 class="w-4 h-4" />
              清空所有
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card border border-border  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用说明
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">支持的格式</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>输入：JPG、PNG、WebP、GIF、BMP、TIFF</li>
              <li>输出：JPG、PNG、WebP、AVIF（实验性）</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">压缩提示</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>质量越低，文件越小，但画质损失越大</li>
              <li>JPG适合照片，PNG适合透明图像</li>
              <li>WebP格式在保持画质的同时有更好的压缩率</li>
              <li>移除EXIF可以进一步减小文件大小</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/image-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <RefreshCw class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片格式转换</p>
              <p class="text-xs text-muted-foreground">转换图片格式</p>
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
import { ref, computed, watch } from 'vue'
import { Info, ImageIcon, ChevronLeft, ChevronRight, Download, Trash2, RefreshCw, Maximize2, Hash, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const images = ref([])
const currentIndex = ref(0)
const isDragging = ref(false)
const quality = ref(80)
const outputFormat = ref('original')
const removeMetadata = ref(true)
const progressive = ref(false)
const fileInput = ref(null)

// 示例图片
const sampleImages = [
  { id: 1, name: '示例1', url: 'https://picsum.photos/400/300?random=1' },
  { id: 2, name: '示例2', url: 'https://picsum.photos/400/300?random=2' },
  { id: 3, name: '示例3', url: 'https://picsum.photos/400/300?random=3' },
  { id: 4, name: '示例4', url: 'https://picsum.photos/400/300?random=4' }
]

// 质量预设
const qualityPresets = [
  { name: '高清', quality: 95 },
  { name: '标准', quality: 80 },
  { name: '平衡', quality: 60 },
  { name: '高速', quality: 40 }
]

// 计算属性
const currentImage = computed(() => images.value[currentIndex.value] || null)

const originalSize = computed(() => {
  return images.value.reduce((total, img) => total + img.originalSize, 0)
})

const compressedSize = computed(() => {
  return images.value.reduce((total, img) => total + (img.compressedSize || 0), 0)
})

const savedSize = computed(() => {
  const saved = originalSize.value - compressedSize.value
  return formatFileSize(saved)
})

const compressionRatio = computed(() => {
  if (originalSize.value === 0) return 0
  return Math.round((1 - compressedSize.value / originalSize.value) * 100)
})

// 处理文件选择
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
}

// 处理拖拽
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

// 处理文件
const processFiles = async (files) => {
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  for (const file of imageFiles) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const imageObj = {
          id: Date.now() + Math.random(),
          name: file.name,
          file,
          originalUrl: e.target.result,
          originalSize: file.size,
          originalWidth: img.width,
          originalHeight: img.height,
          compressedUrl: null,
          compressedSize: null,
          compressedWidth: null,
          compressedHeight: null
        }
        images.value.push(imageObj)
        compressImage(imageObj)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 压缩图片
const compressImage = async (imageObj) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = imageObj.originalWidth
  canvas.height = imageObj.originalHeight

  ctx.drawImage(imageObj.file ? await loadImage(imageObj.file) : new Image(), 0, 0)

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    imageObj.compressedUrl = url
    imageObj.compressedSize = blob.size
    imageObj.compressedWidth = canvas.width
    imageObj.compressedHeight = canvas.height
  }, getOutputMimeType(), quality.value / 100)
}

// 加载图片
const loadImage = (file) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = URL.createObjectURL(file)
  })
}

// 获取输出MIME类型
const getOutputMimeType = () => {
  const format = outputFormat.value
  if (format === 'original') return 'image/jpeg'
  if (format === 'png') return 'image/png'
  if (format === 'webp') return 'image/webp'
  if (format === 'avif') return 'image/avif'
  return 'image/jpeg'
}

// 更新压缩图片
const updateCompressedImages = () => {
  images.value.forEach(img => {
    if (img.compressedUrl) {
      URL.revokeObjectURL(img.compressedUrl)
    }
    compressImage(img)
  })
}

// 应用预设
const applyPreset = (preset) => {
  quality.value = preset.quality
  updateCompressedImages()
}

// 加载示例图片
const loadSampleImage = async (sample) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    canvas.toBlob((blob) => {
      const file = new File([blob], `${sample.name}.jpg`, { type: 'image/jpeg' })
      const imageObj = {
        id: Date.now() + Math.random(),
        name: sample.name,
        file,
        originalUrl: sample.url,
        originalSize: blob.size,
        originalWidth: img.width,
        originalHeight: img.height,
        compressedUrl: null,
        compressedSize: null,
        compressedWidth: null,
        compressedHeight: null
      }
      images.value.push(imageObj)
      compressImage(imageObj)
    }, 'image/jpeg', 0.9)
  }
  img.src = sample.url
}

// 下载原图
const downloadOriginal = (image) => {
  const a = document.createElement('a')
  a.href = image.originalUrl
  a.download = `original_${image.name}`
  a.click()
}

// 下载压缩图
const downloadCompressed = (image) => {
  const a = document.createElement('a')
  a.href = image.compressedUrl
  a.download = `compressed_${image.name.split('.')[0]}.${getOutputExtension()}`
  a.click()
}

// 获取输出扩展名
const getOutputExtension = () => {
  const format = outputFormat.value
  if (format === 'original') return 'jpg'
  return format
}

// 下载所有
const downloadAll = async () => {
  for (const image of images.value) {
    if (image.compressedUrl) {
      await new Promise(resolve => {
        setTimeout(() => {
          downloadCompressed(image)
          resolve()
        }, 100)
      })
    }
  }
}

// 清空所有
const clearAll = () => {
  images.value.forEach(img => {
    if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl)
  })
  images.value = []
  currentIndex.value = 0
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
  title: '图片压缩 - 在线图片压缩工具',
  description: '免费在线图片压缩工具，支持JPG、PNG、WebP格式，可自定义压缩质量，保持画质的同时减小文件大小。',
  keywords: ['图片压缩', '在线压缩', 'JPG压缩', 'PNG压缩', '图片优化', '图片大小']
})



// 清理
watch(images, (newImages) => {
  if (newImages.length === 0) return

  // 监听 currentIndex 变化，自动清理超出范围的 URL
  newImages.forEach((img, index) => {
    if (index !== currentIndex.value && img.compressedUrl) {
      // 保留当前和相邻图片的压缩URL
      if (Math.abs(index - currentIndex.value) > 2) {
        URL.revokeObjectURL(img.compressedUrl)
        img.compressedUrl = null
        img.compressedSize = null
      }
    }
  })
})
</script>