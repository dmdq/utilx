<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layout class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">骨架屏生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化拼装骨架屏，导出纯 CSS 的 HTML + CSS 代码</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        添加行、圆形头像块、矩形块与网格块，自由拼出列表页、文章页或卡片页的骨架屏，支持脉冲呼吸与扫光两种加载动画，一键导出类名前缀 sk- 的完整 HTML 与 CSS（无任何依赖），全部在浏览器本地计算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：参数控制 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Wand2 class="w-5 h-5 mr-2 text-primary" /> 预设模板
          </h2>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="p in presets"
              :key="p.value"
              @click="applyPreset(p.value)"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 骨架元素
          </h2>
          <div class="grid grid-cols-4 gap-1.5 mb-4">
            <button
              @click="addElement('line')"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-1.5 rounded text-xs font-medium transition-all"
            >
              + 行
            </button>
            <button
              @click="addElement('avatar')"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-1.5 rounded text-xs font-medium transition-all"
            >
              + 头像
            </button>
            <button
              @click="addElement('rect')"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-1.5 rounded text-xs font-medium transition-all"
            >
              + 矩形
            </button>
            <button
              @click="addElement('grid')"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-1.5 rounded text-xs font-medium transition-all"
            >
              + 网格
            </button>
          </div>

          <p v-if="elements.length === 0" class="text-xs text-muted-foreground text-center py-4">
            点击上方按钮添加骨架元素，或使用预设模板
          </p>

          <div class="space-y-3">
            <div
              v-for="(el, idx) in elements"
              :key="el.id"
              class="bg-muted/40 border border-border rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {{ typeLabels[el.type] }} {{ idx + 1 }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    @click="moveElement(idx, -1)"
                    :disabled="idx === 0"
                    class="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
                    aria-label="上移"
                  >
                    <ChevronUp class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="moveElement(idx, 1)"
                    :disabled="idx === elements.length - 1"
                    class="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
                    aria-label="下移"
                  >
                    <ChevronDown class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="removeElement(idx)"
                    class="p-1 rounded hover:bg-muted text-muted-foreground text-xs px-1.5"
                    aria-label="删除"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div class="space-y-3">
                <div v-if="el.type === 'line' || el.type === 'rect' || el.type === 'grid'">
                  <div class="flex justify-between mb-1">
                    <label class="text-xs text-muted-foreground">宽度</label>
                    <span class="text-xs text-muted-foreground">{{ el.width }}%</span>
                  </div>
                  <input v-model.number="el.width" type="range" min="10" max="100" step="5" class="w-full" />
                </div>

                <div v-if="el.type === 'line'">
                  <div class="flex justify-between mb-1">
                    <label class="text-xs text-muted-foreground">行高</label>
                    <span class="text-xs text-muted-foreground">{{ el.height }}px</span>
                  </div>
                  <input v-model.number="el.height" type="range" min="8" max="32" step="2" class="w-full" />
                </div>

                <div v-if="el.type === 'avatar'">
                  <div class="flex justify-between mb-1">
                    <label class="text-xs text-muted-foreground">头像尺寸</label>
                    <span class="text-xs text-muted-foreground">{{ el.size }}px</span>
                  </div>
                  <input v-model.number="el.size" type="range" min="24" max="96" step="4" class="w-full" />
                </div>

                <div v-if="el.type === 'rect'">
                  <div class="flex justify-between mb-1">
                    <label class="text-xs text-muted-foreground">高度</label>
                    <span class="text-xs text-muted-foreground">{{ el.height }}px</span>
                  </div>
                  <input v-model.number="el.height" type="range" min="40" max="240" step="10" class="w-full" />
                </div>

                <div v-if="el.type === 'grid'" class="grid grid-cols-2 gap-3">
                  <div>
                    <div class="flex justify-between mb-1">
                      <label class="text-xs text-muted-foreground">列数</label>
                      <span class="text-xs text-muted-foreground">{{ el.cols }}</span>
                    </div>
                    <input v-model.number="el.cols" type="range" min="2" max="4" step="1" class="w-full" />
                  </div>
                  <div>
                    <div class="flex justify-between mb-1">
                      <label class="text-xs text-muted-foreground">块高</label>
                      <span class="text-xs text-muted-foreground">{{ el.itemHeight }}px</span>
                    </div>
                    <input v-model.number="el.itemHeight" type="range" min="40" max="160" step="10" class="w-full" />
                  </div>
                  <div class="col-span-2">
                    <div class="flex justify-between mb-1">
                      <label class="text-xs text-muted-foreground">网格间距</label>
                      <span class="text-xs text-muted-foreground">{{ el.gap }}px</span>
                    </div>
                    <input v-model.number="el.gap" type="range" min="4" max="32" step="2" class="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 动画与间距
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">动画类型</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  @click="animation = 'none'"
                  :class="animation === 'none' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  无
                </button>
                <button
                  @click="animation = 'pulse'"
                  :class="animation === 'pulse' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  脉冲
                </button>
                <button
                  @click="animation = 'shimmer'"
                  :class="animation === 'shimmer' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  扫光
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">脉冲为透明度呼吸，扫光为渐变高光扫过</p>
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">元素间距</label>
                <span class="text-sm text-muted-foreground">{{ containerGap }}px</span>
              </div>
              <input v-model.number="containerGap" type="range" min="4" max="32" step="2" class="w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与代码 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
          </div>
          <div class="p-6">
            <div class="bg-muted/30 rounded-lg p-6 min-h-[200px]">
              <div
                v-if="elements.length > 0"
                class="flex flex-col"
                :style="{ gap: containerGap + 'px' }"
              >
                <div v-for="el in elements" :key="el.id" :class="el.type === 'grid' ? '' : previewAnimClass" :style="elPreviewStyle(el)">
                  <template v-if="el.type === 'grid'">
                    <div
                      class="grid"
                      :style="{
                        gridTemplateColumns: `repeat(${el.cols}, 1fr)`,
                        gap: el.gap + 'px',
                        width: el.width + '%'
                      }"
                    >
                      <div
                        v-for="i in el.cols * 2"
                        :key="i"
                        :class="previewAnimClass"
                        :style="gridItemStyle(el)"
                      ></div>
                    </div>
                  </template>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground text-center py-10">添加骨架元素后在这里预览</p>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-semibold text-foreground flex items-center">
                <Copy class="w-5 h-5 mr-2 text-primary" /> 生成代码
              </h2>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="codeTab = 'html'"
                  :class="codeTab === 'html' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1 rounded text-xs font-medium transition-all"
                >
                  HTML
                </button>
                <button
                  @click="codeTab = 'css'"
                  :class="codeTab === 'css' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1 rounded text-xs font-medium transition-all"
                >
                  CSS
                </button>
              </div>
            </div>
            <button
              @click="copyCurrent"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>
          <div class="p-6">
            <textarea
              :value="currentCode"
              readonly
              class="w-full h-80 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-2">
              纯 CSS 实现，无任何依赖；把动画类（sk-anim-pulse / sk-anim-shimmer）加在容器上即可启用动画。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于骨架屏生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            骨架屏（Skeleton Screen）是内容加载完成前展示的占位画面：用灰色块模拟即将出现的文本行、头像、图片与卡片布局，让用户对页面结构建立预期，比转圈 Loading 体验更好。本工具通过可视化拼装的方式生成骨架屏结构，导出的代码纯 HTML + CSS、零依赖，可直接复制进任何项目。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>列表页、信息流的首次加载与翻页加载占位</li>
            <li>文章详情页在接口返回前的结构占位</li>
            <li>卡片流（商品、作品集）的加载占位</li>
            <li>配合路由切换，做页面级过渡骨架</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">脉冲和扫光怎么选？</span>脉冲实现简单、视觉安静，适合大面积占位；扫光更接近 iOS / Facebook 风格，适合浅灰背景上的精致效果。</li>
            <li><span class="text-foreground font-medium">生成的代码有依赖吗？</span>没有，全部是原生 HTML 与 CSS，类名前缀为 sk-，动画只用 CSS keyframes 实现。</li>
            <li><span class="text-foreground font-medium">怎么接入真实数据？</span>把骨架块替换为对应尺寸的真实内容元素即可，常见做法是用 v-if 在加载态切换骨架与内容。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'skeleton-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Layout, Settings2, Wand2, Zap, Eye, Copy, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '骨架屏生成器 - 在线Skeleton Loading占位图CSS代码生成工具',
  description: '在线骨架屏生成器，可视化拼装行、头像、矩形、网格骨架元素，支持脉冲与扫光加载动画，导出纯CSS的HTML与CSS代码，零依赖可直接使用',
  keywords: '骨架屏, skeleton screen, loading占位, 骨架屏生成器, shimmer动画, css加载动画, 占位图',
  author: 'Util工具箱',
  ogTitle: '骨架屏生成器 - 有条工具',
  ogDescription: '可视化拼装骨架屏，导出纯CSS的HTML与CSS代码',
  ogUrl: 'https://www.util.cn/tools/skeleton-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '骨架屏生成器',
          url: 'https://www.util.cn/tools/skeleton-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['可视化拼装骨架', '行/头像/矩形/网格元素', '脉冲与扫光动画', '预设模板', '纯CSS代码导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '骨架屏生成器', item: 'https://www.util.cn/tools/skeleton-generator/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'skeleton-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
let uid = 0
const SK_COLOR = '#e5e7eb'
const SHIMMER_GRADIENT = 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)'

const typeLabels = { line: '行', avatar: '头像', rect: '矩形', grid: '网格' }
const presets = [
  { value: 'article', label: '文章页' },
  { value: 'list', label: '列表页' },
  { value: 'card', label: '卡片页' }
]

const elements = ref([])
const animation = ref('pulse')
const containerGap = ref(12)
const codeTab = ref('html')
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 元素操作 ----------
const createElement = (type) => {
  const base = { id: ++uid, type }
  if (type === 'line') return { ...base, width: 80, height: 14 }
  if (type === 'avatar') return { ...base, size: 48 }
  if (type === 'rect') return { ...base, width: 100, height: 120 }
  return { ...base, width: 100, cols: 3, itemHeight: 80, gap: 12 }
}

const addElement = (type) => {
  elements.value.push(createElement(type))
}

const removeElement = (idx) => {
  elements.value.splice(idx, 1)
}

const moveElement = (idx, dir) => {
  const target = idx + dir
  if (target < 0 || target >= elements.value.length) return
  const list = elements.value
  const tmp = list[idx]
  list[idx] = list[target]
  list[target] = tmp
}

const applyPreset = (name) => {
  if (name === 'article') {
    elements.value = [
      { id: ++uid, type: 'avatar', size: 48 },
      { id: ++uid, type: 'line', width: 60, height: 20 },
      { id: ++uid, type: 'line', width: 100, height: 14 },
      { id: ++uid, type: 'line', width: 100, height: 14 },
      { id: ++uid, type: 'line', width: 70, height: 14 },
      { id: ++uid, type: 'rect', width: 100, height: 160 }
    ]
  } else if (name === 'list') {
    elements.value = []
    for (let i = 0; i < 3; i++) {
      elements.value.push(
        { id: ++uid, type: 'avatar', size: 40 },
        { id: ++uid, type: 'line', width: 70, height: 16 },
        { id: ++uid, type: 'line', width: 100, height: 12 }
      )
    }
  } else {
    elements.value = [
      { id: ++uid, type: 'rect', width: 100, height: 140 },
      { id: ++uid, type: 'line', width: 80, height: 18 },
      { id: ++uid, type: 'line', width: 100, height: 12 },
      { id: ++uid, type: 'line', width: 60, height: 12 }
    ]
  }
}

// 预置文章页布局
applyPreset('article')

// ---------- 预览 ----------
const previewAnimClass = computed(() => {
  if (animation.value === 'pulse') return 'skg-pulse'
  if (animation.value === 'shimmer') return 'skg-shimmer'
  return ''
})

const elPreviewStyle = (el) => {
  const base = {
    background: animation.value === 'shimmer' ? SHIMMER_GRADIENT : SK_COLOR
  }
  if (animation.value === 'shimmer') base.backgroundSize = '800px 100%'
  if (el.type === 'line') {
    return { ...base, width: el.width + '%', height: el.height + 'px', borderRadius: el.height / 2 + 'px' }
  }
  if (el.type === 'avatar') {
    return { ...base, width: el.size + 'px', height: el.size + 'px', borderRadius: '50%' }
  }
  if (el.type === 'rect') {
    return { ...base, width: el.width + '%', height: el.height + 'px', borderRadius: '8px' }
  }
  return { width: '100%' }
}

const gridItemStyle = (el) => {
  const base = {
    height: el.itemHeight + 'px',
    borderRadius: '8px',
    background: animation.value === 'shimmer' ? SHIMMER_GRADIENT : SK_COLOR
  }
  if (animation.value === 'shimmer') base.backgroundSize = '800px 100%'
  return base
}

// ---------- 代码生成 ----------
const genHtml = computed(() => {
  const animClass = animation.value === 'none' ? '' : ` sk-anim-${animation.value}`
  const lines = [`<div class="sk-container${animClass}">`]
  for (const el of elements.value) {
    if (el.type === 'line') {
      lines.push(`  <div class="sk-line" style="width: ${el.width}%; height: ${el.height}px"></div>`)
    } else if (el.type === 'avatar') {
      lines.push(`  <div class="sk-avatar" style="width: ${el.size}px; height: ${el.size}px"></div>`)
    } else if (el.type === 'rect') {
      lines.push(`  <div class="sk-rect" style="width: ${el.width}%; height: ${el.height}px"></div>`)
    } else if (el.type === 'grid') {
      lines.push(`  <div class="sk-grid" style="grid-template-columns: repeat(${el.cols}, 1fr); gap: ${el.gap}px; width: ${el.width}%">`)
      const count = el.cols * 2
      for (let i = 0; i < count; i++) {
        lines.push(`    <div class="sk-grid-item" style="height: ${el.itemHeight}px"></div>`)
      }
      lines.push('  </div>')
    }
  }
  lines.push('</div>')
  return lines.join('\n')
})

const genCss = computed(() => {
  const lines = []
  lines.push('.sk-container {')
  lines.push('  display: flex;')
  lines.push('  flex-direction: column;')
  lines.push(`  gap: ${containerGap.value}px;`)
  lines.push('}')
  lines.push('')
  lines.push('.sk-line {')
  lines.push(`  background: ${SK_COLOR};`)
  lines.push('  border-radius: 999px;')
  lines.push('}')
  lines.push('')
  lines.push('.sk-avatar {')
  lines.push(`  background: ${SK_COLOR};`)
  lines.push('  border-radius: 50%;')
  lines.push('}')
  lines.push('')
  lines.push('.sk-rect {')
  lines.push(`  background: ${SK_COLOR};`)
  lines.push('  border-radius: 8px;')
  lines.push('}')
  lines.push('')
  lines.push('.sk-grid {')
  lines.push('  display: grid;')
  lines.push('}')
  lines.push('')
  lines.push('.sk-grid-item {')
  lines.push(`  background: ${SK_COLOR};`)
  lines.push('  border-radius: 8px;')
  lines.push('}')
  lines.push('')
  lines.push('/* 脉冲动画（透明度呼吸） */')
  lines.push('@keyframes sk-pulse {')
  lines.push('  0%, 100% { opacity: 1; }')
  lines.push('  50% { opacity: 0.45; }')
  lines.push('}')
  lines.push('')
  lines.push('/* 扫光动画（渐变高光扫过） */')
  lines.push('@keyframes sk-shimmer {')
  lines.push('  0% { background-position: -400px 0; }')
  lines.push('  100% { background-position: 400px 0; }')
  lines.push('}')
  lines.push('')
  lines.push('/* 把 sk-anim-pulse 或 sk-anim-shimmer 加到容器上启用动画 */')
  lines.push('.sk-anim-pulse .sk-line,')
  lines.push('.sk-anim-pulse .sk-avatar,')
  lines.push('.sk-anim-pulse .sk-rect,')
  lines.push('.sk-anim-pulse .sk-grid-item {')
  lines.push('  animation: sk-pulse 1.5s ease-in-out infinite;')
  lines.push('}')
  lines.push('')
  lines.push('.sk-anim-shimmer .sk-line,')
  lines.push('.sk-anim-shimmer .sk-avatar,')
  lines.push('.sk-anim-shimmer .sk-rect,')
  lines.push('.sk-anim-shimmer .sk-grid-item {')
  lines.push(`  background-image: ${SHIMMER_GRADIENT};`)
  lines.push('  background-size: 800px 100%;')
  lines.push('  animation: sk-shimmer 1.4s linear infinite;')
  lines.push('}')
  return lines.join('\n')
})

const currentCode = computed(() => (codeTab.value === 'html' ? genHtml.value : genCss.value))

// ---------- 交互 ----------
const copyCurrent = async () => {
  if (!currentCode.value) return
  try {
    await navigator.clipboard.writeText(currentCode.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = currentCode.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}
</script>

<style scoped>
.skg-pulse {
  animation: skg-pulse-kf 1.5s ease-in-out infinite;
}
@keyframes skg-pulse-kf {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.skg-shimmer {
  animation: skg-shimmer-kf 1.4s linear infinite;
}
@keyframes skg-shimmer-kf {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
