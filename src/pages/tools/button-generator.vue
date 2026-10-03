<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">网页按钮生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化设计按钮样式，导出含 hover 效果的 CSS</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        调节文字、字号字重、内边距、圆角、纯色或渐变填充、边框与阴影，配置提亮、上浮、阴影加深等 hover 效果，实时预览正常态与 hover 态并导出完整 CSS 代码，全部在浏览器本地计算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：参数控制 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Wand2 class="w-5 h-5 mr-2 text-primary" /> 预设风格
          </h2>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="p in presets"
              :key="p.name"
              @click="applyPreset(p)"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ p.name }}
            </button>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 按钮参数
          </h2>
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">文字内容</label>
              <input
                v-model="cfg.text"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="按钮文字"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">字号</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.fontSize }}px</span>
                </div>
                <input v-model.number="cfg.fontSize" type="range" min="12" max="24" step="1" class="w-full" />
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">字重</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.fontWeight }}</span>
                </div>
                <input v-model.number="cfg.fontWeight" type="range" min="300" max="900" step="100" class="w-full" />
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">水平内边距</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.padX }}px</span>
                </div>
                <input v-model.number="cfg.padX" type="range" min="8" max="48" step="2" class="w-full" />
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">垂直内边距</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.padY }}px</span>
                </div>
                <input v-model.number="cfg.padY" type="range" min="4" max="32" step="1" class="w-full" />
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">圆角</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.radius }}px</span>
                </div>
                <input v-model.number="cfg.radius" type="range" min="0" max="30" step="1" class="w-full" />
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">过渡时长</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.duration }}s</span>
                </div>
                <input v-model.number="cfg.duration" type="range" min="0" max="1" step="0.05" class="w-full" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">填充类型</label>
              <div class="grid grid-cols-3 gap-1.5 mb-3">
                <button
                  @click="cfg.fillType = 'solid'"
                  :class="cfg.fillType === 'solid' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  纯色
                </button>
                <button
                  @click="cfg.fillType = 'gradient'"
                  :class="cfg.fillType === 'gradient' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  渐变
                </button>
                <button
                  @click="cfg.fillType = 'transparent'"
                  :class="cfg.fillType === 'transparent' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  透明
                </button>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center justify-between">
                  <label class="text-sm text-foreground">{{ cfg.fillType === 'gradient' ? '起始色' : '颜色' }}</label>
                  <input v-model="cfg.color1" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
                </div>
                <div v-if="cfg.fillType === 'gradient'" class="flex items-center justify-between">
                  <label class="text-sm text-foreground">结束色</label>
                  <input v-model="cfg.color2" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
                </div>
              </div>
              <div v-if="cfg.fillType === 'gradient'" class="mt-3">
                <label class="block text-sm font-medium text-foreground mb-2">渐变方向</label>
                <div class="grid grid-cols-4 gap-1.5">
                  <button
                    v-for="d in gradDirs"
                    :key="d.value"
                    @click="cfg.gradDir = d.value"
                    :class="cfg.gradDir === d.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                    class="py-1.5 rounded text-xs font-medium transition-all"
                  >
                    {{ d.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-medium text-foreground">边框宽度</label>
                  <span class="text-sm text-muted-foreground">{{ cfg.borderWidth }}px</span>
                </div>
                <input v-model.number="cfg.borderWidth" type="range" min="0" max="4" step="1" class="w-full" />
              </div>
              <div class="flex items-center justify-between">
                <label class="text-sm text-foreground">边框颜色</label>
                <input v-model="cfg.borderColor" type="color" :disabled="cfg.borderWidth === 0" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer disabled:opacity-40" />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm text-foreground">文字颜色</label>
              <input v-model="cfg.textColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Sparkles class="w-5 h-5 mr-2 text-primary" /> 阴影
          </h2>
          <label class="flex items-center justify-between cursor-pointer mb-4">
            <span class="text-sm text-foreground">启用阴影</span>
            <button
              type="button"
              @click="cfg.shadowEnabled = !cfg.shadowEnabled"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="cfg.shadowEnabled ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="cfg.shadowEnabled ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>
          <div v-if="cfg.shadowEnabled" class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-muted-foreground">X 偏移</label>
                <span class="text-sm text-muted-foreground">{{ cfg.shadowX }}px</span>
              </div>
              <input v-model.number="cfg.shadowX" type="range" min="-20" max="20" step="1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-muted-foreground">Y 偏移</label>
                <span class="text-sm text-muted-foreground">{{ cfg.shadowY }}px</span>
              </div>
              <input v-model.number="cfg.shadowY" type="range" min="0" max="24" step="1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-muted-foreground">模糊</label>
                <span class="text-sm text-muted-foreground">{{ cfg.shadowBlur }}px</span>
              </div>
              <input v-model.number="cfg.shadowBlur" type="range" min="0" max="40" step="1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-muted-foreground">扩展</label>
                <span class="text-sm text-muted-foreground">{{ cfg.shadowSpread }}px</span>
              </div>
              <input v-model.number="cfg.shadowSpread" type="range" min="0" max="20" step="1" class="w-full" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-muted-foreground">颜色</label>
              <input v-model="cfg.shadowColor" type="color" class="h-9 w-16 rounded border border-border bg-transparent cursor-pointer" />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-muted-foreground">不透明度</label>
                <span class="text-sm text-muted-foreground">{{ cfg.shadowOpacity.toFixed(2) }}</span>
              </div>
              <input v-model.number="cfg.shadowOpacity" type="range" min="0" max="1" step="0.05" class="w-full" />
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> Hover 效果
          </h2>
          <div class="space-y-3">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">上浮（translateY(-2px)）</span>
              <button
                type="button"
                @click="cfg.hoverLift = !cfg.hoverLift"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="cfg.hoverLift ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="cfg.hoverLift ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">提亮（brightness(1.1)）</span>
              <button
                type="button"
                @click="cfg.hoverBrighten = !cfg.hoverBrighten"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="cfg.hoverBrighten ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="cfg.hoverBrighten ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">阴影加深</span>
              <button
                type="button"
                @click="cfg.hoverShadow = !cfg.hoverShadow"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="cfg.hoverShadow ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="cfg.hoverShadow ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
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
          <div class="p-6 space-y-5">
            <div class="bg-muted/30 rounded-lg p-6 flex items-center justify-center gap-6 flex-wrap">
              <button :style="baseStyle" type="button">{{ cfg.text || '按钮' }}</button>
              <button :style="hoverPreviewStyle" type="button">{{ cfg.text || '按钮' }}</button>
            </div>
            <div class="bg-muted/30 rounded-lg p-6 flex items-center justify-center gap-4 flex-wrap">
              <button :style="smallStyle" type="button">{{ cfg.text || '按钮' }}</button>
              <button :style="baseStyle" type="button">{{ cfg.text || '按钮' }}</button>
              <button :style="largeStyle" type="button">{{ cfg.text || '按钮' }}</button>
            </div>
            <p class="text-xs text-muted-foreground text-center">左侧为正常态，右侧为模拟 hover 态；下方为不同尺寸展示</p>
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
              class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于网页按钮生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            按钮是网页中最重要的交互元素之一，它的视觉层级直接影响转化率。本生成器覆盖按钮设计的全部高频属性：文字排版、内边距、圆角、纯色 / 渐变 / 透明填充、边框、多层阴影以及 hover 反馈（提亮、上浮、阴影加深），并输出包含 .btn 与 .btn:hover 规则的完整 CSS。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>落地页 CTA 主按钮、注册 / 购买按钮的快速定稿</li>
            <li>为设计系统补齐次要按钮、幽灵按钮、危险按钮等变体</li>
            <li>给开源项目或静态页面快速生成风格统一的按钮样式</li>
            <li>学习 box-shadow、linear-gradient 与 transition 的组合用法</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">hover 效果如何模拟？</span>预览区右侧按钮直接以内联样式呈现 hover 后的状态，方便不看代码也能确认效果。</li>
            <li><span class="text-foreground font-medium">透明填充是做什么的？</span>透明填充加边框就是「幽灵按钮」，常用于次要操作或深色背景上的轻量按钮。</li>
            <li><span class="text-foreground font-medium">阴影颜色为什么有透明度？</span>阴影通常使用带透明度的颜色才自然，可用不透明度滑块调节，生成 rgba 值。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'button-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Zap, Settings2, Wand2, Sparkles, Eye, Copy, Download, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '网页按钮生成器 - 在线CSS按钮样式与Hover效果生成工具',
  description: '在线网页按钮生成器，可视化调节文字、字号、圆角、渐变填充、边框、阴影与hover效果，实时预览并导出含.btn与.btn:hover的完整CSS代码，提供多种预设风格',
  keywords: '按钮生成器, css按钮, button generator, 渐变按钮, 按钮样式, hover效果, css代码生成',
  author: 'Util工具箱',
  ogTitle: '网页按钮生成器 - 有条工具',
  ogDescription: '可视化设计按钮样式，导出含hover效果的完整CSS代码',
  ogUrl: 'https://www.util.cn/tools/button-generator',
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
          name: '网页按钮生成器',
          url: 'https://www.util.cn/tools/button-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['纯色/渐变/透明填充', '边框与多层阴影', 'hover提亮上浮加深', '四种预设风格', 'CSS代码导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '网页按钮生成器', item: 'https://www.util.cn/tools/button-generator/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'button-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const gradDirs = [
  { value: '90deg', label: '向右' },
  { value: '135deg', label: '对角' },
  { value: '180deg', label: '向下' },
  { value: '270deg', label: '向左' }
]

const cfg = reactive({
  text: '立即开始',
  fontSize: 16,
  fontWeight: 600,
  padX: 24,
  padY: 12,
  radius: 8,
  duration: 0.3,
  fillType: 'solid',
  color1: '#6366f1',
  color2: '#a855f7',
  gradDir: '135deg',
  borderWidth: 0,
  borderColor: '#4f46e5',
  textColor: '#ffffff',
  shadowEnabled: true,
  shadowX: 0,
  shadowY: 4,
  shadowBlur: 14,
  shadowSpread: 0,
  shadowColor: '#6366f1',
  shadowOpacity: 0.35,
  hoverLift: true,
  hoverBrighten: true,
  hoverShadow: true
})

const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 工具 ----------
const hexToRgba = (hex, alpha) => {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const backgroundValue = computed(() => {
  if (cfg.fillType === 'gradient') return `linear-gradient(${cfg.gradDir}, ${cfg.color1}, ${cfg.color2})`
  if (cfg.fillType === 'transparent') return 'transparent'
  return cfg.color1
})

const shadowValue = computed(() => {
  if (!cfg.shadowEnabled) return 'none'
  return `${cfg.shadowX}px ${cfg.shadowY}px ${cfg.shadowBlur}px ${cfg.shadowSpread}px ${hexToRgba(cfg.shadowColor, cfg.shadowOpacity)}`
})

const hoverShadowValue = computed(() => {
  if (!cfg.shadowEnabled) return 'none'
  const y = Math.round(cfg.shadowY * 1.8)
  const blur = Math.round(cfg.shadowBlur * 1.5)
  const alpha = Math.min(1, cfg.shadowOpacity + 0.12)
  return `${cfg.shadowX}px ${y}px ${blur}px ${cfg.shadowSpread}px ${hexToRgba(cfg.shadowColor, alpha)}`
})

// ---------- 预览样式 ----------
const baseStyle = computed(() => ({
  fontSize: cfg.fontSize + 'px',
  fontWeight: cfg.fontWeight,
  padding: `${cfg.padY}px ${cfg.padX}px`,
  borderRadius: cfg.radius + 'px',
  color: cfg.textColor,
  background: backgroundValue.value,
  border: cfg.borderWidth > 0 ? `${cfg.borderWidth}px solid ${cfg.borderColor}` : 'none',
  boxShadow: shadowValue.value,
  transition: `all ${cfg.duration}s ease`,
  cursor: 'pointer'
}))

const hoverPreviewStyle = computed(() => ({
  ...baseStyle.value,
  transform: cfg.hoverLift ? 'translateY(-2px)' : 'none',
  filter: cfg.hoverBrighten ? 'brightness(1.1)' : 'none',
  boxShadow: cfg.hoverShadow ? hoverShadowValue.value : shadowValue.value
}))

const scaleStyle = (scale) => ({
  ...baseStyle.value,
  fontSize: Math.round(cfg.fontSize * scale) + 'px',
  padding: `${Math.round(cfg.padY * scale)}px ${Math.round(cfg.padX * scale)}px`,
  borderRadius: Math.round(cfg.radius * scale) + 'px'
})

const smallStyle = computed(() => scaleStyle(0.85))
const largeStyle = computed(() => scaleStyle(1.2))

// ---------- 预设 ----------
const presets = [
  {
    name: '主按钮',
    values: {
      fillType: 'solid', color1: '#6366f1', textColor: '#ffffff', borderWidth: 0,
      radius: 8, shadowEnabled: true, shadowX: 0, shadowY: 4, shadowBlur: 14,
      shadowSpread: 0, shadowColor: '#6366f1', shadowOpacity: 0.35,
      hoverLift: true, hoverBrighten: true, hoverShadow: true
    }
  },
  {
    name: '次按钮',
    values: {
      fillType: 'solid', color1: '#e5e7eb', textColor: '#1f2937', borderWidth: 1, borderColor: '#d1d5db',
      radius: 8, shadowEnabled: false, hoverLift: true, hoverBrighten: false, hoverShadow: false
    }
  },
  {
    name: '幽灵按钮',
    values: {
      fillType: 'transparent', textColor: '#6366f1', borderWidth: 2, borderColor: '#6366f1',
      radius: 8, shadowEnabled: false, hoverLift: true, hoverBrighten: false, hoverShadow: false
    }
  },
  {
    name: '危险按钮',
    values: {
      fillType: 'solid', color1: '#ef4444', textColor: '#ffffff', borderWidth: 0,
      radius: 8, shadowEnabled: true, shadowX: 0, shadowY: 4, shadowBlur: 14,
      shadowSpread: 0, shadowColor: '#ef4444', shadowOpacity: 0.35,
      hoverLift: true, hoverBrighten: true, hoverShadow: true
    }
  }
]

const applyPreset = (p) => {
  Object.assign(cfg, p.values)
}

// ---------- CSS 输出 ----------
const cssCode = computed(() => {
  const lines = []
  lines.push('.btn {')
  lines.push('  display: inline-block;')
  lines.push(`  padding: ${cfg.padY}px ${cfg.padX}px;`)
  lines.push(`  font-size: ${cfg.fontSize}px;`)
  lines.push(`  font-weight: ${cfg.fontWeight};`)
  lines.push('  line-height: 1.2;')
  lines.push(`  color: ${cfg.textColor};`)
  lines.push(`  background: ${backgroundValue.value};`)
  if (cfg.borderWidth > 0) {
    lines.push(`  border: ${cfg.borderWidth}px solid ${cfg.borderColor};`)
  } else {
    lines.push('  border: none;')
  }
  lines.push(`  border-radius: ${cfg.radius}px;`)
  lines.push(`  box-shadow: ${shadowValue.value};`)
  lines.push('  cursor: pointer;')
  lines.push('  text-decoration: none;')
  lines.push('  user-select: none;')
  lines.push(`  transition: all ${cfg.duration}s ease;`)
  lines.push('}')

  if (cfg.hoverLift || cfg.hoverBrighten || cfg.hoverShadow) {
    lines.push('')
    lines.push('.btn:hover {')
    if (cfg.hoverLift) lines.push('  transform: translateY(-2px);')
    if (cfg.hoverBrighten) lines.push('  filter: brightness(1.1);')
    if (cfg.hoverShadow) lines.push(`  box-shadow: ${hoverShadowValue.value};`)
    lines.push('}')
  }
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
  a.download = 'button.css'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
