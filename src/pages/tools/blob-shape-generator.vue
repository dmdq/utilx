<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sparkles class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Blob形状生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">随机生成有机 Blob 形状，导出 CSS 与 SVG 代码</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        一键随机生成有机 Blob 形状，通过平滑度与尺寸实时微调，支持纯色或渐变填充。导出 CSS（border-radius 八值语法，含 -webkit- 前缀）或更平滑的 SVG path，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：参数控制 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 形状参数
          </h2>

          <button
            @click="randomize"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 mb-2"
          >
            <RefreshCw class="w-4 h-4" /> 随机形状
          </button>
          <p class="text-xs text-muted-foreground text-center mb-5">随机种子：{{ seed }}</p>

          <div class="space-y-5">
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">平滑度</label>
                <span class="text-sm text-muted-foreground">{{ smoothness }}</span>
              </div>
              <input v-model.number="smoothness" type="range" min="0" max="100" step="1" class="w-full" />
              <p class="text-xs text-muted-foreground mt-1">数值越大越接近正圆，越小形状越不规则</p>
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">尺寸</label>
                <span class="text-sm text-muted-foreground">{{ size }}px</span>
              </div>
              <input v-model.number="size" type="range" min="100" max="400" step="10" class="w-full" />
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-foreground flex items-center">
                <Palette class="w-4 h-4 mr-1.5 text-primary" /> 填充颜色
              </label>
              <input v-model="fillColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">渐变填充</span>
              <button
                type="button"
                @click="useGradient = !useGradient"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="useGradient ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="useGradient ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <div v-if="useGradient" class="flex items-center justify-between">
              <label class="text-sm font-medium text-foreground">渐变结束色</label>
              <input v-model="gradientColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>
          </div>
        </div>

        <!-- 当前值 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 当前 border-radius
          </h3>
          <code class="block bg-muted/50 rounded-lg p-3 text-xs font-mono text-foreground break-all">{{ borderRadiusValue }}</code>
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
            <div class="bg-muted/30 rounded-lg h-80 flex items-center justify-center overflow-hidden">
              <div :style="previewStyle"></div>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-semibold text-foreground flex items-center">
                <Frame class="w-5 h-5 mr-2 text-primary" /> 生成代码
              </h2>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="codeTab = 'css'"
                  :class="codeTab === 'css' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1 rounded text-xs font-medium transition-all"
                >
                  CSS
                </button>
                <button
                  @click="codeTab = 'svg'"
                  :class="codeTab === 'svg' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1 rounded text-xs font-medium transition-all"
                >
                  SVG
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="copyCurrent"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadCurrent"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              :value="currentCode"
              readonly
              class="w-full h-72 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-2">
              SVG 版本使用 path + 圆弧命令实现，边缘比 border-radius 更平滑，适合作为插画或背景装饰。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Blob形状生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Blob（斑点）形状是近年来非常流行的有机设计元素，常用于网页背景装饰、头像容器、插画配景等场景。它通过 CSS 的 border-radius 八值语法（水平半径 / 垂直半径）实现四个角各自独立的椭圆圆角，从而形成不规则但平滑的有机轮廓。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>落地页 Hero 区的背景装饰图形，替代呆板的矩形色块</li>
            <li>团队头像、产品图的异形容器，提升页面设计感</li>
            <li>插画与海报中的有机色块，配合渐变填充效果更佳</li>
            <li>加载动画或悬浮装饰元素，配合 CSS 动画让 Blob 缓慢形变</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">平滑度是什么？</span>平滑度控制随机时圆角值的取值范围：数值越大，八个值越接近 50%，形状越接近正圆；数值越小，取值范围越宽，形状越不规则。</li>
            <li><span class="text-foreground font-medium">CSS 和 SVG 有什么区别？</span>CSS 版本适合网页元素，直接对 div 应用即可；SVG 版本使用 path 圆弧命令绘制，缩放不失真，适合导出为图片素材或插画使用。</li>
            <li><span class="text-foreground font-medium">随机种子有什么用？</span>相同种子在相同平滑度下会生成完全相同的形状，方便记录和复现你喜欢的结果。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'blob-shape-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sparkles, Settings2, RefreshCw, Eye, Frame, Copy, Download, Info,
  ChevronUp, ChevronDown, Palette
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Blob形状生成器 - 在线CSS有机形状/Blob圆角生成工具',
  description: '在线Blob形状生成器，随机生成有机Blob形状，导出CSS border-radius八值语法与SVG path代码，支持平滑度调节、渐变填充，纯本地计算',
  keywords: 'blob生成器, blob shape, border-radius生成器, 有机形状, css形状, 不规则圆角, svg blob',
  author: 'Util工具箱',
  ogTitle: 'Blob形状生成器 - 有条工具',
  ogDescription: '随机生成有机Blob形状，导出CSS与SVG代码，纯本地计算',
  ogUrl: 'https://www.util.cn/tools/blob-shape-generator',
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
          name: 'Blob形状生成器',
          url: 'https://www.util.cn/tools/blob-shape-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['随机Blob形状', '平滑度调节', 'CSS八值border-radius导出', 'SVG path导出', '渐变填充']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: 'Blob形状生成器', item: 'https://www.util.cn/tools/blob-shape-generator/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'blob-shape-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const seed = ref(20260)
const smoothness = ref(50)
const size = ref(240)
const fillColor = ref('#6366f1')
const gradientColor = ref('#a855f7')
const useGradient = ref(true)
const codeTab = ref('css')
const seoContentVisible = ref(true)

// [tl-x, tl-y, tr-x, tr-y, br-x, br-y, bl-x, bl-y]（百分比）
const radii = ref([30, 70, 70, 30, 30, 30, 70, 70])

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 带种子的随机 ----------
const mulberry32 = (s) => {
  return function () {
    s |= 0
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const applySeed = () => {
  const rand = mulberry32(seed.value)
  const spread = 30 - smoothness.value * 0.2
  radii.value = Array.from({ length: 8 }, () => Math.round(50 - spread + rand() * spread * 2))
}

const randomize = () => {
  seed.value = Math.floor(Math.random() * 99999) + 1
  applySeed()
}

watch(smoothness, applySeed)
applySeed()

// ---------- 形状计算 ----------
const borderRadiusValue = computed(() => {
  const r = radii.value
  return `${r[0]}% ${r[2]}% ${r[4]}% ${r[6]}% / ${r[1]}% ${r[3]}% ${r[5]}% ${r[7]}%`
})

const previewStyle = computed(() => ({
  width: size.value + 'px',
  height: size.value + 'px',
  borderRadius: borderRadiusValue.value,
  background: useGradient.value
    ? `linear-gradient(135deg, ${fillColor.value}, ${gradientColor.value})`
    : fillColor.value
}))

// ---------- CSS 输出 ----------
const cssCode = computed(() => {
  const br = borderRadiusValue.value
  const bg = useGradient.value
    ? `linear-gradient(135deg, ${fillColor.value}, ${gradientColor.value})`
    : fillColor.value
  return `.blob {
  width: ${size.value}px;
  height: ${size.value}px;
  background: ${bg};
  border-radius: ${br};
  -webkit-border-radius: ${br};
}`
})

// ---------- SVG 输出（用圆弧命令拼出与 border-radius 一致的 path） ----------
const svgPath = computed(() => {
  const w = size.value
  const h = size.value
  const p = radii.value
  const rx = v => (v / 100) * w
  const ry = v => (v / 100) * h
  const tlx = rx(p[0])
  const tly = ry(p[1])
  const trx = rx(p[2])
  const tryy = ry(p[3])
  const brx = rx(p[4])
  const bry = ry(p[5])
  const blx = rx(p[6])
  const bly = ry(p[7])
  return [
    `M ${tlx} 0`,
    `L ${w - trx} 0`,
    `A ${trx} ${tryy} 0 0 1 ${w} ${tryy}`,
    `L ${w} ${h - bry}`,
    `A ${brx} ${bry} 0 0 1 ${w - brx} ${h}`,
    `L ${blx} ${h}`,
    `A ${blx} ${bly} 0 0 1 0 ${h - bly}`,
    `L 0 ${tly}`,
    `A ${tlx} ${tly} 0 0 1 ${tlx} 0`,
    'Z'
  ].join(' ')
})

const svgCode = computed(() => {
  const s = size.value
  const fill = useGradient.value ? 'url(#blobGradient)' : fillColor.value
  const lines = []
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">`)
  if (useGradient.value) {
    lines.push('  <defs>')
    lines.push('    <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">')
    lines.push(`      <stop offset="0%" stop-color="${fillColor.value}" />`)
    lines.push(`      <stop offset="100%" stop-color="${gradientColor.value}" />`)
    lines.push('    </linearGradient>')
    lines.push('  </defs>')
  }
  lines.push(`  <path d="${svgPath.value}" fill="${fill}" />`)
  lines.push('</svg>')
  return lines.join('\n')
})

const currentCode = computed(() => (codeTab.value === 'css' ? cssCode.value : svgCode.value))

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

const downloadCurrent = () => {
  if (!currentCode.value) return
  const isCss = codeTab.value === 'css'
  const blob = new Blob([currentCode.value], { type: isCss ? 'text/css;charset=utf-8' : 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isCss ? 'blob-shape.css' : 'blob-shape.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
