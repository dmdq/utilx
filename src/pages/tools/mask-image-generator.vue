<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS遮罩生成器 - mask-image可视化工具</h1>
      <p class="text-muted-foreground">一款免费的在线 CSS mask-image 生成工具。创建渐变遮罩、图片遮罩效果，支持线性、径向、锥形渐变。实时预览遮罩效果，一键复制 CSS 代码，快速实现各种视觉遮罩效果。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧设置区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">遮罩设置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">遮罩类型</label>
            <select v-model="maskType" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="linear">线性渐变</option>
              <option value="radial">径向渐变</option>
              <option value="conic">锥形渐变</option>
            </select>
          </div>

          <!-- 线性渐变设置 -->
          <div v-if="maskType === 'linear'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">角度 (deg)</label>
              <input v-model="angle" type="range" min="0" max="360" class="w-full">
              <div class="text-sm text-muted-foreground mt-1">{{ angle }}°</div>
            </div>
          </div>

          <!-- 径向渐变设置 -->
          <div v-if="maskType === 'radial'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">位置</label>
              <select v-model="radialPos" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="center">中心</option>
                <option value="top">顶部</option>
                <option value="bottom">底部</option>
                <option value="left">左侧</option>
                <option value="right">右侧</option>
              </select>
            </div>
          </div>

          <!-- 颜色停止点 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">透明度渐变</label>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-sm text-foreground w-12">不透明</span>
                <input v-model="stops.start" type="range" min="0" max="100" class="flex-1">
                <span class="text-sm text-muted-foreground w-12">{{ stops.start }}%</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-foreground w-12">透明</span>
                <input v-model="stops.end" type="range" min="0" max="100" class="flex-1">
                <span class="text-sm text-muted-foreground w-12">{{ stops.end }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>
        <div class="p-4 bg-muted rounded-lg mb-4">
          <div
            class="w-full h-48 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
            :style="{ maskImage: generatedMask, WebkitMaskImage: generatedMask }"
          >
            Mask Image
          </div>
        </div>

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
            <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>mask-image: {{ generatedMask }};
-webkit-mask-image: {{ generatedMask }};</code></pre>
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
          什么是 mask-image？
        </h2>
        <p class="text-muted-foreground mb-4">
          mask-image 是 CSS 的一个属性，用于为元素应用遮罩效果。
          遮罩是一种图像，其中完全透明的区域会使元素完全透明，半透明的区域会使元素部分透明，
          不透明的区域会使元素完全可见。
        </p>
        <p class="text-muted-foreground">
          使用 mask-image 可以创建各种视觉效果，如渐变淡出、边缘柔化、复杂形状裁剪等。
          它与 Photoshop 中的图层蒙版概念相似，但完全使用 CSS 实现。
          mask-image 特别适用于创建平滑的过渡效果和艺术化的视觉设计。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择遮罩类型（线性、径向或锥形渐变）</li>
          <li>调整渐变角度、位置等参数</li>
          <li>设置透明度渐变的起点和终点</li>
          <li>实时预览遮罩效果</li>
          <li>复制 CSS 代码到您的项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>三种渐变</strong>: 支持线性、径向、锥形渐变遮罩</li>
          <li><strong>灵活参数</strong>: 可调整角度、位置、透明度等</li>
          <li><strong>实时预览</strong>: 参数修改后立即看到效果</li>
          <li><strong>浏览器兼容</strong>: 自动生成 webkit 前缀代码</li>
          <li><strong>简单易用</strong>: 无需深入了解 CSS 即可创建遮罩</li>
          <li><strong>本地生成</strong>: 所有处理都在浏览器本地完成</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">mask-image 和 clip-path 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              mask-image 使用图像或渐变来创建遮罩效果，可以实现半透明和渐变的过渡效果；
              clip-path 使用路径来裁剪元素，只能实现完全显示或完全隐藏的效果。
              mask-image 更适合创建柔和的过渡效果，而 clip-path 更适合创建精确的形状裁剪。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">浏览器兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              mask-image 在现代浏览器中得到良好支持，但需要添加 -webkit- 前缀以支持 Safari 和旧版 Chrome。
              Firefox 和 Edge 较新版本已经支持无前缀的 mask-image。
              IE 不支持此属性，需要提供降级方案。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何使用图片作为遮罩？</h3>
            <p class="text-muted-foreground mt-1">
              可以使用 url() 函数引用图片作为遮罩：mask-image: url(mask.png);
              遮罩图片中，不透明的部分会使元素完全可见，透明的部分会使元素完全透明，
              半透明的部分会产生相应的半透明效果。建议使用 PNG 格式的图片。
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
import { HelpCircle, ChevronUp, Layers, Image, Palette } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'CSS遮罩生成器 - mask-image可视化工具 | Util工具箱',
  description: '免费在线CSS mask-image生成工具，创建渐变遮罩、图片遮罩效果。支持线性、径向、锥形渐变，实时预览遮罩效果，一键复制CSS代码。',
  keywords: 'mask-image,CSS遮罩,渐变遮罩,mask generator,在线遮罩工具,透明度渐变',
  author: 'Util工具箱',
  ogTitle: 'CSS遮罩生成器 - 免费在线mask-image可视化',
  ogDescription: '专业的CSS mask-image生成工具，创建渐变遮罩、图片遮罩效果。支持多种渐变类型，实时预览，代码一键复制。',
  ogImage: 'https://www.util.cn/images/tools/mask-image-generator.png',
  ogUrl: 'https://www.util.cn/tools/mask-image-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS遮罩生成器 - 免费在线mask-image可视化',
  twitterDescription: '专业的CSS mask-image生成工具，创建渐变遮罩、图片遮罩效果。支持多种渐变类型。',
  twitterImage: 'https://www.util.cn/images/tools/mask-image-generator.png'
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
            name: 'CSS遮罩生成器',
            description: '免费在线CSS mask-image生成工具，创建渐变遮罩效果',
            url: 'https://www.util.cn/tools/mask-image-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '三种渐变类型',
              '灵活参数设置',
              '实时预览功能',
              '浏览器兼容代码',
              '简单易用界面',
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
                name: 'CSS遮罩生成器',
                item: 'https://www.util.cn/tools/mask-image-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'mask-image和clip-path有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'mask-image使用图像或渐变来创建遮罩效果，可以实现半透明和渐变的过渡效果；clip-path使用路径来裁剪元素，只能实现完全显示或完全隐藏的效果。'
                }
              },
              {
                '@type': 'Question',
                name: '浏览器兼容性如何？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'mask-image在现代浏览器中得到良好支持，但需要添加-webkit-前缀以支持Safari和旧版Chrome。Firefox和Edge较新版本已经支持无前缀的mask-image。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const maskType = ref('linear')
const angle = ref(180)
const radialPos = ref('center')
const stops = ref({ start: 50, end: 100 })

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Layers, Image, Palette
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'blend-mode-tool'),
  tools.find(t => t.id === 'background-pattern-generator'),
  tools.find(t => t.id === 'gradient-generator'),
  tools.find(t => t.id === 'filter-generator')
].filter(Boolean)

const generatedMask = computed(() => {
  const { start, end } = stops.value
  switch (maskType.value) {
    case 'linear':
      return `linear-gradient(${angle.value}deg, black ${start}%, transparent ${end}%)`
    case 'radial':
      return `radial-gradient(circle at ${radialPos.value}, black ${start}%, transparent ${end}%)`
    case 'conic':
      return `conic-gradient(from 0deg, black 0deg, black ${start * 3.6}deg, transparent ${end * 3.6}deg)`
    default:
      return 'none'
  }
})

async function copyCSS() {
  const css = `mask-image: ${generatedMask.value};\n-webkit-mask-image: ${generatedMask.value};`
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
