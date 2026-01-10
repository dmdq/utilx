<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">占位图生成器 - 在线占位图片制作工具</h1>
      <p class="text-muted-foreground">一款免费的在线占位图生成工具。自定义尺寸、颜色和文字，一键生成占位图片。支持实时预览和 HTML 代码导出，适用于网站原型设计和开发测试。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">宽度 (px)</label>
            <input v-model="width" type="number" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="300">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">高度 (px)</label>
            <input v-model="height" type="number" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="200">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">背景色</label>
            <input v-model="bgColor" type="color" class="w-full h-10 rounded-lg cursor-pointer border border-border">
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-2">文字内容</label>
          <input v-model="text" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="可选文字，留空显示尺寸">
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-2">文字颜色</label>
          <input v-model="textColor" type="color" class="w-full h-10 rounded-lg cursor-pointer border border-border">
        </div>

        <div class="flex justify-center mb-6">
          <div
            class="flex items-center justify-center border-2 border-dashed border-border rounded-lg"
            :style="{ width: Math.min(width, 800) + 'px', height: Math.min(height, 600) + 'px', background: bgColor, maxWidth: '100%' }"
          >
            <span class="font-bold text-lg" :style="{ color: textColor, fontSize: Math.min(width, height) / 10 + 'px' }">{{ text || `${width} x ${height}` }}</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-foreground">HTML 代码</h3>
            <button
              @click="copyHTML"
              class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
            >
              复制
            </button>
          </div>
          <div class="p-4 bg-muted rounded-lg border border-border">
            <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>&lt;img src="https://via.placeholder.com/{{ width }}x{{ height }}" alt="Placeholder"&gt;</code></pre>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-foreground">CSS 代码</h3>
            <button
              @click="copyCSS"
              class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
            >
              复制
            </button>
          </div>
          <div class="p-4 bg-muted rounded-lg border border-border">
            <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>.placeholder {
  width: {{ width }}px;
  height: {{ height }}px;
  background-color: {{ bgColor }};
  display: flex;
  align-items: center;
  justify-content: center;
}</code></pre>
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
          什么是占位图？
        </h2>
        <p class="text-muted-foreground mb-4">
          占位图（Placeholder Image）是在网站开发和设计过程中使用的临时图片。
          它们通常用于原型设计、布局测试和开发阶段，帮助开发者和设计师在没有实际图片内容的情况下，
          预览页面的布局和视觉效果。
        </p>
        <p class="text-muted-foreground">
          占位图可以显示图片的尺寸信息，帮助团队了解应该准备什么尺寸的图片。
          本工具支持自定义尺寸、颜色和文字，满足各种项目需求。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入所需的图片宽度和高度（单位：像素）</li>
          <li>选择背景颜色和文字颜色</li>
          <li>（可选）输入自定义文字内容</li>
          <li>实时预览生成的占位图效果</li>
          <li>复制 HTML 或 CSS 代码到您的项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>自定义尺寸</strong>: 支持任意宽度和高度的设置</li>
          <li><strong>颜色选择</strong>: 自定义背景色和文字颜色</li>
          <li><strong>文字自定义</strong>: 支持添加自定义文字或显示尺寸信息</li>
          <li><strong>实时预览</strong>: 参数修改后立即看到效果</li>
          <li><strong>代码导出</strong>: 一键复制 HTML 和 CSS 代码</li>
          <li><strong>本地生成</strong>: 所有处理都在浏览器本地完成</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">占位图主要用于什么场景？</h3>
            <p class="text-muted-foreground mt-1">
              占位图主要用于网站原型设计、开发测试、布局预览等场景。
              设计师使用占位图来展示页面布局，开发者使用占位图来测试响应式设计，
              产品经理使用占位图来演示产品原型。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的占位图尺寸？</h3>
            <p class="text-muted-foreground mt-1">
              占位图尺寸应该根据实际使用场景来确定。例如，文章缩略图常用 800x600 或 400x300，
              头像常用 200x200，Banner 常用 1920x500。建议先确定最终的图片尺寸，然后使用相同的尺寸创建占位图。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的占位图可以直接在项目中使用吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具主要用于快速生成占位图预览和代码。对于开发测试，您可以直接使用生成的代码引用在线占位图服务。
              对于生产环境，建议将占位图保存为本地图片文件，以确保加载速度和稳定性。
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
import { HelpCircle, ChevronUp, Image, ImageIcon, Layout } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '占位图生成器 - 在线占位图片制作工具 | Util工具箱',
  description: '免费在线占位图生成工具，自定义尺寸、颜色和文字，一键生成占位图片。支持实时预览和HTML代码导出，适用于网站原型设计和开发测试。',
  keywords: '占位图生成器,placeholder image,占位图片,图片占位,原型设计占位图,在线占位图工具',
  author: 'Util工具箱',
  ogTitle: '占位图生成器 - 免费在线占位图片制作',
  ogDescription: '专业的占位图生成工具，自定义尺寸颜色文字，一键生成占位图片。支持实时预览和代码导出。',
  ogImage: 'https://www.util.cn/images/tools/placeholder-image-generator.png',
  ogUrl: 'https://www.util.cn/tools/placeholder-image-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '占位图生成器 - 免费在线占位图片制作',
  twitterDescription: '专业的占位图生成工具，自定义尺寸颜色文字，一键生成占位图片。',
  twitterImage: 'https://www.util.cn/images/tools/placeholder-image-generator.png'
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
            name: '占位图生成器',
            description: '免费在线占位图生成工具，自定义尺寸颜色和文字',
            url: 'https://www.util.cn/tools/placeholder-image-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '自定义尺寸设置',
              '颜色自定义',
              '文字内容设置',
              '实时预览功能',
              'HTML代码导出',
              'CSS代码导出'
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
                name: '占位图生成器',
                item: 'https://www.util.cn/tools/placeholder-image-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '占位图主要用于什么场景？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '占位图主要用于网站原型设计、开发测试、布局预览等场景。设计师使用占位图来展示页面布局，开发者使用占位图来测试响应式设计。'
                }
              },
              {
                '@type': 'Question',
                name: '如何选择合适的占位图尺寸？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '占位图尺寸应该根据实际使用场景来确定。例如，文章缩略图常用800x600或400x300，头像常用200x200，Banner常用1920x500。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const width = ref(300)
const height = ref(200)
const bgColor = ref('#6366F1')
const textColor = ref('#ffffff')
const text = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Image, ImageIcon, Layout
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'favicon-generator'),
  tools.find(t => t.id === 'image-compressor'),
  tools.find(t => t.id === 'image-converter'),
  tools.find(t => t.id === 'color-picker')
].filter(Boolean)

async function copyHTML() {
  const htmlCode = `<img src="https://via.placeholder.com/${width.value}x${height.value}" alt="Placeholder">`
  try {
    await navigator.clipboard.writeText(htmlCode)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

async function copyCSS() {
  const cssCode = `.placeholder {
  width: ${width.value}px;
  height: ${height.value}px;
  background-color: ${bgColor.value};
  display: flex;
  align-items: center;
  justify-content: center;
}`
  try {
    await navigator.clipboard.writeText(cssCode)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
