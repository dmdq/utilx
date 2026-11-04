<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片旋转翻转工具</h1>
      <p class="text-muted-foreground">在线旋转、翻转图片，支持自定义角度和方向</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和预览 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传图片</h2>
          <button @click="clearImage" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
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
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">原图预览</span>
              <span class="text-xs text-muted-foreground">{{ originalInfo }}</span>
            </div>
            <img :src="imageUrl" class="max-w-full h-auto rounded-lg" alt="原图" />
          </div>
        </div>
      </div>

      <!-- 右侧：操作和结果 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">旋转翻转操作</h2>

        <div class="bg-muted p-4 rounded-lg space-y-4">
          <!-- 快速旋转 -->
          <div>
            <h3 class="font-medium text-sm mb-2">快速旋转</h3>
            <div class="grid grid-cols-4 gap-2">
              <button @click="rotate(-90)" class="p-2 bg-background rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <RotateCcw class="w-5 h-5 mx-auto" />
                <span class="text-xs mt-1 block">-90°</span>
              </button>
              <button @click="rotate(90)" class="p-2 bg-background rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <RotateCw class="w-5 h-5 mx-auto" />
                <span class="text-xs mt-1 block">+90°</span>
              </button>
              <button @click="rotate(180)" class="p-2 bg-background rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <span class="text-sm font-bold">180°</span>
                <span class="text-xs mt-1 block">翻转</span>
              </button>
              <button @click="resetRotation" class="p-2 bg-background rounded-lg hover:bg-muted-foreground hover:text-background transition-colors">
                <span class="text-sm font-bold">0°</span>
                <span class="text-xs mt-1 block">重置</span>
              </button>
            </div>
          </div>

          <!-- 自定义角度 -->
          <div>
            <h3 class="font-medium text-sm mb-2">自定义角度</h3>
            <div class="flex gap-2 items-center">
              <input
                v-model.number="customAngle"
                type="number"
                min="0"
                max="360"
                class="flex-1 p-2 border border-border rounded-lg text-sm"
              >
              <button @click="applyCustomAngle" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                应用
              </button>
            </div>
          </div>

          <!-- 翻转操作 -->
          <div>
            <h3 class="font-medium text-sm mb-2">翻转</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="flipHorizontal" class="p-3 bg-background rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <ArrowLeftRight class="w-5 h-5 mx-auto" />
                <span class="text-xs mt-1 block">水平翻转</span>
              </button>
              <button @click="flipVertical" class="p-3 bg-background rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <ArrowUpDown class="w-5 h-5 mx-auto" />
                <span class="text-xs mt-1 block">垂直翻转</span>
              </button>
            </div>
          </div>

          <!-- 当前状态 -->
          <div class="text-sm text-muted-foreground">
            <p>当前旋转: {{ rotation }}°</p>
            <p>水平翻转: {{ flipH ? '是' : '否' }} | 垂直翻转: {{ flipV ? '是' : '否' }}</p>
          </div>
        </div>

        <!-- 结果预览 -->
        <div v-if="processedUrl" class="bg-muted rounded-lg p-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-muted-foreground">处理后预览</span>
            <span class="text-xs text-muted-foreground">{{ processedInfo }}</span>
          </div>
          <img :src="processedUrl" class="max-w-full h-auto rounded-lg" alt="处理后图片" />
        </div>

        <!-- 下载按钮 -->
        <div v-if="processedUrl" class="flex gap-2">
          <button @click="downloadImage" class="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            <Download class="w-5 h-5 inline mr-2" />
            下载图片
          </button>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">使用说明</h3>
      <div class="text-xs text-muted-foreground space-y-1">
        <p>• 支持 JPG、PNG、WebP 等常见图片格式</p>
        <p>• 旋转角度支持 0-360 度自定义</p>
        <p>• 可同时进行旋转和翻转操作</p>
        <p>• 处理后的图片将保持原始分辨率</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSeoMeta } from '#app'
import {
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  ArrowLeftRight,
  ArrowUpDown
} from 'lucide-vue-next'

const fileInput = ref(null)
const imageUrl = ref('')
const processedUrl = ref('')
const rotation = ref(0)
const flipH = ref(false)
const flipV = ref(false)
const customAngle = ref(0)
const originalFile = ref(null)

const originalInfo = computed(() => {
  if (!imageUrl.value) return ''
  const img = new Image()
  img.src = imageUrl.value
  return `${img.naturalWidth || '?'} x ${img.naturalHeight || '?'} px`
})

const processedInfo = computed(() => {
  if (!processedUrl.value) return ''
  return `旋转 ${rotation.value}° | 水平翻转 ${flipH.value ? '是' : '否'} | 垂直翻转 ${flipV.value ? '是' : '否'}`
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
    rotation.value = 0
    flipH.value = false
    flipV.value = false
    processImage()
  }
  reader.readAsDataURL(file)
}

const processImage = () => {
  if (!imageUrl.value) return

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 计算旋转后的画布尺寸
    const radians = (rotation.value * Math.PI) / 180
    const sin = Math.abs(Math.sin(radians))
    const cos = Math.abs(Math.cos(radians))

    const width = img.naturalWidth
    const height = img.naturalHeight

    const newWidth = Math.floor(width * cos + height * sin)
    const newHeight = Math.floor(width * sin + height * cos)

    canvas.width = newWidth
    canvas.height = newHeight

    // 移动到中心
    ctx.translate(newWidth / 2, newHeight / 2)

    // 旋转
    ctx.rotate((rotation.value * Math.PI) / 180)

    // 翻转
    ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)

    // 绘制图片（居中）
    ctx.drawImage(img, -width / 2, -height / 2)

    processedUrl.value = canvas.toDataURL(originalFile.value?.type || 'image/png')
  }
  img.src = imageUrl.value
}

const rotate = (angle) => {
  rotation.value = (rotation.value + angle + 360) % 360
  processImage()
}

const applyCustomAngle = () => {
  rotation.value = (customAngle.value + 360) % 360
  processImage()
}

const resetRotation = () => {
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  processImage()
}

const flipHorizontal = () => {
  flipH.value = !flipH.value
  processImage()
}

const flipVertical = () => {
  flipV.value = !flipV.value
  processImage()
}

const clearImage = () => {
  imageUrl.value = ''
  processedUrl.value = ''
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  originalFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const downloadImage = () => {
  if (!processedUrl.value) return

  const link = document.createElement('a')
  link.href = processedUrl.value

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName
  const ext = originalFile.value?.type?.includes('png') ? 'png' : 'jpg'

  link.download = `${name}_rotated.${ext}`
  link.click()
}

useSeoMeta({
  title: '图片旋转翻转 - 在线图片旋转翻转工具',
  description: '免费在线图片旋转翻转工具，支持自定义角度旋转、水平翻转、垂直翻转，保持原始图片质量。',
  keywords: ['图片旋转', '图片翻转', '旋转', '翻转', 'image', 'rotate', 'flip', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片旋转翻转工具')
</script>
