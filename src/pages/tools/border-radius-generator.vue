<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS圆角生成器 - border-radius可视化工具</h1>
      <p class="text-muted-foreground">可视化生成复杂的border-radius，分别设置8个角的圆角。支持拖拽调整、快捷预设和一键复制CSS代码。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">预览</h2>
          <div class="p-8 bg-muted rounded-xl flex items-center justify-center">
            <div
              class="w-64 h-64 flex items-center justify-center shadow-xl bg-primary"
              :style="{ borderRadius: generatedRadius }"
            >
              <div class="text-primary-foreground text-center">
                <div class="text-4xl mb-2">⚡</div>
                <div class="font-bold">Border Radius</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的CSS -->
        <div class="bg-card border border-border rounded-xl p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">CSS代码</h2>
            <button @click="copyCSS" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">复制</button>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <pre class="text-foreground text-sm font-mono overflow-x-auto"><code>border-radius: {{ generatedRadius }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground">圆角设置</h2>
          <button @click="resetRadius" class="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded">重置</button>
        </div>

        <!-- 快捷预设 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-foreground mb-2">快捷预设</h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="preset in quickPresets"
              :key="preset.name"
              @click="applyQuickPreset(preset)"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- 可视化编辑器 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-foreground mb-2">拖拽调整 (px)</h3>
          <div class="relative h-64 bg-accent rounded-xl">
            <!-- 8个角的控制点 -->
            <!-- 左上 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 10%; top: 0;"
              @mousedown="(e) => startDrag(e, 'tl')"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.tl }}
                </div>
                <div class="h-16 w-0.5 bg-primary"></div>
              </div>
            </div>
            <!-- 上中 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 50%; top: 0; transform: translateX(-50%);"
              @mousedown="(e) => startDrag(e, 'tl', 'tr')"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.tl }}/{{ radius.tr }}
                </div>
                <div class="h-16 w-0.5 bg-primary"></div>
              </div>
            </div>
            <!-- 右上 -->
            <div
              class="absolute cursor-ns-resize"
              style="right: 10%; top: 0;"
              @mousedown="(e) => startDrag(e, 'tr')"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.tr }}
                </div>
                <div class="h-16 w-0.5 bg-primary"></div>
              </div>
            </div>

            <!-- 右中 -->
            <div
              class="absolute cursor-ew-resize"
              style="right: 0; top: 50%; transform: translateY(-50%);"
              @mousedown="(e) => startDrag(e, 'tr', 'br')"
            >
              <div class="flex items-center">
                <div class="w-16 h-0.5 bg-primary"></div>
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.tr }}/{{ radius.br }}
                </div>
              </div>
            </div>

            <!-- 右下 -->
            <div
              class="absolute cursor-ns-resize"
              style="right: 10%; bottom: 0;"
              @mousedown="(e) => startDrag(e, 'br')"
            >
              <div class="flex flex-col items-center">
                <div class="h-16 w-0.5 bg-primary"></div>
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.br }}
                </div>
              </div>
            </div>

            <!-- 下中 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 50%; bottom: 0; transform: translateX(-50%);"
              @mousedown="(e) => startDrag(e, 'bl', 'br')"
            >
              <div class="flex flex-col items-center">
                <div class="h-16 w-0.5 bg-primary"></div>
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.bl }}/{{ radius.br }}
                </div>
              </div>
            </div>

            <!-- 左下 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 10%; bottom: 0;"
              @mousedown="(e) => startDrag(e, 'bl')"
            >
              <div class="flex flex-col items-center">
                <div class="h-16 w-0.5 bg-primary"></div>
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.bl }}
                </div>
              </div>
            </div>

            <!-- 左中 -->
            <div
              class="absolute cursor-ew-resize"
              style="left: 0; top: 50%; transform: translateY(-50%);"
              @mousedown="(e) => startDrag(e, 'tl', 'bl')"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg hover:bg-primary/90">
                  {{ radius.tl }}/{{ radius.bl }}
                </div>
                <div class="w-16 h-0.5 bg-primary"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 数值输入 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-foreground">精确输入 (px)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">左上 (Top-Left)</label>
              <input v-model.number="radius.tl" type="number" min="0" max="200" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
            </div>
            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">右上 (Top-Right)</label>
              <input v-model.number="radius.tr" type="number" min="0" max="200" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
            </div>
            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">左下 (Bottom-Left)</label>
              <input v-model.number="radius.bl" type="number" min="0" max="200" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
            </div>
            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">右下 (Bottom-Right)</label>
              <input v-model.number="radius.br" type="number" min="0" max="200" class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
            </div>
          </div>
        </div>

        <!-- 形状预设 -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-foreground mb-2">形状预设</h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="preset in shapePresets"
              :key="preset.name"
              @click="applyShapePreset(preset)"
              class="aspect-square flex items-center justify-center border-2 border-border rounded-lg hover:border-primary transition"
              :title="preset.name"
            >
              <div class="w-12 h-12 bg-primary" :style="{ borderRadius: preset.radius }"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border">
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
          什么是 CSS border-radius？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS border-radius 属性用于设置元素的外边框圆角。通过这个属性，您可以让元素的边角变得圆润，
          创建更加友好和现代化的视觉效果。border-radius 可以接受一个值（所有角相同）、两个值（对角线）、
          三个值或四个值（每个角独立设置）。
        </p>
        <p class="text-muted-foreground mb-4">
          圆角效果在网页设计中非常常见，从简单的按钮到复杂的卡片，都可以通过调整圆角来实现不同的视觉风格。
          合理使用圆角可以让界面看起来更加柔和、现代，提升用户体验。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          border-radius 语法
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>单个值</strong>: border-radius: 10px - 所有四个角都使用相同的圆角</li>
          <li><strong>两个值</strong>: border-radius: 10px 20px - 左上和右下10px，右上和左下20px</li>
          <li><strong>三个值</strong>: border-radius: 10px 20px 30px - 左上10px，右上和左下20px，右下30px</li>
          <li><strong>四个值</strong>: border-radius: 10px 20px 30px 40px - 左上、右上、右下、左下依次设置</li>
          <li><strong>椭圆角</strong>: border-radius: 10px / 20px - 水平半径10px，垂直半径20px</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>使用快捷预设快速应用常见圆角值</li>
          <li>通过拖拽可视化控制器调整各角的圆角大小</li>
          <li>在精确输入框中输入具体的像素值</li>
          <li>选择形状预设应用特定的圆角组合</li>
          <li>点击"复制"按钮获取生成的CSS代码</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">border-radius 支持哪些单位？</h3>
            <p class="text-muted-foreground mt-1">
              border-radius 支持多种长度单位，包括 px（像素）、em（相对于字体大小）、rem（相对于根字体大小）、
              %（百分比，相对于元素尺寸）等。百分比单位特别适合创建圆形或椭圆形的效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何创建完美的圆形？</h3>
            <p class="text-muted-foreground mt-1">
              要创建完美的圆形，需要将 border-radius 设置为 50%。这会让元素的每个角都使用半径为元素宽度或高度一半的圆弧，
              从而形成圆形。注意：元素必须是正方形才能形成完美的圆形。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">border-radius 对所有元素都有效吗？</h3>
            <p class="text-muted-foreground mt-1">
              border-radius 对大多数元素都有效，但有一个例外：当 border-collapse 为 separate 时，
              border-radius 对 table 元素无效。此外，某些旧版浏览器可能需要使用前缀（如 -webkit-border-radius）。
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
import { HelpCircle, ChevronUp, Box, Palette, Eye, Layers } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'CSS圆角生成器 - border-radius可视化工具 | Util工具箱',
  description: '在线CSS border-radius生成工具，可视化生成复杂的圆角效果，支持分别设置8个角的圆角，提供拖拽调整、快捷预设和一键复制功能。',
  keywords: 'border-radius,圆角,CSS圆角,border,圆角生成器,CSS可视化,前端工具,网页设计',
  author: 'Util工具箱',
  ogTitle: 'CSS圆角生成器 - border-radius可视化工具',
  ogDescription: '专业的CSS border-radius生成工具，支持拖拽调整、快捷预设和一键复制CSS代码。',
  ogImage: 'https://www.util.cn/images/tools/border-radius-generator.png',
  ogUrl: 'https://www.util.cn/tools/border-radius-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CSS圆角生成器 - border-radius可视化',
  twitterDescription: '专业的CSS border-radius生成工具，支持拖拽调整、快捷预设和一键复制CSS代码。',
  twitterImage: 'https://www.util.cn/images/tools/border-radius-generator.png'
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
            name: 'CSS圆角生成器',
            description: '在线CSS border-radius可视化生成工具',
            url: 'https://www.util.cn/tools/border-radius-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '可视化拖拽调整',
              '8个角独立设置',
              '快捷预设模板',
              '一键复制CSS',
              '多种形状预设',
              '实时预览效果'
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
                name: 'CSS圆角生成器',
                item: 'https://www.util.cn/tools/border-radius-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'border-radius 支持哪些单位？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'border-radius 支持多种长度单位，包括 px（像素）、em（相对于字体大小）、rem（相对于根字体大小）、%（百分比，相对于元素尺寸）等。'
                }
              },
              {
                '@type': 'Question',
                name: '如何创建完美的圆形？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '要创建完美的圆形，需要将 border-radius 设置为 50%。元素必须是正方形才能形成完美的圆形。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 圆角数据
const radius = ref({
  tl: 16,
  tr: 16,
  bl: 16,
  br: 16
})

const quickPresets = [
  { name: '无圆角', value: 0 },
  { name: '小圆角', value: 4 },
  { name: '中圆角', value: 8 },
  { name: '大圆角', value: 16 },
  { name: '超大', value: 24 },
  { name: '圆形', value: 50 },
  { name: '药丸', value: 9999 }
]

const shapePresets = [
  { name: '圆角矩形', radius: '8px' },
  { name: '完全圆角', radius: '16px' },
  { name: '圆形', radius: '50%' },
  { name: '左圆角', radius: '16px 0 0 16px' },
  { name: '右圆角', radius: '0 16px 16px 0' },
  { name: '上圆角', radius: '16px 16px 0 0' },
  { name: '下圆角', radius: '0 0 16px 16px' },
  { name: '对角', radius: '16px 0 16px 0' }
]

// 图标映射
const iconMap = {
  Box, Palette, Eye, Layers
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'transform-generator'),
    tools.find(t => t.id === 'css-filter-generator'),
    tools.find(t => t.id === 'backdrop-filter-generator'),
    tools.find(t => t.id === 'pro-color-picker')
  ].filter(Boolean)
})

const generatedRadius = computed(() => {
  const { tl, tr, bl, br } = radius.value
  if (tl === tr && tr === bl && bl === br) {
    return `${tl}px`
  }
  return `${tl}px ${tr}px ${br}px ${bl}px`
})

function applyQuickPreset(preset) {
  const value = preset.value === 9999 ? 128 : preset.value
  radius.value = { tl: value, tr: value, bl: value, br: value }
}

function applyShapePreset(preset) {
  const r = preset.radius
  const match = r.match(/^(\d+px|%)\s+(\d+px|%)\s+(\d+px|%)\s+(\d+px|%)$/)
  if (match) {
    radius.value = {
      tl: parseInt(match[1]),
      tr: parseInt(match[2]),
      br: parseInt(match[3]),
      bl: parseInt(match[4])
    }
  } else if (r === '50%') {
    radius.value = { tl: 128, tr: 128, bl: 128, br: 128 }
  } else {
    const match2 = r.match(/^(\d+)px/)
    if (match2) {
      const val = parseInt(match2[1])
      const parts = r.split(' ')
      if (parts.length === 4) {
        radius.value = {
          tl: parseInt(parts[0]),
          tr: parseInt(parts[1]),
          br: parseInt(parts[2]),
          bl: parseInt(parts[3])
        }
      } else {
        radius.value = { tl: val, tr: val, bl: val, br: val }
      }
    }
  }
}

function resetRadius() {
  radius.value = { tl: 16, tr: 16, bl: 16, br: 16 }
}

function startDrag(e, corner1, corner2) {
  const startY = e.clientY
  const startValue = radius.value[corner1]

  const onMouseMove = (moveEvent) => {
    const deltaY = startY - moveEvent.clientY
    const newValue = Math.max(0, Math.min(128, startValue + deltaY / 2))
    radius.value[corner1] = Math.round(newValue)
    if (corner2) {
      radius.value[corner2] = Math.round(newValue)
    }
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

async function copyCSS() {
  const css = `border-radius: ${generatedRadius.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
