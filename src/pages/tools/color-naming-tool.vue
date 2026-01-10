<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">色彩命名工具 - 在线颜色语义化命名</h1>
      <p class="text-muted-foreground">为颜色值生成语义化名称，提升代码可读性。基于HSL色相分析和预定义颜色映射，快速生成专业的颜色变量命名。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="mb-4">
        <label class="block text-sm font-medium text-foreground mb-2">输入颜色值</label>
        <div class="flex gap-4 items-center">
          <input v-model="hexColor" type="color" class="w-20 h-10 rounded cursor-pointer border border-border">
          <input
            v-model="hexColor"
            maxlength="7"
            class="flex-1 px-3 py-2 border border-border rounded-lg bg-muted uppercase font-mono text-foreground"
            placeholder="#000000"
          >
        </div>
      </div>

      <div class="mb-4">
        <div class="w-full h-32 rounded-lg border border-border" :style="{ backgroundColor: hexColor }"></div>
      </div>

      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div class="p-4 bg-muted rounded-lg">
          <h3 class="font-semibold text-foreground mb-2">颜色信息</h3>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">HEX:</span>
              <span class="font-mono text-foreground">{{ hexColor.toUpperCase() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">RGB:</span>
              <span class="font-mono text-foreground">{{ hexToRgb(hexColor).join(', ') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">HSL:</span>
              <span class="font-mono text-foreground">{{ hslString }}</span>
            </div>
          </div>
        </div>
        <div class="p-4 bg-muted rounded-lg">
          <h3 class="font-semibold text-foreground mb-2">色相分析</h3>
          <div class="text-sm text-muted-foreground">
            <p>色相: {{ hsl.h }}°</p>
            <p>饱和度: {{ hsl.s }}%</p>
            <p>亮度: {{ hsl.l }}%</p>
            <p class="mt-2">色彩倾向: <span class="font-medium text-foreground">{{ colorCategory }}</span></p>
          </div>
        </div>
      </div>

      <div v-if="colorNames.length > 0" class="space-y-3">
        <h3 class="font-semibold text-foreground">建议名称</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            v-for="name in colorNames"
            :key="name"
            @click="copyName(name)"
            class="p-3 bg-muted hover:bg-muted/80 rounded text-left transition group"
          >
            <div class="font-mono font-medium text-foreground group-hover:text-primary">{{ name }}</div>
            <div class="text-xs text-muted-foreground">点击复制</div>
          </button>
        </div>
      </div>

      <div class="mt-4 p-4 bg-muted rounded-lg">
        <h3 class="font-semibold text-foreground mb-2">CSS变量命名建议</h3>
        <pre class="text-sm font-mono text-foreground overflow-x-auto"><code>--color-{{ colorNames[0] || 'primary' }}: {{ hexColor.toUpperCase() }};
--color-{{ colorNames[0] || 'primary' }}-hover: {{ adjustBrightness(hexColor, 10) }};
--color-{{ colorNames[0] || 'primary' }}-active: {{ adjustBrightness(hexColor, -10) }};</code></pre>
        <button @click="copyCSSVariables" class="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
          复制CSS变量
        </button>
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
          什么是色彩命名？
        </h2>
        <p class="text-muted-foreground mb-4">
          色彩命名是为颜色值赋予语义化名称的过程，目的是提升代码的可读性和可维护性。
          直接使用#3B82F6这样的十六进制值很难理解其用途，而使用--color-primary这样的命名则清晰地表达了颜色的用途。
          良好的颜色命名约定是设计系统和代码规范的重要组成部分。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          命名原则
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>语义化优先</strong>: 根据颜色用途而非外观命名，如primary、success、warning</li>
          <li><strong>避免颜色名</strong>: 尽量不用red、blue等颜色名，改用功能性名称</li>
          <li><strong>使用小写</strong>: CSS变量和命名通常使用小写字母和连字符</li>
          <li><strong>保持一致性</strong>: 在整个项目中使用相同的命名约定</li>
          <li><strong>添加变体</strong>: 使用hover、active、disabled等后缀表示状态</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用命名规范
        </h2>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">功能命名</h3>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>primary - 主色调</li>
              <li>secondary - 次色调</li>
              <li>accent - 强调色</li>
              <li>success - 成功状态</li>
              <li>warning - 警告状态</li>
              <li>error - 错误状态</li>
              <li>info - 信息提示</li>
            </ul>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">中性色命名</h3>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>background - 背景色</li>
              <li>surface - 表面色</li>
              <li>border - 边框色</li>
              <li>text - 文字色</li>
              <li>muted - 柔和色</li>
              <li>subtle - 微妙色</li>
              <li>disabled - 禁用状态</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>使用颜色选择器或输入十六进制值选择您的颜色</li>
          <li>查看颜色信息和色相分析结果</li>
          <li>从建议名称列表中选择合适的语义化名称</li>
          <li>点击名称可复制到剪贴板</li>
          <li>使用生成的CSS变量代码快速应用到项目中</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么建议使用语义化命名而不是颜色名？</h3>
            <p class="text-muted-foreground mt-1">
              语义化命名关注颜色的用途而非外观，这使得在需要更换主题或品牌色时更加灵活。
              例如，如果将按钮从蓝色改为红色，使用--color-button这样的命名就不需要修改代码，
              而使用--color-blue则需要重命名所有相关变量。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">工具建议的名称适合所有场景吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具提供的命名建议基于常见的设计系统和最佳实践，但可能不适合所有项目。
              您应该根据项目的具体情况和团队规范来选择最终的命名。
              建议结合项目的设计系统文档和代码规范来确定最合适的命名方式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理颜色的不同变体？</h3>
            <p class="text-muted-foreground mt-1">
              对于同一颜色的不同变体，建议使用后缀来区分。常见的后缀包括：
              hover（悬停）、active（激活）、disabled（禁用）、focus（聚焦）、
              light（浅色）、dark（深色）、subtle（微妙）、strong（强烈）等。
              例如：--color-primary-hover、--color-text-muted。
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
  HelpCircle, ChevronUp, Palette, Type, Tag, Copy, Code,
  Sparkles, Droplets
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '色彩命名工具 - 在线颜色语义化命名 | Util工具箱',
  description: '免费在线色彩命名工具，为颜色值生成语义化名称。基于HSL色相分析，提供专业颜色变量命名建议，提升代码可读性。',
  keywords: '色彩命名,颜色命名,语义化命名,CSS变量,颜色规范,设计系统',
  author: 'Util工具箱',
  ogTitle: '色彩命名工具 - 在线颜色语义化命名',
  ogDescription: '为颜色值生成语义化名称，提升代码可读性。',
  ogImage: 'https://www.util.cn/images/tools/color-naming-tool.png',
  ogUrl: 'https://www.util.cn/tools/color-naming-tool',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '色彩命名工具 - 在线颜色语义化命名',
  twitterDescription: '为颜色值生成语义化名称，提升代码可读性。',
  twitterImage: 'https://www.util.cn/images/tools/color-naming-tool.png'
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
            name: '色彩命名工具',
            description: '在线颜色语义化命名工具',
            url: 'https://www.util.cn/tools/color-naming-tool',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'HSL色相分析',
              '语义化命名建议',
              'CSS变量生成',
              '颜色格式转换',
              '命名规范参考'
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
                name: '色彩命名工具',
                item: 'https://www.util.cn/tools/color-naming-tool'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么建议使用语义化命名而不是颜色名？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '语义化命名关注颜色的用途而非外观，这使得在需要更换主题或品牌色时更加灵活。'
                }
              },
              {
                '@type': 'Question',
                name: '工具建议的名称适合所有场景吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具提供的命名建议基于常见的设计系统和最佳实践，但您应该根据项目的具体情况和团队规范来选择最终的命名。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const hexColor = ref('#3B82F6')
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Palette, Type, Tag, Copy, Code, Sparkles, Droplets
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'color-naming-tool'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'color-palette-generator'),
    tools.find(t => t.id === 'tailwind-color-palette'),
    tools.find(t => t.id === 'material-design-colors'),
    tools.find(t => t.id === 'gradient-text-generator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 预定义颜色名称映射
const colorMap = {
  '#3B82F6': ['primary', 'blue', 'main'],
  '#EF4444': ['danger', 'error', 'red'],
  '#10B981': ['success', 'green'],
  '#F59E0B': ['warning', 'orange', 'yellow'],
  '#6B7280': ['gray', 'neutral', 'muted'],
  '#8B5CF6': ['purple', 'violet'],
  '#EC4899': ['pink', 'rose'],
  '#14B8A6': ['teal', 'cyan'],
  '#F97316': ['orange'],
  '#6366F1': ['indigo']
}

const hsl = computed(() => {
  return hexToHsl(hexColor.value)
})

const hslString = computed(() => {
  const { h, s, l } = hsl.value
  return `${h}°, ${s}%, ${l}%`
})

const colorCategory = computed(() => {
  const { h } = hsl.value

  if (h < 15 || h >= 345) return '红色系 (Red)'
  if (h < 45) return '橙色系 (Orange)'
  if (h < 65) return '黄色系 (Yellow)'
  if (h < 150) return '绿色系 (Green)'
  if (h < 200) return '青色系 (Cyan)'
  if (h < 260) return '蓝色系 (Blue)'
  if (h < 290) return '紫色系 (Purple)'
  return '粉色系 (Pink)'
})

const colorNames = computed(() => {
  const upper = hexColor.value.toUpperCase()
  if (colorMap[upper]) {
    return colorMap[upper]
  }

  // 基于色相生成名称
  const { h } = hsl.value
  const names = []

  if (h < 15 || h >= 345) names.push('red', 'rose')
  else if (h < 45) names.push('orange', 'amber')
  else if (h < 65) names.push('yellow')
  else if (h < 150) names.push('green', 'emerald')
  else if (h < 200) names.push('cyan', 'teal')
  else if (h < 260) names.push('blue', 'sky')
  else if (h < 290) names.push('purple', 'violet')
  else names.push('pink', 'rose')

  return [...names, 'primary', 'accent', 'highlight']
})

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0

  if (max !== min) {
    const d = max - min
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return {
    h: Math.round(h * 360),
    s: 0,
    l: 0
  }
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1).toUpperCase()
}

async function copyName(name) {
  try {
    await navigator.clipboard.writeText(name)
    alert(`已复制: ${name}`)
  } catch {}
}

async function copyCSSVariables() {
  const name = colorNames.value[0] || 'primary'
  const css = `--color-${name}: ${hexColor.value.toUpperCase()};
--color-${name}-hover: ${adjustBrightness(hexColor.value, 10)};
--color-${name}-active: ${adjustBrightness(hexColor.value, -10)};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS变量')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
