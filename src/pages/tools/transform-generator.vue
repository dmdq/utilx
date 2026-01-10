<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS变换生成器 - transform可视化工具</h1>
      <p class="text-muted-foreground">可视化调节rotate/scale/skew/translate变换效果。支持实时预览、预设效果和一键复制CSS代码。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">效果预览</h2>
          <div class="relative h-[400px] border-2 border-dashed border-border rounded-xl overflow-hidden bg-muted">
            <!-- 参考线 -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-full h-px bg-primary/50"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="h-full w-px bg-primary/50"></div>
            </div>

            <!-- 变换元素 -->
            <div class="absolute top-1/2 left-1/2">
              <div
                ref="transformElement"
                class="w-32 h-32 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-xl bg-primary"
                :style="{ transform: generatedTransform, transformOrigin: transformOrigin }"
              >
                <div class="text-center">
                  <div class="text-2xl">🎯</div>
                  <div class="text-xs mt-1">Transform</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的CSS -->
        <div class="bg-card border border-border rounded-xl p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">CSS代码</h2>
            <button @click="copyCSS" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">复制</button>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>transform: {{ generatedTransform }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground">变换设置</h2>
          <button @click="resetTransform" class="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded">重置</button>
        </div>

        <div class="space-y-6">
          <!-- 平移 Translate -->
          <div class="p-4 bg-accent rounded-lg">
            <h3 class="font-medium text-foreground mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">XY</span>
              平移 (Translate)
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs text-foreground">X轴</label>
                  <span class="text-xs text-muted-foreground">{{ translateX }}px</span>
                </div>
                <input v-model.number="translateX" type="range" min="-200" max="200" class="w-full">
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs text-foreground">Y轴</label>
                  <span class="text-xs text-muted-foreground">{{ translateY }}px</span>
                </div>
                <input v-model.number="translateY" type="range" min="-200" max="200" class="w-full">
              </div>
            </div>
          </div>

          <!-- 旋转 Rotate -->
          <div class="p-4 bg-accent rounded-lg">
            <h3 class="font-medium text-foreground mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">↻</span>
              旋转 (Rotate)
            </h3>
            <div>
              <div class="flex justify-between mb-1">
                <label class="text-xs text-foreground">角度</label>
                <span class="text-xs text-muted-foreground">{{ rotate }}deg</span>
              </div>
              <input v-model.number="rotate" type="range" min="-360" max="360" class="w-full">
            </div>
            <div class="grid grid-cols-3 gap-2 mt-2">
              <button @click="rotate = 0" class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-foreground">0°</button>
              <button @click="rotate = 45" class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-foreground">45°</button>
              <button @click="rotate = 90" class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-foreground">90°</button>
              <button @click="rotate = 180" class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-foreground">180°</button>
              <button @click="rotate = -45" class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-foreground">-45°</button>
              <button @click="rotate = -90" class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-foreground">-90°</button>
            </div>
          </div>

          <!-- 缩放 Scale -->
          <div class="p-4 bg-accent rounded-lg">
            <h3 class="font-medium text-foreground mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">⤢</span>
              缩放 (Scale)
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs text-foreground">X轴</label>
                  <span class="text-xs text-muted-foreground">{{ scaleX }}x</span>
                </div>
                <input v-model.number="scaleX" type="range" min="0.1" max="3" step="0.1" class="w-full">
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs text-foreground">Y轴</label>
                  <span class="text-xs text-muted-foreground">{{ scaleY }}x</span>
                </div>
                <input v-model.number="scaleY" type="range" min="0.1" max="3" step="0.1" class="w-full">
              </div>
            </div>
            <label class="flex items-center gap-2 mt-2 text-sm text-foreground">
              <input type="checkbox" v-model="lockScale" class="rounded">
              <span>锁定比例</span>
            </label>
          </div>

          <!-- 倾斜 Skew -->
          <div class="p-4 bg-accent rounded-lg">
            <h3 class="font-medium text-foreground mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">▱</span>
              倾斜 (Skew)
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs text-foreground">X轴</label>
                  <span class="text-xs text-muted-foreground">{{ skewX }}deg</span>
                </div>
                <input v-model.number="skewX" type="range" min="-60" max="60" class="w-full">
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs text-foreground">Y轴</label>
                  <span class="text-xs text-muted-foreground">{{ skewY }}deg</span>
                </div>
                <input v-model.number="skewY" type="range" min="-60" max="60" class="w-full">
              </div>
            </div>
          </div>

          <!-- 原点设置 -->
          <div class="p-4 bg-accent rounded-lg">
            <h3 class="font-medium text-foreground mb-3">变换原点 (Transform Origin)</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="origin in origins"
                :key="origin.value"
                @click="transformOrigin = origin.value"
                :class="['px-2 py-1 text-xs rounded', transformOrigin === origin.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground']"
              >
                {{ origin.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 预设效果 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-foreground mb-3">预设效果</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition"
            >
              {{ preset.name }}
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
          什么是 CSS transform？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS transform 属性允许您对元素进行旋转、缩放、倾斜或平移。这是CSS3中引入的强大功能，
          可以在不改变文档布局的情况下实现各种视觉效果。transform 常用于动画、悬停效果和响应式设计中。
        </p>
        <p class="text-muted-foreground mb-4">
          transform 支持多种变换函数，包括 translate（平移）、rotate（旋转）、scale（缩放）和 skew（倾斜）。
          您可以单独使用这些函数，也可以组合使用多个函数来创建复杂的变换效果。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用 transform 函数
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>translate(x, y)</strong>: 沿X轴和Y轴平移元素</li>
          <li><strong>rotate(angle)</strong>: 旋转元素，可指定角度</li>
          <li><strong>scale(x, y)</strong>: 缩放元素，可分别指定X和Y轴的缩放比例</li>
          <li><strong>skew(x-angle, y-angle)</strong>: 沿X轴和Y轴倾斜元素</li>
          <li><strong>matrix()</strong>: 使用矩阵实现复杂的变换</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>使用滑块调整平移、旋转、缩放和倾斜参数</li>
          <li>实时查看预览区域的变换效果</li>
          <li>选择变换原点来改变变换的中心点</li>
          <li>使用预设效果快速应用常见变换</li>
          <li>点击"复制"按钮获取生成的CSS代码</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">transform 会影响文档流吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。transform 不会影响文档流，transformed 元素仍然占据其原始空间。
              这使得transform成为创建动画和悬停效果的理想选择，不会引起页面重排。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">transform-origin 有什么作用？</h3>
            <p class="text-muted-foreground mt-1">
              transform-origin 属性用于设置变换的基点。默认值是 center，即元素的中心。
              您可以将其设置为 top left、bottom right 等值，或者使用具体的像素值或百分比来精确控制变换原点。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何实现3D变换效果？</h3>
            <p class="text-muted-foreground mt-1">
              要实现3D变换，需要使用 transform-style: preserve-3d 和 perspective 属性。
              然后可以使用 rotateX、rotateY、rotateZ、translateZ 等函数创建三维变换效果。
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
import { ref, computed, watch } from 'vue'
import { HelpCircle, ChevronUp, Box, Palette, Layers } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'CSS变换生成器 - transform可视化工具 | Util工具箱',
  description: '在线CSS transform生成工具，可视化调节旋转、缩放、倾斜、平移等变换效果。支持实时预览和一键复制CSS代码。',
  keywords: 'css transform,旋转,缩放,倾斜,translate,rotate,scale,skew,变换可视化',
  author: 'Util工具箱',
  ogTitle: 'CSS变换生成器 - transform可视化工具',
  ogDescription: '专业的CSS transform生成工具，支持可视化调节旋转、缩放、倾斜、平移等变换效果。',
  ogImage: 'https://www.util.cn/images/tools/transform-generator.png',
  ogUrl: 'https://www.util.cn/tools/transform-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS变换生成器 - transform可视化',
  twitterDescription: '专业的CSS transform生成工具，支持可视化调节各种变换效果。',
  twitterImage: 'https://www.util.cn/images/tools/transform-generator.png'
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
            name: 'CSS变换生成器',
            description: '在线CSS transform可视化生成工具',
            url: 'https://www.util.cn/tools/transform-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '可视化调节',
              '实时预览',
              '多种变换效果',
              '预设模板',
              '一键复制CSS',
              '变换原点控制'
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
                name: 'CSS变换生成器',
                item: 'https://www.util.cn/tools/transform-generator'
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

const translateX = ref(0)
const translateY = ref(0)
const rotate = ref(0)
const scaleX = ref(1)
const scaleY = ref(1)
const skewX = ref(0)
const skewY = ref(0)
const transformOrigin = ref('center')
const lockScale = ref(false)

const transformElement = ref()

const origins = [
  { label: '左上', value: 'top left' },
  { label: '上中', value: 'top center' },
  { label: '右上', value: 'top right' },
  { label: '左中', value: 'center left' },
  { label: '中心', value: 'center' },
  { label: '右中', value: 'center right' },
  { label: '左下', value: 'bottom left' },
  { label: '下中', value: 'bottom center' },
  { label: '右下', value: 'bottom right' }
]

const presets = [
  { name: '无变换', x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '旋转45°', x: 0, y: 0, r: 45, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '旋转90°', x: 0, y: 0, r: 90, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '放大1.5x', x: 0, y: 0, r: 0, sx: 1.5, sy: 1.5, kx: 0, ky: 0 },
  { name: '缩小0.8x', x: 0, y: 0, r: 0, sx: 0.8, sy: 0.8, kx: 0, ky: 0 },
  { name: '水平翻转', x: 0, y: 0, r: 0, sx: -1, sy: 1, kx: 0, ky: 0 },
  { name: '垂直翻转', x: 0, y: 0, r: 0, sx: 1, sy: -1, kx: 0, ky: 0 },
  { name: '右移', x: 50, y: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '下移', x: 0, y: 50, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '倾斜X', x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 20, ky: 0 },
  { name: '倾斜Y', x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 20 }
]

// 图标映射
const iconMap = {
  Box, Palette, Layers
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'border-radius-generator'),
    tools.find(t => t.id === 'css-filter-generator'),
    tools.find(t => t.id === 'clip-path-generator'),
    tools.find(t => t.id === 'pro-color-picker')
  ].filter(Boolean)
})

// 锁定缩放比例
watch(scaleX, (newVal) => {
  if (lockScale.value) {
    scaleY.value = newVal
  }
})

const generatedTransform = computed(() => {
  const parts = []

  if (translateX.value !== 0 || translateY.value !== 0) {
    parts.push(`translate(${translateX.value}px, ${translateY.value}px)`)
  }
  if (rotate.value !== 0) {
    parts.push(`rotate(${rotate.value}deg)`)
  }
  if (scaleX.value !== 1 || scaleY.value !== 1) {
    parts.push(`scale(${scaleX.value}, ${scaleY.value})`)
  }
  if (skewX.value !== 0 || skewY.value !== 0) {
    parts.push(`skew(${skewX.value}deg, ${skewY.value}deg)`)
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
})

function applyPreset(preset) {
  translateX.value = preset.x
  translateY.value = preset.y
  rotate.value = preset.r
  scaleX.value = preset.sx
  scaleY.value = preset.sy
  skewX.value = preset.kx
  skewY.value = preset.ky
}

function resetTransform() {
  translateX.value = 0
  translateY.value = 0
  rotate.value = 0
  scaleX.value = 1
  scaleY.value = 1
  skewX.value = 0
  skewY.value = 0
  transformOrigin.value = 'center'
}

async function copyCSS() {
  const origin = transformOrigin.value !== 'center' ? `\ntransform-origin: ${transformOrigin.value};` : ''
  const css = `transform: ${generatedTransform.value};${origin}`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
