<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS裁剪路径生成器 - clip-path可视化工具</h1>
      <p class="text-muted-foreground">可视化生成clip-path多边形、圆形、椭圆等形状。支持自定义顶点和一键复制CSS代码。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 预览和设置 -->
      <div class="space-y-6">
        <!-- 预览 -->
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>
          <div class="flex justify-center items-center p-8 rounded-lg min-h-[300px]">
            <div
              class="w-48 h-48 bg-card shadow-xl"
              :style="{ clipPath: generatedClipPath }"
            >
              <div class="w-full h-full flex items-center justify-center bg-primary">
                <span class="text-primary-foreground font-bold text-sm">Clip Path</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的CSS -->
        <div class="bg-card border border-border rounded-xl p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">CSS代码</h2>
            <button @click="copyCSS" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">复制CSS</button>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>clip-path: {{ generatedClipPath }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">形状设置</h2>

        <!-- 形状选择 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-2">选择形状</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="shape in shapes"
              :key="shape.id"
              @click="selectedShape = shape.id"
              :class="['px-3 py-2 rounded-lg text-sm', selectedShape === shape.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground']"
            >
              {{ shape.name }}
            </button>
          </div>
        </div>

        <!-- 多边形设置 -->
        <div v-if="selectedShape === 'polygon'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">边数: {{ polygonSides }}</label>
            <input v-model.number="polygonSides" type="range" min="3" max="12" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">旋转: {{ polygonRotation }}°</label>
            <input v-model.number="polygonRotation" type="range" min="0" max="360" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">圆角: {{ polygonRadius }}%</label>
            <input v-model.number="polygonRadius" type="range" min="0" max="50" class="w-full">
          </div>
        </div>

        <!-- 圆形设置 -->
        <div v-if="selectedShape === 'circle'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">半径: {{ circleRadius }}%</label>
            <input v-model.number="circleRadius" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">位置 X: {{ circleX }}%</label>
            <input v-model.number="circleX" type="range" min="0" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">位置 Y: {{ circleY }}%</label>
            <input v-model.number="circleY" type="range" min="0" max="100" class="w-full">
          </div>
        </div>

        <!-- 椭圆设置 -->
        <div v-if="selectedShape === 'ellipse'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">水平半径: {{ ellipseRx }}%</label>
            <input v-model.number="ellipseRx" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">垂直半径: {{ ellipseRy }}%</label>
            <input v-model.number="ellipseRy" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">位置 X: {{ ellipseX }}%</label>
            <input v-model.number="ellipseX" type="range" min="0" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">位置 Y: {{ ellipseY }}%</label>
            <input v-model.number="ellipseY" type="range" min="0" max="100" class="w-full">
          </div>
        </div>

        <!-- 插入设置 -->
        <div v-if="selectedShape === 'inset'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">上: {{ insetTop }}%</label>
            <input v-model.number="insetTop" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">右: {{ insetRight }}%</label>
            <input v-model.number="insetRight" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">下: {{ insetBottom }}%</label>
            <input v-model.number="insetBottom" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">左: {{ insetLeft }}%</label>
            <input v-model.number="insetLeft" type="range" min="0" max="50" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">圆角: {{ insetRadius }}%</label>
            <input v-model.number="insetRadius" type="range" min="0" max="50" class="w-full">
          </div>
        </div>

        <!-- 自定义多边形 -->
        <div v-if="selectedShape === 'custom'" class="space-y-4">
          <div class="p-4 bg-accent rounded-lg">
            <p class="text-sm text-muted-foreground mb-2">点击下方预览区域添加顶点</p>
            <button @click="clearCustomPoints" class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm">清空顶点</button>
          </div>
          <div class="max-h-60 overflow-y-auto">
            <div v-if="customPoints.length === 0" class="text-center py-4 text-muted-foreground text-sm">
              点击预览区域添加顶点
            </div>
            <div v-else class="space-y-2">
              <div v-for="(point, index) in customPoints" :key="index" class="flex items-center gap-2">
                <span class="w-8 text-sm font-mono text-foreground">{{ index + 1 }}</span>
                <input v-model.number="point.x" type="number" min="0" max="100" class="flex-1 px-2 py-1 border border-border rounded bg-muted text-foreground text-sm" placeholder="X%">
                <input v-model.number="point.y" type="number" min="0" max="100" class="flex-1 px-2 py-1 border border-border rounded bg-muted text-foreground text-sm" placeholder="Y%">
                <button @click="removePoint(index)" class="p-1 text-destructive hover:bg-destructive/10 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设形状 -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-foreground mb-2">预设形状</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="aspect-square p-2 border border-border rounded-lg hover:border-primary transition"
              :title="preset.name"
            >
              <div class="w-full h-full bg-primary" :style="{ clipPath: preset.clipPath }"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 CSS clip-path？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS clip-path 属性允许您使用 SVG 路径、形状或多边形来裁剪元素，只显示指定区域内的内容。
          这是CSS3引入的强大功能，可以创建各种复杂的形状效果，而不需要使用图像或额外的HTML元素。
          clip-path 常用于创建独特的图片形状、按钮效果和创意布局。
        </p>
        <p class="text-muted-foreground mb-4">
          clip-path 支持多种形状函数，包括基本形状（圆形、椭圆、多边形）和自定义路径。
          被裁剪掉的区域会变得透明，不会影响页面的其他元素。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用 clip-path 函数
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>inset()</strong>: 内嵌矩形，可以设置圆角</li>
          <li><strong>circle()</strong>: 圆形，可以设置圆心和半径</li>
          <li><strong>ellipse()</strong>: 椭圆，可以设置圆心、水平和垂直半径</li>
          <li><strong>polygon()</strong>: 多边形，通过指定多个顶点坐标创建</li>
          <li><strong>path()</strong>: 自定义SVG路径，最灵活但最复杂</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          浏览器兼容性
        </h2>
        <p class="text-muted-foreground mb-4">
          clip-path 在现代浏览器中得到良好支持。基本的形状函数（circle、ellipse、polygon、inset）在所有主流浏览器中都可用。
          path() 函数的支持也在不断提升。对于旧版浏览器，可能需要使用前缀或提供降级方案。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">clip-path 会影响页面布局吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。clip-path 只影响元素的视觉显示，不会改变元素在页面中占据的空间。
              元素的盒子模型保持不变，只有显示的内容被裁剪。这意味着可以使用 clip-path 创建各种创意效果，而不影响文档流。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何为 clip-path 添加动画？</h3>
            <p class="text-muted-foreground mt-1">
              可以为 clip-path 添加过渡和动画效果。但要注意，不同形状之间的过渡效果可能不流畅。
              最好的做法是在相同形状类型之间进行动画（例如，从圆形变为另一个圆形），
              或者使用 polygon() 函数并保持顶点数量相同。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">clip-path 和 mask 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              clip-path 使用矢量路径裁剪元素，创建清晰的边缘。
              mask 使用图像或渐变作为遮罩，可以创建更复杂的效果，包括半透明和渐变边缘。
              clip-path 通常性能更好，适合简单的形状裁剪；mask 更灵活，适合复杂的遮罩效果。
            </p>
          </div>
        </div>
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
              :is="iconMap[relatedTool.icon]"
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

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, Box, Palette, Layers } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'CSS裁剪路径生成器 - clip-path可视化工具 | Util工具箱',
  description: '在线CSS clip-path生成工具，可视化创建多边形、圆形、椭圆等裁剪路径效果。支持自定义顶点和一键复制CSS代码。',
  keywords: 'clip-path,CSS裁剪,多边形,圆形裁剪,CSS形状,path,裁剪路径',
  author: 'Util工具箱',
  ogTitle: 'CSS裁剪路径生成器 - clip-path可视化',
  ogDescription: '专业的CSS clip-path生成工具，支持可视化创建各种裁剪路径效果。',
  ogImage: 'https://www.util.cn/images/tools/clip-path-generator.png',
  ogUrl: 'https://www.util.cn/tools/clip-path-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS裁剪路径生成器 - clip-path可视化',
  twitterDescription: '专业的CSS clip-path生成工具，支持可视化创建各种裁剪路径效果。',
  twitterImage: 'https://www.util.cn/images/tools/clip-path-generator.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'CSS裁剪路径生成器',
            description: '在线CSS clip-path可视化生成工具',
            url: 'https://www.util.cn/tools/clip-path-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种形状',
              '自定义顶点',
              '实时预览',
              '预设模板',
              '一键复制CSS'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'CSS裁剪路径生成器',
                item: 'https://www.util.cn/tools/clip-path-generator'
              }
            ]
          }
        ]
      })
    }
  ]
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

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

const customPoints = ref([])

const shapes = [
  { id: 'polygon', name: '多边形' },
  { id: 'circle', name: '圆形' },
  { id: 'ellipse', name: '椭圆' },
  { id: 'inset', name: '内嵌' },
  { id: 'custom', name: '自定义' }
]

const presets = [
  { name: '三角形', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  { name: '五边形', clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  { name: '六边形', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  { name: '八边形', clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' },
  { name: '星形', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { name: '菱形', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { name: '梯形', clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' },
  { name: '平行四边形', clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)' }
]

// 图标映射
const iconMap = {
  Box, Palette, Layers
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'border-radius-generator'),
    tools.find(t => t.id === 'transform-generator'),
    tools.find(t => t.id === 'css-filter-generator'),
    tools.find(t => t.id === 'pro-color-picker')
  ].filter(Boolean)
})

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

function generatePolygon() {
  const sides = polygonSides.value
  const rotation = (polygonRotation.value * Math.PI) / 180
  const radius = 50
  const centerX = 50
  const centerY = 50

  const points = []
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i / sides) - (Math.PI / 2) + rotation
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  const radiusStr = polygonRadius.value > 0 ? ` round ${polygonRadius.value}%` : ''
  return `polygon(${points.join(', ')})${radiusStr}`
}

function applyPreset(preset) {
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

function removePoint(index) {
  customPoints.value.splice(index, 1)
}

async function copyCSS() {
  const css = `clip-path: ${generatedClipPath.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
