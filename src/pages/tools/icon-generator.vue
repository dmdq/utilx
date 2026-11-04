<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图标生成器</h1>
      <p class="text-muted-foreground">生成 favicon 等图标，支持多种尺寸和格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和设置 -->
      <div class="space-y-4">
        <div class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">上传图片</h2>

          <!-- 拖拽上传 -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            :class="{ 'border-primary bg-primary/5': isDragOver }"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @dragenter.prevent="isDragOver = true"
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
            <p class="text-sm text-muted-foreground mb-4">支持 JPG、PNG、GIF 等格式</p>
            <button
              type="button"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              @click.stop="triggerFileInput"
            >
              选择文件
            </button>
          </div>

          <!-- 图片预览 -->
          <div v-if="uploadedImage" class="mt-4 space-y-4">
            <div class="relative">
              <img
                :src="uploadedImage.url"
                :alt="uploadedImage.name"
                class="w-full rounded-lg"
              />
              <button
                @click="clearImage"
                class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="text-sm text-muted-foreground">
              <p>文件名：{{ uploadedImage.name }}</p>
              <p>原始尺寸：{{ uploadedImage.width }} × {{ uploadedImage.height }} px</p>
            </div>
          </div>
        </div>

        <!-- 生成设置 -->
        <div class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">生成设置</h2>

          <div class="space-y-4">
            <!-- 图标类型 -->
            <div>
              <label class="text-sm font-medium">图标类型</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="type in iconTypes"
                  :key="type.value"
                  @click="iconType = type.value"
                  :class="[
                    'px-3 py-2 rounded-md transition-colors text-sm',
                    iconType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ type.name }}
                </button>
              </div>
            </div>

            <!-- 尺寸预设 -->
            <div>
              <label class="text-sm font-medium">尺寸预设</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="preset in sizePresets"
                  :key="preset.name"
                  @click="applySizePreset(preset)"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- 自定义尺寸 -->
            <div>
              <label class="text-sm font-medium">自定义尺寸</label>
              <div class="mt-2 grid grid-cols-4 gap-2">
                <div
                  v-for="(size, index) in customSizes"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model.number="size.width"
                    type="number"
                    min="16"
                    max="1024"
                    class="w-20 px-2 py-1 border border-border rounded text-sm"
                    @input="generateIcons"
                  />
                  <span class="text-xs text-muted-foreground">×</span>
                  <input
                    v-model.number="size.height"
                    type="number"
                    min="16"
                    max="1024"
                    class="w-20 px-2 py-1 border border-border rounded text-sm"
                    @input="generateIcons"
                  />
                  <button
                    @click="removeCustomSize(index)"
                    class="p-1 text-destructive hover:text-destructive/80"
                    v-if="customSizes.length > 1"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                @click="addCustomSize"
                class="mt-2 w-full px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
              >
                添加尺寸
              </button>
            </div>

            <!-- 输出格式 -->
            <div>
              <label class="text-sm font-medium">输出格式</label>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button
                  v-for="format in outputFormats"
                  :key="format.value"
                  @click="outputFormat = format.value"
                  :class="[
                    'px-3 py-2 rounded-md transition-colors text-sm',
                    outputFormat === format.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ format.name }}
                </button>
              </div>
            </div>

            <!-- 背景色（ICO格式） -->
            <div v-if="outputFormat === 'ico'">
              <label class="flex items-center gap-2">
                <input
                  v-model="transparentBackground"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">透明背景</span>
              </label>
            </div>

            <!-- 高级选项 -->
            <details class="mt-4">
              <summary class="text-sm font-medium cursor-pointer">高级选项</summary>
              <div class="mt-3 space-y-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="maintainAspectRatio"
                    type="checkbox"
                    class="rounded"
                    checked
                  />
                  <span class="text-sm">保持宽高比</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="autoOptimize"
                    type="checkbox"
                    class="rounded"
                    checked
                  />
                  <span class="text-sm">自动优化</span>
                </label>
              </div>
            </details>
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="space-y-2">
          <button
            @click="generateIcons"
            :disabled="!uploadedImage || isGenerating"
            class="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Settings v-if="isGenerating" class="w-4 h-4 animate-spin" />
            {{ isGenerating ? '生成中...' : '生成图标' }}
          </button>
          <button
            v-if="generatedIcons.length > 0"
            @click="downloadAll"
            class="w-full px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" />
            下载所有图标
          </button>
        </div>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="space-y-4">
        <!-- 预览 -->
        <div class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">图标预览</h2>

          <div v-if="generatedIcons.length === 0" class="text-center py-12 text-muted-foreground">
            <ImageIcon class="w-16 h-16 mx-auto mb-4" />
            <p>上传图片并点击生成按钮查看预览</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 预览模式切换 -->
            <div class="flex gap-2">
              <button
                v-for="mode in previewModes"
                :key="mode.value"
                @click="previewMode = mode.value"
                :class="[
                  'px-3 py-1 rounded-md transition-colors text-sm',
                  previewMode === mode.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                {{ mode.name }}
              </button>
            </div>

            <!-- 预览网格 -->
            <div v-if="previewMode === 'grid'" class="grid grid-cols-4 gap-4">
              <div
                v-for="icon in generatedIcons"
                :key="icon.size"
                class="space-y-2"
              >
                <div class="aspect-square bg-checkered rounded-lg p-2 flex items-center justify-center">
                  <img
                    :src="icon.url"
                    :alt="`${icon.size}x${icon.size}`"
                    :style="{ width: icon.size + 'px', height: icon.size + 'px' }"
                    class="max-w-full max-h-full"
                  />
                </div>
                <div class="text-center">
                  <p class="text-sm font-medium">{{ icon.size }}px</p>
                  <button
                    @click="downloadIcon(icon)"
                    class="mt-1 text-xs text-primary hover:text-primary/80"
                  >
                    下载
                  </button>
                </div>
              </div>
            </div>

            <!-- 列表预览 -->
            <div v-else class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="icon in generatedIcons"
                :key="icon.size"
                class="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-checkered rounded p-1 flex items-center justify-center">
                    <img
                      :src="icon.url"
                      :alt="`${icon.size}x${icon.size}`"
                      class="max-w-full max-h-full"
                    />
                  </div>
                  <div>
                    <p class="font-medium">{{ icon.size }} × {{ icon.size }} px</p>
                    <p class="text-sm text-muted-foreground">{{ formatFileSize(icon.size) }}</p>
                  </div>
                </div>
                <button
                  @click="downloadIcon(icon)"
                  class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  下载
                </button>
              </div>
            </div>

            <!-- 实时预览 -->
            <div v-if="previewMode === 'realtime'" class="space-y-4">
              <div>
                <label class="text-sm font-medium">网站预览</label>
                <div class="mt-2 p-4 bg-muted rounded-lg">
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-checkered rounded flex items-center justify-center">
                      <img
                        :src="generatedIcons[0]?.url"
                        alt="favicon"
                        class="w-full h-full"
                      />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium">网站标签页图标</p>
                      <p class="text-sm text-muted-foreground">16x16, 32x32, 48x48</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium">移动应用图标</label>
                <div class="mt-2 p-4 bg-muted rounded-lg">
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-checkered rounded flex items-center justify-center">
                      <img
                        :src="generatedIcons.find(i => i.size === 57)?.url"
                        alt="ios icon"
                        class="w-full h-full"
                      />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium">iOS 应用图标</p>
                      <p class="text-sm text-muted-foreground">57x57, 60x60, 72x72</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="w-16 h-16 bg-checkered rounded flex items-center justify-center">
                      <img
                        :src="generatedIcons.find(i => i.size === 72)?.url"
                        alt="android icon"
                        class="w-full h-full"
                      />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium">Android 应用图标</p>
                      <p class="text-sm text-muted-foreground">72x72, 96x96, 144x144</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下载格式说明 -->
        <div class="bg-card border border-border  rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">格式说明</h2>
          <div class="space-y-4 text-sm">
            <div v-for="format in formatDescriptions" :key="format.type" class="p-4 bg-muted rounded-lg">
              <h3 class="font-medium mb-2">{{ format.name }} ({{ format.ext }})</h3>
              <p class="text-muted-foreground">{{ format.description }}</p>
              <p class="text-xs text-muted-foreground mt-2">
                用途：{{ format.uses }}
              </p>
            </div>
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
            <h4 class="font-medium text-foreground mb-2">支持的尺寸</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>Favicon</strong>：16x16, 32x32, 48x48, 64x64 px</li>
              <li><strong>iOS</strong>：57x57, 60x60, 72x72, 114x114, 120x120, 144x144, 152x152, 167x167, 180x180, 1024x1024 px</li>
              <li><strong>Android</strong>：36x36, 48x48, 72x72, 96x96, 144x144, 192x192, 512x512 px</li>
              <li><strong>Windows</strong>：16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256 px</li>
              <li><strong>Web App</strong>：192x192, 512x512 px</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">格式特点</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>ICO</strong>：包含多个尺寸的单个文件，Windows 原生支持</li>
              <li><strong>PNG</strong>：支持透明背景，质量高但文件较大</li>
              <li><strong>JPG</strong>：不支持透明，文件较小，适合照片</li>
              <li><strong>WebP</strong>：新一代格式，支持透明且文件小</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, ImageIcon, X, Settings, Download, Maximize2, RefreshCw, Zap, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'
import JSZip from 'jszip'
import { useTauri } from '~/composables/useTauri'
import { useNotification } from '~/composables/useNotification'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const uploadedImage = ref(null)
const iconType = ref('favicon')
const outputFormat = ref('png')
const transparentBackground = ref(true)
const maintainAspectRatio = ref(true)
const autoOptimize = ref(true)
const isGenerating = ref(false)
const generatedIcons = ref([])
const previewMode = ref('grid')
const fileInput = ref(null)
const isDragOver = ref(false)

// 自定义尺寸
const customSizes = ref([
  { width: 16, height: 16 },
  { width: 32, height: 32 },
  { width: 48, height: 48 },
  { width: 64, height: 64 }
])

// 图标类型
const iconTypes = [
  { value: 'favicon', name: 'Favicon' },
  { value: 'ios', name: 'iOS' },
  { value: 'android', name: 'Android' },
  { value: 'windows', name: 'Windows' },
  { value: 'webapp', name: 'Web App' }
]

// 尺寸预设
const sizePresets = [
  { name: '标准网站', sizes: [16, 32, 48, 64] },
  { name: 'iOS 应用', sizes: [57, 60, 72, 114, 120, 144, 152, 167, 180, 1024] },
  { name: 'Android 应用', sizes: [36, 48, 72, 96, 144, 192, 512] },
  { name: 'Windows 应用', sizes: [16, 24, 32, 48, 64, 128, 256] },
  { name: 'Web App', sizes: [192, 512] }
]

// 输出格式
const outputFormats = [
  { value: 'png', name: 'PNG' },
  { value: 'jpg', name: 'JPG' },
  { value: 'ico', name: 'ICO' },
  { value: 'webp', name: 'WebP' }
]

// 预览模式
const previewModes = [
  { value: 'grid', name: '网格预览' },
  { value: 'list', name: '列表预览' },
  { value: 'realtime', name: '实时预览' }
]

// 格式说明
const formatDescriptions = [
  {
    type: 'ico',
    name: 'ICO',
    ext: '.ico',
    description: 'Windows 图标格式，可包含多个尺寸',
    uses: 'Windows 网站favicon'
  },
  {
    type: 'png',
    name: 'PNG',
    ext: '.png',
    description: '支持透明通道的便携式网络图形格式',
    uses: '网站favicon, 移动应用图标'
  },
  {
    type: 'jpg',
    name: 'JPG',
    ext: '.jpg',
    description: '有损压缩格式，文件小但无透明通道',
    uses: '一般图片预览'
  },
  {
    type: 'webp',
    name: 'WebP',
    ext: '.webp',
    description: 'Google 开发的新一代图像格式',
    uses: '现代网页图标'
  }
]

// 处理文件选择
const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

// 处理拖拽
const handleDrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

// 处理图片文件
const processImageFile = (file) => {
  const reader = new FileReader()

  reader.onload = (e) => {
    const img = new Image()

    img.onload = () => {
      uploadedImage.value = {
        name: file.name,
        url: e.target.result,
        width: img.width,
        height: img.height
      }
    }

    img.onerror = (error) => {
      console.error('Failed to load image:', error)
    }

    img.src = e.target.result
  }

  reader.onerror = (error) => {
    console.error('FileReader failed:', error)
  }

  reader.readAsDataURL(file)
}

// 清空图片
const clearImage = () => {
  uploadedImage.value = null
  generatedIcons.value = []
}

// 应用尺寸预设
const applySizePreset = (preset) => {
  customSizes.value = preset.sizes.map(size => ({
    width: size,
    height: size
  }))
  if (uploadedImage.value) {
    generateIcons()
  }
}

// 添加自定义尺寸
const addCustomSize = () => {
  customSizes.value.push({ width: 128, height: 128 })
}

// 移除自定义尺寸
const removeCustomSize = (index) => {
  customSizes.value.splice(index, 1)
}

// 生成图标
const generateIcons = async () => {
  if (!uploadedImage.value) return

  isGenerating.value = true
  generatedIcons.value = []

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  for (const size of customSizes.value) {
    canvas.width = size.width
    canvas.height = size.height

    // 清除画布
    ctx.clearRect(0, 0, size.width, size.height)

    // 如果需要透明背景，不填充背景
    if (!transparentBackground.value && outputFormat.value !== 'ico') {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, size.width, size.height)
    }

    // 绘制图片
    const img = new Image()
    await new Promise((resolve) => {
      img.onload = () => {
        // 计算缩放和位置
        let drawWidth = size.width
        let drawHeight = size.height
        let x = 0
        let y = 0

        if (maintainAspectRatio.value) {
          const aspectRatio = uploadedImage.value.width / uploadedImage.value.height
          const canvasRatio = size.width / size.height

          if (aspectRatio > canvasRatio) {
            drawHeight = size.width / aspectRatio
            y = (size.height - drawHeight) / 2
          } else {
            drawWidth = size.height * aspectRatio
            x = (size.width - drawWidth) / 2
          }
        }

        ctx.drawImage(img, x, y, drawWidth, drawHeight)

        // 转换为 Blob
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          generatedIcons.value.push({
            size: size.width,
            url: url,
            blob: blob,
            format: outputFormat.value
          })
        }, getMimeType())
        resolve()
      }
      img.src = uploadedImage.value.url
    })
  }

  isGenerating.value = false
}

// 获取 MIME 类型
const getMimeType = () => {
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    ico: 'image/x-icon',
    webp: 'image/webp'
  }
  return mimeTypes[outputFormat.value] || 'image/png'
}

// 使用 Tauri composable 和通知系统
const { downloadFile } = useTauri()
const { showSuccess, showInfo } = useNotification()

// 下载单个图标
const downloadIcon = async (icon) => {
  const filename = `icon_${icon.size}.${outputFormat.value}`
  console.log('🎯 [ICON GENERATOR] Starting download for:', filename)

  // 显示开始下载通知
  showInfo(`正在下载 ${filename}...`)

  try {
    // 尝试使用 Tauri 下载
    const result = await downloadFile(icon.url, filename)
    console.log('🎯 [ICON GENERATOR] Download result:', result)

    // 显示下载成功通知
    showSuccess(`${filename} 下载完成！`)
  } catch (error) {
    console.error('🎯 [ICON GENERATOR] Download failed:', error)
    console.log('🎯 [ICON GENERATOR] Falling back to web download')

    // 降级到普通方式下载
    const a = document.createElement('a')
    a.href = icon.url
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // 显示降级通知
    showInfo(`开始下载: ${filename}`)
  }
}

// 下载所有图标
const downloadAll = async () => {
  if (generatedIcons.value.length === 0) return

  const iconCount = generatedIcons.value.length
  console.log('🎯 [ICON GENERATOR] Downloading all icons, count:', iconCount)

  if (outputFormat.value === 'ico') {
    // ICO 格式需要特殊处理
    // 这里简化处理，实际应该使用专门的库
    console.log('🎯 [ICON GENERATOR] ICO format, downloading first icon')
    await downloadIcon(generatedIcons.value[0])
    return
  }

  const filename = `icons_${outputFormat.value.toUpperCase()}.zip`
  console.log('🎯 [ICON GENERATOR] Creating ZIP file:', filename)

  // 显示开始打包通知
  showInfo(`正在打包 ${iconCount} 个图标为 ZIP 文件...`)

  try {
    // 其他格式打包成 ZIP
    const zip = new JSZip()

    generatedIcons.value.forEach(icon => {
      zip.file(`icon_${icon.size}.${outputFormat.value}`, icon.blob)
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)

    // 显示开始下载通知
    showInfo(`正在下载 ${filename}...`)

    // 尝试使用 Tauri 下载
    const result = await downloadFile(url, filename)
    console.log('🎯 [ICON GENERATOR] ZIP download result:', result)

    // 显示下载成功通知
    showSuccess(`${filename} 下载完成！包含 ${iconCount} 个图标`)

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('🎯 [ICON GENERATOR] ZIP download failed:', error)
    console.log('🎯 [ICON GENERATOR] Falling back to web download')

    // 降级到普通方式下载
    const zip = new JSZip()

    generatedIcons.value.forEach(icon => {
      zip.file(`icon_${icon.size}.${outputFormat.value}`, icon.blob)
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)

    // 显示降级通知
    showInfo(`开始下载: ${filename}（包含 ${iconCount} 个图标）`)
  }
}

// 格式化文件大小
const formatFileSize = (size) => {
  return `${size}×${size}px`
}

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value.click()
}

// SEO配置
useSeoMeta({
  title: '图标生成器 - 在线生成 favicon 和应用图标',
  description: '免费在线图标生成工具，支持 favicon、iOS、Android、Windows 等多种平台图标格式，批量生成不同尺寸。',
  keywords: ['图标生成器', 'favicon生成', '应用图标', 'ico生成', '图标制作', '在线工具']
})



// 清理
onUnmounted(() => {
  generatedIcons.value.forEach(icon => {
    if (icon.url) {
      URL.revokeObjectURL(icon.url)
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
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px 0, 5px -5px;
}
</style>