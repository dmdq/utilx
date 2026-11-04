<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Base64 图片</h1>
      <p class="text-muted-foreground">图片与 Base64 互转，支持在线预览和下载</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：图片转Base64 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">图片转 Base64</h2>

          <!-- 上传区域 -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer mb-4"
            @drop="handleImageDrop"
            @dragover.prevent
            @dragleave="handleDragLeave"
            @click="triggerImageInput"
          >
            <input
              ref="imageInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleImageSelect"
            />
            <ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p class="text-lg font-medium mb-2">拖拽图片到这里</p>
            <p class="text-sm text-muted-foreground">或者点击选择文件</p>
          </div>

          <!-- 图片预览 -->
          <div v-if="selectedImage" class="space-y-4">
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="text-sm font-medium mb-2">图片预览</h3>
              <img
                :src="selectedImage.url"
                :alt="selectedImage.name"
                class="w-full max-h-64 object-contain rounded"
              />
              <div class="mt-2 text-xs text-muted-foreground">
                {{ selectedImage.name }} • {{ formatFileSize(selectedImage.size) }}
              </div>
            </div>

            <!-- Base64 输出 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium">Base64 编码</h3>
                <div class="flex gap-2">
                  <button
                    @click="copyBase64"
                    class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {{ base64Copied ? '已复制' : '复制' }}
                  </button>
                  <button
                    @click="clearImage"
                    class="px-3 py-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
                  >
                    清空
                  </button>
                </div>
              </div>
              <div class="relative">
                <textarea
                  v-model="base64Output"
                  readonly
                  rows="6"
                  class="w-full px-3 py-2 border border-border rounded-md bg-muted font-mono text-xs resize-none"
                  placeholder="Base64 编码将显示在这里"
                ></textarea>
                <div class="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {{ base64Output.length }} 字符
                </div>
              </div>
            </div>

            <!-- 选项 -->
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input
                  v-model="includePrefix"
                  type="checkbox"
                  class="rounded"
                  @change="updateBase64"
                />
                <span class="text-sm">包含 Data URL 前缀</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="optimizeBase64"
                  type="checkbox"
                  class="rounded"
                  @change="updateBase64"
                />
                <span class="text-sm">移除换行符和空格</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 示例图片 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">示例图片</h2>
          <div class="grid grid-cols-3 gap-2">
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

      <!-- 右侧：Base64转图片 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">Base64 转图片</h2>

          <!-- Base64 输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">粘贴 Base64 字符串</label>
              <textarea
                v-model="base64Input"
                rows="6"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                placeholder="粘贴 Base64 字符串或 Data URL"
                @input="processBase64"
              ></textarea>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
              <button
                @click="processBase64"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                转换为图片
              </button>
              <button
                @click="clearBase64"
                class="px-4 py-2 border border-muted text-muted-foreground rounded-md hover:bg-muted transition-colors"
              >
                清空
              </button>
            </div>

            <!-- 图片预览 -->
            <div v-if="decodedImage" class="space-y-4">
              <div class="p-4 bg-muted rounded-lg">
                <h3 class="text-sm font-medium mb-2">预览</h3>
                <img
                  :src="decodedImage.url"
                  alt="Decoded image"
                  class="w-full max-h-64 object-contain rounded"
                />
                <div class="mt-2 text-xs text-muted-foreground">
                  {{ decodedImage.format }} • {{ formatFileSize(decodedImage.size) }}
                </div>
              </div>

              <!-- 下载选项 -->
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium">文件名</label>
                  <input
                    v-model="downloadFilename"
                    type="text"
                    placeholder="image"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">保存格式</label>
                  <select
                    v-model="downloadFormat"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                <button
                  @click="downloadImage"
                  class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download class="w-4 h-4" />
                  下载图片
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量转换 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">批量转换</h2>
          <p class="text-sm text-muted-foreground mb-4">
            同时处理多个 Base64 字符串，批量转换为图片
          </p>

          <div class="space-y-3">
            <div v-for="(item, index) in batchItems" :key="index" class="space-y-2">
              <textarea
                v-model="item.base64"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-md font-mono text-xs resize-none"
                :placeholder="`Base64 ${index + 1}`"
                @input="updateBatchItem(index)"
              ></textarea>
              <div v-if="item.image" class="flex items-center gap-2 p-2 bg-muted rounded">
                <img :src="item.image" alt="Preview" class="w-12 h-12 object-cover rounded" />
                <span class="text-sm flex-1">已解析</span>
                <button
                  @click="removeBatchItem(index)"
                  class="text-destructive hover:text-destructive/80"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="addBatchItem"
                class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Plus class="w-4 h-4" />
                添加项
              </button>
              <button
                v-if="batchItems.some(item => item.image)"
                @click="downloadAllBatch"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Download class="w-4 h-4" />
                下载所有
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
          关于 Base64
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">什么是 Base64？</h4>
            <p>Base64 是一种基于64个可打印字符来表示二进制数据的编码方法。常用于在文本协议中传输二进制数据。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">Data URL 格式</h4>
            <code class="block bg-muted p-3 rounded-md text-xs">
              data:[MIME-type];base64,[base64-data]
            </code>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">使用场景</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>在 HTML/CSS 中直接嵌入小图片</li>
              <li>电子邮件中的图片附件</li>
              <li>API 接口传输图片数据</li>
              <li>减少 HTTP 请求数量</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">文本Base64编码</p>
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
            to="/tools/html-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Code class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 编码</p>
              <p class="text-xs text-muted-foreground">HTML实体编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Info, ImageIcon, X, Download, Plus, Hash, Zap, Code, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'
import JSZip from 'jszip'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const selectedImage = ref(null)
const base64Output = ref('')
const base64Input = ref('')
const decodedImage = ref(null)
const downloadFilename = ref('image')
const downloadFormat = ref('png')
const includePrefix = ref(true)
const optimizeBase64 = ref(true)
const base64Copied = ref(false)
const imageInput = ref(null)
const batchItems = ref([{ base64: '', image: null }])

// 示例图片
const sampleImages = [
  { id: 1, name: '示例1', url: 'https://picsum.photos/200/200?random=1' },
  { id: 2, name: '示例2', url: 'https://picsum.photos/200/200?random=2' },
  { id: 3, name: '示例3', url: 'https://picsum.photos/200/200?random=3' }
]

// 处理图片选择
const handleImageSelect = (e) => {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

// 处理拖拽
const handleImageDrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

// 处理拖拽离开
const handleDragLeave = () => {
  // 可以添加视觉反馈，例如恢复边框颜色
}

// 处理图片文件
const processImageFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = {
      name: file.name,
      size: file.size,
      url: e.target.result
    }
    updateBase64()
  }
  reader.readAsDataURL(file)
}

// 更新 Base64 输出
const updateBase64 = () => {
  if (!selectedImage.value) return

  let base64 = selectedImage.value.url

  if (!includePrefix.value) {
    base64 = base64.split(',')[1]
  }

  if (optimizeBase64.value) {
    base64 = base64.replace(/\s+/g, '')
  }

  base64Output.value = base64
}

// 加载示例图片
const loadSampleImage = async (sample) => {
  try {
    const response = await fetch(sample.url)
    const blob = await response.blob()
    const file = new File([blob], `${sample.name}.jpg`, { type: 'image/jpeg' })
    processImageFile(file)
  } catch (error) {
    console.error('加载示例图片失败:', error)
  }
}

// 复制 Base64
const copyBase64 = async () => {
  if (!base64Output.value) return

  try {
    await navigator.clipboard.writeText(base64Output.value)
    base64Copied.value = true
    setTimeout(() => {
      base64Copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = base64Output.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    base64Copied.value = true
    setTimeout(() => {
      base64Copied.value = false
    }, 2000)
  }
}

// 清空图片
const clearImage = () => {
  selectedImage.value = null
  base64Output.value = ''
}

// 处理 Base64 输入
const processBase64 = () => {
  if (!base64Input.value) {
    decodedImage.value = null
    return
  }

  try {
    let dataUrl = base64Input.value.trim()

    // 如果不包含 data: 前缀，添加它
    if (!dataUrl.startsWith('data:')) {
      // 尝试检测图片类型
      let mimeType = 'image/png'
      if (dataUrl.startsWith('/9j/')) {
        mimeType = 'image/jpeg'
      } else if (dataUrl.startsWith('R0lGOD')) {
        mimeType = 'image/gif'
      } else if (dataUrl.startsWith('iVBORw0K')) {
        mimeType = 'image/png'
      }
      dataUrl = `data:${mimeType};base64,${dataUrl}`
    }

    // 验证 Data URL
    if (!dataUrl.match(/^data:image\/[a-z]+;base64,/)) {
      throw new Error('无效的 Base64 格式')
    }

    decodedImage.value = {
      url: dataUrl,
      format: dataUrl.split(':')[1].split(';')[0].split('/')[1].toUpperCase(),
      size: Math.round(dataUrl.length * 0.75)
    }
  } catch (error) {
    decodedImage.value = null
    console.error('Base64 解析失败:', error)
  }
}

// 清空 Base64
const clearBase64 = () => {
  base64Input.value = ''
  decodedImage.value = null
}

// 下载图片
const downloadImage = () => {
  if (!decodedImage.value) return

  const link = document.createElement('a')
  link.href = decodedImage.value.url

  // 转换格式
  if (downloadFormat.value !== 'png') {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)

      const mimeType = downloadFormat.value === 'jpeg' ? 'image/jpeg' : 'image/webp'
      const quality = downloadFormat.value === 'jpeg' ? 0.9 : undefined

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = `${downloadFilename.value}.${downloadFormat.value}`
        link.click()
        URL.revokeObjectURL(url)
      }, mimeType, quality)
    }
    img.src = decodedImage.value.url
  } else {
    link.download = `${downloadFilename.value}.png`
    link.click()
  }
}

// 批量处理相关
const addBatchItem = () => {
  batchItems.value.push({ base64: '', image: null })
}

const removeBatchItem = (index) => {
  batchItems.value.splice(index, 1)
  if (batchItems.value.length === 0) {
    addBatchItem()
  }
}

const updateBatchItem = (index) => {
  const item = batchItems.value[index]
  if (!item.base64) {
    item.image = null
    return
  }

  try {
    let dataUrl = item.base64.trim()
    if (!dataUrl.startsWith('data:')) {
      dataUrl = `data:image/png;base64,${dataUrl}`
    }
    item.image = dataUrl
  } catch (error) {
    item.image = null
  }
}

const downloadAllBatch = async () => {
  const zip = new JSZip()

  batchItems.value.forEach((item, index) => {
    if (item.image) {
      // 从 Data URL 转换为 Blob
      const response = fetch(item.image)
      response.then(res => res.blob()).then(blob => {
        zip.file(`image_${index + 1}.png`, blob)
      })
    }
  })

  // 等待所有图片处理完成
  setTimeout(async () => {
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `base64_images_${Date.now()}.zip`
    link.click()
    URL.revokeObjectURL(url)
  }, 1000)
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
const triggerImageInput = () => {
  imageInput.value.click()
}

// SEO配置
useSeoMeta({
  title: 'Base64图片 - 在线图片与Base64互转工具',
  description: '免费在线图片转Base64和Base64转图片工具，支持批量处理，直接预览和下载。',
  keywords: ['base64图片', '图片base64', 'data url', '图片编码', '在线工具']
})


</script>