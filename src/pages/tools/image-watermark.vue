<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片水印</h1>
      <p class="text-muted-foreground">添加文字或图片水印，保护图片版权</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：上传和设置 -->
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
            <p class="text-sm text-muted-foreground">支持 JPG、PNG、WebP 等格式</p>
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
              <p>尺寸：{{ uploadedImage.width }} × {{ uploadedImage.height }} px</p>
            </div>
          </div>
        </div>

        <!-- 水印设置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">水印设置</h2>

          <!-- 水印类型 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">水印类型</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  @click="watermarkType = 'text'"
                  :class="[
                    'px-4 py-2 rounded-md transition-colors',
                    watermarkType === 'text'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  文字水印
                </button>
                <button
                  @click="watermarkType = 'image'"
                  :class="[
                    'px-4 py-2 rounded-md transition-colors',
                    watermarkType === 'image'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  图片水印
                </button>
              </div>
            </div>

            <!-- 文字水印设置 -->
            <div v-if="watermarkType === 'text'" class="space-y-4">
              <div>
                <label class="text-sm font-medium">水印文字</label>
                <input
                  v-model="watermarkText"
                  type="text"
                  placeholder="输入水印文字"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium">字体大小</label>
                  <input
                    v-model.number="textSettings.fontSize"
                    type="number"
                    min="12"
                    max="200"
                    class="mt-1 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">字体</label>
                  <select
                    v-model="textSettings.fontFamily"
                    class="mt-1 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="text-sm font-medium">颜色</label>
                  <input
                    v-model="textSettings.color"
                    type="color"
                    class="mt-1 w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">透明度</label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      v-model.number="textSettings.opacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      class="flex-1"
                    />
                    <span class="text-sm w-12 text-right">{{ Math.round(textSettings.opacity * 100) }}%</span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium">旋转角度</label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      v-model.number="textSettings.rotation"
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      class="flex-1"
                    />
                    <span class="text-sm w-12 text-right">{{ textSettings.rotation }}°</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片水印设置 -->
            <div v-else-if="watermarkType === 'image'" class="space-y-4">
              <div>
                <label class="text-sm font-medium">水印图片</label>
                <div
                  class="mt-2 border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer"
                  @drop="handleWatermarkDrop"
                  @dragover.prevent
                  @dragleave.prevent
                  @click="triggerWatermarkInput"
                >
                  <input
                    ref="watermarkInput"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="handleWatermarkSelect"
                  />
                  <Upload class="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p class="text-sm">拖拽或点击上传水印图片</p>
                </div>
                <div v-if="watermarkImage" class="mt-2 relative">
                  <img
                    :src="watermarkImage.url"
                    :alt="watermarkImage.name"
                    class="w-full max-h-32 object-contain rounded"
                  />
                  <button
                    @click="clearWatermark"
                    class="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium">缩放</label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      v-model.number="imageSettings.scale"
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      class="flex-1"
                    />
                    <span class="text-sm w-12 text-right">{{ imageSettings.scale }}%</span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium">透明度</label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      v-model.number="imageSettings.opacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      class="flex-1"
                    />
                    <span class="text-sm w-12 text-right">{{ Math.round(imageSettings.opacity * 100) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 位置设置 -->
            <div>
              <label class="text-sm font-medium">位置</label>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button
                  v-for="position in positions"
                  :key="position.value"
                  @click="watermarkPosition = position.value"
                  :class="[
                    'px-3 py-2 rounded-md transition-colors text-sm',
                    watermarkPosition === position.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ position.name }}
                </button>
              </div>
            </div>

            <!-- 高级选项 -->
            <details class="mt-4">
              <summary class="text-sm font-medium cursor-pointer">高级选项</summary>
              <div class="mt-3 space-y-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="repeatWatermark"
                    type="checkbox"
                    class="rounded"
                  />
                  <span class="text-sm">平铺水印</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="protectOriginal"
                    type="checkbox"
                    class="rounded"
                    checked
                  />
                  <span class="text-sm">保护原图（不可撤销）</span>
                </label>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和操作 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 预览 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">预览效果</h2>

          <div v-if="!uploadedImage" class="text-center py-12 text-muted-foreground">
            <ImageIcon class="w-16 h-16 mx-auto mb-4" />
            <p>上传图片开始添加水印</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 预览大小控制 -->
            <div class="flex items-center gap-4">
              <label class="text-sm font-medium">预览缩放</label>
              <input
                v-model="previewScale"
                type="range"
                min="10"
                max="100"
                step="10"
                class="flex-1"
              />
              <span class="text-sm font-mono w-12">{{ previewScale }}%</span>
            </div>

            <!-- 画布预览 -->
            <div class="relative">
              <canvas
                ref="canvas"
                class="w-full border rounded-lg shadow-md bg-checkered"
                :style="{ maxWidth: '100%', height: 'auto' }"
              ></canvas>
            </div>
          </div>
        </div>

        <!-- 批量处理 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">批量处理</h2>
          <p class="text-sm text-muted-foreground mb-4">
            上传多张图片，应用相同水印设置
          </p>

          <div
            class="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer"
            @drop="handleBatchDrop"
            @dragover.prevent
            @dragleave.prevent
            @click="triggerBatchInput"
          >
            <input
              ref="batchInput"
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
                  {{ isProcessingBatch ? '处理中...' : '批量添加水印' }}
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
                <img
                  :src="img.url"
                  :alt="img.name"
                  class="w-12 h-12 object-cover rounded"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ img.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ img.status }}</p>
                </div>
                <button
                  @click="removeBatchImage(index)"
                  class="text-destructive hover:text-destructive/80"
                >
                  <X class="w-4 h-4" />
                </button>
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

        <!-- 下载选项 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">下载选项</h2>

          <div class="space-y-4">
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

            <div>
              <label class="text-sm font-medium">质量</label>
              <div class="mt-2 flex items-center gap-3">
                <input
                  v-model.number="outputQuality"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="flex-1"
                />
                <span class="text-sm font-mono w-12 text-right">{{ outputQuality }}%</span>
              </div>
            </div>

            <div v-if="processedImage" class="flex gap-3">
              <button
                @click="downloadProcessedImage"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download class="w-4 h-4" />
                下载图片
              </button>
              <button
                @click="resetProcess"
                class="px-4 py-2 border border-muted text-muted-foreground rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw class="w-4 h-4" />
                重置
              </button>
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
            <h4 class="font-medium text-foreground mb-2">水印类型</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>文字水印</strong>：添加文字内容，可自定义字体、颜色、透明度等</li>
              <li><strong>图片水印</strong>：上传 Logo 或图标作为水印，可调整大小和透明度</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">使用技巧</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>使用半透明水印既能保护版权又不会过度遮挡图片</li>
              <li>将水印放置在角落位置，通常更美观</li>
              <li>批量处理功能可同时为多张图片添加水印</li>
              <li>建议在输出前调整合适的图片质量和格式</li>
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
            to="/tools/image-merge"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Layers class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片合并</p>
              <p class="text-xs text-muted-foreground">合并多张图片</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Info, ImageIcon, X, Upload, Download, RotateCcw, Crop, Zap, Layers, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const uploadedImage = ref(null)
const watermarkType = ref('text')
const watermarkText = ref('© 版权所有')
const watermarkImage = ref(null)
const watermarkPosition = ref('bottom-right')
const textSettings = ref({
  fontSize: 24,
  fontFamily: 'Arial',
  color: '#FFFFFF',
  opacity: 0.5,
  rotation: 0
})
const imageSettings = ref({
  scale: 50,
  opacity: 0.5
})
const outputFormat = ref('png')
const outputQuality = ref(90)
const previewScale = ref(50)
const processedImage = ref(null)
const repeatWatermark = ref(false)
const protectOriginal = ref(false)
const isProcessing = ref(false)
const isProcessingBatch = ref(false)

const fileInput = ref(null)
const watermarkInput = ref(null)
const batchInput = ref(null)
const batchImages = ref([])

// 位置选项
const positions = [
  { value: 'top-left', name: '左上' },
  { value: 'top-center', name: '顶部居中' },
  { value: 'top-right', name: '右上' },
  { value: 'center-left', name: '左侧居中' },
  { value: 'center', name: '中心' },
  { value: 'center-right', name: '右侧居中' },
  { value: 'bottom-left', name: '左下' },
  { value: 'bottom-center', name: '底部居中' },
  { value: 'bottom-right', name: '右下' }
]

// 输出格式
const outputFormats = [
  { value: 'png', name: 'PNG' },
  { value: 'jpg', name: 'JPG' },
  { value: 'webp', name: 'WebP' }
]

// Canvas 引用
const canvas = ref(null)

// 计算属性
const batchProcessedCount = computed(() => {
  return batchImages.value.filter(img => img.processedUrl).length
})

// 监听变化并自动预览
watch([
  () => uploadedImage.value,
  watermarkType.value,
  watermarkText.value,
  watermarkPosition.value,
  textSettings.value,
  imageSettings.value,
  repeatWatermark.value
], () => {
  if (uploadedImage.value) {
    processImage()
  }
})

// 处理单个图片
const processImage = async () => {
  if (!canvas.value || !uploadedImage.value) return

  const ctx = canvas.value.getContext('2d')
  const img = new Image()

  await new Promise((resolve) => {
    img.onload = () => {
      // 设置画布尺寸
      const scale = previewScale.value / 100
      canvas.value.width = img.width * scale
      canvas.value.height = img.height * scale

      // 清空画布
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

      // 绘制原图
      ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height)

      // 添加水印
      if (watermarkType.value === 'text' && watermarkText.value) {
        addTextWatermark(ctx)
      } else if (watermarkType.value === 'image' && watermarkImage.value) {
        addImageWatermark(ctx)
      }

      // 获取处理后的图片
      canvas.value.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        processedImage.value = url
        resolve()
      }, getMimeType())
    }
    img.src = uploadedImage.value.url
  })
}

// 添加文字水印
const addTextWatermark = (ctx) => {
  const { width, height } = canvas.value
  const {
    fontSize,
    fontFamily,
    color,
    opacity,
    rotation
  } = textSettings.value

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.font = `${fontSize * (previewScale.value / 100)}px ${fontFamily}`
  ctx.fillStyle = color

  // 计算位置
  const { x, y } = getWatermarkPosition(width, height)

  // 旋转
  if (rotation !== 0) {
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.fillText(watermarkText.value, 0, 0)
  } else {
    ctx.fillText(watermarkText.value, x, y)
  }

  ctx.restore()
}

// 添加图片水印
const addImageWatermark = async (ctx) => {
  if (!watermarkImage.value) return

  const img = new Image()
  await new Promise((resolve) => {
    img.onload = () => {
      const { width, height } = canvas.value
      const { scale, opacity } = imageSettings.value

      ctx.save()
      ctx.globalAlpha = opacity

      // 计算水印尺寸和位置
      const watermarkWidth = (img.width * scale / 100) * (previewScale.value / 100)
      const watermarkHeight = (img.height * scale / 100) * (previewScale.value / 100)
      const { x, y } = getWatermarkPosition(width, height, watermarkWidth, watermarkHeight)

      ctx.drawImage(img, x, y, watermarkWidth, watermarkHeight)
      ctx.restore()
    }
    img.src = watermarkImage.value.url
  })
}

// 获取水印位置
const getWatermarkPosition = (width, height, watermarkWidth = 0, watermarkHeight = 0) => {
  const positions = {
    'top-left': { x: 20, y: 20 },
    'top-center': { x: (width - watermarkWidth) / 2, y: 20 },
    'top-right': { x: width - watermarkWidth - 20, y: 20 },
    'center-left': { x: 20, y: (height - watermarkHeight) / 2 },
    'center': { x: (width - watermarkWidth) / 2, y: (height - watermarkHeight) / 2 },
    'center-right': { x: width - watermarkWidth - 20, y: (height - watermarkHeight) / 2 },
    'bottom-left': { x: 20, y: height - watermarkHeight - 20 },
    'bottom-center': { x: (width - watermarkWidth) / 2, y: height - watermarkHeight - 20 },
    'bottom-right': { x: width - watermarkWidth - 20, y: height - watermarkHeight - 20 }
  }

  return positions[watermarkPosition.value] || positions['bottom-right']
}

// 获取 MIME 类型
const getMimeType = () => {
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp'
  }
  return mimeTypes[outputFormat.value] || 'image/png'
}

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
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 清空图片
const clearImage = () => {
  uploadedImage.value = null
  processedImage.value = null
}

// 重置处理
const resetProcess = () => {
  if (!protectOriginal.value) {
    uploadedImage.value = null
    processedImage.value = null
  }
}

// 水印图片相关
const handleWatermarkDrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processWatermarkFile(file)
  }
}

const triggerWatermarkInput = () => {
  watermarkInput.value.click()
}

const handleWatermarkSelect = (e) => {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processWatermarkFile(file)
  }
}

const processWatermarkFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    watermarkImage.value = {
      name: file.name,
      url: e.target.result
    }
  }
  reader.readAsDataURL(file)
}

const clearWatermark = () => {
  watermarkImage.value = null
}

// 批量处理相关
const handleBatchDrop = (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  processBatchFiles(files)
}

const triggerBatchInput = () => {
  batchInput.value.click()
}

const handleBatchSelect = (e) => {
  const files = Array.from(e.target.files)
  processBatchFiles(files)
}

const processBatchFiles = (files) => {
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          batchImages.value.push({
          id: Date.now() + Math.random(),
          name: file.name,
          url: e.target.result,
          width: img.width,
          height: img.height,
          status: '待处理',
          processedUrl: null
        })
      }
      img.src = e.target.result
      }
    }
    reader.readAsDataURL(file)
  })
}

const removeBatchImage = (index) => {
  const image = batchImages.value[index]
  if (image.processedUrl) {
    URL.revokeObjectURL(image.processedUrl)
  }
  batchImages.value.splice(index, 1)
}

const clearBatch = () => {
  batchImages.value.forEach(img => {
    if (img.processedUrl) {
      URL.revokeObjectURL(img.processedUrl)
    }
  })
  batchImages.value = []
}

const processBatch = async () => {
  isProcessingBatch.value = true

  for (const batchImg of batchImages.value) {
    batchImg.status = '处理中...'

    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // 创建临时画布
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')

      tempCanvas.width = batchImg.width
      tempCanvas.height = batchImg.height

      // 绘制原图
      const img = new Image()
      img.src = batchImg.url
      await new Promise((resolve) => {
        img.onload = () => {
          tempCtx.drawImage(img, 0, 0)

          // 添加水印
          if (watermarkType.value === 'text' && watermarkText.value) {
            tempCtx.save()
            tempCtx.globalAlpha = textSettings.value.opacity
            tempCtx.font = `${textSettings.value.fontSize}px ${textSettings.value.fontFamily}`
            tempCtx.fillStyle = textSettings.value.color

            // 使用全局计算位置
            const { x, y } = getWatermarkPosition(batchImg.width, batchImg.height)
            tempCtx.fillText(watermarkText.value, x, y)
            tempCtx.restore()

            // 保存结果
            tempCanvas.toBlob((blob) => {
              if (blob) {
                const processedUrl = URL.createObjectURL(blob)
                batchImg.processedUrl = processedUrl
                batchImg.status = '已完成'
              } else {
                batchImg.status = '处理失败'
              }
              resolve()
            })
          } else if (watermarkType.value === 'image' && watermarkImage.value) {
            const watermarkImg = new Image()
            watermarkImg.src = watermarkImage.value.url
            watermarkImg.onload = () => {
              const watermarkWidth = (watermarkImg.width * imageSettings.value.scale / 100)
              const watermarkHeight = (watermarkImg.height * imageSettings.value.scale / 100)
              const { x, y } = getWatermarkPosition(batchImg.width, batchImg.height, watermarkWidth, watermarkHeight)

              tempCtx.globalAlpha = imageSettings.value.opacity
              tempCtx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight)

              // 保存结果
              tempCanvas.toBlob((blob) => {
                if (blob) {
                  const processedUrl = URL.createObjectURL(blob)
                  batchImg.processedUrl = processedUrl
                  batchImg.status = '已完成'
                } else {
                  batchImg.status = '处理失败'
                }
                resolve()
              })
            }
            watermarkImg.onerror = () => {
              batchImg.status = '处理失败'
              resolve()
            }
          } else {
            // 保存结果（无水印）
            tempCanvas.toBlob((blob) => {
              if (blob) {
                const processedUrl = URL.createObjectURL(blob)
                batchImg.processedUrl = processedUrl
                batchImg.status = '已完成'
              } else {
                batchImg.status = '处理失败'
              }
              resolve()
            })
          }
        }
        img.onerror = () => {
          batchImg.status = '处理失败'
          resolve()
        }
      })
    } catch (error) {
      console.error('处理失败:', error)
      batchImg.status = '失败'
      batchImg.processedUrl = null
    }
  }

  isProcessingBatch.value = false
}

// 下载所有批量处理的图片
const downloadAllBatch = async () => {
  const zip = new JSZip()

  const processedImages = batchImages.value.filter(img => img.processedUrl)

  for (const img of processedImages) {
    const response = await fetch(img.processedUrl)
    const blob = await response.blob()
    zip.file(img.name, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)

  const a = document.createElement('a')
  a.href = url
  a.download = `watermarked_images_${Date.now()}.zip`
  a.click()

  URL.revokeObjectURL(url)
}

// 下载处理后的图片
const downloadProcessedImage = () => {
  if (!processedImage.value) return

  const a = document.createElement('a')
  a.href = processedImage.value
  a.download = `watermarked_${uploadedImage.value.name.split('.')[0]}.${outputFormat.value}`
  a.click()
}

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value.click()
}



// 初始化
onMounted(() => {
  // 获取 canvas 引用
  setTimeout(() => {
    canvas.value = document.querySelector('canvas')
  }, 100)
})

// SEO配置
useSeoMeta({
  title: '图片水印 - 在线添加文字/图片水印工具',
  description: '免费在线图片水印工具，支持文字和图片水印，批量处理，自定义位置和样式。',
  keywords: ['图片水印', '水印生成', '版权保护', '批量水印', '在线工具']
})



// 清理
onUnmounted(() => {
  if (processedImage.value) {
    URL.revokeObjectURL(processedImage.value)
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
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px 0, 5px -5px;
}
</style>