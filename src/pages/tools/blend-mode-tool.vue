<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">混合模式工具 - CSS mix-blend-mode可视化预览</h1>
      <p class="text-muted-foreground">一款免费的在线 CSS mix-blend-mode 可视化工具。实时预览所有 16 种混合模式效果，包括正片叠底、滤色、叠加等。支持一键复制 CSS 代码，快速掌握混合模式的使用方法。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧模式选择 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">混合模式</h2>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="mode in blendModes"
            :key="mode"
            @click="selectedMode = mode"
            :class="['px-2 py-2 text-xs rounded transition-colors', selectedMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80']"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>
        <div class="relative h-48 rounded-lg overflow-hidden mb-4" style="background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);">
          <!-- 上层元素 -->
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-xl flex items-center justify-center text-white font-bold"
            style="background: linear-gradient(135deg, #667eea, #764ba2);"
            :style="{ mixBlendMode: selectedMode }"
          >
            Blend
          </div>
        </div>

        <div class="mb-4">
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
            <pre class="text-sm font-mono text-foreground"><code>mix-blend-mode: {{ selectedMode }};</code></pre>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-foreground mb-2">模式说明</h3>
          <p class="text-sm text-muted-foreground">{{ getModeDescription(selectedMode) }}</p>
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
          什么是 mix-blend-mode？
        </h2>
        <p class="text-muted-foreground mb-4">
          mix-blend-mode 是 CSS 的一个属性，用于定义元素如何与其背景内容混合。
          它类似于 Photoshop 等图像处理软件中的图层混合模式，可以实现各种有趣的视觉效果。
        </p>
        <p class="text-muted-foreground">
          混合模式主要用于创建视觉特效、艺术效果和设计元素。
          例如，可以使用混合模式创建渐变叠加、色彩映射、透明度效果等。
          理解不同的混合模式可以帮助设计师和开发者创造出更加吸引人的用户界面。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧选择不同的混合模式</li>
          <li>观察右侧预览区域的混合效果</li>
          <li>查看每种模式的详细说明</li>
          <li>点击"复制"按钮获取 CSS 代码</li>
          <li>将代码应用到您的项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>16 种模式</strong>: 涵盖所有 CSS 标准混合模式</li>
          <li><strong>实时预览</strong>: 选择模式后立即看到效果</li>
          <li><strong>详细说明</strong>: 每种模式都有中文说明</li>
          <li><strong>代码生成</strong>: 一键复制可用的 CSS 代码</li>
          <li><strong>可视化学习</strong>: 通过直观的预览理解混合模式</li>
          <li><strong>本地运行</strong>: 纯前端实现，无需服务器</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">mix-blend-mode 和 background-blend-mode 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              mix-blend-mode 用于定义元素如何与其下方的所有内容（包括背景、其他元素等）混合，
              而 background-blend-mode 仅用于定义元素的多个背景图像之间如何混合。
              mix-blend-mode 更通用，而 background-blend-mode 只作用于背景层。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">浏览器兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              mix-blend-mode 在所有现代浏览器中都得到良好支持，包括 Chrome、Firefox、Safari 和 Edge。
              IE 不支持此属性。如果需要支持旧版浏览器，可以考虑使用降级方案或提供替代效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">最常用的混合模式有哪些？</h3>
            <p class="text-muted-foreground mt-1">
              最常用的混合模式包括：
              <strong>multiply</strong>（正片叠底）- 变暗效果；
              <strong>screen</strong>（滤色）- 变亮效果；
              <strong>overlay</strong>（叠加）- 增加对比度；
              <strong>color-dodge</strong>（颜色减淡）- 亮点效果。
              这些模式可以满足大部分设计需求。
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
import { ref } from 'vue'
import { HelpCircle, ChevronUp, Layers, Palette, Image, Eye } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '混合模式工具 - CSS mix-blend-mode可视化预览 | Util工具箱',
  description: '免费在线CSS mix-blend-mode可视化工具，实时预览所有16种混合模式效果。支持正片叠底、滤色、叠加等模式，一键复制CSS代码。',
  keywords: 'mix-blend-mode,混合模式,CSS混合,blend mode,正片叠底,滤色,叠加,在线混合模式工具',
  author: 'Util工具箱',
  ogTitle: '混合模式工具 - 免费在线CSS混合模式可视化',
  ogDescription: '专业的CSS mix-blend-mode可视化工具，实时预览所有16种混合模式效果，一键复制CSS代码。',
  ogImage: 'https://www.util.cn/images/tools/blend-mode-tool.png',
  ogUrl: 'https://www.util.cn/tools/blend-mode-tool',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '混合模式工具 - 免费在线CSS混合模式可视化',
  twitterDescription: '专业的CSS mix-blend-mode可视化工具，实时预览所有16种混合模式效果。',
  twitterImage: 'https://www.util.cn/images/tools/blend-mode-tool.png'
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
            name: '混合模式工具',
            description: '免费在线CSS mix-blend-mode可视化工具，预览各种混合模式效果',
            url: 'https://www.util.cn/tools/blend-mode-tool',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '16种混合模式',
              '实时预览功能',
              '详细说明',
              'CSS代码生成',
              '可视化学习',
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
                name: '混合模式工具',
                item: 'https://www.util.cn/tools/blend-mode-tool'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'mix-blend-mode和background-blend-mode有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'mix-blend-mode用于定义元素如何与其下方的所有内容混合，而background-blend-mode仅用于定义元素的多个背景图像之间如何混合。'
                }
              },
              {
                '@type': 'Question',
                name: '浏览器兼容性如何？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'mix-blend-mode在所有现代浏览器中都得到良好支持，包括Chrome、Firefox、Safari和Edge。IE不支持此属性。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const selectedMode = ref('multiply')
const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
]

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Layers, Palette, Image, Eye
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'mask-image-generator'),
  tools.find(t => t.id === 'background-pattern-generator'),
  tools.find(t => t.id === 'gradient-generator'),
  tools.find(t => t.id === 'filter-generator')
].filter(Boolean)

function getModeDescription(mode) {
  const descriptions = {
    'normal': '正常模式 - 默认值，上层元素完全覆盖下层元素',
    'multiply': '正片叠底 - 像素颜色值相乘，结果总是更暗',
    'screen': '滤色 - 像素颜色值反转相乘，结果总是更亮',
    'overlay': '叠加 - 结合 multiply 和 screen，使暗部更暗，亮部更亮',
    'darken': '变暗 - 取两层中较暗的像素值',
    'lighten': '变亮 - 取两层中较亮的像素值',
    'color-dodge': '颜色减淡 - 减淡下层颜色以反映上层颜色',
    'color-burn': '颜色加深 - 加深下层颜色以反映上层颜色',
    'hard-light': '强光 - 类似 overlay，但以上层颜色为准',
    'soft-light': '柔光 - 类似 overlay，但效果更柔和',
    'difference': '差值 - 从较亮的颜色中减去较暗的颜色',
    'exclusion': '排除 - 类似 difference，但对比度更低',
    'hue': '色相 - 使用上层的色相和下层的饱和度、亮度',
    'saturation': '饱和度 - 使用上层的饱和度和下层的色相、亮度',
    'color': '颜色 - 使用上层的色相、饱和度和下层的亮度',
    'luminosity': '亮度 - 使用上层的亮度和下层的色相、饱和度'
  }
  return descriptions[mode] || '暂无说明'
}

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`mix-blend-mode: ${selectedMode.value};`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
