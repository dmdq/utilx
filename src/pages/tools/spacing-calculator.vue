<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">间距计算器 - 设计间距系统生成工具</h1>
      <p class="text-muted-foreground">基于基准单位和比例类型生成统一的设计间距系统。支持线性、斐波那契、2的幂次等多种比例，一键导出CSS变量和Tailwind配置。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="space-y-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">基准单位 (px)</label>
            <input
              v-model.number="baseUnit"
              type="number"
              min="4"
              max="16"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground"
            >
            <p class="text-xs text-muted-foreground mt-1">建议: 4px, 8px, 或 16px</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">比例类型</label>
            <select v-model="scaleType" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
              <option value="linear">线性 (0.5x, 1x, 1.5x...)</option>
              <option value="fibonacci">斐波那契数列</option>
              <option value="powers">2的幂次 (1, 2, 4, 8...)</option>
            </select>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mb-3">间距系统预览</h3>
        <div class="grid grid-cols-4 md:grid-cols-8 gap-3">
          <div v-for="(spacing, index) in spacings" :key="index" class="text-center">
            <div class="flex items-center justify-center mb-2">
              <div
                class="bg-primary rounded"
                :style="{ width: Math.min(spacing.value, 60) + 'px', height: Math.min(spacing.value, 60) + 'px' }"
              ></div>
            </div>
            <div class="text-xs font-mono text-foreground">{{ spacing.value }}px</div>
            <div class="text-xs text-muted-foreground">{{ spacing.name }}</div>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">CSS变量</h2>
          <div class="p-4 bg-muted rounded-lg">
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>:root {
{{ spacingCSS }}
}</code></pre>
          </div>
          <button @click="copyCSSVariables" class="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            复制CSS变量
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">Tailwind配置</h2>
          <div class="p-4 bg-muted rounded-lg">
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>spacing: {
{{ tailwindSpacing }}
}</code></pre>
          </div>
          <button @click="copyTailwindConfig" class="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            复制Tailwind配置
          </button>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">使用示例</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-medium text-foreground mb-2">CSS变量使用</h3>
            <pre class="text-sm text-muted-foreground"><code>.button {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}</code></pre>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-medium text-foreground mb-2">Tailwind使用</h3>
            <pre class="text-sm text-muted-foreground"><code>&lt;div class="p-md mb-lg"&gt;
  内容
&lt;/div&gt;</code></pre>
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
          什么是间距系统？
        </h2>
        <p class="text-muted-foreground mb-4">
          间距系统（Spacing System）是设计系统中用于定义和管理元素间距、内边距、外边距的规范化体系。
          通过使用统一的间距单位，可以确保界面的一致性和视觉和谐，提升用户体验。
          一个好的间距系统基于数学比例，能够创造出有韵律感和层次感的布局。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          比例类型说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>线性比例 (Linear)</strong>: 使用固定倍数递增，如0.5x, 1x, 1.5x, 2x等。简单直观，易于理解和计算，适合大多数项目。</li>
          <li><strong>斐波那契数列 (Fibonacci)</strong>: 基于斐波那契数列（1, 1, 2, 3, 5, 8...），在自然界中广泛存在，能创造出自然的视觉和谐。</li>
          <li><strong>2的幂次 (Powers of 2)</strong>: 使用2的幂次方（1, 2, 4, 8, 16...），常用于数字系统和UI框架，具有良好的可扩展性。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          基准单位选择
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>4px</strong>: 最精细的间距单位，适合需要精细控制的项目</li>
          <li><strong>8px</strong>: 最常用的基准单位，符合4px网格系统，推荐大多数项目使用</li>
          <li><strong>16px</strong>: 较大的基准单位，适合需要更大间距的项目，如移动端应用</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择合适的基准单位（建议8px）</li>
          <li>选择比例类型，预览生成的间距系统</li>
          <li>根据需要调整基准单位，找到最合适的间距</li>
          <li>点击"复制CSS变量"或"复制Tailwind配置"</li>
          <li>将配置应用到您的项目中，确保团队统一使用</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          最佳实践
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>在整个项目中保持一致的间距系统，避免随意使用数值</li>
          <li>使用语义化的命名（xs, sm, md, lg等）而非具体数值</li>
          <li>与字体大小、行高等其他设计元素保持协调</li>
          <li>在团队中建立文档，确保所有开发者了解和使用间距系统</li>
          <li>定期审查和优化间距系统，适应项目需求变化</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要间距系统？</h3>
            <p class="text-muted-foreground mt-1">
              间距系统确保了设计的一致性和专业性。没有统一的间距系统，设计师和开发者可能会随意选择间距值，
              导致界面混乱、缺乏视觉韵律。统一的间距系统能提高工作效率，减少决策时间，并创造更和谐的用户体验。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的基准单位？</h3>
            <p class="text-muted-foreground mt-1">
              基准单位的选择应基于项目的视觉密度和目标平台。8px是最通用的选择，因为它符合大多数屏幕的像素密度，
              且能被4和16整除，便于计算。如果项目需要更精细的控制，可以选择4px；如果是移动端或需要更大间距，
              可以选择16px。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的间距可以直接用于Tailwind CSS吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全可以。我们提供的Tailwind配置格式与Tailwind CSS的spacing配置完全兼容。
              只需将生成的配置复制到tailwind.config.js的spacing部分，就可以使用p-md、m-lg等类名。
              如果与默认spacing冲突，可以自定义命名空间或覆盖默认值。
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
  HelpCircle, ChevronUp, Ruler, Copy, Code, Settings,
  Layout, Grid
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '间距计算器 - 设计间距系统生成工具 | Util工具箱',
  description: '免费在线间距计算器，基于基准单位生成统一的设计间距系统。支持线性、斐波那契、2的幂次等比例，一键导出CSS变量和Tailwind配置。',
  keywords: '间距计算器,间距系统,设计系统,spacing,UI间距,CSS变量,Tailwind配置',
  author: 'Util工具箱',
  ogTitle: '间距计算器 - 设计间距系统生成工具',
  ogDescription: '基于基准单位和比例类型生成统一的设计间距系统。',
  ogImage: 'https://www.util.cn/images/tools/spacing-calculator.png',
  ogUrl: 'https://www.util.cn/tools/spacing-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '间距计算器 - 设计间距系统生成工具',
  twitterDescription: '基于基准单位和比例类型生成统一的设计间距系统。',
  twitterImage: 'https://www.util.cn/images/tools/spacing-calculator.png'
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
            name: '间距计算器',
            description: '在线设计间距系统生成工具',
            url: 'https://www.util.cn/tools/spacing-calculator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种比例类型',
              '自定义基准单位',
              '导出CSS变量',
              '导出Tailwind配置',
              '实时预览'
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
                name: '间距计算器',
                item: 'https://www.util.cn/tools/spacing-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么需要间距系统？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '间距系统确保了设计的一致性和专业性。统一的间距系统能提高工作效率，减少决策时间，并创造更和谐的用户体验。'
                }
              },
              {
                '@type': 'Question',
                name: '如何选择合适的基准单位？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '基准单位的选择应基于项目的视觉密度和目标平台。8px是最通用的选择，因为它符合大多数屏幕的像素密度。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const baseUnit = ref(8)
const scaleType = ref('linear')
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Ruler, Copy, Code, Settings, Layout, Grid
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'spacing-calculator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'color-palette-generator'),
    tools.find(t => t.id === 'tailwind-color-palette'),
    tools.find(t => t.id === 'gradient-text-generator'),
    tools.find(t => t.id === 'material-design-colors')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const spacings = computed(() => {
  const base = baseUnit.value
  const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']

  if (scaleType.value === 'linear') {
    return [0.5, 1, 1.5, 2, 3, 4, 6, 8].map((m, i) => ({
      name: names[i],
      value: base * m
    }))
  } else if (scaleType.value === 'fibonacci') {
    return [1, 1, 2, 3, 5, 8, 13, 21].map((f, i) => ({
      name: names[i],
      value: base * f
    }))
  } else {
    return [1, 2, 4, 8, 16, 32, 64, 128].map((p, i) => ({
      name: names[i],
      value: base * p
    }))
  }
})

const spacingCSS = computed(() => {
  return spacings.value.map(s => `  --spacing-${s.name}: ${s.value}px;`).join('\n')
})

const tailwindSpacing = computed(() => {
  return spacings.value.map(s => `  '${s.name}': '${s.value / baseUnit.value}'`).join(',\n')
})

async function copyCSSVariables() {
  try {
    await navigator.clipboard.writeText(`:root {\n${spacingCSS.value}\n}`)
    alert('已复制CSS变量')
  } catch {}
}

async function copyTailwindConfig() {
  try {
    await navigator.clipboard.writeText(`spacing: {\n${tailwindSpacing.value}\n}`)
    alert('已复制Tailwind配置')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
