<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Tailwind色板生成器 - 在线Tailwind颜色系统工具</h1>
      <p class="text-muted-foreground">生成Tailwind风格的50-950色阶，一键导出Tailwind配置。基于基准颜色自动生成完整的色阶系统，支持自定义亮度调整。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="space-y-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">选择基准颜色</label>
          <div class="flex gap-4 items-center">
            <input v-model="baseColor" type="color" class="w-full h-12 rounded cursor-pointer border border-border">
            <input
              v-model="baseColor"
              type="text"
              maxlength="7"
              class="flex-1 px-3 py-2 border border-border rounded-lg bg-muted uppercase font-mono text-foreground"
              placeholder="#3B82F6"
            >
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mb-3">生成的色阶</h3>
        <div class="grid grid-cols-11 gap-1 mb-4">
          <div v-for="(shade, index) in shades" :key="index" class="text-center">
            <div
              class="w-full aspect-square rounded cursor-pointer hover:scale-105 transition border border-border"
              :style="{ backgroundColor: shade }"
              @click="copyColor(shade)"
              :title="shade"
            ></div>
            <div class="text-xs mt-1 text-muted-foreground">{{ 50 + index * 100 }}</div>
          </div>
        </div>

        <button @click="copyAllColors" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">复制所有颜色</button>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">Tailwind配置</h2>
        <div class="p-4 bg-muted rounded-lg">
          <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>colors: {
  primary: {
{{ tailwindConfig }}
  }
}</code></pre>
        </div>
        <button @click="copyConfig" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">复制配置</button>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">CSS变量</h2>
        <div class="p-4 bg-muted rounded-lg">
          <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>:root {
{{ cssVariables }}
}</code></pre>
        </div>
        <button @click="copyCssVariables" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">复制CSS变量</button>
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
          什么是Tailwind色板？
        </h2>
        <p class="text-muted-foreground mb-4">
          Tailwind CSS使用50-950的数字系统来表示颜色的不同深浅级别，每个级别代表不同的明度和饱和度。
          这个系统基于人眼对颜色感知的非线性特性，使得设计系统更加统一和协调。
          通过本工具，您可以基于任意基准颜色快速生成符合Tailwind规范的完整色阶。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          色阶说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>50-100</strong>: 极浅色，用于背景、悬停状态</li>
          <li><strong>200-300</strong>: 浅色，用于次要背景、禁用状态</li>
          <li><strong>400-500</strong>: 中等色，500通常是基准颜色，用于常规UI元素</li>
          <li><strong>600-700</strong>: 深色，用于文字、边框</li>
          <li><strong>800-900</strong>: 极深色，用于主要文字、深色背景</li>
          <li><strong>950</strong>: 最深色，用于特殊强调场景</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择或输入您想要作为基准的颜色（建议使用500级别的颜色）</li>
          <li>系统会自动生成从50到950的完整色阶</li>
          <li>点击任意色块可复制该颜色的十六进制值</li>
          <li>点击"复制配置"获取Tailwind配置代码</li>
          <li>将配置粘贴到tailwind.config.js中即可使用</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的基准颜色？</h3>
            <p class="text-muted-foreground mt-1">
              建议选择中等明度的颜色作为基准（相当于Tailwind的500级别）。
              如果您的颜色太浅或太深，生成的色阶可能不够理想。理想情况下，基准颜色的HSL亮度应该在40-60之间。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的色阶与官方Tailwind颜色完全一致吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具使用简化算法生成色阶，结果与Tailwind官方颜色类似但不完全相同。
              如果需要完全匹配官方颜色，建议直接使用Tailwind提供的默认色板。
              本工具更适合为自定义品牌色生成符合Tailwind风格的色阶。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以在CSS变量中使用吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全可以。我们提供了CSS变量格式的输出，您可以直接将生成的变量添加到CSS文件中，
              然后使用var(--color-500)等方式引用。这种方式与Tailwind配置互不冲突。
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
  Sparkles, Sun, Moon
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'Tailwind色板生成器 - 在线Tailwind颜色系统工具 | Util工具箱',
  description: '免费在线Tailwind色板生成器，基于基准颜色生成50-950完整色阶。支持导出Tailwind配置和CSS变量，快速构建设计系统。',
  keywords: 'Tailwind色板,Tailwind颜色,颜色系统,色阶生成,CSS变量,Tailwind配置',
  author: 'Util工具箱',
  ogTitle: 'Tailwind色板生成器 - 在线颜色系统工具',
  ogDescription: '基于基准颜色生成Tailwind风格的50-950色阶，一键导出配置。',
  ogImage: 'https://www.util.cn/images/tools/tailwind-color-palette.png',
  ogUrl: 'https://www.util.cn/tools/tailwind-color-palette',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tailwind色板生成器 - 在线颜色系统工具',
  twitterDescription: '基于基准颜色生成Tailwind风格的50-950色阶。',
  twitterImage: 'https://www.util.cn/images/tools/tailwind-color-palette.png'
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
            name: 'Tailwind色板生成器',
            description: '在线Tailwind风格色板生成工具',
            url: 'https://www.util.cn/tools/tailwind-color-palette',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '生成50-950色阶',
              '导出Tailwind配置',
              '导出CSS变量',
              '一键复制颜色',
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
                name: 'Tailwind色板生成器',
                item: 'https://www.util.cn/tools/tailwind-color-palette'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何选择合适的基准颜色？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '建议选择中等明度的颜色作为基准（相当于Tailwind的500级别）。理想情况下，基准颜色的HSL亮度应该在40-60之间。'
                }
              },
              {
                '@type': 'Question',
                name: '生成的色阶与官方Tailwind颜色完全一致吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具使用简化算法生成色阶，结果与Tailwind官方颜色类似但不完全相同。更适合为自定义品牌色生成符合Tailwind风格的色阶。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const baseColor = ref('#3B82F6')
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Palette, Droplets, Copy, Code, Sparkles, Sun, Moon
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'tailwind-color-palette'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'color-palette-generator'),
    tools.find(t => t.id === 'material-design-colors'),
    tools.find(t => t.id === 'gradient-text-generator'),
    tools.find(t => t.id === 'color-naming-tool')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 简化的色阶生成
const shades = computed(() => {
  const hex = baseColor.value
  return [
    adjustBrightness(hex, -80),
    adjustBrightness(hex, -60),
    adjustBrightness(hex, -40),
    adjustBrightness(hex, -20),
    adjustBrightness(hex, -10),
    hex,
    adjustBrightness(hex, 10),
    adjustBrightness(hex, 20),
    adjustBrightness(hex, 30),
    adjustBrightness(hex, 40),
    adjustBrightness(hex, 50)
  ]
})

const tailwindConfig = computed(() => {
  return shades.value.map((s, i) => `    '${(i + 1) * 100}': '${s}'`).join(',\n')
})

const cssVariables = computed(() => {
  return shades.value.map((s, i) => `  --color-${(i + 1) * 100}: ${s};`).join('\n')
})

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1).toUpperCase()
}

async function copyColor(color) {
  try {
    await navigator.clipboard.writeText(color)
    alert(`已复制: ${color}`)
  } catch {}
}

async function copyAllColors() {
  try {
    await navigator.clipboard.writeText(shades.value.join('\n'))
    alert('已复制所有颜色')
  } catch {}
}

async function copyConfig() {
  const config = `colors: {
  primary: {
${tailwindConfig.value}
  }
}`
  try {
    await navigator.clipboard.writeText(config)
    alert('已复制Tailwind配置')
  } catch {}
}

async function copyCssVariables() {
  try {
    await navigator.clipboard.writeText(`:root {\n${cssVariables.value}\n}`)
    alert('已复制CSS变量')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
