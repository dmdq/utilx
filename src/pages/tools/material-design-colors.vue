<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Material Design色板 - MD3官方颜色参考</h1>
      <p class="text-muted-foreground">Material Design 3官方色板参考工具，包含Primary、Secondary、Tertiary等核心色系。一键复制颜色代码，快速构建Material Design风格应用。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="space-y-6 mb-8">
      <div v-for="palette in colors" :key="palette.name" class="bg-card border border-border rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground">{{ palette.name }}</h2>
          <button @click="copyPalette(palette)" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
            复制全部
          </button>
        </div>
        <div class="grid grid-cols-5 md:grid-cols-10 gap-2">
          <div v-for="(color, index) in palette.shades" :key="index" class="text-center">
            <div
              class="w-full aspect-square rounded-lg cursor-pointer hover:scale-105 transition border border-border"
              :style="{ backgroundColor: color }"
              @click="copyColor(color)"
              :title="color"
            ></div>
            <div class="text-xs mt-1 font-mono text-muted-foreground">{{ palette.keys[index] }}</div>
          </div>
        </div>
        <div class="mt-4 p-4 bg-muted rounded-lg">
          <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>{{ palette.name }}: {
{{ paletteConfig(palette) }}
}</code></pre>
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
          什么是Material Design色板？
        </h2>
        <p class="text-muted-foreground mb-4">
          Material Design 3（Material You）是Google推出的最新设计系统，其色彩系统基于动态色彩方案，
          能够从用户的壁纸中提取颜色生成个性化主题。MD3色板包含三个核心色系：Primary（主色）、Secondary（次色）、Tertiary（第三色），
          每个色系都有从10到90的不同色调级别，为设计师提供完整的色彩参考。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          色系说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Primary（主色）</strong>: 应用的主要颜色，用于关键UI元素，如按钮、滑块等</li>
          <li><strong>Secondary（次色）</strong>: 辅助颜色，用于较少强调的组件，如FAB、筛选芯片等</li>
          <li><strong>Tertiary（第三色）</strong>: 用于平衡主色和次色，创造独特的视觉效果，常用于强调元素</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          色调级别说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>10-30</strong>: 极浅色调，用于主色调背景上的文字和图标</li>
          <li><strong>40</strong>: 用于主色调上的悬停状态</li>
          <li><strong>50-70</strong>: 中等色调，50为基准色，用于常规UI元素</li>
          <li><strong>80-90</strong>: 深色调，用于主色调背景上的文字和图标</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>浏览Material Design 3的三个核心色系</li>
          <li>点击任意色块可复制该颜色的十六进制值</li>
          <li>点击"复制全部"可复制整个色系的配置代码</li>
          <li>将颜色代码应用到您的Android应用、Web应用或设计项目中</li>
          <li>参考Material Design 3规范正确使用不同色调级别</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">这些颜色可以直接用于生产环境吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全可以。本工具提供的颜色值来自Material Design 3官方规范，与Android系统、Flutter、Web等平台的Material组件库完全兼容。
              您可以直接使用这些颜色值，确保应用符合Material Design设计规范。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">Material Design 3与Material Design 2有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              Material Design 3（Material You）相比MD2更加注重个性化和动态色彩。MD3的色板系统更加丰富，
              引入了Tertiary色系，色调级别从原来的13个（A100-A700）变为10个（10-90），
              更符合现代设计需求。MD3还支持动态取色，能从壁纸自动生成配色方案。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何在Android应用中使用这些颜色？</h3>
            <p class="text-muted-foreground mt-1">
              在Android项目中，您可以将这些颜色值添加到colors.xml文件中，或使用Material3主题（Theme.Material3.DynamicColors.*）。
              对于Jetpack Compose，可以在Color.kt中定义这些颜色。对于Web项目，可以使用Material Design Web的CSS变量。
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
import {
  HelpCircle, ChevronUp, Palette, Droplets, Copy, Code,
  Sparkles, Sun, Moon, Smartphone
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'Material Design色板 - MD3官方颜色参考 | Util工具箱',
  description: '免费Material Design 3色板参考工具，包含Primary、Secondary、Tertiary核心色系。一键复制颜色代码，符合Google官方规范。',
  keywords: 'Material Design色板,MD3颜色,Material Color,Android颜色,Material You,Google设计规范',
  author: 'Util工具箱',
  ogTitle: 'Material Design色板 - MD3官方颜色参考',
  ogDescription: 'Material Design 3官方色板参考，包含Primary、Secondary、Tertiary核心色系。',
  ogImage: 'https://www.util.cn/images/tools/material-design-colors.png',
  ogUrl: 'https://www.util.cn/tools/material-design-colors',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Material Design色板 - MD3官方颜色参考',
  twitterDescription: 'Material Design 3官方色板参考，包含Primary、Secondary、Tertiary核心色系。',
  twitterImage: 'https://www.util.cn/images/tools/material-design-colors.png'
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
            name: 'Material Design色板参考工具',
            description: 'Material Design 3官方色板参考工具',
            url: 'https://www.util.cn/tools/material-design-colors',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'MD3官方色板',
              'Primary/Secondary/Tertiary色系',
              '一键复制颜色',
              '配置代码导出',
              '符合Google规范'
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
                name: 'Material Design色板',
                item: 'https://www.util.cn/tools/material-design-colors'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '这些颜色可以直接用于生产环境吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '完全可以。本工具提供的颜色值来自Material Design 3官方规范，与Android系统、Flutter、Web等平台的Material组件库完全兼容。'
                }
              },
              {
                '@type': 'Question',
                name: 'Material Design 3与Material Design 2有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Material Design 3（Material You）相比MD2更加注重个性化和动态色彩。MD3的色板系统更加丰富，引入了Tertiary色系，色调级别从原来的13个变为10个。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Palette, Droplets, Copy, Code, Sparkles, Sun, Moon, Smartphone
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'material-design-colors'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'color-palette-generator'),
    tools.find(t => t.id === 'tailwind-color-palette'),
    tools.find(t => t.id === 'gradient-text-generator'),
    tools.find(t => t.id === 'color-naming-tool')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const colors = ref([
  {
    name: 'Primary',
    keys: ['10', '20', '25', '30', '40', '50', '60', '70', '80', '90'],
    shades: ['#D0BCFF', '#AAA7FF', '#9F9AF8', '#8F87FB', '#7C73EA', '#6750A4', '#553F93', '#442A7E', '#331C6A', '#21005D']
  },
  {
    name: 'Secondary',
    keys: ['10', '20', '25', '30', '40', '50', '60', '70', '80', '90'],
    shades: ['#E8DEF8', '#D0BCFF', '#C4B3FD', '#B69DF8', '#9E88F6', '#6D6280', '#4A4458', '#332D41', '#1D192B', '#141218']
  },
  {
    name: 'Tertiary',
    keys: ['10', '20', '25', '30', '40', '50', '60', '70', '80', '90'],
    shades: ['#FFD8E4', '#F2B8D5', '#E7A6CC', '#E391BC', '#D96FA9', '#7D5260', '#5E3F4A', '#4A2D38', '#351826', '#1B1118']
  }
])

function paletteConfig(palette) {
  return palette.shades.map((shade, i) => `  '${palette.keys[i]}': '${shade}'`).join(',\n')
}

async function copyColor(color) {
  try {
    await navigator.clipboard.writeText(color)
    alert(`已复制: ${color}`)
  } catch {}
}

async function copyPalette(palette) {
  const config = `${palette.name}: {
${paletteConfig(palette)}
}`
  try {
    await navigator.clipboard.writeText(config)
    alert(`已复制${palette.name}色板`)
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
