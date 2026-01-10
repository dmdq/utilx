<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">内阴影生成器 - inset box-shadow可视化工具</h1>
      <p class="text-muted-foreground">一款专业的在线 CSS 内阴影生成工具。专门创建 inset box-shadow 效果，实时预览、一键复制CSS代码。适用于卡片凹陷效果、按钮按压效果等设计场景，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 设置区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">设置</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">X偏移 (px)</label>
                <input v-model.number="x" type="range" min="-50" max="50" class="w-full">
                <span class="text-sm text-muted-foreground">{{ x }}px</span>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Y偏移 (px)</label>
                <input v-model.number="y" type="range" min="-50" max="50" class="w-full">
                <span class="text-sm text-muted-foreground">{{ y }}px</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">模糊半径 (px)</label>
              <input v-model.number="blur" type="range" min="0" max="100" class="w-full">
              <span class="text-sm text-muted-foreground">{{ blur }}px</span>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">扩展半径 (px)</label>
              <input v-model.number="spread" type="range" min="-50" max="50" class="w-full">
              <span class="text-sm text-muted-foreground">{{ spread }}px</span>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">颜色</label>
              <input v-model="color" type="color" class="w-full h-10 rounded cursor-pointer border border-border">
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">透明度</label>
              <input v-model.number="opacity" type="range" min="0" max="1" step="0.01" class="w-full">
              <span class="text-sm text-muted-foreground">{{ opacity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">预览</label>
          <button
            @click="copyCSS"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
          >
            复制CSS
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1 flex flex-col">
          <div
            class="w-full flex-1 rounded-xl flex items-center justify-center bg-primary/20"
            :style="{ boxShadow: generatedShadow, minHeight: '200px' }"
          >
            <span class="text-foreground text-xl font-bold">Inset Shadow</span>
          </div>

          <div class="mt-4 p-4 bg-muted rounded-lg">
            <pre class="text-sm font-mono text-foreground"><code>box-shadow: {{ generatedShadow }};</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 bg-card border border-border relative">
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
          什么是 Inset Box Shadow？
        </h2>
        <p class="text-muted-foreground mb-4">
          Inset Box Shadow（内阴影）是CSS box-shadow属性的一种特殊效果，通过添加inset关键字，
          可以将阴影效果应用到元素内部，而不是外部。这种效果常用于创建凹陷、按压、内嵌等视觉效果，
          在现代网页设计中非常流行。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>调整X、Y偏移量控制阴影位置</li>
          <li>设置模糊半径和扩展半径调整阴影效果</li>
          <li>选择阴影颜色和透明度</li>
          <li>实时预览效果，满意后点击"复制CSS"按钮</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          Inset Shadow 语法
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <code class="text-sm font-mono text-foreground">
            box-shadow: inset h-offset v-offset blur-radius spread-radius color;
          </code>
        </div>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>inset</strong>: 关键字，将阴影改为内部阴影</li>
          <li><strong>h-offset</strong>: 水平偏移量，可为负值</li>
          <li><strong>v-offset</strong>: 垂直偏移量，可为负值</li>
          <li><strong>blur-radius</strong>: 模糊半径，值越大越模糊</li>
          <li><strong>spread-radius</strong>: 扩展半径，正值扩大，负值缩小</li>
          <li><strong>color</strong>: 阴影颜色</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>按钮按压效果</strong>: 模拟按钮被按下的凹陷感</li>
          <li><strong>输入框聚焦</strong>: 创建输入框获得焦点时的内嵌效果</li>
          <li><strong>卡片设计</strong>: 为卡片添加深度和层次感</li>
          <li><strong>凹陷文字</strong>: 创建文字刻在表面的效果</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Inset 和普通 box-shadow 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              普通 box-shadow 在元素外部创建阴影，而 inset 在元素内部创建阴影。
              Inset 阴影会让元素看起来凹陷或内嵌，普通阴影则让元素看起来浮起或突出。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何创建凹陷输入框效果？</h3>
            <p class="text-muted-foreground mt-1">
              使用 inset box-shadow，设置较小的模糊半径和负值的扩展半径，
              配合深色阴影颜色，可以创建出经典的凹陷输入框效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以使用多个 inset 阴影吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。box-shadow 属性支持多个阴影值，用逗号分隔。
              但要注意，inset 阴影必须放在普通阴影之前，且所有阴影都需要添加 inset 关键字。
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
import { HelpCircle, ChevronUp, Box, Layers, Square, RectangleHorizontal } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '内阴影生成器 - inset box-shadow可视化工具 | Util工具箱',
  description: '免费在线CSS内阴影生成工具，专门创建inset box-shadow效果。实时预览、一键复制CSS代码。适用于卡片凹陷效果、按钮按压效果等设计场景。',
  keywords: 'inset shadow,内阴影,box-shadow,CSS阴影,凹陷效果,CSS生成器,在线设计工具',
  author: 'Util工具箱',
  ogTitle: '内阴影生成器 - inset box-shadow可视化工具',
  ogDescription: '专业的在线CSS内阴影生成工具，专门创建inset box-shadow效果。',
  ogImage: 'https://www.util.cn/images/tools/box-shadow-inset-generator.png',
  ogUrl: 'https://www.util.cn/tools/box-shadow-inset-generator',
  ogType: 'website'
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
            name: '内阴影生成器',
            description: '在线CSS内阴影生成工具，创建inset box-shadow效果',
            url: 'https://www.util.cn/tools/box-shadow-inset-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '内阴影效果',
              '实时预览',
              '一键复制CSS',
              '透明度控制',
              '扩展半径调整'
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
                name: '内阴影生成器',
                item: 'https://www.util.cn/tools/box-shadow-inset-generator'
              }
            ]
          }
        ]
      })
    }
  ]
})

const x = ref(0)
const y = ref(0)
const blur = ref(20)
const spread = ref(0)
const color = ref('#000000')
const opacity = ref(0.5)
const isSeoContentVisible = ref(true)

const generatedShadow = computed(() => {
  const rgba = hexToRgba(color.value, opacity.value)
  return `inset ${x.value}px ${y.value}px ${blur.value}px ${spread.value}px ${rgba}`
})

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`box-shadow: ${generatedShadow.value};`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap = {
  Box, Layers, Square, RectangleHorizontal
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'box-shadow-inset-generator'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'text-shadow-generator'),
    tools.find(t => t.id === 'letter-spacing-tool'),
    tools.find(t => t.id === 'typography-scale')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
