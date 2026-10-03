<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Route class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SVG波浪分割线生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">生成多层波浪 SVG 分割线，用于页面区块过渡</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        调节波峰数量、波幅、层次数、颜色、平滑度与方向，实时预览并导出格式化的 SVG 代码（viewBox 1440x320），放在页面 section 之间即可做出柔和的背景分割效果，全部在浏览器本地计算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：参数控制 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 波浪参数
          </h2>
          <div class="space-y-5">
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">波峰数量</label>
                <span class="text-sm text-muted-foreground">{{ peaks }}</span>
              </div>
              <input v-model.number="peaks" type="range" min="1" max="8" step="1" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">波幅</label>
                <span class="text-sm text-muted-foreground">{{ amplitude }}px</span>
              </div>
              <input v-model.number="amplitude" type="range" min="10" max="150" step="5" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">波浪层次数</label>
                <span class="text-sm text-muted-foreground">{{ layers }} 层</span>
              </div>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="n in 3"
                  :key="n"
                  @click="layers = n"
                  :class="layers === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  {{ n }} 层
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">每层自动使用不同透明度，形成前后景深</p>
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">平滑度</label>
                <span class="text-sm text-muted-foreground">{{ smoothness }}</span>
              </div>
              <input v-model.number="smoothness" type="range" min="0" max="100" step="1" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">方向</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="direction = 'up'"
                  :class="direction === 'up' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  波峰朝上
                </button>
                <button
                  @click="direction = 'down'"
                  :class="direction === 'down' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  波峰朝下
                </button>
              </div>
            </div>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">水平翻转</span>
              <button
                type="button"
                @click="flipH = !flipH"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="flipH ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="flipH ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-foreground flex items-center">
                <Palette class="w-4 h-4 mr-1.5 text-primary" /> 上层颜色
              </label>
              <input v-model="topColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-foreground flex items-center">
                <Palette class="w-4 h-4 mr-1.5 text-primary" /> 下层颜色
              </label>
              <input v-model="bottomColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 使用说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 将 SVG 放在两个 section 之间，设置 <code class="font-mono text-foreground">display: block; width: 100%</code>，即可作为背景分割</li>
            <li>• 上层颜色（透明度 1）用于最前层，下层颜色用于背景层次，多层时自动降低透明度</li>
            <li>• 「波峰朝上」适合作为下一区块的顶部分割；「波峰朝下」适合作为上一区块的底部分割</li>
            <li>• SVG 已设置 <code class="font-mono text-foreground">preserveAspectRatio="none"</code>，拉伸宽度时波形会随之铺满</li>
          </ul>
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
            <div class="bg-muted/30 rounded-lg overflow-hidden">
              <div class="h-10 bg-primary/10"></div>
              <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="w-full h-48 block">
                <path
                  v-for="(layer, i) in layerPaths"
                  :key="i"
                  :d="layer.d"
                  :fill="layer.fill"
                  :fill-opacity="layer.opacity"
                />
              </svg>
            </div>
            <p class="text-xs text-muted-foreground mt-3 text-center">上方色块模拟上一个区块的背景，波浪衔接两个区块</p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Copy class="w-5 h-5 mr-2 text-primary" /> SVG 代码
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copySvg"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadSvg"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载 .svg
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              :value="svgCode"
              readonly
              class="w-full h-80 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于SVG波浪分割线生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            波浪分割线是网页设计中常用的区块过渡元素：在 Hero 区与内容区、不同背景色的 section 之间插入一条柔和的波浪 SVG，可以让页面节奏更自然，避免生硬的直线切割。本工具基于三次贝塞尔曲线（正弦采样）生成波浪 path，支持多层透明度叠加，导出的 SVG 代码格式化缩进、可直接使用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>落地页 Hero 与功能介绍区之间的背景过渡</li>
            <li>不同配色 section 之间的柔和衔接</li>
            <li>页脚顶部的装饰性波浪</li>
            <li>海报、Banner 中的海浪、山峦等有机轮廓</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">如何让波浪铺满全宽？</span>给 svg 设置 width: 100%，配合 preserveAspectRatio="none" 即可随容器拉伸。</li>
            <li><span class="text-foreground font-medium">层次数有什么作用？</span>多层波浪以不同透明度与相位叠加，能形成前后景深，看起来更像自然的海浪。</li>
            <li><span class="text-foreground font-medium">文件体积大吗？</span>生成的 SVG 只有几个 path，通常在几 KB 以内，对页面性能几乎没有影响。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'svg-wave-divider'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Route, Settings2, Eye, Copy, Download, Info, ChevronUp, ChevronDown, Palette
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'SVG波浪分割线生成器 - 在线波浪SVG代码生成工具',
  description: '在线SVG波浪分割线生成器，可调波峰数量、波幅、多层透明度、颜色与方向，实时预览并导出格式化SVG代码，用于页面区块背景分割，纯本地计算',
  keywords: '波浪分割线, svg wave, 波浪svg, svg生成器, 页面分割线, 波浪背景, section过渡',
  author: 'Util工具箱',
  ogTitle: 'SVG波浪分割线生成器 - 有条工具',
  ogDescription: '生成多层波浪SVG分割线，实时预览，导出格式化SVG代码',
  ogUrl: 'https://www.util.cn/tools/svg-wave-divider',
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
          name: 'SVG波浪分割线生成器',
          url: 'https://www.util.cn/tools/svg-wave-divider',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['波峰数量调节', '多层波浪透明度', '自定义颜色', '方向与翻转', 'SVG代码导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: 'SVG波浪分割线生成器', item: 'https://www.util.cn/tools/svg-wave-divider/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'svg-wave-divider')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const peaks = ref(3)
const amplitude = ref(60)
const layers = ref(2)
const smoothness = ref(50)
const direction = ref('up')
const flipH = ref(false)
const topColor = ref('#3b82f6')
const bottomColor = ref('#1e3a8a')
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 波浪生成（三次贝塞尔逼近正弦） ----------
const W = 1440
const H = 320
const LAYER_OPACITIES = [1, 0.55, 0.3]

const fmt = (n) => String(Math.round(n * 10) / 10)

const layerPaths = computed(() => {
  const arr = []
  // depth 0 为最前层，渲染时后层先绘制
  for (let depth = layers.value - 1; depth >= 0; depth--) {
    const n = peaks.value * 2
    const seg = W / n
    const amp = Math.max(6, amplitude.value * (1 - depth * 0.18))
    const midY = 160 + depth * 16
    const k = 0.25 + (smoothness.value / 100) * 0.45

    let pts = []
    for (let i = 0; i <= n; i++) {
      pts.push({ x: i * seg, y: midY + (i % 2 === 0 ? -amp : amp) })
    }
    if (flipH.value) {
      pts = pts.slice().reverse().map(p => ({ x: W - p.x, y: p.y }))
    }

    let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]
      const p2 = pts[i + 1]
      d += ` C ${fmt(p1.x + seg * k)} ${fmt(p1.y)} ${fmt(p2.x - seg * k)} ${fmt(p2.y)} ${fmt(p2.x)} ${fmt(p2.y)}`
    }
    if (direction.value === 'up') {
      d += ` L ${W} ${H} L 0 ${H} Z`
    } else {
      d += ` L ${W} 0 L 0 0 Z`
    }

    arr.push({
      d,
      opacity: LAYER_OPACITIES[depth],
      fill: depth === 0 ? topColor.value : bottomColor.value
    })
  }
  return arr
})

const svgCode = computed(() => {
  const lines = []
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`)
  for (const layer of layerPaths.value) {
    lines.push(`  <path fill="${layer.fill}" fill-opacity="${layer.opacity}" d="${layer.d}" />`)
  }
  lines.push('</svg>')
  return lines.join('\n')
})

// ---------- 交互 ----------
const copySvg = async () => {
  if (!svgCode.value) return
  try {
    await navigator.clipboard.writeText(svgCode.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = svgCode.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const downloadSvg = () => {
  if (!svgCode.value) return
  const blob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wave-divider.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
