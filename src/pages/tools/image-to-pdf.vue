<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片转PDF</h1>
      <p class="text-muted-foreground">将多张图片合并导出为PDF文档，支持拖拽排序和页面设置</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：图片列表和设置 -->
      <div class="space-y-4">
        <!-- 图片列表 -->
        <div class="bg-card rounded-lg p-6">
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
              class="flex items-center gap-3 p-3 bg-muted rounded-lg group cursor-move"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragover.prevent
              @drop="handleDropImage($event, index)"
              @dragend="handleDragEnd"
            >
              <div class="relative">
                <img
                  :src="image.preview"
                  :alt="image.name"
                  class="w-12 h-12 object-cover rounded"
                />
                <div class="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {{ index + 1 }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ image.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ image.format }} • {{ formatFileSize(image.size) }}
                </p>
              </div>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  @click="rotateImage(index)"
                  class="p-1 hover:text-primary transition-colors"
                  title="旋转90度"
                >
                  <RotateCw class="w-4 h-4" />
                </button>
                <button
                  @click="previewImage(index)"
                  class="p-1 hover:text-primary transition-colors"
                  title="预览"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  @click="removeImage(index)"
                  class="p-1 hover:text-destructive transition-colors"
                  title="删除"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
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

        <!-- PDF设置 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">PDF设置</h2>

          <div class="space-y-4">
            <!-- 页面大小 -->
            <div>
              <label class="text-sm font-medium">页面大小</label>
              <select v-model="pdfSettings.pageSize" class="mt-2 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="a3">A3 (297 x 420 mm)</option>
                <option value="letter">Letter (8.5 x 11 in)</option>
                <option value="legal">Legal (8.5 x 14 in)</option>
              </select>
            </div>

            <!-- 方向 -->
            <div>
              <label class="text-sm font-medium">页面方向</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  @click="pdfSettings.orientation = 'portrait'"
                  :class="[
                    'p-3 rounded-lg border transition-all',
                    pdfSettings.orientation === 'portrait'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4" />
                    <span class="text-sm">竖向</span>
                  </div>
                </button>
                <button
                  @click="pdfSettings.orientation = 'landscape'"
                  :class="[
                    'p-3 rounded-lg border transition-all',
                    pdfSettings.orientation === 'landscape'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4 rotate-90" />
                    <span class="text-sm">横向</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- 图片布局 -->
            <div>
              <label class="text-sm font-medium">图片布局</label>
              <div class="mt-2 space-y-2">
                <button
                  @click="pdfSettings.imageLayout = 'fit'"
                  :class="[
                    'w-full p-3 rounded-lg border transition-all',
                    pdfSettings.imageLayout === 'fit'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <Maximize2 class="w-4 h-4" />
                    <span class="text-sm">适应页面（保持比例）</span>
                  </div>
                </button>
                <button
                  @click="pdfSettings.imageLayout = 'fill'"
                  :class="[
                    'w-full p-3 rounded-lg border transition-all',
                    pdfSettings.imageLayout === 'fill'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <Expand class="w-4 h-4" />
                    <span class="text-sm">填充页面（可能裁剪）</span>
                  </div>
                </button>
                <button
                  @click="pdfSettings.imageLayout = 'center'"
                  :class="[
                    'w-full p-3 rounded-lg border transition-all',
                    pdfSettings.imageLayout === 'center'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <AlignCenter class="w-4 h-4" />
                    <span class="text-sm">居中显示（原始尺寸）</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- 其他选项 -->
            <div class="space-y-2">
              <label class="flex items-center gap-2">
                <input
                  v-model="pdfSettings.addMargin"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">添加页边距</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和转换 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 转换预览 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">PDF预览</h2>

          <div v-if="images.length === 0" class="text-center py-12 text-muted-foreground">
            <FileText class="w-16 h-16 mx-auto mb-4" />
            <p>请添加图片开始转换</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 转换按钮 -->
            <div class="flex justify-center">
              <button
                @click="convertToPDF"
                :disabled="isConverting || images.length === 0"
                class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FileText v-if="!isConverting" class="w-4 h-4" />
                <RefreshCw v-else class="w-4 h-4 animate-spin" />
                {{ isConverting ? '转换中...' : '转换为PDF' }}
              </button>
            </div>

            <!-- 图片预览网格 -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                v-for="(image, index) in images"
                :key="image.id"
                class="space-y-2"
              >
                <div class="relative group">
                  <img
                    :src="image.preview"
                    :alt="image.name"
                    class="w-full h-32 object-cover rounded border"
                  />
                  <div class="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {{ index + 1 }}
                  </div>
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                    <button
                      @click="previewImage(index)"
                      class="p-2 bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground truncate">{{ image.name }}</p>
                <p class="text-xs text-muted-foreground">{{ image.width }}×{{ image.height }}</p>
              </div>
            </div>

            <!-- PDF信息预览 -->
            <div class="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 class="font-medium mb-2">PDF信息</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-muted-foreground">页面数量：</span>
                  <span class="font-medium">{{ images.length }} 页</span>
                </div>
                <div>
                  <span class="text-muted-foreground">页面大小：</span>
                  <span class="font-medium">{{ getPageSizeText() }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">页面方向：</span>
                  <span class="font-medium">{{ pdfSettings.orientation === 'portrait' ? '竖向' : '横向' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">图片布局：</span>
                  <span class="font-medium">{{ getImageLayoutText() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-primary" />
            使用说明
          </h3>
          <div class="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 class="font-medium text-foreground mb-2">支持的格式</h4>
              <p>输入格式：JPG/JPEG、PNG、GIF、BMP、WEBP、TIFF、ICO</p>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-2">使用提示</h4>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>支持批量转换，可同时处理多张图片</li>
                <li>可拖拽调整图片顺序</li>
                <li>支持旋转图片（90度递增）</li>
                <li>可选择不同的页面大小和方向</li>
                <li>支持三种图片布局方式：适应、填充、居中</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card rounded-lg p-6">
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
          </div>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div
      v-if="previewImageIndex !== null"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click="closePreview"
    >
      <div class="relative max-w-4xl max-h-full">
        <img
          :src="images[previewImageIndex].preview"
          :alt="images[previewImageIndex].name"
          class="max-w-full max-h-full object-contain"
        />
        <button
          @click="closePreview"
          class="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-colors"
        >
          <X class="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, X, Eye, RotateCw, FileText, RefreshCw, Maximize2, Expand, AlignCenter, Info, ArrowRight, Zap } from 'lucide-vue-next'
import jsPDF from 'jspdf'

// 状态管理
const fileInput = ref(null)
const isDragging = ref(false)
const isConverting = ref(false)
const previewImageIndex = ref(null)
const images = ref([])
const draggedIndex = ref(null)

// PDF设置
const pdfSettings = reactive({
  pageSize: 'a4',
  orientation: 'portrait',
  imageLayout: 'fit',
  addMargin: true
})

// 页面尺寸配置
const pageSizes = {
  a4: { width: 210, height: 297, name: 'A4' },
  a3: { width: 297, height: 420, name: 'A3' },
  letter: { width: 216, height: 279, name: 'Letter' },
  legal: { width: 216, height: 356, name: 'Legal' }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
  // 清空input以允许重复选择相同文件
  e.target.value = ''
}

// 处理拖拽
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

// 处理文件
const processFiles = (files) => {
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        images.value.push({
          id: Date.now() + Math.random(),
          name: file.name,
          file: file,
          preview: e.target.result,
          rotation: 0,
          size: file.size,
          format: file.type.split('/')[1].toUpperCase(),
          width: img.width,
          height: img.height
        })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 清空所有图片
const clearAll = () => {
  if (confirm('确定要清空所有图片吗？')) {
    images.value = []
  }
}

// 移除图片
const removeImage = (index) => {
  images.value.splice(index, 1)
}

// 旋转图片
const rotateImage = (index) => {
  images.value[index].rotation = (images.value[index].rotation + 90) % 360
}

// 预览图片
const previewImage = (index) => {
  previewImageIndex.value = index
}

// 关闭预览
const closePreview = () => {
  previewImageIndex.value = null
}

// 拖拽排序
const handleDragStart = (index) => {
  draggedIndex.value = index
}

const handleDropImage = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    const draggedItem = images.value[draggedIndex.value]
    images.value.splice(draggedIndex.value, 1)
    images.value.splice(index, 0, draggedItem)
  }
  draggedIndex.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = null
}

// 获取页面大小文本
const getPageSizeText = () => {
  const size = pageSizes[pdfSettings.pageSize]
  return `${size.name} (${size.width} × ${size.height} mm)`
}

// 获取图片布局文本
const getImageLayoutText = () => {
  const layoutMap = {
    fit: '适应页面',
    fill: '填充页面',
    center: '居中显示'
  }
  return layoutMap[pdfSettings.imageLayout]
}

// 转换为PDF
const convertToPDF = async () => {
  if (images.value.length === 0) {
    alert('请先添加图片')
    return
  }

  isConverting.value = true

  try {
    // 获取页面尺寸
    const pageSize = pageSizes[pdfSettings.pageSize]
    const { width, height } = pdfSettings.orientation === 'landscape'
      ? { width: pageSize.height, height: pageSize.width }
      : pageSize

    // 创建PDF文档
    const pdf = new jsPDF({
      orientation: pdfSettings.orientation,
      unit: 'mm',
      format: pdfSettings.pageSize
    })

    // 为每张图片创建页面
    for (let i = 0; i < images.value.length; i++) {
      const image = images.value[i]

      // 如果不是第一页，添加新页
      if (i > 0) {
        pdf.addPage()
      }

      // 创建图片对象
      const img = new Image()
      img.src = image.preview

      // 等待图片加载
      await new Promise((resolve) => {
        img.onload = resolve
      })

      // 计算图片尺寸和位置
      const margin = pdfSettings.addMargin ? 10 : 0
      const availableWidth = width - margin * 2
      const availableHeight = height - margin * 2

      let imgWidth, imgHeight, x, y

      if (pdfSettings.imageLayout === 'fit') {
        // 适应页面（保持比例）
        const scale = Math.min(
          availableWidth / img.width,
          availableHeight / img.height
        )
        imgWidth = img.width * scale
        imgHeight = img.height * scale
        x = (width - imgWidth) / 2
        y = (height - imgHeight) / 2
      } else if (pdfSettings.imageLayout === 'fill') {
        // 填充页面（可能裁剪）
        imgWidth = availableWidth
        imgHeight = availableHeight
        x = margin
        y = margin
      } else {
        // 居中（原始尺寸）
        imgWidth = img.width * 0.264583 // 像素转毫米
        imgHeight = img.height * 0.264583
        x = (width - imgWidth) / 2
        y = (height - imgHeight) / 2
      }

      // 处理旋转
      if (image.rotation !== 0) {
        pdf.saveGraphicsState()
        pdf.translate(width / 2, height / 2)
        pdf.rotate(image.rotation)
        pdf.translate(-width / 2, -height / 2)
      }

      // 添加图片到PDF
      pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight)

      // 恢复旋转状态
      if (image.rotation !== 0) {
        pdf.restoreGraphicsState()
      }
    }

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '')
    const filename = `images_${timestamp}.pdf`

    // 下载PDF
    pdf.save(filename)

    // 显示成功消息
    alert(`PDF生成成功！文件名：${filename}`)

  } catch (error) {
    console.error('生成PDF时出错：', error)
    alert('生成PDF失败，请重试')
  } finally {
    isConverting.value = false
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// SEO配置
useSeoMeta({
  title: '图片转PDF - 在线图片转PDF工具',
  description: '免费在线图片转PDF工具，支持JPG、PNG、GIF等格式，批量转换为PDF文档，支持拖拽排序和页面设置。',
  keywords: ['图片转PDF', 'PDF转换', 'JPG转PDF', 'PNG转PDF', '在线工具']
})

definePageMeta({
  layout: 'default'
})
</script>