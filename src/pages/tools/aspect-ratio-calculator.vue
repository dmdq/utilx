<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">宽高比计算器 - 在线计算和锁定元素宽高比工具</h1>
      <p class="text-muted-foreground">一款免费的在线 Aspect Ratio 计算工具。支持常用宽高比预设、实时预览、CSS代码生成。帮助设计师和开发者快速计算和锁定元素宽高比。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入尺寸</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">宽度</label>
              <input v-model.number="inputWidth" type="number" class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary" @input="calculateHeight">
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">高度</label>
              <input v-model.number="inputHeight" type="number" class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary" @input="calculateWidth">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">宽高比</label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <input v-model.number="ratioWidth" type="number" class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary" @input="updateRatio">
              </div>
              <div>
                <input v-model.number="ratioHeight" type="number" class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary" @input="updateRatio">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">预设比例</label>
            <div class="grid grid-cols-3 gap-2">
              <button @click="setRatio(16, 9)" class="px-2 py-2 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">16:9</button>
              <button @click="setRatio(4, 3)" class="px-2 py-2 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">4:3</button>
              <button @click="setRatio(1, 1)" class="px-2 py-2 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">1:1</button>
              <button @click="setRatio(21, 9)" class="px-2 py-2 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">21:9</button>
              <button @click="setRatio(3, 2)" class="px-2 py-2 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">3:2</button>
              <button @click="setRatio(5, 4)" class="px-2 py-2 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">5:4</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">预览</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="p-4 bg-muted rounded-lg mb-4 flex items-center justify-center" style="min-height: 300px;">
            <div
              class="bg-primary rounded mx-auto transition-all duration-300"
              :style="{ width: Math.min(previewWidth, 300) + 'px', height: Math.min(previewHeight, 300 * ratioHeight / ratioWidth) + 'px' }"
            ></div>
          </div>
          <div class="text-center text-sm text-muted-foreground">
            {{ inputWidth }} x {{ inputHeight }} ({{ (ratioWidth / ratioHeight).toFixed(2) }}:1)
          </div>
        </div>
      </div>
    </div>

    <!-- CSS代码输出 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-foreground">CSS代码</label>
        <button
          @click="copyCSS"
          class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
        >
          复制CSS
        </button>
      </div>
      <div class="bg-muted rounded-lg p-4 overflow-x-auto">
        <pre class="text-sm font-mono text-foreground"><code>.element {
  aspect-ratio: {{ ratioWidth }} / {{ ratioHeight }};
  width: 100%;
}</code></pre>
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
          什么是宽高比 (Aspect Ratio)？
        </h2>
        <p class="text-muted-foreground mb-4">
          宽高比（Aspect Ratio）是指图像或屏幕宽度与高度之间的比例关系。
          它通常表示为两个数字的比值，如 16:9、4:3 等。第一个数字代表宽度，第二个数字代表高度。
          宽高比在网页设计、图形设计、视频制作等领域中非常重要，它确保元素在不同设备和屏幕上保持正确的比例。
        </p>
        <p class="text-muted-foreground">
          在 CSS 中，aspect-ratio 属性允许您直接设置元素的首选宽高比，
          这对于创建响应式布局特别有用，可以确保容器在调整大小时保持其比例。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用宽高比标准
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>16:9</strong> - 现代高清电视和显示器的主流标准，也是 YouTube 视频的默认比例</li>
          <li><strong>4:3</strong> - 传统电视和计算机显示器的标准，现在仍用于某些平板电脑和照片</li>
          <li><strong>21:9</strong> - 超宽屏显示器比例，提供更沉浸的观影体验</li>
          <li><strong>1:1</strong> - 正方形比例，常用于社交媒体头像和 Instagram 帖子</li>
          <li><strong>3:2</strong> - 传统 35mm 胶片相机的比例，也是许多全画幅相机的默认比例</li>
          <li><strong>5:4</strong> - 某些大型画框和摄影打印的标准比例</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入已知的宽度或高度数值，工具会自动计算对应的另一边</li>
          <li>选择预设的宽高比（如 16:9）或手动输入自定义比例</li>
          <li>实时预览元素在不同比例下的显示效果</li>
          <li>复制生成的 CSS 代码直接应用到您的项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          CSS aspect-ratio 属性详解
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>/* 基本用法 */
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* 响应式图片 */
.responsive-image {
  aspect-ratio: 4 / 3;
  width: 100%;
  object-fit: cover;
}

/* 卡片组件 */
.card {
  aspect-ratio: 3 / 4;
  width: 200px;
}</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要锁定宽高比？</h3>
            <p class="text-muted-foreground mt-1">
              锁定宽高比可以确保元素在不同设备和屏幕尺寸上保持一致的视觉效果。
              对于图片、视频、卡片等元素，保持正确的宽高比可以避免变形，提升用户体验。
              在响应式设计中，aspect-ratio 属性让布局更加灵活和稳定。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">aspect-ratio 属性的浏览器兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              aspect-ratio 属性在现代浏览器中得到广泛支持，包括 Chrome、Firefox、Safari 和 Edge 的最新版本。
              对于需要支持旧版浏览器的情况，可以使用 padding-bottom hack 等传统方法作为降级方案。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的宽高比？</h3>
            <p class="text-muted-foreground mt-1">
              选择宽高比应考虑内容类型和展示场景。16:9 适合视频和宽屏内容，
              4:3 适合传统照片和文档，1:1 适合头像和社交媒体图片。
              在网页设计中，保持与整个设计系统的视觉一致性也很重要。
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
import { HelpCircle, ChevronUp, Ratio, Image, Palette, Layout, Ruler, Type } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '宽高比计算器 - 在线计算和锁定元素宽高比工具 | Util工具箱',
  description: '免费在线宽高比计算工具，支持常用比例预设、实时预览、CSS代码生成。帮助设计师和开发者快速计算和锁定元素宽高比，支持响应式布局设计。',
  keywords: '宽高比计算器,aspect-ratio,宽高比,比例计算,CSS aspect-ratio,响应式设计,16:9,4:3,尺寸计算',
  author: 'Util工具箱',
  ogTitle: '宽高比计算器 - 免费在线宽高比计算工具',
  ogDescription: '专业的宽高比计算工具，支持常用比例预设、实时预览、CSS代码生成。帮助您快速计算和锁定元素宽高比。',
  ogImage: 'https://www.util.cn/images/tools/aspect-ratio-calculator.png',
  ogUrl: 'https://www.util.cn/tools/aspect-ratio-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '宽高比计算器 - 免费在线宽高比计算',
  twitterDescription: '专业的宽高比计算工具，支持常用比例预设、实时预览、CSS代码生成。',
  twitterImage: 'https://www.util.cn/images/tools/aspect-ratio-calculator.png'
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
            name: '宽高比计算器',
            description: '免费在线宽高比计算工具，支持常用比例预设和CSS代码生成',
            url: 'https://www.util.cn/tools/aspect-ratio-calculator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '宽高比实时计算',
              '常用比例预设',
              'CSS代码生成',
              '实时预览效果',
              '响应式设计支持'
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
                name: '宽高比计算器',
                item: 'https://www.util.cn/tools/aspect-ratio-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么需要锁定宽高比？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '锁定宽高比可以确保元素在不同设备和屏幕尺寸上保持一致的视觉效果。对于图片、视频、卡片等元素，保持正确的宽高比可以避免变形，提升用户体验。'
                }
              },
              {
                '@type': 'Question',
                name: 'aspect-ratio 属性的浏览器兼容性如何？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'aspect-ratio 属性在现代浏览器中得到广泛支持，包括 Chrome、Firefox、Safari 和 Edge 的最新版本。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const inputWidth = ref(1920)
const inputHeight = ref(1080)
const ratioWidth = ref(16)
const ratioHeight = ref(9)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Ratio, Image, Palette, Layout, Ruler, Type
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'aspect-ratio-calculator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'em-breakpoint-generator'),
    tools.find(t => t.id === 'color-blindness-simulator'),
    tools.find(t => t.id === 'image-compressor'),
    tools.find(t => t.id === 'palette-generator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const previewWidth = computed(() => inputWidth.value || 300)
const previewHeight = computed(() => inputHeight.value || (300 * ratioHeight.value / ratioWidth.value))

function calculateHeight() {
  inputHeight.value = Math.round(inputWidth.value * ratioHeight.value / ratioWidth.value)
}

function calculateWidth() {
  inputWidth.value = Math.round(inputHeight.value * ratioWidth.value / ratioHeight.value)
}

function updateRatio() {
  // 手动更新比例
}

function setRatio(w, h) {
  ratioWidth.value = w
  ratioHeight.value = h
  calculateHeight()
}

function copyCSS() {
  const css = `.element {
  aspect-ratio: ${ratioWidth.value} / ${ratioHeight.value};
  width: 100%;
}`
  navigator.clipboard.writeText(css)
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
