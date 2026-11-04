<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">表情包制作器</h1>
      <p class="text-muted-foreground">快速制作表情包，支持顶部/底部文字、预设模板</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和编辑 -->
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
          <!-- 预设模板 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">快速预设</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in presets"
                :key="preset.name"
                @click="applyPreset(preset)"
                class="p-2 bg-background rounded hover:bg-muted transition-colors text-xs"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>

          <!-- 顶部文字 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium text-sm">顶部文字</h3>
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" v-model="topText.enabled" @change="updatePreview" class="rounded">
                启用
              </label>
            </div>
            <input
              v-model="topText.text"
              @input="updatePreview"
              type="text"
              class="w-full p-2 border border-border rounded-lg text-sm mb-2"
              placeholder="输入顶部文字..."
            >
            <div class="flex gap-2">
              <input
                v-model="topText.color"
                type="color"
                @input="updatePreview"
                class="w-12 h-8 rounded cursor-pointer"
              >
              <input
                v-model="topText.color"
                type="text"
                @input="updatePreview"
                class="flex-1 p-2 border border-border rounded text-sm font-mono"
              >
            </div>
          </div>

          <!-- 底部文字 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium text-sm">底部文字</h3>
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" v-model="bottomText.enabled" @change="updatePreview" class="rounded">
                启用
              </label>
            </div>
            <input
              v-model="bottomText.text"
              @input="updatePreview"
              type="text"
              class="w-full p-2 border border-border rounded-lg text-sm mb-2"
              placeholder="输入底部文字..."
            >
            <div class="flex gap-2">
              <input
                v-model="bottomText.color"
                type="color"
                @input="updatePreview"
                class="w-12 h-8 rounded cursor-pointer"
              >
              <input
                v-model="bottomText.color"
                type="text"
                @input="updatePreview"
                class="flex-1 p-2 border border-border rounded text-sm font-mono"
              >
            </div>
          </div>

          <!-- 字体大小 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex justify-between text-sm mb-2">
              <label>字体大小</label>
              <span class="text-muted-foreground">{{ fontSize }}px</span>
            </div>
            <input
              v-model.number="fontSize"
              type="range"
              min="20"
              max="100"
              @input="updatePreview"
              class="w-full"
            >
          </div>

          <!-- 字体选择 -->
          <div class="bg-muted p-4 rounded-lg">
            <label class="text-xs text-muted-foreground mb-1 block">字体</label>
            <select v-model="fontFamily" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
              <option value="Impact">Impact (推荐)</option>
              <option value="Arial Black">Arial Black</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Arial">Arial</option>
            </select>
          </div>

          <!-- 文字描边 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium text-sm">文字描边</h3>
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" v-model="strokeEnabled" @change="updatePreview" class="rounded">
                启用
              </label>
            </div>
            <div v-if="strokeEnabled" class="flex gap-2">
              <input
                v-model="strokeColor"
                type="color"
                @input="updatePreview"
                class="w-12 h-8 rounded cursor-pointer"
              >
              <input
                v-model="strokeColor"
                type="text"
                @input="updatePreview"
                class="flex-1 p-2 border border-border rounded text-sm font-mono"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">表情包预览</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后制作表情包
        </div>

        <div v-else class="space-y-4">
          <!-- 预览 -->
          <div class="bg-muted rounded-lg p-4">
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
            ></canvas>
          </div>

          <!-- 热门梗图文字 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">热门文字</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="text in popularTexts"
                :key="text"
                @click="addPopularText(text)"
                class="px-3 py-1 bg-background rounded hover:bg-muted text-xs"
              >
                {{ text }}
              </button>
            </div>
          </div>

          <!-- 下载 -->
          <div class="flex gap-2">
            <button @click="downloadImage" class="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Download class="w-5 h-5 inline mr-2" />
              下载表情包
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useSeoMeta } from '#app'
import { Upload, Download } from 'lucide-vue-next'

const fileInput = ref(null)
const canvas = ref(null)
const imageUrl = ref('')
const originalFile = ref(null)

const topText = ref({ enabled: true, text: '', color: '#ffffff' })
const bottomText = ref({ enabled: true, text: '', color: '#ffffff' })
const fontSize = ref(50)
const fontFamily = ref('Impact')
const strokeEnabled = ref(true)
const strokeColor = ref('#000000')

const presets = [
  { name: '经典梗', top: '', bottom: '' },
  { name: '震惊', top: '震惊！', bottom: '' },
  { name: '真香', top: '就这？', bottom: '真香' },
  { name: '我太南了', top: '', bottom: '我太南了' },
  { name: '这就是...', top: '这就是...', bottom: '爱' },
  { name: '为什么', top: '为什么', bottom: '为什么会这样' }
]

const popularTexts = [
  '当你在代码里写 bug',
  '我太南了',
  '真香',
  '这是什么',
  '为什么会这样',
  '就这？',
  '我没事',
  '我太难了',
  '这就是爱',
  '这是什么神仙操作',
  '我不要你觉得',
  '我不要你觉得，我要我觉得'
]

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
  reader.onload = async (e) => {
    imageUrl.value = e.target.result
    resetText()
    await nextTick()
    updatePreview()
  }
  reader.readAsDataURL(file)
}

const applyPreset = (preset) => {
  topText.value.text = preset.top
  bottomText.value.text = preset.bottom
  topText.value.enabled = !!preset.top
  bottomText.value.enabled = !!preset.bottom
  updatePreview()
}

const addPopularText = (text) => {
  if (!bottomText.value.text) {
    bottomText.value.text = text
    bottomText.value.enabled = true
  } else {
    topText.value.text = text
    topText.value.enabled = true
  }
  updatePreview()
}

const resetText = () => {
  topText.value = { enabled: true, text: '', color: '#ffffff' }
  bottomText.value = { enabled: true, text: '', color: '#ffffff' }
}

const updatePreview = () => {
  if (!imageUrl.value || !canvas.value) return

  const img = new Image()
  img.onload = () => {
    const ctx = canvas.value.getContext('2d')
    canvas.value.width = img.naturalWidth
    canvas.value.height = img.naturalHeight

    // 绘制图片
    ctx.drawImage(img, 0, 0)

    // 配置字体
    ctx.font = `bold ${fontSize.value}px ${fontFamily.value}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const padding = fontSize.value * 0.1
    const lineHeight = fontSize.value * 1.2

    // 绘制顶部文字
    if (topText.value.enabled && topText.value.text) {
      const y = padding
      drawMemeText(ctx, topText.value.text, canvas.value.width / 2, y, topText.value.color)
    }

    // 绘制底部文字
    if (bottomText.value.enabled && bottomText.value.text) {
      const lines = bottomText.value.text.split(' ')
      let x = canvas.value.width / 2
      let y = canvas.value.height - fontSize.value - padding

      ctx.textBaseline = 'bottom'
      drawMemeText(ctx, bottomText.value.text, x, y, bottomText.value.color)
    }
  }
  img.src = imageUrl.value
}

const drawMemeText = (ctx, text, x, y, color) => {
  const words = text.toUpperCase().split(' ')
  const lineHeight = fontSize.value * 1.2
  const maxWidth = canvas.value.width - fontSize.value * 0.2

  // 自动换行
  let lines = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i]
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = words[i]
    } else {
      currentLine = testLine
    }
  }
  lines.push(currentLine)

  // 绘制文字
  lines.forEach((line, index) => {
    const lineY = y + index * lineHeight

    // 描边
    if (strokeEnabled.value) {
      ctx.strokeStyle = strokeColor.value
      ctx.lineWidth = fontSize.value / 15
      ctx.lineJoin = 'round'
      ctx.strokeText(line, x, lineY)
    }

    // 填充
    ctx.fillStyle = color
    ctx.fillText(line, x, lineY)
  })
}

const clearImage = () => {
  imageUrl.value = ''
  originalFile.value = null
  resetText()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')

  const originalName = originalFile.value?.name || 'image'
  const dotIndex = originalName.lastIndexOf('.')
  const name = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName

  link.download = `${name}_meme.png`
  link.click()
}

useSeoMeta({
  title: '表情包制作器 - 在线表情包梗图制作工具',
  description: '免费在线表情包制作工具，快速制作梗图表情包，支持顶部底部文字、预设模板、自定义字体颜色。',
  keywords: ['表情包', '梗图', 'meme', '制作', '生成', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('表情包制作器')
</script>
