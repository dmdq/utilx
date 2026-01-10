<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">字间距工具 - letter-spacing可视化</h1>
      <p class="text-muted-foreground">一款专业的在线字间距调整工具。实时预览 letter-spacing 效果、快捷预设、一键复制CSS代码。适用于网页排版和字体设计，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 设置区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">设置</label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">字间距 (em)</label>
              <input v-model.number="letterSpacing" type="number" min="-0.1" max="0.5" step="0.005" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快捷预设</label>
              <div class="grid grid-cols-4 gap-2">
                <button @click="letterSpacing = -0.02" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">-0.02</button>
                <button @click="letterSpacing = 0" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">0</button>
                <button @click="letterSpacing = 0.05" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">0.05</button>
                <button @click="letterSpacing = 0.1" class="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-foreground transition-colors">0.1</button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">字号 (px)</label>
              <input v-model.number="fontSize" type="number" min="12" max="72" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">文本</label>
              <textarea v-model="sampleText" rows="3" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
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
          <div
            class="p-6 bg-muted rounded-lg min-h-[200px] flex-1 flex items-center justify-center"
            :style="{ fontSize: fontSize + 'px', letterSpacing: letterSpacing + 'em' }"
          >
            {{ sampleText }}
          </div>

          <div class="mt-4 p-4 bg-muted rounded-lg">
            <pre class="text-sm font-mono text-foreground"><code>letter-spacing: {{ letterSpacing }}em;</code></pre>
          </div>
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
          什么是 Letter Spacing？
        </h2>
        <p class="text-muted-foreground mb-4">
          Letter Spacing（字间距）是CSS中的一个属性，用于控制文本字符之间的间距。
          通过调整字间距，可以改善文本的可读性，创造独特的视觉风格，或者在有限的空间内优化排版。
          合理的字间距能让文字更加舒适易读，提升整体设计质感。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入或选择字间距值（单位为em）</li>
          <li>使用快捷预设快速尝试常用字间距</li>
          <li>调整字号和文本内容查看效果</li>
          <li>实时预览效果，满意后点击"复制CSS"按钮</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          Letter Spacing 使用技巧
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>大写字母</strong>: 全大写文字通常需要增加字间距以提高可读性</li>
          <li><strong>标题设计</strong>: 标题可以适当增加字间距，营造现代感</li>
          <li><strong>紧凑空间</strong>: 负值字间距可以在有限空间内容纳更多文字</li>
          <li><strong>单位选择</strong>: 使用em单位可以根据字体大小自动调整</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">字间距应该使用什么单位？</h3>
            <p class="text-muted-foreground mt-1">
              推荐使用em单位，因为它会相对于字体大小自动调整。当字体大小改变时，
              em单位的字间距也会按比例缩放，保持视觉一致性。也可以使用px或rem，但需要手动调整。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么时候应该使用负值字间距？</h3>
            <p class="text-muted-foreground mt-1">
              负值字间距适用于需要紧凑设计的场景，如大号标题、LOGO文字、或者空间有限的UI元素。
              但要注意，过大的负值会影响可读性，应谨慎使用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何为中英文混排设置字间距？</h3>
            <p class="text-muted-foreground mt-1">
              中文字符通常比英文字符更方正，可能需要不同的字间距。
              可以考虑为不同语言设置不同的字间距，或者使用适中的折中值。
              英文通常需要稍大的字间距以保持可读性。
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
import { HelpCircle, ChevronUp, Type, Heading1, Minus, Plus } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '字间距工具 - letter-spacing可视化 | Util工具箱',
  description: '免费在线字间距调整工具，实时预览letter-spacing效果、快捷预设、一键复制CSS代码。适用于网页排版和字体设计，纯本地计算。',
  keywords: 'letter-spacing,字间距,字距,CSS字体,字体间距,排版工具,在线设计工具',
  author: 'Util工具箱',
  ogTitle: '字间距工具 - letter-spacing可视化',
  ogDescription: '专业的在线字间距调整工具，实时预览letter-spacing效果。',
  ogImage: 'https://www.util.cn/images/tools/letter-spacing-tool.png',
  ogUrl: 'https://www.util.cn/tools/letter-spacing-tool',
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
            name: '字间距工具',
            description: '在线字间距调整工具，实时预览letter-spacing效果',
            url: 'https://www.util.cn/tools/letter-spacing-tool',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '实时预览效果',
              '快捷预设',
              '一键复制CSS',
              '字号调整',
              '自定义文本'
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
                name: '字间距工具',
                item: 'https://www.util.cn/tools/letter-spacing-tool'
              }
            ]
          }
        ]
      })
    }
  ]
})

const letterSpacing = ref(0)
const fontSize = ref(24)
const sampleText = ref('Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.')
const isSeoContentVisible = ref(true)

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`letter-spacing: ${letterSpacing.value}em;`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap = {
  Type, Heading1, Minus, Plus
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'letter-spacing-tool'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'line-height-calculator'),
    tools.find(t => t.id === 'typography-scale'),
    tools.find(t => t.id === 'text-shadow-generator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})
</script>
