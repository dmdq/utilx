<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片尺寸调整</h1>
      <p class="text-muted-foreground">在线调整图片尺寸，支持像素、百分比和预设尺寸</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：上传和控制 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">上传图片</h2>

          <!-- 拖拽上传 -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
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
              @change="handleFileSelect"
            />
            <ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p class="text-lg font-medium mb-2">拖拽图片到这里</p>
            <p class="text-sm text-muted-foreground">或者点击选择文件</p>
          </div>

          <!-- 图片信息 -->
          <div v-if="image" class="mt-4 p-4 bg-muted rounded-lg">
            <div class="flex items-center gap-3 mb-3">
              <img :src="image.preview" :alt="image.name" class="w-16 h-16 object-cover rounded" />
              <div class="flex-1">
                <p class="font-medium truncate">{{ image.name }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ image.originalWidth }} × {{ image.originalHeight }} px
                </p>
              </div>
            </div>
            <button
              @click="clearImage"
              class="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/5 rounded-md transition-colors"
            >
              移除图片
            </button>
          </div>
        </div>

        <!-- 尺寸设置 -->
        <div v-if="image" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">尺寸设置</h2>

          <div class="space-y-4">
            <!-- 调整模式 -->
            <div>
              <label class="text-sm font-medium">调整模式</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="mode in resizeModes"
                  :key="mode.value"
                  @click="resizeMode = mode.value"
                  :class="[
                    'px-3 py-2 rounded-md transition-colors text-sm',
                    resizeMode === mode.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ mode.name }}
                </button>
              </div>
            </div>

            <!-- 尺寸输入 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">宽度</label>
                <div class="relative">
                  <input
                    v-model.number="width"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 pr-12 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    @input="handleSizeChange"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">px</span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium">高度</label>
                <div class="relative">
                  <input
                    v-model.number="height"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 pr-12 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    @input="handleSizeChange"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">px</span>
                </div>
              </div>
            </div>

            <!-- 百分比调整 -->
            <div>
              <label class="text-sm font-medium">百分比调整</label>
              <div class="mt-2 flex items-center gap-2">
                <input
                  v-model.number="percentage"
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  class="flex-1"
                  @input="handlePercentageChange"
                />
                <span class="text-sm font-mono w-12 text-right">{{ percentage }}%</span>
              </div>
            </div>

            <!-- 锁定比例 -->
            <label class="flex items-center gap-2">
              <input
                v-model="lockAspectRatio"
                type="checkbox"
                class="rounded"
                checked
              />
              <span class="text-sm">锁定宽高比</span>
            </label>

            <!-- 预设尺寸 -->
            <div>
              <label class="text-sm font-medium">常用尺寸</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="preset in sizePresets"
                  :key="preset.name"
                  @click="applyPreset(preset)"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 图片预览 -->
        <div v-if="image" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">预览对比</h2>

          <!-- 缩放控制 -->
          <div class="mb-4 flex items-center gap-4">
            <label class="text-sm font-medium">预览缩放</label>
            <input
              v-model="zoomLevel"
              type="range"
              min="10"
              max="100"
              step="10"
              class="flex-1"
            />
            <span class="text-sm font-mono">{{ zoomLevel }}%</span>
          </div>

          <!-- 对比视图 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- 原图 -->
            <div>
              <h3 class="text-sm font-medium mb-2">原图</h3>
              <div class="border rounded-lg overflow-hidden bg-checkered">
                <img
                  :src="image.preview"
                  :alt="image.name"
                  :style="{
                    width: image.originalWidth * zoomLevel / 100 + 'px',
                    height: 'auto',
                    maxWidth: '100%'
                  }"
                  class="block mx-auto"
                />
              </div>
              <p class="mt-2 text-sm text-muted-foreground">
                {{ image.originalWidth }} × {{ image.originalHeight }} px
              </p>
            </div>

            <!-- 调整后 -->
            <div>
              <h3 class="text-sm font-medium mb-2">调整后</h3>
              <div class="border rounded-lg overflow-hidden bg-checkered">
                <img
                  v-if="resizedUrl"
                  :src="resizedUrl"
                  :alt="image.name"
                  :style="{
                    width: width * zoomLevel / 100 + 'px',
                    height: 'auto',
                    maxWidth: '100%'
                  }"
                  class="block mx-auto"
                />
                <div
                  v-else
                  class="flex items-center justify-center h-64 text-muted-foreground"
                >
                  调整尺寸后预览将显示在这里
                </div>
              </div>
              <p v-if="width && height" class="mt-2 text-sm text-muted-foreground">
                {{ width }} × {{ height }} px
                <span v-if="image.originalWidth !== width || image.originalHeight !== height" class="ml-2 text-primary">
                  ({{ resizedPercentage }})
                </span>
              </p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="mt-6 flex gap-3">
            <button
              @click="applyResize"
              :disabled="!width || !height || isProcessing"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Settings v-if="isProcessing" class="w-4 h-4 animate-spin" />
              {{ isProcessing ? '处理中...' : '应用调整' }}
            </button>
            <button
              v-if="resizedUrl"
              @click="downloadResized"
              class="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center gap-2"
            >
              <Download class="w-4 h-4" />
              下载
            </button>
            <button
              @click="reset"
              class="px-4 py-2 border border-muted text-muted-foreground rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RotateCcw class="w-4 h-4" />
              重置
            </button>
          </div>
        </div>

        <!-- 批量处理 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">批量处理</h2>
          <p class="text-sm text-muted-foreground mb-4">
            上传多张图片，使用相同的设置批量调整尺寸
          </p>

          <div
            class="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer"
            @drop="handleBatchDrop"
            @dragover.prevent
            @dragleave.prevent
            @click="triggerBatchFileInput"
          >
            <input
              ref="batchFileInput"
              type="file"
              class="hidden"
              accept="image/*"
              multiple
              @change="handleBatchSelect"
            />
            <Plus class="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm">添加多张图片</p>
          </div>

          <!-- 批量列表 -->
          <div v-if="batchImages.length > 0" class="mt-4 space-y-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">{{ batchImages.length }} 张图片</span>
              <div class="flex gap-2">
                <button
                  @click="processBatch"
                  :disabled="isProcessingBatch"
                  class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {{ isProcessingBatch ? '处理中...' : '批量处理' }}
                </button>
                <button
                  @click="clearBatch"
                  class="px-3 py-1 text-sm text-destructive hover:bg-destructive/5 rounded-md transition-colors"
                >
                  清空
                </button>
              </div>
            </div>

            <div class="max-h-48 overflow-y-auto space-y-2">
              <div
                v-for="(img, index) in batchImages"
                :key="img.id"
                class="flex items-center gap-3 p-2 bg-muted rounded-lg"
              >
                <img :src="img.preview" :alt="img.name" class="w-10 h-10 object-cover rounded" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ img.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ img.width }} × {{ img.height }} → {{ width || '0' }} × {{ height || '0' }}
                  </p>
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ img.status }}
                </div>
              </div>
            </div>

            <button
              v-if="batchProcessedCount > 0"
              @click="downloadAllBatch"
              class="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              下载所有 ({{ batchProcessedCount }} 张)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card border-rounded p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用说明
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">调整模式说明</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>拉伸</strong>：强制调整到指定尺寸，可能变形</li>
              <li><strong>适应</strong>：保持比例，适应指定尺寸，可能有空白</li>
              <li><strong>裁剪</strong>：保持比例，裁剪到指定尺寸</li>
              <li><strong>填充</strong>：保持比例，填充到指定尺寸</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">使用提示</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>锁定宽高比可保持图片不变形</li>
              <li>支持批量处理，提高效率</li>
              <li>预览功能帮助确认效果</li>
              <li>处理速度取决于图片大小和数量</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/image-crop"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Crop class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片裁剪</p>
              <p class="text-xs text-muted-foreground">在线裁剪图片</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
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
            to="/tools/image-watermark"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Droplet class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片水印</p>
              <p class="text-xs text-muted-foreground">添加文字/图片水印</p>
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
import { Info, ImageIcon, Download, RotateCcw, Settings, Plus, Crop, Zap, Droplet, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'
import JSZip from 'jszip'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const image = ref(null)
const resizedUrl = ref(null)
const width = ref(null)
const height = ref(null)
const resizeMode = ref('fit')
const lockAspectRatio = ref(true)
const percentage = ref(100)
const zoomLevel = ref(50)
const isProcessing = ref(false)
const fileInput = ref(null)
const batchFileInput = ref(null)
const batchImages = ref([])
const isProcessingBatch = ref(false)

// 调整模式
const resizeModes = [
  { value: 'stretch', name: '拉伸' },
  { value: 'fit', name: '适应' },
  { value: 'crop', name: '裁剪' },
  { value: 'fill', name: '填充' }
]

// 预设尺寸
const sizePresets = [
  { name: '16:9 (1920×1080)', width: 1920, height: 1080 },
  { name: '4:3 (1024×768)', width: 1024, height: 768 },
  { name: '1:1 (1080×1080)', width: 1080, height: 1080 },
  { name: '头像 (500×500)', width: 500, height: 500 },
  { name: '缩略图 (150×150)', width: 150, height: 150 },
  { name: '高清 (4K)', width: 3840, height: 2160 }
]

// 计算属性
const resizedPercentage = computed(() => {
  if (!image.value || !width.value || !height.value) return ''
  const areaDiff = (width.value * height.value) / (image.value.originalWidth * image.value.originalHeight)
  return `${(areaDiff * 100).toFixed(1)}%`
})

const batchProcessedCount = computed(() => {
  return batchImages.value.filter(img => img.processedUrl).length
})

// 处理文件选择
const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

// 处理拖拽
const handleDrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

// 处理文件
const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      image.value = {
        name: file.name,
        file,
        preview: e.target.result,
        originalWidth: img.width,
        originalHeight: img.height
      }
      width.value = img.width
      height.value = img.height
      resizedUrl.value = null
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 处理尺寸变化
const handleSizeChange = () => {
  if (!image.value || !lockAspectRatio.value) return

  const aspectRatio = image.value.originalWidth / image.value.originalHeight

  // 根据最后输入的字段调整另一个字段
  if (width.value && !height.value) {
    height.value = Math.round(width.value / aspectRatio)
  } else if (height.value && !width.value) {
    width.value = Math.round(height.value * aspectRatio)
  } else if (width.value && height.value) {
    // 更新百分比
    percentage.value = Math.round((width.value / image.value.originalWidth) * 100)
  }
}

// 处理百分比变化
const handlePercentageChange = () => {
  if (!image.value) return

  const scale = percentage.value / 100
  width.value = Math.round(image.value.originalWidth * scale)
  height.value = Math.round(image.value.originalHeight * scale)
}

// 应用预设
const applyPreset = (preset) => {
  width.value = preset.width
  height.value = preset.height
  if (image.value) {
    percentage.value = Math.round((width.value / image.value.originalWidth) * 100)
  }
}

// 应用调整
const applyResize = async () => {
  if (!image.value || !width.value || !height.value) return

  isProcessing.value = true

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = width.value
  canvas.height = height.value

  const img = new Image()
  img.onload = () => {
    // 根据模式绘制图片
    switch (resizeMode.value) {
      case 'stretch':
        ctx.drawImage(img, 0, 0, width.value, height.value)
        break
      case 'fit':
        const scale = Math.min(width.value / img.width, height.value / img.height)
        const fitWidth = img.width * scale
        const fitHeight = img.height * scale
        ctx.drawImage(img, (width.value - fitWidth) / 2, (height.value - fitHeight) / 2, fitWidth, fitHeight)
        break
      case 'crop':
        const cropScale = Math.max(width.value / img.width, height.value / img.height)
        const cropWidth = img.width * cropScale
        const cropHeight = img.height * cropScale
        ctx.drawImage(img, (width.value - cropWidth) / 2, (height.value - cropHeight) / 2, cropWidth, cropHeight)
        break
      case 'fill':
        ctx.drawImage(img, 0, 0, width.value, height.value)
        break
    }

    canvas.toBlob((blob) => {
      if (resizedUrl.value) {
        URL.revokeObjectURL(resizedUrl.value)
      }
      resizedUrl.value = URL.createObjectURL(blob)
      isProcessing.value = false
    }, 'image/png')
  }
  img.src = image.value.preview
}

// 下载调整后的图片
const downloadResized = () => {
  if (!resizedUrl.value) return

  const a = document.createElement('a')
  a.href = resizedUrl.value
  a.download = `resized_${image.value.name.split('.')[0]}.png`
  a.click()
}

// 重置
const reset = () => {
  if (image.value) {
    width.value = image.value.originalWidth
    height.value = image.value.originalHeight
    percentage.value = 100
    if (resizedUrl.value) {
      URL.revokeObjectURL(resizedUrl.value)
      resizedUrl.value = null
    }
  }
}

// 清空图片
const clearImage = () => {
  if (resizedUrl.value) {
    URL.revokeObjectURL(resizedUrl.value)
  }
  image.value = null
  resizedUrl.value = null
  width.value = null
  height.value = null
  percentage.value = 100
}

// 批量处理相关
const handleBatchSelect = (e) => {
  const files = Array.from(e.target.files)
  processBatchFiles(files)
}

const handleBatchDrop = (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  processBatchFiles(files)
}

const processBatchFiles = (files) => {
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        batchImages.value.push({
          id: Date.now() + Math.random(),
          name: file.name,
          file,
          preview: e.target.result,
          width: img.width,
          height: img.height,
          status: '待处理',
          processedUrl: null
        })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 批量处理
const processBatch = async () => {
  if (!width.value || !height.value) return

  isProcessingBatch.value = true

  for (const batchImg of batchImages.value) {
    batchImg.status = '处理中...'

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = width.value
    canvas.height = height.value

    const img = new Image()
    await new Promise(resolve => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width.value, height.value)

        canvas.toBlob((blob) => {
          batchImg.processedUrl = URL.createObjectURL(blob)
          batchImg.status = '完成'
          resolve()
        }, 'image/png')
      }
      img.src = batchImg.preview
    })
  }

  isProcessingBatch.value = false
}

// 下载所有批量处理的图片
const downloadAllBatch = async () => {
  const zip = new JSZip()

  for (const img of batchImages.value) {
    if (img.processedUrl) {
      const response = await fetch(img.processedUrl)
      const blob = await response.blob()
      zip.file(`resized_${img.name}`, blob)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resized_images_${Date.now()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空批量
const clearBatch = () => {
  batchImages.value.forEach(img => {
    if (img.processedUrl) {
      URL.revokeObjectURL(img.processedUrl)
    }
  })
  batchImages.value = []
}

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value.click()
}

const triggerBatchFileInput = () => {
  batchFileInput.value.click()
}

// SEO配置
useSeoMeta({
  title: '图片尺寸调整 - 在线调整图片尺寸工具',
  description: '免费在线图片尺寸调整工具，支持像素和百分比调整、批量处理、多种裁剪模式。',
  keywords: ['图片尺寸', '图片调整', '图片缩放', '像素调整', '在线工具']
})



// 清理
onUnmounted(() => {
  if (resizedUrl.value) {
    URL.revokeObjectURL(resizedUrl.value)
  }
  batchImages.value.forEach(img => {
    if (img.processedUrl) {
      URL.revokeObjectURL(img.processedUrl)
    }
  })
})
</script>

<style scoped>
.bg-checkered {
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
</style>