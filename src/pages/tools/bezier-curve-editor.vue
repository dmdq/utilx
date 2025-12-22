<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">贝塞尔曲线编辑器</h1>
      <p class="text-muted-foreground mb-6">可视化调试CSS缓动函数，实时预览动画效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：编辑器 -->
      <div class="space-y-6">
        <!-- 曲线编辑器 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">曲线编辑器</h3>
            <button
              @click="resetCurve"
              class="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80"
            >
              重置
            </button>
          </div>

          <div class="relative">
            <!-- 网格背景 -->
            <svg
              ref="svgCanvas"
              class="w-full h-64 border rounded-lg cursor-move"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
            >
              <!-- 网格线 -->
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <!-- 坐标轴 -->
              <line x1="0" y1="256" x2="256" y2="256" stroke="#9ca3af" stroke-width="2"/>
              <line x1="0" y1="0" x2="0" y2="256" stroke="#9ca3af" stroke-width="2"/>

              <!-- 贝塞尔曲线 -->
              <path
                :d="curvePath"
                fill="none"
                stroke="#3b82f6"
                stroke-width="3"
              />

              <!-- 控制线 -->
              <line
                :x1="controlPoints.p1.x * 256"
                :y1="controlPoints.p1.y * 256"
                :x2="controlPoints.p2.x * 256"
                :y2="controlPoints.p2.y * 256"
                stroke="#ef4444"
                stroke-width="1"
                stroke-dasharray="5,5"
              />

              <!-- 控制点 -->
              <circle
                :cx="controlPoints.p1.x * 256"
                :cy="controlPoints.p1.y * 256"
                r="8"
                fill="#ef4444"
                stroke="white"
                stroke-width="2"
                class="cursor-pointer hover:scale-125 transition-transform"
                @mousedown="startDrag('p1')"
              />
              <circle
                :cx="controlPoints.p2.x * 256"
                :cy="controlPoints.p2.y * 256"
                r="8"
                fill="#ef4444"
                stroke="white"
                stroke-width="2"
                class="cursor-pointer hover:scale-125 transition-transform"
                @mousedown="startDrag('p2')"
              />

              <!-- 起点/终点 -->
              <circle cx="0" cy="256" r="4" fill="#10b981"/>
              <circle cx="256" cy="0" r="4" fill="#10b981"/>
            </svg>

            <!-- 坐标显示 -->
            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium">P1:</span>
                <span class="ml-2 text-primary">({{ controlPoints.p1.x.toFixed(2) }}, {{ controlPoints.p1.y.toFixed(2) }})</span>
              </div>
              <div>
                <span class="font-medium">P2:</span>
                <span class="ml-2 text-primary">({{ controlPoints.p2.x.toFixed(2) }}, {{ controlPoints.p2.y.toFixed(2) }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设缓动函数 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设缓动函数</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in bezierPresets"
              :key="preset.name"
              @click="applyPreset(preset)"
              :class="[
                'p-3 rounded-lg text-left transition-all',
                currentPreset?.name === preset.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              ]"
            >
              <div class="font-medium text-sm">{{ preset.name }}</div>
              <div class="text-xs opacity-80">{{ preset.description }}</div>
            </button>
          </div>
        </div>

        <!-- 数值输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">精确数值</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">P1 X 坐标</label>
              <input
                type="number"
                v-model.number="controlPoints.p1.x"
                min="0"
                max="1"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">P1 Y 坐标</label>
              <input
                type="number"
                v-model.number="controlPoints.p1.y"
                min="0"
                max="1"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">P2 X 坐标</label>
              <input
                type="number"
                v-model.number="controlPoints.p2.x"
                min="0"
                max="1"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">P2 Y 坐标</label>
              <input
                type="number"
                v-model.number="controlPoints.p2.y"
                min="0"
                max="1"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和代码 -->
      <div class="space-y-6">
        <!-- 动画预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">动画预览</h3>
            <button
              @click="playPreview"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              播放动画
            </button>
          </div>

          <div class="space-y-6">
            <!-- 位移动画 -->
            <div>
              <div class="text-sm font-medium mb-2">位移</div>
              <div class="h-12 bg-muted rounded-lg relative overflow-hidden">
                <div
                  ref="translationBox"
                  class="absolute top-2 left-2 w-8 h-8 bg-blue-500 rounded"
                ></div>
              </div>
            </div>

            <!-- 缩放动画 -->
            <div>
              <div class="text-sm font-medium mb-2">缩放</div>
              <div class="h-12 bg-muted rounded-lg flex items-center justify-center">
                <div
                  ref="scaleBox"
                  class="w-8 h-8 bg-green-500 rounded"
                ></div>
              </div>
            </div>

            <!-- 旋转动画 -->
            <div>
              <div class="text-sm font-medium mb-2">旋转</div>
              <div class="h-12 bg-muted rounded-lg flex items-center justify-center">
                <div
                  ref="rotateBox"
                  class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-xs"
                >R</div>
              </div>
            </div>

            <!-- 透明度动画 -->
            <div>
              <div class="text-sm font-medium mb-2">透明度</div>
              <div class="h-12 bg-muted rounded-lg flex items-center justify-center">
                <div
                  ref="opacityBox"
                  class="w-8 h-8 bg-orange-500 rounded"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间对比 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">时间对比</h3>
          <div class="space-y-3">
            <div
              v-for="preset in comparisonPresets"
              :key="preset.name"
              class="flex items-center gap-3"
            >
              <span class="w-20 text-sm font-medium">{{ preset.name }}</span>
              <div class="flex-1 h-8 bg-muted rounded-lg relative overflow-hidden">
                <div
                  class="absolute top-1 left-1 w-6 h-6 rounded"
                  :class="preset.color"
                  :style="{
                    animation: `moveComparison 2s ${preset.value} infinite`
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CSS代码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">CSS代码</h3>
            <button
              @click="copyCSS"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              复制代码
            </button>
          </div>
          <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>{{ cssCode }}</code></pre>
        </div>

        <!-- JavaScript代码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">JavaScript代码</h3>
            <button
              @click="copyJS"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              复制代码
            </button>
          </div>
          <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>{{ jsCode }}</code></pre>
        </div>
      </div>
    </div>

    <!-- 比较动画的CSS -->
    <div class="comparison-animation">
      <div class="comparison-box"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes moveComparison {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(100% - 32px)); }
}

.comparison-animation {
  width: 100%;
  height: 40px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  position: relative;
  background: hsl(var(--muted));
  overflow: hidden;
}

.comparison-box {
  width: 32px;
  height: 32px;
  background: hsl(var(--primary));
  border-radius: 4px;
  position: absolute;
  top: 4px;
  left: 4px;
  animation: moveComparison 2s ease-in-out infinite;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'

// SEO设置
useSeoMeta({
  title: '贝塞尔曲线编辑器 - 在线可视化CSS动画缓动函数工具',
  description: '免费贝塞尔曲线编辑器，可视化调试CSS缓动函数和动画效果。支持拖拽控制点调整曲线，实时预览动画，导出CSS和JavaScript代码。专业的动画缓动函数设计工具。',
  keywords: ['贝塞尔曲线编辑器', 'CSS缓动函数', '动画缓动曲线', '贝塞尔曲线工具', 'CSS动画编辑器', 'easing function', '缓动函数生成器', '动画时间函数', '前端动画工具', 'UI动效设计', '动画曲线调整', 'CSS transition效果'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '贝塞尔曲线编辑器',
    description: '免费的在线贝塞尔曲线编辑器，可视化调试CSS缓动函数和动画效果。',
    url: 'https://util.iskytrip.com/tools/bezier-curve-editor',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '可视化曲线编辑',
      '拖拽控制点调整',
      '实时动画预览',
      '预设缓动函数',
      'CSS代码生成',
      'JavaScript代码导出',
      '多种动画效果展示',
      '精确数值输入'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者、动画设计师'
    }
  }
})

// 控制点
const controlPoints = ref({
  p1: { x: 0.25, y: 0.1 },
  p2: { x: 0.25, y: 1 }
})

// 当前预设
const currentPreset = ref(null)

// 拖拽状态
const isDragging = ref(false)
const draggedPoint = ref(null)

// SVG画布引用
const svgCanvas = ref(null)

// 预览元素引用
const translationBox = ref(null)
const scaleBox = ref(null)
const rotateBox = ref(null)
const opacityBox = ref(null)

// 贝塞尔预设
const bezierPresets = [
  {
    name: 'Linear',
    description: '线性匀速',
    value: 'linear',
    p1: { x: 0, y: 0 },
    p2: { x: 1, y: 1 }
  },
  {
    name: 'Ease',
    description: '默认缓动',
    value: 'ease',
    p1: { x: 0.25, y: 0.1 },
    p2: { x: 0.25, y: 1 }
  },
  {
    name: 'Ease In',
    description: '缓慢开始',
    value: 'ease-in',
    p1: { x: 0.42, y: 0 },
    p2: { x: 1, y: 1 }
  },
  {
    name: 'Ease Out',
    description: '缓慢结束',
    value: 'ease-out',
    p1: { x: 0, y: 0 },
    p2: { x: 0.58, y: 1 }
  },
  {
    name: 'Ease In Out',
    description: '缓慢开始和结束',
    value: 'ease-in-out',
    p1: { x: 0.42, y: 0 },
    p2: { x: 0.58, y: 1 }
  },
  {
    name: 'Back',
    description: '回弹效果',
    value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    p1: { x: 0.68, y: -0.55 },
    p2: { x: 0.265, y: 1.55 }
  },
  {
    name: 'Elastic',
    description: '弹性效果',
    value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    p1: { x: 0.68, y: -0.6 },
    p2: { x: 0.32, y: 1.6 }
  },
  {
    name: 'Bounce',
    description: '弹跳效果',
    value: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
    p1: { x: 0.895, y: 0.03 },
    p2: { x: 0.685, y: 0.22 }
  }
]

// 对比预设
const comparisonPresets = [
  { name: 'Linear', value: 'linear', color: 'bg-blue-500' },
  { name: 'Ease', value: 'ease', color: 'bg-green-500' },
  { name: 'Ease In', value: 'ease-in', color: 'bg-purple-500' },
  { name: 'Ease Out', value: 'ease-out', color: 'bg-orange-500' },
  { name: 'Back', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', color: 'bg-pink-500' }
]

// 计算曲线路径
const curvePath = computed(() => {
  const p1 = controlPoints.value.p1
  const p2 = controlPoints.value.p2

  const startX = 0
  const startY = 256
  const endX = 256
  const endY = 0

  const cp1X = p1.x * 256
  const cp1Y = p1.y * 256
  const cp2X = p2.x * 256
  const cp2Y = p2.y * 256

  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`
})

// 计算CSS代码
const cssCode = computed(() => {
  const p1 = controlPoints.value.p1
  const p2 = controlPoints.value.p2

  // 检查是否是标准缓动函数
  const preset = bezierPresets.find(p =>
    Math.abs(p.p1.x - p1.x) < 0.001 &&
    Math.abs(p.p1.y - p1.y) < 0.001 &&
    Math.abs(p.p2.x - p2.x) < 0.001 &&
    Math.abs(p.p2.y - p2.y) < 0.001
  )

  const timingFunction = preset ? preset.value : `cubic-bezier(${p1.x}, ${p1.y}, ${p2.x}, ${p2.y})`

  return `/* CSS动画 */
.animated-element {
  animation: slideIn 2s ${timingFunction} infinite;
}

@keyframes slideIn {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 或者在transition中使用 */
.transition-element {
  transition: transform 0.3s ${timingFunction};
}`
})

// 计算JavaScript代码
const jsCode = computed(() => {
  const p1 = controlPoints.value.p1
  const p2 = controlPoints.value.p2

  return `// JavaScript动画
const element = document.querySelector('.animated-element');
const duration = 2000;

function easeBezier(t, p1x, p1y, p2x, p2y) {
  // 贝塞尔缓动函数实现
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleCurveX(t) {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleCurveY(t) {
    return ((ay * t + by) * t + cy) * t;
  }

  function solveCurveX(x) {
    let t2 = x;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < 0.001) break;
      const d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
      if (Math.abs(d2) < 0.000001) break;
      t2 = t2 - x2 / d2;
    }
    return t2;
  }

  return sampleCurveY(solveCurveX(t));
}

// 使用缓动函数
function animate() {
  const startTime = performance.now();

  function frame(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 应用贝塞尔缓动
    const easedProgress = easeBezier(progress, ${p1.x}, ${p1.y}, ${p2.x}, ${p2.y});

    element.style.transform = \`translateX(\${easedProgress * 200}px)\`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

animate();`
})

// 方法
const resetCurve = () => {
  controlPoints.value = {
    p1: { x: 0.25, y: 0.1 },
    p2: { x: 0.25, y: 1 }
  }
  currentPreset.value = null
}

const applyPreset = (preset) => {
  controlPoints.value = {
    p1: { ...preset.p1 },
    p2: { ...preset.p2 }
  }
  currentPreset.value = preset
}

const startDrag = (point) => {
  isDragging.value = true
  draggedPoint.value = point
}

const handleMouseDown = (e) => {
  if (e.target.tagName === 'circle') {
    e.preventDefault()
    return
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value || !svgCanvas.value || !draggedPoint.value) return

  const rect = svgCanvas.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height

  // 限制坐标范围
  controlPoints.value[draggedPoint.value].x = Math.max(0, Math.min(1, x))
  controlPoints.value[draggedPoint.value].y = Math.max(-0.5, Math.min(1.5, y))

  // 检查是否匹配预设
  const matchedPreset = bezierPresets.find(p =>
    Math.abs(p.p1.x - controlPoints.value.p1.x) < 0.01 &&
    Math.abs(p.p1.y - controlPoints.value.p1.y) < 0.01 &&
    Math.abs(p.p2.x - controlPoints.value.p2.x) < 0.01 &&
    Math.abs(p.p2.y - controlPoints.value.p2.y) < 0.01
  )

  currentPreset.value = matchedPreset || null
}

const handleMouseUp = () => {
  isDragging.value = false
  draggedPoint.value = null
}

const playPreview = () => {
  const p1 = controlPoints.value.p1
  const p2 = controlPoints.value.p2
  const timingFunction = `cubic-bezier(${p1.x}, ${p1.y}, ${p2.x}, ${p2.y})`

  // 应用动画到所有预览元素
  const elements = [translationBox.value, scaleBox.value, rotateBox.value, opacityBox.value]
  const animations = [
    { property: 'translateX', from: '0px', to: '200px' },
    { property: 'scale', from: '1', to: '1.5' },
    { property: 'rotate', from: '0deg', to: '360deg' },
    { property: 'opacity', from: '1', to: '0.3' }
  ]

  elements.forEach((element, index) => {
    if (!element) return

    const animation = animations[index]

    // 重置动画
    element.style.transition = 'none'
    element.style.transform = ''
    element.style.opacity = ''

    // 强制重排
    void element.offsetWidth

    // 应用新动画
    element.style.transition = `${animation.property} 2s ${timingFunction}`

    if (animation.property === 'opacity') {
      element.style.opacity = animation.to
    } else {
      element.style.transform = `${animation.property}(${animation.to})`
    }

    // 动画结束后重置
    setTimeout(() => {
      element.style.transition = 'none'
      element.style.transform = ''
      element.style.opacity = ''
    }, 2000)
  })
}

const copyCSS = async () => {
  try {
    await navigator.clipboard.writeText(cssCode.value)
    alert('CSS代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

const copyJS = async () => {
  try {
    await navigator.clipboard.writeText(jsCode.value)
    alert('JavaScript代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

// 添加全局样式
onMounted(() => {
  const style = document.createElement('style')
  style.textContent = `
    .cursor-move {
      cursor: move;
    }
    .hover\\:scale-125:hover {
      transform: scale(1.25);
    }
  `
  document.head.appendChild(style)
})
</script>