<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS计数器生成器 - 在线自动编号样式工具</h1>
      <p class="text-muted-foreground">一款免费的在线 CSS 计数器生成工具。创建自定义的自动编号样式，支持多种编号格式、前缀后缀设置。实时预览效果，一键复制 CSS 代码，适用于文档列表、章节编号等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧设置区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">计数器设置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">计数器名称</label>
            <input v-model="counterName" type="text" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="my-counter">
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">起始值</label>
            <input v-model="startValue" type="number" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">增量</label>
            <input v-model="increment" type="number" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">编号样式</label>
            <select v-model="listStyle" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="decimal">数字 (1, 2, 3...)</option>
              <option value="decimal-leading-zero">带零数字 (01, 02...)</option>
              <option value="lower-alpha">小写字母 (a, b, c...)</option>
              <option value="upper-alpha">大写字母 (A, B, C...)</option>
              <option value="lower-roman">小写罗马 (i, ii, iii...)</option>
              <option value="upper-roman">大写罗马 (I, II, III...)</option>
              <option value="lower-greek">小写希腊 (α, β, γ...)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">前缀</label>
            <input v-model="prefix" type="text" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="例如: 第、Section ">
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">后缀</label>
            <input v-model="suffix" type="text" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="例如: 、. - ">
          </div>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>

        <div class="p-4 bg-muted rounded-lg mb-4">
          <div class="counter-demo" v-html="previewHTML"></div>
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
            <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>{{ generatedCSS }}</code></pre>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-foreground">HTML 结构</h3>
            <button
              @click="copyHTML"
              class="text-xs px-3 py-1 bg-primary hover:bg-primary/90 rounded text-primary-foreground transition-colors"
            >
              复制
            </button>
          </div>
          <div class="p-4 bg-muted rounded-lg border border-border">
            <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>{{ generatedHTML }}</code></pre>
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
          什么是 CSS 计数器？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS 计数器是 CSS 提供的一个强大功能，允许开发者使用 CSS 自动为元素编号。
          它比传统的有序列表（ol）更加灵活，可以实现复杂的编号需求，
          如自定义起始值、增量、编号样式、前缀和后缀等。
        </p>
        <p class="text-muted-foreground">
          CSS 计数器广泛应用于文档章节编号、文章列表、步骤说明等场景。
          使用 counter-reset、counter-increment 和 counter() 函数，可以轻松实现各种自动编号效果。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>设置计数器名称、起始值和增量</li>
          <li>选择编号样式（数字、字母、罗马数字等）</li>
          <li>（可选）添加自定义的前缀和后缀</li>
          <li>实时预览计数器效果</li>
          <li>复制 CSS 和 HTML 代码到您的项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>自定义名称</strong>: 支持任意有效的 CSS 标识符作为计数器名称</li>
          <li><strong>灵活起始值</strong>: 可以设置任意整数作为起始值</li>
          <li><strong>自定义增量</strong>: 支持正数、负数和零作为增量值</li>
          <li><strong>多种样式</strong>: 支持数字、字母、罗马数字等多种编号样式</li>
          <li><strong>前缀后缀</strong>: 添加自定义的前缀和后缀文字</li>
          <li><strong>实时预览</strong>: 参数修改后立即看到效果</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">CSS 计数器和有序列表有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              CSS 计数器比有序列表更加灵活。有序列表只能实现简单的数字编号，
              而 CSS 计数器可以自定义起始值、增量、编号样式，并且可以为任何元素添加编号，
              不受 li 元素的限制。此外，CSS 计数器可以实现嵌套编号、多级编号等复杂效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何在多个页面上保持计数器连续？</h3>
            <p class="text-muted-foreground mt-1">
              CSS 计数器在每个页面加载时都会重新开始。如果需要在多个页面上保持计数器连续，
              需要使用服务器端技术或 JavaScript 来保存和恢复计数器的值。
              本工具主要用于单页内的自动编号需求。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">浏览器兼容性如何？</h3>
            <p class="text-muted-foreground mt-1">
              CSS 计数器是 CSS2.1 规范的一部分，所有现代浏览器都完美支持，
              包括 Chrome、Firefox、Safari、Edge 等。IE8 及以上版本也支持 CSS 计数器。
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
import { HelpCircle, ChevronUp, Hash, List, Code, Type } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'CSS计数器生成器 - 在线自动编号样式工具 | Util工具箱',
  description: '免费在线CSS计数器生成工具，创建自定义自动编号样式。支持多种编号格式、前缀后缀设置，实时预览效果，一键复制CSS代码。',
  keywords: 'CSS计数器,counter生成器,自动编号,列表编号,CSS counter,在线计数器工具',
  author: 'Util工具箱',
  ogTitle: 'CSS计数器生成器 - 免费在线自动编号样式',
  ogDescription: '专业的CSS计数器生成工具，创建自定义自动编号样式。支持多种编号格式，实时预览，代码一键复制。',
  ogImage: 'https://www.util.cn/images/tools/css-counter-generator.png',
  ogUrl: 'https://www.util.cn/tools/css-counter-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS计数器生成器 - 免费在线自动编号样式',
  twitterDescription: '专业的CSS计数器生成工具，创建自定义自动编号样式。支持多种编号格式，实时预览。',
  twitterImage: 'https://www.util.cn/images/tools/css-counter-generator.png'
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
            name: 'CSS计数器生成器',
            description: '免费在线CSS计数器生成工具，创建自定义自动编号样式',
            url: 'https://www.util.cn/tools/css-counter-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '自定义计数器名称',
              '灵活起始值设置',
              '多种编号样式',
              '前缀后缀支持',
              '实时预览功能',
              'CSS代码生成'
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
                name: 'CSS计数器生成器',
                item: 'https://www.util.cn/tools/css-counter-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'CSS计数器和有序列表有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CSS计数器比有序列表更加灵活。有序列表只能实现简单的数字编号，而CSS计数器可以自定义起始值、增量、编号样式，并且可以为任何元素添加编号。'
                }
              },
              {
                '@type': 'Question',
                name: '浏览器兼容性如何？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CSS计数器是CSS2.1规范的一部分，所有现代浏览器都完美支持，包括Chrome、Firefox、Safari、Edge等。IE8及以上版本也支持CSS计数器。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const counterName = ref('section')
const startValue = ref(1)
const increment = ref(1)
const listStyle = ref('decimal')
const prefix = ref('')
const suffix = ref('.')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Hash, List, Code, Type
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'blend-mode-tool'),
  tools.find(t => t.id === 'mask-image-generator'),
  tools.find(t => t.id === 'background-pattern-generator'),
  tools.find(t => t.id === 'gradient-generator')
].filter(Boolean)

const generatedCSS = computed(() => {
  return `body {
  counter-reset: ${counterName.value} ${startValue.value};
}

.item {
  counter-increment: ${counterName.value} ${increment.value};
}

.item::before {
  content: "${prefix.value}" counter(${counterName.value}, ${listStyle.value}) "${suffix.value}";
  margin-right: 0.5em;
  font-weight: bold;
  color: #3b82f6;
}`
})

const generatedHTML = computed(() => {
  return `<div class="item">第一个项目</div>
<div class="item">第二个项目</div>
<div class="item">第三个项目</div>
<div class="item">第四个项目</div>`
})

const previewHTML = computed(() => {
  return `<div class="item">${prefix.value}1${suffix.value} 第一个项目</div>
<div class="item">${prefix.value}2${suffix.value} 第二个项目</div>
<div class="item">${prefix.value}3${suffix.value} 第三个项目</div>`
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(generatedCSS.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

async function copyHTML() {
  try {
    await navigator.clipboard.writeText(generatedHTML.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>

<style scoped>
.counter-demo :deep(.item) {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.25rem;
  color: var(--foreground);
}
</style>
