<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文字阴影生成器 - text-shadow可视化工具</h1>
      <p class="text-muted-foreground">一款专业的在线 text-shadow 生成工具。支持多层文字阴影效果、实时预览、一键复制CSS代码。适用于网页设计和UI开发，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 设置区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">阴影层级</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-4">
            <div v-for="(layer, index) in layers" :key="index" class="p-4 bg-muted rounded-lg relative">
              <button @click="removeLayer(index)" class="absolute top-2 right-2 text-destructive hover:bg-destructive/10 rounded p-1 transition-colors">
                <X class="w-4 h-4" />
              </button>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-muted-foreground">X偏移</label>
                  <input v-model.number="layer.x" type="number" class="w-full px-2 py-1 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Y偏移</label>
                  <input v-model.number="layer.y" type="number" class="w-full px-2 py-1 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">模糊半径</label>
                  <input v-model.number="layer.blur" type="number" class="w-full px-2 py-1 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">颜色</label>
                  <input v-model="layer.color" type="color" class="w-full h-8 rounded border border-border cursor-pointer">
                </div>
              </div>
            </div>

            <button @click="addLayer" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              + 添加阴影层
            </button>
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
          <div class="mb-4">
            <input v-model="previewText" type="text" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="输入预览文字">
          </div>

          <div class="p-8 bg-muted rounded-lg min-h-[150px] flex items-center justify-center flex-1">
            <span
              class="text-4xl font-bold"
              :style="{ textShadow: generatedShadow, color: textColor }"
            >
              {{ previewText }}
            </span>
          </div>

          <div class="mt-4 p-4 bg-muted rounded-lg">
            <pre class="text-sm font-mono text-foreground"><code>text-shadow: {{ generatedShadow }};</code></pre>
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
          什么是 Text Shadow？
        </h2>
        <p class="text-muted-foreground mb-4">
          Text Shadow（文字阴影）是CSS3中的一个属性，用于为文本添加阴影效果。
          它可以让文字在页面上更加立体、突出，增强视觉层次感。文字阴影广泛应用于标题、按钮、特效文字等场景，
          是网页设计中常用的视觉表现手法。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>调整阴影层的X、Y偏移量和模糊半径</li>
          <li>选择合适的阴影颜色</li>
          <li>可以添加多层阴影，创建复杂的文字效果</li>
          <li>实时预览效果，满意后点击"复制CSS"按钮</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          Text Shadow 语法
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <code class="text-sm font-mono text-foreground">
            text-shadow: h-shadow v-shadow blur-radius color | none;
          </code>
        </div>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>h-shadow</strong>: 必需。水平阴影的位置。允许负值。</li>
          <li><strong>v-shadow</strong>: 必需。垂直阴影的位置。允许负值。</li>
          <li><strong>blur-radius</strong>: 可选。模糊半径。</li>
          <li><strong>color</strong>: 可选。阴影的颜色。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">文字阴影会影响性能吗？</h3>
            <p class="text-muted-foreground mt-1">
              简单的文字阴影对性能影响很小。但如果使用多层阴影或在大面积文本上应用阴影，
              可能会对渲染性能产生一定影响。建议适度使用，避免滥用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何创建霓虹灯效果？</h3>
            <p class="text-muted-foreground mt-1">
              可以通过多层文字阴影创建霓虹灯效果。使用明亮颜色作为基础阴影，
              添加多层逐渐扩大的模糊阴影，可以创造出发光的效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">文字阴影兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              Text Shadow 属性在现代浏览器中得到广泛支持，包括Chrome、Firefox、Safari、Edge等。
              但在IE9及以下版本中不支持。对于需要支持旧版浏览器的情况，可以使用图片替代。
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
import { X, HelpCircle, ChevronUp, Type, Palette, Box, Minus, Sparkles } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '文字阴影生成器 - text-shadow可视化工具 | Util工具箱',
  description: '免费在线text-shadow生成工具，支持多层文字阴影效果、实时预览、一键复制CSS代码。适用于网页设计和UI开发，纯本地计算，数据安全隐私。',
  keywords: 'text-shadow,文字阴影,CSS文字,文字效果,文字特效,CSS生成器,在线设计工具',
  author: 'Util工具箱',
  ogTitle: '文字阴影生成器 - text-shadow可视化工具',
  ogDescription: '专业的在线text-shadow生成工具，支持多层文字阴影效果、实时预览、一键复制CSS代码。',
  ogImage: 'https://www.util.cn/images/tools/text-shadow-generator.png',
  ogUrl: 'https://www.util.cn/tools/text-shadow-generator',
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
            name: '文字阴影生成器',
            description: '在线text-shadow生成工具，创建多层文字阴影效果',
            url: 'https://www.util.cn/tools/text-shadow-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多层文字阴影',
              '实时预览效果',
              '一键复制CSS',
              '颜色选择器',
              '参数精确调整'
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
                name: '文字阴影生成器',
                item: 'https://www.util.cn/tools/text-shadow-generator'
              }
            ]
          }
        ]
      })
    }
  ]
})

const layers = ref([
  { x: 2, y: 2, blur: 4, color: '#000000' }
])

const previewText = ref('Text Shadow')
const textColor = ref('#3B82F6')
const isSeoContentVisible = ref(true)

const generatedShadow = computed(() => {
  return layers.value.map(l => `${l.x}px ${l.y}px ${l.blur}px ${l.color}`).join(', ')
})

function addLayer() {
  layers.value.push({ x: 0, y: 0, blur: 0, color: '#000000' })
}

function removeLayer(index) {
  if (layers.value.length > 1) {
    layers.value.splice(index, 1)
  }
}

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`text-shadow: ${generatedShadow.value};`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap = {
  Type, Palette, Box, Minus, Sparkles
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'text-shadow-generator'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'box-shadow-inset-generator'),
    tools.find(t => t.id === 'letter-spacing-tool'),
    tools.find(t => t.id === 'line-height-calculator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
