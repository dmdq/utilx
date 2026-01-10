<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">色盲模拟器 - 在线色盲视觉效果模拟工具</h1>
      <p class="text-muted-foreground">一款免费的在线 Color Blindness Simulator。模拟红色盲、绿色盲、蓝色盲等色觉缺陷的视觉效果。帮助设计师确保作品对所有用户都具有良好的可访问性。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">上传图片</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
            <input ref="fileInput" type="file" accept="image/*" @change="handleImage" class="hidden">
            <button @click="$refs.fileInput?.click()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              选择图片
            </button>
            <p class="text-sm text-muted-foreground mt-2">支持 JPG、PNG、GIF 等格式</p>
          </div>

          <div v-if="imageSrc" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">色盲类型</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="type = 'normal'"
                  :class="type === 'normal' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
                  class="px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  正常视觉
                </button>
                <button
                  @click="type = 'protanopia'"
                  :class="type === 'protanopia' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
                  class="px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  红色盲
                </button>
                <button
                  @click="type = 'deuteranopia'"
                  :class="type === 'deuteranopia' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
                  class="px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  绿色盲
                </button>
                <button
                  @click="type = 'tritanopia'"
                  :class="type === 'tritanopia' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
                  class="px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  蓝色盲
                </button>
              </div>
            </div>

            <div class="p-3 bg-muted rounded-lg">
              <p class="text-sm text-foreground font-medium mb-1">当前模式</p>
              <p class="text-xs text-muted-foreground">{{ typeLabels[type] }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">预览</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <img v-if="imageSrc" :src="imageSrc" class="max-w-full max-h-full object-contain" :style="{ filter: colorFilter }">
            <div v-else class="text-muted-foreground flex flex-col items-center gap-2">
              <Eye class="w-12 h-12 opacity-50" />
              <span>请先上传图片</span>
            </div>
          </div>
          <div class="mt-3 text-center">
            <p class="text-sm text-muted-foreground">{{ typeLabels[type] }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 色彩测试图 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">色彩测试图</h2>
      <p class="text-sm text-muted-foreground mb-4">使用标准测试色查看不同色盲类型下的视觉效果</p>
      <div class="flex justify-center gap-4 flex-wrap">
        <div v-for="color in testColors" :key="color.name" class="text-center">
          <div class="w-20 h-20 rounded-lg mb-2 border border-border" :style="{ backgroundColor: color.hex, filter: colorFilter }"></div>
          <div class="text-xs text-foreground font-medium">{{ color.name }}</div>
          <div class="text-xs text-muted-foreground">{{ color.hex }}</div>
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
          什么是色盲？
        </h2>
        <p class="text-muted-foreground mb-4">
          色盲（Color Blindness）是一种视觉缺陷，导致个体难以区分某些颜色。
          最常见的类型是红绿色盲，影响约 8% 的北欧血统男性和 0.5% 的女性。
          色盲通常由视网膜中的视锥细胞功能异常引起，这些细胞负责颜色视觉。
        </p>
        <p class="text-muted-foreground">
          对于设计师和开发者来说，了解色盲并创建对所有用户都友好的设计至关重要。
          通过使用色盲模拟器，您可以预览设计在不同类型的色觉缺陷下的显示效果，
          从而确保重要的信息传达不会依赖于颜色差异。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          色盲的主要类型
        </h2>
        <ul class="list-disc list-inside space-y-3 text-muted-foreground mb-6">
          <li><strong>红色盲（Protanopia）</strong>：无法感知红光，红色看起来像深灰色或黑色。影响约 1% 的男性。</li>
          <li><strong>绿色盲（Deuteranopia）</strong>：无法感知绿光，绿色看起来像米色。最常见的色盲类型，影响约 6% 的男性。</li>
          <li><strong>蓝色盲（Tritanopia）</strong>：无法感知蓝光，蓝色看起来像绿色，黄色看起来像紫色。非常罕见，影响约 0.01% 的人口。</li>
          <li><strong>全色盲（Monochromacy）</strong>：完全无法分辨颜色，只能看到灰度。极罕见。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何设计色盲友好的界面
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>不要仅依赖颜色传达信息</strong>：使用图标、文字说明或纹理作为补充</li>
          <li><strong>使用高对比度</strong>：确保文本和背景之间有足够的对比度（至少 4.5:1）</li>
          <li><strong>选择安全的配色方案</strong>：避免使用红绿对比，使用蓝黄或紫橙等替代方案</li>
          <li><strong>测试设计</strong>：使用色盲模拟器检查设计的可访问性</li>
          <li><strong>遵循 WCAG 指南</strong>：符合 Web 内容可访问性指南的最低标准</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          色盲友好的配色方案示例
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>/* 推荐配色方案 */
/* 方案1：蓝橙色系 */
.success { color: #2563eb; }  /* 蓝色表示成功 */
.error { color: #ea580c; }    /* 橙色表示错误 */
.warning { color: #ca8a04; }  /* 黄色表示警告 */

/* 方案2：紫绿色系 */
.positive { color: #7c3aed; } /* 紫色表示正面 */
.negative { color: #16a34a; } /* 绿色表示负面 */

/* 方案3：使用图标增强 */
.error::before { content: "❌"; }
.success::before { content: "✅"; }</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">色盲模拟器的工作原理是什么？</h3>
            <p class="text-muted-foreground mt-1">
              色盲模拟器使用 SVG 滤镜来模拟不同类型色盲的视觉效果。
              这些滤镜基于颜色科学的研究，通过调整图像的红、绿、蓝通道
              来模拟视锥细胞功能异常导致的颜色感知变化。
              虽然不能完全复制真实的色盲体验，但可以作为设计参考工具。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么色盲友好设计很重要？</h3>
            <p class="text-muted-foreground mt-1">
              全球约有 3 亿人患有某种形式的色觉缺陷。如果您的设计仅依赖颜色来传达信息，
              这部分用户可能无法正确理解或使用您的产品。
              色盲友好的设计不仅关乎可访问性，也是法律要求（如 ADA、WCAG），
              同时也能改善所有用户的体验。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何测试我的设计是否色盲友好？</h3>
            <p class="text-muted-foreground mt-1">
              除了使用色盲模拟器外，您还可以：
              1. 在设计中使用工具检查颜色对比度
              2. 确保所有交互元素有明确的非颜色标识（如图标、文字）
              3. 邀请色盲用户进行可用性测试
              4. 使用浏览器插件实时模拟色盲效果
              5. 导出灰度版本测试信息层次是否清晰
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

    <!-- SVG Filters (hidden) -->
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0"/>
        </filter>
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0"/>
        </filter>
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0"/>
        </filter>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, Eye, Palette, Contrast, Accessibility, CheckCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '色盲模拟器 - 在线色盲视觉效果模拟工具 | Util工具箱',
  description: '免费在线色盲模拟工具，模拟红色盲、绿色盲、蓝色盲等色觉缺陷的视觉效果。帮助设计师确保作品对所有用户都具有良好的可访问性。',
  keywords: '色盲模拟器,色盲,color blindness,无障碍设计,可访问性,红色盲,绿色盲,蓝色盲,视觉模拟',
  author: 'Util工具箱',
  ogTitle: '色盲模拟器 - 免费在线色盲视觉模拟',
  ogDescription: '专业的色盲模拟工具，模拟红色盲、绿色盲、蓝色盲等视觉效果。帮助您创建色盲友好的设计。',
  ogImage: 'https://www.util.cn/images/tools/color-blindness-simulator.png',
  ogUrl: 'https://www.util.cn/tools/color-blindness-simulator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '色盲模拟器 - 免费在线色盲视觉模拟',
  twitterDescription: '专业的色盲模拟工具，模拟红色盲、绿色盲、蓝色盲等视觉效果。',
  twitterImage: 'https://www.util.cn/images/tools/color-blindness-simulator.png'
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
            name: '色盲模拟器',
            description: '免费在线色盲模拟工具，支持多种色盲类型视觉模拟',
            url: 'https://www.util.cn/tools/color-blindness-simulator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '红色盲模拟',
              '绿色盲模拟',
              '蓝色盲模拟',
              '图片上传预览',
              '色彩测试图',
              '无障碍设计检查'
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
                name: '色盲模拟器',
                item: 'https://www.util.cn/tools/color-blindness-simulator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '色盲模拟器的工作原理是什么？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '色盲模拟器使用 SVG 滤镜来模拟不同类型色盲的视觉效果。这些滤镜基于颜色科学的研究，通过调整图像的红、绿、蓝通道来模拟视锥细胞功能异常导致的颜色感知变化。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么色盲友好设计很重要？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '全球约有 3 亿人患有某种形式的色觉缺陷。色盲友好的设计不仅关乎可访问性，也是法律要求，同时也能改善所有用户的体验。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const fileInput = ref(null)
const imageSrc = ref('')
const type = ref('normal')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Eye, Palette, Contrast, Accessibility, CheckCircle
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'color-blindness-simulator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'contrast-checker'),
    tools.find(t => t.id === 'palette-generator'),
    tools.find(t => t.id === 'color-converter'),
    tools.find(t => t.id === 'accessibility-checker')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const typeLabels = {
  normal: '正常视觉 (Normal Vision)',
  protanopia: '红色盲 (Protanopia) - 红色感知缺失',
  deuteranopia: '绿色盲 (Deuteranopia) - 绿色感知缺失',
  tritanopia: '蓝色盲 (Tritanopia) - 蓝色感知缺失'
}

const testColors = [
  { name: '红', hex: '#EF4444' },
  { name: '绿', hex: '#10B981' },
  { name: '蓝', hex: '#3B82F6' },
  { name: '黄', hex: '#F59E0B' },
  { name: '紫', hex: '#8B5CF6' }
]

const colorFilter = computed(() => {
  switch (type.value) {
    case 'protanopia':
      return 'url(#protanopia)'
    case 'deuteranopia':
      return 'url(#deuteranopia)'
    case 'tritanopia':
      return 'url(#tritanopia)'
    default:
      return 'none'
  }
})

function handleImage(e) {
  const input = e.target
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageSrc.value = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>