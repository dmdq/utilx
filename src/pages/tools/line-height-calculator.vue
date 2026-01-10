<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">行高计算器 - 垂直节奏工具</h1>
      <p class="text-muted-foreground">一款专业的在线行高计算工具。根据字号自动计算合适的行高，保持垂直节奏一致。支持网格对齐、多种比例预设、常用字号对照表，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 设置面板 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算设置</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">字号 (px)</label>
              <input v-model.number="fontSize" type="number" min="8" max="72" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">行高比例</label>
              <input v-model.number="lineHeightRatio" type="number" min="1" max="3" step="0.05" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2">
              <div class="grid grid-cols-4 gap-2">
                <button @click="lineHeightRatio = 1.2" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">1.2</button>
                <button @click="lineHeightRatio = 1.4" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">1.4</button>
                <button @click="lineHeightRatio = 1.5" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">1.5</button>
                <button @click="lineHeightRatio = 1.6" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">1.6</button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">基准网格 (px)</label>
              <input v-model.number="baseGrid" type="number" min="4" max="16" step="2" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            </div>

            <!-- 计算结果 -->
            <div class="p-4 bg-primary/10 rounded-lg">
              <h3 class="text-sm font-medium text-foreground mb-2">计算结果</h3>
              <div class="space-y-1 text-sm text-foreground">
                <div>行高: <span class="font-bold">{{ calculatedLineHeight }}px</span></div>
                <div>对齐网格: <span class="font-bold">{{ gridLines }}行</span></div>
                <div>实际比例: <span class="font-bold">{{ actualRatio.toFixed(2) }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">预览</label>
          <button
            @click="copyCSS"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
          >
            复制CSS
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1 flex flex-col">
          <div class="space-y-4 flex-1">
            <!-- 文字预览 -->
            <div>
              <div class="text-sm text-muted-foreground mb-2">文字预览</div>
              <div
                class="p-4 bg-muted rounded-lg"
                :style="{ fontSize: fontSize + 'px', lineHeight: calculatedLineHeight + 'px' }"
              >
                <p>这是一段示例文字，用于展示行高效果。行高对于提升文本可读性非常重要，合适的行高可以让文本更易于阅读。良好的行高还能保持视觉上的平衡。</p>
                <p>第二段文字继续展示行高的效果。当行高设置合适时，文本会呈现出舒适的呼吸感，让阅读体验更加愉悦。</p>
              </div>
            </div>

            <!-- 网格预览 -->
            <div>
              <div class="text-sm text-muted-foreground mb-2">网格对齐 (每格{{ baseGrid }}px)</div>
              <div
                class="p-4 bg-muted rounded-lg relative overflow-hidden"
                :style="{
                  backgroundImage: 'linear-gradient(to bottom, rgba(100,100,100,0.1) 1px, transparent 1px)',
                  backgroundSize: `100% ${baseGrid}px`
                }"
              >
                <div :style="{ fontSize: fontSize + 'px', lineHeight: calculatedLineHeight + 'px' }">
                  <p>文字应该对齐网格线，这样可以保持垂直节奏的一致性。合理的垂直间距是排版设计的重要基础。</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-muted rounded-lg">
            <pre class="text-sm font-mono text-foreground"><code>line-height: {{ calculatedLineHeight }}px;</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 常用字号行高对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-xl font-semibold text-foreground mb-4">常用字号行高对照表</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-2 text-left text-foreground">字号</th>
              <th class="px-4 py-2 text-left text-foreground">紧凑 (1.2)</th>
              <th class="px-4 py-2 text-left text-foreground">标准 (1.4)</th>
              <th class="px-4 py-2 text-left text-foreground">舒适 (1.5)</th>
              <th class="px-4 py-2 text-left text-foreground">宽松 (1.6)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="size in commonSizes" :key="size" class="border-t border-border">
              <td class="px-4 py-2 font-medium text-foreground">{{ size }}px</td>
              <td class="px-4 py-2 text-muted-foreground">{{ Math.round(size * 1.2) }}px</td>
              <td class="px-4 py-2 text-muted-foreground">{{ Math.round(size * 1.4) }}px</td>
              <td class="px-4 py-2 text-muted-foreground">{{ Math.round(size * 1.5) }}px</td>
              <td class="px-4 py-2 text-muted-foreground">{{ Math.round(size * 1.6) }}px</td>
            </tr>
          </tbody>
        </table>
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
          什么是 Line Height？
        </h2>
        <p class="text-muted-foreground mb-4">
          Line Height（行高）是CSS中的一个属性，用于控制文本行之间的垂直间距。
          行高不仅影响文本的可读性，还决定了页面的垂直节奏。合理的行高可以让文本更加舒适易读，
          提升用户的阅读体验。行高通常以字号的比例来设置，如1.5倍字号等。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          垂直节奏的重要性
        </h2>
        <p class="text-muted-foreground mb-4">
          垂直节奏是指页面元素在垂直方向上的排列规律。通过使用统一的基准网格和合适的行高，
          可以让页面的排版更加和谐统一。良好的垂直节奏能够：
        </p>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>提升文本可读性和阅读舒适度</li>
          <li>创造视觉上的平衡感和层次感</li>
          <li>让页面看起来更加专业和精致</li>
          <li>帮助用户更好地理解和浏览内容</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是理想的行高比例？</h3>
            <p class="text-muted-foreground mt-1">
              对于正文文本，通常建议使用1.4到1.6之间的行高比例。1.5是最常用的选择，
              在可读性和空间利用之间取得了很好的平衡。标题可以使用较小的比例（1.2-1.3），
              而长篇文章可能需要更大的比例（1.6-1.8）来提升阅读舒适度。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是基准网格？</h3>
            <p class="text-muted-foreground mt-1">
              基准网格是设计中用来对齐元素的垂直间距单位。常见的基准网格值是8px或4的倍数。
              通过将行高对齐到基准网格，可以确保页面上的各种元素在垂直方向上保持一致的间距关系，
              创造出更加和谐的视觉效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">行高应该使用什么单位？</h3>
            <p class="text-muted-foreground mt-1">
              推荐使用无单位的纯数字（如1.5）或em单位。无单位的行高会相对于元素的字体大小计算，
              这是最灵活和推荐的方式。避免使用px单位，因为它不会随字体大小变化而自动调整。
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
import { HelpCircle, ChevronUp, AlignVerticalSpaceBetween, Ruler } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '行高计算器 - 垂直节奏工具 | Util工具箱',
  description: '免费在线行高计算工具，根据字号自动计算合适的行高，保持垂直节奏一致。支持网格对齐、多种比例预设、常用字号对照表。',
  keywords: '行高,line-height,垂直节奏,排版,字体,CSS工具,在线设计工具',
  author: 'Util工具箱',
  ogTitle: '行高计算器 - 垂直节奏工具',
  ogDescription: '专业的在线行高计算工具，根据字号自动计算合适的行高。',
  ogImage: 'https://www.util.cn/images/tools/line-height-calculator.png',
  ogUrl: 'https://www.util.cn/tools/line-height-calculator',
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
            name: '行高计算器',
            description: '在线行高计算工具，根据字号计算合适的行高',
            url: 'https://www.util.cn/tools/line-height-calculator',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '自动计算行高',
              '网格对齐',
              '多种比例预设',
              '常用字号对照表',
              '一键复制CSS'
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
                name: '行高计算器',
                item: 'https://www.util.cn/tools/line-height-calculator'
              }
            ]
          }
        ]
      })
    }
  ]
})

const fontSize = ref(16)
const lineHeightRatio = ref(1.5)
const baseGrid = ref(8)
const commonSizes = [12, 14, 16, 18, 20, 24, 30, 36, 48]
const isSeoContentVisible = ref(true)

const calculatedLineHeight = computed(() => {
  const raw = fontSize.value * lineHeightRatio.value
  // 对齐到基准网格
  return Math.round(raw / baseGrid.value) * baseGrid.value
})

const gridLines = computed(() => {
  return calculatedLineHeight.value / baseGrid.value
})

const actualRatio = computed(() => {
  return calculatedLineHeight.value / fontSize.value
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`line-height: ${calculatedLineHeight.value}px;`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap = {
  AlignVerticalSpaceBetween, Ruler
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'line-height-calculator'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'letter-spacing-tool'),
    tools.find(t => t.id === 'typography-scale'),
    tools.find(t => t.id === 'golden-ratio-calculator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
