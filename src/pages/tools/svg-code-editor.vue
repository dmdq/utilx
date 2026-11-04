<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">SVG代码编辑器</h1>
      <p class="text-muted-foreground mb-4">实时编辑SVG代码并预览效果，支持导出为PNG、JPEG、SVG等格式</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧代码编辑器 -->
      <div class="space-y-6">
        <!-- 代码编辑器 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">SVG代码编辑</h3>
            <div class="flex gap-2">
              <button
                @click="formatSvg"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                格式化
              </button>
              <button
                @click="minifySvg"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                压缩
              </button>
              <button
                @click="clearCode"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <div class="mb-3">
            <div class="flex gap-2 mb-2">
              <button
                v-for="template in templates"
                :key="template.name"
                @click="loadTemplate(template)"
                class="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs"
              >
                {{ template.name }}
              </button>
            </div>
          </div>

          <textarea
            v-model="svgCode"
            @input="updatePreview"
            class="w-full h-96 p-3 font-mono text-sm border border-border rounded-md resize-none"
            placeholder="输入SVG代码..."
          ></textarea>

          <!-- 代码信息 -->
          <div class="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>行数: {{ svgCode.split('\n').length }}</span>
            <span>字符数: {{ svgCode.length }}</span>
            <span v-if="svgError" class="text-destructive">{{ svgError }}</span>
          </div>
        </div>

        <!-- SVG属性面板 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">画布设置</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">背景颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="canvasSettings.bgColor"
                  type="color"
                  class="w-12 h-8 rounded cursor-pointer"
                  :disabled="canvasSettings.bgColor === 'transparent'"
                >
                <select
                  v-model="canvasSettings.bgColor"
                  class="flex-1 px-2 py-1 border border-border rounded text-sm"
                >
                  <option value="transparent">透明背景</option>
                  <option value="#ffffff">白色</option>
                  <option value="#000000">黑色</option>
                  <option value="#f3f4f6">浅灰</option>
                  <option value="#3b82f6">蓝色</option>
                  <option value="#ef4444">红色</option>
                  <option value="#10b981">绿色</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">画布尺寸</label>
              <div class="flex gap-2">
                <input
                  v-model.number="canvasSettings.width"
                  type="number"
                  placeholder="400"
                  class="flex-1 px-2 py-1 border border-border rounded text-sm"
                >
                <input
                  v-model.number="canvasSettings.height"
                  type="number"
                  placeholder="400"
                  class="flex-1 px-2 py-1 border border-border rounded text-sm"
                >
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">网格显示</label>
              <label class="flex items-center gap-2">
                <input
                  v-model="canvasSettings.showGrid"
                  type="checkbox"
                  class="rounded"
                >
                <span class="text-sm">显示网格线</span>
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">缩放</label>
              <div class="flex gap-2">
                <button
                  @click="zoomOut"
                  class="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
                >
                  -
                </button>
                <span class="flex-1 text-center text-sm">{{ Math.round(zoomLevel * 100) }}%</span>
                <button
                  @click="zoomIn"
                  class="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 常用元素 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">快速元素</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="element in commonElements"
              :key="element.name"
              @click="insertElement(element)"
              class="p-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-center"
            >
              <div class="text-lg mb-1">{{ element.icon }}</div>
              <div class="text-xs">{{ element.name }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧预览和导出 -->
      <div class="space-y-6">
        <!-- 实时预览 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">实时预览</h3>
            <div class="flex gap-2">
              <button
                @click="resetZoom"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                重置缩放
              </button>
              <button
                @click="fitToScreen"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                适应屏幕
              </button>
            </div>
          </div>

          <div
            class="border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden flex items-center justify-center"
            :style="{
              height: canvasSettings.height + 'px',
              backgroundColor: canvasSettings.bgColor === 'transparent' ? undefined : canvasSettings.bgColor,
              backgroundImage: canvasSettings.bgColor === 'transparent' ? 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 20px 20px' : undefined,
              backgroundSize: '20px 20px'
            }"
          >
            <div
              ref="previewContainer"
              class="relative"
              :style="{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease'
              }"
            >
              <!-- 网格背景 -->
              <svg
                v-if="canvasSettings.showGrid"
                class="absolute inset-0 pointer-events-none"
                :width="canvasSettings.width"
                :height="canvasSettings.height"
                style="z-index: 1"
              >
                <defs>
                  <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e5e5" stroke-width="0.5"/>
                  </pattern>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <rect width="50" height="50" fill="url(#smallGrid)"/>
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d0d0d0" stroke-width="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              <!-- SVG预览 -->
              <div
                v-if="parsedSvg"
                v-html="parsedSvg"
                style="z-index: 2"
              ></div>

              <!-- 错误提示 -->
              <div
                v-else-if="svgError"
                class="text-center p-8 text-destructive"
                style="z-index: 2"
              >
                <div class="text-4xl mb-2">⚠️</div>
                <div class="text-sm">SVG代码有错误</div>
                <div class="text-xs mt-1">{{ svgError }}</div>
              </div>

              <!-- 空状态 -->
              <div
                v-else
                class="text-center p-8 text-muted-foreground"
                style="z-index: 2"
              >
                <div class="text-4xl mb-2">📐</div>
                <div class="text-sm">输入SVG代码开始编辑</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">导出设置</h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">导出格式</label>
              <select v-model="exportFormat" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="svg">SVG 矢量图</option>
                <option value="png">PNG 位图</option>
                <option value="jpeg">JPEG 位图</option>
                <option value="webp">WebP 位图</option>
                <option value="base64">Base64 字符串</option>
              </select>
            </div>

            <div v-if="['png', 'jpeg', 'webp'].includes(exportFormat)">
              <label class="block text-sm font-medium mb-2">导出尺寸</label>
              <select v-model="exportSize" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="1x">原始大小 (1x)</option>
                <option value="2x">2倍大小 (2x)</option>
                <option value="4x">4倍大小 (4x)</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div v-if="['png', 'jpeg', 'webp'].includes(exportFormat) && exportSize === 'custom'">
              <label class="block text-sm font-medium mb-2">自定义尺寸</label>
              <div class="flex gap-2">
                <input
                  v-model.number="customWidth"
                  type="number"
                  placeholder="宽度"
                  class="flex-1 px-2 py-1 border border-border rounded text-sm"
                >
                <input
                  v-model.number="customHeight"
                  type="number"
                  placeholder="高度"
                  class="flex-1 px-2 py-1 border border-border rounded text-sm"
                >
              </div>
            </div>

            <div v-if="exportFormat === 'jpeg'">
              <label class="block text-sm font-medium mb-2">JPEG质量</label>
              <input
                v-model.number="jpegQuality"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                class="w-full"
              >
              <div class="text-center text-sm text-muted-foreground">{{ Math.round(jpegQuality * 100) }}%</div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="exportImage"
              :disabled="!parsedSvg"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下载图片
            </button>
            <button
              @click="copyToClipboard"
              :disabled="!parsedSvg"
              class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              复制代码
            </button>
          </div>
        </div>

        <!-- SVG信息 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">SVG信息</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">元素数量:</span> {{ svgInfo.elements }}
            </div>
            <div>
              <span class="font-medium">路径数量:</span> {{ svgInfo.paths }}
            </div>
            <div>
              <span class="font-medium">文本元素:</span> {{ svgInfo.texts }}
            </div>
            <div>
              <span class="font-medium">渐变数量:</span> {{ svgInfo.gradients }}
            </div>
            <div>
              <span class="font-medium">估算大小:</span> {{ svgInfo.size }}
            </div>
            <div>
              <span class="font-medium">编码方式:</span> {{ svgInfo.encoding }}
            </div>
          </div>
        </div>

        <!-- 使用技巧 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">使用技巧</h3>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="p-2 bg-blue-50 rounded border border-blue-200">
              <strong class="text-blue-800">💡 基础语法:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• &lt;svg&gt;: 根元素，定义SVG画布</li>
                <li>• &lt;rect&gt;: 矩形元素</li>
                <li>• &lt;circle&gt;: 圆形元素</li>
                <li>• &lt;path&gt;: 路径元素，支持复杂形状</li>
                <li>• &lt;text&gt;: 文本元素</li>
              </ul>
            </div>

            <div class="p-2 bg-green-50 rounded border border-green-200">
              <strong class="text-green-800">🎨 样式属性:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• fill: 填充颜色</li>
                <li>• stroke: 描边颜色</li>
                <li>• stroke-width: 描边宽度</li>
                <li>• opacity: 透明度</li>
                <li>• transform: 变换（旋转、缩放、位移）</li>
              </ul>
            </div>

            <div class="p-2 bg-yellow-50 rounded border border-yellow-200">
              <strong class="text-yellow-800">⚡ 优化建议:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• 使用viewBox实现响应式设计</li>
                <li>• 避免不必要的嵌套元素</li>
                <li>• 使用相对路径减少代码量</li>
                <li>• 合理使用组(&lt;g&gt;)管理相关元素</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('SVG代码编辑器 - 实时SVG编辑和导出工具')

// 数据
const svgCode = ref('')
const parsedSvg = ref('')
const svgError = ref('')
const zoomLevel = ref(1)

const canvasSettings = ref({
  bgColor: 'transparent',
  width: 400,
  height: 400,
  showGrid: false
})

const exportFormat = ref('png')
const exportSize = ref('1x')
const customWidth = ref(800)
const customHeight = ref(600)
const jpegQuality = ref(0.9)

const templates = [
  { name: '简单Logo', code: simpleLogo },
  { name: '渐变背景', code: gradientBg },
  { name: '几何图形', code: geometric },
  { name: '文本图标', code: textIcon },
  { name: '按钮样式', code: buttonStyle }
]

const commonElements = [
  {
    name: '矩形',
    icon: '▢',
    code: '<rect x="50" y="50" width="100" height="60" fill="#3b82f6" />'
  },
  {
    name: '圆形',
    icon: '○',
    code: '<circle cx="100" cy="100" r="50" fill="#10b981" />'
  },
  {
    name: '椭圆',
    icon: '⬭',
    code: '<ellipse cx="100" cy="80" rx="60" ry="40" fill="#f59e0b" />'
  },
  {
    name: '三角形',
    icon: '△',
    code: '<polygon points="100,20 150,80 50,80" fill="#ef4444" />'
  },
  {
    name: '星形',
    icon: '★',
    code: '<polygon points="100,10 120,70 180,70 130,110 150,170 100,130 50,170 70,110 20,70 80,70" fill="#8b5cf6" />'
  },
  {
    name: '路径',
    icon: '〰',
    code: '<path d="M 50 100 Q 100 20 150 100 T 250 100" stroke="#3b82f6" stroke-width="3" fill="none" />'
  }
]

// 示例模板
const simpleLogo = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="80" fill="#3b82f6"/>
  <text x="100" y="110" font-family="Arial" font-size="24" fill="white" text-anchor="middle">LOGO</text>
</svg>`

const gradientBg = `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)" />
  <text x="200" y="150" font-family="Arial" font-size="32" fill="white" text-anchor="middle">Gradient Background</text>
</svg>`

const geometric = `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="80" height="80" fill="#3b82f6" opacity="0.8"/>
  <circle cx="200" cy="100" r="40" fill="#ef4444" opacity="0.8"/>
  <polygon points="150,200 190,250 110,250" fill="#10b981" opacity="0.8"/>
  <path d="M 50 250 Q 150 150 250 250" stroke="#f59e0b" stroke-width="4" fill="none"/>
</svg>`

const textIcon = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="90" fill="#1f2937"/>
  <text x="100" y="80" font-family="Arial" font-size="48" fill="white" text-anchor="middle" font-weight="bold">A</text>
  <text x="100" y="120" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle">ICON</text>
</svg>`

const buttonStyle = `<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="buttonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="190" height="50" rx="25" fill="url(#buttonGrad)"/>
  <text x="100" y="35" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Button</text>
</svg>`

// 计算属性
const svgInfo = computed(() => {
  if (!parsedSvg.value) {
    return { elements: 0, paths: 0, texts: 0, gradients: 0, size: '0 B', encoding: 'UTF-8' }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(parsedSvg.value, 'image/svg+xml')
  const svgElement = doc.querySelector('svg')

  if (!svgElement || svgElement.tagName === 'parsererror') {
    return { elements: 0, paths: 0, texts: 0, gradients: 0, size: '0 B', encoding: 'UTF-8' }
  }

  const elements = doc.querySelectorAll('*').length
  const paths = doc.querySelectorAll('path').length
  const texts = doc.querySelectorAll('text').length
  const gradients = doc.querySelectorAll('linearGradient, radialGradient').length
  const size = new Blob([parsedSvg.value]).size
  const sizeText = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`

  return { elements, paths, texts, gradients, size: sizeText, encoding: 'UTF-8' }
})

// 方法
const updatePreview = () => {
  if (!svgCode.value.trim()) {
    parsedSvg.value = ''
    svgError.value = ''
    return
  }

  try {
    // 验证SVG是否有效
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgCode.value, 'image/svg+xml')
    const errorNode = doc.querySelector('parsererror')

    if (errorNode) {
      svgError.value = 'SVG语法错误'
      parsedSvg.value = ''
      return
    }

    svgError.value = ''
    parsedSvg.value = svgCode.value

    // 自动调整画布大小
    const svgElement = doc.querySelector('svg')
    if (svgElement) {
      const width = svgElement.getAttribute('width')
      const height = svgElement.getAttribute('height')
      const viewBox = svgElement.getAttribute('viewBox')

      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number)
        if (w && h) {
          canvasSettings.value.width = w
          canvasSettings.value.height = h
        }
      } else if (width && height) {
        canvasSettings.value.width = parseInt(width)
        canvasSettings.value.height = parseInt(height)
      }
    }
  } catch (e) {
    svgError.value = `解析错误: ${e.message}`
    parsedSvg.value = ''
  }
}

const formatSvg = () => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgCode.value, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (svgElement) {
      const serializer = new XMLSerializer()
      let formatted = serializer.serializeToString(svgElement)

      // 简单格式化
      formatted = formatted
        .replace(/></g, '>\n<')
        .replace(/(\w+)="/g, '\n  $1="')
        .replace(/^\n/, '')

      svgCode.value = formatted
      updatePreview()
    }
  } catch (e) {
    console.error('格式化失败:', e)
  }
}

const minifySvg = () => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgCode.value, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (svgElement) {
      const serializer = new XMLSerializer()
      const minified = serializer.serializeToString(svgElement)
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .trim()

      svgCode.value = minified
      updatePreview()
    }
  } catch (e) {
    console.error('压缩失败:', e)
  }
}

const clearCode = () => {
  svgCode.value = ''
  parsedSvg.value = ''
  svgError.value = ''
}

const loadTemplate = (template) => {
  svgCode.value = template.code
  updatePreview()
}

const insertElement = (element) => {
  svgCode.value += '\n' + element.code + '\n'
  updatePreview()
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.3)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const fitToScreen = () => {
  zoomLevel.value = 1
  // 这里可以添加自动适应逻辑
}

const exportImage = async () => {
  if (!parsedSvg.value) return

  try {
    let canvas, ctx

    if (exportFormat.value === 'svg') {
      // 导出SVG
      const blob = new Blob([parsedSvg.value], { type: 'image/svg+xml' })
      downloadFile(blob, 'image.svg')
      return
    }

    if (exportFormat.value === 'base64') {
      // 导出Base64
      const base64 = btoa(parsedSvg.value)
      const blob = new Blob([base64], { type: 'text/plain' })
      downloadFile(blob, 'svg-base64.txt')
      return
    }

    // 对于位图格式，需要转换
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')

    // 计算导出尺寸
    let scale = 1
    if (exportSize.value === '2x') scale = 2
    if (exportSize.value === '4x') scale = 4
    if (exportSize.value === 'custom') {
      scale = Math.min(customWidth.value / canvasSettings.value.width, customHeight.value / canvasSettings.value.height)
    }

    canvas.width = canvasSettings.value.width * scale
    canvas.height = canvasSettings.value.height * scale

    // 填充背景（JPEG不支持透明，必须填充白色背景）
    if (exportFormat.value === 'jpeg' || canvasSettings.value.bgColor !== 'transparent') {
      ctx.fillStyle = canvasSettings.value.bgColor === 'transparent' ? '#ffffff' : canvasSettings.value.bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 将SVG转换为图片
    const img = new Image()
    const svgBlob = new Blob([parsedSvg.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      // 转换为目标格式
      canvas.toBlob((blob) => {
        if (blob) {
          const extension = exportFormat.value === 'jpeg' ? 'jpg' : exportFormat.value
          downloadFile(blob, `image.${extension}`)
        }
      }, `image/${exportFormat.value}`, jpegQuality.value)
    }

    img.src = url
  } catch (e) {
    console.error('导出失败:', e)
    alert('导出失败，请检查SVG代码')
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(svgCode.value)
  } catch (e) {
    console.error('复制失败:', e)
  }
}

const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 初始化
onMounted(() => {
  // 确保画布背景为透明
  canvasSettings.value.bgColor = 'transparent'
  // 强制触发一次响应式更新
  canvasSettings.value = { ...canvasSettings.value }
})
</script>

<style scoped>
textarea {
  tab-size: 2;
}

/* 自定义滚动条样式 */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
}

textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>