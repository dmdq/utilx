<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">颜色对比度检查 - WCAG标准无障碍设计工具</h1>
      <p class="text-muted-foreground">一款免费的在线颜色对比度检查工具。支持WCAG 2.1标准，检查前景色和背景色的对比度是否符合无障碍设计要求。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 颜色选择器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 前景色 -->
      <div class="p-6 bg-card border border-border rounded-lg">
        <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: foregroundColor }"></div>
          前景色 (文字颜色)
        </h3>
        <div class="space-y-4">
          <div class="flex gap-2">
            <input
              type="color"
              v-model="foregroundColor"
              class="w-20 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              v-model="foregroundColor"
              class="flex-1 px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="#000000"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in commonColors"
              :key="color"
              @click="foregroundColor = color"
              :class="[
                'w-10 h-10 rounded border-2 cursor-pointer transition-all',
                foregroundColor === color ? 'border-primary' : 'border-border'
              ]"
              :style="{ backgroundColor: color }"
              :title="color"
            ></button>
          </div>
        </div>
      </div>

      <!-- 背景色 -->
      <div class="p-6 bg-card border border-border rounded-lg">
        <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: backgroundColor }"></div>
          背景色
        </h3>
        <div class="space-y-4">
          <div class="flex gap-2">
            <input
              type="color"
              v-model="backgroundColor"
              class="w-20 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              v-model="backgroundColor"
              class="flex-1 px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="#FFFFFF"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in commonColors"
              :key="color"
              @click="backgroundColor = color"
              :class="[
                'w-10 h-10 rounded border-2 cursor-pointer transition-all',
                backgroundColor === color ? 'border-primary' : 'border-border'
              ]"
              :style="{ backgroundColor: color }"
              :title="color"
            ></button>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="mb-8 p-6 bg-card border border-border rounded-lg">
      <h3 class="text-lg font-semibold text-foreground mb-4">实时预览</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 文字预览 -->
        <div
          class="p-8 rounded-lg transition-colors"
          :style="{ backgroundColor, color: foregroundColor }"
        >
          <h4 class="text-2xl font-bold mb-3">示例标题</h4>
          <p class="mb-3">这是一段示例文本，用于展示颜色搭配效果。Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <a href="#" class="underline hover:no-underline">这是一个链接示例</a>
        </div>

        <!-- UI组件预览 -->
        <div
          class="p-8 rounded-lg transition-colors"
          :style="{ backgroundColor }"
        >
          <div class="space-y-4">
            <button
              class="px-4 py-2 rounded border transition-colors"
              :style="{
                color: foregroundColor,
                borderColor: foregroundColor,
                backgroundColor: 'transparent'
              }"
            >
              按钮样式
            </button>
            <button
              class="px-4 py-2 rounded transition-colors"
              :style="{
                color: backgroundColor,
                backgroundColor: foregroundColor
              }"
            >
              填充按钮
            </button>
            <input
              type="text"
              placeholder="输入框示例"
              class="w-full px-3 py-2 rounded border transition-colors"
              :style="{
                color: foregroundColor,
                borderColor: foregroundColor,
                backgroundColor: 'transparent'
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 对比度结果 -->
    <div class="mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 对比度比值 -->
        <div class="p-6 bg-card border border-border rounded-lg text-center">
          <div class="text-3xl font-bold mb-2" :class="contrastRatioColor">
            {{ contrastRatio.toFixed(2) }}:1
          </div>
          <div class="text-sm text-muted-foreground">对比度比值</div>
        </div>

        <!-- WCAG AA 标准 -->
        <div
          class="p-6 border rounded-lg text-center transition-all"
          :class="[
            wcagaAA.pass ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-red-50 border-red-200 dark:bg-red-900/20'
          ]"
        >
          <div class="flex items-center justify-center gap-2 mb-2">
            <component
              :is="wcagaAA.pass ? Check : X"
              :class="[
                'w-6 h-6',
                wcagaAA.pass ? 'text-green-600' : 'text-red-600'
              ]"
            />
            <span class="text-2xl font-bold" :class="wcagaAA.pass ? 'text-green-600' : 'text-red-600'">
              WCAG AA
            </span>
          </div>
          <div class="text-sm text-muted-foreground">
            {{ wcagaAA.text }}
          </div>
        </div>

        <!-- WCAG AAA 标准 -->
        <div
          class="p-6 border rounded-lg text-center transition-all"
          :class="[
            wcagaAAA.pass ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-red-50 border-red-200 dark:bg-red-900/20'
          ]"
        >
          <div class="flex items-center justify-center gap-2 mb-2">
            <component
              :is="wcagaAAA.pass ? Check : X"
              :class="[
                'w-6 h-6',
                wcagaAAA.pass ? 'text-green-600' : 'text-red-600'
              ]"
            />
            <span class="text-2xl font-bold" :class="wcagaAAA.pass ? 'text-green-600' : 'text-red-600'">
              WCAG AAA
            </span>
          </div>
          <div class="text-sm text-muted-foreground">
            {{ wcagaAAA.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- 颜色建议 -->
    <div class="mb-8 p-6 bg-card border border-border rounded-lg">
      <h3 class="text-lg font-semibold text-foreground mb-4">颜色调整建议</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 亮化前景色 -->
        <div>
          <h4 class="font-medium text-foreground mb-3">亮化前景色</h4>
          <div class="space-y-2">
            <div
              v-for="lighter in lighterForegroundColors"
              :key="lighter"
              @click="foregroundColor = lighter"
              class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors"
            >
              <div
                class="w-8 h-8 rounded border"
                :style="{ backgroundColor: lighter, borderColor: backgroundColor }"
              ></div>
              <div class="flex-1">
                <div class="text-sm font-mono">{{ lighter }}</div>
                <div class="text-xs text-muted-foreground">
                  对比度: {{ calculateContrast(lighter, backgroundColor).toFixed(2) }}:1
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 深化前景色 -->
        <div>
          <h4 class="font-medium text-foreground mb-3">深化前景色</h4>
          <div class="space-y-2">
            <div
              v-for="darker in darkerForegroundColors"
              :key="darker"
              @click="foregroundColor = darker"
              class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors"
            >
              <div
                class="w-8 h-8 rounded border"
                :style="{ backgroundColor: darker, borderColor: backgroundColor }"
              ></div>
              <div class="flex-1">
                <div class="text-sm font-mono">{{ darker }}</div>
                <div class="text-xs text-muted-foreground">
                  对比度: {{ calculateContrast(darker, backgroundColor).toFixed(2) }}:1
                </div>
              </div>
            </div>
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
          什么是颜色对比度？
        </h2>
        <p class="text-muted-foreground mb-4">
          颜色对比度是衡量文本与背景之间颜色差异程度的指标，通常以比例值表示（如 4.5:1）。
          良好的对比度对于确保内容可读性至关重要，特别是对于视力障碍用户。
        </p>
        <p class="text-muted-foreground">
          WCAG（Web内容无障碍指南）制定了国际公认的对比度标准，帮助开发者创建无障碍的网页设计。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          WCAG 标准要求
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">WCAG AA 级别</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 普通文本：至少 4.5:1</li>
              <li>• 大文本（18pt+或14pt粗体）：至少 3:1</li>
              <li>• 非文本元素：至少 3:1</li>
              <li>• 这是合规的最低要求</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">WCAG AAA 级别</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 普通文本：至少 7:1</li>
              <li>• 大文本（18pt+或14pt粗体）：至少 4.5:1</li>
              <li>• 提供更好的可读性</li>
              <li>• 建议用于重要内容</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          对比度计算方法
        </h2>
        <div class="p-4 bg-muted/30 rounded-lg mb-6">
          <p class="text-sm text-muted-foreground mb-2">
            对比度使用以下公式计算：
          </p>
          <code class="block p-2 bg-background rounded text-sm">
            (L1 + 0.05) / (L2 + 0.05)
          </code>
          <p class="text-sm text-muted-foreground mt-2">
            其中 L1 是较亮颜色的相对亮度，L2 是较暗颜色的相对亮度。
            相对亮度定义为 0（纯黑）到 1（纯白）之间的值。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          最佳实践建议
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>优先使用文本对比度</strong>：确保主要文本内容达到 AA 标准</li>
          <li><strong>考虑大文本例外</strong>：大字体可以使用较低的对比度</li>
          <li><strong>避免仅依赖颜色</strong>：不要仅用颜色传达信息</li>
          <li><strong>测试不同场景</strong>：考虑不同的显示设备和环境光条件</li>
          <li><strong>提供高对比模式</strong>：为用户提供切换高对比度的选项</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见颜色组合
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div
            v-for="combo in recommendedCombos"
            :key="`${combo.foreground}-${combo.background}`"
            @click="foregroundColor = combo.foreground; backgroundColor = combo.background"
            class="p-3 rounded cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            :style="{ backgroundColor: combo.background }"
          >
            <div :style="{ color: combo.foreground }" class="font-medium text-sm mb-1">
              {{ combo.name }}
            </div>
            <div :style="{ color: combo.foreground }" class="text-xs">
              {{ combo.contrast.toFixed(1) }}:1
            </div>
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
          :to="`/tools/${relatedTool.id}/`"
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Check, X, Palette, Eye,
  Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Code, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO 配置
useSeoMeta({
  title: '颜色对比度检查 - WCAG标准无障碍设计工具',
  description: '免费在线颜色对比度检查工具，支持WCAG 2.1标准，检查前景色和背景色的对比度是否符合无障碍设计要求。纯本地计算，数据安全。',
  keywords: '颜色对比度, WCAG, 无障碍设计, 色彩搭配, 可访问性, 对比度检查',
  author: 'Util工具箱',
  ogTitle: '颜色对比度检查 - WCAG标准无障碍设计工具',
  ogDescription: '免费在线颜色对比度检查工具，支持WCAG 2.1标准。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Schema.org 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '颜色对比度检查器',
        description: '免费在线颜色对比度检查工具，支持WCAG 2.1标准',
        url: 'https://www.util.cn/tools/color-contrast-checker',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'WCAG标准检查',
          '实时预览',
          '颜色建议',
          '对比度计算',
          '无障碍设计',
          '本地计算'
        ]
      })
    }
  ]
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'color-contrast-checker')
const category = categories.find(c => c.id === 'design')

// 颜色状态
const foregroundColor = ref('#000000')
const backgroundColor = ref('#FFFFFF')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Palette, Check, X, Eye, Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff, Code, FolderOpen,
  GitBranch, ChevronUp, HelpCircle
}

// 常用颜色
const commonColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#90EE90', '#FFB6C1'
]

// 推荐颜色组合
const recommendedCombos = [
  { name: '黑白经典', foreground: '#000000', background: '#FFFFFF', contrast: 21 },
  { name: '深灰白底', foreground: '#333333', background: '#FFFFFF', contrast: 12.63 },
  { name: '白底深蓝', foreground: '#FFFFFF', background: '#0066CC', contrast: 8.59 },
  { name: '白底绿色', foreground: '#FFFFFF', background: '#008000', contrast: 7.39 },
  { name: '黄底黑色', foreground: '#000000', background: '#FFD700', contrast: 13.38 },
  { name: '深蓝浅蓝', foreground: '#003366', background: '#E6F2FF', contrast: 14.79 },
  { name: '紫色黄底', foreground: '#4B0082', background: '#FFFACD', contrast: 13.78 },
  { name: '橙色白底', foreground: '#FF6600', background: '#FFFFFF', contrast: 5.25 }
]

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'color-contrast-checker'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'color-picker'),
    tools.find(t => t.id === 'css-layout-generator'),
    tools.find(t => t.id === 'svg-path-editor'),
    tools.find(t => t.id === 'image-compress')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 将十六进制颜色转换为RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// 计算相对亮度
const calculateLuminance = (rgb) => {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// 计算对比度
const calculateContrast = (color1, color2) => {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return 1

  const l1 = calculateLuminance(rgb1)
  const l2 = calculateLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

// 对比度比值
const contrastRatio = computed(() => {
  return calculateContrast(foregroundColor.value, backgroundColor.value)
})

// 对比度颜色
const contrastRatioColor = computed(() => {
  const ratio = contrastRatio.value
  if (ratio >= 7) return 'text-green-600'
  if (ratio >= 4.5) return 'text-yellow-600'
  if (ratio >= 3) return 'text-orange-600'
  return 'text-red-600'
})

// WCAG AA 检查
const wcagaAA = computed(() => {
  const ratio = contrastRatio.value
  return {
    pass: ratio >= 4.5,
    text: ratio >= 4.5 ? '通过（需要 ≥ 4.5:1）' : `未通过（当前 ${ratio.toFixed(2)}:1）`
  }
})

// WCAG AAA 检查
const wcagaAAA = computed(() => {
  const ratio = contrastRatio.value
  return {
    pass: ratio >= 7,
    text: ratio >= 7 ? '通过（需要 ≥ 7:1）' : `未通过（当前 ${ratio.toFixed(2)}:1）`
  }
})

// 生成亮化的颜色
const lightenColor = (color, amount) => {
  const rgb = hexToRgb(color)
  if (!rgb) return color

  const factor = amount / 100
  const r = Math.round(rgb.r + (255 - rgb.r) * factor)
  const g = Math.round(rgb.g + (255 - rgb.g) * factor)
  const b = Math.round(rgb.b + (255 - rgb.b) * factor)

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// 生成深化的颜色
const darkenColor = (color, amount) => {
  const rgb = hexToRgb(color)
  if (!rgb) return color

  const factor = amount / 100
  const r = Math.round(rgb.r * (1 - factor))
  const g = Math.round(rgb.g * (1 - factor))
  const b = Math.round(rgb.b * (1 - factor))

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// 更亮的颜色建议
const lighterForegroundColors = computed(() => {
  return [15, 30, 45, 60].map(amount => lightenColor(foregroundColor.value, amount))
})

// 更深的颜色建议
const darkerForegroundColors = computed(() => {
  return [15, 30, 45, 60].map(amount => darkenColor(foregroundColor.value, amount))
})

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  router.push(`/tools/${selectedTool.id}/`)
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>