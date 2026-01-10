<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">调色板生成器 - 在线配色方案生成工具</h1>
      <p class="text-muted-foreground">从单色生成和谐的配色方案，支持多种配色规则。单色、类比、互补、三角色等专业配色算法，一键生成精美色板。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="space-y-6 mb-8">
      <!-- 基础颜色选择 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">选择基础颜色</h2>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="relative">
            <input
              ref="colorInput"
              v-model="baseColor"
              type="color"
              class="w-20 h-20 rounded-lg cursor-pointer border-2 border-border"
            >
          </div>
          <div class="flex-1 min-w-[200px]">
            <div class="flex gap-2 mb-2">
              <input
                v-model="baseColor"
                type="text"
                maxlength="7"
                class="flex-1 px-3 py-2 border border-border rounded-lg bg-muted uppercase font-mono text-foreground"
                placeholder="#000000"
              >
              <button @click="randomColor" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">随机</button>
            </div>
            <div class="text-sm text-muted-foreground">
              RGB: {{ hexToRgb(baseColor).join(', ') }} | HSL: {{ hexToHsl(baseColor).join(', ') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 配色规则选择 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">配色规则</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            v-for="rule in colorRules"
            :key="rule.id"
            @click="selectedRule = rule.id"
            :class="['px-4 py-3 rounded-lg text-center transition', selectedRule === rule.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground']"
          >
            <div class="text-sm font-medium">{{ rule.name }}</div>
            <div class="text-xs opacity-75 mt-1">{{ rule.count }}色</div>
          </button>
        </div>
      </div>

      <!-- 生成的配色方案 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground">配色方案</h2>
          <button @click="copyPalette" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">复制CSS</button>
        </div>

        <div class="flex flex-wrap gap-1" :style="{ height: paletteColors.length > 0 ? '120px' : '60px' }">
          <div
            v-for="(color, index) in paletteColors"
            :key="index"
            @click="copyColor(color)"
            class="flex-1 min-w-[80px] flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition group"
            :style="{ backgroundColor: color }"
          >
            <span class="text-sm font-mono font-bold px-2 py-1 rounded" :class="isLightColor(color) ? 'text-foreground bg-white/80' : 'text-white bg-black/30'">
              {{ color }}
            </span>
            <span class="text-xs mt-1 opacity-0 group-hover:opacity-100 transition" :class="isLightColor(color) ? 'text-foreground' : 'text-white'">
              点击复制
            </span>
          </div>
        </div>

        <div v-if="paletteColors.length === 0" class="text-center py-8 text-muted-foreground">
          选择基础颜色和配色规则以生成方案
        </div>
      </div>

      <!-- 色卡详情 -->
      <div v-if="paletteColors.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">色卡详情</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(color, index) in paletteColors"
            :key="index"
            class="flex items-center gap-3 p-4 rounded-lg border-2 hover:border-primary transition"
            :style="{ borderColor: color }"
          >
            <div
              class="w-16 h-16 rounded-lg shadow-inner"
              :style="{ backgroundColor: color }"
            ></div>
            <div class="flex-1">
              <div class="font-mono font-bold text-foreground">{{ color }}</div>
              <div class="text-sm text-muted-foreground">RGB: {{ hexToRgb(color).join(', ') }}</div>
              <div class="text-sm text-muted-foreground">HSL: {{ hexToHsl(color).map((v, i) => i === 0 ? v + '°' : v + '%').join(', ') }}</div>
            </div>
            <button @click="copyColor(color)" class="p-2 hover:bg-muted rounded">
              <Copy class="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <!-- 快捷预设 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">快捷预设</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="preset in presets"
            :key="preset.name"
            @click="applyPreset(preset)"
            class="relative flex h-16 rounded-lg overflow-hidden hover:scale-105 transition"
          >
            <div
              v-for="(color, i) in preset.colors"
              :key="i"
              class="flex-1"
              :style="{ backgroundColor: color }"
            ></div>
            <span class="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow-lg bg-black/20 opacity-0 hover:opacity-100 transition">
              {{ preset.name }}
            </span>
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
          什么是调色板生成器？
        </h2>
        <p class="text-muted-foreground mb-4">
          调色板生成器是一款专业的在线配色工具，能够基于色彩理论自动生成和谐的配色方案。
          通过选择一个基础颜色，系统会运用单色、类比、互补、分裂互补、三角色、四角色等专业配色算法，
          为您生成多个协调的颜色组合，广泛应用于网页设计、UI设计、品牌设计等领域。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          配色规则说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>单色 (Monochromatic)</strong>: 使用同一色相的不同明度和饱和度，营造统一协调的视觉效果</li>
          <li><strong>类比 (Analogous)</strong>: 选择色环上相邻的3-5个颜色，自然和谐，常用于自然主题设计</li>
          <li><strong>互补 (Complementary)</strong>: 使用色环上相对的两种颜色，对比强烈，视觉冲击力大</li>
          <li><strong>分裂互补 (Split Complementary)</strong>: 选择一种颜色及其互补色的两侧颜色，既有对比又更和谐</li>
          <li><strong>三角色 (Triadic)</strong>: 选择色环上等距分布的三个颜色，平衡且富有活力</li>
          <li><strong>四角色 (Tetradic)</strong>: 选择两对互补色，色彩丰富但需要谨慎使用</li>
          <li><strong>复合 (Compound)</strong>: 结合类比和互补配色，创造更复杂的色彩层次</li>
          <li><strong>深浅 (Shades)</strong>: 基于同一颜色生成从深到浅的色阶</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>点击颜色选择器或输入十六进制颜色值选择基础颜色</li>
          <li>选择合适的配色规则，系统会自动生成对应的配色方案</li>
          <li>点击色块可直接复制颜色代码到剪贴板</li>
          <li>点击"复制CSS"按钮可导出CSS变量格式</li>
          <li>使用快捷预设快速应用专业设计师的配色方案</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的配色规则？</h3>
            <p class="text-muted-foreground mt-1">
              单色配色最安全，适合需要统一感的场景；类比配色自然和谐，适合柔和主题；互补配色对比强烈，
              适合需要突出重点的设计；三角色配色活泼有趣，适合创意类项目。建议根据项目风格和目标受众选择。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的颜色可以直接用于网页设计吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全可以。我们生成的所有颜色都是标准的十六进制格式，可以直接用于HTML、CSS、设计软件等。
              同时提供RGB和HSL格式，方便不同场景使用。点击"复制CSS"可直接导出CSS变量代码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是快捷预设？</h3>
            <p class="text-muted-foreground mt-1">
              快捷预设是专业设计师精心挑选的配色方案，包括日落、海洋、森林、薰衣草等经典主题。
              这些配色经过实践检验，可以直接用于您的项目，或作为灵感起点进行微调。
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
  Copy, HelpCircle, ChevronUp, Palette, Droplets, Sparkles,
  Eye, Pipette, Sun, Moon, Type, Image
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '调色板生成器 - 在线配色方案生成工具 | Util工具箱',
  description: '免费在线调色板生成器，支持单色、类比、互补、三角色等多种配色规则。一键生成和谐配色方案，导出CSS变量，提升设计效率。',
  keywords: '调色板生成器,配色方案,颜色搭配,色彩设计,在线配色工具,色彩理论,UI配色,网页配色',
  author: 'Util工具箱',
  ogTitle: '调色板生成器 - 专业配色方案生成工具',
  ogDescription: '基于色彩理论的智能配色工具，支持8种专业配色规则，一键生成和谐色彩组合。',
  ogImage: 'https://www.util.cn/images/tools/color-palette-generator.png',
  ogUrl: 'https://www.util.cn/tools/color-palette-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '调色板生成器 - 在线配色方案生成',
  twitterDescription: '支持8种专业配色规则，一键生成和谐配色方案。',
  twitterImage: 'https://www.util.cn/images/tools/color-palette-generator.png'
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
            name: '调色板生成器',
            description: '在线配色方案生成工具，支持多种配色规则',
            url: 'https://www.util.cn/tools/color-palette-generator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '8种专业配色规则',
              '实时颜色预览',
              'RGB/HSL格式转换',
              'CSS变量导出',
              '快捷配色预设',
              '一键复制颜色'
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
                name: '调色板生成器',
                item: 'https://www.util.cn/tools/color-palette-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何选择合适的配色规则？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '单色配色最安全，适合需要统一感的场景；类比配色自然和谐，适合柔和主题；互补配色对比强烈，适合需要突出重点的设计。'
                }
              },
              {
                '@type': 'Question',
                name: '生成的颜色可以直接用于网页设计吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '完全可以。所有颜色都是标准的十六进制格式，可以直接用于HTML、CSS、设计软件等。'
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
const selectedRule = ref('analogous')
const colorInput = ref(null)
const isSeoContentVisible = ref(true)

const colorRules = [
  { id: 'monochromatic', name: '单色', count: 5 },
  { id: 'analogous', name: '类比', count: 5 },
  { id: 'complementary', name: '互补', count: 4 },
  { id: 'split', name: '分裂互补', count: 4 },
  { id: 'triadic', name: '三角色', count: 4 },
  { id: 'tetradic', name: '四角色', count: 5 },
  { id: 'compound', name: '复合', count: 5 },
  { id: 'shades', name: '深浅', count: 6 }
]

const presets = [
  { name: '日落', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF'] },
  { name: '海洋', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#023E8A'] },
  { name: '森林', colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'] },
  { name: '薰衣草', colors: ['#7400B8', '#6930C3', '#5E60CE', '#5390D9', '#4EA8DE'] },
  { name: '暖阳', colors: ['#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF'] },
  { name: '大地', colors: ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'] }
]

// 图标映射
const iconMap = {
  Palette, Droplets, Sparkles, Eye, Pipette, Sun, Moon, Type, Image, Copy
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'color-palette-generator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'gradient-text-generator'),
    tools.find(t => t.id === 'tailwind-color-palette'),
    tools.find(t => t.id === 'material-design-colors'),
    tools.find(t => t.id === 'color-naming-tool')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const paletteColors = computed(() => {
  return generatePalette(baseColor.value, selectedRule.value)
})

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const toHex = (n) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function generatePalette(hex, rule) {
  const [h, s, l] = hexToHsl(hex)
  let colors = []

  switch (rule) {
    case 'monochromatic':
      colors = [
        [h, s, Math.max(10, l - 30)],
        [h, s, Math.max(20, l - 15)],
        [h, s, l],
        [h, s, Math.min(95, l + 15)],
        [h, s, Math.min(90, l + 30)]
      ]
      break
    case 'analogous':
      colors = [
        [(h - 30 + 360) % 360, s, l],
        [(h - 15 + 360) % 360, s, l],
        [h, s, l],
        [(h + 15) % 360, s, l],
        [(h + 30) % 360, s, l]
      ]
      break
    case 'complementary':
      colors = [
        [h, s, Math.max(20, l - 20)],
        [h, s, l],
        [(h + 180) % 360, s, l],
        [(h + 180) % 360, s, Math.min(80, l + 20)]
      ]
      break
    case 'split':
      colors = [
        [h, s, l],
        [(h + 150) % 360, s, l],
        [(h + 210) % 360, s, l],
        [(h + 180) % 360, s, Math.min(80, l + 20)]
      ]
      break
    case 'triadic':
      colors = [
        [h, s, l],
        [(h + 120) % 360, s, l],
        [(h + 240) % 360, s, l],
        [h, s, Math.max(20, l - 20)]
      ]
      break
    case 'tetradic':
      colors = [
        [h, s, l],
        [(h + 90) % 360, s, l],
        [(h + 180) % 360, s, l],
        [(h + 270) % 360, s, l],
        [h, s, Math.min(80, l + 20)]
      ]
      break
    case 'compound':
      colors = [
        [h, s, l],
        [(h + 30) % 360, s, l],
        [(h + 30) % 360, s, Math.min(80, l + 25)],
        [(h + 160) % 360, s, l],
        [(h + 180) % 360, s, Math.min(70, l + 15)]
      ]
      break
    case 'shades':
      colors = [
        [h, s, Math.max(10, l - 40)],
        [h, s, Math.max(20, l - 25)],
        [h, s, Math.max(30, l - 10)],
        [h, s, l],
        [h, s, Math.min(90, l + 15)],
        [h, s, Math.min(95, l + 30)]
      ]
      break
  }

  return colors.map(([h, s, l]) => hslToHex(h, s, l))
}

function isLightColor(hex) {
  const [, , l] = hexToHsl(hex)
  return l > 50
}

function randomColor() {
  const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()
  baseColor.value = hex
}

function applyPreset(preset) {
  baseColor.value = preset.colors[0]
}

async function copyColor(color) {
  try {
    await navigator.clipboard.writeText(color)
    alert(`已复制: ${color}`)
  } catch {}
}

async function copyPalette() {
  const css = paletteColors.value.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')
  const text = `:root {\n${css}\n}`
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制CSS变量')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
