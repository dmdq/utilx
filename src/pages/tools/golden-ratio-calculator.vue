<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">黄金比例计算器 - 设计比例工具</h1>
      <p class="text-muted-foreground">一款专业的在线黄金比例计算工具。计算黄金分割点、生成和谐的字体系列和间距系统。可视化预览、一键复制CSS代码，适用于版式设计和字体层级规划，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 计算器 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">黄金比例计算</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-4">
            <!-- 输入 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输入基础尺寸 (px)</label>
              <div class="flex gap-2">
                <input
                  v-model.number="baseSize"
                  type="number"
                  min="1"
                  class="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculate"
                >
                <button @click="calculate" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">计算</button>
              </div>
            </div>

            <!-- 方向选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">分割方向</label>
              <div class="flex gap-2">
                <button
                  @click="direction = 'horizontal'"
                  :class="['flex-1 px-4 py-2 rounded-lg transition-colors', direction === 'horizontal' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground']"
                >
                  水平分割
                </button>
                <button
                  @click="direction = 'vertical'"
                  :class="['flex-1 px-4 py-2 rounded-lg transition-colors', direction === 'vertical' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground']"
                >
                  垂直分割
                </button>
              </div>
            </div>
          </div>

          <!-- 结果展示 -->
          <div class="mt-6">
            <h3 class="text-sm font-medium text-foreground mb-3">计算结果</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-primary/10 rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">较大段</div>
                <div class="text-2xl font-bold text-foreground">{{ largerSection }}px</div>
                <div class="text-xs text-muted-foreground mt-1">{{ (largerSection / baseSize * 100).toFixed(1) }}%</div>
              </div>
              <div class="p-4 bg-primary/10 rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">较小段</div>
                <div class="text-2xl font-bold text-foreground">{{ smallerSection }}px</div>
                <div class="text-xs text-muted-foreground mt-1">{{ (smallerSection / baseSize * 100).toFixed(1) }}%</div>
              </div>
            </div>
          </div>

          <!-- 比例说明 -->
          <div class="mt-6 p-4 bg-muted rounded-lg">
            <h3 class="text-sm font-medium text-foreground mb-2">黄金比例 (φ)</h3>
            <div class="text-sm text-muted-foreground space-y-1">
              <div>φ ≈ 1.6180339887...</div>
              <div>公式: 较大段 / 较小段 = φ</div>
              <div class="text-xs mt-2">黄金比例被广泛用于艺术、建筑和设计中，被认为是最美感的比例关系。</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 可视化预览 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">可视化预览</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1 flex flex-col">
          <!-- 黄金分割线 -->
          <div class="p-4 bg-muted rounded-lg mb-4">
            <div
              class="relative bg-primary/30 rounded-lg overflow-hidden"
              :style="direction === 'horizontal' ? { height: '100px', width: '100%' } : { height: '200px', width: '100px', margin: '0 auto' }"
            >
              <!-- 分割线 -->
              <div
                class="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-lg"
                :style="direction === 'horizontal' ? { left: (largerSection / baseSize * 100) + '%' } : { left: '50%', top: (largerSection / baseSize * 100) + '%' }"
              ></div>

              <!-- 标签 -->
              <div
                class="absolute top-1/2 -translate-y-1/2 text-foreground text-sm font-bold"
                :style="direction === 'horizontal' ? { left: '25%' } : { left: '50%', top: '25%', transform: 'translate(-50%, -50%)' }"
              >
                {{ largerSection }}px
              </div>
              <div
                class="absolute top-1/2 -translate-y-1/2 text-foreground text-sm font-bold"
                :style="direction === 'horizontal' ? { right: '25%' } : { left: '50%', bottom: '25%', transform: 'translate(-50%, 50%)' }"
              >
                {{ smallerSection }}px
              </div>
            </div>
          </div>

          <!-- 黄金螺旋 -->
          <div class="p-4 bg-muted rounded-lg flex-1">
            <h3 class="text-sm font-medium text-foreground mb-3 text-center">黄金螺旋</h3>
            <svg viewBox="0 0 200 200" class="w-full h-auto">
              <!-- 黄金矩形 -->
              <rect x="10" y="10" width="180" height="180" fill="none" stroke="currentColor" stroke-width="2" class="text-primary"/>

              <!-- 分割线 -->
              <line x1="121" y1="10" x2="121" y2="190" stroke="currentColor" stroke-width="1" stroke-dasharray="4" class="text-muted-foreground"/>

              <!-- 螺旋线 -->
              <path d="M 10 10 Q 10 190 190 190" fill="none" stroke="url(#gradient)" stroke-width="3"/>

              <!-- 渐变定义 -->
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(168, 85, 247);stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 字体尺寸系统 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">黄金比例字体系统</h2>
      <p class="text-sm text-muted-foreground mb-4">基于黄金比例生成和谐的字体尺寸层级</p>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(size, index) in fontSizes"
          :key="index"
          class="p-4 bg-muted rounded-lg"
        >
          <div class="text-sm text-muted-foreground mb-1">{{ size.label }}</div>
          <div :style="{ fontSize: size.value + 'px' }" class="font-bold text-foreground">
            {{ size.value }}px
          </div>
          <div class="text-xs text-muted-foreground mt-1">{{ size.scale }}</div>
        </div>
      </div>
    </div>

    <!-- 间距系统 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-xl font-semibold text-foreground mb-4">黄金比例间距系统</h2>
      <p class="text-sm text-muted-foreground mb-4">基于黄金比例生成统一的间距系统</p>

      <div class="grid md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div
          v-for="(spacing, index) in spacings"
          :key="index"
          class="flex flex-col items-center p-4 bg-muted rounded-lg"
        >
          <div
            class="bg-primary rounded"
            :style="{ width: spacing.value + 'px', height: spacing.value + 'px' }"
          ></div>
          <div class="text-sm font-mono mt-2 text-foreground">{{ spacing.value }}px</div>
          <div class="text-xs text-muted-foreground">{{ spacing.label }}</div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 bg-card border border-border relative">
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
          什么是黄金比例？
        </h2>
        <p class="text-muted-foreground mb-4">
          黄金比例（Golden Ratio），用希腊字母φ表示，约等于1.618。
          它是一个无理数，定义为将一条线段分为两部分，使较长部分与整体的比值等于较短部分与较长部分的比值。
          这个比例在自然界、艺术、建筑和设计中广泛存在，被认为是最美感的比例关系。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          黄金比例在设计中的应用
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>字体排版</strong>: 使用黄金比例确定不同级别标题的字号关系</li>
          <li><strong>布局设计</strong>: 将页面内容按黄金比例分割，创造和谐的视觉平衡</li>
          <li><strong>间距系统</strong>: 基于黄金比例生成统一的间距规范</li>
          <li><strong>Logo设计</strong>: 许多经典Logo都运用了黄金比例原理</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">黄金比例的具体数值是多少？</h3>
            <p class="text-muted-foreground mt-1">
              黄金比例的精确值是(1+√5)/2，约等于1.6180339887...
              在实际应用中，通常使用1.618作为近似值就足够了。
              这个比例在自然界中随处可见，如贝壳的螺旋、向日葵的种子排列等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何使用黄金比例设计字体系统？</h3>
            <p class="text-muted-foreground mt-1">
              选择一个基础字号（如16px），然后用黄金比例乘以或除以这个值来生成其他字号。
              例如：16px × 1.618 ≈ 26px（作为标题字号），16px ÷ 1.618 ≈ 10px（作为小字）。
              这样可以创造出和谐统一的字体层级。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">黄金比例适合所有设计场景吗？</h3>
            <p class="text-muted-foreground mt-1">
              虽然黄金比例具有很强的美感，但不是所有场景都必须严格遵循它。
              它可以作为一个很好的起点和参考，但也要考虑具体的使用场景、可读性要求和其他设计因素。
              有时稍作调整可能会有更好的效果。
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
import { HelpCircle, ChevronUp, Divide, Ruler } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '黄金比例计算器 - 设计比例工具 | Util工具箱',
  description: '免费在线黄金比例计算工具，计算黄金分割点、生成和谐的字体系列和间距系统。可视化预览、一键复制CSS代码，适用于版式设计和字体层级规划。',
  keywords: '黄金比例,golden ratio,phi,分割,设计比例,排版,字体层级',
  author: 'Util工具箱',
  ogTitle: '黄金比例计算器 - 设计比例工具',
  ogDescription: '专业的在线黄金比例计算工具，计算黄金分割点，生成和谐的字体系列和间距系统。',
  ogImage: 'https://www.util.cn/images/tools/golden-ratio-calculator.png',
  ogUrl: 'https://www.util.cn/tools/golden-ratio-calculator',
  ogType: 'website'
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
            name: '黄金比例计算器',
            description: '在线黄金比例计算工具，计算黄金分割点',
            url: 'https://www.util.cn/tools/golden-ratio-calculator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '黄金分割计算',
              '可视化预览',
              '字体系统生成',
              '间距系统生成',
              '黄金螺旋展示'
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
                name: '黄金比例计算器',
                item: 'https://www.util.cn/tools/golden-ratio-calculator'
              }
            ]
          }
        ]
      })
    }
  ]
})

const baseSize = ref(400)
const direction = ref('horizontal')
const isSeoContentVisible = ref(true)

const PHI = 1.6180339887

const largerSection = computed(() => {
  return Math.round(baseSize.value / PHI)
})

const smallerSection = computed(() => {
  return Math.round(baseSize.value - largerSection.value)
})

const fontSizes = computed(() => {
  const base = 16
  const sizes = []
  let current = base

  for (let i = 0; i < 6; i++) {
    const labels = ['Body', 'Lead', 'H3', 'H2', 'H1', 'Display']
    sizes.push({
      label: labels[i] || `Level ${i + 1}`,
      value: Math.round(current),
      scale: `× φ^${i}`
    })
    current *= PHI
  }

  return sizes
})

const spacings = computed(() => {
  const base = 8
  const spaces = []
  let current = base

  for (let i = 0; i < 8; i++) {
    const labels = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']
    spaces.push({
      label: labels[i] || `${i}`,
      value: Math.round(current)
    })
    current *= PHI
  }

  return spaces
})

function calculate() {
  // 触发computed重新计算
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap = {
  Divide, Ruler
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'golden-ratio-calculator'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'typography-scale'),
    tools.find(t => t.id === 'line-height-calculator'),
    tools.find(t => t.id === 'letter-spacing-tool')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
