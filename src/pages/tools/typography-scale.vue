<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">字体比例系统 - 和谐的字体层级</h1>
      <p class="text-muted-foreground">一款专业的在线字体比例系统生成工具。基于音乐音阶生成和谐的字体大小层级，支持多种经典比例（大三度、黄金比例等）。一键生成CSS变量，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 基础设置 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">基础设置</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">基准字号 (px)</label>
              <input v-model.number="baseSize" type="number" min="8" max="32" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">比例类型</label>
              <select v-model="scaleType" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="majorThird">大三度 (1.250)</option>
                <option value="minorThird">小三度 (1.200)</option>
                <option value="perfectFourth">完全四度 (1.333)</option>
                <option value="perfectFifth">完全五度 (1.500)</option>
                <option value="goldenRatio">黄金比例 (1.618)</option>
                <option value="octave">八度 (2.000)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">层级数量</label>
              <input v-model.number="levels" type="number" min="4" max="10" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            </div>
          </div>
        </div>
      </div>

      <!-- 预览 -->
      <div class="lg:col-span-2 flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">字体预览</label>
          <button
            @click="copyCSS"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
          >
            复制CSS
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1 flex flex-col">
          <div class="space-y-3 flex-1 overflow-auto">
            <div
              v-for="(size, index) in fontSizes"
              :key="index"
              class="flex items-center gap-4 p-3 bg-muted rounded-lg"
            >
              <div class="w-24 text-sm text-muted-foreground">{{ size.label }}</div>
              <div class="w-16 text-sm font-mono text-foreground">{{ size.value }}px</div>
              <div :style="{ fontSize: size.value + 'px' }" class="flex-1 text-foreground">
                {{ size.sample }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CSS变量 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-foreground">CSS变量</h2>
        <button @click="copyCSS" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">复制</button>
      </div>
      <div class="p-4 bg-muted rounded-lg overflow-x-auto">
        <pre class="text-sm font-mono text-foreground"><code>:root {
{{ fontCSS }}
}</code></pre>
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
          什么是 Typography Scale？
        </h2>
        <p class="text-muted-foreground mb-4">
          Typography Scale（字体比例系统）是一组基于数学比例的字体大小层级。
          它源自音乐中的音阶概念，通过固定的比例关系生成一系列和谐的字体大小。
          使用字体比例系统可以让页面的排版更加和谐统一，提升整体设计质感。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用的字体比例
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>大三度 (1.250)</strong>: 温和的缩放比例，适合大多数设计场景</li>
          <li><strong>小三度 (1.200)</strong>: 更细微的缩放，适合保守的设计风格</li>
          <li><strong>完全四度 (1.333)</strong>: 经典的排版比例，可读性极佳</li>
          <li><strong>完全五度 (1.500)</strong>: 较大的缩放，适合标题层级明显的设计</li>
          <li><strong>黄金比例 (1.618)</strong>: 自然的审美比例，视觉效果最美观</li>
          <li><strong>八度 (2.000)</strong>: 强烈的缩放对比，适合现代简约设计</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用字体比例系统
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择一个基准字号（通常是正文字号，如16px）</li>
          <li>选择合适的比例类型（黄金比例、大三度等）</li>
          <li>系统会自动生成一系列和谐的字体大小</li>
          <li>将生成的CSS变量复制到项目中使用</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">应该选择哪种比例？</h3>
            <p class="text-muted-foreground mt-1">
              完全四度（1.333）是最常用的选择，它在可读性和层级感之间取得了很好的平衡。
              如果需要更明显的层级差异，可以选择黄金比例（1.618）。
              对于保守的设计风格，可以选择大三度（1.250）或小三度（1.200）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">基准字号应该设置为多少？</h3>
            <p class="text-muted-foreground mt-1">
              通常将正文的字号作为基准。对于Web设计，16px是最常见的选择，
              因为它是大多数浏览器的默认字号。如果你的设计需要更大或更小的正文，
              可以相应调整基准字号。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何在项目中使用CSS变量？</h3>
            <p class="text-muted-foreground mt-1">
              将生成的CSS变量复制到你的样式表中，然后使用var()函数引用它们。
              例如：font-size: var(--font-h1); 这样可以确保整个项目的字体大小保持一致的层级关系。
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
import { HelpCircle, ChevronUp, Type, Heading1, Scale } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '字体比例系统 - 和谐的字体层级 | Util工具箱',
  description: '免费在线字体比例系统生成工具，基于音乐音阶生成和谐的字体大小层级。支持多种经典比例（大三度、黄金比例等），一键生成CSS变量。',
  keywords: '字体比例,typography scale,字体层级,排版,字体大小,CSS变量,设计工具',
  author: 'Util工具箱',
  ogTitle: '字体比例系统 - 和谐的字体层级',
  ogDescription: '专业的在线字体比例系统生成工具，基于音乐音阶生成和谐的字体大小层级。',
  ogImage: 'https://www.util.cn/images/tools/typography-scale.png',
  ogUrl: 'https://www.util.cn/tools/typography-scale',
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
            name: '字体比例系统',
            description: '在线字体比例系统生成工具，基于音乐音阶生成和谐的字体大小层级',
            url: 'https://www.util.cn/tools/typography-scale',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种比例类型',
              '自动生成层级',
              'CSS变量导出',
              '实时预览',
              '一键复制'
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
                name: '字体比例系统',
                item: 'https://www.util.cn/tools/typography-scale'
              }
            ]
          }
        ]
      })
    }
  ]
})

const baseSize = ref(16)
const scaleType = ref('majorThird')
const levels = ref(7)
const isSeoContentVisible = ref(true)

const scales = {
  majorThird: 1.250,
  minorThird: 1.200,
  perfectFourth: 1.333,
  perfectFifth: 1.500,
  goldenRatio: 1.618,
  octave: 2.000
}

const labels = ['Caption', 'Small', 'Body', 'Lead', 'H3', 'H2', 'H1', 'Display', 'Display 2', 'Display 3']
const samples = ['正文说明文字', '小号文字', '这是正文内容', '引言段落', '三级标题文字', '二级标题内容', '页面大标题', '特大展示文字', '超大标题', '巨幅展示']

const fontSizes = computed(() => {
  const scale = scales[scaleType.value]
  const sizes = []

  // 生成更小的字号
  let current = baseSize.value
  const smallerSizes = []
  for (let i = 0; i < 2; i++) {
    current = current / scale
    smallerSizes.unshift({ label: labels[i], value: Math.round(current), sample: samples[i] })
  }

  // 基准字号
  sizes.push({ label: 'Body', value: baseSize.value, sample: '这是正文内容' })

  // 生成更大的字号
  current = baseSize.value
  for (let i = 0; i < levels.value - 3; i++) {
    current = current * scale
    sizes.push({ label: labels[i + 4], value: Math.round(current), sample: samples[i + 4] })
  }

  return [...smallerSizes, ...sizes]
})

const fontCSS = computed(() => {
  return fontSizes.value.map((size, i) => `  --font-${size.label.toLowerCase().replace(' ', '-')}: ${size.value}px;  /* ${size.label} */`).join('\n')
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`:root {\n${fontCSS.value}\n}`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap = {
  Type, Heading1, Scale
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'typography-scale'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'line-height-calculator'),
    tools.find(t => t.id === 'letter-spacing-tool'),
    tools.find(t => t.id === 'golden-ratio-calculator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
