<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">背景图案生成器 - CSS pattern图案制作工具</h1>
      <p class="text-muted-foreground">一款免费的在线 CSS 背景图案生成工具。创建网格、点阵、斜线、棋盘等背景图案。自定义颜色和尺寸，实时预览效果，一键复制 CSS 代码，快速为网站添加精美的背景图案。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧设置区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">图案设置</h2>

        <div class="grid grid-cols-2 gap-2 mb-6">
          <button
            v-for="pattern in patterns"
            :key="pattern.id"
            @click="selectedPattern = pattern.id"
            :class="['px-3 py-2 rounded-lg text-sm transition-colors', selectedPattern === pattern.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80']"
          >
            {{ pattern.name }}
          </button>
        </div>

        <h2 class="text-xl font-semibold text-foreground mb-4">颜色设置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">背景色</label>
            <input v-model="bgColor" type="color" class="w-full h-10 rounded-lg cursor-pointer border border-border">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">图案色</label>
            <input v-model="patternColor" type="color" class="w-full h-10 rounded-lg cursor-pointer border border-border">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">大小 (px)</label>
            <input v-model="size" type="range" min="10" max="100" class="w-full">
            <div class="text-sm text-muted-foreground mt-1">{{ size }}px</div>
          </div>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>
        <div
          class="w-full h-64 rounded-lg mb-4 border border-border"
          :style="{ background: generatedPattern }"
        ></div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-foreground">CSS 代码</h3>
            <button
              @click="copyCSS"
              class="text-xs px-3 py-1 bg-primary hover:bg-primary/90 rounded text-primary-foreground transition-colors"
            >
              复制
            </button>
          </div>
          <div class="p-4 bg-muted rounded-lg border border-border">
            <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>background: {{ generatedPattern }};
background-size: {{ size }}px {{ size }}px;</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
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
          什么是 CSS 背景图案？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS 背景图案是使用 CSS 渐变函数创建的可重复背景图案。
          通过巧妙地组合 linear-gradient、radial-gradient 和 conic-gradient，
          可以创建出网格、点阵、斜线、棋盘等各种图案效果，而无需使用图片文件。
        </p>
        <p class="text-muted-foreground">
          使用 CSS 图案的好处是纯代码实现，加载速度快，可以随时调整颜色和尺寸，
          非常适合用于创建网站背景、卡片装饰、分割线等视觉元素。
          这种方法既环保又高效，能够显著提升网站的性能和可维护性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择图案类型（网格、点阵、斜线等）</li>
          <li>设置背景色和图案颜色</li>
          <li>调整图案大小</li>
          <li>实时预览图案效果</li>
          <li>复制 CSS 代码到您的项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种图案</strong>: 支持网格、点阵、横线、斜线、棋盘、锯齿等</li>
          <li><strong>自定义颜色</strong>: 完全控制背景色和图案颜色</li>
          <li><strong>灵活尺寸</strong>: 可调整图案的密度和大小</li>
          <li><strong>实时预览</strong>: 参数修改后立即看到效果</li>
          <li><strong>纯 CSS 实现</strong>: 无需图片，加载速度快</li>
          <li><strong>本地生成</strong>: 所有处理都在浏览器本地完成</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">CSS 背景图案和图片背景有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              CSS 背景图案使用纯 CSS 代码生成，不需要额外的图片文件，加载速度更快，
              可以随时通过修改 CSS 来调整颜色和尺寸。图片背景需要额外的 HTTP 请求，
              但可以实现更复杂的视觉效果。对于简单的重复图案，CSS 方案通常是更好的选择。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何在项目中使用这些图案？</h3>
            <p class="text-muted-foreground mt-1">
              将生成的 CSS 代码复制到您的样式表中，应用到需要背景的元素上。
              例如：.card { background: 你的图案代码; background-size: 尺寸; }
              可以根据需要调整元素的 padding、margin 等属性来获得最佳视觉效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">浏览器兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              CSS 渐变功能在所有现代浏览器中都得到完美支持，包括 Chrome、Firefox、Safari 和 Edge。
              IE10 及以上版本也支持基本功能。这些图案使用标准的 CSS 属性，无需前缀即可使用。
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
import { HelpCircle, ChevronUp, Layout, Grid, Palette, Layers } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '背景图案生成器 - CSS pattern图案制作工具 | Util工具箱',
  description: '免费在线CSS背景图案生成工具，创建网格、点阵、斜线、棋盘等背景图案。自定义颜色和尺寸，实时预览效果，一键复制CSS代码。',
  keywords: 'background pattern,背景图案,CSS图案,网格,点阵,斜线,在线图案生成器',
  author: 'Util工具箱',
  ogTitle: '背景图案生成器 - 免费在线CSS图案制作',
  ogDescription: '专业的CSS背景图案生成工具，创建网格、点阵、斜线等背景图案。自定义颜色尺寸，实时预览，代码一键复制。',
  ogImage: 'https://www.util.cn/images/tools/background-pattern-generator.png',
  ogUrl: 'https://www.util.cn/tools/background-pattern-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '背景图案生成器 - 免费在线CSS图案制作',
  twitterDescription: '专业的CSS背景图案生成工具，创建网格、点阵、斜线等背景图案。自定义颜色尺寸。',
  twitterImage: 'https://www.util.cn/images/tools/background-pattern-generator.png'
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
            name: '背景图案生成器',
            description: '免费在线CSS背景图案生成工具，创建各种背景图案',
            url: 'https://www.util.cn/tools/background-pattern-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种图案类型',
              '颜色自定义',
              '尺寸可调',
              '实时预览功能',
              '纯CSS实现',
              '本地安全处理'
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
                name: '背景图案生成器',
                item: 'https://www.util.cn/tools/background-pattern-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'CSS背景图案和图片背景有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CSS背景图案使用纯CSS代码生成，不需要额外的图片文件，加载速度更快，可以随时通过修改CSS来调整颜色和尺寸。图片背景需要额外的HTTP请求，但可以实现更复杂的视觉效果。'
                }
              },
              {
                '@type': 'Question',
                name: '浏览器兼容性如何？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CSS渐变功能在所有现代浏览器中都得到完美支持，包括Chrome、Firefox、Safari和Edge。IE10及以上版本也支持基本功能。这些图案使用标准的CSS属性，无需前缀即可使用。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const selectedPattern = ref('grid')
const bgColor = ref('#ffffff')
const patternColor = ref('#3b82f6')
const size = ref(20)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Layout, Grid, Palette, Layers
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'blend-mode-tool'),
  tools.find(t => t.id === 'mask-image-generator'),
  tools.find(t => t.id === 'gradient-generator'),
  tools.find(t => t.id === 'color-picker')
].filter(Boolean)

const patterns = [
  { id: 'grid', name: '网格' },
  { id: 'dots', name: '点阵' },
  { id: 'lines', name: '横线' },
  { id: 'diagonal', name: '斜线' },
  { id: 'checkerboard', name: '棋盘' },
  { id: 'zigzag', name: '锯齿' }
]

const generatedPattern = computed(() => {
  const s = size.value
  const bg = bgColor.value
  const color = patternColor.value

  switch (selectedPattern.value) {
    case 'grid':
      return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px), ${bg}`
    case 'dots':
      return `radial-gradient(${color} 1px, transparent 1px), ${bg}`
    case 'lines':
      return `linear-gradient(${color} 1px, transparent 1px), ${bg}`
    case 'diagonal':
      return `repeating-linear-gradient(45deg, ${bg}, ${bg} ${s/2}px, ${color} ${s/2}px, ${color} ${s}px)`
    case 'checkerboard':
      return `conic-gradient(${color} 90deg, ${bg} 90deg 180deg, ${color} 180deg 270deg, ${bg} 270deg)`
    case 'zigzag':
      return `linear-gradient(135deg, ${color} 25%, transparent 25%), linear-gradient(225deg, ${color} 25%, transparent 25%), ${bg}`
    default:
      return bg
  }
})

async function copyCSS() {
  const css = `background: ${generatedPattern.value};\nbackground-size: ${size.value}px ${size.value}px;`
  try {
    await navigator.clipboard.writeText(css)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
