<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">图案生成器</h1>
      <p class="text-muted-foreground mb-6">生成可重复的背景图案，支持多种样式和自定义参数</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：控制面板 -->
      <div class="space-y-6">
        <!-- 图案类型选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">图案类型</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="patternType in patternTypes"
              :key="patternType.type"
              @click="selectPatternType(patternType.type)"
              :class="[
                'p-4 rounded-lg transition-all',
                selectedPatternType === patternType.type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              ]"
            >
              <div class="text-center">
                <component :is="patternType.icon" class="w-6 h-6 mx-auto mb-2" />
                <span class="text-sm font-medium">{{ patternType.name }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 基础设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基础设置</h3>
          <div class="space-y-4">
            <!-- 图案大小 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                图案大小
                <span class="text-primary">{{ patternSize }}px</span>
              </label>
              <input
                type="range"
                v-model.number="patternSize"
                min="20"
                max="200"
                class="w-full"
              />
            </div>

            <!-- 间距 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                间距
                <span class="text-primary">{{ spacing }}px</span>
              </label>
              <input
                type="range"
                v-model.number="spacing"
                min="0"
                max="50"
                class="w-full"
              />
            </div>

            <!-- 旋转 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                旋转角度
                <span class="text-primary">{{ rotation }}°</span>
              </label>
              <input
                type="range"
                v-model.number="rotation"
                min="0"
                max="360"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 颜色设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">颜色设置</h3>
          <div class="space-y-4">
            <!-- 背景色 -->
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

            <!-- 图案颜色 -->
            <div>
              <label class="block text-sm font-medium mb-2">图案颜色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="patternColor"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  v-model="patternColor"
                  class="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <!-- 渐变选项 -->
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="useGradient"
                id="gradient"
                class="rounded"
              />
              <label for="gradient" class="text-sm font-medium">使用渐变</label>
            </div>

            <div v-if="useGradient" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-2">渐变结束色</label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    v-model="gradientEndColor"
                    class="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    v-model="gradientEndColor"
                    class="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">渐变方向</label>
                <select v-model="gradientDirection" class="w-full px-3 py-2 border rounded-lg">
                  <option value="45">对角线 (45°)</option>
                  <option value="0">水平 (0°)</option>
                  <option value="90">垂直 (90°)</option>
                  <option value="135">反对角线 (135°)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 特定图案设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">图案详情</h3>

          <!-- 圆点设置 -->
          <div v-if="selectedPatternType === 'dots'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                圆点半径
                <span class="text-primary">{{ dotRadius }}px</span>
              </label>
              <input
                type="range"
                v-model.number="dotRadius"
                min="1"
                max="50"
                class="w-full"
              />
            </div>
          </div>

          <!-- 线条设置 -->
          <div v-if="selectedPatternType === 'lines'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                线条宽度
                <span class="text-primary">{{ lineWidth }}px</span>
              </label>
              <input
                type="range"
                v-model.number="lineWidth"
                min="1"
                max="20"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">线条方向</label>
              <select v-model="lineDirection" class="w-full px-3 py-2 border rounded-lg">
                <option value="horizontal">水平</option>
                <option value="vertical">垂直</option>
                <option value="diagonal">对角线</option>
                <option value="cross">交叉</option>
              </select>
            </div>
          </div>

          <!-- 网格设置 -->
          <div v-if="selectedPatternType === 'grid'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                网格线宽
                <span class="text-primary">{{ gridLineWidth }}px</span>
              </label>
              <input
                type="range"
                v-model.number="gridLineWidth"
                min="1"
                max="10"
                class="w-full"
              />
            </div>
          </div>

          <!-- 六边形设置 -->
          <div v-if="selectedPatternType === 'hexagon'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                六边形大小
                <span class="text-primary">{{ hexagonSize }}px</span>
              </label>
              <input
                type="range"
                v-model.number="hexagonSize"
                min="10"
                max="100"
                class="w-full"
              />
            </div>
          </div>

          <!-- 波浪设置 -->
          <div v-if="selectedPatternType === 'waves'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                波浪振幅
                <span class="text-primary">{{ waveAmplitude }}px</span>
              </label>
              <input
                type="range"
                v-model.number="waveAmplitude"
                min="5"
                max="50"
                class="w-full"
              />
            </div>
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                波浪频率
                <span class="text-primary">{{ waveFrequency }}</span>
              </label>
              <input
                type="range"
                v-model.number="waveFrequency"
                min="1"
                max="10"
                step="0.5"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 预设图案 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设图案</h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="preset in patternPresets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="p-3 rounded-lg border hover:border-primary transition-colors"
            >
              <div
                class="w-full h-20 mb-2 rounded"
                :style="{ background: getPreviewPattern(preset) }"
              ></div>
              <p class="text-xs text-center">{{ preset.name }}</p>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和导出 -->
      <div class="space-y-6">
        <!-- 实时预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">预览</h3>
            <div class="flex gap-2">
              <button
                @click="toggleAnimation"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80"
              >
                {{ isAnimating ? '停止' : '动画' }}
              </button>
            </div>
          </div>

          <div
            class="preview-container rounded-lg"
            :style="{ background: patternCSS }"
            :class="{ 'animate-pulse': isAnimating }"
          >
            <div class="preview-content">
              <h4 class="text-2xl font-bold mb-2">图案预览</h4>
              <p class="text-muted-foreground">这是一个展示背景图案效果的示例</p>
            </div>
          </div>

          <!-- 不同尺寸预览 -->
          <div class="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p class="text-sm font-medium mb-2">小尺寸</p>
              <div
                class="w-full h-32 rounded-lg border"
                :style="{ background: patternCSS }"
              ></div>
            </div>
            <div>
              <p class="text-sm font-medium mb-2">大尺寸</p>
              <div
                class="w-full h-32 rounded-lg border"
                :style="{ background: patternCSS }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 图案参数显示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">图案参数</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="font-medium">类型:</span>
              <span>{{ getCurrentPatternType().name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">大小:</span>
              <span>{{ patternSize }}px</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">间距:</span>
              <span>{{ spacing }}px</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">旋转:</span>
              <span>{{ rotation }}°</span>
            </div>
            <div v-if="useGradient" class="flex justify-between">
              <span class="font-medium">渐变:</span>
              <span>{{ patternColor }} → {{ gradientEndColor }}</span>
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

        <!-- 导出选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">导出选项</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">文件名</label>
              <input
                type="text"
                v-model="exportFileName"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="my-pattern"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">导出尺寸</label>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    v-model.number="exportWidth"
                    min="100"
                    max="2000"
                    class="w-full px-3 py-2 border rounded-lg"
                    placeholder="宽度"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    v-model.number="exportHeight"
                    min="100"
                    max="2000"
                    class="w-full px-3 py-2 border rounded-lg"
                    placeholder="高度"
                  />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">导出格式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="format in exportFormats"
                  :key="format"
                  @click="exportPattern(format)"
                  class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
                >
                  {{ format.toUpperCase() }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as Icons from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: '图案生成器 - 在线生成CSS背景图案和纹理',
  description: '免费图案生成器，支持生成圆点、线条、网格、六边形、三角形等CSS背景图案。可自定义颜色、尺寸、间距，实时预览效果，导出CSS代码。专业的网页背景设计工具。',
  keywords: ['图案生成器', 'CSS背景图案', '背景纹理生成', '网页背景设计', 'SVG图案生成', 'CSS图案代码', '背景装饰', 'UI背景图案', '前端图案工具', '几何图案生成', '纹理背景', '重复图案设计'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '图案生成器',
    description: '免费的在线CSS背景图案生成工具，支持多种几何图案、自定义颜色和导出CSS代码。',
    url: 'https://util.iskytrip.com/tools/pattern-generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '多种图案类型',
      '自定义颜色设置',
      '尺寸间距调整',
      '实时预览效果',
      '动画图案支持',
      'CSS代码生成',
      'SVG代码导出',
      '图片格式导出'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者'
    }
  }
})

// 图案类型
const selectedPatternType = ref('dots')
const patternTypes = [
  { type: 'dots', name: '圆点', icon: 'Circle' },
  { type: 'lines', name: '线条', icon: 'Minus' },
  { type: 'grid', name: '网格', icon: 'Grid3x3' },
  { type: 'hexagon', name: '六边形', icon: 'Hexagon' },
  { type: 'triangles', name: '三角形', icon: 'Triangle' },
  { type: 'waves', name: '波浪', icon: 'Waveform' }
]

// 基础设置
const patternSize = ref(40)
const spacing = ref(10)
const rotation = ref(0)

// 颜色设置
const backgroundColor = ref('#ffffff')
const patternColor = ref('#3b82f6')
const useGradient = ref(false)
const gradientEndColor = ref('#8b5cf6')
const gradientDirection = ref(45)

// 特定图案设置
const dotRadius = ref(5)
const lineWidth = ref(2)
const lineDirection = ref('horizontal')
const gridLineWidth = ref(1)
const hexagonSize = ref(30)
const waveAmplitude = ref(20)
const waveFrequency = ref(2)

// 动画状态
const isAnimating = ref(false)

// 导出设置
const exportFileName = ref('pattern')
const exportWidth = ref(400)
const exportHeight = ref(400)
const exportFormats = ['svg', 'png', 'jpg']

// 预设图案
const patternPresets = [
  {
    name: '蓝色圆点',
    type: 'dots',
    patternSize: 30,
    spacing: 15,
    dotRadius: 8,
    backgroundColor: '#f0f9ff',
    patternColor: '#3b82f6',
    useGradient: false
  },
  {
    name: '绿色线条',
    type: 'lines',
    patternSize: 20,
    spacing: 10,
    lineWidth: 3,
    lineDirection: 'diagonal',
    backgroundColor: '#f0fdf4',
    patternColor: '#10b981',
    useGradient: false
  },
  {
    name: '紫色渐变',
    type: 'hexagon',
    patternSize: 50,
    spacing: 5,
    hexagonSize: 25,
    backgroundColor: '#faf5ff',
    patternColor: '#8b5cf6',
    gradientEndColor: '#ec4899',
    useGradient: true,
    gradientDirection: 45
  },
  {
    name: '橙色波浪',
    type: 'waves',
    patternSize: 60,
    spacing: 0,
    waveAmplitude: 15,
    waveFrequency: 3,
    backgroundColor: '#fff7ed',
    patternColor: '#f97316',
    useGradient: false
  },
  {
    name: '红色网格',
    type: 'grid',
    patternSize: 25,
    spacing: 5,
    gridLineWidth: 2,
    backgroundColor: '#fef2f2',
    patternColor: '#ef4444',
    useGradient: false
  },
  {
    name: '彩虹三角',
    type: 'triangles',
    patternSize: 40,
    spacing: 10,
    backgroundColor: '#ffffff',
    patternColor: '#f59e0b',
    gradientEndColor: '#ec4899',
    useGradient: true,
    gradientDirection: 135
  }
]

// 计算图案CSS
const patternCSS = computed(() => {
  const totalSize = patternSize.value + spacing.value
  const pattern = generatePattern()
  return `${backgroundColor.value} url("data:image/svg+xml,%3Csvg width='${totalSize}' height='${totalSize}' xmlns='http://www.w3.org/2000/svg'%3E${pattern}%3C/svg%3E") repeat`
})

// 计算CSS代码
const cssCode = computed(() => {
  const pattern = generateSVGPattern()
  return `.pattern-background {
  background-color: ${backgroundColor.value};
  background-image: url("data:image/svg+xml,${encodeURIComponent(pattern)}");
  background-repeat: repeat;
  background-size: ${patternSize.value + spacing.value}px ${patternSize.value + spacing.value}px;
}

/* 简化版本 */
.pattern-simple {
  background: ${patternCSS.value};
}`
})

// 计算SVG代码
const svgCode = computed(() => {
  return generateSVGPattern(true)
})

// 方法
const selectPatternType = (type) => {
  selectedPatternType.value = type
}

const generatePattern = () => {
  const color = useGradient.value
    ? `url(%23gradient${Date.now()})`
    : patternColor.value

  let pattern = ''

  // 添加渐变定义
  if (useGradient.value) {
    pattern += `%3Cdefs%3E%3ClinearGradient id='gradient${Date.now()}' gradientTransform='rotate(${gradientDirection.value})'%3E`
    pattern += `%3Cstop offset='0%25' stop-color='${patternColor.value}'/%3E`
    pattern += `%3Cstop offset='100%25' stop-color='${gradientEndColor.value}'/%3E`
    pattern += `%3C/linearGradient%3E%3C/defs%3E`
  }

  // 根据图案类型生成
  switch (selectedPatternType.value) {
    case 'dots':
      pattern += `%3Ccircle cx='${patternSize.value / 2}' cy='${patternSize.value / 2}' r='${dotRadius.value}' fill='${color}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      break

    case 'lines':
      if (lineDirection.value === 'horizontal') {
        pattern += `%3Cline x1='0' y1='${patternSize.value / 2}' x2='${patternSize.value}' y2='${patternSize.value / 2}' stroke='${color}' stroke-width='${lineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      } else if (lineDirection.value === 'vertical') {
        pattern += `%3Cline x1='${patternSize.value / 2}' y1='0' x2='${patternSize.value / 2}' y2='${patternSize.value}' stroke='${color}' stroke-width='${lineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      } else if (lineDirection.value === 'diagonal') {
        pattern += `%3Cline x1='0' y1='0' x2='${patternSize.value}' y2='${patternSize.value}' stroke='${color}' stroke-width='${lineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      } else if (lineDirection.value === 'cross') {
        pattern += `%3Cline x1='0' y1='${patternSize.value / 2}' x2='${patternSize.value}' y2='${patternSize.value / 2}' stroke='${color}' stroke-width='${lineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
        pattern += `%3Cline x1='${patternSize.value / 2}' y1='0' x2='${patternSize.value / 2}' y2='${patternSize.value}' stroke='${color}' stroke-width='${lineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      }
      break

    case 'grid':
      pattern += `%3Cline x1='0' y1='${patternSize.value / 2}' x2='${patternSize.value}' y2='${patternSize.value / 2}' stroke='${color}' stroke-width='${gridLineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      pattern += `%3Cline x1='${patternSize.value / 2}' y1='0' x2='${patternSize.value / 2}' y2='${patternSize.value}' stroke='${color}' stroke-width='${gridLineWidth.value}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      break

    case 'hexagon':
      const hexPoints = generateHexagonPoints(patternSize.value / 2, patternSize.value / 2, hexagonSize.value)
      pattern += `%3Cpolygon points='${hexPoints}' fill='${color}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      break

    case 'triangles':
      const trianglePoints = `${patternSize.value / 2},${patternSize.value / 4} ${patternSize.value / 4},${patternSize.value * 3 / 4} ${patternSize.value * 3 / 4},${patternSize.value * 3 / 4}`
      pattern += `%3Cpolygon points='${trianglePoints}' fill='${color}' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      break

    case 'waves':
      let wavePath = `M 0 ${patternSize.value / 2}`
      for (let x = 0; x <= patternSize.value; x += 5) {
        const y = patternSize.value / 2 + Math.sin((x / patternSize.value) * Math.PI * waveFrequency.value) * waveAmplitude.value
        wavePath += ` L ${x} ${y}`
      }
      pattern += `%3Cpath d='${wavePath}' stroke='${color}' stroke-width='2' fill='none' transform='rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})'/%3E`
      break
  }

  return pattern
}

const generateSVGPattern = (fullFormat = false) => {
  const totalSize = patternSize.value + spacing.value
  let svg = `<svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">`

  if (useGradient.value) {
    svg += `<defs>
  <linearGradient id="gradient" gradientTransform="rotate(${gradientDirection.value})">
    <stop offset="0%" stop-color="${patternColor.value}" />
    <stop offset="100%" stop-color="${gradientEndColor.value}" />
  </linearGradient>
</defs>`
  }

  const color = useGradient.value ? 'url(#gradient)' : patternColor.value

  // 根据图案类型生成SVG元素
  switch (selectedPatternType.value) {
    case 'dots':
      svg += `<circle cx="${patternSize.value / 2}" cy="${patternSize.value / 2}" r="${dotRadius.value}" fill="${color}" transform="rotate(${rotation.value} ${patternSize.value / 2} ${patternSize.value / 2})" />`
      break

    case 'lines':
      // 类似generatePattern中的逻辑
      break

    // 其他图案类型...
  }

  svg += `</svg>`
  return fullFormat ? svg : svg.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const generateHexagonPoints = (cx, cy, size) => {
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

const getCurrentPatternType = () => {
  return patternTypes.find(p => p.type === selectedPatternType.value) || patternTypes[0]
}

const getPreviewPattern = (preset) => {
  // 简化的预览图案生成
  const color = preset.useGradient
    ? `linear-gradient(${preset.gradientDirection || 45}deg, ${preset.patternColor}, ${preset.gradientEndColor || preset.patternColor})`
    : preset.patternColor

  return `${preset.backgroundColor} url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='8' fill='%23${preset.patternColor.slice(1)}'/%3E%3C/svg%3E") repeat`
}

const applyPreset = (preset) => {
  selectedPatternType.value = preset.type
  patternSize.value = preset.patternSize
  spacing.value = preset.spacing
  backgroundColor.value = preset.backgroundColor
  patternColor.value = preset.patternColor
  useGradient.value = preset.useGradient

  if (preset.useGradient) {
    gradientEndColor.value = preset.gradientEndColor
    gradientDirection.value = preset.gradientDirection
  }

  // 应用特定设置
  switch (preset.type) {
    case 'dots':
      dotRadius.value = preset.dotRadius || 5
      break
    case 'lines':
      lineWidth.value = preset.lineWidth || 2
      lineDirection.value = preset.lineDirection || 'horizontal'
      break
    case 'hexagon':
      hexagonSize.value = preset.hexagonSize || 30
      break
    case 'waves':
      waveAmplitude.value = preset.waveAmplitude || 20
      waveFrequency.value = preset.waveFrequency || 2
      break
  }
}

const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value
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

const copySVG = async () => {
  try {
    await navigator.clipboard.writeText(svgCode.value)
    alert('SVG代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

const exportPattern = (format) => {
  if (format === 'svg') {
    downloadSVG()
  } else {
    downloadImage(format)
  }
}

const downloadSVG = () => {
  const pattern = generateSVGPattern(true)
  const blob = new Blob([pattern], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exportFileName.value}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadImage = (format) => {
  const canvas = document.createElement('canvas')
  canvas.width = exportWidth.value
  canvas.height = exportHeight.value
  const ctx = canvas.getContext('2d')

  // 创建图案
  const totalSize = patternSize.value + spacing.value
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = totalSize
  patternCanvas.height = totalSize
  const patternCtx = patternCanvas.getContext('2d')

  // 绘制背景
  patternCtx.fillStyle = backgroundColor.value
  patternCtx.fillRect(0, 0, totalSize, totalSize)

  // 绘制图案
  patternCtx.fillStyle = patternColor.value

  // 这里简化处理，实际应该根据图案类型绘制
  if (selectedPatternType.value === 'dots') {
    patternCtx.beginPath()
    patternCtx.arc(patternSize.value / 2, patternSize.value / 2, dotRadius.value, 0, Math.PI * 2)
    patternCtx.fill()
  }

  // 在主画布上应用图案
  const pattern = ctx.createPattern(patternCanvas, 'repeat')
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, exportWidth.value, exportHeight.value)

  // 导出图片
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFileName.value}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }, `image/${format}`)
}
</script>

<style scoped>
.preview-container {
  @apply w-full h-64 p-8 flex items-center justify-center;
}

.preview-content {
  @apply text-center;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>