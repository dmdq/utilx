<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS滤镜生成器 - filter可视化工具</h1>
      <p class="text-muted-foreground">可视化调节blur/brightness/contrast/saturate等滤镜效果。支持实时预览、预设效果和一键复制CSS代码。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">效果预览</h2>
          <div class="grid grid-cols-2 gap-4">
            <!-- 原图 -->
            <div>
              <div class="text-sm text-muted-foreground mb-2">原图</div>
              <div class="aspect-square rounded-xl overflow-hidden bg-primary">
                <div class="w-full h-full flex items-center justify-center">
                  <div class="text-center text-primary-foreground">
                    <div class="text-4xl mb-2">🎨</div>
                    <div class="text-lg font-bold">Filter</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 滤镜效果 -->
            <div>
              <div class="text-sm text-muted-foreground mb-2">滤镜效果</div>
              <div
                class="aspect-square rounded-xl overflow-hidden bg-primary"
              >
                <div class="w-full h-full flex items-center justify-center text-primary-foreground" :style="{ filter: generatedFilter }">
                  <div class="text-center">
                    <div class="text-4xl mb-2">🎨</div>
                    <div class="text-lg font-bold">Filter</div>
                  </div>
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
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>filter: {{ generatedFilter }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground">滤镜设置</h2>
          <button @click="resetFilters" class="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded">重置</button>
        </div>

        <div class="space-y-5">
          <!-- 模糊 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">模糊 (blur)</label>
              <span class="text-sm text-muted-foreground">{{ filters.blur }}px</span>
            </div>
            <input v-model.number="filters.blur" type="range" min="0" max="20" step="0.1" class="w-full">
          </div>

          <!-- 亮度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">亮度 (brightness)</label>
              <span class="text-sm text-muted-foreground">{{ filters.brightness }}%</span>
            </div>
            <input v-model.number="filters.brightness" type="range" min="0" max="300" step="1" class="w-full">
          </div>

          <!-- 对比度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">对比度 (contrast)</label>
              <span class="text-sm text-muted-foreground">{{ filters.contrast }}%</span>
            </div>
            <input v-model.number="filters.contrast" type="range" min="0" max="300" step="1" class="w-full">
          </div>

          <!-- 饱和度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">饱和度 (saturate)</label>
              <span class="text-sm text-muted-foreground">{{ filters.saturate }}%</span>
            </div>
            <input v-model.number="filters.saturate" type="range" min="0" max="300" step="1" class="w-full">
          </div>

          <!-- 灰度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">灰度 (grayscale)</label>
              <span class="text-sm text-muted-foreground">{{ filters.grayscale }}%</span>
            </div>
            <input v-model.number="filters.grayscale" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 褐色/复古 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">复古 (sepia)</label>
              <span class="text-sm text-muted-foreground">{{ filters.sepia }}%</span>
            </div>
            <input v-model.number="filters.sepia" type="range" min="0" max="100" step="1" class="w-full">
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

          <!-- 阴影 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-foreground">阴影 (drop-shadow)</label>
              <span class="text-sm text-muted-foreground">{{ filters.shadowX }}px {{ filters.shadowY }}px</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <input v-model.number="filters.shadowX" type="range" min="-30" max="30" step="1" class="w-full" placeholder="X">
              <input v-model.number="filters.shadowY" type="range" min="-30" max="30" step="1" class="w-full" placeholder="Y">
              <input v-model.number="filters.shadowBlur" type="range" min="0" max="30" step="1" class="w-full" placeholder="Blur">
            </div>
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
          什么是 CSS filter？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS filter 属性允许您为元素添加视觉效果，如模糊、亮度调整、对比度增强等。
          滤镜可以应用于任何元素，包括图像、视频和容器元素。这是CSS3引入的强大功能，
          可以在不使用图像编辑软件的情况下直接在网页上实现各种视觉效果。
        </p>
        <p class="text-muted-foreground mb-4">
          filter 属性支持多种滤镜函数，可以单独使用，也可以组合使用。
          组合多个滤镜时，它们会按照声明顺序依次应用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用 filter 函数
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>blur(px)</strong>: 高斯模糊，值越大越模糊</li>
          <li><strong>brightness(%)</strong>: 亮度调整，100%为原始亮度</li>
          <li><strong>contrast(%)</strong>: 对比度调整，100%为原始对比度</li>
          <li><strong>saturate(%)</strong>: 饱和度调整，100%为原始饱和度</li>
          <li><strong>grayscale(%)</strong>: 灰度转换，100%完全灰度</li>
          <li><strong>sepia(%)</strong>: 复古褐色效果，100%完全褐色</li>
          <li><strong>hue-rotate(deg)</strong>: 色相旋转，改变整体色调</li>
          <li><strong>invert(%)</strong>: 反色效果，100%完全反色</li>
          <li><strong>opacity(%)</strong>: 透明度，0%完全透明</li>
          <li><strong>drop-shadow()</strong>: 投影效果</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>使用滑块调整各种滤镜参数</li>
          <li>实时查看预览区域的滤镜效果</li>
          <li>尝试预设效果快速应用常见滤镜组合</li>
          <li>点击"复制"按钮获取生成的CSS代码</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">filter 会影响页面性能吗？</h3>
            <p class="text-muted-foreground mt-1">
              filter 属性会触发GPU加速，但某些滤镜（特别是blur）可能会影响性能。
              在动画中使用filter时应该谨慎，建议使用 will-change 或 transform 来优化性能。
              对于大型图像或多个元素应用滤镜时，要注意性能影响。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何组合多个滤镜？</h3>
            <p class="text-muted-foreground mt-1">
              可以用空格分隔多个filter函数来组合它们。例如：filter: blur(5px) brightness(120%) contrast(110%);
              滤镜会按照声明顺序依次应用，顺序不同可能产生不同的视觉效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">filter 和 backdrop-filter 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              filter 应用于元素本身，而 backdrop-filter 应用于元素背后的区域（背景）。
              backdrop-filter 常用于创建毛玻璃效果，让元素背后的内容模糊显示，这是实现现代UI设计的重要工具。
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
import { HelpCircle, ChevronUp, Box, Palette, Layers, Droplets } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'CSS滤镜生成器 - filter可视化工具 | Util工具箱',
  description: '在线CSS filter生成工具，可视化调节模糊、亮度、对比度、饱和度等滤镜效果。支持实时预览和一键复制CSS代码。',
  keywords: 'css filter,CSS滤镜,模糊效果,亮度调节,对比度,saturate,grayscale,sepia',
  author: 'Util工具箱',
  ogTitle: 'CSS滤镜生成器 - filter可视化工具',
  ogDescription: '专业的CSS filter生成工具，支持可视化调节各种滤镜效果。',
  ogImage: 'https://www.util.cn/images/tools/css-filter-generator.png',
  ogUrl: 'https://www.util.cn/tools/css-filter-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS滤镜生成器 - filter可视化',
  twitterDescription: '专业的CSS filter生成工具，支持可视化调节各种滤镜效果。',
  twitterImage: 'https://www.util.cn/images/tools/css-filter-generator.png'
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
            name: 'CSS滤镜生成器',
            description: '在线CSS filter可视化生成工具',
            url: 'https://www.util.cn/tools/css-filter-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '10种滤镜效果',
              '实时预览',
              '滤镜组合',
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
                name: 'CSS滤镜生成器',
                item: 'https://www.util.cn/tools/css-filter-generator'
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
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0
})

const presets = [
  {
    name: '无滤镜',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '灰度',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 100, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '复古',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 100, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '高亮',
    filters: { blur: 0, brightness: 150, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '高对比',
    filters: { blur: 0, brightness: 100, contrast: 150, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '高饱和',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 200, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '模糊',
    filters: { blur: 5, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '反色',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 100, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '暗色',
    filters: { blur: 0, brightness: 60, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '色调偏移',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 90, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '怀旧',
    filters: { blur: 0, brightness: 110, contrast: 90, saturate: 80, grayscale: 0, sepia: 40, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '阴影',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 10, shadowY: 10, shadowBlur: 10 }
  }
]

// 图标映射
const iconMap = {
  Box, Palette, Layers, Droplets
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'backdrop-filter-generator'),
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
  if (f.sepia > 0) parts.push(`sepia(${f.sepia}%)`)
  if (f.hueRotate > 0) parts.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.invert > 0) parts.push(`invert(${f.invert}%)`)
  if (f.opacity !== 100) parts.push(`opacity(${f.opacity}%)`)
  if (f.shadowX !== 0 || f.shadowY !== 0 || f.shadowBlur > 0) {
    parts.push(`drop-shadow(${f.shadowX}px ${f.shadowY}px ${f.shadowBlur}px rgba(0,0,0,0.5))`)
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
})

function applyPreset(preset) {
  filters.value = { ...preset.filters }
}

function resetFilters() {
  filters.value = {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    invert: 0,
    opacity: 100,
    shadowX: 0,
    shadowY: 0,
    shadowBlur: 0
  }
}

async function copyCSS() {
  const css = `filter: ${generatedFilter.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
