<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Film class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频转GIF动图</h1>
          <p class="text-sm text-muted-foreground mt-1">本地抽帧把短视频片段转 GIF，帧率/尺寸/起止时间可调，无上传无水印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择本地短视频，拖动滑条选取起止时间，即可按设定帧率与宽度抽帧并编码为 GIF 动图，支持 5/10/15 帧率与 240/360/480 宽度输出。抽帧与编码全部在浏览器本地完成，视频不上传服务器，适合制作表情包与演示动图。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择视频文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="video/*,.mp4,.webm,.mov,.m4v"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入视频文件（建议 ≤200MB）</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地抽帧，视频不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Film class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}<span v-if="duration"> · 时长 {{ formatTime(duration) }}</span><span v-if="videoSize.w"> · {{ videoSize.w }}×{{ videoSize.h }}</span></p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- 转换参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 转换参数
          </h2>

          <!-- 起止时间 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              开始时间：<span class="text-primary">{{ startTime.toFixed(1) }}s</span>
            </label>
            <input
              v-model.number="startTime"
              type="range"
              min="0"
              :max="durationMax"
              step="0.1"
              class="w-full accent-primary"
              :disabled="!duration"
              @input="clampTimes"
            />
            <label class="block text-sm font-medium text-foreground mb-2 mt-3">
              结束时间：<span class="text-primary">{{ endTime.toFixed(1) }}s</span>
            </label>
            <input
              v-model.number="endTime"
              type="range"
              min="0"
              :max="durationMax"
              step="0.1"
              class="w-full accent-primary"
              :disabled="!duration"
              @input="clampTimes"
            />
            <div class="flex items-center gap-2 mt-3">
              <input
                v-model.number="startTime"
                @input="clampTimes"
                type="number"
                min="0"
                :max="durationMax"
                step="0.1"
                class="w-24 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span class="text-xs text-muted-foreground">至</span>
              <input
                v-model.number="endTime"
                @input="clampTimes"
                type="number"
                min="0"
                :max="durationMax"
                step="0.1"
                class="w-24 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span class="text-xs text-muted-foreground ml-auto">{{ frameCount }} 帧 · 片段 {{ (endTime - startTime).toFixed(1) }}s</span>
            </div>
          </div>

          <!-- 帧率 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">帧率（fps）</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="f in fpsOptions"
                :key="f"
                @click="fps = f"
                :class="fps === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ f }} fps</button>
            </div>
          </div>

          <!-- 输出宽度 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出宽度（保持宽高比）</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="w in widthOptions"
                :key="w"
                @click="outWidth = w"
                :class="outWidth === w ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ w }}px</button>
            </div>
            <p v-if="outHeight" class="text-xs text-muted-foreground mt-1.5">预计输出 {{ outWidth }}×{{ outHeight }}，共 {{ frameCount }} 帧</p>
          </div>

          <button
            @click="convertToGif"
            :disabled="!duration || processing"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Clapperboard v-else class="w-4 h-4" />
            {{ processing ? `抽帧中 ${captured}/${frameCount}` : '开始转换 GIF' }}
          </button>

          <!-- 进度条 -->
          <div v-if="processing || progressPercent > 0" class="h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPercent + '%' }"></div>
          </div>

          <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 视频预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 视频预览
          </h2>
          <video
            ref="videoEl"
            :src="videoUrl"
            muted
            preload="auto"
            controls
            class="w-full max-h-96 rounded-lg bg-black"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
          ></video>
        </div>

        <!-- GIF 结果卡片 -->
        <div v-if="gifUrl" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> GIF 已生成
          </h2>
          <div class="rounded-lg overflow-hidden border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] flex justify-center mb-4">
            <img :src="gifUrl" alt="生成的GIF预览" class="max-w-full max-h-96" />
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">文件大小</p>
              <p class="font-bold" :class="gifSize > 10 * 1024 * 1024 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">{{ formatSize(gifSize) }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">尺寸</p>
              <p class="font-bold text-foreground">{{ outWidth }}×{{ outHeight }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">帧数</p>
              <p class="font-bold text-foreground">{{ frameCount }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">帧率</p>
              <p class="font-bold text-foreground">{{ fps }} fps</p>
            </div>
          </div>
          <p v-if="gifSize > 10 * 1024 * 1024" class="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1">
            <Info class="w-3 h-3 flex-shrink-0" /> GIF 超过 10MB，部分平台可能限制上传；建议降低帧率或缩小输出宽度后重试。
          </p>
          <button
            @click="downloadGif"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 GIF（{{ formatSize(gifSize) }}）
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!videoUrl && !gifUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择视频后，这里会显示预览与转换结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于视频转 GIF</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            GIF 是聊天与文档里最通用的"短视频"载体：微信表情包、群里演示操作、PPT 里放一段循环动画，都离不开它。本工具直接在浏览器里对视频逐时间点 seek 抽帧，再用 gifenc 编码为 GIF，全程本地完成，不排队、无水印、无大小上传限制（建议单个视频 ≤200MB 以免内存吃紧）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">帧率与宽度怎么选</h3>
          <p>
            表情包场景 10fps + 360px 宽是体积与流畅度的甜点位；动作快的片段（体育、游戏）选 15fps；只是演示静态变化的选 5fps 体积最小。宽度上 240px 适合微信表情，360px 适合群聊与文档嵌入，480px 接近清晰度上限（GIF 只有 256 色且无音频，不适合更高）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">体积为什么这么大</h3>
          <p>
            GIF 每一帧都是完整画面，只支持 256 色，压缩率远低于视频编码。控制体积的三板斧：缩短片段时长、降低帧率、缩小宽度——时长减半体积约减半，帧率从 15 降到 10 体积约减三分之一。生成结果超过 10MB 时工具会主动提醒。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些视频格式？</span>浏览器能播的都能转，常见 mp4/webm/mov 均可；部分 HEVC 编码的 iPhone 视频若无法预览，请先转成 mp4（H.264）。</li>
            <li><span class="text-foreground font-medium">转换后有水印或需要付费吗？</span>没有。抽帧与编码全部本地完成，输出无水印，也没有次数限制。</li>
            <li><span class="text-foreground font-medium">为什么转换比播放慢？</span>逐帧 seek 需要视频解码器反复定位，属于正常现象；片段越长帧数越多耗时越久，建议单次控制在 10 秒内。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-to-gif'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Film, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  Settings2, Clapperboard, MonitorPlay, ShieldCheck, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '视频转GIF动图 - 本地短视频抽帧转GIF工具',
  description: '在浏览器本地把短视频片段转成GIF动图：起止时间滑条选取、5/10/15帧率、240/360/480宽度可选，gifenc本地编码无上传无水印，超10MB主动提醒',
  keywords: '视频转gif, gif动图制作, 短视频转动图, 表情包制作, 视频截取gif, gif压缩',
  author: 'Util工具箱',
  ogTitle: '视频转GIF动图 - 有条工具',
  ogDescription: '本地抽帧把短视频片段转GIF，帧率/尺寸/起止时间可调，无上传无水印',
  ogUrl: 'https://www.util.cn/tools/video-to-gif',
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
          name: '视频转GIF动图',
          url: 'https://www.util.cn/tools/video-to-gif',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['起止时间滑条选取', '5/10/15fps帧率', '240/360/480输出宽度', '本地抽帧gifenc编码', '进度显示', '无上传无水印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '视频转GIF动图', item: 'https://www.util.cn/tools/video-to-gif/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持哪些视频格式？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器能播的都能转，常见mp4/webm/mov均可；HEVC编码的iPhone视频若无法预览，请先转成mp4（H.264）。' }
            },
            {
              '@type': 'Question',
              name: '转换后有水印或需要付费吗？',
              acceptedAnswer: { '@type': 'Answer', text: '没有。抽帧与编码全部在浏览器本地完成，输出无水印，也没有次数限制。' }
            },
            {
              '@type': 'Question',
              name: 'GIF体积为什么这么大？',
              acceptedAnswer: { '@type': 'Answer', text: 'GIF每帧都是完整画面且只有256色，压缩率远低于视频。缩短时长、降低帧率、缩小宽度都能显著减小体积。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'video-to-gif')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数（可独立测试） ----------
// 时间区间 → 抽帧时间点序列：从 start 起、步长 1/fps，含 end 端点，四舍五入到 0.1ms 避免浮点误差
const buildFrameTimes = (start, end, fps) => {
  const s = Math.max(0, Math.min(start, end))
  const e = Math.max(0, Math.max(start, end))
  const f = Math.max(1, fps)
  const step = 1 / f
  const total = Math.max(0, e - s)
  const count = Math.max(1, Math.round(total * f) + 1)
  const times = []
  for (let i = 0; i < count; i++) {
    const raw = s + i * step
    if (raw > e + 1e-9) break
    times.push(Math.min(Math.round(raw * 10000) / 10000, e))
  }
  return times
}

const formatTime = (sec) => {
  const s = Math.max(0, sec)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return m > 0 ? `${m}分${r.toFixed(1)}秒` : `${r.toFixed(1)}秒`
}

// ---------- 状态 ----------
const file = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const fileInput = ref(null)
const videoEl = ref(null)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const processing = ref(false)
const captured = ref(0)
const error = ref('')

const startTime = ref(0)
const endTime = ref(0)
const fps = ref(10)
const outWidth = ref(360)

const gifUrl = ref('')
const gifSize = ref(0)

const fpsOptions = [5, 10, 15]
const widthOptions = [240, 360, 480]

const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const durationMax = computed(() => (duration.value ? Math.max(0.1, Math.round(duration.value * 10) / 10) : 1))
const frameCount = computed(() => buildFrameTimes(startTime.value, endTime.value, fps.value).length)
const outHeight = computed(() => {
  if (!videoSize.value.w || !videoSize.value.h) return 0
  return Math.max(2, Math.round((outWidth.value * videoSize.value.h) / videoSize.value.w / 2) * 2)
})
const progressPercent = computed(() => {
  const total = frameCount.value
  return total ? Math.min(100, Math.round((captured.value / total) * 100)) : 0
})

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const clampTimes = () => {
  const max = durationMax.value
  let s = Number(startTime.value) || 0
  let e = Number(endTime.value) || 0
  s = Math.min(Math.max(0, s), max)
  e = Math.min(Math.max(0, e), max)
  if (e < s) {
    const t = s
    s = e
    e = t
  }
  startTime.value = s
  endTime.value = e
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetVideo = () => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  startTime.value = 0
  endTime.value = 0
  captured.value = 0
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  gifUrl.value = ''
  gifSize.value = 0
}

const acceptFile = (f) => {
  if (!f) return
  error.value = ''
  if (!f.type.startsWith('video/')) {
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > 200 * 1024 * 1024) {
    error.value = '视频超过 200MB，本地抽帧可能导致内存不足，请先裁剪或压缩后再试'
    return
  }
  resetVideo()
  file.value = f
  fileName.value = f.name
  fileSize.value = f.size
  // 用户交互回调内创建对象 URL（浏览器 API）
  videoUrl.value = URL.createObjectURL(f)
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

const clearFile = () => {
  resetVideo()
  error.value = ''
}

const onLoadedMetadata = () => {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  // 默认取前 10 秒（不足则取整段），避免长视频默认生成超大 GIF
  startTime.value = 0
  endTime.value = Math.min(duration.value, 10)
}

const onVideoError = () => {
  error.value = '视频无法在浏览器中播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

// ---------- 抽帧与编码 ----------
const seekTo = (video, t) => {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      video.removeEventListener('seeked', onSeeked)
      clearTimeout(timer)
      resolve()
    }
    const onSeeked = () => {
      // 等待一帧渲染完成再抓取
      requestAnimationFrame(() => finish())
    }
    const timer = setTimeout(finish, 1500)
    video.addEventListener('seeked', onSeeked)
    video.currentTime = t
  })
}

const convertToGif = async () => {
  const video = videoEl.value
  if (!video || !duration.value) {
    error.value = '请先选择可播放的视频文件'
    return
  }
  clampTimes()
  processing.value = true
  error.value = ''
  captured.value = 0
  try {
    const times = buildFrameTimes(startTime.value, endTime.value, fps.value)
    const w = outWidth.value
    const h = Math.max(2, Math.round((w * (video.videoHeight || 2)) / (video.videoWidth || 1) / 2) * 2)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
    const encoder = GIFEncoder()
    const delay = Math.round(1000 / fps.value)

    for (let i = 0; i < times.length; i++) {
      await seekTo(video, times[i])
      ctx.drawImage(video, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      const rgba = new Uint8Array(imageData.data.buffer)
      const palette = quantize(rgba, 256)
      const index = applyPalette(rgba, palette)
      encoder.writeFrame(index, w, h, { palette, delay })
      captured.value = i + 1
      // 让出主线程，刷新进度条
      if (i % 3 === 2) await new Promise(r => setTimeout(r, 0))
    }

    encoder.finish()
    if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
    const blob = new Blob([encoder.bytes()], { type: 'image/gif' })
    gifUrl.value = URL.createObjectURL(blob)
    gifSize.value = blob.size
  } catch (err) {
    error.value = '转换失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    processing.value = false
  }
}

const downloadGif = () => {
  if (!gifUrl.value) return
  const a = document.createElement('a')
  a.href = gifUrl.value
  const base = (fileName.value || 'video').replace(/\.[^.]+$/, '')
  a.download = `${base}.gif`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>
