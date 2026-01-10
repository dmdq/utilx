<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">网格系统生成器 - CSS Grid布局系统生成工具</h1>
      <p class="text-muted-foreground">免费在线网格系统生成工具，支持12/16/24列CSS Grid布局系统。可视化预览、自定义间距和边距，一键生成CSS代码。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 配置面板 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">网格配置</h2>

        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">列数</label>
            <select v-model.number="columns" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
              <option :value="12">12列</option>
              <option :value="16">16列</option>
              <option :value="24">24列</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">间距 (px)</label>
            <input v-model.number="gap" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="16">
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">边距 (px)</label>
            <input v-model.number="padding" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="20">
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mb-3">可视化预览</h3>
        <div class="p-4 bg-muted rounded-lg overflow-x-auto">
          <div class="flex" :style="{ gap: gap + 'px' }">
            <div v-for="i in columns" :key="i" class="flex-1 bg-primary/30 border border-primary h-16 flex items-center justify-center text-xs font-medium text-foreground">{{ i }}</div>
          </div>
        </div>
      </div>

      <!-- CSS代码输出 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-foreground">CSS代码</h2>
          <button
            @click="copyCSS"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            复制代码
          </button>
        </div>
        <div class="p-4 bg-muted rounded-lg">
          <pre class="text-sm font-mono text-foreground whitespace-pre-wrap">{{ gridCSS }}</pre>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 p-2 hover:bg-muted rounded transition-colors"
        :title="isSeoContentVisible ? '收起' : '展开'"
      >
        <HelpCircle v-if="!isSeoContentVisible" :size="20" class="text-muted-foreground" />
        <ChevronUp v-else :size="20" class="text-muted-foreground" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span class="text-primary">#</span>
          网格系统生成器 - 使用指南
        </h2>

        <div class="space-y-6 text-muted-foreground">
          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">什么是CSS网格系统？</h3>
            <p>
              CSS网格系统（CSS Grid Layout）是一种强大的二维布局系统，专为网页设计而开发。它能够同时处理行和列，使复杂的布局变得简单。网格系统生成器帮助您快速创建基于12、16或24列的标准化网格布局，广泛应用于响应式网页设计。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">如何使用本工具？</h3>
            <ol class="list-decimal list-inside space-y-2">
              <li>选择网格列数（12/16/24列）</li>
              <li>设置列之间的间距大小（gutter）</li>
              <li>设置容器的内边距（padding）</li>
              <li>实时预览网格效果</li>
              <li>复制生成的CSS代码到项目中使用</li>
            </ol>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">主要特性</h3>
            <ul class="list-disc list-inside space-y-2">
              <li><strong class="text-foreground">灵活列数</strong>：支持12、16、24列标准网格系统</li>
              <li><strong class="text-foreground">自定义间距</strong>：精确控制gutter和padding值</li>
              <li><strong class="text-foreground">实时预览</strong>：可视化展示网格效果</li>
              <li><strong class="text-foreground">代码生成</strong>：一键生成可直接使用的CSS代码</li>
              <li><strong class="text-foreground">响应式友好</strong>：基于CSS Grid，完美支持响应式布局</li>
            </ul>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见应用场景</h3>
            <ul class="list-disc list-inside space-y-2">
              <li>响应式网页布局设计</li>
              <li>卡片式内容展示</li>
              <li>图片画廊和作品集</li>
              <li>仪表板和数据展示界面</li>
              <li>电商产品列表</li>
            </ul>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">技术说明</h3>
            <p>
              本工具使用CSS Grid布局模块的grid-template-columns属性创建等宽列，通过gap属性控制间距，使用repeat()函数简化代码。生成的代码兼容所有现代浏览器，包括Chrome、Firefox、Safari和Edge。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见问题</h3>
            <div class="space-y-3">
              <div>
                <h4 class="font-medium text-foreground">什么是12列网格系统？</h4>
                <p>12列网格是最流行的响应式布局系统，因为它可以被1、2、3、4、6和12整除，提供灵活的布局选项，非常适合大多数网页设计需求。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">16列和24列网格有什么区别？</h4>
                <p>16列网格提供更细粒度的控制，适合需要更复杂布局的设计。24列网格则主要用于大型项目和复杂应用，能够实现几乎任何布局需求。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">如何在移动设备上使用？</h4>
                <p>可以使用媒体查询在不同屏幕尺寸下改变列数，例如桌面端使用12列，平板端使用8列，移动端使用4列或单列布局。</p>
              </div>
            </div>
          </section>
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
              :size="20"
              class="text-primary"
            />
            <h3 class="font-semibold text-foreground">{{ relatedTool.name }}</h3>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, Layout, Ruler, Palette, Grid3x3 } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '网格系统生成器 - CSS Grid布局系统生成工具 | Util工具箱',
  description: '免费在线网格系统生成工具，支持12/16/24列CSS Grid布局系统。可视化预览、自定义间距和边距，一键生成CSS代码。纯本地计算，数据隐私绝对安全。',
  keywords: '网格系统,CSS Grid,网格布局,响应式布局,12列网格,16列网格,24列网格,网格生成器',
  author: 'Util工具箱',
  ogTitle: '网格系统生成器 - 免费在线CSS Grid布局工具',
  ogDescription: '专业的网格系统生成工具，支持12/16/24列CSS Grid布局，可视化预览，一键生成代码。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/grid-system-generator.png',
  ogUrl: 'https://www.util.cn/tools/grid-system-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '网格系统生成器 - 免费在线CSS Grid布局工具',
  twitterDescription: '专业的网格系统生成工具，支持12/16/24列CSS Grid布局，可视化预览，一键生成代码。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/grid-system-generator.png'
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
            name: '网格系统生成器',
            description: '免费在线网格系统生成工具，支持CSS Grid布局系统',
            url: 'https://www.util.cn/tools/grid-system-generator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '12/16/24列网格系统',
              '自定义间距设置',
              '可视化预览',
              'CSS代码生成',
              '响应式布局支持',
              '本地安全处理'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Util工具箱',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '网格系统生成器',
                item: 'https://www.util.cn/tools/grid-system-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是12列网格系统？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '12列网格是最流行的响应式布局系统，因为它可以被1、2、3、4、6和12整除，提供灵活的布局选项，非常适合大多数网页设计需求。'
                }
              },
              {
                '@type': 'Question',
                name: '16列和24列网格有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '16列网格提供更细粒度的控制，适合需要更复杂布局的设计。24列网格则主要用于大型项目和复杂应用，能够实现几乎任何布局需求。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 数据状态
const columns = ref(12)
const gap = ref(16)
const padding = ref(20)
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Layout, Ruler, Palette, Grid3x3
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'aspect-ratio-calculator'),
    tools.find(t => t.id === 'flexbox-generator'),
    tools.find(t => t.id === 'layout-helper'),
    tools.find(t => t.id === 'spacing-calculator')
  ].filter(Boolean)

  return recommended
})

// CSS代码生成
const gridCSS = computed(() => {
  return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns.value}, 1fr);
  gap: ${gap.value}px;
  padding: ${padding.value}px;
}

/* 列跨度示例 */
.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-6 { grid-column: span 6; }
.col-${columns.value} { grid-column: span ${columns.value}; }`
})

// SEO内容折叠状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 复制CSS代码
const copyCSS = () => {
  navigator.clipboard.writeText(gridCSS.value)
  // 可以添加提示
}
</script>
