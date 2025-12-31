<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS裁剪路径生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化生成clip-path多边形、圆形、椭圆等形状</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 预览和设置 -->
      <div class="space-y-6">
        <!-- 预览 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4">预览</h2>
          <div class="flex justify-center items-center p-8 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg min-h-[300px]">
            <div
              class="w-48 h-48 bg-white shadow-xl"
              :style="{ clipPath: generatedClipPath }"
            >
              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                <span class="text-white font-bold text-sm">Clip Path</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的CSS -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">CSS代码</h2>
            <button @click="copyCSS" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">复制CSS</button>
          </div>
          <div class="p-4 bg-gray-900 rounded-lg">
            <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>clip-path: {{ generatedClipPath }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">形状设置</h2>

        <!-- 形状选择 -->
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">选择形状</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="shape in shapes"
              :key="shape.id"
              @click="selectedShape = shape.id"
              :class="['px-3 py-2 rounded-lg text-sm', selectedShape === shape.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
            >
              {{ shape.name }}
            </button>
          </div>
        </div>

        <!-- 多边形设置 -->
        <div v-if="selectedShape === 'polygon'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">边数: {{ polygonSides }}</label>
            <input v-model.number="polygonSides" type="range" min="3" max="12" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">旋转: {{ polygonRotation }}°</label>
            <input v-model.number="polygonRotation" type="range" min="0" max="360" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">圆角: {{ polygonRadius }}%</label>
            <input v-model.number="polygonRadius" type="range" min="0" max="50" class="w-full">
          </div>
        </div>

        <!-- 圆形设置 -->
        <div v-if="selectedShape === 'circle'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">半径: {{ circleRadius }}%</label>
            <input v-model.number="circleRadius" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">位置 X: {{ circleX }}%</label>
            <input v-model.number="circleX" type="range" min="0" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">位置 Y: {{ circleY }}%</label>
            <input v-model.number="circleY" type="range" min="0" max="100" class="w-full">
          </div>
        </div>

        <!-- 椭圆设置 -->
        <div v-if="selectedShape === 'ellipse'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">水平半径: {{ ellipseRx }}%</label>
            <input v-model.number="ellipseRx" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">垂直半径: {{ ellipseRy }}%</label>
            <input v-model.number="ellipseRy" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">位置 X: {{ ellipseX }}%</label>
            <input v-model.number="ellipseX" type="range" min="0" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">位置 Y: {{ ellipseY }}%</label>
            <input v-model.number="ellipseY" type="range" min="0" max="100" class="w-full">
          </div>
        </div>

        <!-- 插入设置 -->
        <div v-if="selectedShape === 'inset'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">上: {{ insetTop }}%</label>
            <input v-model.number="insetTop" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">右: {{ insetRight }}%</label>
            <input v-model.number="insetRight" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">下: {{ insetBottom }}%</label>
            <input v-model.number="insetBottom" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">左: {{ insetLeft }}%</label>
            <input v-model.number="insetLeft" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">圆角: {{ insetRadius }}%</label>
            <input v-model.number="insetRadius" type="range" min="0" max="50" class="w-full">
          </div>
        </div>

        <!-- 自定义多边形 -->
        <div v-if="selectedShape === 'custom'" class="space-y-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">点击下方预览区域添加顶点</p>
            <button @click="clearCustomPoints" class="px-3 py-1 bg-red-500 text-white rounded text-sm">清空顶点</button>
          </div>
          <div class="max-h-60 overflow-y-auto">
            <div v-if="customPoints.length === 0" class="text-center py-4 text-gray-400 text-sm">
              点击预览区域添加顶点
            </div>
            <div v-else class="space-y-2">
              <div v-for="(point, index) in customPoints" :key="index" class="flex items-center gap-2">
                <span class="w-8 text-sm font-mono">{{ index + 1 }}</span>
                <input v-model.number="point.x" type="number" min="0" max="100" class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="X%">
                <input v-model.number="point.y" type="number" min="0" max="100" class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="Y%">
                <button @click="removePoint(index)" class="p-1 text-red-500 hover:bg-red-50 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设形状 -->
        <div class="mt-6">
          <label class="block text-sm font-medium mb-2">预设形状</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="aspect-square p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 transition"
              :title="preset.name"
            >
              <div class="w-full h-full" :style="{ clipPath: preset.clipPath, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'CSS裁剪路径生成器 - clip-path可视化工具',
  meta: [{ name: 'description', content: '在线CSS clip-path生成工具，可视化创建多边形、圆形、椭圆等裁剪路径效果。' }],
  keywords: ['clip-path', 'CSS裁剪', '多边形', '圆形裁剪', 'CSS形状', 'path']
})

interface Point {
  x: number
  y: number
}

interface Preset {
  name: string
  clipPath: string
}

const selectedShape = ref('polygon')
const polygonSides = ref(6)
const polygonRotation = ref(0)
const polygonRadius = ref(0)

const circleRadius = ref(50)
const circleX = ref(50)
const circleY = ref(50)

const ellipseRx = ref(50)
const ellipseRy = ref(50)
const ellipseX = ref(50)
const ellipseY = ref(50)

const insetTop = ref(0)
const insetRight = ref(0)
const insetBottom = ref(0)
const insetLeft = ref(0)
const insetRadius = ref(0)

const customPoints = ref<Point[]>([])

const shapes = [
  { id: 'polygon', name: '多边形' },
  { id: 'circle', name: '圆形' },
  { id: 'ellipse', name: '椭圆' },
  { id: 'inset', name: '内嵌' },
  { id: 'custom', name: '自定义' }
]

const presets: Preset[] = [
  { name: '三角形', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  { name: '五边形', clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  { name: '六边形', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  { name: '八边形', clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' },
  { name: '星形', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { name: '菱形', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { name: '梯形', clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' },
  { name: '平行四边形', clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)' }
]

const generatedClipPath = computed(() => {
  switch (selectedShape.value) {
    case 'polygon':
      return generatePolygon()
    case 'circle':
      return `circle(${circleRadius.value}% at ${circleX.value}% ${circleY.value}%)`
    case 'ellipse':
      return `ellipse(${ellipseRx.value}% ${ellipseRy.value}% at ${ellipseX.value}% ${ellipseY.value}%)`
    case 'inset':
      const radius = insetRadius.value > 0 ? ` round ${insetRadius.value}%` : ''
      return `inset(${insetTop.value}% ${insetRight.value}% ${insetBottom.value}% ${insetLeft.value}%${radius})`
    case 'custom':
      if (customPoints.value.length < 3) return 'none'
      return `polygon(${customPoints.value.map(p => `${p.x}% ${p.y}%`).join(', ')})`
    default:
      return 'none'
  }
})

function generatePolygon(): string {
  const sides = polygonSides.value
  const rotation = (polygonRotation.value * Math.PI) / 180
  const radius = 50
  const centerX = 50
  const centerY = 50

  const points: string[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i / sides) - (Math.PI / 2) + rotation
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  const radiusStr = polygonRadius.value > 0 ? ` round ${polygonRadius.value}%` : ''
  return `polygon(${points.join(', ')})${radiusStr}`
}

function applyPreset(preset: Preset) {
  // 解析预设并应用到自定义模式
  selectedShape.value = 'custom'
  customPoints.value = []

  const match = preset.clipPath.match(/polygon\((.+?)\)/)
  if (match) {
    const coords = match[1].split(',').map(s => s.trim())
    customPoints.value = coords.map(coord => {
      const [x, y] = coord.split(/\s+/).map(v => parseFloat(v.replace('%', '')))
      return { x, y }
    })
  }
}

function clearCustomPoints() {
  customPoints.value = []
}

function removePoint(index: number) {
  customPoints.value.splice(index, 1)
}

async function copyCSS() {
  const css = `clip-path: ${generatedClipPath.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}
</script>
