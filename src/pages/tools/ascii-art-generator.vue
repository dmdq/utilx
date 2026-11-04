<script setup>
import { ref, watch } from 'vue'
import { Image as ImageIcon, Copy, Download, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'ASCII艺术生成器 - 在线字符画转换工具 | 图片转ASCII',
  description: '免费在线ASCII艺术生成工具，支持图片转ASCII字符画、文本转ASCII艺术样式，可调整字符密度和大小，适用于创意设计和装饰文本。',
  keywords: 'ASCII艺术,字符画,图片转ASCII,文本艺术,ASCII生成器,在线字符画',
  author: 'Util工具箱',
  ogTitle: 'ASCII艺术生成器 - 免费在线字符画转换工具',
  ogDescription: '专业的ASCII艺术生成工具，支持图片转ASCII、文本转艺术样式。可调整参数，一键导出。',
  ogType: 'website'
})

// 输入模式
const mode = ref('image')

// 图片转ASCII配置
const imageConfig = ref({
  width: 100,
  inverted: false,
  contrast: 1.0,
  brightness: 0
})

// 文本转ASCII配置
const textConfig = ref({
  text: '',
  font: 'standard',
  style: 'normal'
})

// ASCII字符集（从暗到亮）
const densityChars = '@%#*+=-:. '

// 生成结果
const asciiOutput = ref('')

// 上传的图片
const uploadedImage = ref(null)
const imagePreview = ref(null)

// ASCII字体样式
const asciiFonts = {
  standard: {
    name: '标准',
    sample: 'Standard'
  },
  block: {
    name: '方块',
    sample: '▓▒░'
  },
  binary: {
    name: '二进制',
    sample: '01'
  },
  matrix: {
    name: '矩阵',
    sample: 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ'
  }
}

// 文本艺术样式
const textStyles = {
  normal: {
    name: '正常',
    transform: (s) => s
  },
  bold: {
    name: '粗体',
    transform: (s) => {
      const bold = '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙'
      const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      return s.split('').map(c => {
        const idx = normal.indexOf(c)
        return idx > -1 ? bold[idx] : c
      }).join('')
    }
  },
  italic: {
    name: '斜体',
    transform: (s) => {
      const italic = '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡'
      const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      return s.split('').map(c => {
        const idx = normal.indexOf(c)
        return idx > -1 ? italic[idx] : c
      }).join('')
    }
  },
  bubble: {
    name: '气泡',
    transform: (s) => {
      const bubble = 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ'
      const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      return s.split('').map(c => {
        const idx = normal.indexOf(c)
        return idx > -1 ? bubble[idx] : c
      }).join('')
    }
  }
}

// 处理图片上传
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
    uploadedImage.value = e.target.result
    convertImageToAscii()
  }
  reader.readAsDataURL(file)
}

// 图片转ASCII
const convertImageToAscii = () => {
  if (!uploadedImage.value) return

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const aspectRatio = img.height / img.width
    const width = imageConfig.value.width
    const height = Math.round(width * aspectRatio * 0.55)

    canvas.width = width
    canvas.height = height

    ctx.drawImage(img, 0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    const pixels = imageData.data

    let ascii = ''
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        let r = pixels[i]
        let g = pixels[i + 1]
        let b = pixels[i + 2]

        r = Math.min(255, Math.max(0, r + imageConfig.value.brightness))
        g = Math.min(255, Math.max(0, g + imageConfig.value.brightness))
        b = Math.min(255, Math.max(0, b + imageConfig.value.brightness))

        const factor = (259 * (imageConfig.value.contrast * 255 + 255)) / (255 * (259 - imageConfig.value.contrast * 255))
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128))
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128))
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128))

        const gray = 0.299 * r + 0.587 * g + 0.114 * b

        const charIndex = Math.floor((gray / 255) * (densityChars.length - 1))
        let char = densityChars[imageConfig.value.inverted ? densityChars.length - 1 - charIndex : charIndex]

        ascii += char
      }
      ascii += '\n'
    }

    asciiOutput.value = ascii
  }
  img.src = uploadedImage.value
}

// 文本转ASCII艺术
const convertTextToAscii = () => {
  if (!textConfig.value.text.trim()) {
    asciiOutput.value = ''
    return
  }

  const style = textStyles[textConfig.value.style]
  const transformed = style.transform(textConfig.value.text)

  const lines = transformed.split('\n')
  const maxLength = Math.max(...lines.map(l => l.length))
  const border = '█'.repeat(maxLength + 4)

  let result = border + '\n'
  lines.forEach(line => {
    result += '█ ' + line.padEnd(maxLength, ' ') + ' █\n'
  })
  result += border

  asciiOutput.value = result
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!asciiOutput.value) return
  await navigator.clipboard.writeText(asciiOutput.value)
}

// 下载为文本文件
const downloadAsText = () => {
  if (!asciiOutput.value) return
  const blob = new Blob([asciiOutput.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ascii-art-${Date.now()}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

// 清空
const clear = () => {
  asciiOutput.value = ''
  uploadedImage.value = null
  imagePreview.value = null
  textConfig.value.text = ''
}

// 加载示例图片
const loadSampleImage = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 100, 100)
  gradient.addColorStop(0, '#000000')
  gradient.addColorStop(0.5, '#888888')
  gradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 100, 100)

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(50, 50, 30, 0, Math.PI * 2)
  ctx.fill()

  uploadedImage.value = canvas.toDataURL()
  imagePreview.value = uploadedImage.value
  convertImageToAscii()
}

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'word-cloud'),
  tools.find(t => t.id === 'text-statistics'),
  tools.find(t => t.id === 'image-converter'),
  tools.find(t => t.id === 'screenshot-capture')
].filter(Boolean)

// 监听配置变化
watch([imageConfig, textConfig], () => {
  if (mode.value === 'image' && uploadedImage.value) {
    convertImageToAscii()
  } else if (mode.value === 'text' && textConfig.value.text) {
    convertTextToAscii()
  }
}, { deep: true })
</script>

<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">ASCII艺术生成器 - 在线字符画转换工具</h1>
      <p class="text-muted-foreground">免费在线ASCII艺术生成工具，支持图片转ASCII字符画、文本转ASCII艺术样式，可调整字符密度和大小，适用于创意设计和装饰文本。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入和配置 -->
      <div class="space-y-4">
        <!-- 模式选择 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-3">选择模式</h3>
          <div class="flex gap-2">
            <button
              @click="mode = 'image'"
              :class="[
                'flex-1 px-4 py-2 rounded-lg transition text-sm',
                mode === 'image'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              图片转ASCII
            </button>
            <button
              @click="mode = 'text'"
              :class="[
                'flex-1 px-4 py-2 rounded-lg transition text-sm',
                mode === 'text'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              文本转ASCII
            </button>
          </div>
        </div>

        <!-- 图片模式配置 -->
        <template v-if="mode === 'image'">
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">上传图片</h3>
            <label class="block w-full px-4 py-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition cursor-pointer text-center">
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden"
              />
              <ImageIcon :size="32" class="mx-auto text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">点击上传图片</p>
            </label>
            <div class="flex gap-2 mt-3">
              <button
                @click="loadSampleImage"
                class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm"
              >
                加载示例
              </button>
              <button
                v-if="uploadedImage"
                @click="clear"
                class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <!-- 图片预览 -->
          <div v-if="imagePreview" class="bg-card border border-border rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">图片预览</h3>
            <img :src="imagePreview" class="w-full rounded" alt="预览" />
          </div>

          <!-- 图片配置 -->
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">参数调整</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">宽度: {{ imageConfig.width }}字符</label>
                <input
                  v-model.number="imageConfig.width"
                  type="range"
                  min="20"
                  max="200"
                  class="w-full"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">对比度: {{ imageConfig.contrast }}</label>
                <input
                  v-model.number="imageConfig.contrast"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-full"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">亮度: {{ imageConfig.brightness }}</label>
                <input
                  v-model.number="imageConfig.brightness"
                  type="range"
                  min="-100"
                  max="100"
                  class="w-full"
                />
              </div>
              <label class="flex items-center gap-2">
                <input
                  v-model="imageConfig.inverted"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm text-muted-foreground">反转颜色</span>
              </label>
            </div>
          </div>
        </template>

        <!-- 文本模式配置 -->
        <template v-if="mode === 'text'">
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">输入文本</h3>
            <textarea
              v-model="textConfig.text"
              class="w-full h-32 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              placeholder="输入要转换的文本..."
            ></textarea>
          </div>

          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">样式选择</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="(style, key) in textStyles"
                :key="key"
                @click="textConfig.style = key"
                :class="[
                  'p-3 rounded-lg border-2 transition text-sm',
                  textConfig.style === key
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                ]"
              >
                <div class="font-medium text-foreground">{{ style.name }}</div>
                <div class="text-xs text-muted-foreground mt-1 truncate">{{ style.sample }}</div>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-lg overflow-hidden h-full">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 class="text-sm font-medium text-foreground">ASCII 输出</h3>
            <div class="flex gap-2">
              <button
                v-if="asciiOutput"
                @click="copyToClipboard"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground flex items-center gap-1"
              >
                <Copy :size="14" />
                复制
              </button>
              <button
                v-if="asciiOutput"
                @click="downloadAsText"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground flex items-center gap-1"
              >
                <Download :size="14" />
                下载
              </button>
            </div>
          </div>
          <div class="p-4">
            <div v-if="asciiOutput" class="bg-muted rounded-lg p-4 overflow-x-auto">
              <pre class="text-foreground font-mono text-xs whitespace-pre">{{ asciiOutput }}</pre>
            </div>
            <div v-else class="flex items-center justify-center h-96 text-muted-foreground">
              <div class="text-center">
                <ImageIcon :size="48" class="mx-auto mb-3 opacity-50" />
                <p>上传图片或输入文本开始转换</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 ASCII 艺术？
        </h2>
        <p class="text-muted-foreground mb-4">
          ASCII 艺术是一种使用 ASCII 字符集（美国信息交换标准代码）中的可打印字符来创建图像的艺术形式。
          这种艺术形式最早出现在计算机早期，当时由于图形显示能力有限，人们只能通过字符来创建图形。
          如今，ASCII 艺术已经成为一种独特的数字艺术形式，被广泛应用于代码注释、邮件签名、社交媒体等场景。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择图片转 ASCII 或文本转 ASCII 模式</li>
          <li>上传图片或输入要转换的文本</li>
          <li>调整参数（宽度、对比度、亮度等）</li>
          <li>点击复制或下载按钮保存结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>图片转ASCII</strong>：支持上传任意图片，自动转换为字符画</li>
          <li><strong>文本转ASCII</strong>：将普通文本转换为各种艺术字体样式</li>
          <li><strong>参数调整</strong>：可调整宽度、对比度、亮度等参数</li>
          <li><strong>一键导出</strong>：支持复制到剪贴板或下载为文本文件</li>
          <li><strong>本地处理</strong>：所有处理都在浏览器本地完成，保护隐私</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="relatedTool.icon"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
