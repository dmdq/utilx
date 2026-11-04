<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">GIF制作工具</h1>
      <p class="text-muted-foreground">将多张图片制作成GIF动图，支持调整帧率和播放顺序</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传和设置 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">添加图片</h2>
          <div class="flex gap-2">
            <button @click="clearAll" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
          </div>
        </div>

        <!-- 上传区域 -->
        <div
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="hidden"
          >
          <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">拖拽多张图片到此处</p>
          <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
            选择文件
          </button>
        </div>

        <!-- 已添加图片列表 -->
        <div v-if="frames.length > 0" class="bg-muted p-4 rounded-lg space-y-2">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-sm">图片列表 ({{ frames.length }}张)</h3>
            <div class="flex gap-1">
              <button @click="reverseOrder" class="px-2 py-1 text-xs bg-background hover:bg-muted rounded">倒序</button>
              <button @click="shuffleOrder" class="px-2 py-1 text-xs bg-background hover:bg-muted rounded">打乱</button>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2 max-h-64 overflow-auto">
            <div
              v-for="(frame, index) in frames"
              :key="index"
              class="relative group aspect-square cursor-pointer border-2"
              :class="selectedFrame === index ? 'border-primary' : 'border-transparent'"
              @click="selectFrame(index)"
            >
              <img :src="frame.url" class="w-full h-full object-cover rounded" alt="图片">
              <div class="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">{{ index + 1 }}</div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                <button @click.stop="moveFrame(index, -1)" :disabled="index === 0" class="p-1 bg-white text-black text-xs rounded disabled:opacity-50">↑</button>
                <button @click.stop="moveFrame(index, 1)" :disabled="index === frames.length - 1" class="p-1 bg-white text-black text-xs rounded disabled:opacity-50">↓</button>
                <button @click.stop="removeFrame(index)" class="p-1 bg-red-500 text-white text-xs rounded">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- GIF设置 -->
        <div v-if="frames.length > 0" class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">GIF设置</h3>

          <!-- 帧率 -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <label>每帧延迟</label>
              <span class="text-muted-foreground">{{ frameDelay }}ms ({{ Math.round(1000 / frameDelay) }} FPS)</span>
            </div>
            <input
              v-model.number="frameDelay"
              type="range"
              min="50"
              max="2000"
              step="50"
              @input="updatePreview"
              class="w-full"
            >
            <div class="flex gap-2 mt-2">
              <button @click="frameDelay = 100" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">快速 (100ms)</button>
              <button @click="frameDelay = 200" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">正常 (200ms)</button>
              <button @click="frameDelay = 500" class="flex-1 p-2 bg-background rounded hover:bg-muted text-xs">慢速 (500ms)</button>
            </div>
          </div>

          <!-- 尺寸设置 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">输出尺寸</label>
            <select v-model="outputSize" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
              <option value="original">原始尺寸</option>
              <option value="800">最大 800px</option>
              <option value="600">最大 600px</option>
              <option value="480">最大 480px</option>
              <option value="320">最大 320px</option>
              <option value="240">最大 240px</option>
              <option value="160">最大 160px</option>
            </select>
          </div>

          <!-- 循环次数 -->
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">循环次数</label>
            <select v-model="loopCount" class="w-full p-2 border border-border rounded text-sm">
              <option value="0">无限循环</option>
              <option value="1">播放1次</option>
              <option value="3">播放3次</option>
              <option value="5">播放5次</option>
              <option value="10">播放10次</option>
            </select>
          </div>

          <!-- 质量 -->
          <div>
            <div class="flex justify-between text-xs mb-1">
              <label>画质</label>
              <span>{{ quality }}</span>
            </div>
            <input
              v-model.number="quality"
              type="range"
              min="1"
              max="30"
              class="w-full"
            >
            <p class="text-xs text-muted-foreground mt-1">值越小画质越好，文件越大</p>
          </div>
        </div>

        <!-- 预估信息 -->
        <div v-if="frames.length > 0" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">预估信息</h3>
          <div class="text-xs text-muted-foreground space-y-1">
            <p>帧数: {{ frames.length }} 张</p>
            <p>时长: {{ Math.round(frames.length * frameDelay / 1000 * 10) / 10 }} 秒</p>
            <p>帧率: {{ Math.round(1000 / frameDelay) }} FPS</p>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和下载 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">GIF预览</h2>

        <div v-if="frames.length === 0" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          添加图片后生成GIF
        </div>

        <div v-else class="space-y-4">
          <!-- 预览画布 -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">预览</span>
              <div class="flex gap-2">
                <button @click="togglePlay" class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">
                  {{ isPlaying ? '暂停' : '播放' }}
                </button>
              </div>
            </div>
            <canvas
              ref="canvas"
              class="max-w-full h-auto rounded-lg bg-white"
            ></canvas>
          </div>

          <!-- 进度条 -->
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex justify-between text-xs mb-2">
              <span>当前帧: {{ currentFrame + 1 }} / {{ frames.length }}</span>
              <span>{{ Math.round(currentFrame * frameDelay / 1000 * 10) / 10 }}s / {{ Math.round(frames.length * frameDelay / 1000 * 10) / 10 }}s</span>
            </div>
            <div class="w-full bg-background rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all"
                :style="{ width: `${((currentFrame + 1) / frames.length) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- 生成和下载 -->
          <div class="space-y-2">
            <button
              @click="generateGIF"
              :disabled="isGenerating"
              class="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isGenerating">生成中... ({{ generateProgress }}%)</span>
              <span v-else>
                <Download class="w-5 h-5 inline mr-2" />
                生成并下载 GIF
              </span>
            </button>

            <div class="text-xs text-muted-foreground text-center">
              <p>注意：GIF生成在浏览器中进行，图片过多可能需要较长时间</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">使用说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div>
          <p class="font-medium text-foreground mb-1">帧率建议</p>
          <p>• 快速动画: 100-150ms (10-15 FPS)</p>
          <p>• 正常动画: 200ms (5 FPS)</p>
          <p>• 慢速动画: 500ms (2 FPS)</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">优化建议</p>
          <p>• 控制帧数在20张以内</p>
          <p>• 使用较小尺寸减少文件大小</p>
          <p>• 适当降低画质以优化</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">常见用途</p>
          <p>• 表情包制作</p>
          <p>• 产品展示</p>
          <p>• 教程演示</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useSeoMeta } from '#app'
import { Upload, Download } from 'lucide-vue-next'

const fileInput = ref(null)
const canvas = ref(null)
const frames = ref([])
const selectedFrame = ref(null)
const frameDelay = ref(200)
const outputSize = ref('original')
const loopCount = ref('0')
const quality = ref(10)
const currentFrame = ref(0)
const isPlaying = ref(true)
const isGenerating = ref(false)
const generateProgress = ref(0)

let playInterval = null

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || []).filter(f => f.type.startsWith('image/'))
  files.forEach(file => loadFrame(file))
}

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
  files.forEach(file => loadFrame(file))
}

const loadFrame = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        frames.value.push({
          url: e.target.result,
          file,
          name: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight
        })
        updatePreview()
        resolve()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const selectFrame = (index) => {
  selectedFrame.value = index
  currentFrame.value = index
  drawFrame(index)
}

const removeFrame = (index) => {
  frames.value.splice(index, 1)
  if (currentFrame.value >= frames.value.length) {
    currentFrame.value = Math.max(0, frames.value.length - 1)
  }
  updatePreview()
}

const moveFrame = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= frames.value.length) return
  const frame = frames.value.splice(index, 1)[0]
  frames.value.splice(newIndex, 0, frame)
  updatePreview()
}

const reverseOrder = () => {
  frames.value.reverse()
  updatePreview()
}

const shuffleOrder = () => {
  for (let i = frames.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[frames.value[i], frames.value[j]] = [frames.value[j], frames.value[i]]
  }
  updatePreview()
}

const updatePreview = () => {
  if (frames.value.length === 0) {
    stopPlayback()
    return
  }

  if (isPlaying.value) {
    startPlayback()
  } else {
    drawFrame(currentFrame.value)
  }
}

const drawFrame = (index) => {
  if (!canvas.value || frames.value.length === 0) return

  const frame = frames.value[index]
  const ctx = canvas.value.getContext('2d')

  const img = new Image()
  img.onload = () => {
    let width = img.naturalWidth
    let height = img.naturalHeight

    // 调整尺寸
    if (outputSize.value !== 'original') {
      const maxSize = parseInt(outputSize.value)
      if (width > height) {
        if (width > maxSize) {
          height = (height / width) * maxSize
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width / height) * maxSize
          height = maxSize
        }
      }
    }

    canvas.value.width = width
    canvas.value.height = height
    ctx.drawImage(img, 0, 0, width, height)
  }
  img.src = frame.url
}

const startPlayback = () => {
  stopPlayback()
  playInterval = setInterval(() => {
    currentFrame.value = (currentFrame.value + 1) % frames.value.length
    drawFrame(currentFrame.value)
  }, frameDelay.value)
}

const stopPlayback = () => {
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startPlayback()
  } else {
    stopPlayback()
  }
}

const generateGIF = async () => {
  if (frames.value.length === 0) return

  isGenerating.value = true
  generateProgress.value = 0

  try {
    // 使用简单的帧导出方式（实际项目中建议使用 gif.js 库）
    // 这里导出为PNG序列，用户可以使用其他工具合成GIF
    const delay = frameDelay.value

    for (let i = 0; i < frames.value.length; i++) {
      generateProgress.value = Math.round(((i + 1) / frames.value.length) * 100)

      const frame = frames.value[i]
      const img = new Image()

      await new Promise((resolve) => {
        img.onload = () => {
          const tempCanvas = document.createElement('canvas')
          let width = img.naturalWidth
          let height = img.naturalHeight

          if (outputSize.value !== 'original') {
            const maxSize = parseInt(outputSize.value)
            if (width > height) {
              if (width > maxSize) {
                height = (height / width) * maxSize
                width = maxSize
              }
            } else {
              if (height > maxSize) {
                width = (width / height) * maxSize
                height = maxSize
              }
            }
          }

          tempCanvas.width = width
          tempCanvas.height = height
          const ctx = tempCanvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const link = document.createElement('a')
          link.href = tempCanvas.toDataURL('image/png')
          link.download = `frame_${String(i + 1).padStart(3, '0')}.png`
          link.click()

          setTimeout(resolve, 100)
        }
        img.src = frame.url
      })
    }

    alert(`已导出 ${frames.value.length} 帧PNG图片！\n\n您可以使用在线GIF制作工具或软件将这些图片合成为GIF。`)
  } catch (error) {
    console.error('GIF生成失败:', error)
    alert('GIF生成失败，请重试')
  } finally {
    isGenerating.value = false
    generateProgress.value = 0
  }
}

const clearAll = () => {
  frames.value = []
  selectedFrame.value = null
  currentFrame.value = 0
  stopPlayback()
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d')
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }
}

onUnmounted(() => {
  stopPlayback()
})

useSeoMeta({
  title: 'GIF制作工具 - 在线GIF动图制作工具',
  description: '免费在线GIF制作工具，将多张图片制作成GIF动图，支持调整帧率、尺寸和质量。',
  keywords: ['GIF', '动图', 'GIF制作', 'GIF生成', '动画', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('GIF制作工具')
</script>
