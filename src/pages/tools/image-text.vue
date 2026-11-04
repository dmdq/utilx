<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片添加文字工具</h1>
      <p class="text-muted-foreground">在图片上添加文字标题、说明，支持自定义字体、颜色和样式</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和设置 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传图片</h2>
          <div class="flex gap-2">
            <button @click="addTextLayer" class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">+ 添加文字</button>
            <button @click="clearImage" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
          </div>
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
          <!-- 文字图层列表 -->
          <div class="bg-muted p-4 rounded-lg space-y-3">
            <h3 class="font-medium text-sm">文字图层</h3>

            <div
              v-for="(layer, index) in textLayers"
              :key="index"
              :class="['p-3 bg-background rounded-lg cursor-pointer border-2 transition-colors', selectedLayer === index ? 'border-primary' : 'border-transparent']"
              @click="selectLayer(index)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ layer.text || '空文字' }}</span>
                <div class="flex gap-1">
                  <button @click.stop="moveLayer(index, -1)" :disabled="index === 0" class="p-1 text-xs hover:bg-muted rounded disabled:opacity-50">↑</button>
                  <button @click.stop="moveLayer(index, 1)" :disabled="index === textLayers.length - 1" class="p-1 text-xs hover:bg-muted rounded disabled:opacity-50">↓</button>
                  <button @click.stop="deleteLayer(index)" class="p-1 text-xs hover:bg-red-500 hover:text-white rounded">✕</button>
                </div>
              </div>
            </div>

            <div v-if="textLayers.length === 0" class="text-center text-sm text-muted-foreground py-4">
              点击"添加文字"创建新图层
            </div>
          </div>

          <!-- 文字编辑 -->
          <div v-if="selectedLayer !== null && textLayers[selectedLayer]" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">文字编辑</h3>

            <!-- 文字内容 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">文字内容</label>
              <textarea
                v-model="textLayers[selectedLayer].text"
                @input="updatePreview"
                class="w-full p-2 border border-border rounded-lg text-sm"
                rows="2"
                placeholder="输入文字..."
              ></textarea>
            </div>

            <!-- 字体选择 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">字体</label>
              <select v-model="textLayers[selectedLayer].fontFamily" @change="updatePreview" class="w-full p-2 border border-border rounded-lg text-sm">
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
            </div>

            <!-- 字体大小 -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>字体大小</label>
                <span>{{ textLayers[selectedLayer].fontSize }}px</span>
              </div>
              <input
                v-model.number="textLayers[selectedLayer].fontSize"
                type="range"
                min="12"
                max="200"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <!-- 文字颜色 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">文字颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="textLayers[selectedLayer].color"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="textLayers[selectedLayer].color"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded-lg text-sm font-mono"
                >
              </div>
            </div>

            <!-- 位置 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>X 位置</label>
                  <span>{{ Math.round(textLayers[selectedLayer].x) }}%</span>
                </div>
                <input
                  v-model.number="textLayers[selectedLayer].x"
                  type="range"
                  min="0"
                  max="100"
                  @input="updatePreview"
                  class="w-full"
                >
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>Y 位置</label>
                  <span>{{ Math.round(textLayers[selectedLayer].y) }}%</span>
                </div>
                <input
                  v-model.number="textLayers[selectedLayer].y"
                  type="range"
                  min="0"
                  max="100"
                  @input="updatePreview"
                  class="w-full"
                >
              </div>
            </div>

            <!-- 文字样式 -->
            <div class="flex gap-2">
              <button
                @click="textLayers[selectedLayer].bold = !textLayers[selectedLayer].bold; updatePreview()"
                :class="['flex-1 p-2 text-sm rounded', textLayers[selectedLayer].bold ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                <span class="font-bold">B 粗体</span>
              </button>
              <button
                @click="textLayers[selectedLayer].italic = !textLayers[selectedLayer].italic; updatePreview()"
                :class="['flex-1 p-2 text-sm rounded', textLayers[selectedLayer].italic ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
              >
                <span class="italic">I 斜体</span>
              </button>
            </div>

            <!-- 文字阴影 -->
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="textLayers[selectedLayer].shadow"
                  @change="updatePreview"
                  class="rounded"
                >
                <span class="text-sm">启用阴影</span>
              </label>
              <div v-if="textLayers[selectedLayer].shadow" class="mt-2 space-y-2">
                <input
                  v-model="textLayers[selectedLayer].shadowColor"
                  type="color"
                  @input="updatePreview"
                  class="w-full h-8 rounded cursor-pointer"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">效果预览</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后添加文字
        </div>

        <div v-else class="space-y-4">
          <!-- 预览画布 -->
          <div class="bg-muted rounded-lg p-4">
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
            ></canvas>
          </div>

          <!-- 快速位置 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-3">快速位置</h3>
            <div class="grid grid-cols-3 gap-2">
              <button @click="setPosition('top-left')" class="p-2 bg-background rounded hover:bg-muted text-xs">↖ 左上</button>
              <button @click="setPosition('top-center')" class="p-2 bg-background rounded hover:bg-muted text-xs">↑ 上中</button>
              <button @click="setPosition('top-right')" class="p-2 bg-background rounded hover:bg-muted text-xs">↗ 右上</button>
              <button @click="setPosition('middle-left')" class="p-2 bg-background rounded hover:bg-muted text-xs">← 左中</button>
              <button @click="setPosition('center')" class="p-2 bg-background rounded hover:bg-muted text-xs">⊙ 居中</button>
              <button @click="setPosition('middle-right')" class="p-2 bg-background rounded hover:bg-muted text-xs">→ 右中</button>
              <button @click="setPosition('bottom-left')" class="p-2 bg-background rounded hover:bg-muted text-xs">↙ 左下</button>
              <button @click="setPosition('bottom-center')" class="p-2 bg-background rounded hover:bg-muted text-xs">↓ 下中</button>
              <button @click="setPosition('bottom-right')" class="p-2 bg-background rounded hover:bg-muted text-xs">↘ 右下</button>
            </div>
          </div>

          <!-- 下载按钮 -->
          <div class="flex gap-2">
            <button @click="downloadImage" class="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Download class="w-5 h-5 inline mr-2" />
              下载图片
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
const textLayers = ref([])
const selectedLayer = ref(null)

const defaultLayer = {
  text: '输入文字',
  fontFamily: 'Arial',
  fontSize: 48,
  color: '#ffffff',
  x: 50,
  y: 50,
  bold: false,
  italic: false,
  shadow: false,
  shadowColor: '#000000'
}

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
    textLayers.value = []
    selectedLayer.value = null
    await nextTick()
    updatePreview()
  }
  reader.readAsDataURL(file)
}

const addTextLayer = () => {
  if (!imageUrl.value) return
  textLayers.value.push({ ...defaultLayer })
  selectedLayer.value = textLayers.value.length - 1
  updatePreview()
}

const selectLayer = (index) => {
  selectedLayer.value = index
}

const deleteLayer = (index) => {
  textLayers.value.splice(index, 1)
  if (selectedLayer.value === index) {
    selectedLayer.value = textLayers.value.length > 0 ? 0 : null
  } else if (selectedLayer.value > index) {
    selectedLayer.value--
  }
  updatePreview()
}

const moveLayer = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= textLayers.value.length) return
  const layer = textLayers.value.splice(index, 1)[0]
  textLayers.value.splice(newIndex, 0, layer)
  selectedLayer.value = newIndex
  updatePreview()
}

const setPosition = (position) => {
  if (selectedLayer.value === null) return

  const positions = {
    'top-left': { x: 10, y: 10 },
    'top-center': { x: 50, y: 10 },
    'top-right': { x: 90, y: 10 },
    'middle-left': { x: 10, y: 50 },
    'center': { x: 50, y: 50 },
    'middle-right': { x: 90, y: 50 },
    'bottom-left': { x: 10, y: 90 },
    'bottom-center': { x: 50, y: 90 },
    'bottom-right': { x: 90, y: 90 }
  }

  const pos = positions[position]
  if (pos) {
    textLayers.value[selectedLayer.value].x = pos.x
    textLayers.value[selectedLayer.value].y = pos.y
    updatePreview()
  }
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

    // 绘制文字图层
    textLayers.value.forEach(layer => {
      if (!layer.text) return

      const x = (layer.x / 100) * canvas.value.width
      const y = (layer.y / 100) * canvas.value.height

      ctx.save()

      // 字体样式
      let fontStyle = ''
      if (layer.italic) fontStyle += 'italic '
      if (layer.bold) fontStyle += 'bold '
      ctx.font = `${fontStyle}${layer.fontSize}px ${layer.fontFamily}`

      // 阴影
      if (layer.shadow) {
        ctx.shadowColor = layer.shadowColor
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }

      // 文字颜色和对齐
      ctx.fillStyle = layer.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // 绘制文字（支持换行）
      const lines = layer.text.split('\\n')
      const lineHeight = layer.fontSize * 1.2
      const totalHeight = lines.length * lineHeight

      lines.forEach((line, index) => {
        const lineY = y - totalHeight / 2 + index * lineHeight + lineHeight / 2
        ctx.fillText(line, x, lineY)
      })

      ctx.restore()
    })
  }
  img.src = imageUrl.value
}

const clearImage = () => {
  imageUrl.value = ''
  originalFile.value = null
  textLayers.value = []
  selectedLayer.value = null
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

  link.download = `${name}_text.png`
  link.click()
}

useSeoMeta({
  title: '图片添加文字 - 在线图片文字添加工具',
  description: '免费在线图片文字添加工具，支持在图片上添加标题、说明文字，自定义字体、颜色、大小和样式。',
  keywords: ['图片文字', '添加文字', '水印文字', 'image text', 'text overlay', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片添加文字工具')
</script>
