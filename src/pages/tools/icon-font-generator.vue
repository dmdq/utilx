<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">图标字体生成器 - SVG转Web字体工具</h1>
      <p class="text-muted-foreground">一款免费的在线 Icon Font Generator。将SVG图标转换为Web字体使用，支持图标优化、字体生成、CSS代码导出。帮助开发者创建自定义图标字体库。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">添加SVG图标</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
            <input ref="fileInput" type="file" accept=".svg" multiple @change="handleFiles" @dragover.prevent @drop.prevent="handleDrop" class="hidden">
            <button @click="$refs.fileInput?.click()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              选择SVG文件
            </button>
            <p class="text-sm text-muted-foreground mt-2">或拖拽SVG文件到此处</p>
          </div>

          <div v-if="svgFiles.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-foreground">已添加的图标 ({{ svgFiles.length }})</h3>
              <button @click="clearAll" class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors">
                清空全部
              </button>
            </div>
            <div class="max-h-[300px] overflow-y-auto space-y-2">
              <div v-for="(file, index) in svgFiles" :key="index" class="flex items-center justify-between p-3 bg-muted rounded">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-card rounded flex items-center justify-center text-primary">
                    <FileIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-foreground">{{ getIconName(file.name) }}</p>
                    <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
                  </div>
                </div>
                <button @click="removeFile(index)" class="text-destructive hover:bg-destructive/10 rounded p-2 transition-colors">
                  <X class="w-4 h-4" />
                </button>
              </div>
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
          <div v-if="svgFiles.length > 0" class="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
            <div v-for="(file, index) in svgFiles" :key="index" class="text-center">
              <div class="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                <img :src="getFilePreview(file)" class="w-8 h-8 object-contain" alt="">
              </div>
              <p class="text-xs text-foreground truncate">{{ getIconName(file.name) }}</p>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileIcon class="w-16 h-16 opacity-50 mb-4" />
            <p>请先添加SVG图标</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CSS代码输出 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-foreground">生成的CSS代码</label>
        <div class="flex gap-2">
          <button
            @click="copyCSS"
            class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
          >
            复制CSS
          </button>
          <button
            @click="downloadCSS"
            class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
          >
            下载文件
          </button>
        </div>
      </div>
      <p class="text-sm text-muted-foreground mb-3">将以下CSS添加到您的样式表中，并使用生成的字体文件</p>
      <div class="bg-muted rounded-lg p-4 overflow-x-auto">
        <pre class="text-sm font-mono text-foreground whitespace-pre-wrap">{{ generatedCSS }}</pre>
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
          什么是图标字体？
        </h2>
        <p class="text-muted-foreground mb-4">
          图标字体（Icon Font）是一种将图标打包成字体文件的技术，可以通过 CSS 的 font-family 属性来使用图标。
          与图片相比，图标字体具有体积小、可缩放、可使用 CSS 控制颜色和大小等优势。
          常见的图标字体库包括 Font Awesome、Material Icons 等。
        </p>
        <p class="text-muted-foreground">
          使用自定义图标字体，您可以：
          1. 减少HTTP请求数量，提高页面加载速度
          2. 使用CSS轻松控制图标颜色、大小、阴影等
          3. 保持图标在任何尺寸下都清晰锐利
          4. 方便地添加动画效果和交互状态
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          SVG转字体的工作原理
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>准备SVG图标</strong>：确保每个SVG文件是单一图标，路径清晰</li>
          <li><strong>优化SVG</strong>：移除不必要的元数据和注释，减小文件大小</li>
          <li><strong>转换为字体</strong>：使用工具（如本工具）将SVG打包成WOFF/WOFF2/EOT/TTF格式</li>
          <li><strong>生成CSS</strong>：创建字体声明和图标类的CSS代码</li>
          <li><strong>集成使用</strong>：在项目中引用字体和CSS，使用图标类</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>准备您的SVG图标文件（建议使用单色图标）</li>
          <li>点击"选择SVG文件"或拖拽文件到上传区域</li>
          <li>查看生成的预览和CSS代码</li>
          <li>复制CSS代码并使用字体生成工具（如svgtofont）生成字体文件</li>
          <li>在项目中引用字体文件和CSS样式</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用示例
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>&lt;!-- HTML中使用 --&gt;
&lt;i class="icon icon-home"&gt;&lt;/i&gt;
&lt;i class="icon icon-user"&gt;&lt;/i&gt;

&lt;!-- CSS样式 --&gt;
.icon {
  display: inline-block;
  font-family: 'icon-font';
  font-size: 24px;
  color: #333;
}

/* 悬停效果 */
.icon:hover {
  color: #007bff;
  transform: scale(1.1);
}</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          图标字体 vs SVG Sprite
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-2 text-foreground">特性</th>
                <th class="text-left py-2 text-foreground">图标字体</th>
                <th class="text-left py-2 text-foreground">SVG Sprite</th>
              </tr>
            </thead>
            <tbody class="text-muted-foreground">
              <tr class="border-b border-border/50">
                <td class="py-2">浏览器支持</td>
                <td class="py-2">需要支持@font-face</td>
                <td class="py-2">所有现代浏览器</td>
              </tr>
              <tr class="border-b border-border/50">
                <td class="py-2">CSS控制</td>
                <td class="py-2">颜色、大小、阴影</td>
                <td class="py-2">fill、stroke</td>
              </tr>
              <tr class="border-b border-border/50">
                <td class="py-2">性能</td>
                <td class="py-2">一次加载，缓存友好</td>
                <td class="py-2">按需加载</td>
              </tr>
              <tr>
                <td class="py-2">最佳场景</td>
                <td class="py-2">单色图标库</td>
                <td class="py-2">彩色、复杂图标</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的字体文件在哪里？</h3>
            <p class="text-muted-foreground mt-1">
              本工具生成CSS代码和图标映射，您需要使用专门的字体生成工具（如svgtofont、iconfont-cli、FontForge）
              将SVG文件转换为实际的字体文件（WOFF2、WOFF、TTF等格式）。
              这些工具可以处理SVG路径到字形轮廓的转换。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么有些图标显示不正确？</h3>
            <p class="text-muted-foreground mt-1">
              可能的原因：1) SVG文件包含多个路径或复杂的组合；
              2) SVG使用了描边而非填充；3) 图标尺寸不一致。
              建议使用简洁的单色SVG图标，确保每个图标都是独立的闭合路径。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">图标字体的兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              图标字体技术已经非常成熟，支持所有现代浏览器。
              对于IE等旧浏览器，建议提供EOT格式作为降级方案。
              WOFF2格式提供最佳的压缩率，WOFF作为后备选项。
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
import { HelpCircle, ChevronUp, FileIcon, X, Download, FileType } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '图标字体生成器 - SVG转Web字体工具 | Util工具箱',
  description: '免费在线图标字体生成工具，将SVG图标转换为Web字体使用，支持图标优化、字体生成、CSS代码导出。帮助开发者创建自定义图标字体库。',
  keywords: '图标字体生成器,SVG转字体,icon font,webfont,字体图标,图标库,SVG转换,图标优化',
  author: 'Util工具箱',
  ogTitle: '图标字体生成器 - 免费在线SVG转字体',
  ogDescription: '专业的图标字体生成工具，将SVG图标转换为Web字体使用，支持CSS代码导出。',
  ogImage: 'https://www.util.cn/images/tools/icon-font-generator.png',
  ogUrl: 'https://www.util.cn/tools/icon-font-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '图标字体生成器 - 免费在线SVG转字体',
  twitterDescription: '专业的图标字体生成工具，将SVG图标转换为Web字体使用。',
  twitterImage: 'https://www.util.cn/images/tools/icon-font-generator.png'
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
            name: '图标字体生成器',
            description: '免费在线图标字体生成工具，支持SVG转Web字体',
            url: 'https://www.util.cn/tools/icon-font-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'SVG图标上传',
              '图标预览',
              'CSS代码生成',
              '字体映射生成',
              '批量处理',
              '文件拖拽支持'
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
                name: '图标字体生成器',
                item: 'https://www.util.cn/tools/icon-font-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '生成的字体文件在哪里？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具生成CSS代码和图标映射，您需要使用专门的字体生成工具（如svgtofont、iconfont-cli、FontForge）将SVG文件转换为实际的字体文件。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么有些图标显示不正确？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '可能的原因：1) SVG文件包含多个路径或复杂的组合；2) SVG使用了描边而非填充；3) 图标尺寸不一致。建议使用简洁的单色SVG图标。'
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
const svgFiles = ref([])

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileIcon, Download, FileType, X
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'icon-font-generator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'svg-icon-library'),
    tools.find(t => t.id === 'image-compressor'),
    tools.find(t => t.id === 'svg-optimizer'),
    tools.find(t => t.id === 'favicon-generator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const generatedCSS = computed(() => {
  if (svgFiles.value.length === 0) {
    return `/* 请先添加SVG图标 */
/* 本工具生成CSS代码，您还需要使用字体生成工具创建字体文件 */`
  }

  return `@font-face {
  font-family: 'icon-font';
  src: url('icon-font.woff2') format('woff2'),
       url('icon-font.woff') format('woff'),
       url('icon-font.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.icon {
  display: inline-block;
  font-family: 'icon-font' !important;
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 图标类 */
${svgFiles.value.map((file, index) => {
  const name = getIconName(file.name)
  const codePoint = (0xEA01 + index).toString(16).toUpperCase()
  return `.icon-${name}:before { content: '\\${codePoint}'; }`
}).join('\n')}
`
})

function getIconName(filename) {
  return filename.replace('.svg', '').replace(/[^a-z0-9]/gi, '-').toLowerCase()
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFilePreview(file) {
  return URL.createObjectURL(file)
}

function handleFiles(e) {
  const input = e.target
  const files = Array.from(input.files || []).filter(f => f.name.endsWith('.svg'))
  svgFiles.value.push(...files)
}

function handleDrop(e) {
  const files = Array.from(e.dataTransfer.files || []).filter(f => f.name.endsWith('.svg'))
  svgFiles.value.push(...files)
}

function removeFile(index) {
  svgFiles.value.splice(index, 1)
}

function clearAll() {
  svgFiles.value = []
}

function copyCSS() {
  navigator.clipboard.writeText(generatedCSS.value)
}

function downloadCSS() {
  const blob = new Blob([generatedCSS.value], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'icon-font.css'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
