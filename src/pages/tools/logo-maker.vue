<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">Logo制作器</h1>
      <p class="text-muted-foreground mb-6">使用几何图形组合设计专业Logo</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：工具面板 -->
      <div class="space-y-6">
        <!-- 形状选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">添加形状</h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="shape in shapes"
              :key="shape.type"
              @click="addShape(shape)"
              class="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <div class="text-center">
                <component :is="shape.icon" class="w-6 h-6 mx-auto mb-2" />
                <span class="text-xs">{{ shape.name }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 形状属性 -->
        <div v-if="selectedShape" class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">形状属性</h3>
            <button
              @click="deleteSelectedShape"
              class="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
            >
              <Icon name="Trash2" class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-4">
            <!-- 颜色 -->
            <div>
              <label class="block text-sm font-medium mb-2">填充颜色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="selectedShape.fill"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  v-model="selectedShape.fill"
                  class="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <!-- 边框 -->
            <div>
              <label class="block text-sm font-medium mb-2">边框</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="selectedShape.stroke"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="number"
                  v-model.number="selectedShape.strokeWidth"
                  min="0"
                  max="20"
                  class="w-20 px-3 py-2 border rounded-lg"
                  placeholder="宽度"
                />
              </div>
            </div>

            <!-- 大小 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                大小
                <span class="text-primary">{{ Math.round(selectedShape.size) }}px</span>
              </label>
              <input
                type="range"
                v-model.number="selectedShape.size"
                min="10"
                max="200"
                class="w-full"
              />
            </div>

            <!-- 旋转 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                旋转
                <span class="text-primary">{{ selectedShape.rotation }}°</span>
              </label>
              <input
                type="range"
                v-model.number="selectedShape.rotation"
                min="0"
                max="360"
                class="w-full"
              />
            </div>

            <!-- 透明度 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                透明度
                <span class="text-primary">{{ Math.round(selectedShape.opacity * 100) }}%</span>
              </label>
              <input
                type="range"
                v-model.number="selectedShape.opacity"
                min="0"
                max="1"
                step="0.01"
                class="w-full"
              />
            </div>

            <!-- 图层 -->
            <div>
              <label class="block text-sm font-medium mb-2">图层</label>
              <div class="flex gap-2">
                <button
                  @click="moveLayerUp"
                  class="px-3 py-1 bg-secondary rounded text-sm hover:bg-secondary/80"
                >
                  上移
                </button>
                <button
                  @click="moveLayerDown"
                  class="px-3 py-1 bg-secondary rounded text-sm hover:bg-secondary/80"
                >
                  下移
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 文字工具 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">文字工具</h3>
            <button
              @click="addText"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              添加文字
            </button>
          </div>

          <div v-if="selectedShape && selectedShape.type === 'text'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">文字内容</label>
              <input
                type="text"
                v-model="selectedShape.text"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">字体</label>
              <select v-model="selectedShape.fontFamily" class="w-full px-3 py-2 border rounded-lg">
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
            </div>

            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                字体大小
                <span class="text-primary">{{ selectedShape.fontSize }}px</span>
              </label>
              <input
                type="range"
                v-model.number="selectedShape.fontSize"
                min="10"
                max="100"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 预设模板 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设模板</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="template in templates"
              :key="template.name"
              @click="applyTemplate(template)"
              class="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
            >
              {{ template.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：画布和导出 -->
      <div class="space-y-6">
        <!-- 画布 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">画布</h3>
            <div class="flex gap-2">
              <button
                @click="clearCanvas"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80"
              >
                清空
              </button>
              <button
                @click="undo"
                :disabled="!canUndo"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80 disabled:opacity-50"
              >
                撤销
              </button>
            </div>
          </div>

          <div class="flex justify-center">
            <div class="canvas-container">
              <svg
                ref="svgCanvas"
                :width="canvasSize"
                :height="canvasSize"
                class="border-2 border-gray-200 rounded-lg bg-white"
                @click="handleCanvasClick"
              >
                <!-- 网格背景 -->
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#f3f4f6"
                      stroke-width="1"
                    />
                  </pattern>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="url(#grid)"
                />

                <!-- 形状元素 -->
                <g
                  v-for="(shape, index) in shapesList"
                  :key="shape.id"
                  @click.stop="selectShape(shape)"
                  @mousedown.stop="startDrag($event, shape)"
                  class="cursor-move"
                  :class="{ 'selected-shape': selectedShape?.id === shape.id }"
                >
                  <!-- 圆形 -->
                  <circle
                    v-if="shape.type === 'circle'"
                    :cx="shape.x"
                    :cy="shape.y"
                    :r="shape.size / 2"
                    :fill="shape.fill"
                    :stroke="shape.stroke"
                    :stroke-width="shape.strokeWidth"
                    :opacity="shape.opacity"
                    :transform="`rotate(${shape.rotation} ${shape.x} ${shape.y})`"
                  />

                  <!-- 矩形 -->
                  <rect
                    v-else-if="shape.type === 'rect'"
                    :x="shape.x - shape.size / 2"
                    :y="shape.y - shape.size / 2"
                    :width="shape.size"
                    :height="shape.size"
                    :fill="shape.fill"
                    :stroke="shape.stroke"
                    :stroke-width="shape.strokeWidth"
                    :opacity="shape.opacity"
                    :transform="`rotate(${shape.rotation} ${shape.x} ${shape.y})`"
                  />

                  <!-- 三角形 -->
                  <polygon
                    v-else-if="shape.type === 'triangle'"
                    :points="getTrianglePoints(shape)"
                    :fill="shape.fill"
                    :stroke="shape.stroke"
                    :stroke-width="shape.strokeWidth"
                    :opacity="shape.opacity"
                    :transform="`rotate(${shape.rotation} ${shape.x} ${shape.y})`"
                  />

                  <!-- 六边形 -->
                  <polygon
                    v-else-if="shape.type === 'hexagon'"
                    :points="getHexagonPoints(shape)"
                    :fill="shape.fill"
                    :stroke="shape.stroke"
                    :stroke-width="shape.strokeWidth"
                    :opacity="shape.opacity"
                    :transform="`rotate(${shape.rotation} ${shape.x} ${shape.y})`"
                  />

                  <!-- 星形 -->
                  <polygon
                    v-else-if="shape.type === 'star'"
                    :points="getStarPoints(shape)"
                    :fill="shape.fill"
                    :stroke="shape.stroke"
                    :stroke-width="shape.strokeWidth"
                    :opacity="shape.opacity"
                    :transform="`rotate(${shape.rotation} ${shape.x} ${shape.y})`"
                  />

                  <!-- 文字 -->
                  <text
                    v-else-if="shape.type === 'text'"
                    :x="shape.x"
                    :y="shape.y"
                    :fill="shape.fill"
                    :stroke="shape.stroke"
                    :stroke-width="shape.strokeWidth"
                    :opacity="shape.opacity"
                    :font-size="shape.fontSize"
                    :font-family="shape.fontFamily"
                    :font-weight="shape.fontWeight"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    :transform="`rotate(${shape.rotation} ${shape.x} ${shape.y})`"
                  >
                    {{ shape.text }}
                  </text>

                  <!-- 选中框 -->
                  <rect
                    v-if="selectedShape?.id === shape.id"
                    :x="shape.x - shape.size / 2 - 10"
                    :y="shape.y - shape.size / 2 - 10"
                    :width="shape.size + 20"
                    :height="shape.size + 20"
                    fill="none"
                    stroke="#3b82f6"
                    stroke-width="2"
                    stroke-dasharray="5,5"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- 背景设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">背景设置</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">背景颜色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="backgroundColor"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  v-model="backgroundColor"
                  class="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <!-- 画布尺寸 -->
            <div>
              <label class="block text-sm font-medium mb-2">画布尺寸</label>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    v-model.number="canvasSize"
                    min="100"
                    max="800"
                    class="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <select v-model="presetSize" @change="applyPresetSize" class="w-full px-3 py-2 border rounded-lg">
                  <option value="">自定义</option>
                  <option value="200">200×200</option>
                  <option value="400">400×400</option>
                  <option value="600">600×600</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">导出</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">文件名</label>
              <input
                type="text"
                v-model="exportFileName"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="my-logo"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">导出格式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="format in exportFormats"
                  :key="format"
                  @click="exportLogo(format)"
                  class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
                >
                  {{ format.toUpperCase() }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG代码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">SVG代码</h3>
            <button
              @click="copySVG"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              复制代码
            </button>
          </div>
          <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-xs"><code>{{ svgCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as Icons from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: 'Logo制作器 - 在线免费设计品牌Logo和商标',
  description: '免费Logo制作器，在线设计专业品牌Logo和商标。支持文字Logo、图形Logo、图标组合，可自定义颜色、字体、形状，实时预览效果，导出SVG和PNG格式。简单易用的Logo设计工具。',
  keywords: ['Logo制作器', '免费Logo设计', '在线Logo生成器', '品牌Logo设计', '商标制作工具', '文字Logo设计', '图形Logo制作', '企业Logo设计', 'Logo图标设计', '商标设计工具', '品牌标识设计', '免费Logo制作'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Logo制作器',
    description: '免费的在线Logo设计和制作工具，支持文字和图形Logo，可导出SVG和PNG格式。',
    url: 'https://util.iskytrip.com/tools/logo-maker',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '文字Logo设计',
      '图形Logo制作',
      '图标Logo组合',
      '自定义颜色设置',
      '字体样式选择',
      '形状元素设计',
      '实时预览效果',
      'SVG/PNG格式导出'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '企业主、设计师、创业者'
    }
  }
})

// 画布设置
const canvasSize = ref(400)
const backgroundColor = ref('#ffffff')
const presetSize = ref('')

// 形状列表
const shapesList = ref([])
const selectedShape = ref(null)
const nextId = ref(1)

// 导出设置
const exportFileName = ref('my-logo')
const exportFormats = ['svg', 'png', 'jpg']

// 历史记录
const history = ref([])
const historyIndex = ref(-1)

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 可用形状
const shapes = [
  { type: 'circle', name: '圆形', icon: 'Circle' },
  { type: 'rect', name: '方形', icon: 'Square' },
  { type: 'triangle', name: '三角形', icon: 'Triangle' },
  { type: 'hexagon', name: '六边形', icon: 'Hexagon' },
  { type: 'star', name: '星形', icon: 'Star' }
]

// 预设模板
const templates = [
  {
    name: '科技公司',
    shapes: [
      { type: 'hexagon', x: 200, y: 200, size: 120, fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 3, opacity: 1, rotation: 0 },
      { type: 'circle', x: 200, y: 200, size: 80, fill: '#ffffff', stroke: 'none', strokeWidth: 0, opacity: 1, rotation: 0 }
    ]
  },
  {
    name: '环保品牌',
    shapes: [
      { type: 'circle', x: 200, y: 200, size: 100, fill: '#10b981', stroke: '#059669', strokeWidth: 3, opacity: 1, rotation: 0 },
      { type: 'triangle', x: 200, y: 170, size: 60, fill: '#ffffff', stroke: 'none', strokeWidth: 0, opacity: 1, rotation: 0 }
    ]
  },
  {
    name: '创意设计',
    shapes: [
      { type: 'star', x: 200, y: 200, size: 100, fill: '#f59e0b', stroke: '#d97706', strokeWidth: 2, opacity: 1, rotation: 0 },
      { type: 'circle', x: 200, y: 200, size: 40, fill: '#ffffff', stroke: 'none', strokeWidth: 0, opacity: 1, rotation: 0 }
    ]
  },
  {
    name: '简约现代',
    shapes: [
      { type: 'rect', x: 200, y: 200, size: 80, fill: '#6366f1', stroke: '#4f46e5', strokeWidth: 0, opacity: 1, rotation: 45 }
    ]
  }
]

// SVG画布引用
const svgCanvas = ref(null)

// 计算SVG代码
const svgCode = computed(() => {
  const shapes = shapesList.value.map(shape => {
    const commonAttrs = {
      fill: shape.fill,
      stroke: shape.stroke,
      'stroke-width': shape.strokeWidth,
      opacity: shape.opacity,
      transform: `rotate(${shape.rotation} ${shape.x} ${shape.y})`
    }

    switch (shape.type) {
      case 'circle':
        return `<circle cx="${shape.x}" cy="${shape.y}" r="${shape.size / 2}" ${Object.entries(commonAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
      case 'rect':
        return `<rect x="${shape.x - shape.size / 2}" y="${shape.y - shape.size / 2}" width="${shape.size}" height="${shape.size}" ${Object.entries(commonAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
      case 'triangle':
        return `<polygon points="${getTrianglePoints(shape)}" ${Object.entries(commonAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
      case 'hexagon':
        return `<polygon points="${getHexagonPoints(shape)}" ${Object.entries(commonAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
      case 'star':
        return `<polygon points="${getStarPoints(shape)}" ${Object.entries(commonAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
      case 'text':
        return `<text x="${shape.x}" y="${shape.y}" fill="${shape.fill}" font-size="${shape.fontSize}" font-family="${shape.fontFamily}" text-anchor="middle" dominant-baseline="middle" ${Object.entries(commonAttrs).filter(([k]) => k !== 'fill').map(([k, v]) => `${k}="${v}"`).join(' ')}>${shape.text}</text>`
      default:
        return ''
    }
  }).join('\n  ')

  return `<svg width="${canvasSize.value}" height="${canvasSize.value}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor.value}" />
  ${shapes}
</svg>`
})

// 计算是否可以撤销
const canUndo = computed(() => historyIndex.value > 0)

// 方法
const addShape = (shapeType) => {
  const shape = {
    id: nextId.value++,
    type: shapeType.type,
    x: canvasSize.value / 2,
    y: canvasSize.value / 2,
    size: 60,
    fill: getRandomColor(),
    stroke: '#000000',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0
  }

  shapesList.value.push(shape)
  selectedShape.value = shape
  saveHistory()
}

const addText = () => {
  const text = {
    id: nextId.value++,
    type: 'text',
    x: canvasSize.value / 2,
    y: canvasSize.value / 2,
    text: 'Logo Text',
    fill: '#000000',
    stroke: 'none',
    strokeWidth: 0,
    opacity: 1,
    rotation: 0,
    fontSize: 32,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    size: 100 // 用于选中框
  }

  shapesList.value.push(text)
  selectedShape.value = text
  saveHistory()
}

const selectShape = (shape) => {
  selectedShape.value = shape
}

const deleteSelectedShape = () => {
  if (selectedShape.value) {
    const index = shapesList.value.findIndex(s => s.id === selectedShape.value.id)
    if (index !== -1) {
      shapesList.value.splice(index, 1)
      selectedShape.value = null
      saveHistory()
    }
  }
}

const clearCanvas = () => {
  shapesList.value = []
  selectedShape.value = null
  saveHistory()
}

const moveLayerUp = () => {
  if (!selectedShape.value) return

  const index = shapesList.value.findIndex(s => s.id === selectedShape.value.id)
  if (index < shapesList.value.length - 1) {
    [shapesList.value[index], shapesList.value[index + 1]] = [shapesList.value[index + 1], shapesList.value[index]]
    saveHistory()
  }
}

const moveLayerDown = () => {
  if (!selectedShape.value) return

  const index = shapesList.value.findIndex(s => s.id === selectedShape.value.id)
  if (index > 0) {
    [shapesList.value[index], shapesList.value[index - 1]] = [shapesList.value[index - 1], shapesList.value[index]]
    saveHistory()
  }
}

const applyTemplate = (template) => {
  shapesList.value = template.shapes.map(shape => ({
    ...shape,
    id: nextId.value++
  }))
  selectedShape.value = null
  saveHistory()
}

const applyPresetSize = () => {
  if (presetSize.value) {
    canvasSize.value = parseInt(presetSize.value)
  }
}

const getTrianglePoints = (shape) => {
  const size = shape.size / 2
  return `${shape.x},${shape.y - size} ${shape.x - size},${shape.y + size} ${shape.x + size},${shape.y + size}`
}

const getHexagonPoints = (shape) => {
  const size = shape.size / 2
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const x = shape.x + size * Math.cos(angle)
    const y = shape.y + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

const getStarPoints = (shape) => {
  const outerRadius = shape.size / 2
  const innerRadius = outerRadius / 2
  const points = []

  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const x = shape.x + radius * Math.cos(angle - Math.PI / 2)
    const y = shape.y + radius * Math.sin(angle - Math.PI / 2)
    points.push(`${x},${y}`)
  }

  return points.join(' ')
}

const getRandomColor = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  return colors[Math.floor(Math.random() * colors.length)]
}

const handleCanvasClick = () => {
  selectedShape.value = null
}

const startDrag = (event, shape) => {
  isDragging.value = true
  selectedShape.value = shape

  const rect = svgCanvas.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left - shape.x,
    y: event.clientY - rect.top - shape.y
  }

  const handleMouseMove = (e) => {
    if (!isDragging.value) return

    const rect = svgCanvas.value.getBoundingClientRect()
    shape.x = e.clientX - rect.left - dragOffset.value.x
    shape.y = e.clientY - rect.top - dragOffset.value.y

    // 限制在画布内
    shape.x = Math.max(shape.size / 2, Math.min(canvasSize.value - shape.size / 2, shape.x))
    shape.y = Math.max(shape.size / 2, Math.min(canvasSize.value - shape.size / 2, shape.y))
  }

  const handleMouseUp = () => {
    if (isDragging.value) {
      isDragging.value = false
      saveHistory()
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const saveHistory = () => {
  const state = JSON.parse(JSON.stringify(shapesList.value))
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(state)
  historyIndex.value++
}

const undo = () => {
  if (canUndo.value) {
    historyIndex.value--
    shapesList.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    selectedShape.value = null
  }
}

const exportLogo = (format) => {
  if (format === 'svg') {
    downloadSVG()
  } else {
    downloadImage(format)
  }
}

const downloadSVG = () => {
  const blob = new Blob([svgCode.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exportFileName.value}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadImage = (format) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize.value
  canvas.height = canvasSize.value
  const ctx = canvas.getContext('2d')

  // 转换SVG为图片
  const img = new Image()
  const svgBlob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  img.onload = () => {
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    canvas.toBlob((blob) => {
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${exportFileName.value}.${format}`
      a.click()
      URL.revokeObjectURL(downloadUrl)
      URL.revokeObjectURL(url)
    }, `image/${format}`)
  }

  img.src = url
}

const copySVG = async () => {
  try {
    await navigator.clipboard.writeText(svgCode.value)
    alert('SVG代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

// 初始化
onMounted(() => {
  saveHistory()
})
</script>

<style scoped>
.canvas-container {
  display: inline-block;
}

.selected-shape {
  filter: drop-shadow(0 0 3px #3b82f6);
}
</style>