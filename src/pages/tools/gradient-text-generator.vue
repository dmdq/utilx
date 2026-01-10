<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">渐变文字生成器 - 在线文字渐变效果工具</h1>
      <p class="text-muted-foreground">生成精美的CSS渐变文字效果，支持自定义颜色和角度。使用background-clip技术创建现代感十足的文字渐变，一键复制CSS代码。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">设置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">文字</label>
            <input v-model="text" type="text" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground" placeholder="输入文字">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">渐变起始色</label>
            <input v-model="color1" type="color" class="w-full h-10 rounded cursor-pointer border border-border">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">渐变结束色</label>
            <input v-model="color2" type="color" class="w-full h-10 rounded cursor-pointer border border-border">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">角度 (deg)</label>
            <input v-model.number="angle" type="range" min="0" max="360" class="w-full">
            <div class="text-sm text-muted-foreground mt-1">{{ angle }}°</div>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>
        <div class="p-8 bg-muted rounded-lg mb-4 flex items-center justify-center">
          <span
            class="text-5xl font-bold"
            :style="{ background: generatedGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }"
          >
            {{ text || 'Gradient Text' }}
          </span>
        </div>

        <div class="p-4 bg-muted rounded-lg">
          <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>{{ generatedCSS }}</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">复制CSS</button>
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
          什么是渐变文字？
        </h2>
        <p class="text-muted-foreground mb-4">
          渐变文字是一种现代网页设计技术，通过CSS的background-clip属性将背景渐变效果应用到文字上。
          这种技术能够创建出视觉冲击力强的文字效果，常用于标题、标语和品牌展示等场景。
          渐变文字可以让原本单调的文字变得更加生动、有趣，提升用户体验和品牌识别度。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          技术原理
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>background</strong>: 创建线性渐变背景，定义渐变的颜色和角度</li>
          <li><strong>-webkit-background-clip: text</strong>: 将背景裁剪到文字形状（WebKit内核浏览器）</li>
          <li><strong>-webkit-text-fill-color: transparent</strong>: 将文字填充颜色设为透明，使背景渐变显示出来</li>
          <li><strong>background-clip: text</strong>: 标准属性，将背景裁剪到文字形状</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在"文字"输入框中输入您想要应用渐变效果的文字</li>
          <li>选择渐变的起始颜色和结束颜色</li>
          <li>调整渐变角度，实时预览效果</li>
          <li>满意后点击"复制CSS"按钮获取代码</li>
          <li>将CSS代码复制到您的样式表中使用</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">渐变文字在所有浏览器中都能显示吗？</h3>
            <p class="text-muted-foreground mt-1">
              现代浏览器都支持渐变文字效果。我们提供了标准属性和WebKit前缀属性，确保在Chrome、Safari、Firefox、Edge等主流浏览器中都能正常显示。
              对于不支持的旧版浏览器，会回退到普通文字显示。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以使用多个颜色创建渐变吗？</h3>
            <p class="text-muted-foreground mt-1">
              当前版本支持双色渐变。如果需要多色渐变，可以手动修改生成的CSS代码，在linear-gradient()中添加更多颜色节点。
              例如：linear-gradient(90deg, #667eea, #764ba2, #f093fb)。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">渐变文字会影响SEO吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会影响SEO。渐变文字只是改变了文字的视觉呈现方式，文字内容依然存在于DOM中，搜索引擎可以正常抓取。
              相比图片文字，渐变文字更有利于SEO，因为文字内容是可索引的。
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
import {
  HelpCircle, ChevronUp, Palette, Type, Sparkles, Droplets,
  Eye, Copy, Code
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '渐变文字生成器 - 在线文字渐变效果工具 | Util工具箱',
  description: '免费在线渐变文字生成器，创建CSS background-clip文字渐变效果。支持自定义颜色、角度，一键复制代码，兼容所有现代浏览器。',
  keywords: '渐变文字,文字渐变,background-clip,CSS文字,gradient text,文字特效,网页设计',
  author: 'Util工具箱',
  ogTitle: '渐变文字生成器 - 在线文字渐变效果',
  ogDescription: '创建精美的CSS渐变文字效果，支持自定义颜色和角度。',
  ogImage: 'https://www.util.cn/images/tools/gradient-text-generator.png',
  ogUrl: 'https://www.util.cn/tools/gradient-text-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '渐变文字生成器 - 在线文字渐变效果',
  twitterDescription: '创建精美的CSS渐变文字效果，支持自定义颜色和角度。',
  twitterImage: 'https://www.util.cn/images/tools/gradient-text-generator.png'
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
            name: '渐变文字生成器',
            description: '在线渐变文字生成工具，创建CSS文字渐变效果',
            url: 'https://www.util.cn/tools/gradient-text-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '实时预览效果',
              '自定义渐变颜色',
              '调整渐变角度',
              '一键复制CSS代码',
              '跨浏览器兼容'
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
                name: '渐变文字生成器',
                item: 'https://www.util.cn/tools/gradient-text-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '渐变文字在所有浏览器中都能显示吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '现代浏览器都支持渐变文字效果。我们提供了标准属性和WebKit前缀属性，确保在Chrome、Safari、Firefox、Edge等主流浏览器中都能正常显示。'
                }
              },
              {
                '@type': 'Question',
                name: '可以使用多个颜色创建渐变吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '当前版本支持双色渐变。如需多色渐变，可以手动修改生成的CSS代码，在linear-gradient()中添加更多颜色节点。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const text = ref('Gradient Text')
const color1 = ref('#667eea')
const color2 = ref('#764ba2')
const angle = ref(135)
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Palette, Type, Sparkles, Droplets, Eye, Copy, Code
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'gradient-text-generator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'color-palette-generator'),
    tools.find(t => t.id === 'tailwind-color-palette'),
    tools.find(t => t.id === 'material-design-colors'),
    tools.find(t => t.id === 'spacing-calculator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const generatedGradient = computed(() => {
  return `linear-gradient(${angle.value}deg, ${color1.value}, ${color2.value})`
})

const generatedCSS = computed(() => {
  return `.gradient-text {
  background: ${generatedGradient.value};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(generatedCSS.value)
    alert('已复制CSS代码')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
