<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sliders class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频裁剪铃声制作</h1>
          <p class="text-sm text-muted-foreground mt-1">波形选区裁剪音乐片段，一键导出 WAV 或 iPhone 铃声 .m4r</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传歌曲后自动绘制波形包络，拖动起点/终点滑条选取高潮片段，试听满意后即可导出裁剪音频，
        或直接录制成 iPhone 铃声使用的 .m4r 格式（自动提示 40 秒限制）。支持 mp3 / m4a / wav / ogg / flac 等浏览器可解码格式。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：音频全程通过 WebAudio 在本地解码与裁剪，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 波形与选区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 波形与选区
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
          <canvas ref="waveCanvas" class="w-full h-36 bg-muted rounded-lg block"></canvas>
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>{{ sourceInfo }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
          <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors">
            重新选择文件
          </button>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码音频...</p>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>
      </div>

      <!-- 选区与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Scissors class="w-5 h-5 mr-2 text-primary" /> 选区与导出
        </h2>

        <template v-if="fileInfo">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              起点：<span class="text-primary">{{ formatTime(startSec) }}</span>
            </label>
            <input v-model.number="startSec" type="range" min="0" :max="duration" step="0.01" class="w-full accent-primary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              终点：<span class="text-primary">{{ formatTime(endSec) }}</span>
            </label>
            <input v-model.number="endSec" type="range" min="0" :max="duration" step="0.01" class="w-full accent-primary" />
          </div>

          <div class="bg-muted/50 rounded-lg p-3 text-sm flex items-center justify-between">
            <span class="text-muted-foreground">选区时长</span>
            <span class="font-semibold text-foreground">{{ selectionDuration.toFixed(2) }} 秒</span>
          </div>

          <p v-if="ringtoneWarn" class="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            iPhone 铃声需 ≤ 40 秒，当前选区超长，仍可导出但同步到手机后可能无法设为铃声。
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-if="!isPlaying"
              @click="playSelection"
              class="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              <Play class="w-4 h-4" /> 试听选区
            </button>
            <button
              v-else
              @click="stopPlayback"
              class="py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <Square class="w-4 h-4" /> 停止
            </button>
            <button
              @click="resetSelection"
              class="py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              重置选区
            </button>
          </div>

          <div class="border-t border-border pt-4 space-y-2">
            <button
              @click="exportWav"
              :disabled="isExporting"
              class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Download class="w-4 h-4" /> 导出 WAV
            </button>
            <button
              @click="exportM4r"
              :disabled="isExporting || !m4rSupported"
              class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              :class="m4rSupported
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground/60 cursor-not-allowed'"
              :title="m4rSupported ? '' : '当前浏览器不支持 audio/mp4 录制，请改用 Safari 或 Chrome'"
            >
              <Download class="w-4 h-4" /> 导出 iPhone 铃声 .m4r
            </button>
            <p v-if="!m4rSupported" class="text-xs text-muted-foreground">
              当前浏览器不支持 audio/mp4 录制，m4r 选项已置灰，请改用 Safari 或 Chrome。
            </p>
            <p v-if="isExporting" class="text-xs text-muted-foreground">{{ exportStatus }}</p>
            <p v-else-if="exportStatus" class="text-xs text-green-600 dark:text-green-400">{{ exportStatus }}</p>
          </div>
        </template>

        <p v-else class="text-sm text-muted-foreground">上传音频后即可选择片段并导出。</p>
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
          在线音频裁剪与铃声制作工具
        </h2>
        <p class="text-muted-foreground mb-6">
          想把喜欢的歌曲副歌做成手机铃声？本工具在浏览器里直接解码音频并绘制波形包络，
          用两个滑条即可精确到 0.01 秒地选取起点与终点，试听确认后导出 WAV 或 iPhone 铃声 .m4r，
          全程无需安装软件，也没有文件大小与排队限制。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么选择本地裁剪</h3>
        <p class="text-muted-foreground mb-6">
          音频文件包含大量个人信息，上传到第三方服务器既有泄露风险又受网速限制。本工具基于 WebAudio
          在浏览器本地完成解码、波形计算与裁剪导出，文件不出浏览器，断网也能用，处理速度只取决于本机性能。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">如何制作 iPhone 铃声（.m4r）</h3>
        <p class="text-muted-foreground mb-6">
          iPhone 铃声要求 AAC 编码、长度不超过 40 秒。选取片段后点击「导出 iPhone 铃声 .m4r」，
          工具会用 OfflineAudioContext 精确渲染选区，再通过浏览器的媒体录制能力输出 m4r 容器；
          若选区超过 40 秒会出现黄色警告提示。导出后通过 iCloud、访达或 iTunes 同步到手机，即可在声音设置中选用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">波形选区怎么用</h3>
        <p class="text-muted-foreground mb-6">
          上传后波形会按最小/最大包络降采样绘制，选区范围以高亮显示、区外灰显，播放头在试听时实时移动。
          起点与终点滑条步进 0.01 秒，可以反复微调；「试听选区」只播放选中片段，方便确认高潮部分的切入切出点。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些音频格式？</h3>
            <p class="text-muted-foreground mt-1">
              凡是当前浏览器能解码的格式都可以裁剪，包括 mp3、m4a/aac、wav、ogg、flac、webm 等。
              Chrome 与 Edge 对 m4a/aac 支持最好；flac 在主流桌面浏览器均已支持。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">导出的 m4r 在手机上不显示怎么办？</h3>
            <p class="text-muted-foreground mt-1">
              请确认选区不超过 40 秒，并使用 Safari 或 Chrome 导出（需浏览器支持 audio/mp4 录制）。
              同步后需在 iPhone 的「设置 - 声音与触感 - 电话铃声」中手动选择；部分系统版本要求铃声通过电脑端完成同步。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">裁剪会损失音质吗？</h3>
            <p class="text-muted-foreground mt-1">
              导出 WAV 时按原始采样率无损截取，不重新压缩；m4r 为满足 iPhone 要求会进行有损编码，
              但铃声场景下 40 秒片段的听感差异通常可以忽略。源文件始终保持只读，不会被修改。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-trimmer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sliders, Waves, Scissors, ShieldCheck, Upload, Play, Square,
  Download, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频裁剪铃声制作 - 本地波形裁剪/导出 iPhone m4r 铃声',
  description: '在线音频裁剪工具，上传歌曲绘制波形选区，精确裁剪音乐片段并导出 WAV 或 iPhone 铃声 m4r（自动校验40秒限制），全程浏览器本地处理，文件不上传',
  keywords: '铃声制作, mp3裁剪, 音频剪辑, m4r铃声, 歌曲剪高潮, 音频裁剪, iphone铃声制作',
  author: 'Util工具箱',
  ogTitle: '音频裁剪铃声制作 - 有条工具',
  ogDescription: '波形选区裁剪音乐片段，一键导出 WAV 或 iPhone 铃声 m4r，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/audio-trimmer',
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
          name: '音频裁剪铃声制作',
          url: 'https://www.util.cn/tools/audio-trimmer',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['波形可视化选区', '0.01秒精确裁剪', '选区试听', '导出WAV', '导出iPhone铃声m4r', '40秒铃声限制校验', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频裁剪铃声制作', item: 'https://www.util.cn/tools/audio-trimmer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持哪些音频格式？',
              acceptedAnswer: { '@type': 'Answer', text: '凡是当前浏览器能解码的格式都可以裁剪，包括 mp3、m4a/aac、wav、ogg、flac、webm 等。' }
            },
            {
              '@type': 'Question',
              name: '导出的 m4r 在手机上不显示怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '请确认选区不超过 40 秒，并使用 Safari 或 Chrome 导出，同步后在 iPhone 声音设置中手动选择铃声。' }
            },
            {
              '@type': 'Question',
              name: '裁剪会损失音质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '导出 WAV 按原始采样率无损截取；m4r 为满足 iPhone 要求会进行有损编码，铃声场景听感差异可忽略。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-trimmer')

// ---------- 状态 ----------
const fileInput = ref(null)
const waveCanvas = ref(null)
const fileInfo = ref(null)
const sourceInfo = ref('')
const duration = ref(0)
const startSec = ref(0)
const endSec = ref(0)
const isDecoding = ref(false)
const isPlaying = ref(false)
const isExporting = ref(false)
const exportStatus = ref('')
const loadError = ref('')
const playheadPos = ref(0)
const m4rSupported = ref(false)
const seoContentVisible = ref(true)

// 非响应式大对象（AudioBuffer / 波形缓存）
let audioBuffer = null
let wavePeaks = null
let playCtx = null
let playRaf = null

const selectionDuration = computed(() => Math.max(0, endSec.value - startSec.value))
const ringtoneWarn = computed(() => selectionDuration.value > 40)

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 能力检测：audio/mp4 录制（Chrome / Safari 支持，Firefox 不支持）
  try {
    m4rSupported.value = typeof MediaRecorder !== 'undefined'
      && typeof MediaRecorder.isTypeSupported === 'function'
      && MediaRecorder.isTypeSupported('audio/mp4')
  } catch (e) {
    m4rSupported.value = false
  }
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }

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
function sliceBufferChannels(data, sampleRate, start, end) {
  const total = data.length
  let s = Math.floor(start * sampleRate)
  let e = Math.floor(end * sampleRate)
  s = Math.max(0, Math.min(total, s))
  e = Math.max(s, Math.min(total, e))
  return data.slice(s, e)
}

function encodeWavFromChannels(channels, sampleRate) {
  const numCh = Math.max(1, channels.length)
  const numFrames = channels[0] ? channels[0].length : 0
  const blockAlign = numCh * 2
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numCh, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i]
      s = s > 1 ? 1 : (s < -1 ? -1 : s)
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }
  }
  return new Uint8Array(buffer)
}

function encodeWav(audioBufferIn) {
  const chans = []
  for (let c = 0; c < audioBufferIn.numberOfChannels; c++) {
    chans.push(audioBufferIn.getChannelData(c))
  }
  return encodeWavFromChannels(chans, audioBufferIn.sampleRate)
}

function computeWaveformPeaks(data, bucketCount) {
  const mins = new Float32Array(bucketCount)
  const maxs = new Float32Array(bucketCount)
  const size = Math.max(1, Math.floor(data.length / bucketCount))
  for (let b = 0; b < bucketCount; b++) {
    const s = b * size
    const e = Math.min(data.length, s + size)
    let mn = 0
    let mx = 0
    for (let i = s; i < e; i++) {
      const v = data[i]
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    mins[b] = mn
    maxs[b] = mx
  }
  return { mins, maxs }
}

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
    startSec.value = 0
    endSec.value = Math.min(buf.duration, 30)
    wavePeaks = computeWaveformPeaks(buf.getChannelData(0), 600)
    drawWave()
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- 选区联动 ----------
watch(startSec, (v) => {
  const d = duration.value
  if (v < 0) startSec.value = 0
  else if (v > d) startSec.value = d
  if (endSec.value - startSec.value < 0.1) startSec.value = Math.max(0, endSec.value - 0.1)
  drawWave()
})
watch(endSec, (v) => {
  const d = duration.value
  if (v > d) endSec.value = d
  else if (v < 0) endSec.value = 0
  if (endSec.value - startSec.value < 0.1) endSec.value = Math.min(d, startSec.value + 0.1)
  drawWave()
})

const resetSelection = () => {
  startSec.value = 0
  endSec.value = Math.min(duration.value, 30)
}

// ---------- 波形绘制 ----------
const drawWave = () => {
  const canvas = waveCanvas.value
  if (!canvas || !wavePeaks || !fileInfo.value) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || canvas.parentElement.clientWidth
  const h = canvas.clientHeight || 144
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, w, h)
  const d = duration.value || 1
  const { mins, maxs } = wavePeaks
  const n = mins.length
  const mid = h / 2
  const scale = (h / 2 - 6) / 1
  // 选区高亮背景
  const selX0 = (startSec.value / d) * w
  const selX1 = (endSec.value / d) * w
  g.fillStyle = 'rgba(16, 185, 129, 0.10)'
  g.fillRect(selX0, 0, Math.max(2, selX1 - selX0), h)
  // 中线
  g.strokeStyle = 'rgba(128, 128, 128, 0.35)'
  g.beginPath()
  g.moveTo(0, mid)
  g.lineTo(w, mid)
  g.stroke()
  // 包络
  const bw = w / n
  for (let i = 0; i < n; i++) {
    const x = i * bw
    const inSel = x + bw / 2 >= selX0 && x + bw / 2 <= selX1
    g.fillStyle = inSel ? '#10b981' : 'rgba(148, 163, 184, 0.75)'
    const y0 = mid - maxs[i] * scale
    const y1 = mid - mins[i] * scale
    g.fillRect(x, y0, Math.max(1, bw * 0.9), Math.max(1.5, y1 - y0))
  }
  // 选区边界
  g.strokeStyle = '#059669'
  g.lineWidth = 1.5
  g.beginPath(); g.moveTo(selX0, 0); g.lineTo(selX0, h); g.stroke()
  g.beginPath(); g.moveTo(selX1, 0); g.lineTo(selX1, h); g.stroke()
  // 播放头
  if (playheadPos.value > 0) {
    const px = selX0 + (selX1 - selX0) * playheadPos.value
    g.strokeStyle = '#ef4444'
    g.lineWidth = 2
    g.beginPath(); g.moveTo(px, 0); g.lineTo(px, h); g.stroke()
  }
}

// ---------- 试听（用户手势回调内创建 AudioContext） ----------
const playSelection = () => {
  if (!audioBuffer || isPlaying.value) return
  playCtx = new AudioContext()
  const src = playCtx.createBufferSource()
  src.buffer = audioBuffer
  src.connect(playCtx.destination)
  const startT = startSec.value
  const len = Math.max(0.05, endSec.value - startSec.value)
  const t0 = playCtx.currentTime
  src.start(0, startT, len)
  const tick = () => {
    if (!isPlaying.value || !playCtx) return
    const p = Math.min(1, (playCtx.currentTime - t0) / len)
    playheadPos.value = p
    drawWave()
    if (p >= 1) { stopPlayback(); return }
    playRaf = requestAnimationFrame(tick)
  }
  src.onended = () => { if (isPlaying.value) stopPlayback() }
  isPlaying.value = true
  playRaf = requestAnimationFrame(tick)
}

const stopPlayback = () => {
  isPlaying.value = false
  if (playRaf) { cancelAnimationFrame(playRaf); playRaf = null }
  if (playCtx) { try { playCtx.close() } catch (err) {} playCtx = null }
  playheadPos.value = 0
  drawWave()
}

// ---------- 导出 ----------
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const exportWav = () => {
  if (!audioBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = ''
  try {
    const chans = []
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      chans.push(sliceBufferChannels(audioBuffer.getChannelData(c), audioBuffer.sampleRate, startSec.value, endSec.value))
    }
    const bytes = encodeWavFromChannels(chans, audioBuffer.sampleRate)
    const blob = new Blob([bytes], { type: 'audio/wav' })
    triggerDownload(blob, 'trimmed.wav')
    exportStatus.value = `WAV 导出成功（${formatSize(blob.size)}），文件未离开浏览器`
  } catch (err) {
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}

// OfflineAudioContext 渲染选区 → 实时播放进 MediaStreamDestination → MediaRecorder(audio/mp4) 录制 m4r
const recordBufferToBlob = (buffer, mimeType, onProgress) => new Promise((resolve, reject) => {
  let ctx = null
  try {
    ctx = new AudioContext()
  } catch (err) {
    reject(new Error('无法创建音频上下文'))
    return
  }
  const dest = ctx.createMediaStreamDestination()
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(dest)
  const chunks = []
  let recorder = null
  try {
    recorder = new MediaRecorder(dest.stream, { mimeType })
  } catch (err) {
    ctx.close()
    reject(new Error('当前浏览器不支持该录制格式'))
    return
  }
  const total = Math.max(0.1, buffer.duration)
  const iv = onProgress ? setInterval(() => onProgress(Math.min(1, ctx.currentTime / total)), 100) : null
  recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data) }
  recorder.onerror = () => {
    if (iv) clearInterval(iv)
    try { ctx.close() } catch (err) {}
    reject(new Error('录制失败'))
  }
  recorder.onstop = () => {
    if (iv) clearInterval(iv)
    resolve(new Blob(chunks, { type: mimeType.split(';')[0] }))
    setTimeout(() => { try { ctx.close() } catch (err) {} }, 300)
  }
  src.onended = () => {
    setTimeout(() => { if (recorder && recorder.state !== 'inactive') recorder.stop() }, 150)
  }
  recorder.start(200)
  src.start()
})

const exportM4r = async () => {
  if (!audioBuffer || isExporting.value || !m4rSupported.value) return
  isExporting.value = true
  exportStatus.value = '正在渲染选区并录制 m4r（约需选区时长）...'
  try {
    const startS = startSec.value
    const endS = endSec.value
    const len = Math.max(1, Math.floor((endS - startS) * audioBuffer.sampleRate))
    const offline = new OfflineAudioContext(audioBuffer.numberOfChannels, len, audioBuffer.sampleRate)
    const src = offline.createBufferSource()
    src.buffer = audioBuffer
    src.connect(offline.destination)
    src.start(0, startS, endS - startS)
    const rendered = await offline.startRendering()
    const blob = await recordBufferToBlob(rendered, 'audio/mp4')
    triggerDownload(blob, 'ringtone.m4r')
    exportStatus.value = `m4r 导出成功（${formatSize(blob.size)}），可在 iPhone 上设为铃声${ringtoneWarn.value ? '，注意选区超过 40 秒' : ''}`
  } catch (err) {
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}
</script>
