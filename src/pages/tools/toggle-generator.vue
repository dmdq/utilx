<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">开关组件生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化定制 Toggle Switch，导出纯 CSS 实现</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        调节开关尺寸、轨道颜色、圆点颜色、圆角、边框阴影与动画时长，预览多个可点击的真实开关，导出基于 checkbox + label 的纯 CSS 实现（无 JS、含 focus 无障碍样式），分别复制 HTML 与 CSS 两段代码，全部在浏览器本地计算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：参数控制 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 尺寸与形状
          </h2>
          <div class="space-y-5">
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">宽度</label>
                <span class="text-sm text-muted-foreground">{{ cfg.width }}px</span>
              </div>
              <input v-model.number="cfg.width" type="range" min="36" max="96" step="2" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">高度</label>
                <span class="text-sm text-muted-foreground">{{ cfg.height }}px</span>
              </div>
              <input v-model.number="cfg.height" type="range" min="20" max="56" step="2" class="w-full" />
              <p class="text-xs text-muted-foreground mt-1">圆点直径自动按高度比例生成（上下留 3px 边距）</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">圆角</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="cfg.shape = 'round'"
                  :class="cfg.shape === 'round' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  全圆
                </button>
                <button
                  @click="cfg.shape = 'square'"
                  :class="cfg.shape === 'square' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  方形
                </button>
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-foreground">动画时长</label>
                <span class="text-sm text-muted-foreground">{{ cfg.duration }}s</span>
              </div>
              <input v-model.number="cfg.duration" type="range" min="0.1" max="0.6" step="0.05" class="w-full" />
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 颜色与装饰
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-sm text-foreground">关闭态轨道色</label>
              <input v-model="cfg.offColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-foreground">开启态轨道色</label>
              <input v-model="cfg.onColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-foreground">圆点颜色</label>
              <input v-model="cfg.knobColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">边框</span>
              <button
                type="button"
                @click="cfg.hasBorder = !cfg.hasBorder"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="cfg.hasBorder ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="cfg.hasBorder ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">阴影</span>
              <button
                type="button"
                @click="cfg.hasShadow = !cfg.hasShadow"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="cfg.hasShadow ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="cfg.hasShadow ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">显示图标（✓ / ✕）</span>
              <button
                type="button"
                @click="cfg.showIcon = !cfg.showIcon"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="cfg.showIcon ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="cfg.showIcon ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
          </div>
        </div>

        <!-- 无障碍说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 无障碍说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 使用 <code class="font-mono text-foreground">label</code> 包裹 <code class="font-mono text-foreground">input[type=checkbox]</code>，点击即可切换，无需额外 JS</li>
            <li>• input 未使用 display:none 隐藏，仍可被键盘聚焦与 Tab 导航</li>
            <li>• 已包含 <code class="font-mono text-foreground">:focus-visible</code> 外圈样式，键盘用户可清楚看到焦点位置</li>
            <li>• 建议在实际项目中为 input 补充 <code class="font-mono text-foreground">aria-label</code> 描述开关用途</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：预览与代码 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览（可点击）
            </h2>
            <button
              @click="resetDemo"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 重置
            </button>
          </div>
          <div class="p-6">
            <div class="bg-muted/30 rounded-lg p-8 flex items-center justify-center gap-8 flex-wrap">
              <button
                v-for="(st, i) in demoStates"
                :key="i"
                type="button"
                :style="trackStyle(st)"
                :aria-pressed="st"
                @click="demoStates[i] = !demoStates[i]"
              >
                <span :style="knobStyle(st)">{{ cfg.showIcon ? (st ? '✓' : '✕') : '' }}</span>
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-3 text-center">点击开关即可切换状态，效果与生成的代码一致</p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Copy class="w-5 h-5 mr-2 text-primary" /> 生成代码
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-foreground">HTML</h3>
                <button
                  @click="copyHtml"
                  class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制 HTML
                </button>
              </div>
              <textarea
                :value="htmlCode"
                readonly
                class="w-full h-36 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
                spellcheck="false"
              ></textarea>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-foreground">CSS</h3>
                <button
                  @click="copyCss"
                  class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制 CSS
                </button>
              </div>
              <textarea
                :value="cssCode"
                readonly
                class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
                spellcheck="false"
              ></textarea>
            </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于开关组件生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            开关（Toggle Switch）是设置页、表单中最常用的二态控件之一。本生成器采用业界通用的 checkbox + label 纯 CSS 方案：input 负责承载状态与键盘交互，label 与兄弟选择器负责外观，完全不需要 JavaScript，且天然保留了原生 checkbox 的可访问性能力。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>设置中心的偏好开关（通知、深色模式、隐私项）</li>
            <li>后台管理系统的表单二态字段</li>
            <li>组件库或设计系统中补充一个零依赖的开关样式</li>
            <li>静态页面、邮件模板等不方便引入 JS 的场景</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么不用 JS 实现？</span>checkbox 原生支持点击、空格切换与表单提交，纯 CSS 方案体积最小且最稳定。</li>
            <li><span class="text-foreground font-medium">input 被隐藏了还能聚焦吗？</span>本工具的样式使用透明化处理而非 display:none，Tab 键仍可聚焦，:focus-visible 外圈样式已包含。</li>
            <li><span class="text-foreground font-medium">怎么改开关颜色？</span>直接修改 CSS 中的背景色变量位置（.tg-track 与 :checked 规则），或回到本工具重新生成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'toggle-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Zap, Settings2, RefreshCw, Eye, Copy, Info, ChevronUp, ChevronDown, Palette
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '开关组件生成器 - 在线CSS Toggle Switch开关样式生成工具',
  description: '在线开关组件生成器，可视化调节尺寸、轨道色、圆点色、圆角、边框阴影与动画时长，预览可点击开关，导出checkbox+label纯CSS实现，无JS含focus无障碍样式',
  keywords: '开关组件, toggle switch, css开关, checkbox开关, 纯css开关, switch生成器, 表单组件',
  author: 'Util工具箱',
  ogTitle: '开关组件生成器 - 有条工具',
  ogDescription: '可视化定制Toggle Switch，导出checkbox+label纯CSS实现',
  ogUrl: 'https://www.util.cn/tools/toggle-generator',
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
          name: '开关组件生成器',
          url: 'https://www.util.cn/tools/toggle-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['尺寸与圆点比例', '轨道/圆点颜色', '圆角与阴影开关', '✓/✕图标', '纯CSS无JS实现']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '开关组件生成器', item: 'https://www.util.cn/tools/toggle-generator/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'toggle-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const cfg = reactive({
  width: 56,
  height: 30,
  offColor: '#d1d5db',
  onColor: '#22c55e',
  knobColor: '#ffffff',
  shape: 'round',
  duration: 0.3,
  hasBorder: false,
  hasShadow: true,
  showIcon: false
})

const demoStates = ref([true, false, true])
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const resetDemo = () => {
  demoStates.value = [true, false, true]
}

// ---------- 预览样式 ----------
const knobSize = computed(() => Math.max(8, cfg.height - 6))
const travel = computed(() => Math.max(0, cfg.width - cfg.height))

const trackStyle = (on) => {
  const style = {
    width: cfg.width + 'px',
    height: cfg.height + 'px',
    background: on ? cfg.onColor : cfg.offColor,
    borderRadius: cfg.shape === 'round' ? cfg.height / 2 + 'px' : '8px',
    transition: `background ${cfg.duration}s ease`,
    position: 'relative',
    cursor: 'pointer',
    padding: 0
  }
  if (cfg.hasBorder) style.border = '1px solid rgba(0, 0, 0, 0.1)'
  if (cfg.hasShadow) style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)'
  return style
}

const knobStyle = (on) => ({
  position: 'absolute',
  top: '3px',
  left: '3px',
  width: knobSize.value + 'px',
  height: knobSize.value + 'px',
  background: cfg.knobColor,
  borderRadius: cfg.shape === 'round' ? '999px' : '4px',
  transform: on ? `translateX(${travel.value}px)` : 'translateX(0)',
  transition: `transform ${cfg.duration}s ease`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: Math.round(knobSize.value * 0.55) + 'px',
  fontWeight: '700',
  lineHeight: 1,
  color: on ? cfg.onColor : '#9ca3af',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
})

// ---------- 代码生成 ----------
const htmlCode = computed(() => {
  const lines = []
  lines.push('<label class="tg">')
  lines.push('  <input type="checkbox" class="tg-input" />')
  lines.push('  <span class="tg-track">')
  lines.push('    <span class="tg-knob">')
  if (cfg.showIcon) {
    lines.push('      <span class="tg-icon tg-icon-on">✓</span>')
    lines.push('      <span class="tg-icon tg-icon-off">✕</span>')
  }
  lines.push('    </span>')
  lines.push('  </span>')
  lines.push('</label>')
  return lines.join('\n')
})

const cssCode = computed(() => {
  const trackRadius = cfg.shape === 'round' ? '999px' : '8px'
  const knobRadius = cfg.shape === 'round' ? '999px' : '4px'
  const iconSize = Math.round(knobSize.value * 0.55)
  const lines = []
  lines.push('.tg {')
  lines.push('  display: inline-block;')
  lines.push('  cursor: pointer;')
  lines.push('}')
  lines.push('')
  lines.push('/* input 透明化隐藏，保留键盘聚焦能力 */')
  lines.push('.tg-input {')
  lines.push('  position: absolute;')
  lines.push('  opacity: 0;')
  lines.push('  width: 0;')
  lines.push('  height: 0;')
  lines.push('}')
  lines.push('')
  lines.push('.tg-track {')
  lines.push('  display: block;')
  lines.push('  position: relative;')
  lines.push(`  width: ${cfg.width}px;`)
  lines.push(`  height: ${cfg.height}px;`)
  lines.push(`  background: ${cfg.offColor};`)
  lines.push(`  border-radius: ${trackRadius};`)
  lines.push(`  transition: background ${cfg.duration}s ease;`)
  if (cfg.hasBorder) lines.push('  border: 1px solid rgba(0, 0, 0, 0.1);')
  if (cfg.hasShadow) lines.push('  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);')
  lines.push('}')
  lines.push('')
  lines.push('.tg-knob {')
  lines.push('  position: absolute;')
  lines.push('  top: 3px;')
  lines.push('  left: 3px;')
  lines.push(`  width: ${knobSize.value}px;`)
  lines.push(`  height: ${knobSize.value}px;`)
  lines.push(`  background: ${cfg.knobColor};`)
  lines.push(`  border-radius: ${knobRadius};`)
  lines.push(`  transition: transform ${cfg.duration}s ease;`)
  lines.push('  display: flex;')
  lines.push('  align-items: center;')
  lines.push('  justify-content: center;')
  lines.push('  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);')
  lines.push('}')
  lines.push('')
  lines.push('.tg-input:checked + .tg-track {')
  lines.push(`  background: ${cfg.onColor};`)
  lines.push('}')
  lines.push('')
  lines.push('.tg-input:checked + .tg-track .tg-knob {')
  lines.push(`  transform: translateX(${travel.value}px);`)
  lines.push('}')
  if (cfg.showIcon) {
    lines.push('')
    lines.push('/* 状态图标 */')
    lines.push('.tg-icon {')
    lines.push(`  font-size: ${iconSize}px;`)
    lines.push('  font-weight: 700;')
    lines.push('  line-height: 1;')
    lines.push(`  transition: opacity ${cfg.duration}s ease;`)
    lines.push('}')
    lines.push('.tg-icon-on {')
    lines.push(`  color: ${cfg.onColor};`)
    lines.push('  opacity: 0;')
    lines.push('}')
    lines.push('.tg-icon-off {')
    lines.push('  color: #9ca3af;')
    lines.push('  opacity: 1;')
    lines.push('}')
    lines.push('.tg-input:checked + .tg-track .tg-icon-on {')
    lines.push('  opacity: 1;')
    lines.push('}')
    lines.push('.tg-input:checked + .tg-track .tg-icon-off {')
    lines.push('  opacity: 0;')
    lines.push('}')
  }
  lines.push('')
  lines.push('/* 键盘聚焦时的无障碍样式 */')
  lines.push('.tg-input:focus-visible + .tg-track {')
  lines.push(`  outline: 2px solid ${cfg.onColor};`)
  lines.push('  outline-offset: 2px;')
  lines.push('}')
  return lines.join('\n')
})

// ---------- 交互 ----------
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const copyHtml = () => copyText(htmlCode.value)
const copyCss = () => copyText(cssCode.value)
</script>
