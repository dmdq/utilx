<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">SVG图标库 - 常用SVG图标在线预览工具</h1>
      <p class="text-muted-foreground">一款免费的在线 SVG Icon Library。提供常用SVG图标预览、搜索、复制和下载。支持导出SVG代码，帮助开发者快速获取所需图标资源。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="mb-4">
        <div class="flex items-center gap-2">
          <Search class="w-4 h-4 text-muted-foreground" />
          <input v-model="searchQuery" type="text" placeholder="搜索图标..." class="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
        </div>
      </div>

      <div class="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
        <div
          v-for="icon in filteredIcons"
          :key="icon.name"
          @click="selectIcon(icon)"
          class="aspect-square p-2 border border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent transition flex items-center justify-center group"
          :title="icon.name"
        >
          <div v-html="icon.svg" class="w-8 h-8 text-foreground group-hover:text-primary transition-colors"></div>
        </div>
      </div>

      <!-- 选中图标详情 -->
      <div v-if="selectedIcon" class="mt-6 p-4 bg-muted rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-foreground text-lg">{{ selectedIcon.name }}</h3>
          <button @click="selectedIcon = null" class="text-muted-foreground hover:text-foreground transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="bg-card rounded-lg p-4 mb-3 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground whitespace-pre-wrap">{{ selectedIcon.svg }}</pre>
        </div>
        <div class="flex gap-2">
          <button @click="copySVG" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Copy class="w-4 h-4" />
            复制SVG
          </button>
          <button @click="downloadSVG" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Download class="w-4 h-4" />
            下载
          </button>
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
          什么是 SVG 图标？
        </h2>
        <p class="text-muted-foreground mb-4">
          SVG（Scalable Vector Graphics）是一种基于 XML 的矢量图形格式。
          与位图图像（如 JPG、PNG）不同，SVG 图标是使用数学公式描述的路径，
          可以无限缩放而不会损失质量。这使得 SVG 成为现代 Web 设计中图标的首选格式。
        </p>
        <p class="text-muted-foreground">
          使用 SVG 图标的优势包括：
          1. 任意尺寸下都保持清晰锐利
          2. 文件体积通常比 PNG 更小
          3. 可以使用 CSS 控制颜色、大小、动画等
          4. 支持所有现代浏览器
          5. 可以内联在 HTML 中，减少 HTTP 请求
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何在项目中使用 SVG 图标
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>&lt;!-- 方法1: 内联SVG --&gt;
&lt;svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"&gt;
  &lt;path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"&gt;&lt;/path&gt;
&lt;/svg&gt;

&lt;!-- 方法2: 作为背景图 --&gt;
.icon {
  background-image: url('icon.svg');
  background-size: contain;
  background-repeat: no-repeat;
}

&lt;!-- 方法3: 使用 img 标签 --&gt;
&lt;img src="icon.svg" alt="图标" /&gt;</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          SVG 图标最佳实践
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>优化 SVG 文件</strong>：移除不必要的元数据、注释和空白，减小文件大小</li>
          <li><strong>使用语义化命名</strong>：为图标和文件使用清晰的名称</li>
          <li><strong>添加 title 和 desc</strong>：提高可访问性，帮助屏幕阅读器用户</li>
          <li><strong>使用 aria-label</strong>：为纯装饰性图标添加 aria-hidden="true"</li>
          <li><strong>考虑使用图标库</strong>：如 Lucide、Heroicons、Feather Icons 等</li>
          <li><strong>保持一致性</strong>：在项目中统一图标的线条粗细和风格</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用图标库推荐
        </h2>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-2">Lucide Icons</h3>
            <p class="text-sm text-muted-foreground">轻量级、一致性的图标库，源自 Feather Icons</p>
          </div>
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-2">Heroicons</h3>
            <p class="text-sm text-muted-foreground">由 Tailwind CSS 团队制作的精美图标集</p>
          </div>
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-2">Feather Icons</h3>
            <p class="text-sm text-muted-foreground">简洁的开源图标集，易于定制</p>
          </div>
          <div class="bg-muted rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-2">Tabler Icons</h3>
            <p class="text-sm text-muted-foreground">超过 4000 个免费的开源图标</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">SVG 图标适合所有场景吗？</h3>
            <p class="text-muted-foreground mt-1">
              SVG 非常适合图标、logo、插画等简单图形。
              但对于复杂照片或高度细节的图像，位图格式（如 WebP、AVIF）可能更合适。
              选择合适的格式取决于您的具体需求和使用场景。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何优化 SVG 文件大小？</h3>
            <p class="text-muted-foreground mt-1">
              可以使用 SVGO 或其他 SVG 优化工具来减小文件大小。
              主要方法包括：移除不必要的元数据、简化路径、合并相似的形状、
              删除隐藏元素、移除注释等。许多构建工具（如 Vite、Webpack）都有 SVG 优化插件。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">SVG 图标的浏览器兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              SVG 支持所有现代浏览器，包括 Chrome、Firefox、Safari、Edge 等。
              对于 IE 等旧浏览器，建议提供降级方案或使用 polyfill。
              绝大多数情况下，您可以直接使用 SVG 而无需担心兼容性问题。
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
import { HelpCircle, ChevronUp, Search, Copy, Download, X, FileImage } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'SVG图标库 - 常用SVG图标在线预览工具 | Util工具箱',
  description: '免费在线SVG图标库，提供常用SVG图标预览、搜索、复制和下载。支持导出SVG代码，帮助开发者快速获取所需图标资源。',
  keywords: 'SVG图标库,SVG icon,图标库,SVG预览,图标下载,SVG代码,图标资源,免费图标',
  author: 'Util工具箱',
  ogTitle: 'SVG图标库 - 免费在线SVG图标预览',
  ogDescription: '专业的SVG图标库，提供常用SVG图标预览、搜索、复制和下载功能。',
  ogImage: 'https://www.util.cn/images/tools/svg-icon-library.png',
  ogUrl: 'https://www.util.cn/tools/svg-icon-library',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'SVG图标库 - 免费在线SVG图标预览',
  twitterDescription: '专业的SVG图标库，提供常用SVG图标预览、搜索、复制和下载功能。',
  twitterImage: 'https://www.util.cn/images/tools/svg-icon-library.png'
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
            name: 'SVG图标库',
            description: '免费在线SVG图标库，提供常用图标预览和下载',
            url: 'https://www.util.cn/tools/svg-icon-library',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'SVG图标预览',
              '图标搜索',
              'SVG代码复制',
              '图标下载',
              '常用图标集',
              '在线预览'
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
                name: 'SVG图标库',
                item: 'https://www.util.cn/tools/svg-icon-library'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'SVG 图标适合所有场景吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'SVG 非常适合图标、logo、插画等简单图形。但对于复杂照片或高度细节的图像，位图格式可能更合适。'
                }
              },
              {
                '@type': 'Question',
                name: '如何优化 SVG 文件大小？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '可以使用 SVGO 或其他 SVG 优化工具来减小文件大小。主要方法包括：移除不必要的元数据、简化路径、合并相似的形状等。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const searchQuery = ref('')
const selectedIcon = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Search, Copy, Download, X, FileImage
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'svg-icon-library'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'icon-font-generator'),
    tools.find(t => t.id === 'favicon-generator'),
    tools.find(t => t.id === 'image-compressor'),
    tools.find(t => t.id === 'svg-optimizer')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const icons = [
  { name: 'home', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
  { name: 'user', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' },
  { name: 'settings', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243M9.879 9.879l-4.243 4.243m12.728 0l-4.243 4.243M9.879 14.121l-4.243-4.243"></path></svg>' },
  { name: 'search', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' },
  { name: 'heart', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' },
  { name: 'star', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' },
  { name: 'check', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' },
  { name: 'close', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' },
  { name: 'plus', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' },
  { name: 'minus', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>' },
  { name: 'edit', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' },
  { name: 'trash', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' },
  { name: 'download', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' },
  { name: 'upload', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' },
  { name: 'mail', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' },
  { name: 'phone', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' },
  { name: 'link', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' },
  { name: 'calendar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' },
  { name: 'clock', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' },
  { name: 'camera', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>' },
  { name: 'map', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>' },
  { name: 'tag', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>' },
  { name: 'folder', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' },
  { name: 'file', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>' },
  { name: 'lock', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' },
  { name: 'shield', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' }
]

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons
  const query = searchQuery.value.toLowerCase()
  return icons.filter(icon => icon.name.includes(query))
})

function selectIcon(icon) {
  selectedIcon.value = icon
}

async function copySVG() {
  if (!selectedIcon.value) return
  try {
    await navigator.clipboard.writeText(selectedIcon.value.svg)
    alert('已复制SVG代码')
  } catch {}
}

function downloadSVG() {
  if (!selectedIcon.value) return
  const blob = new Blob([selectedIcon.value.svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedIcon.value.name}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
