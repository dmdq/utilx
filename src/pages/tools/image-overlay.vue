<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">图片叠加工具</h1>
      <p class="text-muted-foreground">多张图片叠加混合，支持多种混合模式、渐变蒙版和透明度调整</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和设置 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">图片图层</h2>
          <button @click="clearAll" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
        </div>

        <!-- 底图上传 -->
        <div
          v-if="layers.length === 0"
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="hidden"
          >
          <Upload class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">拖拽图片到此处</p>
          <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            选择图片
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- 图层列表 -->
          <div class="bg-muted p-4 rounded-lg space-y-3">
            <h3 class="font-medium text-sm mb-2">图层管理</h3>

            <div
              v-for="(layer, index) in layers"
              :key="index"
              :class="['p-3 bg-background rounded-lg cursor-pointer border-2 transition-colors', selectedLayer === index ? 'border-primary' : 'border-transparent']"
              @click="selectLayer(index)"
            >
              <div class="flex items-center gap-3">
                <img :src="layer.url" class="w-16 h-16 object-cover rounded" alt="图层">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ layer.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ getBlendModeName(layer.blendMode) }} - {{ Math.round(layer.opacity * 100) }}%</div>
                </div>
                <div class="flex gap-1">
                  <button @click.stop="moveLayer(index, -1)" :disabled="index === 0" class="p-1 text-xs hover:bg-muted rounded disabled:opacity-50">↑</button>
                  <button @click.stop="moveLayer(index, 1)" :disabled="index === layers.length - 1" class="p-1 text-xs hover:bg-muted rounded disabled:opacity-50">↓</button>
                  <button @click.stop="deleteLayer(index)" class="p-1 text-xs hover:bg-red-500 hover:text-white rounded">✕</button>
                </div>
              </div>
            </div>

            <button @click="addLayer" class="w-full p-3 bg-background rounded-lg hover:bg-muted text-sm border-2 border-dashed">
              + 添加图层
            </button>
          </div>

          <!-- 图层编辑 -->
          <div v-if="selectedLayer !== null && layers[selectedLayer]" class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">图层编辑</h3>

            <!-- 混合模式 -->
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">混合模式</label>
              <select v-model="layers[selectedLayer].blendMode" @change="updatePreview" class="w-full p-2 border border-border rounded-lg text-sm">
                <option value="source-over">正常 (Normal)</option>
                <option value="multiply">正片叠底 (Multiply)</option>
                <option value="screen">滤色 (Screen)</option>
                <option value="overlay">叠加 (Overlay)</option>
                <option value="darken">变暗 (Darken)</option>
                <option value="lighten">变亮 (Lighten)</option>
                <option value="color-dodge">颜色减淡 (Color Dodge)</option>
                <option value="color-burn">颜色加深 (Color Burn)</option>
                <option value="hard-light">强光 (Hard Light)</option>
                <option value="soft-light">柔光 (Soft Light)</option>
                <option value="difference">差值 (Difference)</option>
                <option value="exclusion">排除 (Exclusion)</option>
                <option value="hue">色相 (Hue)</option>
                <option value="saturation">饱和度 (Saturation)</option>
                <option value="color">颜色 (Color)</option>
                <option value="luminosity">亮度 (Luminosity)</option>
              </select>
            </div>

            <!-- 不透明度 -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>不透明度</label>
                <span>{{ Math.round(layers[selectedLayer].opacity * 100) }}%</span>
              </div>
              <input
                v-model.number="layers[selectedLayer].opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <!-- 位置调整 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <label>X 位置</label>
                  <span>{{ Math.round(layers[selectedLayer].x) }}%</span>
                </div>
                <input
                  v-model.number="layers[selectedLayer].x"
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
                  <span>{{ Math.round(layers[selectedLayer].y) }}%</span>
                </div>
                <input
                  v-model.number="layers[selectedLayer].y"
                  type="range"
                  min="0"
                  max="100"
                  @input="updatePreview"
                  class="w-full"
                >
              </div>
            </div>

            <!-- 缩放 -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>缩放</label>
                <span>{{ Math.round(layers[selectedLayer].scale * 100) }}%</span>
              </div>
              <input
                v-model.number="layers[selectedLayer].scale"
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                @input="updatePreview"
                class="w-full"
              >
            </div>

            <!-- 旋转 -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <label>旋转</label>
                <span>{{ layers[selectedLayer].rotation }}°</span>
              </div>
              <input
                v-model.number="layers[selectedLayer].rotation"
                type="range"
                min="0"
                max="360"
                @input="updatePreview"
                class="w-full"
              >
            </div>
          </div>

          <!-- 渐变蒙版 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">渐变蒙版</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="useGradient" @change="updatePreview" class="rounded">
              <span class="text-sm">启用渐变蒙版</span>
            </label>

            <div v-if="useGradient" class="space-y-3">
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">渐变方向</label>
                <select v-model="gradientDirection" @change="updatePreview" class="w-full p-2 border border-border rounded-lg text-sm">
                  <option value="to-right">从左到右</option>
                  <option value="to-left">从右到左</option>
                  <option value="to-bottom">从上到下</option>
                  <option value="to-top">从下到上</option>
                  <option value="to-br">对角线 (左上到右下)</option>
                  <option value="to-tl">对角线 (右下到左上)</option>
                </select>
              </div>

              <div>
                <label class="text-xs text-muted-foreground mb-1 block">渐变颜色</label>
                <div class="flex gap-2">
                  <input
                    v-model="gradientStart"
                    type="color"
                    @input="updatePreview"
                    class="w-12 h-8 rounded cursor-pointer"
                  >
                  <input
                    v-model="gradientEnd"
                    type="color"
                    @input="updatePreview"
                    class="w-12 h-8 rounded cursor-pointer"
                  >
                  <input
                    v-model="gradientEnd"
                    type="text"
                    @input="updatePreview"
                    class="flex-1 p-2 border border-border rounded text-sm font-mono"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">效果预览</h2>

        <div v-if="layers.length === 0" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          添加图片后查看叠加效果
        </div>

        <div v-else class="space-y-4">
          <!-- 预览画布 -->
          <div class="bg-muted rounded-lg p-4">
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg"
            ></canvas>
          </div>

          <!-- 输出信息 -->
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-2">输出信息</h3>
            <div class="text-xs text-muted-foreground space-y-1">
              <p>图层数量: {{ layers.length }} 张</p>
              <p>输出尺寸: {{ outputSize.width }} x {{ outputSize.height }} px</p>
            </div>
          </div>

          <!-- 下载 -->
          <div class="flex gap-2">
            <button @click="downloadImage" class="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Download class="w-5 h-5 inline mr-2" />
              下载图片
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">混合模式说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div>
          <p class="font-medium text-foreground mb-1">正片叠底</p>
          <p>查看每个通道中的颜色信息，并将基色与混合色复合</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">滤色</p>
          <p>将混合色的互补色与基色复合，产生更亮的效果</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">叠加</p>
          <p>对颜色进行正片叠底或滤色，取决于基色</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useSeoMeta } from '#app'
import { Upload, Download } from 'lucide-vue-next'

const fileInput = ref(null)
const canvas = ref(null)
const layers = ref([])
const selectedLayer = ref(null)
const useGradient = ref(false)
const gradientDirection = ref('to-right')
const gradientStart = ref('#000000')
const gradientEnd = ref('#ffffff')

const defaultLayer = {
  url: '',
  name: '',
  file: null,
  blendMode: 'source-over',
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
}

const outputSize = computed(() => {
  if (!canvas.value) return { width: 0, height: 0 }
  return { width: canvas.value.width, height: canvas.value.height }
})

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || []).filter(f => f.type.startsWith('image/'))
  files.forEach(file => addImageLayer(file))
}

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
  files.forEach(file => addImageLayer(file))
}

const addImageLayer = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    layers.value.push({
      ...defaultLayer,
      url: e.target.result,
      file,
      name: file.name
    })
    selectedLayer.value = layers.value.length - 1
    nextTick(() => updatePreview())
  }
  reader.readAsDataURL(file)
}

const addLayer = () => {
  fileInput.value.click()
}

const selectLayer = (index) => {
  selectedLayer.value = index
}

const deleteLayer = (index) => {
  layers.value.splice(index, 1)
  if (selectedLayer.value === index) {
    selectedLayer.value = layers.value.length > 0 ? 0 : null
  } else if (selectedLayer.value > index) {
    selectedLayer.value--
  }
  updatePreview()
}

const moveLayer = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= layers.value.length) return
  const layer = layers.value.splice(index, 1)[0]
  layers.value.splice(newIndex, 0, layer)
  selectedLayer.value = newIndex
  updatePreview()
}

const getBlendModeName = (mode) => {
  const names = {
    'source-over': '正常',
    'multiply': '正片叠底',
    'screen': '滤色',
    'overlay': '叠加',
    'darken': '变暗',
    'lighten': '变亮',
    'color-dodge': '颜色减淡',
    'color-burn': '颜色加深',
    'hard-light': '强光',
    'soft-light': '柔光',
    'difference': '差值',
    'exclusion': '排除',
    'hue': '色相',
    'saturation': '饱和度',
    'color': '颜色',
    'luminosity': '亮度'
  }
  return names[mode] || mode
}

const updatePreview = () => {
  if (!canvas.value || layers.value.length === 0) return

  const ctx = canvas.value.getContext('2d')

  // 使用第一个图层作为底图尺寸
  const firstImg = new Image()
  firstImg.onload = () => {
    canvas.value.width = firstImg.naturalWidth
    canvas.value.height = firstImg.naturalHeight

    // 绘制渐变蒙版背景
    if (useGradient.value) {
      drawGradient(ctx)
    }

    // 绘制所有图层
    let loadedCount = 0
    layers.value.forEach((layer, index) => {
      const img = new Image()
      img.onload = () => {
        ctx.save()
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = layer.blendMode

        // 计算位置和变换
        const x = (layer.x / 100) * canvas.value.width
        const y = (layer.y / 100) * canvas.value.height
        const scaledWidth = img.naturalWidth * layer.scale
        const scaledHeight = img.naturalHeight * layer.scale

        ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
        ctx.restore()

        loadedCount++
        if (loadedCount === layers.value.length) {
          // 所有图层加载完成
        }
      }
      img.src = layer.url
    })
  }
  firstImg.src = layers.value[0].url
}

const drawGradient = (ctx) => {
  let x1 = 0, y1 = 0, x2 = canvas.value.width, y2 = canvas.value.height

  switch (gradientDirection.value) {
    case 'to-right':
      x1 = 0
      y1 = 0
      x2 = canvas.value.width
      y2 = 0
      break
    case 'to-left':
      x1 = canvas.value.width
      y1 = 0
      x2 = 0
      y2 = 0
      break
    case 'to-bottom':
      x1 = 0
      y1 = 0
      x2 = 0
      y2 = canvas.value.height
      break
    case 'to-top':
      x1 = 0
      y1 = canvas.value.height
      x2 = 0
      y2 = 0
      break
    case 'to-br':
      x1 = 0
      y1 = 0
      x2 = canvas.value.width
      y2 = canvas.value.height
      break
    case 'to-tl':
      x1 = canvas.value.width
      y1 = canvas.value.height
      x2 = 0
      y2 = 0
      break
  }

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  gradient.addColorStop(0, gradientStart.value)
  gradient.addColorStop(1, gradientEnd.value)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
}

const clearAll = () => {
  layers.value = []
  selectedLayer.value = null
}

const downloadImage = () => {
  if (!canvas.value) return

  const link = document.createElement('a')
  link.href = canvas.value.toDataURL('image/png')
  link.download = `overlay_${layers.value.length}layers.png`
  link.click()
}

useSeoMeta({
  title: '图片叠加 - 在线图片叠加混合工具',
  description: '免费在线图片叠加工具，支持多种混合模式、渐变蒙版、透明度调整，创建专业图片叠加效果。',
  keywords: ['图片叠加', '混合模式', '图片合成', 'overlay', 'blend', '图层', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('图片叠加工具')
</script>
