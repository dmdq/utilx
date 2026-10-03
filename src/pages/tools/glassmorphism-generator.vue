<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Eye class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">玻璃拟态生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化生成 Glassmorphism 毛玻璃效果 CSS</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        调节模糊度、饱和度、背景透明度、圆角、边框与内高光，实时预览玻璃拟态卡片叠加在渐变背景上的效果，一键复制含 -webkit- 前缀的完整 CSS 代码，全部在浏览器本地计算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：参数控制 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 预览背景
          </h2>
          <div class="grid grid-cols-5 gap-1.5 mb-4">
            <button
              v-for="(p, i) in bgPresets"
              :key="i"
              @click="bgMode = 'preset'; presetIdx = i"
              :class="bgMode === 'preset' && presetIdx === i ? 'ring-2 ring-ring' : ''"
              class="h-10 rounded-lg border border-border transition-all"
              :style="{ background: p.css }"
              :title="p.name"
            ></button>
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-foreground flex items-center">
              <Palette class="w-4 h-4 mr-1.5 text-primary" /> 纯色背景
            </label>
            <input v-model="solidColor" type="color" @input="bgMode = 'solid'" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Wand2 class="w-5 h-5 mr-2 text-primary" /> 玻璃参数
          </h2>
          <div class="space-y-5">
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">模糊度 blur</label>
                <span class="text-sm text-muted-foreground">{{ blur }}px</span>
              </div>
              <input v-model.number="blur" type="range" min="0" max="30" step="1" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">饱和度 saturate</label>
                <span class="text-sm text-muted-foreground">{{ saturate }}%</span>
              </div>
              <input v-model.number="saturate" type="range" min="100" max="300" step="5" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">背景透明度</label>
                <span class="text-sm text-muted-foreground">{{ alpha.toFixed(2) }}</span>
              </div>
              <input v-model.number="alpha" type="range" min="0" max="1" step="0.05" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">圆角</label>
                <span class="text-sm text-muted-foreground">{{ radius }}px</span>
              </div>
              <input v-model.number="radius" type="range" min="0" max="40" step="1" class="w-full" />
            </div>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">半透明白色边框（1px）</span>
              <button
                type="button"
                @click="borderEnabled = !borderEnabled"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="borderEnabled ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="borderEnabled ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">内高光</span>
              <button
                type="button"
                @click="innerHighlight = !innerHighlight"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="innerHighlight ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="innerHighlight ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
          </div>
        </div>

        <!-- 兼容性说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 浏览器兼容说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• Safari 需要 <code class="font-mono text-foreground">-webkit-backdrop-filter</code> 前缀，生成的 CSS 已自动包含</li>
            <li>• backdrop-filter 在部分旧版浏览器中不支持，建议为卡片提供半透明降级背景</li>
            <li>• 玻璃效果依赖卡片背后的内容，背景越丰富效果越明显</li>
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
            <div
              class="rounded-lg h-80 flex items-center justify-center overflow-hidden relative"
              :style="backgroundStyle"
            >
              <div class="w-64 p-5 text-center" :style="cardStyle">
                <p class="text-lg font-bold text-white mb-2">Glassmorphism</p>
                <p class="text-xs text-white/90 leading-relaxed">
                  玻璃拟态卡片示例文字，透过毛玻璃可以看到背后模糊的背景色彩。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Copy class="w-5 h-5 mr-2 text-primary" /> 生成代码
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyCss"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadCss"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              :value="cssCode"
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于玻璃拟态生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            玻璃拟态（Glassmorphism）是近年流行的 UI 设计风格，核心是通过 backdrop-filter 的 blur 与 saturate 让元素背后内容产生磨砂玻璃质感，再叠加半透明白色背景、细边框与内高光，营造通透、有层次的空间感，在 macOS、iOS 系统界面与众多 SaaS 产品中广泛使用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>登录卡片、弹窗与浮层，让界面在彩色渐变背景上更通透</li>
            <li>仪表盘与数据看板的模块卡片，增强前后景层次</li>
            <li>移动端通知、控制中心等悬浮组件</li>
            <li>营销页 Hero 区的装饰卡片与价格表</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么在 Safari 中没有玻璃效果？</span>Safari 需要 -webkit-backdrop-filter 前缀，本工具生成的 CSS 已自动包含该前缀。</li>
            <li><span class="text-foreground font-medium">模糊度多少合适？</span>一般 8-20px 之间效果最佳，过大可能导致内容难以辨认，过小则玻璃感不足。</li>
            <li><span class="text-foreground font-medium">背景透明度如何选择？</span>0.15-0.35 之间比较自然；透明度过高会变成实色卡片，过低则文字可读性变差。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会，所有参数调节与代码生成都在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'glassmorphism-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Eye, Settings2, Wand2, Copy, Download, Info, ChevronUp, ChevronDown, Palette
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '玻璃拟态生成器 - 在线Glassmorphism毛玻璃CSS效果生成工具',
  description: '在线玻璃拟态生成器，可视化调节backdrop-filter模糊度、饱和度、透明度、圆角、边框与内高光，实时预览毛玻璃卡片效果并复制CSS代码，含-webkit-前缀兼容Safari',
  keywords: '玻璃拟态, glassmorphism, 毛玻璃效果, backdrop-filter, blur生成器, 磨砂玻璃, css效果',
  author: 'Util工具箱',
  ogTitle: '玻璃拟态生成器 - 有条工具',
  ogDescription: '可视化生成Glassmorphism毛玻璃效果CSS，实时预览，含-webkit-前缀',
  ogUrl: 'https://www.util.cn/tools/glassmorphism-generator',
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
          name: '玻璃拟态生成器',
          url: 'https://www.util.cn/tools/glassmorphism-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['backdrop-filter调节', '模糊度与饱和度', '渐变背景预设', '内高光与边框', '-webkit-前缀兼容']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '玻璃拟态生成器', item: 'https://www.util.cn/tools/glassmorphism-generator/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'glassmorphism-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const bgPresets = [
  { name: '极光紫', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '日落粉', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '海洋蓝', css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '森林绿', css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: '星夜', css: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
]

const bgMode = ref('preset')
const presetIdx = ref(0)
const solidColor = ref('#6366f1')
const blur = ref(12)
const saturate = ref(180)
const alpha = ref(0.25)
const radius = ref(16)
const borderEnabled = ref(true)
const innerHighlight = ref(true)
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 预览样式 ----------
const backgroundStyle = computed(() => {
  if (bgMode.value === 'solid') return { background: solidColor.value }
  return { background: bgPresets[presetIdx.value].css }
})

const backdropValue = computed(() => `blur(${blur.value}px) saturate(${saturate.value}%)`)

const cardStyle = computed(() => {
  const style = {
    background: `rgba(255, 255, 255, ${alpha.value})`,
    backdropFilter: backdropValue.value,
    webkitBackdropFilter: backdropValue.value,
    borderRadius: radius.value + 'px'
  }
  if (borderEnabled.value) style.border = '1px solid rgba(255, 255, 255, 0.3)'
  if (innerHighlight.value) style.boxShadow = 'inset 0 1px 1px rgba(255, 255, 255, 0.6)'
  return style
})

// ---------- CSS 输出 ----------
const cssCode = computed(() => {
  const bg = bgMode.value === 'solid'
    ? solidColor.value
    : bgPresets[presetIdx.value].css
  const lines = []
  lines.push('/* 玻璃拟态卡片 - Glassmorphism */')
  lines.push('.glass-background {')
  lines.push(`  background: ${bg};`)
  lines.push('}')
  lines.push('')
  lines.push('.glass-card {')
  lines.push(`  background: rgba(255, 255, 255, ${alpha.value});`)
  lines.push(`  backdrop-filter: ${backdropValue.value};`)
  lines.push(`  -webkit-backdrop-filter: ${backdropValue.value};`)
  lines.push(`  border-radius: ${radius.value}px;`)
  if (borderEnabled.value) {
    lines.push('  border: 1px solid rgba(255, 255, 255, 0.3);')
  }
  if (innerHighlight.value) {
    lines.push('  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.6);')
  }
  lines.push('}')
  lines.push('')
  lines.push('/* 兼容性提示：Safari 需要 -webkit-backdrop-filter 前缀（上方已包含）；')
  lines.push('   旧版浏览器不支持 backdrop-filter 时会退化为半透明卡片，建议保证文字可读性。 */')
  return lines.join('\n')
})

// ---------- 交互 ----------
const copyCss = async () => {
  if (!cssCode.value) return
  try {
    await navigator.clipboard.writeText(cssCode.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = cssCode.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const downloadCss = () => {
  if (!cssCode.value) return
  const blob = new Blob([cssCode.value], { type: 'text/css;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'glassmorphism.css'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
