<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">EM断点生成器 - px转em响应式断点生成工具</h1>
      <p class="text-muted-foreground">一款免费的在线 EM Breakpoint Generator。支持像素值转em单位、媒体查询代码自动生成。帮助开发者创建更精准的响应式布局。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">设置</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">基准字号 (px)</label>
            <input v-model.number="baseFontSize" type="number" min="12" max="20" class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
            <p class="text-xs text-muted-foreground mt-1">通常浏览器默认为 16px</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">断点 (px)</label>
            <textarea v-model="breakpointsInput" rows="6" class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none" placeholder="每行一个像素值"></textarea>
            <p class="text-xs text-muted-foreground mt-1">每行输入一个像素值，如：320、576、768</p>
          </div>
          <div class="flex gap-2">
            <button @click="loadDefaults" class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded text-foreground transition-colors text-sm">
              加载默认断点
            </button>
            <button @click="clearAll" class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded text-foreground transition-colors text-sm">
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">转换结果</label>
          <button
            @click="copyAllResults"
            class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
          >
            复制全部
          </button>
        </div>
        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-2 max-h-[400px] overflow-y-auto">
            <div v-for="(bp, index) in convertedBreakpoints" :key="index" class="flex justify-between items-center p-3 bg-muted rounded">
              <div class="flex items-center gap-3">
                <span class="text-xs text-muted-foreground font-mono">bp{{ index + 1 }}</span>
                <span class="font-mono text-foreground">{{ bp.px }}px</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-muted-foreground">→</span>
                <span class="font-mono text-foreground font-semibold">{{ bp.em }}em</span>
              </div>
            </div>
            <div v-if="convertedBreakpoints.length === 0" class="text-center text-muted-foreground py-8">
              请输入像素值开始转换
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 媒体查询代码输出 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-foreground">媒体查询代码</label>
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
      <div class="bg-muted rounded-lg p-4 overflow-x-auto">
        <pre class="text-sm font-mono text-foreground whitespace-pre-wrap">{{ mediaQueryCSS }}</pre>
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
          什么是 EM 单位？
        </h2>
        <p class="text-muted-foreground mb-4">
          EM 是 CSS 中的相对单位，它相对于当前元素的字体大小。
          如果当前元素的字体大小是 16px，那么 1em 就等于 16px，2em 等于 32px。
          EM 单位的主要优势在于它能够随着字体大小的变化而自动调整，这使得它在响应式设计中非常有用。
        </p>
        <p class="text-muted-foreground">
          在媒体查询中使用 EM 单位而不是像素单位是一个最佳实践，
          因为当用户在浏览器中调整默认字体大小时，基于 EM 的断点会相应缩放，
          而基于像素的断点则保持不变。这确保了网页在不同用户设置下都能正常显示。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          为什么使用 EM 作为断点单位？
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>可访问性</strong>：当用户调整浏览器默认字体大小时，EM 断点会相应缩放，确保布局适应</li>
          <li><strong>一致性</strong>：EM 单位与字体大小相关，提供了更一致的设计系统</li>
          <li><strong>灵活性</strong>：更容易实现真正的响应式设计，适应不同设备和用户偏好</li>
          <li><strong>最佳实践</strong>：这是现代响应式设计的推荐方法，被许多大型网站采用</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用断点参考
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>/* 移动设备优先 */
320px  → 20em   /* 小型手机 */
375px  → 23.44em /* 常见手机 */
576px  → 36em   /* 横屏手机 */
768px  → 48em   /* 平板设备 */
992px  → 62em   /* 桌面显示器 */
1200px → 75em   /* 大屏幕 */
1400px → 87.5em /* 超大屏幕 */</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>设置基准字号（通常为浏览器默认的 16px）</li>
          <li>在文本框中输入像素值断点，每行一个</li>
          <li>工具会自动计算对应的 EM 值</li>
          <li>复制生成的媒体查询代码到您的 CSS 文件中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          响应式设计最佳实践
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>/* 移动优先策略 */
@media (min-width: 36em) {
  /* 平板及以上 */
  .container { max-width: 720px; }
}

@media (min-width: 48em) {
  /* 桌面及以上 */
  .container { max-width: 960px; }
}

@media (min-width: 62em) {
  /* 大屏幕 */
  .container { max-width: 1140px; }
}

/* 或使用桌面优先 */
@media (max-width: 75em) {
  /* 小于大屏幕 */
  .container { padding: 0 1rem; }
}</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">EM 和 REM 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              EM 相对于当前元素的字体大小，可能会产生累积效应；
              REM 相对于根元素（html）的字体大小，更加可控和可预测。
              在媒体查询中，通常推荐使用 EM 单位。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择断点值？</h3>
            <p class="text-muted-foreground mt-1">
              断点应该基于内容而非设备。先在移动设备上设计，然后逐步增加屏幕宽度，
              在布局看起来需要调整的地方添加断点。常用参考值包括 320px（小型手机）、
              768px（平板）、1024px（桌面）等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">应该使用 min-width 还是 max-width？</h3>
            <p class="text-muted-foreground mt-1">
              现代响应式设计推荐使用"移动优先"策略，即使用 min-width 媒体查询。
              这种方法从移动设备开始设计，然后为更大的屏幕添加增强功能。
              它的代码更简洁，性能也更好。如果您需要支持旧的桌面网站，
              可以使用 max-width 进行"桌面优先"的设计。
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
import { HelpCircle, ChevronUp, Ruler, Monitor, Smartphone, Tablet, Layout } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'EM断点生成器 - px转em响应式断点生成工具 | Util工具箱',
  description: '免费在线EM断点生成工具，支持像素值转em单位、媒体查询代码自动生成。帮助开发者创建更精准的响应式布局，支持移动优先策略。',
  keywords: 'em断点生成器,px转em,响应式断点,媒体查询,breakpoint,响应式设计,CSS媒体查询',
  author: 'Util工具箱',
  ogTitle: 'EM断点生成器 - 免费在线px转em工具',
  ogDescription: '专业的EM断点生成工具，支持像素值转em单位、媒体查询代码自动生成。帮助您创建更精准的响应式布局。',
  ogImage: 'https://www.util.cn/images/tools/em-breakpoint-generator.png',
  ogUrl: 'https://www.util.cn/tools/em-breakpoint-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'EM断点生成器 - 免费在线px转em',
  twitterDescription: '专业的EM断点生成工具，支持像素值转em单位、媒体查询代码自动生成。',
  twitterImage: 'https://www.util.cn/images/tools/em-breakpoint-generator.png'
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
            name: 'EM断点生成器',
            description: '免费在线EM断点生成工具，支持px转em和媒体查询代码生成',
            url: 'https://www.util.cn/tools/em-breakpoint-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '像素值转em单位',
              '媒体查询代码生成',
              '常用断点预设',
              '移动优先策略',
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
                name: 'EM断点生成器',
                item: 'https://www.util.cn/tools/em-breakpoint-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'EM 和 REM 有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'EM 相对于当前元素的字体大小，可能会产生累积效应；REM 相对于根元素的字体大小，更加可控和可预测。在媒体查询中，通常推荐使用 EM 单位。'
                }
              },
              {
                '@type': 'Question',
                name: '如何选择断点值？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '断点应该基于内容而非设备。先在移动设备上设计，然后逐步增加屏幕宽度，在布局看起来需要调整的地方添加断点。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const baseFontSize = ref(16)
const breakpointsInput = ref('320\n576\n768\n992\n1200\n1400')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Ruler, Monitor, Smartphone, Tablet, Layout
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'em-breakpoint-generator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'aspect-ratio-calculator'),
    tools.find(t => t.id === 'viewport-calculator'),
    tools.find(t => t.id === 'css-unit-converter'),
    tools.find(t => t.id === 'rem-calculator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const convertedBreakpoints = computed(() => {
  return breakpointsInput.value.split('\n')
    .map(line => parseInt(line.trim()))
    .filter(px => !isNaN(px) && px > 0)
    .map(px => ({
      px,
      em: (px / baseFontSize.value).toFixed(2)
    }))
})

const mediaQueryCSS = computed(() => {
  return convertedBreakpoints.value.map((bp, i) => {
    const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    return `@media (min-width: ${bp.em}em) {
  /* ${names[i] || `bp${i + 1}`} (${bp.px}px) */
  /* 在此处添加样式 */
}`
  }).join('\n\n')
})

function loadDefaults() {
  breakpointsInput.value = '320\n375\n576\n768\n992\n1200\n1400'
}

function clearAll() {
  breakpointsInput.value = ''
}

function copyCSS() {
  navigator.clipboard.writeText(mediaQueryCSS.value)
}

function copyAllResults() {
  const text = convertedBreakpoints.value.map(bp => `${bp.px}px → ${bp.em}em`).join('\n')
  navigator.clipboard.writeText(text)
}

function downloadCSS() {
  const blob = new Blob([mediaQueryCSS.value], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'media-queries.css'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
