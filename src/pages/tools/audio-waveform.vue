<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AudioLines class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频波形图生成</h1>
          <p class="text-sm text-muted-foreground mt-1">上传音频生成播客封面级波形图，条形/镜像/线条多种样式，导出高清 PNG</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传音频后自动按画布宽度分桶聚合出最小/最大包络并绘制波形图，可切换条形、镜像、线条三种样式，
        调整条宽与间距、单色或渐变配色、圆角条与背景色，然后以 1x / 2x / 4x 高清倍率或播客封面尺寸
        （1400×1400 / 3000×3000 / 自定义，单边不超过 4096）导出 PNG。支持 mp3 / m4a / wav / ogg / flac
        等浏览器可解码格式，建议单次处理不超过 10 分钟的音频。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：音频全程在本地解码与分桶聚合，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 波形预览 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 波形预览
          </h2>
          <span v-if="fileInfo" class="text-xs text-muted-foreground truncate max-w-[50%]">
            {{ fileInfo.name }} · {{ formatSize(fileInfo.size) }}
          </span>
        </div>

        <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
            <span class="text-xs">mp3 / m4a / wav / ogg / flac / webm，文件仅在本地解码</span>
          </button>
        </div>

        <div v-else class="space-y-2">
          <canvas ref="waveCanvas" class="w-full h-40 rounded-lg block" :class="bgMode === 'transparent' ? 'bg-muted' : ''"></canvas>
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>{{ sourceInfo }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors">
              重新选择文件
            </button>
            <span v-if="bgMode === 'transparent'" class="text-xs text-muted-foreground">透明背景：导出的 PNG 含 alpha 通道</span>
          </div>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码并聚合波形...</p>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>
        <p v-if="fileInfo && !isDecoding" class="text-xs text-muted-foreground flex items-start gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          处理在浏览器内存中完成，建议单次不超过 10 分钟；更长的音频建议先分段再生成封面。
        </p>
      </div>

      <!-- 样式与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Palette class="w-5 h-5 mr-2 text-primary" /> 样式与导出
        </h2>

        <template v-if="fileInfo">
          <!-- 样式 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">样式</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="s in styleOptions"
                :key="s.value"
                @click="style = s.value"
                class="py-2 text-sm rounded-lg border transition-colors"
                :class="style === s.value
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >{{ s.label }}</button>
            </div>
          </div>

          <!-- 条宽 / 间距 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-foreground">条宽</label>
                <span class="text-sm font-mono text-primary">{{ barWidth }} px</span>
              </div>
              <input v-model.number="barWidth" type="range" min="1" max="24" step="1" class="w-full accent-primary" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-foreground">间距</label>
                <span class="text-sm font-mono text-primary">{{ gap }} px</span>
              </div>
              <input v-model.number="gap" type="range" min="0" max="12" step="1" class="w-full accent-primary" />
            </div>
          </div>

          <!-- 配色 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">配色</label>
            <div class="flex flex-wrap items-center gap-2">
              <label
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border cursor-pointer transition-colors"
                :class="colorMode === 'solid' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'"
              >
                <input v-model="colorMode" type="radio" value="solid" class="accent-primary" /> 单色
              </label>
              <label
                v-if="colorMode === 'solid'"
                class="inline-flex items-center gap-2"
              >
                <input v-model="solidColor" type="color" class="w-8 h-8 rounded border border-border cursor-pointer bg-background" />
                <span class="text-xs font-mono text-muted-foreground">{{ solidColor }}</span>
              </label>
              <label
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border cursor-pointer transition-colors"
                :class="colorMode === 'gradient' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'"
              >
                <input v-model="colorMode" type="radio" value="gradient" class="accent-primary" /> 渐变
              </label>
              <button
                v-for="p in gradientPresets"
                :key="p.id"
                @click="colorMode = 'gradient'; gradientId = p.id"
                class="w-8 h-8 rounded-md border-2 transition-transform hover:scale-105"
                :class="colorMode === 'gradient' && gradientId === p.id ? 'border-primary' : 'border-border'"
                :style="{ background: `linear-gradient(90deg, ${p.from}, ${p.to})` }"
                :title="p.name"
              ></button>
              <span v-if="colorMode === 'gradient'" class="text-xs text-muted-foreground">
                {{ activeGradient.name }}（{{ activeGradient.from }} → {{ activeGradient.to }}）
              </span>
            </div>
          </div>

          <!-- 圆角条 -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="rounded" type="checkbox" class="accent-primary w-4 h-4" />
            <span class="text-sm text-foreground">圆角条（线条样式下为圆滑连线）</span>
          </label>

          <!-- 背景 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">背景</label>
            <div class="flex items-center gap-2">
              <label
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border cursor-pointer transition-colors"
                :class="bgMode === 'transparent' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'"
              >
                <input v-model="bgMode" type="radio" value="transparent" class="accent-primary" /> 透明
              </label>
              <label
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border cursor-pointer transition-colors"
                :class="bgMode === 'solid' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'"
              >
                <input v-model="bgMode" type="radio" value="solid" class="accent-primary" /> 纯色
              </label>
              <label v-if="bgMode === 'solid'" class="inline-flex items-center gap-2">
                <input v-model="bgColor" type="color" class="w-8 h-8 rounded border border-border cursor-pointer bg-background" />
                <span class="text-xs font-mono text-muted-foreground">{{ bgColor }}</span>
              </label>
            </div>
          </div>

          <!-- 导出尺寸 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">导出尺寸（单边最大 4096）</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in sizeOptions"
                :key="opt.value"
                @click="sizeMode = opt.value"
                class="py-2 text-xs rounded-lg border transition-colors"
                :class="sizeMode === opt.value
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >
                <span class="block font-medium">{{ opt.label }}</span>
                <span class="block text-[10px] opacity-75">{{ opt.hint }}</span>
              </button>
            </div>
            <div v-if="sizeMode === 'custom'" class="flex items-center gap-2 mt-2">
              <input
                v-model.number="customW" type="number" min="64" max="4096"
                class="w-24 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground"
              />
              <span class="text-muted-foreground">×</span>
              <input
                v-model.number="customH" type="number" min="64" max="4096"
                class="w-24 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground"
              />
              <span class="text-xs text-muted-foreground">px（64 ~ 4096，超限自动限制）</span>
            </div>
          </div>

          <button
            @click="exportPng"
            :disabled="isExporting"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Download class="w-4 h-4" /> 导出 PNG
          </button>
          <p v-if="isExporting" class="text-xs text-muted-foreground">{{ exportStatus }}</p>
          <p v-else-if="exportStatus" class="text-xs" :class="exportOk ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ exportStatus }}</p>
        </template>

        <p v-else class="text-sm text-muted-foreground">上传音频后即可调整波形样式并导出 PNG。</p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线音频波形图生成工具
        </h2>
        <p class="text-muted-foreground mb-6">
          想给播客加一张有声量的封面？本工具在浏览器里解码音频后，按目标画布宽度逐像素分桶聚合出最小/最大包络，
          再以条形、镜像或线条样式渲染波形。条宽、间距、单色/渐变配色、圆角与背景均可调，
          支持按 1x/2x/4x 高清倍率或 1400×1400、3000×3000 播客封面尺寸导出 PNG，全程本地处理、零上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">三种波形样式的区别</h3>
        <p class="text-muted-foreground mb-6">
          条形样式以中线为轴对称绘制每个位置的峰值振幅，是社交媒体分享图里最常见的样式；
          镜像样式按真实的 min/max 包络上下展开，能保留波形本身的不对称形状，更接近剪辑软件里的显示；
          线条样式用平滑折线勾出上下包络，适合极简风格的封面排版。三种样式都支持渐变与圆角。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">播客封面尺寸建议</h3>
        <p class="text-muted-foreground mb-6">
          各大播客平台（Apple Podcasts、小宇宙等）要求封面为 1400×1400 到 3000×3000 的正方形 JPG/PNG。
          本工具内置这两个预设，也可自定义宽高（单边不超过 4096，防止超出画布内存限制）。
          若需要非正方形配图（公众号首图、视频封面等），选自定义尺寸即可，波形会按目标比例重新分桶渲染，不会拉伸变形。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">长音频为什么也不卡</h3>
        <p class="text-muted-foreground mb-6">
          波形图不需要逐采样绘制：解码后直接在原始声道数据上按目标桶数做一遍流式 min/max 聚合，
          一亿级采样也只是一次线性扫描，不会复制第二份全量数组。预览用画布宽度的桶数实时重绘，
          导出时才按目标分辨率重新聚合一次，因此 3000×3000 的封面导出依然干脆利落。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">导出的 PNG 是高清的吗？透明背景保留吗？</h3>
            <p class="text-muted-foreground mt-1">
              预览尺寸可按 1x/2x/4x 倍率导出，也可直接选 1400×1400、3000×3000 或自定义尺寸，
              导出时按目标分辨率重新分桶渲染而非放大预览图，边缘清晰不发虚。背景选「透明」时，
              导出的 PNG 保留 alpha 通道，可直接叠在其它底图上。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么预览和导出图不完全一样？</h3>
            <p class="text-muted-foreground mt-1">
              波形按画布宽度分桶聚合，预览画布与导出画布宽度不同，桶数与条宽排布自然不同——
              这是按目标分辨率重新渲染的正常表现，包络形状一致。条形样式下导出尺寸越大，可分到的条数越多、细节越丰富。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些音频格式？文件会上传吗？</h3>
            <p class="text-muted-foreground mt-1">
              凡是当前浏览器能解码的格式都可以生成波形，包括 mp3、m4a/aac、wav、ogg、flac、webm 等。
              全程在浏览器本地解码与计算，文件不会上传到任何服务器，断网也能用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">多长的音频合适？</h3>
            <p class="text-muted-foreground mt-1">
              波形聚合是一次线性扫描，几分钟的播客与一小时的音频都能快速处理；受浏览器内存限制，
              建议单次不超过 10 分钟。更长的音频请分段生成，或先用音频工具裁出需要的片段。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-waveform'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  AudioLines, Waves, Palette, ShieldCheck, Upload, Download,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频波形图生成 - 播客封面级声波图导出高清 PNG',
  description: '在线音频波形图生成工具，上传音频按画布宽度分桶聚合包络，条形/镜像/线条样式与渐变配色可调，支持 1x/2x/4x 高清倍率与 1400/3000 播客封面尺寸导出 PNG，全程本地处理不上传',
  keywords: '音频波形图, 波形图生成, 播客封面, 声波图制作, 音频可视化, waveform generator',
  author: 'Util工具箱',
  ogTitle: '音频波形图生成 - 有条工具',
  ogDescription: '上传音频生成播客封面级波形图，多种样式配色，导出高清 PNG，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/audio-waveform',
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
          '@type': 'SoftwareApplication',
          name: '音频波形图生成',
          url: 'https://www.util.cn/tools/audio-waveform',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['条形/镜像/线条三种样式', '条宽与间距可调', '单色与渐变配色', '圆角条开关', '透明或纯色背景', '1x/2x/4x 高清 PNG 导出', '1400/3000 播客封面预设', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频波形图生成', item: 'https://www.util.cn/tools/audio-waveform/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '导出的 PNG 是高清的吗？透明背景保留吗？',
              acceptedAnswer: { '@type': 'Answer', text: '预览可按 1x/2x/4x 倍率导出，也可直接选 1400×1400、3000×3000 或自定义尺寸（单边不超过 4096），导出时按目标分辨率重新分桶渲染；透明背景导出的 PNG 保留 alpha 通道。' }
            },
            {
              '@type': 'Question',
              name: '为什么预览和导出图不完全一样？',
              acceptedAnswer: { '@type': 'Answer', text: '波形按画布宽度分桶聚合，预览与导出画布宽度不同导致桶数与条宽排布不同，属正常表现，包络形状一致。' }
            },
            {
              '@type': 'Question',
              name: '支持哪些音频格式？文件会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器能解码的格式均可，包括 mp3、m4a/aac、wav、ogg、flac、webm；全程本地解码计算，文件不上传。' }
            },
            {
              '@type': 'Question',
              name: '多长的音频合适？',
              acceptedAnswer: { '@type': 'Answer', text: '波形聚合是一次线性扫描，长音频也能快速处理；受浏览器内存限制建议单次不超过 10 分钟，更长音频请分段处理。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-waveform')

// ---------- 常量 ----------
const styleOptions = [
  { value: 'bars', label: '条形' },
  { value: 'mirror', label: '镜像' },
  { value: 'line', label: '线条' }
]
const gradientPresets = [
  { id: 'sunset', name: '日落', from: '#f97316', to: '#ef4444' },
  { id: 'ocean', name: '海洋', from: '#06b6d4', to: '#3b82f6' },
  { id: 'violet', name: '紫罗兰', from: '#8b5cf6', to: '#ec4899' }
]
const sizeOptions = [
  { value: 'preview1', label: '预览 1x', hint: '跟随画布' },
  { value: 'preview2', label: '预览 2x', hint: '高清' },
  { value: 'preview4', label: '预览 4x', hint: '超清' },
  { value: 'cover1400', label: '封面 1400', hint: '1400×1400' },
  { value: 'cover3000', label: '封面 3000', hint: '3000×3000' },
  { value: 'custom', label: '自定义', hint: '宽 × 高' }
]

// ---------- 状态 ----------
const fileInput = ref(null)
const waveCanvas = ref(null)
const fileInfo = ref(null)
const sourceInfo = ref('')
const duration = ref(0)
const isDecoding = ref(false)
const isExporting = ref(false)
const exportStatus = ref('')
const exportOk = ref(false)
const loadError = ref('')
const seoContentVisible = ref(true)

const style = ref('bars')
const barWidth = ref(6)
const gap = ref(3)
const colorMode = ref('gradient')
const solidColor = ref('#10b981')
const gradientId = ref('sunset')
const rounded = ref(true)
const bgMode = ref('transparent')
const bgColor = ref('#0f172a')
const sizeMode = ref('cover1400')
const customW = ref(1400)
const customH = ref(1400)

const activeGradient = computed(() => {
  return gradientPresets.find(p => p.id === gradientId.value) || gradientPresets[0]
})

// 非响应式大对象（AudioBuffer / 峰值缓存）
let audioBuffer = null
let peaksCache = { cols: 0, peaks: null }
let resizeRaf = null

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = null }
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }
const onResize = () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  resizeRaf = requestAnimationFrame(() => { resizeRaf = null; drawPreview() })
}

const formatTime = (t) => {
  const s = Math.max(0, Number(t) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}
const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 纯函数（node 自测覆盖） ----------
const DIM_MIN = 64
const DIM_MAX = 4096

// 等宽分桶取 min/max：桶 b 覆盖 [floor(b*len/buckets), floor((b+1)*len/buckets))
// 桶数多于样本数时，空桶返回 {min:0, max:0}；buckets <= 0 返回空数组
function computePeaks(samples, buckets) {
  const out = []
  const n = samples ? samples.length : 0
  const b = Math.floor(buckets)
  if (!n || !(b > 0)) return out
  for (let i = 0; i < b; i++) {
    const s = Math.floor(i * n / b)
    const e = Math.floor((i + 1) * n / b)
    let mn = Infinity
    let mx = -Infinity
    for (let j = s; j < e; j++) {
      const v = samples[j]
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    // 空桶（桶数 > 样本数时出现）按平线 {0,0} 处理
    out.push(s >= e ? { min: 0, max: 0 } : { min: mn, max: mx })
  }
  return out
}

// 合并两份包络（多声道聚合用，避免复制第二份全量数组）
function mergePeaks(a, b) {
  const n = Math.max(a ? a.length : 0, b ? b.length : 0)
  const out = []
  for (let i = 0; i < n; i++) {
    const pa = (a && a[i]) || { min: 0, max: 0 }
    const pb = (b && b[i]) || { min: 0, max: 0 }
    out.push({
      min: Math.min(pa.min, pb.min),
      max: Math.max(pa.max, pb.max)
    })
  }
  return out
}

// 多声道：首声道全量聚合，其余声道逐声道聚合后按桶合并（每声道一次线性扫描，无全量复制）
function computePeaksFromChannels(channels, buckets) {
  if (!channels || !channels.length) return []
  let peaks = computePeaks(channels[0], buckets)
  for (let c = 1; c < channels.length; c++) {
    peaks = mergePeaks(peaks, computePeaks(channels[c], buckets))
  }
  return peaks
}

// 颜色工具：#rgb / #rrggbb → {r,g,b}，非法输入返回 null
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return '#' + c(r) + c(g) + c(b)
}

function lerpColor(fromHex, toHex, t) {
  const a = hexToRgb(fromHex)
  const b = hexToRgb(toHex)
  if (!a || !b) return fromHex
  const k = Math.max(0, Math.min(1, Number(t) || 0))
  return rgbToHex(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k)
}

// 第 index 根条的颜色：单色直出，渐变按位置线性插值
function resolveBarColor(index, count, opts) {
  if (!opts || opts.colorMode !== 'gradient') return (opts && opts.color) || '#10b981'
  const t = count > 1 ? index / (count - 1) : 0
  return lerpColor(opts.gradientFrom, opts.gradientTo, t)
}

// 尺寸保护：钳制到 [DIM_MIN, DIM_MAX] 的整数
function clampDimension(v) {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return DIM_MIN
  return Math.max(DIM_MIN, Math.min(DIM_MAX, n))
}

// 视觉列数：条形按 (barWidth+gap) 排布，镜像/线条每像素一列；至少 1 列
function columnsFor(styleName, width, barWidthIn, gapIn) {
  const w = Math.max(1, Math.floor(width))
  if (styleName === 'bars') {
    const step = Math.max(1, (barWidthIn || 1) + (gapIn || 0))
    return Math.max(1, Math.floor(w / step))
  }
  return w
}

// ---------- 纯函数结束 ----------

// ---------- 文件解码（用户手势回调内创建 AudioContext） ----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  exportStatus.value = ''
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    audioBuffer = buf
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '未知'
    fileInfo.value = { name: file.name, size: file.size, ext }
    sourceInfo.value = `${ext} · ${buf.sampleRate}Hz · ${buf.numberOfChannels === 1 ? '单声道' : buf.numberOfChannels + ' 声道'}`
    duration.value = buf.duration
    peaksCache = { cols: 0, peaks: null }
    drawPreview()
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- 峰值获取（按列数缓存，避免样式微调时重复全量扫描） ----------
const getPeaksFor = (cols) => {
  if (!audioBuffer) return []
  if (peaksCache.cols === cols && peaksCache.peaks) return peaksCache.peaks
  const chans = []
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    chans.push(audioBuffer.getChannelData(c))
  }
  const peaks = computePeaksFromChannels(chans, cols)
  peaksCache = { cols, peaks }
  return peaks
}

const drawOpts = () => ({
  styleName: style.value,
  barWidth: barWidth.value,
  gap: gap.value,
  rounded: rounded.value,
  colorMode: colorMode.value,
  color: solidColor.value,
  gradientFrom: activeGradient.value.from,
  gradientTo: activeGradient.value.to,
  bgColor: bgMode.value === 'solid' ? bgColor.value : null
})

// ---------- 波形绘制 ----------
const fillBackground = (g, w, h, opts) => {
  if (opts.bgColor) {
    g.fillStyle = opts.bgColor
    g.fillRect(0, 0, w, h)
  }
}

const drawWaveform = (g, peaks, w, h, opts) => {
  const n = peaks.length
  if (!n) return
  const mid = h / 2
  const pad = Math.max(4, h * 0.05)
  const scale = (h / 2 - pad) / 1

  if (opts.styleName === 'line') {
    // 线条：上下包络折线，渐变沿 x 轴过渡
    let stroke = opts.color
    if (opts.colorMode === 'gradient') {
      const grad = g.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, opts.gradientFrom)
      grad.addColorStop(1, opts.gradientTo)
      stroke = grad
    }
    g.strokeStyle = stroke
    g.lineWidth = Math.max(1, Math.min(8, opts.barWidth))
    g.lineJoin = 'round'
    g.lineCap = 'round'
    g.beginPath()
    for (let i = 0; i < n; i++) {
      const x = n > 1 ? (i / (n - 1)) * w : 0
      const y = mid - peaks[i].max * scale
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    for (let i = n - 1; i >= 0; i--) {
      const x = n > 1 ? (i / (n - 1)) * w : 0
      g.lineTo(x, mid - peaks[i].min * scale)
    }
    g.closePath()
    g.stroke()
    return
  }

  // 条形（对称峰值）/ 镜像（真实 min-max 包络）
  const step = w / n
  const barW = Math.max(1, Math.min(opts.barWidth, step))
  for (let i = 0; i < n; i++) {
    const x = i * step + (step - barW) / 2
    g.fillStyle = resolveBarColor(i, n, opts)
    let y0
    let y1
    if (opts.styleName === 'bars') {
      const amp = Math.max(Math.abs(peaks[i].min), Math.abs(peaks[i].max))
      y0 = mid - amp * scale
      y1 = mid + amp * scale
    } else {
      y0 = mid - peaks[i].max * scale
      y1 = mid - peaks[i].min * scale
    }
    const bh = Math.max(2, y1 - y0)
    const yTop = Math.min(y0, y1)
    if (opts.rounded && typeof g.roundRect === 'function' && barW > 2) {
      g.beginPath()
      g.roundRect(x, yTop, barW, bh, Math.min(barW / 2, bh / 2))
      g.fill()
    } else {
      g.fillRect(x, yTop, barW, bh)
    }
  }
}

const drawPreview = () => {
  const canvas = waveCanvas.value
  if (!canvas || !audioBuffer || !fileInfo.value) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || canvas.parentElement.clientWidth
  const h = canvas.clientHeight || 160
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  const opts = drawOpts()
  g.clearRect(0, 0, w, h)
  fillBackground(g, w, h, opts)
  const cols = columnsFor(opts.styleName, w, opts.barWidth, opts.gap)
  const peaks = getPeaksFor(cols)
  drawWaveform(g, peaks, w, h, opts)
}

watch([style, barWidth, gap, colorMode, solidColor, gradientId, rounded, bgMode, bgColor], () => {
  drawPreview()
})

// ---------- 导出 PNG（按目标分辨率重新聚合，1x/2x/4x 与封面预设） ----------
const resolveExportSize = () => {
  const canvas = waveCanvas.value
  if (sizeMode.value === 'preview1' || sizeMode.value === 'preview2' || sizeMode.value === 'preview4') {
    const mult = sizeMode.value === 'preview4' ? 4 : (sizeMode.value === 'preview2' ? 2 : 1)
    const w = canvas && canvas.clientWidth ? canvas.clientWidth : 800
    const h = canvas && canvas.clientHeight ? canvas.clientHeight : 160
    return { w: clampDimension(w * mult), h: clampDimension(h * mult) }
  }
  if (sizeMode.value === 'cover1400') return { w: 1400, h: 1400 }
  if (sizeMode.value === 'cover3000') return { w: 3000, h: 3000 }
  return { w: clampDimension(customW.value), h: clampDimension(customH.value) }
}

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  try {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('画布导出失败'))
    }, 'image/png')
  } catch (err) {
    reject(err)
  }
})

const exportPng = async () => {
  if (!audioBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = '正在按目标分辨率聚合波形并渲染...'
  try {
    const { w, h } = resolveExportSize()
    const opts = drawOpts()
    const cols = columnsFor(opts.styleName, w, opts.barWidth, opts.gap)
    const peaks = getPeaksFor(cols)
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const g = off.getContext('2d')
    fillBackground(g, w, h, opts)
    drawWaveform(g, peaks, w, h, opts)
    const blob = await canvasToBlob(off)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waveform-${w}x${h}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    exportOk.value = true
    exportStatus.value = `PNG 导出成功（${w}×${h}，${formatSize(blob.size)}），文件未离开浏览器`
  } catch (err) {
    exportOk.value = false
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}
</script>
