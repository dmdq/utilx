<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS背景滤镜生成器 - backdrop-filter可视化工具</h1>
      <p class="text-muted-foreground">生成毛玻璃、模糊等backdrop-filter效果。支持实时预览、预设效果和一键复制CSS代码。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">效果预览</h2>
          <div class="relative h-[400px] rounded-xl overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
            <!-- 背景装饰 -->
            <div class="absolute inset-0 flex items-center justify-center gap-8 opacity-50">
              <div class="w-32 h-32 rounded-full bg-yellow-400"></div>
              <div class="w-24 h-24 rounded-full bg-cyan-400"></div>
              <div class="w-20 h-20 rounded-full bg-pink-400"></div>
            </div>

            <!-- 浮动元素 -->
            <div class="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-lg"></div>
            <div class="absolute bottom-12 right-12 w-20 h-20 bg-white/20 rounded-full"></div>

            <!-- 滤镜卡片 -->
            <div
              class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 p-6 rounded-2xl border border-white/40 shadow-2xl"
              :style="{
                backdropFilter: generatedFilter,
                WebkitBackdropFilter: generatedFilter,
                background: `rgba(255, 255, 255, ${bgOpacity / 100})`
              }"
            >
              <h3 class="text-2xl font-bold text-foreground mb-2">毛玻璃效果</h3>
              <p class="text-foreground text-sm">
                Backdrop Filter 可以让元素背后的内容产生模糊等滤镜效果。
              </p>
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
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>.glass-effect {
  backdrop-filter: {{ generatedFilter }};
  -webkit-backdrop-filter: {{ generatedFilter }};
  background: rgba(255, 255, 255, {{ (bgOpacity / 100).toFixed(2) }});
}</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground">滤镜设置</h2>
          <button @click="resetFilters" class="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded">重置</button>
        </div>

        <div class="space-y-6">
          <!-- 模糊 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">模糊 (blur)</label>
              <span class="text-sm text-muted-foreground">{{ filters.blur }}px</span>
            </div>
            <input v-model.number="filters.blur" type="range" min="0" max="50" step="0.5" class="w-full">
          </div>

          <!-- 亮度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">亮度 (brightness)</label>
              <span class="text-sm text-muted-foreground">{{ filters.brightness }}%</span>
            </div>
            <input v-model.number="filters.brightness" type="range" min="0" max="200" step="1" class="w-full">
          </div>

          <!-- 对比度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">对比度 (contrast)</label>
              <span class="text-sm text-muted-foreground">{{ filters.contrast }}%</span>
            </div>
            <input v-model.number="filters.contrast" type="range" min="0" max="200" step="1" class="w-full">
          </div>

          <!-- 饱和度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">饱和度 (saturate)</label>
              <span class="text-sm text-muted-foreground">{{ filters.saturate }}%</span>
            </div>
            <input v-model.number="filters.saturate" type="range" min="0" max="200" step="1" class="w-full">
          </div>

          <!-- 灰度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">灰度 (grayscale)</label>
              <span class="text-sm text-muted-foreground">{{ filters.grayscale }}%</span>
            </div>
            <input v-model.number="filters.grayscale" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 色相旋转 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">色相旋转 (hue-rotate)</label>
              <span class="text-sm text-muted-foreground">{{ filters.hueRotate }}deg</span>
            </div>
            <input v-model.number="filters.hueRotate" type="range" min="0" max="360" step="1" class="w-full">
          </div>

          <!-- 反色 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">反色 (invert)</label>
              <span class="text-sm text-muted-foreground">{{ filters.invert }}%</span>
            </div>
            <input v-model.number="filters.invert" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 透明度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">透明度 (opacity)</label>
              <span class="text-sm text-muted-foreground">{{ filters.opacity }}%</span>
            </div>
            <input v-model.number="filters.opacity" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 背景透明度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">背景透明度</label>
              <span class="text-sm text-muted-foreground">{{ bgOpacity }}%</span>
            </div>
            <input v-model.number="bgOpacity" type="range" min="0" max="100" step="1" class="w-full">
          </div>
        </div>

        <!-- 预设效果 -->
        <div class="mt-8">
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
          什么是 CSS backdrop-filter？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS backdrop-filter 属性允许您为元素背后的区域（背景）添加图形效果，如模糊、颜色偏移等。
          这使得创建"毛玻璃"效果变得非常简单，是现代UI设计中常用的技术。
          backdrop-filter 与 filter 的区别在于，filter 应用于元素本身，而 backdrop-filter 应用于元素背后的内容。
        </p>
        <p class="text-muted-foreground mb-4">
          backdrop-filter 常用于创建导航栏、模态框、卡片等元素的背景效果，
          让用户可以看到后面的内容，但同时又能够保持前景内容的可读性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用 backdrop-filter 函数
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>blur(px)</strong>: 高斯模糊，最常用于毛玻璃效果</li>
          <li><strong>brightness(%)</strong>: 背景亮度调整</li>
          <li><strong>contrast(%)</strong>: 背景对比度调整</li>
          <li><strong>saturate(%)</strong>: 背景饱和度调整</li>
          <li><strong>grayscale(%)</strong>: 背景灰度转换</li>
          <li><strong>hue-rotate(deg)</strong>: 背景色相旋转</li>
          <li><strong>invert(%)</strong>: 背景反色效果</li>
          <li><strong>opacity(%)</strong>: 背景透明度</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          浏览器兼容性
        </h2>
        <p class="text-muted-foreground mb-4">
          backdrop-filter 在现代浏览器中得到良好支持，但需要添加 -webkit- 前缀以支持 Safari。
          在使用时，建议同时添加 -webkit-backdrop-filter 和 backdrop-filter 两个属性。
          某些旧版浏览器不支持此属性，建议提供降级方案。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么 backdrop-filter 没有效果？</h3>
            <p class="text-muted-foreground mt-1">
              backdrop-filter 需要元素本身具有半透明背景才能看到效果。
              确保元素的 background 是半透明的，如 rgba(255, 255, 255, 0.3) 或使用 opacity。
              如果背景是完全不透明的，您将看不到 backdrop-filter 的效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">backdrop-filter 会影响性能吗？</h3>
            <p class="text-muted-foreground mt-1">
              是的，backdrop-filter 可能会影响性能，特别是在移动设备上。
              它会触发合成层的创建，增加内存使用。
              建议谨慎使用，避免在大面积或多个元素上同时使用 backdrop-filter。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何创建经典的毛玻璃效果？</h3>
            <p class="text-muted-foreground mt-1">
              经典的毛玻璃效果通常使用 blur(10px-20px) 并配合半透明的白色背景。
              例如：backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.3);
              可以根据需要调整模糊程度和背景透明度来达到理想效果。
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
  title: 'CSS背景滤镜生成器 - backdrop-filter可视化工具 | Util工具箱',
  description: '在线CSS backdrop-filter生成工具，可视化创建毛玻璃、模糊等背景滤镜效果。支持实时预览和一键复制CSS代码。',
  keywords: 'backdrop-filter,毛玻璃,CSS滤镜,背景模糊,frosted glass,glassmorphism',
  author: 'Util工具箱',
  ogTitle: 'CSS背景滤镜生成器 - backdrop-filter可视化',
  ogDescription: '专业的CSS backdrop-filter生成工具，支持可视化创建毛玻璃效果。',
  ogImage: 'https://www.util.cn/images/tools/backdrop-filter-generator.png',
  ogUrl: 'https://www.util.cn/tools/backdrop-filter-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS背景滤镜生成器 - backdrop-filter可视化',
  twitterDescription: '专业的CSS backdrop-filter生成工具，支持可视化创建毛玻璃效果。',
  twitterImage: 'https://www.util.cn/images/tools/backdrop-filter-generator.png'
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
            name: 'CSS背景滤镜生成器',
            description: '在线CSS backdrop-filter可视化生成工具',
            url: 'https://www.util.cn/tools/backdrop-filter-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '毛玻璃效果',
              '多种滤镜',
              '实时预览',
              '预设模板',
              '一键复制CSS',
              '背景透明度调节'
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
                name: 'CSS背景滤镜生成器',
                item: 'https://www.util.cn/tools/backdrop-filter-generator'
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

const filters = ref({
  blur: 20,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100
})

const bgOpacity = ref(30)

const presets = [
  {
    name: '经典毛玻璃',
    filters: { blur: 20, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '强模糊',
    filters: { blur: 40, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '高对比',
    filters: { blur: 15, brightness: 110, contrast: 130, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '灰度玻璃',
    filters: { blur: 20, brightness: 100, contrast: 100, saturate: 100, grayscale: 100, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '复古效果',
    filters: { blur: 10, brightness: 100, contrast: 100, saturate: 80, grayscale: 0, hueRotate: 30, invert: 0, opacity: 100 }
  },
  {
    name: '反色玻璃',
    filters: { blur: 15, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 100, opacity: 100 }
  },
  {
    name: '轻度模糊',
    filters: { blur: 8, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '无模糊',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  }
]

// 图标映射
const iconMap = {
  Box, Palette, Layers
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'css-filter-generator'),
    tools.find(t => t.id === 'border-radius-generator'),
    tools.find(t => t.id === 'transform-generator'),
    tools.find(t => t.id === 'pro-color-picker')
  ].filter(Boolean)
})

const generatedFilter = computed(() => {
  const f = filters.value
  const parts = []

  if (f.blur > 0) parts.push(`blur(${f.blur}px)`)
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`)
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`)
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`)
  if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale}%)`)
  if (f.hueRotate > 0) parts.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.invert > 0) parts.push(`invert(${f.invert}%)`)
  if (f.opacity !== 100) parts.push(`opacity(${f.opacity}%)`)

  return parts.length > 0 ? parts.join(' ') : 'none'
})

function applyPreset(preset) {
  filters.value = { ...preset.filters }
}

function resetFilters() {
  filters.value = {
    blur: 20,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    opacity: 100
  }
  bgOpacity.value = 30
}

async function copyCSS() {
  const css = `.glass-effect {
  backdrop-filter: ${generatedFilter.value};
  -webkit-backdrop-filter: ${generatedFilter.value};
  background: rgba(255, 255, 255, ${bgOpacity.value / 100});
}`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
