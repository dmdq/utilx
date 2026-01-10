<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Favicon生成器 - 在线网站图标生成工具</h1>
      <p class="text-muted-foreground">一款免费的在线 Favicon 生成工具。上传图片即可生成各尺寸的 favicon 和图标，包括 16x16、32x32、180x180 等常用尺寸。支持实时预览和 HTML 代码导出。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <div class="bg-card border border-border rounded-xl p-6 mb-6">
        <div class="mb-6">
          <input ref="fileInput" type="file" accept="image/*" @change="handleImage" class="hidden">
          <button
            @click="$refs.fileInput?.click()"
            class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            上传图片
          </button>
        </div>

        <div v-if="previewSrc" class="grid md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-3">预览</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <img :src="previewSrc" class="w-16 h-16 rounded" alt="Favicon 16x16">
                <div>
                  <div class="font-medium text-foreground">Favicon</div>
                  <div class="text-sm text-muted-foreground">16x16</div>
                </div>
              </div>
              <div class="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <img :src="previewSrc" class="w-20 h-20 rounded" alt="Icon 32x32">
                <div>
                  <div class="font-medium text-foreground">Icon</div>
                  <div class="text-sm text-muted-foreground">32x32</div>
                </div>
              </div>
              <div class="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <img :src="previewSrc" class="w-24 h-24 rounded" alt="Apple Touch 180x180">
                <div>
                  <div class="font-medium text-foreground">Apple Touch Icon</div>
                  <div class="text-sm text-muted-foreground">180x180</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-foreground">HTML 代码</h3>
              <button
                @click="copyHTML"
                class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
              >
                复制
              </button>
            </div>
            <div class="p-4 bg-muted rounded-lg border border-border">
              <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>&lt;link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"&gt;
&lt;link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"&gt;
&lt;link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"&gt;</code></pre>
            </div>
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
          什么是 Favicon？
        </h2>
        <p class="text-muted-foreground mb-4">
          Favicon（Favorites Icon）是网站图标，显示在浏览器的地址栏、标签页和书签中。
          它是网站品牌识别的重要组成部分，能够帮助用户快速识别和记住您的网站。
          一个好的 Favicon 应该简洁、清晰，即使在小尺寸下也能清晰可辨。
        </p>
        <p class="text-muted-foreground">
          现代网站通常需要多种尺寸的 Favicon 来适应不同的设备和场景：
          16x16 用于浏览器标签页，32x32 用于任务栏，180x180 用于 iOS 设备的添加到主屏幕功能。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>点击"上传图片"按钮，选择您的网站 Logo 或图标</li>
          <li>工具会自动生成各尺寸的 Favicon 预览</li>
          <li>复制 HTML 代码并添加到您的网站 &lt;head&gt; 标签中</li>
          <li>将生成的图标文件上传到您的网站根目录</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多尺寸生成</strong>: 自动生成 16x16、32x32、180x180 等常用尺寸</li>
          <li><strong>实时预览</strong>: 上传后立即预览各个尺寸的显示效果</li>
          <li><strong>HTML 代码</strong>: 自动生成标准的 HTML 引用代码</li>
          <li><strong>本地处理</strong>: 所有处理都在浏览器本地完成，保护您的隐私</li>
          <li><strong>简单易用</strong>: 无需专业设计技能，一键生成所需图标</li>
          <li><strong>免费使用</strong>: 完全免费，无需注册，无限次使用</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Favicon 应该使用什么格式的图片？</h3>
            <p class="text-muted-foreground mt-1">
              建议使用 PNG 格式的图片，因为它支持透明背景并且在小尺寸下保持良好的清晰度。
              图片尺寸最好是正方形，建议至少 512x512 像素，这样生成的各个尺寸都能保持清晰。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">Favicon 文件应该放在哪里？</h3>
            <p class="text-muted-foreground mt-1">
              通常将 Favicon 文件放在网站的根目录下，这样浏览器会自动查找。
              例如，如果您的网站是 example.com，文件应该放在 example.com/favicon.ico。
              对于现代网站，建议将所有尺寸的图标都放在根目录或 /icons/ 文件夹中。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要多个尺寸的 Favicon？</h3>
            <p class="text-muted-foreground mt-1">
              不同的设备和场景需要不同尺寸的图标。浏览器标签页使用 16x16 或 32x32，
              高 DPI 显示器需要更大尺寸的图标，iOS 设备需要 180x180 的 Apple Touch Icon。
              提供多个尺寸可以确保您的网站图标在各种场景下都清晰可见。
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
import { HelpCircle, ChevronUp, Image, Palette, Layout, Layers } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'Favicon生成器 - 在线网站图标生成工具 | Util工具箱',
  description: '免费在线Favicon生成工具，上传图片一键生成各尺寸网站图标。支持16x16、32x32、180x180等常用尺寸，实时预览，HTML代码自动生成。纯本地处理，保护隐私。',
  keywords: 'favicon生成器,网站图标,favicon generator,图标生成,apple touch icon,网站logo生成,在线图标工具',
  author: 'Util工具箱',
  ogTitle: 'Favicon生成器 - 免费在线网站图标生成工具',
  ogDescription: '专业的Favicon生成工具，上传图片一键生成多尺寸网站图标。支持实时预览，HTML代码自动导出，纯本地处理保护隐私。',
  ogImage: 'https://www.util.cn/images/tools/favicon-generator.png',
  ogUrl: 'https://www.util.cn/tools/favicon-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Favicon生成器 - 免费在线网站图标生成',
  twitterDescription: '专业的Favicon生成工具，上传图片一键生成多尺寸网站图标。支持实时预览，纯本地处理保护隐私。',
  twitterImage: 'https://www.util.cn/images/tools/favicon-generator.png'
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
            name: 'Favicon生成器',
            description: '免费在线Favicon生成工具，生成各尺寸网站图标',
            url: 'https://www.util.cn/tools/favicon-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多尺寸图标生成',
              '实时预览功能',
              'HTML代码自动生成',
              '本地安全处理',
              '支持PNG格式',
              '简单易用界面'
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
                name: 'Favicon生成器',
                item: 'https://www.util.cn/tools/favicon-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Favicon应该使用什么格式的图片？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '建议使用PNG格式的图片，因为它支持透明背景并且在小尺寸下保持良好的清晰度。图片尺寸最好是正方形，建议至少512x512像素。'
                }
              },
              {
                '@type': 'Question',
                name: 'Favicon文件应该放在哪里？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '通常将Favicon文件放在网站的根目录下，这样浏览器会自动查找。对于现代网站，建议将所有尺寸的图标都放在根目录或/icons/文件夹中。'
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
const previewSrc = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Image, Palette, Layout, Layers
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'placeholder-image-generator'),
  tools.find(t => t.id === 'image-compressor'),
  tools.find(t => t.id === 'image-converter'),
  tools.find(t => t.id === 'color-picker')
].filter(Boolean)

function handleImage(e) {
  const input = e.target
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewSrc.value = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

async function copyHTML() {
  const htmlCode = `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
  try {
    await navigator.clipboard.writeText(htmlCode)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
